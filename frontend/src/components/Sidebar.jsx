import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Receipt,
  TrendingDown,
  BarChart3,
  FolderTree,
  Users,
  Settings,
  LogOut,
  Store,
  Clock,
  Barcode,
  Globe,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isOwner, logout } = useAuth();

  const links = [
    { to: '/pos', label: 'POS Billing', icon: ShoppingCart, roles: ['owner', 'cashier'], highlight: true },
    { to: '/shifts', label: 'Register Shifts (Z-Report)', icon: Clock, roles: ['owner', 'cashier'] },
    { to: '/customers', label: 'Customers & Khata', icon: Wallet, roles: ['owner', 'cashier'] },
    { to: '/barcode-generator', label: 'Barcode Stickers', icon: Barcode, roles: ['owner', 'cashier'] },
    { to: '/store', label: 'Public Website Store', icon: Globe, roles: ['owner', 'cashier'] },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'cashier'] },
    { to: '/products', label: 'Products & Variants', icon: Package, roles: ['owner'] },
    { to: '/categories', label: 'Categories', icon: FolderTree, roles: ['owner'] },
    { to: '/stock', label: 'Stock Inventory', icon: Layers, roles: ['owner'] },
    { to: '/purchases', label: 'Suppliers & Purchases', icon: Truck, roles: ['owner'] },
    { to: '/expenses', label: 'Expenses', icon: TrendingDown, roles: ['owner'] },
    { to: '/reports', label: 'Profit & Reports', icon: BarChart3, roles: ['owner'] },
    { to: '/receipts', label: 'Sales & Receipts', icon: Receipt, roles: ['owner', 'cashier'] },
    { to: '/users', label: 'Staff Accounts', icon: Users, roles: ['owner'] },
    { to: '/settings', label: 'Store Settings', icon: Settings, roles: ['owner'] },
  ];

  const allowedLinks = links.filter((link) => link.roles.includes(user?.role || 'cashier'));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide leading-tight">ShopEase POS</h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Retail Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : item.highlight
                      ? 'text-brand-400 hover:bg-slate-800/80 hover:text-brand-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Live
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & quick sign out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName || user?.username}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {isOwner ? 'Store Owner' : 'Cashier'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
