import { useState } from 'react';
import { Search, Bookmark, ArrowRight, CheckCircle2, TrendingUp, ShieldAlert, Sparkles, Filter, Barcode, Loader2, AlertCircle, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface ResearchCategoryItem {
  id: string;
  name: string;
  category: string;
  marketPrice: number;
  estimatedCost: number;
  estimatedMargin: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  returnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunityScore: number;
  demandVolume: string;
  dimensions: { length: number; width: number; height: number; weight: number };
}

const CATEGORY_BENCHMARKS: ResearchCategoryItem[] = [
  {
    id: 'cmh-01',
    name: 'Car Mobile Holder Magnetic Mount',
    category: 'Car Accessories',
    marketPrice: 399,
    estimatedCost: 120,
    estimatedMargin: 24.5,
    competition: 'MEDIUM',
    returnRisk: 'LOW',
    opportunityScore: 84,
    demandVolume: 'High (45k searches/mo)',
    dimensions: { length: 15, width: 10, height: 8, weight: 320 }
  },
  {
    id: 'bdo-02',
    name: 'Bamboo Drawer Organizer Expandable',
    category: 'Kitchen & Storage',
    marketPrice: 699,
    estimatedCost: 210,
    estimatedMargin: 31.8,
    competition: 'LOW',
    returnRisk: 'LOW',
    opportunityScore: 91,
    demandVolume: 'High (32k searches/mo)',
    dimensions: { length: 35, width: 25, height: 6, weight: 650 }
  },
  {
    id: 'bsp-03',
    name: 'Silicone Baby Feeding Set with Suction',
    category: 'Baby Products',
    marketPrice: 549,
    estimatedCost: 140,
    estimatedMargin: 28.2,
    competition: 'MEDIUM',
    returnRisk: 'LOW',
    opportunityScore: 87,
    demandVolume: 'Medium (22k searches/mo)',
    dimensions: { length: 20, width: 18, height: 8, weight: 280 }
  },
  {
    id: 'mfc-04',
    name: 'Microfiber Floor Cleaning Spray Mop',
    category: 'Cleaning',
    marketPrice: 899,
    estimatedCost: 310,
    estimatedMargin: 21.0,
    competition: 'HIGH',
    returnRisk: 'MEDIUM',
    opportunityScore: 73,
    demandVolume: 'Very High (68k searches/mo)',
    dimensions: { length: 60, width: 15, height: 10, weight: 890 }
  },
  {
    id: 'cos-05',
    name: 'Foldable Wardrobe Storage Box with Steel Frame',
    category: 'Storage',
    marketPrice: 499,
    estimatedCost: 155,
    estimatedMargin: 26.4,
    competition: 'MEDIUM',
    returnRisk: 'MEDIUM',
    opportunityScore: 79,
    demandVolume: 'High (52k searches/mo)',
    dimensions: { length: 40, width: 30, height: 5, weight: 520 }
  },
  {
    id: 'led-06',
    name: 'Motion Sensor Wireless Night Light 3-Pack',
    category: 'Home & Living',
    marketPrice: 449,
    estimatedCost: 115,
    estimatedMargin: 33.6,
    competition: 'LOW',
    returnRisk: 'LOW',
    opportunityScore: 93,
    demandVolume: 'High (41k searches/mo)',
    dimensions: { length: 12, width: 12, height: 8, weight: 260 }
  }
];

export default function Research() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Barcode Lookup State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<any | null>(null);
  const [barcodeSearched, setBarcodeSearched] = useState(false);

  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;
    try {
      setBarcodeLoading(true);
      setBarcodeSearched(true);
      const res = await fetch(`/api/products/lookup-barcode/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success) {
        setBarcodeResult(json.data);
      } else {
        setBarcodeResult({ found: false, message: json.message || 'Lookup failed' });
      }
    } catch (err: any) {
      setBarcodeResult({ found: false, message: err.message || 'Network error during lookup' });
    } finally {
      setBarcodeLoading(false);
    }
  };

  const categories = ['ALL', 'Car Accessories', 'Kitchen & Storage', 'Baby Products', 'Cleaning', 'Storage', 'Home & Living'];

  const filtered = CATEGORY_BENCHMARKS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveToPipeline = async (item: ResearchCategoryItem) => {
    if (!token) return;
    try {
      setSavingId(item.id);
      const res = await fetch('/api/saved-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: item.id,
          productName: item.name,
          status: 'Researching',
          notes: `Category: ${item.category}. Demand: ${item.demandVolume}`,
          assumptions: {
            productCost: item.estimatedCost,
            shipping: 60,
            advertisingPercent: 6,
            returnPercent: item.returnRisk === 'HIGH' ? 14 : item.returnRisk === 'MEDIUM' ? 8 : 4
          },
          calculatedScore: item.opportunityScore,
          calculatedMargin: item.estimatedMargin
        })
      });
      const json = await res.json();
      if (json.success) {
        setSavedIds((prev) => [...prev, item.id]);
      }
    } catch (err) {
      console.error('Failed to save to pipeline', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleAnalyzeInDepth = (item: ResearchCategoryItem) => {
    navigate('/analyzer', {
      state: {
        category: item.category,
        sellingPrice: item.marketPrice,
        productCost: item.estimatedCost,
        weight: item.dimensions.weight,
        length: item.dimensions.length,
        width: item.dimensions.width,
        height: item.dimensions.height,
        competitionScore: item.competition,
        returnRisk: item.returnRisk
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Product Research Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover high-demand marketplace niches, unit economics benchmarks, and opportunity scores before committing capital.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category or product..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Barcode & Registry Enrichment Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="w-5 h-5 text-indigo-600" />
              Barcode Registry Enrichment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrich product metadata from official registries (Open Products Facts & Open Food Facts). External data never overwrites entered costs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Quick Test:</span>
            <button
              type="button"
              onClick={() => { setBarcodeInput('737628064502'); handleBarcodeLookup('737628064502'); }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-mono"
            >
              737628064502
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter 8-14 digit Barcode, GTIN, EAN, or UPC..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-slate-50/50"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBarcodeLookup(); }}
            />
          </div>
          <button
            type="button"
            onClick={() => handleBarcodeLookup()}
            disabled={barcodeLoading || !barcodeInput.trim()}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {barcodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {barcodeLoading ? 'Enriching...' : 'Lookup Barcode'}
          </button>
        </div>

        {/* Barcode Result Display */}
        {barcodeSearched && barcodeResult && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {barcodeResult.found ? (
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {barcodeResult.imageUrl ? (
                    <img src={barcodeResult.imageUrl} alt={barcodeResult.name} className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200 p-1" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <PackageCheck className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {barcodeResult.source}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Confidence: {barcodeResult.confidence}
                      </span>
                      {barcodeResult.isCached && (
                        <span className="text-[10px] text-slate-400">(Cached)</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{barcodeResult.name || 'Unnamed Product'}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Brand: <span className="font-semibold text-slate-800">{barcodeResult.brand || 'Unbranded'}</span> • Category: <span className="font-semibold text-slate-800">{barcodeResult.category || 'General'}</span> {barcodeResult.weightGrams ? `• Weight: ${barcodeResult.weightGrams}g` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      navigate('/analyzer', {
                        state: {
                          productName: barcodeResult.name,
                          category: barcodeResult.category || 'General',
                          weight: barcodeResult.weightGrams || 300,
                          sellingPrice: 499,
                          productCost: 150
                        }
                      });
                    }}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Analyze Economics <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-600 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block">Product Not Found</span>
                  <span>{barcodeResult.message || 'Barcode does not exist in Open Products Facts or Open Food Facts registry.'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shadow-sm",
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-indigo-100"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            )}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Benchmark Research Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const isSaved = savedIds.includes(item.id);
          const isSaving = savingId === item.id;

          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.demandVolume}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
                      item.opportunityScore >= 85
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                    )}>
                      Score: {item.opportunityScore}/100
                    </span>
                  </div>
                </div>

                {/* Economics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Market Price</span>
                    <span className="text-sm font-bold text-slate-900">₹{item.marketPrice}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Est. Cost</span>
                    <span className="text-sm font-bold text-slate-700">₹{item.estimatedCost}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">Net Margin</span>
                    <span className="text-sm font-bold text-emerald-600">~{item.estimatedMargin}%</span>
                  </div>
                </div>

                {/* Risk & Competition Indicators */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>Competition:</span>
                    <span className={cn(
                      "font-semibold",
                      item.competition === 'LOW' ? "text-emerald-600" :
                      item.competition === 'MEDIUM' ? "text-amber-600" : "text-rose-600"
                    )}>
                      {item.competition}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>Return Risk:</span>
                    <span className={cn(
                      "font-semibold",
                      item.returnRisk === 'LOW' ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {item.returnRisk}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleSaveToPipeline(item)}
                  disabled={isSaved || isSaving}
                  className={cn(
                    "text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors shadow-sm",
                    isSaved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      {isSaving ? 'Saving...' : 'Save Pipeline'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAnalyzeInDepth(item)}
                  className="text-xs font-semibold inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Analyze in Depth <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
