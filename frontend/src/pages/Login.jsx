import React, { useState } from 'react';
import { Store, Lock, User, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Login() {
  const { login, setupInitialOwner, isInitialized } = useAuth();
  const notify = useNotification();

  const [isSetupMode, setIsSetupMode] = useState(!isInitialized);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSetupMode) {
        await setupInitialOwner({
          username,
          fullName,
          email,
          password,
        });
        notify.success('Owner account created! Welcome to ShopEase POS.');
      } else {
        await login(username, password);
        notify.success('Signed in successfully.');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-500/30 mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ShopEase POS</h1>
          <p className="text-sm text-slate-400 mt-1">
            Retail Billing & Shop Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">
              {isSetupMode ? 'Initial Shop Setup Wizard' : 'Staff Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSetupMode
                ? 'Create the primary Store Owner account to initialize your POS system.'
                : 'Enter your credentials to access the POS terminal.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSetupMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Owner Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="owner@shopease.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. owner or cashier1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all mt-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : isSetupMode ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Initialize & Create Owner</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick toggle for dev if system wasn't initialized */}
          {!isInitialized && (
            <div className="mt-4 pt-4 border-t border-slate-700 text-center">
              <button
                type="button"
                onClick={() => setIsSetupMode(!isSetupMode)}
                className="text-xs text-brand-400 hover:underline"
              >
                {isSetupMode ? 'Already have an account? Sign In' : 'Need to run initial setup?'}
              </button>
            </div>
          )}
        </div>

        {/* Demo Helper Notice */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Shop Categories: Clothing & General Store • Currency: PKR (Rs.)</p>
        </div>
      </div>
    </div>
  );
}
