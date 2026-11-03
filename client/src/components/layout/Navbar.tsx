'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthContext';
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
  ExternalLink,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
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

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'] },
    { name: role === 'APPLICANT' ? 'Browse Jobs' : 'Job Postings', href: '/jobs', icon: Briefcase, roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'] },
    { name: 'Kanban Pipeline', href: '/applications/kanban/default', icon: Layers, roles: ['COMPANY', 'RECRUITER', 'SUPER_ADMIN'] },
    { name: 'My Applications', href: '/applications/my', icon: FileText, roles: ['APPLICANT'] },
    { name: 'Talent Pool', href: '/applicants', icon: Users, roles: ['COMPANY', 'RECRUITER', 'SUPER_ADMIN'] },
    { name: 'Interviews', href: '/interviews', icon: Calendar, roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'] },
    { name: 'Company Profile', href: '/profile', icon: Building2, roles: ['COMPANY', 'RECRUITER'] },
    { name: 'Team Recruiters', href: '/admin/users', icon: UserCheck, roles: ['COMPANY'] },
    { name: 'Organizations', href: '/admin/companies', icon: Building2, roles: ['SUPER_ADMIN'] },
    { name: 'User Management', href: '/admin/users', icon: UserCheck, roles: ['SUPER_ADMIN'] },
    { name: 'Audit Trail', href: '/admin/audit', icon: Activity, roles: ['SUPER_ADMIN'] },
    { name: 'API Docs', href: DOCS_URL, icon: Shield, roles: ['SUPER_ADMIN'], external: true },
  ];

  const filteredNav = role ? navigationItems.filter((item) => item.roles.includes(role)) : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2B3950] bg-[#080D19]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#151F32] md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 hover:shadow-glow-primary transition-all">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-[#F1F5F9] tracking-tight">
                  HireFlow
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  ATS
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#64748B] -mt-1 hidden sm:block">
                Talent & Recruitment Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Notification Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`relative p-2 rounded-xl text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#151F32] border border-transparent hover:border-[#2B3950] focus-ring active:scale-95 transition-all ${
                    notificationsOpen ? 'bg-[#151F32] text-[#F1F5F9] border-[#2B3950]' : ''
                  }`}
                  aria-label="Open notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#080D19]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1C2940] border border-[#2B3950] rounded-2xl shadow-dropdown py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B3950]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F1F5F9]">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#2B3950]/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#64748B]">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-[#1E2D47] transition-colors ${
                              !n.read ? 'bg-indigo-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-bold text-[#F1F5F9] truncate">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[#A1AEC2] leading-relaxed text-[11px]">
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
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#151F32] border border-transparent hover:border-[#2B3950] focus-ring active:scale-[0.98] transition-all ${
                    userMenuOpen ? 'bg-[#151F32] border-[#2B3950]' : ''
                  }`}
                  aria-label="User profile menu"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm">
                    {user.applicantProfile?.fullName?.[0] || user.company?.name?.[0] || user.email[0]}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#F1F5F9] max-w-[130px] truncate">
                      {user.applicantProfile?.fullName || user.company?.name || user.email.split('@')[0]}
                    </span>
                    <Badge
                      variant={
                        user.role === 'SUPER_ADMIN'
                          ? 'purple'
                          : user.role === 'COMPANY'
                          ? 'info'
                          : user.role === 'RECRUITER'
                          ? 'primary'
                          : 'default'
                      }
                      className="text-[10px] py-0 px-1.5"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#F1F5F9] transition-colors" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#1C2940] border border-[#2B3950] rounded-2xl shadow-dropdown py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#2B3950]">
                      <div className="font-bold text-[#F1F5F9] truncate">
                        {user.applicantProfile?.fullName || user.company?.name || user.email}
                      </div>
                      <div className="text-[11px] text-[#A1AEC2] truncate font-mono">
                        {user.email}
                      </div>
                      {(user.company?.name || user.recruiterProfile?.companyName) && (
                        <div className="text-[11px] text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2 py-1 flex items-center gap-1.5 mt-2 font-medium">
                          <Building className="w-3 h-3 text-teal-400 shrink-0" />
                          <span className="truncate">{user.company?.name || user.recruiterProfile?.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-2 hover:bg-[#1E2D47] text-[#A1AEC2] hover:text-[#F1F5F9] font-semibold transition-all duration-150"
                      >
                        <User className="w-4 h-4 text-[#64748B] group-hover:text-indigo-400 transition-colors" />
                        <span>Account & Profile</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-2 hover:bg-[#1E2D47] text-[#A1AEC2] hover:text-[#F1F5F9] font-semibold transition-all duration-150"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#64748B] group-hover:text-indigo-400 transition-colors" />
                        <span>My Dashboard</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#2B3950]">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 font-semibold transition-all duration-150 text-left active:scale-[0.99]"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#151F32] rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm hover:shadow-glow-primary transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-[#2B3950] bg-[#080D19] px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-dropdown">
          <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            {role?.replace('_', ' ')} MENU
          </div>
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-[#A1AEC2] hover:bg-[#151F32]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-[#64748B]" />
                    <span>{item.name}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                </a>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-[#A1AEC2] hover:bg-[#151F32]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-400' : 'text-[#64748B]'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#2B3950] mt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
