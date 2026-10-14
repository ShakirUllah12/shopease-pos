import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = {
    success: (msg, dur) => addNotification(msg, 'success', dur),
    error: (msg, dur) => addNotification(msg, 'error', dur || 5000),
    warning: (msg, dur) => addNotification(msg, 'warning', dur),
    info: (msg, dur) => addNotification(msg, 'info', dur),
  };

  return (
    <NotificationContext.Provider value={{ notify, notifications, removeNotification }}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-lg shadow-lg text-sm font-medium border flex items-center justify-between transition-all transform animate-in fade-in slide-in-from-bottom-2 ${
              n.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
                : n.type === 'error'
                ? 'bg-rose-900/90 text-rose-100 border-rose-700'
                : n.type === 'warning'
                ? 'bg-amber-900/90 text-amber-100 border-amber-700'
                : 'bg-slate-800/90 text-slate-100 border-slate-700'
            }`}
          >
            <span>{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="ml-3 text-xs opacity-70 hover:opacity-100 focus:outline-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.notify;
}
