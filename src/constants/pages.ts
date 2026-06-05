import {
  Settings,
  Users,
  Shield,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  LayoutDashboard,
  Smartphone,
  Package,
  DollarSign,
  BarChart3,
  Wrench,
  Calculator
} from 'lucide-react';

export const PAGES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main business overview and analytics',
    category: 'Core',
    icon: LayoutDashboard,
  },
  {
    id: 'repairs',
    name: 'Repairs',
    description: 'Device repair management',
    category: 'Core',
    icon: Smartphone,
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer management and history',
    category: 'Core',
    icon: Users,
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Supplier management and payments',
    category: 'Operations',
    icon: Building2,
  },
  {
    id: 'transactions',
    name: 'Transactions',
    description: 'Transaction history and management',
    category: 'Finance',
    icon: DollarSign,
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Business reports and analytics',
    category: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Service types and pricing',
    category: 'Operations',
    icon: Wrench,
  },
  {
    id: 'calculations',
    name: 'Calculations',
    description: 'Profit/loss calculations',
    category: 'Finance',
    icon: Calculator,
  }
] as const;

export type PageId = typeof PAGES[number]['id'];

export interface PermissionsData {
  featureId: PageId;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
