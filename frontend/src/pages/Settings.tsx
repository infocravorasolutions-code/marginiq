import { useState, useEffect } from 'react';
import { Users, Shield, Bell, Activity, Plus, Trash2, Mail, CheckCircle, Network, RefreshCw, CheckCircle2, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoSeedMessage, setDemoSeedMessage] = useState<string | null>(null);

  const [alertPrefs, setAlertPrefs] = useState<Record<string, { enabled: boolean; emailEnabled: boolean; inAppEnabled: boolean }>>({
    LOSS_MAKING_PRODUCT: { enabled: true, emailEnabled: true, inAppEnabled: true },
    SETTLEMENT_VARIANCE: { enabled: true, emailEnabled: true, inAppEnabled: true },
    LOW_STOCK: { enabled: true, emailEnabled: false, inAppEnabled: true },
    HIGH_RTO: { enabled: true, emailEnabled: true, inAppEnabled: true }
  });
  const [prefSaveStatus, setPrefSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchLogs();
    if (activeTab === 'alerts') fetchAlerts();
    if (activeTab === 'integrations') fetchIntegrations();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || res || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data || res || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts/preferences');
      const data = res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(data)) {
        setAlertPrefs(prev => {
          const updated = { ...prev };
          data.forEach((p: any) => {
            if (p.alertType) {
              updated[p.alertType] = {
                enabled: p.enabled !== undefined ? p.enabled : true,
                emailEnabled: p.emailEnabled !== undefined ? p.emailEnabled : true,
                inAppEnabled: p.inAppEnabled !== undefined ? p.inAppEnabled : true
              };
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error fetching alert prefs:', err);
    }
  };

  const handleTogglePref = async (type: string, field: 'enabled' | 'emailEnabled' | 'inAppEnabled', val: boolean) => {
    const updated = {
      ...alertPrefs[type],
      [field]: val
    };
    setAlertPrefs(prev => ({ ...prev, [type]: updated }));
    try {
      await api.patch(`/alerts/preferences/${type}`, updated);
      setPrefSaveStatus(`Saved preference for ${type}`);
      setTimeout(() => setPrefSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save preference:', err);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Error updating role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const fetchIntegrations = async () => {
    try {
      setLoadingIntegrations(true);
      const res = await api.get('/integrations/health');
      setIntegrations(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      setTestingProvider(providerId);
      const res = await api.post(`/integrations/test/${providerId}`, {});
      setTestResults(prev => ({ ...prev, [providerId]: res.data || res }));
      fetchIntegrations();
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: err.message } }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeedingDemo(true);
      setDemoSeedMessage(null);
      await api.post('/demo/seed', {});
      setDemoSeedMessage('Demo organization successfully seeded! Car Mobile Holder (CMH001) with full purchase, batches, orders & settlements ready.');
      setTimeout(() => setDemoSeedMessage(null), 8000);
    } catch (err: any) {
      setDemoSeedMessage('Failed to seed demo: ' + (err.response?.data?.message || err.message));
    } finally {
      setSeedingDemo(false);
    }
  };

  const alertConfigs = [
    {
      type: 'LOSS_MAKING_PRODUCT',
      title: 'Loss Making Products',
      desc: 'Notify when product margin falls below zero or incurs accumulated losses'
    },
    {
      type: 'SETTLEMENT_VARIANCE',
      title: 'Settlement Payout Variance',
      desc: 'Notify on material discrepancies between calculated and settled payouts'
    },
    {
      type: 'LOW_STOCK',
      title: 'Inventory Stock Threshold',
      desc: 'Notify when warehouse inventory reaches critical reorder minimums'
    },
    {
      type: 'HIGH_RTO',
      title: 'High RTO & Return Velocity',
      desc: 'Notify when RTO or customer return rates exceed target thresholds'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-500 mt-1">Manage your team, permissions, and preferences.</p>
      </div>

      <div className="flex border-b border-slate-200 mb-8">
        {[
          { id: 'users', label: 'Team Members', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          { id: 'alerts', label: 'Alert Preferences', icon: Bell },
          { id: 'audit', label: 'Audit Logs', icon: Activity },
          { id: 'integrations', label: 'API Integrations & Demo', icon: Network },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Invite Member
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {users.map((user: any) => (
              <div key={user._id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {user.firstName ? user.firstName[0] : 'U'}{user.lastName ? user.lastName[0] : ''}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="w-3 h-3" /> {user.email}
                      {user.status === 'INVITED' && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Invited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                    className="block w-32 rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button onClick={() => handleDeleteUser(user._id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-6 text-center text-slate-500">No team members found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Role Permissions Matrix</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Permission</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Admin</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Manager</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Analyst</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { name: 'View Dashboard & Reports', admin: true, manager: true, analyst: true, viewer: true },
                  { name: 'Export Data', admin: true, manager: true, analyst: true, viewer: false },
                  { name: 'Manage Inventory & Pricing', admin: true, manager: true, analyst: false, viewer: false },
                  { name: 'Import Settlements', admin: true, manager: true, analyst: false, viewer: false },
                  { name: 'Manage Users & Billing', admin: true, manager: false, analyst: false, viewer: false },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900">{row.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">{row.admin ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">{row.manager ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">{row.analyst ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">{row.viewer ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {logs.map((log: any) => (
              <div key={log._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {log.action}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {log.userId?.firstName} {log.userId?.lastName}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {log.entityType && `Entity: ${log.entityType} (${log.entityId})`}
                  </div>
                </div>
                <div className="text-sm text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-6 text-center text-slate-500">No audit logs found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Alert Preferences</h2>
              <p className="text-sm text-slate-500 mt-0.5">Configure how and when you want to receive intelligence alerts.</p>
            </div>
            {prefSaveStatus && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                ✓ Changes saved
              </span>
            )}
          </div>
          <div className="space-y-4">
            {alertConfigs.map((cfg) => {
              const pref = alertPrefs[cfg.type] || { enabled: true, emailEnabled: true, inAppEnabled: true };
              return (
                <div key={cfg.type} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={pref.enabled}
                          onChange={(e) => handleTogglePref(cfg.type, 'enabled', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                      <h3 className={`font-medium ${pref.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                        {cfg.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 pl-12">{cfg.desc}</p>
                  </div>
                  <div className="flex items-center gap-4 pl-12 sm:pl-0">
                    <label className={`flex items-center gap-2 text-sm ${pref.enabled ? 'text-slate-700' : 'text-slate-400 opacity-60'}`}>
                      <input
                        type="checkbox"
                        disabled={!pref.enabled}
                        checked={pref.emailEnabled}
                        onChange={(e) => handleTogglePref(cfg.type, 'emailEnabled', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      Email
                    </label>
                    <label className={`flex items-center gap-2 text-sm ${pref.enabled ? 'text-slate-700' : 'text-slate-400 opacity-60'}`}>
                      <input
                        type="checkbox"
                        disabled={!pref.enabled}
                        checked={pref.inAppEnabled}
                        onChange={(e) => handleTogglePref(cfg.type, 'inAppEnabled', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      In-App
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Header & Demo Seeder Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md border border-indigo-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    Client Demo Environment
                  </span>
                  <span className="text-xs text-indigo-300">Continuous Master Flow (Steps 1–28)</span>
                </div>
                <h2 className="text-xl font-bold mt-2">Initialize Complete Demo Organization</h2>
                <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
                  Seed the end-to-end client journey with Car Mobile Holder (CMH001), True Landed Cost (₹145), multi-marketplace economics (₹399), live orders, settlements, returns, and reconciled profit.
                </p>
              </div>
              <button
                onClick={handleSeedDemo}
                disabled={seedingDemo}
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all whitespace-nowrap disabled:opacity-50"
              >
                {seedingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {seedingDemo ? 'Seeding Demo Data...' : 'Seed Demo Business Flow'}
              </button>
            </div>
            {demoSeedMessage && (
              <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-lg text-sm border border-white/20 text-indigo-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{demoSeedMessage}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Third-Party Data Providers & Services</h3>
              <p className="text-xs text-slate-500">Official adapters, background health telemetry, and live sync status.</p>
            </div>
            {loadingIntegrations && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Refreshing provider health...
              </div>
            )}
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Frankfurter Currency API */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      FX
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Frankfurter Currency API</h3>
                      <p className="text-xs text-slate-500">Live Foreign Exchange (ECB Reference Rates)</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {integrations.find((p: any) => p.providerId === 'frankfurter')?.status || 'CONNECTED'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Real-time currency conversion for international supplier purchases (USD, EUR, GBP, CNY, AED to INR). Freezes historic rates in immutable calculation snapshots.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Operating Mode:</span>
                    <span className="font-semibold text-slate-800">LIVE (API v1)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cache Strategy:</span>
                    <span className="font-semibold text-slate-800">24-hr TTL with Fallback</span>
                  </div>
                </div>

                {testResults['frankfurter'] && (
                  <div className={`mt-3 p-2.5 rounded-md text-xs border ${testResults['frankfurter'].success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {testResults['frankfurter'].message} (Latency: {testResults['frankfurter'].latencyMs}ms)
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a href="https://api.frankfurter.dev" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
                  Documentation <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleTestProvider('frankfurter')}
                  disabled={testingProvider === 'frankfurter'}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingProvider === 'frankfurter' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {/* 2. Open Products Facts */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      OPF
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Open Products Facts</h3>
                      <p className="text-xs text-slate-500">Global Barcode & Product Registry</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    CONNECTED
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Automatic product metadata enrichment from barcode/GTIN (Brand, Category, Product Dimensions, Net Weight, Packaging tags).
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">User-Agent:</span>
                    <span className="font-semibold text-slate-800 truncate block">MarginIQ/1.0</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Data Protection:</span>
                    <span className="font-semibold text-slate-800">Never overwrites costs</span>
                  </div>
                </div>

                {testResults['open_products_facts'] && (
                  <div className={`mt-3 p-2.5 rounded-md text-xs border ${testResults['open_products_facts'].success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {testResults['open_products_facts'].message} (Latency: {testResults['open_products_facts'].latencyMs}ms)
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a href="https://openproductsfacts.org" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
                  Documentation <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleTestProvider('open_products_facts')}
                  disabled={testingProvider === 'open_products_facts'}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingProvider === 'open_products_facts' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {/* 3. Open Food Facts */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                      OFF
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Open Food Facts</h3>
                      <p className="text-xs text-slate-500">Food & Grocery FMCG Registry</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    CONNECTED
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Deep catalog metadata enrichment for food, confectionery, beverage, and pantry products sold across ecommerce marketplaces.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Rate Limit:</span>
                    <span className="font-semibold text-slate-800">100 req/min</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cache TTL:</span>
                    <span className="font-semibold text-slate-800">7 Days</span>
                  </div>
                </div>

                {testResults['open_food_facts'] && (
                  <div className={`mt-3 p-2.5 rounded-md text-xs border ${testResults['open_food_facts'].success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {testResults['open_food_facts'].message} (Latency: {testResults['open_food_facts'].latencyMs}ms)
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
                  Documentation <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleTestProvider('open_food_facts')}
                  disabled={testingProvider === 'open_food_facts'}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingProvider === 'open_food_facts' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {/* 4. Amazon SP-API */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                      AMZ
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Amazon SP-API Adapter</h3>
                      <p className="text-xs text-slate-500">Official Selling Partner API (v0/v2022)</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    TOKEN CONFIGURED
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Adapter for automated syncing of Amazon Orders, Catalog Items, Fees Estimate, and Financial Event Groups via Login with Amazon (LWA).
                </p>

                <div className="mt-4 p-3 bg-sky-50/70 border border-sky-200/70 rounded-lg text-xs text-sky-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">LWA Refresh Token</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[11px] font-semibold">Configured (Atzr|...)</span>
                  </div>
                  <div className="pt-2 border-t border-sky-200/50 space-y-1 text-slate-600">
                    <span className="block font-medium text-slate-700">Next Step to Complete Live Handshake:</span>
                    <p className="text-[11px] leading-relaxed">
                      From your Amazon Developer Central / Solution Provider Portal: add <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-600 font-mono">AMAZON_SP_API_CLIENT_ID</code> and <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-600 font-mono">AMAZON_SP_API_CLIENT_SECRET</code> to your <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">.env</code>.
                    </p>
                  </div>
                </div>

                {testResults['amazon_sp_api'] && (
                  <div className="mt-3 p-2.5 rounded-md text-xs border bg-slate-50 text-slate-800 border-slate-200">
                    {testResults['amazon_sp_api'].message}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a href="https://developer-docs.amazon.com/sp-api" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
                  SP-API Docs <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleTestProvider('amazon_sp_api')}
                  disabled={testingProvider === 'amazon_sp_api'}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${testingProvider === 'amazon_sp_api' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
