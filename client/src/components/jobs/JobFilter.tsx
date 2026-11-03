'use client';

import React from 'react';
import { Search, MapPin, Briefcase, Award, X } from 'lucide-react';

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
  const hasActiveFilters = Boolean(search || location || employmentType || experienceLevel);

  const handleClearAll = () => {
    setSearch('');
    setLocation('');
    setEmploymentType('');
    setExperienceLevel('');
  };

  return (
    <div className="bg-[#151F32] border border-[#2B3950] rounded-2xl p-4 shadow-card mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, skills, keywords..."
            className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-[#2B3950] hover:border-[#3E506D] bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 p-0.5 text-[#64748B] hover:text-[#F1F5F9] active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Location Input */}
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or 'Remote'..."
            className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-[#2B3950] hover:border-[#3E506D] bg-[#101726] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
          {location && (
            <button
              onClick={() => setLocation('')}
              className="absolute right-3 top-2.5 p-0.5 text-[#64748B] hover:text-[#F1F5F9] active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Employment Type */}
        <div className="relative">
          <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B] pointer-events-none" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-[#2B3950] hover:border-[#3E506D] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Employment Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>

        {/* Experience Level */}
        <div className="relative">
          <Award className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B] pointer-events-none" />
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-[#2B3950] hover:border-[#3E506D] bg-[#101726] text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Experience Levels</option>
            <option value="ENTRY_LEVEL">Entry Level</option>
            <option value="MID_LEVEL">Mid Level</option>
            <option value="SENIOR_LEVEL">Senior Level</option>
            <option value="LEAD">Lead / Staff</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-[#2B3950] flex items-center justify-between">
          <span className="text-[11px] text-[#A1AEC2]">Filtered Results</span>
          <button
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
