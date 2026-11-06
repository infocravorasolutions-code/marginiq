import { useState } from 'react';
import { Search, Users, AlertCircle } from 'lucide-react';

export default function CompetitorAnalysis() {
  const [keyword, setKeyword] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearched(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Competitor Analysis</h1>
        <p className="mt-1 text-sm text-slate-500">Analyze market saturation, competitor pricing, and review concentration.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="w-16 h-16 text-indigo-200 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Competitor Analysis Module</h3>
        <p className="text-slate-500 max-w-md mb-6">Enter a keyword or ASIN to generate a comprehensive breakdown of top sellers, price distribution, and market saturation.</p>
        
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter product keyword (e.g. 'cable organizer')..."
            className="w-full pl-10 pr-28 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Analyze
          </button>
        </form>

        {searched && (
          <div className="max-w-lg w-full bg-amber-50 border border-amber-200 rounded-lg p-4 text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">External Competitor Crawling Not Configured</p>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                Live competitor data requires an active marketplace scraping integration or Amazon SP-API competitor insights feed. MarginIQ never generates synthetic or unverified competitor numbers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
