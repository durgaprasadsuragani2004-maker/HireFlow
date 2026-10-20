'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS } from '../../providers/AuthContext';
import { api, DOCS_URL } from '../../lib/api';
import { Badge } from '../ui/Badge';
import {
  Bell,
  Briefcase,
  ChevronDown,
  LogOut,
  User,
  CheckCheck,
  Building,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  FileText,
  Users,
  Calendar,
  Building2,
  UserCheck,
  Activity,
  Shield,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, switchDemoUser } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch {
      // Ignore notification fetch errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const role = user?.role;

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'] },
    { name: role === 'APPLICANT' ? 'Browse Jobs' : 'Job Postings', href: '/jobs', icon: Briefcase, roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'] },
    { name: 'Kanban Pipeline', href: '/applications/kanban/default', icon: Layers, roles: ['RECRUITER', 'SUPER_ADMIN'] },
    { name: 'My Applications', href: '/applications/my', icon: FileText, roles: ['APPLICANT'] },
    { name: 'Talent Pool', href: '/applicants', icon: Users, roles: ['RECRUITER', 'SUPER_ADMIN'] },
    { name: 'Interviews', href: '/interviews', icon: Calendar, roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'] },
    { name: 'Company Profile', href: '/profile', icon: Building2, roles: ['RECRUITER'] },
    { name: 'User Management', href: '/admin/users', icon: UserCheck, roles: ['SUPER_ADMIN'] },
    { name: 'Audit Trail', href: '/admin/audit', icon: Activity, roles: ['SUPER_ADMIN'] },
    { name: 'API Docs', href: DOCS_URL, icon: Shield, roles: ['SUPER_ADMIN'], external: true },
  ];

  const filteredNav = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent">
                HireFlow
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 -mt-1">
                Recruitment ATS
              </span>
            </div>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Switch Demo Role</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {demoMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
                onMouseLeave={() => setDemoMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Instant Role Impersonation
                </div>
                {Object.entries(DEMO_ACCOUNTS).map(([key, demo]) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchDemoUser(key as any);
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {demo.label}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {demo.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              {/* Notification Popover */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  aria-label="Open notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setNotificationsOpen(false)}
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Notifications ({unreadCount})
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                              !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                              {n.title}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 leading-relaxed">
                              {n.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="User profile menu"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center text-xs uppercase shadow-sm">
                    {user.applicantProfile?.fullName?.[0] || user.email[0]}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">
                      {user.applicantProfile?.fullName || user.email.split('@')[0]}
                    </span>
                    <Badge
                      variant={
                        user.role === 'SUPER_ADMIN'
                          ? 'purple'
                          : user.role === 'RECRUITER'
                          ? 'info'
                          : 'default'
                      }
                      className="text-[10px] py-0 px-1.5"
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.email}
                      </div>
                      {user.recruiterProfile?.companyName && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {user.recruiterProfile.companyName}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {role?.replace('_', ' ')} MENU
          </div>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </a>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
