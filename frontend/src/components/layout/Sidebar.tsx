import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Truck, 
  PieChart, 
  Shield, 
  ShoppingCart,
  Upload,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

const dashboardNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const inventoryNav = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
];

const calculatorsNav = [
  { name: 'Profit Calculator', href: '/profit-calculator', icon: Calculator },
  { name: 'ROI Calculator', href: '/roi-calculator', icon: PieChart },
];

const marketplaceReportsNav = [
  { name: 'Upload Report', href: '/reports/upload', icon: Upload },
  { name: 'Amazon', href: '/reports/amazon', icon: ShoppingCart },
  { name: 'Flipkart', href: '/reports/flipkart', icon: ShoppingCart },
  { name: 'Meesho', href: '/reports/meesho', icon: ShoppingCart },
];

const reconciliationNav = [
  { name: 'All Transactions', href: '/reconciliation', icon: FileText },
  { name: 'Matched', href: '/reconciliation/matched', icon: CheckCircle },
  { name: 'Unmatched', href: '/reconciliation/unmatched', icon: AlertTriangle },
  { name: 'Exceptions', href: '/reconciliation/exceptions', icon: AlertTriangle },
];

const reportsNav = [
  { name: 'Profit & Loss', href: '/reports/profit-loss', icon: DollarSign },
  { name: 'Product Profitability', href: '/reports/product-profitability', icon: TrendingUp },
  { name: 'Marketplace Profitability', href: '/reports/marketplace-profitability', icon: TrendingUp },
  { name: 'Settlement Summary', href: '/reports/settlements', icon: FileText },
  { name: 'Fees & Charges', href: '/reports/fees', icon: FileText },
  { name: 'Returns / RTO', href: '/reports/returns-rto', icon: Activity },
  { name: 'Expenses', href: '/reports/expenses', icon: DollarSign },
  { name: 'Leakage / Mistakes', href: '/reports/leakage', icon: AlertTriangle },
];

const adminNavigation = [
  { name: 'Settings', href: '/settings', icon: Shield },
];

function NavSection({ title, items, location }: { title: string, items: any[], location: any }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">{title}</div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                'group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                  'h-5 w-5 shrink-0 transition-colors'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">MarginIQ</span>
        </Link>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 space-y-8">
        <NavSection title="Dashboard" items={dashboardNav} location={location} />
        <NavSection title="Inventory" items={inventoryNav} location={location} />
        <NavSection title="Calculators" items={calculatorsNav} location={location} />
        <NavSection title="Marketplace Reports" items={marketplaceReportsNav} location={location} />
        <NavSection title="Reconciliation" items={reconciliationNav} location={location} />
        <NavSection title="Reports" items={reportsNav} location={location} />
        <NavSection title="System" items={adminNavigation} location={location} />
      </div>
    </div>
  );
}
