'use client';

import React from 'react';
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

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
    <aside className="w-64 border-r border-[#2B3950] bg-[#080D19] p-4 shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {navigationGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                {group.group}
              </div>
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
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#151F32] border border-transparent hover:border-[#2B3950]/60 active:scale-[0.99] focus-ring transition-all duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 text-[#64748B] group-hover:text-indigo-400 transition-colors" />
                        <span>{item.name}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#64748B] group-hover:text-indigo-400 opacity-60 group-hover:opacity-100 transition-all" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 focus-ring border ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 shadow-subtle border-indigo-500/30 font-bold'
                        : 'border-transparent text-[#A1AEC2] hover:text-[#F1F5F9] hover:bg-[#151F32] hover:border-[#2B3950]/60 active:scale-[0.99]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-indigo-400'
                          : 'text-[#64748B] group-hover:text-indigo-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Organization footer affiliation widget */}
      {(user.company?.name || user.recruiterProfile?.companyName) && (
        <div className="p-3.5 bg-[#151F32] border border-[#2B3950] rounded-2xl shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F1F5F9] truncate">
            <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">{user.company?.name || user.recruiterProfile?.companyName}</span>
          </div>
          <div className="text-[11px] text-[#A1AEC2] truncate mt-0.5 ml-5.5">
            {user.role === 'COMPANY'
              ? 'Organization Admin'
              : user.recruiterProfile?.title || 'Recruitment Partner'}
          </div>
        </div>
      )}
    </aside>
  );
};
