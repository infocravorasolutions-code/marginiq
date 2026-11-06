import { Download, Loader2, Calendar, FileText, Clock, Archive, Plus, Play, Trash2, X, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const REPORT_OPTIONS = [
  { value: 'marketplaces', label: 'Marketplaces Comparison' },
  { value: 'products', label: 'Product Profitability' },
  { value: 'profitability', label: 'Executive Profitability' },
  { value: 'orders', label: 'Order History & Status' },
  { value: 'settlements', label: 'Settlement Transactions' },
  { value: 'inventory', label: 'Inventory Movements' },
  { value: 'pricing', label: 'Pricing & Slabs' },
  { value: 'returns', label: 'Customer Returns & Refunds' },
  { value: 'rto', label: 'RTO (Return to Origin)' },
  { value: 'damages', label: 'Damages & Scrap Loss' },
  { value: 'expenses', label: 'Marketplace Fees & Expenses' },
  { value: 'profit-leakage', label: 'Profit Leakage Breakdown' },
  { value: 'opportunities', label: 'Product Opportunities' },
  { value: 'alerts', label: 'System Alert Logs' },
];

export default function Reports() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'view' | 'history' | 'schedules' | 'jobs'>('view');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [reportType, setReportType] = useState('marketplaces');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Schedule Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    reportType: 'marketplaces',
    frequency: 'DAILY',
    time: '09:00',
    timezone: 'UTC',
    format: 'csv'
  });

  useEffect(() => {
    if (activeTab === 'view') fetchReportData();
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'schedules') fetchSchedules();
    if (activeTab === 'jobs') fetchExportJobs();
  }, [activeTab, reportType]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/${reportType}`);
      if (Array.isArray(data)) {
        setReports(data || []);
      } else if (data && Array.isArray(data.data)) {
        setReports(data.data || []);
      } else if (data && typeof data === 'object') {
        setReports([data.kpi || data]);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/reports/history');
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get('/reports/schedules');
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExportJobs = async () => {
    try {
      const { data } = await api.get('/reports/export-jobs');
      setExportJobs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/reports/${reportType}?format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportType}_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('CSV downloaded successfully');
    } catch (err) {
      console.error('Failed to download CSV', err);
    }
  };

  const handleQueueExport = async () => {
    try {
      await api.post('/reports/export-jobs', {
        reportType,
        format: 'csv'
      });
      showNotification('Export job queued successfully');
      if (activeTab === 'jobs') fetchExportJobs();
    } catch (err) {
      alert('Failed to queue export');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.name.trim()) return;
    try {
      await api.post('/reports/schedules', scheduleForm);
      setShowScheduleModal(false);
      setScheduleForm({
        name: '',
        reportType: 'marketplaces',
        frequency: 'DAILY',
        time: '09:00',
        timezone: 'UTC',
        format: 'csv'
      });
      showNotification('Scheduled report created');
      fetchSchedules();
    } catch (err: any) {
      alert(err.message || 'Failed to create schedule');
    }
  };

  const handleRunScheduleNow = async (id: string) => {
    try {
      await api.post(`/reports/schedules/${id}/run`, {});
      showNotification('Schedule executed successfully! Result added to History.');
      fetchSchedules();
    } catch (err: any) {
      alert('Error running schedule: ' + err.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Delete this scheduled report?')) return;
    try {
      await api.delete(`/reports/schedules/${id}`);
      showNotification('Schedule deleted');
      fetchSchedules();
    } catch (err: any) {
      alert('Error deleting schedule');
    }
  };

  return (
    <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Advanced Reports & Intelligence</h1>
          <p className="text-slate-500 mt-1">Generate, schedule, export, and audit 14 real-time financial report types.</p>
        </div>
        {actionSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-200 mb-8">
        {[
          { id: 'view', label: 'View Report', icon: FileText },
          { id: 'history', label: 'Report History', icon: Archive },
          { id: 'schedules', label: 'Scheduled Reports', icon: Calendar },
          { id: 'jobs', label: 'Export Jobs', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'view' && (
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Select Report:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="block w-64 rounded-lg border-slate-300 py-2 pl-3 pr-8 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm font-medium bg-white"
              >
                {REPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleQueueExport}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
              >
                Queue Large Export
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Direct CSV
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[300px]">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {reports.length > 0 &&
                      Object.keys(reports[0])
                        .filter((k) => k !== '_id' && k !== '__v' && k !== 'organizationId')
                        .map((key) => (
                          <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reports.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.keys(item)
                        .filter((k) => k !== '_id' && k !== '__v' && k !== 'organizationId')
                        .map((key) => (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key])}
                          </td>
                        ))}
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-500 text-sm">
                        No records found for this report type.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-900">Report Generation Audit History</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {history.map((h: any) => (
              <div key={h._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-medium text-slate-900 capitalize">{h.reportType} Report</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Rows: <span className="font-semibold text-slate-700">{h.rowCount}</span> • Format: <span className="font-semibold uppercase">{h.format}</span> • Status: <span className="text-emerald-600 font-semibold">{h.status}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{new Date(h.createdAt || h.completedAt).toLocaleString()}</div>
              </div>
            ))}
            {history.length === 0 && <div className="p-12 text-center text-slate-500 text-sm">No report history recorded yet.</div>}
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-900">Export Jobs Status</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {exportJobs.map((job: any) => (
              <div key={job._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-medium text-slate-900 capitalize">{job.reportType} Export</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Format: <span className="font-semibold uppercase">{job.format}</span> • Status:{' '}
                    <span className="font-semibold text-indigo-600">{job.status}</span>
                    {job.rowCount !== undefined && ` • Rows: ${job.rowCount}`}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {exportJobs.length === 0 && <div className="p-12 text-center text-slate-500 text-sm">No export jobs queued.</div>}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Automated Report Schedules</h2>
              <p className="text-sm text-slate-500">Configure recurring reports to run automatically (Daily, Weekly, Monthly).</p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
              {schedules.map((schedule: any) => (
                <div key={schedule._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{schedule.name}</span>
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 uppercase">
                        {schedule.frequency}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 uppercase">
                        {schedule.format}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Report: <strong className="text-slate-700 capitalize">{schedule.reportType}</strong></span>
                      <span>Scheduled At: <strong className="text-slate-700">{schedule.time} {schedule.timezone}</strong></span>
                      {schedule.nextRunAt && (
                        <span>Next Run: <strong className="text-indigo-600">{new Date(schedule.nextRunAt).toLocaleString()}</strong></span>
                      )}
                      {schedule.lastRunAt && (
                        <span>Last Run: <strong className="text-slate-600">{new Date(schedule.lastRunAt).toLocaleString()}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRunScheduleNow(schedule._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Execute this schedule immediately"
                    >
                      <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                      Run Now
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {schedules.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm">No scheduled reports active. Create one to receive automated updates.</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Creation Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">Create Scheduled Report</h3>
                  <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daily Marketplace Audit"
                      value={scheduleForm.name}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type</label>
                    <select
                      value={scheduleForm.reportType}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                    >
                      {REPORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                      <select
                        value={scheduleForm.frequency}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Time</label>
                      <input
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Output Format</label>
                    <select
                      value={scheduleForm.format}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden bg-white"
                    >
                      <option value="csv">CSV Attachment</option>
                      <option value="json">JSON Summary</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-sm font-medium rounded-lg text-white hover:bg-indigo-700 shadow-sm"
                    >
                      Create Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
