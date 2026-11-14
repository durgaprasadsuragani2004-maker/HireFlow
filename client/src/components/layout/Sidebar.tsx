'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthContext';
import { DOCS_URL } from '@/lib/api';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Layers,
  FileText,
  Shield,
  Activity,
  UserCheck,
  Building2,
  ExternalLink,
  Pin,
  PinOff,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Sidebar interaction states
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize pinned state from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedPin = localStorage.getItem('hireflow_sidebar_pinned');
      if (savedPin === 'true') {
        setIsPinned(true);
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    try {
      localStorage.setItem('hireflow_sidebar_pinned', String(nextPinned));
    } catch {
      // Ignore
    }
  };

  if (!user) return null;

  const role = user.role;
  // Expanded if hovered, pinned, or not yet mounted (to prevent SSR flash)
  const isExpanded = isPinned || isHovered;

  // Grouped Navigation Structure
  const navigationGroups = [
    {
      group: 'Workspace',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'],
        },
        {
          name: role === 'APPLICANT' ? 'Browse Jobs' : 'Job Postings',
          href: '/jobs',
          icon: Briefcase,
          roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'],
        },
      ],
    },
    {
      group: role === 'APPLICANT' ? 'My Career' : 'Recruitment Pipeline',
      items: [
        {
          name: 'Kanban Pipeline',
          href: '/applications/kanban/default',
          icon: Layers,
          roles: ['COMPANY', 'RECRUITER', 'SUPER_ADMIN'],
        },
        {
          name: 'My Applications',
          href: '/applications/my',
          icon: FileText,
          roles: ['APPLICANT'],
        },
        {
          name: 'Talent Pool',
          href: '/applicants',
          icon: Users,
          roles: ['COMPANY', 'RECRUITER', 'SUPER_ADMIN'],
        },
        {
          name: 'Interviews',
          href: '/interviews',
          icon: Calendar,
          roles: ['SUPER_ADMIN', 'COMPANY', 'RECRUITER', 'APPLICANT'],
        },
        {
          name: 'Company Profile',
          href: '/profile',
          icon: Building2,
          roles: ['COMPANY', 'RECRUITER'],
        },
        {
          name: 'Team Recruiters',
          href: '/admin/users',
          icon: UserCheck,
          roles: ['COMPANY'],
        },
      ],
    },
    {
      group: 'Governance & Docs',
      items: [
        {
          name: 'Organizations',
          href: '/admin/companies',
          icon: Building2,
          roles: ['SUPER_ADMIN'],
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: UserCheck,
          roles: ['SUPER_ADMIN'],
        },
        {
          name: 'Audit Trail',
          href: '/admin/audit',
          icon: Activity,
          roles: ['SUPER_ADMIN'],
        },
        {
          name: 'API Documentation',
          href: DOCS_URL,
          icon: Shield,
          roles: ['SUPER_ADMIN'],
          external: true,
        },
      ],
    },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Main Navigation Sidebar"
      className={`glass-sidebar shrink-0 flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out z-30 select-none ${
        isExpanded ? 'w-64 p-4' : 'w-[72px] p-3'
      }`}
    >
      <div className="space-y-5">
        {/* Sidebar Header: Branding & Pin Control */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E3EF]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8B7CF6] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-[0_2px_10px_rgba(108,92,231,0.35)]">
              HF
            </div>
            {isExpanded && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-200">
                <span className="text-sm font-extrabold text-[#202033] tracking-tight">HireFlow</span>
                <span className="text-[10px] font-semibold text-[#8B7CF6] uppercase tracking-wider">Enterprise ATS</span>
              </div>
            )}
          </div>

          {/* Pin / Unpin button (available when expanded) */}
          {isExpanded && (
            <button
              type="button"
              onClick={togglePin}
              title={isPinned ? 'Unpin sidebar (hover mode)' : 'Pin sidebar expanded'}
              className={`p-1.5 rounded-lg border transition-all text-xs focus-ring ${
                isPinned
                  ? 'bg-[#EAE7FF] text-[#6C5CE7] border-[#8B7CF6]/40 shadow-sm'
                  : 'text-[#68677D] hover:text-[#202033] hover:bg-[#F0F1F8] border-transparent'
              }`}
            >
              {isPinned ? <Pin className="w-3.5 h-3.5 fill-[#6C5CE7]" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          {navigationGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Section Header */}
                {isExpanded ? (
                  <div className="px-3 py-1 text-[10px] font-bold text-[#68677D] uppercase tracking-wider whitespace-nowrap transition-opacity duration-200">
                    {group.group}
                  </div>
                ) : (
                  <div className="my-2 border-t border-[#E4E3EF]/70 mx-1" />
                )}

                {/* Section Items */}
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      item.href !== '/admin/users' &&
                      item.href !== '/applications/kanban/default' &&
                      pathname.startsWith(item.href)) ||
                    (item.href === '/applications/kanban/default' &&
                      pathname.startsWith('/applications/kanban'));
                  const Icon = item.icon;

                  if (item.external) {
                    return (
                      <div key={item.name} className="relative group">
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-ring border ${
                            isExpanded
                              ? 'px-3 py-2.5 justify-between text-[#68677D] hover:text-[#202033] hover:bg-[#F0F1F8] border-transparent hover:border-[#E4E3EF]'
                              : 'w-11 h-11 mx-auto justify-center text-[#68677D] hover:text-[#6C5CE7] hover:bg-[#F0F1F8] border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0 transition-colors text-[#68677D] group-hover:text-[#6C5CE7]" />
                            {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
                          </div>
                          {isExpanded && (
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          )}
                        </a>

                        {/* Floating Tooltip in Collapsed Mode */}
                        {!isExpanded && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#202033] text-white text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            {item.name}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={item.name} className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-ring border ${
                          isExpanded
                            ? `px-3 py-2.5 gap-2.5 ${
                                isActive
                                  ? 'bg-[#EAE7FF] text-[#6C5CE7] border-[#8B7CF6]/40 shadow-sm font-bold'
                                  : 'border-transparent text-[#68677D] hover:text-[#202033] hover:bg-[#F0F1F8] hover:border-[#E4E3EF]'
                              }`
                            : `w-11 h-11 mx-auto justify-center ${
                                isActive
                                  ? 'bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/50 shadow-sm font-bold'
                                  : 'border-transparent text-[#68677D] hover:text-[#6C5CE7] hover:bg-[#F0F1F8]'
                              }`
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#6C5CE7]' : 'text-[#68677D] group-hover:text-[#6C5CE7]'
                          }`}
                        />
                        {isExpanded && (
                          <span className="whitespace-nowrap transition-opacity duration-200">
                            {item.name}
                          </span>
                        )}
                      </Link>

                      {/* Floating Tooltip in Collapsed Mode */}
                      {!isExpanded && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#202033] text-white text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Organization footer affiliation widget */}
      {(user.company?.name || user.recruiterProfile?.companyName) && (
        <div className={`transition-all duration-200 ${isExpanded ? 'skeuo-elevated p-3 border border-[#E4E3EF]' : 'text-center py-2'}`}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2 text-xs font-bold text-[#202033] truncate">
                <Building2 className="w-3.5 h-3.5 text-[#6C5CE7] shrink-0" />
                <span className="truncate">{user.company?.name || user.recruiterProfile?.companyName}</span>
              </div>
              <div className="text-[11px] text-[#68677D] truncate mt-0.5 ml-5.5">
                {user.role === 'COMPANY'
                  ? 'Organization Admin'
                  : user.recruiterProfile?.title || 'Recruitment Partner'}
              </div>
            </>
          ) : (
            <div className="relative group inline-flex justify-center">
              <div className="w-9 h-9 mx-auto rounded-xl bg-[#F0F1F8] border border-[#E4E3EF] flex items-center justify-center text-[#6C5CE7]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="absolute left-full bottom-0 ml-3 px-2.5 py-1 bg-[#202033] text-white text-xs font-semibold rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {user.company?.name || user.recruiterProfile?.companyName}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
