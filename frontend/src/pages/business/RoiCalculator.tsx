import { useState } from 'react';
import { PieChart } from 'lucide-react';

export default function RoiCalculator() {
  const [inputs, setInputs] = useState({
    moq: 500,
    landedCost: 150,
    brandingCost: 5000,
    expectedDailySales: 15,
    netProfitPerUnit: 120,
  });

  const totalInventoryCost = inputs.moq * inputs.landedCost;
  const initialInvestment = totalInventoryCost + inputs.brandingCost;
  const expectedMonthlyProfit = inputs.expectedDailySales * 30 * inputs.netProfitPerUnit;
  const roi = (expectedMonthlyProfit / initialInvestment) * 100;
  const monthsToBreakeven = initialInvestment / expectedMonthlyProfit;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ROI & Inventory Calculator</h1>
        <p className="mt-1 text-sm text-slate-500">Calculate initial investment, expected returns, and break-even points for private labeling.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Assumptions</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Order Quantity (MOQ)</label>
              <input type="number" value={inputs.moq} onChange={(e) => setInputs({...inputs, moq: Number(e.target.value)})} className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Landed Cost per Unit (₹)</label>
              <input type="number" value={inputs.landedCost} onChange={(e) => setInputs({...inputs, landedCost: Number(e.target.value)})} className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Branding/Setup Cost (₹)</label>
              <input type="number" value={inputs.brandingCost} onChange={(e) => setInputs({...inputs, brandingCost: Number(e.target.value)})} className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Daily Sales</label>
                  <input type="number" value={inputs.expectedDailySales} onChange={(e) => setInputs({...inputs, expectedDailySales: Number(e.target.value)})} className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-slate-50" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Net Profit per Unit (₹)</label>
                  <input type="number" value={inputs.netProfitPerUnit} onChange={(e) => setInputs({...inputs, netProfitPerUnit: Number(e.target.value)})} className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-slate-50" />
               </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 opacity-10">
               <PieChart className="w-32 h-32" />
             </div>
             <h3 className="text-indigo-100 font-medium mb-1 relative z-10">Estimated Monthly ROI</h3>
             <div className="text-5xl font-bold tracking-tight mb-4 relative z-10">{roi.toFixed(1)}%</div>
             
             <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-indigo-500/50 relative z-10">
                <div>
                   <span className="block text-indigo-200 text-sm mb-1">Initial Investment</span>
                   <span className="text-xl font-semibold">₹{initialInvestment.toLocaleString()}</span>
                </div>
                <div>
                   <span className="block text-indigo-200 text-sm mb-1">Expected Monthly Profit</span>
                   <span className="text-xl font-semibold">₹{expectedMonthlyProfit.toLocaleString()}</span>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="text-base font-semibold text-slate-900 mb-4">Investment Breakdown</h3>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Inventory Cost ({inputs.moq} units)</span>
                      <span className="font-medium text-slate-900">₹{totalInventoryCost.toLocaleString()}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${(totalInventoryCost/initialInvestment)*100}%`}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Branding & Setup</span>
                      <span className="font-medium text-slate-900">₹{inputs.brandingCost.toLocaleString()}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${(inputs.brandingCost/initialInvestment)*100}%`}}></div>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <span className="block text-sm text-slate-500 mb-1">Estimated Break-even Time</span>
                <span className="text-2xl font-bold text-slate-900">{monthsToBreakeven.toFixed(1)} months</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
