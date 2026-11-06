import { useState, useEffect } from 'react';
import { Eye, Bell, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface WatchlistItem {
  _id: string;
  productId: any;
  productName?: string;
  baselineMetrics: {
    price: number;
    competitionScore: number;
    opportunityScore: number;
    reviewCount: number;
  };
  notificationsEnabled: boolean;
  createdAt: string;
}

export default function Watchlist() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWatchlist(json.data);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this product from your watchlist?')) return;
    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setWatchlist((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const filtered = watchlist.filter((item) => {
    const name = item.productName || (typeof item.productId === 'string' ? item.productId : 'Watched Item');
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Watchlist</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor priority products for price drops, competitor changes, and opportunity shifts.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search watchlist..."
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-60 focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Products in Watchlist</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            {searchTerm
              ? 'No watchlist items match your search term.'
              : 'You have not added any products to your watchlist yet. Watch products to monitor price trends and receive margin alert notifications.'}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Browse Product Database <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Price</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Opp. Score</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviews Tracked</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Alerts</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Added On</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((item) => {
                  const displayName = item.productName || (typeof item.productId === 'string' ? item.productId : 'Watched Item');
                  const price = item.baselineMetrics?.price != null && item.baselineMetrics.price > 0 ? `₹${item.baselineMetrics.price}` : '—';
                  const oppScore = item.baselineMetrics?.opportunityScore != null ? Math.round(item.baselineMetrics.opportunityScore) : '—';
                  const reviews = item.baselineMetrics?.reviewCount != null ? item.baselineMetrics.reviewCount : '—';
                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—';

                  return (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                            <Eye className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{displayName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">{price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">{oppScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{reviews}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.notificationsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <Bell className="w-3 h-3" />
                          {item.notificationsEnabled ? 'Active' : 'Muted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{dateStr}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Remove from watchlist"
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
