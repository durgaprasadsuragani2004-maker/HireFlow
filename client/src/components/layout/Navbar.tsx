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
    <header className="sticky top-0 z-40 w-full glass-navbar border-b border-[#E4E3EF] bg-white/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neu-icon-btn p-2 rounded-xl md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#202033]" /> : <Menu className="w-5 h-5 text-[#202033]" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF6] flex items-center justify-center text-white shadow-[0_2px_10px_rgba(108,92,231,0.35)] border border-white/40 group-hover:from-[#5B4BD8] group-hover:to-[#7C6CF0] transition-all">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-[#202033] tracking-tight">
                  HireFlow
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[10px] font-bold text-[#6C5CE7] uppercase tracking-wider">
                  ATS
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#68677D] -mt-1 hidden sm:block">
                Talent & Recruitment Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Notification Popover (Glassmorphic floating menu in White & Violet) */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`neu-icon-btn relative p-2 rounded-xl cursor-pointer ${
                    notificationsOpen ? 'shadow-neu-pressed translate-y-[1px] text-[#6C5CE7] border-[#8B7CF6]' : ''
                  }`}
                  aria-label="Open notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E05260] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="glass-dropdown absolute right-0 mt-2 w-80 sm:w-96 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#E4E3EF]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#202033]">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#EAE7FF] border border-[#8B7CF6]/30 text-[#6C5CE7] text-[10px] font-bold">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-[#6C5CE7] hover:text-[#5B4BD8] flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E3EF]/60 mt-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#68677D]">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id)}
                            className={`p-3 text-xs cursor-pointer rounded-xl hover:bg-[#F8F8FC] transition-colors ${
                              !n.read ? 'bg-[#EAE7FF]/40 border-l-2 border-[#6C5CE7]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-bold text-[#202033] truncate">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-[#6C5CE7] shrink-0" />
                              )}
                            </div>
                            <div className="text-[#68677D] leading-relaxed text-[11px]">
                              {n.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown (Glassmorphic floating menu) */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`neu-btn-secondary flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer ${
                    userMenuOpen ? 'shadow-neu-pressed translate-y-[1px] border-[#8B7CF6]' : ''
                  }`}
                  aria-label="User profile menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF6] text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm border border-white/40">
                    {user.applicantProfile?.fullName?.[0] || user.company?.name?.[0] || user.email[0]}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#202033] max-w-[120px] truncate leading-tight">
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
                      className="text-[9px] py-0 px-1.5 mt-0.5"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#68677D] transition-transform duration-150" />
                </button>

                {userMenuOpen && (
                  <div className="glass-dropdown absolute right-0 mt-2 w-64 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[#E4E3EF]">
                      <div className="font-bold text-[#202033] truncate">
                        {user.applicantProfile?.fullName || user.company?.name || user.email}
                      </div>
                      <div className="text-[11px] text-[#68677D] truncate font-mono">
                        {user.email}
                      </div>
                      {(user.company?.name || user.recruiterProfile?.companyName) && (
                        <div className="text-[11px] text-[#16A878] bg-[#16A878]/10 border border-[#16A878]/20 rounded-lg px-2 py-1 flex items-center gap-1.5 mt-2 font-medium">
                          <Building className="w-3 h-3 text-[#16A878] shrink-0" />
                          <span className="truncate">{user.company?.name || user.recruiterProfile?.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8F8FC] text-[#68677D] hover:text-[#202033] font-semibold transition-all duration-150"
                      >
                        <User className="w-4 h-4 text-[#68677D] group-hover:text-[#6C5CE7] transition-colors" />
                        <span>Account & Profile</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F8F8FC] text-[#68677D] hover:text-[#202033] font-semibold transition-all duration-150"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#68677D] group-hover:text-[#6C5CE7] transition-colors" />
                        <span>My Dashboard</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#E4E3EF]">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[#E05260] hover:text-[#C53030] hover:bg-[#E05260]/10 rounded-lg font-semibold transition-all duration-150 text-left active:scale-[0.99] cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#E05260]" />
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
                className="neu-btn-secondary px-3.5 py-1.5 text-xs font-semibold rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="neu-btn-primary px-4 py-1.5 text-xs font-semibold rounded-xl"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-[#E4E3EF] bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="px-3 py-1 text-[10px] font-bold text-[#68677D] uppercase tracking-wider">
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
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-[#68677D] hover:bg-[#F8F8FC]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-[#68677D]" />
                    <span>{item.name}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#68677D]" />
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
                    ? 'bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/40 font-bold'
                    : 'text-[#68677D] hover:bg-[#F8F8FC]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#6C5CE7]' : 'text-[#68677D]'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[#E4E3EF] mt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#E05260] hover:bg-[#E05260]/10 rounded-xl text-left cursor-pointer"
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
