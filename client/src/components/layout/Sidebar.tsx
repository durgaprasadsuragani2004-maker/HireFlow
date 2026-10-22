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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const navigation = [
    // Common
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'],
    },
    // Jobs
    {
      name: role === 'APPLICANT' ? 'Browse Jobs' : 'Job Postings',
      href: '/jobs',
      icon: Briefcase,
      roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'],
    },
    // Recruiter / Admin Pipeline
    {
      name: 'Kanban Pipeline',
      href: '/applications/kanban/default',
      icon: Layers,
      roles: ['RECRUITER', 'SUPER_ADMIN'],
    },
    // Applicant Applications
    {
      name: 'My Applications',
      href: '/applications/my',
      icon: FileText,
      roles: ['APPLICANT'],
    },
    // Candidate search
    {
      name: 'Talent Pool',
      href: '/applicants',
      icon: Users,
      roles: ['RECRUITER', 'SUPER_ADMIN'],
    },
    // Interviews
    {
      name: 'Interviews',
      href: '/interviews',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'RECRUITER', 'APPLICANT'],
    },
    // Recruiter Company Profile
    {
      name: 'Company Profile',
      href: '/profile',
      icon: Building2,
      roles: ['RECRUITER'],
    },
    // Super Admin System Management
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
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 shrink-0 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {role.replace('_', ' ')} WORKSPACE
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
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
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
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {user.recruiterProfile?.companyName && (
        <div className="p-3 bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs">
          <div className="font-semibold text-slate-900 dark:text-white truncate">
            {user.recruiterProfile.companyName}
          </div>
          <div className="text-slate-500 truncate mt-0.5">
            {user.recruiterProfile.title || 'Recruitment Lead'}
          </div>
        </div>
      )}
    </aside>
  );
};
