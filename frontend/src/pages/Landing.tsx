import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight">
          Find Products That <span className="text-indigo-600">Actually Make Money.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          MarginIQ helps e-commerce sellers discover profitable products, calculate real margins, analyze competition, and identify opportunities before investing their money.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
            Start Researching
          </Link>
          <Link to="/register" className="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center">
            Explore MarginIQ
          </Link>
        </div>
        
        {/* Decorative Dashboard Preview */}
        <div className="mt-16 rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-4 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent z-10 bottom-0 h-40 mt-auto"></div>
          <div className="h-64 flex flex-col gap-4 opacity-40 select-none">
            <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
            <div className="flex gap-4 flex-1">
              <div className="w-1/4 bg-slate-200 rounded-lg"></div>
              <div className="w-3/4 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-24 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 h-24 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 h-24 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="flex-1 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
