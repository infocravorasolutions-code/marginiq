import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Create an account</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md text-center">{error}</div>}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                  onChange={handleChange}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                placeholder="Optional"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                name="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
