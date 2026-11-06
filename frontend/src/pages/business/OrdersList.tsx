import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrders } from '../../services/orderService';
import { getReconciliationSummary, runReconciliation } from '../../services/reconciliationService';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search, 
  Filter,
  MessageSquare,
  X
} from 'lucide-react';
import { CommentsPanel } from '../../components/shared/CommentsPanel';

export default function OrdersList() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningSync, setRunningSync] = useState(false);
  const [activeCommentOrder, setActiveCommentOrder] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const [ordersData, summaryData] = await Promise.all([
        getOrders(token),
        getReconciliationSummary(token)
      ]);
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRunReconciliation = async () => {
    if (!token) return;
    try {
      setRunningSync(true);
      await runReconciliation(token);
      await loadData();
    } catch (error) {
      console.error('Reconciliation failed', error);
    } finally {
      setRunningSync(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Reconciled</span>;
      case 'Variance':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1" /> Variance</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Profitability</h1>
          <p className="text-slate-500 mt-1">Expected vs Actual profitability across all marketplaces</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunReconciliation}
            disabled={runningSync}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {runningSync ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Run Reconciliation
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-medium text-slate-500">Total Orders</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-medium text-emerald-600">Reconciled</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.reconciledOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-medium text-amber-600">Pending Matching</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-medium text-red-600">Unmatched Transactions</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.unmatchedTransactions}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or SKU..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Expected Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actual Profit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Comments</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{order.marketplaceOrderId}</span>
                        <div className="flex items-center mt-1 space-x-2 text-xs text-slate-500">
                          <span className="capitalize px-1.5 py-0.5 bg-slate-100 rounded">{order.marketplaceCode}</span>
                          <span>•</span>
                          <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(order.expectedProfit)}</span>
                        {order.expectedMargin && (
                          <span className="text-xs text-slate-500">{order.expectedMargin.toFixed(1)}% margin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900">
                          {order.actualProfit !== undefined ? formatCurrency(order.actualProfit) : '-'}
                        </span>
                        {order.actualMargin !== undefined && (
                          <span className="text-xs text-slate-500">{order.actualMargin.toFixed(1)}% margin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {order.profitVariance !== undefined ? (
                        <div className="flex items-center justify-end space-x-1">
                          {order.profitVariance > 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          ) : order.profitVariance < 0 ? (
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                          ) : null}
                          <span className={`text-sm font-medium ${order.profitVariance > 0 ? 'text-emerald-600' : order.profitVariance < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {order.profitVariance > 0 ? '+' : ''}{formatCurrency(order.profitVariance)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        {getStatusBadge(order.reconciliationStatus)}
                        {order.settlementStatus === 'Settled' && (
                          <span className="text-xs text-slate-400">Settled</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setActiveCommentOrder(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
                        title="View order comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Discuss
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Comments Panel */}
      {activeCommentOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Order Discussions</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{activeCommentOrder.marketplaceOrderId}</p>
              </div>
              <button
                onClick={() => setActiveCommentOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CommentsPanel entityType="ORDER" entityId={activeCommentOrder._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
