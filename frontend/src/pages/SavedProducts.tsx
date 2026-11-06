import { useState, useEffect } from 'react';
import { Bookmark, Search, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface SavedProductItem {
  _id: string;
  productId: any;
  productName?: string;
  status: 'Researching' | 'Potential' | 'Sourcing' | 'Testing' | 'Launched' | 'Rejected';
  notes?: string;
  assumptions?: {
    productCost: number;
    shipping: number;
    advertisingPercent: number;
    returnPercent: number;
  };
  calculatedScore?: number;
  calculatedMargin?: number;
  createdAt: string;
}

export default function SavedProducts() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [savedProducts, setSavedProducts] = useState<SavedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSavedProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/saved-products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedProducts(json.data);
      }
    } catch (err) {
      console.error('Failed to load saved products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProducts();
  }, [token]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/saved-products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setSavedProducts((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus as any } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this product from your saved pipeline?')) return;
    try {
      const res = await fetch(`/api/saved-products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSavedProducts((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete saved product:', err);
    }
  };

  const filtered = savedProducts.filter((item) => {
    const name = item.productName || (typeof item.productId === 'string' ? item.productId : 'Saved Item');
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saved Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product research pipeline and candidate items.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved products..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="Researching">Researching</option>
            <option value="Potential">Potential</option>
            <option value="Sourcing">Sourcing</option>
            <option value="Testing">Testing</option>
            <option value="Launched">Launched</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Saved Products Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No saved products match your search or filter criteria.'
              : 'You have not added any products to your research pipeline yet. Use the Product Analyzer or Opportunity Finder to save candidate products.'}
          </p>
          <button
            onClick={() => navigate('/analyzer')}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Launch Product Analyzer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Cost</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Margin</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Added</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((product) => {
                  const displayName = product.productName || (typeof product.productId === 'string' ? product.productId : 'Saved Item');
                  const cost = product.assumptions?.productCost != null ? `₹${product.assumptions.productCost}` : '—';
                  const margin = product.calculatedMargin != null ? `${product.calculatedMargin.toFixed(1)}%` : '—';
                  const score = product.calculatedScore != null ? Math.round(product.calculatedScore) : null;
                  const dateStr = product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—';

                  return (
                    <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                            <Bookmark className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{displayName}</div>
                            {product.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{product.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={product.status}
                          onChange={(e) => handleStatusChange(product._id, e.target.value)}
                          className={cn(
                            "text-xs font-semibold rounded-full px-2.5 py-1 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer",
                            product.status === 'Sourcing' ? "bg-amber-100 text-amber-800" :
                            product.status === 'Potential' ? "bg-emerald-100 text-emerald-800" :
                            product.status === 'Launched' ? "bg-teal-100 text-teal-800" :
                            product.status === 'Rejected' ? "bg-rose-100 text-rose-800" :
                            "bg-blue-100 text-blue-800"
                          )}
                        >
                          <option value="Researching">Researching</option>
                          <option value="Potential">Potential</option>
                          <option value="Sourcing">Sourcing</option>
                          <option value="Testing">Testing</option>
                          <option value="Launched">Launched</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{cost}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">{margin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {score != null ? (
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                            score >= 80 ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" :
                            score >= 60 ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20" :
                            "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          )}>
                            {score}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{dateStr}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(product._id)}
                          title="Remove saved product"
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
  );
}
