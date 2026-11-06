import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { importSettlement, getImports } from '../../services/settlementService';
import { runReconciliation } from '../../services/reconciliationService';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Clock,
  X
} from 'lucide-react';

export default function Settlements() {
  const { token } = useAuth();
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<string>('amazon');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Result State
  const [importResult, setImportResult] = useState<any>(null);
  const [reconRunning, setReconRunning] = useState(false);
  const [reconResult, setReconResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImports = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getImports(token);
      setImports(data);
    } catch (err) {
      console.error('Failed to load imports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImports();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setImportResult(null);
      setReconResult(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!file || !token) return;
    
    try {
      setImporting(true);
      setError(null);
      
      const result = await importSettlement(token, file, marketplace);
      setImportResult(result);
      
      // Refresh list
      loadImports();
      clearFile();
    } catch (err: any) {
      setError(err.message || 'Failed to import settlement file');
    } finally {
      setImporting(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!token) return;
    try {
      setReconRunning(true);
      const result = await runReconciliation(token);
      setReconResult(result);
    } catch (err: any) {
      setError(err.message || 'Reconciliation failed');
    } finally {
      setReconRunning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settlement Import</h1>
        <p className="text-slate-500 mt-1">Upload marketplace settlement reports to reconcile actual payouts</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 shrink-0" />
          <div className="text-sm text-rose-800 font-medium whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {importResult ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-900">Settlement Import Successful</h2>
            <p className="text-emerald-700 mt-1 max-w-md">
              File {importResult.originalFileName} was processed successfully.
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <span className="block text-sm font-medium text-slate-500 mb-1">Rows Processed</span>
                <span className="text-2xl font-bold text-slate-900">{importResult.totalRows}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <span className="block text-sm font-medium text-slate-500 mb-1">Transactions Created</span>
                <span className="text-2xl font-bold text-slate-900">{importResult.successfulRows}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <span className="block text-sm font-medium text-slate-500 mb-1">Duplicates Skipped</span>
                <span className="text-2xl font-bold text-slate-900">{importResult.totalRows - importResult.successfulRows}</span>
              </div>
            </div>

            {reconResult ? (
              <div className="bg-indigo-50 rounded-lg p-6 text-center border border-indigo-100">
                <CheckCircle2 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-indigo-900 mb-1">Reconciliation Complete</h3>
                <p className="text-indigo-700 mb-4">Matched {reconResult.matchedTransactions} transactions. {reconResult.unmatchedTransactions} remain unmatched.</p>
                <Link 
                  to="/orders" 
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  View Orders & Reconciliation
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => { setImportResult(null); setFile(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Import Another File
                </button>
                <button
                  onClick={handleRunReconciliation}
                  disabled={reconRunning}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {reconRunning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Run Reconciliation
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Marketplace</label>
              <select 
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="w-full sm:w-64 border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="amazon">Amazon</option>
                <option value="flipkart" disabled>Flipkart (Coming Soon)</option>
                <option value="meesho" disabled>Meesho (Coming Soon)</option>
              </select>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                id="file-upload"
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Click to upload
                  </span>
                  <span className="text-xs text-slate-500 mt-1">or drag and drop CSV files here</span>
                </label>
              ) : (
                <div className="flex flex-col items-center relative">
                  <button 
                    onClick={clearFile}
                    className="absolute -top-4 -right-4 p-1 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <FileText className="w-10 h-10 text-indigo-500 mb-3" />
                  <span className="text-sm font-medium text-slate-900 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Settlement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">Import History</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" /></div>
        ) : imports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">No settlement reports imported yet.</h3>
            <p className="text-sm text-slate-500 mt-1">Upload your marketplace settlement report to reconcile actual payouts and profitability.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Marketplace</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Rows</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Imported</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Skipped</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {imports.map((imp) => (
                  <tr key={imp._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatDate(imp.importDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {imp.originalFileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">
                      {imp.marketplaceCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {imp.status === 'Completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>
                      ) : imp.status === 'Processing' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Processing</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertCircle className="w-3 h-3 mr-1" /> Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                      {imp.totalRows || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                      {imp.successfulRows || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                      {(imp.totalRows || 0) - (imp.successfulRows || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
