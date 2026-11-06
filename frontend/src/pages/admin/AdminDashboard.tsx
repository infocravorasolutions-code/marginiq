import { Settings, Users, CreditCard, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage global system configurations, users, and fee structures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-600">
               <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Users & Orgs</h3>
            <p className="text-xs text-slate-500">Manage 1,248 active users</p>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
               <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Subscriptions</h3>
            <p className="text-xs text-slate-500">Manage billing & plans</p>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600">
               <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Fee Engine</h3>
            <p className="text-xs text-slate-500">Marketplace rules & slabs</p>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-600">
               <Settings className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Scoring Engine</h3>
            <p className="text-xs text-slate-500">Opportunity weights & rules</p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
         <h2 className="text-base font-semibold text-slate-900 mb-4 border-b pb-2">Recent System Activity</h2>
         <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="font-medium text-slate-700">Fee Engine Update</span>
                  <span className="text-slate-500">Amazon India referral fees updated.</span>
               </div>
               <span className="text-slate-400">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-medium text-slate-700">New User</span>
                  <span className="text-slate-500">darshan@example.com registered.</span>
               </div>
               <span className="text-slate-400">5 hours ago</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <span className="font-medium text-slate-700">Data Import</span>
                  <span className="text-slate-500">Failed to import 500 products (Validation Error).</span>
               </div>
               <span className="text-slate-400">1 day ago</span>
            </div>
         </div>
      </div>
    </div>
  );
}
