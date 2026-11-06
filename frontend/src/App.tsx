import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import SavedProducts from './pages/SavedProducts';
import OpportunityFinder from './pages/OpportunityFinder';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import ProductDatabase from './pages/ProductDatabase';
import Watchlist from './pages/Watchlist';
import Sourcing from './pages/business/Sourcing';
import RoiCalculator from './pages/business/RoiCalculator';
import Settings from './pages/Settings';
import ProfitCalculator from './pages/business/ProfitCalculator';
import OrdersList from './pages/business/OrdersList';
import Settlements from './pages/business/Settlements';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Research from './pages/Research';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            {/* Required Routes by Sidebar */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Inventory */}
            <Route path="/products" element={<ProductDatabase />} />
            <Route path="/purchases" element={<ProductDatabase />} />
            <Route path="/suppliers" element={<Sourcing />} />

            {/* Calculators */}
            <Route path="/profit-calculator" element={<ProfitCalculator />} />
            <Route path="/roi-calculator" element={<RoiCalculator />} />

            {/* Marketplace Reports */}
            <Route path="/reports/upload" element={<Settlements />} />
            <Route path="/reports/amazon" element={<Settlements />} />
            <Route path="/reports/flipkart" element={<Settlements />} />
            <Route path="/reports/meesho" element={<Settlements />} />

            {/* Reconciliation */}
            <Route path="/reconciliation" element={<OrdersList />} />
            <Route path="/reconciliation/matched" element={<OrdersList />} />
            <Route path="/reconciliation/unmatched" element={<OrdersList />} />
            <Route path="/reconciliation/exceptions" element={<OrdersList />} />

            {/* Reports */}
            <Route path="/reports/profit-loss" element={<Reports />} />
            <Route path="/reports/product-profitability" element={<Reports />} />
            <Route path="/reports/marketplace-profitability" element={<Reports />} />
            <Route path="/reports/settlements" element={<Reports />} />
            <Route path="/reports/fees" element={<Reports />} />
            <Route path="/reports/returns-rto" element={<Reports />} />
            <Route path="/reports/expenses" element={<Reports />} />
            <Route path="/reports/leakage" element={<Reports />} />

            {/* System */}
            <Route path="/settings" element={<Settings />} />

            {/* Legacy / Hidden Routes */}
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/saved" element={<SavedProducts />} />
            <Route path="/opportunities" element={<OpportunityFinder />} />
            <Route path="/competitors" element={<CompetitorAnalysis />} />
            <Route path="/database" element={<ProductDatabase />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/sourcing" element={<Sourcing />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/research" element={<Research />} />
            <Route path="/reports" element={<Reports />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
