import { useState } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OpportunityFinder() {
  const { token } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const fetchOpportunities = async () => {
    setIsSearching(true);
    setSearched(false);
    try {
      const res = await fetch('/api/analytics/opportunities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setOpportunities(json.data);
    } catch (err) {
      console.error('Failed to fetch opportunities', err);
    } finally {
      setIsSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Opportunity Finder</h1>
        <p className="mt-1 text-sm text-slate-500">Discover high-potential products based on your specific criteria.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-500" /> Filter Criteria
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Margin (%)</label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-slate-50">
              <option>Above 20%</option>
              <option>Above 30%</option>
              <option>Above 40%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Weight (g)</label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-slate-50">
              <option>Under 500g</option>
              <option>Under 1000g</option>
              <option>Under 2000g</option>
              <option>Any Weight</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Competition Level</label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-slate-50">
              <option>Low Only</option>
              <option>Low & Medium</option>
              <option>Any</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 bg-slate-50">
              <option>All Categories</option>
              <option>Home & Kitchen</option>
              <option>Automotive</option>
              <option>Beauty</option>
            </select>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={fetchOpportunities}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Find Opportunities
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
           <Loader2 className="w-12 h-12 text-indigo-600 mb-4 animate-spin" />
           <h3 className="text-lg font-medium text-slate-900 mb-2">Analyzing Opportunities...</h3>
           <p className="text-slate-500 max-w-sm">MarginIQ is currently scanning your product data to find high-margin opportunities.</p>
        </div>
      )}

      {!isSearching && searched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-base font-semibold leading-6 text-slate-900">Found Opportunities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-white">
                  <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-slate-900">Product</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-900">Score</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold text-slate-900">Margin</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-900">Classifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {opportunities.map((item: any) => (
                  <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-slate-900">
                      {item.name}
                      <span className="block text-xs text-slate-500">{item.sku}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-indigo-600">{item.opportunityScore.toFixed(1)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-emerald-600 font-medium">{(item.margin || 0).toFixed(1)}%</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-left">
                      <div className="flex gap-2">
                        {item.classifications.map((c: string) => (
                          <span key={c} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            {c.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">No opportunities found based on current data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
