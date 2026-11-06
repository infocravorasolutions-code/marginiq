import { useState, useEffect } from 'react';
import { Truck, Plus, Mail, MapPin, Loader2, X, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sourcing() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    leadTimeDays: 7,
    minimumOrderQuantity: 50,
  });

  const fetchSuppliers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuppliers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.companyName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          leadTimeDays: 7,
          minimumOrderQuantity: 50,
        });
        await fetchSuppliers();
      } else {
        alert(json.message || 'Failed to create supplier');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sourcing & Suppliers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your manufacturer database and sourcing pipeline.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-dashed p-12 text-center">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900">No suppliers registered yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your manufacturers, wholesale vendors, and packaging suppliers to link them directly to products and purchase orders.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add Your First Supplier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{supplier.companyName}</h3>
                    {supplier.address && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3 w-3" /> {supplier.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <span className="block text-slate-500 mb-1 text-xs">MOQ</span>
                    <span className="font-medium text-slate-900">{supplier.minimumOrderQuantity || 1} units</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1 text-xs">Lead Time</span>
                    <span className="font-medium text-slate-900">{supplier.leadTimeDays || 0} days</span>
                  </div>
                  {supplier.contactName && (
                    <div className="col-span-2">
                      <span className="block text-slate-500 mb-0.5 text-xs">Contact Person</span>
                      <span className="font-medium text-slate-800 text-xs">{supplier.contactName}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-3 flex gap-4">
                {supplier.email && (
                  <a href={`mailto:${supplier.email}`} className="text-slate-500 hover:text-indigo-600 text-xs font-medium flex items-center gap-1 transition-colors">
                    <Mail className="w-3.5 h-3.5" /> {supplier.email}
                  </a>
                )}
                {supplier.phone && (
                  <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {supplier.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Add New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Shenzhen Apex Manufacturing"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@supplier.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Order Qty (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimumOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumOrderQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
