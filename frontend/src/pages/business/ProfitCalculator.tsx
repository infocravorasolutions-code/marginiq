import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculateProfitability, 
  calculatePricing, 
  compareMarketplaces,
  type ProfitabilityRequest 
} from '../../services/profitabilityService';
import { searchProducts, getProductDetails, type Product } from '../../services/productService';
import { 
  Calculator, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, RefreshCw, Search, Package 
} from 'lucide-react';

export default function ProfitCalculator() {
  const { token } = useAuth();
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calculate' | 'compare'>('calculate');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Typeahead States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Source Indicators
  const [costSource, setCostSource] = useState<'Inventory' | 'Manual Override'>('Manual Override');
  const [costingMethod, setCostingMethod] = useState<'Default' | 'Latest Batch'>('Default');

  // Form State
  const [formData, setFormData] = useState<ProfitabilityRequest & { isGstRegistered: boolean; productCostIncludesGst: boolean }>({
    marketplaceCode: 'amazon',
    sellingPrice: 999,
    productLandedCost: 300,
    productGstPercent: 18,
    isGstRegistered: true,
    productCostIncludesGst: true,
    weight: 500,
    length: 10,
    width: 10,
    height: 10,
    packagingCost: 15,
    fulfilmentType: 'Easy Ship',
    zone: 'National',
    paymentMethod: 'Prepaid',
    origin: 'Delhi',
    destination: 'Mumbai',
    rtoPercent: 5,
    customerReturnPercent: 10,
    damagePercent: 2,
    reimbursementPercent: 40,
    advertisingPercent: 5,
    couponPercent: 0,
    couponFixed: 0,
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (!token) return;
      setIsSearching(true);
      try {
        const res = await searchProducts(token, searchQuery);
        setSearchResults(res);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const handleSelectProduct = async (prod: Product) => {
    setShowDropdown(false);
    setSearchQuery(prod.name);
    setCostSource('Inventory');
    setCostingMethod('Default');
    
    if (token) {
      try {
        const fullProd = await getProductDetails(token, prod._id);
        setSelectedProduct(fullProd);
        
        setFormData(prev => ({
          ...prev,
          productLandedCost: fullProd.defaultLandedCost || fullProd.purchasePrice || 0,
          weight: fullProd.weight || prev.weight,
          length: fullProd.dimensions?.length || prev.length,
          width: fullProd.dimensions?.width || prev.width,
          height: fullProd.dimensions?.height || prev.height,
          productGstPercent: fullProd.gstRate ?? prev.productGstPercent,
          packagingCost: fullProd.packagingCost || prev.packagingCost
        }));
      } catch (err) {
        console.error("Failed to fetch product details", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = Number(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    if (name === 'productLandedCost' || name === 'weight' || name === 'productGstPercent') {
      setCostSource('Manual Override');
    }
  };

  const handleCostingMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const method = e.target.value as 'Default' | 'Latest Batch';
    setCostingMethod(method);
    
    if (selectedProduct && selectedProduct.batches && selectedProduct.batches.length > 0) {
      if (method === 'Latest Batch') {
        const latestBatch = selectedProduct.batches[0];
        setFormData(prev => ({ ...prev, productLandedCost: latestBatch.landedCost }));
        setCostSource('Inventory');
      } else {
        setFormData(prev => ({ ...prev, productLandedCost: selectedProduct.defaultLandedCost || selectedProduct.purchasePrice || 0 }));
        setCostSource('Inventory');
      }
    }
  };

  const handleQuickPrice = (delta: number) => {
    setFormData(prev => ({ ...prev, sellingPrice: Math.max(0, prev.sellingPrice + delta) }));
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'calculate') {
        const res = await calculateProfitability(token, formData);
        setResult(res);

        // Fetch pricing context
        const pRes = await calculatePricing(token, formData);
        setPricingResult(pRes);
      } else {
        const { marketplaceCode, sellingPrice, ...basePayload } = formData;
        // In comparison, we need selling price but not marketplace code
        const cmpPayload = { ...basePayload, sellingPrice };
        const cmpRes = await compareMarketplaces(token, cmpPayload as any);
        setComparisonResult(cmpRes);
      }
    } catch (err: any) {
      setError(err.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    if (token) {
      handleCalculate();
    }
  }, [token, activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Profit Calculator
          </h1>
          <p className="text-slate-500 mt-1">Calculate your true marketplace profitability</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('calculate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'calculate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Calculate Profit
          </button>
          <button 
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'compare' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Compare Marketplaces
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Calculation Error</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Product Search Integration */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative" ref={searchRef}>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Product Integration</h3>
            <p className="text-sm text-slate-500">Search your inventory to auto-fill costs and dimensions</p>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" /> : <Search className="w-5 h-5 text-slate-400" />}
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />
          
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
              {searchResults.map((prod) => (
                <div
                  key={prod._id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-50 transition-colors"
                  onClick={() => handleSelectProduct(prod)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 block truncate">{prod.name}</span>
                    <span className="text-slate-500 text-xs">SKU: {prod.sku}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUTS SIDE */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleCalculate} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Parameters</h2>
              {loading && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
            </div>
            
            <div className="p-5 space-y-5">
              
              {activeTab === 'calculate' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marketplace</label>
                  <select 
                    name="marketplaceCode" 
                    value={formData.marketplaceCode} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="amazon">Amazon India</option>
                    <option value="flipkart">Flipkart</option>
                    <option value="meesho">Meesho</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    name="sellingPrice" 
                    value={formData.sellingPrice} 
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-indigo-900"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => handleQuickPrice(-50)} className="flex-1 text-xs py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">-50</button>
                  <button type="button" onClick={() => handleQuickPrice(-10)} className="flex-1 text-xs py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">-10</button>
                  <button type="button" onClick={() => handleQuickPrice(10)} className="flex-1 text-xs py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">+10</button>
                  <button type="button" onClick={() => handleQuickPrice(50)} className="flex-1 text-xs py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">+50</button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Landed Cost (₹)</label>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${costSource === 'Inventory' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                    {costSource}
                  </span>
                </div>
                <input 
                  type="number" 
                  name="productLandedCost" 
                  value={formData.productLandedCost} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {selectedProduct && selectedProduct.batches && selectedProduct.batches.length > 0 && (
                  <div className="mt-2">
                    <select 
                      value={costingMethod}
                      onChange={handleCostingMethodChange}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded text-slate-600 bg-slate-50"
                    >
                      <option value="Default">Weighted Average / Default</option>
                      <option value="Latest Batch">Latest Batch ({selectedProduct.batches[0].batchNumber})</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Weight (g)</label>
                  </div>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">GST (%)</label>
                  </div>
                  <input type="number" name="productGstPercent" value={formData.productGstPercent} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Advanced Toggle */}
              <div>
                <button 
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-sm text-indigo-600 font-medium py-2 border-t border-slate-100"
                >
                  Advanced Assumptions & Taxes
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showAdvanced && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2">
                    
                    {/* GST Configuration */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tax Configuration</h4>
                      
                      <div className="flex items-center">
                        <input
                          id="isGstRegistered"
                          name="isGstRegistered"
                          type="checkbox"
                          checked={formData.isGstRegistered}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isGstRegistered" className="ml-2 block text-sm text-gray-900">
                          GST Registered (Can claim ITC)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="productCostIncludesGst"
                          name="productCostIncludesGst"
                          type="checkbox"
                          checked={formData.productCostIncludesGst}
                          onChange={handleChange}
                          disabled={!formData.isGstRegistered}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <label htmlFor="productCostIncludesGst" className={`ml-2 block text-sm ${formData.isGstRegistered ? 'text-gray-900' : 'text-gray-400'}`}>
                          Landed Cost includes GST
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Fulfilment Type</label>
                      <select name="fulfilmentType" value={formData.fulfilmentType} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg">
                        <option value="FBA">FBA (Amazon) / FBF (Flipkart)</option>
                        <option value="Easy Ship">Easy Ship</option>
                        <option value="Self Ship">Self Ship</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Zone</label>
                        <select name="zone" value={formData.zone} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg">
                          <option value="Local">Local</option>
                          <option value="Zonal">Zonal</option>
                          <option value="National">National</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Payment</label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg">
                          <option value="Prepaid">Prepaid</option>
                          <option value="COD">COD</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">RTO Risk (%)</label>
                        <input type="number" name="rtoPercent" value={formData.rtoPercent} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Return Risk (%)</label>
                        <input type="number" name="customerReturnPercent" value={formData.customerReturnPercent} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ad Spend (%)</label>
                        <input type="number" name="advertisingPercent" value={formData.advertisingPercent} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Packaging (₹)</label>
                        <input type="number" name="packagingCost" value={formData.packagingCost} onChange={handleChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Calculating...' : 'Calculate Profit'}
              </button>

            </div>
          </form>
        </div>

        {/* RESULTS SIDE */}
        <div className="lg:col-span-8 space-y-6">
          
          {loading && !result && !comparisonResult && (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <div className="flex flex-col items-center text-slate-500">
                <RefreshCw className="w-8 h-8 mb-4 animate-spin text-indigo-400" />
                <p>Running calculation engines...</p>
              </div>
            </div>
          )}

          {!loading && activeTab === 'calculate' && result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Top KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <div className="text-sm font-medium text-slate-500 mb-1">Selling Price</div>
                  <div className="text-2xl font-bold text-slate-900">₹{result.sellingPrice.toFixed(2)}</div>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <div className="text-sm font-medium text-slate-500 mb-1">Total Cash Out</div>
                  <div className="text-2xl font-bold text-slate-900">₹{result.totalCost.toFixed(2)}</div>
                </div>
                <div className={`border p-5 rounded-xl shadow-sm ${result.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-sm font-medium mb-1 ${result.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>True Profit</div>
                  <div className={`text-2xl font-bold ${result.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    ₹{result.netProfit.toFixed(2)}
                  </div>
                </div>
                <div className={`border p-5 rounded-xl shadow-sm ${result.netMargin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-sm font-medium mb-1 ${result.netMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Margin</div>
                  <div className={`text-2xl font-bold ${result.netMargin >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {result.netMargin.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cost Breakdown */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Cost Breakdown</h3>
                  </div>
                  <div className="p-0 flex-1">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-medium flex items-center gap-2">
                            Product Landed Cost
                            {formData.productCostIncludesGst && formData.isGstRegistered && (
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Ex-GST</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            ₹{(formData.productCostIncludesGst && formData.isGstRegistered 
                                ? result.productLandedCost - result.tax.productPurchaseIct 
                                : result.productLandedCost).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 w-16">{((result.productLandedCost / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 text-slate-600 font-medium flex items-center gap-1">
                            Marketplace Fees
                            <div className="relative cursor-help" title={result.fees.components.map((c: any) => `${c.name}: ₹${c.amount.toFixed(2)}`).join('\n')}>
                              <Info className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.fees.totalMarketplaceFees.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.fees.totalMarketplaceFees / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 text-slate-600 font-medium flex items-center gap-1">
                            Shipping + Packaging
                            <div className="relative cursor-help" title={`Forward: ₹${result.shipping.totalShippingCost}\nPackaging: ₹${result.shipping.packagingCost}`}>
                              <Info className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.shipping.totalLandedShippingCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.shipping.totalLandedShippingCost / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-medium">Advertising</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.advertising.totalAdvertisingCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.advertising.totalAdvertisingCost / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-medium text-amber-700 flex items-center gap-1">
                            Returns & RTO Risk
                            <div className="relative cursor-help" title={`Customer Return Risk: ₹${result.returns.statisticalCustomerReturnCost.toFixed(2)}\nRTO Risk: ₹${result.returns.statisticalRtoCost.toFixed(2)}`}>
                              <Info className="w-3 h-3 text-amber-400" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.returns.totalStatisticalReturnCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.returns.totalStatisticalReturnCost / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-600 font-medium text-amber-700">Damage Risk</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.damage.statisticalDamageLoss.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.damage.statisticalDamageLoss / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 text-slate-600 font-medium flex items-center gap-1">
                            Net GST Payable
                            <div className="relative cursor-help" title={`Output Tax: ₹${result.tax.totalGstOutput.toFixed(2)}\nTotal ITC: ₹${result.tax.totalGstInput.toFixed(2)}`}>
                              <Info className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">₹{result.tax.netGstPayable.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{((result.tax.netGstPayable / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="px-4 py-4 text-slate-800 font-bold">Total Cash Out</td>
                          <td className="px-4 py-4 text-right font-bold text-slate-900 text-lg">₹{result.totalCost.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{((result.totalCost / result.sellingPrice) * 100).toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Price Analysis & Traceability */}
                <div className="space-y-6 flex flex-col">
                  {pricingResult && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Price Analysis</h3>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <div className="font-medium text-slate-800">Break-even Price</div>
                            <div className="text-xs text-slate-500 mt-0.5">Minimum to avoid a loss</div>
                          </div>
                          <div className="font-bold text-slate-900 text-lg">₹{pricingResult.breakEvenPrice}</div>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <div className="font-medium text-indigo-700">Recommended Price</div>
                            <div className="text-xs text-indigo-500/70 mt-0.5">For ~20% healthy margin</div>
                          </div>
                          <div className="font-bold text-indigo-700 text-lg">₹{pricingResult.targetPrice || pricingResult.conservativePrice}</div>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <div>
                            <div className="font-medium text-amber-700">Aggressive Price</div>
                            <div className="text-xs text-amber-600/70 mt-0.5">For ~10% competitive margin</div>
                          </div>
                          <div className="font-bold text-amber-700 text-lg">₹{pricingResult.aggressivePrice}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning Box */}
                  {result.fees.components.some((c: any) => c.source?.includes('Missing')) && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800">Missing Fee Rule</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          MarginIQ could not find a verified marketplace rule for this combination. 
                          Some fees are estimated as ₹0. Check advanced settings.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* COMPARE TAB */}
          {!loading && activeTab === 'compare' && comparisonResult && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-800">Marketplace</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-800">Selling Price</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-800">Fees</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-800">Shipping</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-800">Profit</th>
                      <th className="px-6 py-4 text-right font-semibold text-slate-800">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonResult.map((c: any, index: number) => {
                      if (!c.success) return (
                        <tr key={index} className="bg-red-50/50">
                          <td className="px-6 py-4 font-medium text-slate-900 uppercase">{c.marketplaceCode}</td>
                          <td colSpan={5} className="px-6 py-4 text-red-600 text-sm">Error: {c.error}</td>
                        </tr>
                      );
                      
                      const r = c.result;
                      const isWinner = Math.max(...comparisonResult.filter((x:any)=>x.success).map((x:any) => x.result.netProfit)) === r.netProfit;

                      return (
                        <tr key={index} className={isWinner ? 'bg-indigo-50/30' : ''}>
                          <td className="px-6 py-4 font-medium text-slate-900 uppercase flex items-center gap-2">
                            {c.marketplaceCode}
                            {isWinner && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">Best</span>}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">₹{r.sellingPrice.toFixed(0)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">₹{r.fees.totalMarketplaceFees.toFixed(0)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">₹{r.shipping.totalLandedShippingCost.toFixed(0)}</td>
                          <td className={`px-6 py-4 text-right font-bold ${r.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{r.netProfit.toFixed(0)}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${r.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {r.netMargin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
