'use client';

import React from 'react';
import { Search, MapPin, Filter } from 'lucide-react';

interface JobFilterProps {
  search: string;
  setSearch: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  employmentType: string;
  setEmploymentType: (val: string) => void;
  experienceLevel: string;
  setExperienceLevel: (val: string) => void;
}

export const JobFilter: React.FC<JobFilterProps> = ({
  search,
  setSearch,
  location,
  setLocation,
  employmentType,
  setEmploymentType,
  experienceLevel,
  setExperienceLevel,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, skills, keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location Input */}
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or 'Remote'..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Employment Type */}
        <div>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employment Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Experience Levels</option>
            <option value="ENTRY_LEVEL">Entry Level</option>
            <option value="MID_LEVEL">Mid Level</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead / Staff</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </div>
      </div>
    </div>
  );
};
