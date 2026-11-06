import { useState, useEffect } from 'react';
import { Database, Search, Package, Loader2, X, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProductDatabase() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', supplier: '', purchasePrice: 0, 
    packagingCost: 0, inboundShipping: 0, labelCost: 0, inspectionCost: 0, 
    otherProcurementCost: 0, weight: 0, gstRate: 18
  });

  const fetchProducts = async (search = '') => {
    if (!token) return;
    try {
      setLoading(true);
      const url = search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setProducts(json.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSuppliers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setSuppliers(json.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); fetchSuppliers(); }, [token]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProducts(searchTerm); };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.name.trim() || !formData.sku.trim()) return;
    const defaultLandedCost = Number(formData.purchasePrice) + Number(formData.packagingCost) + Number(formData.inboundShipping) + Number(formData.labelCost) + Number(formData.inspectionCost) + Number(formData.otherProcurementCost);
    try {
      setSubmitting(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, defaultLandedCost, dimensions: { length: 0, width: 0, height: 0 } })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setFormData({ name: '', sku: '', category: '', supplier: '', purchasePrice: 0, packagingCost: 0, inboundShipping: 0, labelCost: 0, inspectionCost: 0, otherProcurementCost: 0, weight: 0, gstRate: 18 });
        await fetchProducts();
      } else { alert(json.message || 'Failed to create product'); }
    } catch (err: any) { alert(err.message || 'Failed to create product'); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1><p className="mt-1 text-sm text-slate-500">Manage your product catalog, sourcing costs, and suppliers.</p></div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search SKU or name..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white shadow-sm" /></div>
            <button type="submit" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">Search</button>
          </form>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <Database className="w-16 h-16 text-slate-300 mb-4" /><h3 className="text-lg font-medium text-slate-900 mb-2">No Products in Catalog</h3><p className="text-slate-500 max-w-sm mb-6">Your organization has not registered any catalog products yet. Add products to auto-calculate profitability.</p>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Create First Product</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th><th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Landed Cost</th><th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight (g)</th><th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th></tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.map((p) => {
                  const landed = p.costSettings?.landedCost || p.defaultLandedCost || p.costSettings?.purchasePrice || p.purchasePrice || 0;
                  const weight = p.weight || (p.dimensions?.deadWeightKg ? Math.round(p.dimensions.deadWeightKg * 1000) : '-');
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100"><Package className="w-4 h-4 text-indigo-600" /></div><div><div className="text-sm font-semibold text-slate-900">{p.name || p.title || 'Product'}</div><div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</div></div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{p.category || 'General'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">₹{Number(landed).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{weight}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{p.status || 'Active'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm"><button onClick={() => navigate('/profit-calculator')} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">Calculate Profit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100"><h3 className="text-lg font-semibold text-slate-900">Create New Product</h3><button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Product Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">SKU *</label><input type="text" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Category *</label><input type="text" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Supplier</label><select value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500"><option value="">Select a Supplier...</option>{suppliers.map(s => (<option key={s._id} value={s._id}>{s.companyName}</option>))}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Purchase Price (₹) *</label><input type="number" required min="0" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Packaging Cost (₹)</label><input type="number" min="0" value={formData.packagingCost} onChange={(e) => setFormData({ ...formData, packagingCost: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Inbound Freight (₹)</label><input type="number" min="0" value={formData.inboundShipping} onChange={(e) => setFormData({ ...formData, inboundShipping: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Weight (grams)</label><input type="number" min="0" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">GST Rate (%)</label><input type="number" min="0" value={formData.gstRate} onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Est. Landed Cost</label><div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900">₹{(Number(formData.purchasePrice) + Number(formData.packagingCost) + Number(formData.inboundShipping) + Number(formData.labelCost) + Number(formData.inspectionCost) + Number(formData.otherProcurementCost)).toFixed(2)}</div></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? 'Creating...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
