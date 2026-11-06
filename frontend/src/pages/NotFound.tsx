import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="rounded-full bg-red-100 p-6 mb-6">
        <AlertCircle className="w-12 h-12 text-red-600" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      <Link 
        to="/dashboard" 
        className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
