import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Check, CheckCheck, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export function TopNav() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item._id);
    }
    setIsOpen(false);
    if (item.entityType === 'ORDER') {
      navigate('/orders');
    } else if (item.entityType === 'ALERT') {
      navigate('/alerts');
    } else if (item.entityType === 'SETTLEMENT') {
      navigate('/settlements');
    } else if (item.entityType === 'PRODUCT') {
      navigate('/dashboard');
    } else {
      navigate('/alerts');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Demo User';

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-6 shadow-sm relative z-30">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full max-w-md flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="search-field"
              className="block h-10 w-full rounded-full border-0 py-0 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm bg-slate-50/50 hover:bg-slate-50 transition-colors"
              placeholder="Search products, keywords, or categories..."
              type="search"
              name="search"
            />
          </div>
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications Bell & Popover */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) fetchNotifications();
              }}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-50">
                <div className="p-3.5 flex items-center justify-between bg-slate-50/70 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.read;
                      return (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start ${
                            isUnread ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {notif.severity === 'CRITICAL' ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : notif.severity === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className={`text-xs font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            {notif.entityType && (
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                                <span>View {notif.entityType.toLowerCase()}</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          {isUnread && (
                            <button
                              title="Mark as read"
                              onClick={(e) => markAsRead(notif._id, e)}
                              className="shrink-0 text-slate-400 hover:text-indigo-600 p-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />
          
          <div className="flex items-center gap-x-3">
            <div className="flex items-center gap-x-2.5 py-1 px-2.5 rounded-full bg-slate-50 border border-slate-200">
              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="hidden lg:flex lg:flex-col text-left">
                <span className="text-xs font-semibold leading-none text-slate-900">
                  {displayName}
                </span>
                {user?.role && (
                  <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                    {user.role}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

