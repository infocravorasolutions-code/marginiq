import { ArrowUpRight, ArrowDownRight, PackageSearch, Target, TrendingUp, BarChart3, Loader2, AlertTriangle, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CommentsPanel } from '../components/shared/CommentsPanel';

export default function Dashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeComment, setActiveComment] = useState<{ entityType: 'ALERT' | 'PRODUCT'; entityId: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!token) return;
      try {
        const [dashRes, alertRes] = await Promise.all([
          fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const dashJson = await dashRes.json();
        const alertJson = await alertRes.json();
        
        if (dashJson.success) setData(dashJson.data);
        if (alertJson.success) setAlerts(alertJson.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [token]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const kpi = data?.kpi || {};
  const topProducts = data?.topProducts || [];
  
  const stats = [
    { name: 'Total Orders', value: kpi.totalOrders?.toString() || '0', change: '', changeType: 'positive', icon: PackageSearch },
    { name: 'Actual Gross Revenue', value: `₹${(kpi.actualGrossRevenue || 0).toFixed(2)}`, change: '', changeType: 'positive', icon: Target },
    { name: 'Actual Profit', value: `₹${(kpi.actualProfit || 0).toFixed(2)}`, change: '', changeType: kpi.actualProfit >= 0 ? 'positive' : 'negative', icon: TrendingUp },
    { name: 'Net Margin', value: `${(kpi.actualNetMargin || 0).toFixed(1)}%`, change: '', changeType: kpi.actualNetMargin >= 0 ? 'positive' : 'negative', icon: BarChart3 },
  ];
  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Track your product research performance and opportunities.</p>
      </div>

      {/* Needs Attention Widget */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-base font-semibold leading-6 text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Needs Attention
          </h2>
          <span className="text-sm font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{alerts.length} Active</span>
        </div>
        <div className="p-6">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-slate-900">Everything looks healthy — no active issues.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert._id} className={cn("p-4 rounded-lg border", alert.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100')}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className={cn("text-sm font-semibold", alert.severity === 'CRITICAL' ? 'text-rose-900' : 'text-amber-900')}>{alert.title}</h4>
                      <p className={cn("text-sm mt-1", alert.severity === 'CRITICAL' ? 'text-rose-700' : 'text-amber-700')}>{alert.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-medium text-slate-500 bg-white/70 px-2 py-1 rounded">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setActiveComment({ entityType: 'ALERT', entityId: alert._id, title: alert.title })}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2 py-1 rounded border border-indigo-200 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all {alerts.length} alerts</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-indigo-100 group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="h-16 w-16 text-indigo-600" />
            </div>
            <dt className="truncate text-sm font-medium text-slate-500">{stat.name}</dt>
            <dd className="mt-2 flex items-baseline gap-x-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</span>
              <span
                className={cn(
                  stat.changeType === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50',
                  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium'
                )}
              >
                {stat.change && (
                  <>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="-ml-1 mr-0.5 h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ArrowDownRight className="-ml-1 mr-0.5 h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    )}
                    {stat.change}
                  </>
                )}
              </span>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Research Table */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-semibold leading-6 text-slate-900">Top Profitable Products</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-white">
                  <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-slate-900">Product</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-900">Revenue</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-900">Profit</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-900">Margin</th>
                  <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-slate-900">Discuss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {topProducts.map((item: any) => (
                  <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-slate-500">₹{item.revenue.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                      <span className={item.profit >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                        ₹{item.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                      <span className={item.margin >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {item.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <button
                        onClick={() => setActiveComment({ entityType: 'PRODUCT', entityId: item.productId, title: item.name })}
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="Discuss product"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No sales data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Analytics Panel */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-base font-semibold leading-6 text-slate-900 mb-6">Financial Overview</h2>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Expected Profit</span>
              <span className="font-bold text-slate-900">₹{(kpi.expectedProfit || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Actual Profit</span>
              <span className="font-bold text-slate-900">₹{(kpi.actualProfit || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-600">Profit Variance</span>
              <span className={cn("font-bold", (kpi.profitVariance || 0) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                ₹{(kpi.profitVariance || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Comments Drawer */}
      {activeComment && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Discussion: {activeComment.entityType}</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{activeComment.title}</p>
              </div>
              <button
                onClick={() => setActiveComment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CommentsPanel entityType={activeComment.entityType} entityId={activeComment.entityId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
