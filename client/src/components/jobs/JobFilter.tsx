'use client';

import React from 'react';
import { Search, MapPin, Briefcase, Award, X, RotateCcw } from 'lucide-react';

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
    <div className="skeuo-card p-4 sm:p-5 mb-6 border border-[#E4E3EF] shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9EB3] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, skills, keywords..."
            className="skeuo-input w-full pl-10 pr-8 h-11 text-xs rounded-xl"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="neu-icon-btn absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#68677D] hover:text-[#202033] cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Location Input */}
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9EB3] pointer-events-none" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or 'Remote'..."
            className="skeuo-input w-full pl-10 pr-8 h-11 text-xs rounded-xl"
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation('')}
              className="neu-icon-btn absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#68677D] hover:text-[#202033] cursor-pointer"
              title="Clear location"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Employment Type */}
        <div className="relative">
          <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9EB3] pointer-events-none" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="skeuo-input w-full pl-10 pr-8 h-11 text-xs rounded-xl cursor-pointer"
          >
            <option value="" className="bg-white text-[#202033]">All Employment Types</option>
            <option value="FULL_TIME" className="bg-white text-[#202033]">Full Time</option>
            <option value="PART_TIME" className="bg-white text-[#202033]">Part Time</option>
            <option value="CONTRACT" className="bg-white text-[#202033]">Contract</option>
            <option value="INTERNSHIP" className="bg-white text-[#202033]">Internship</option>
          </select>
        </div>

        {/* Experience Level */}
        <div className="relative">
          <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9EB3] pointer-events-none" />
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="skeuo-input w-full pl-10 pr-8 h-11 text-xs rounded-xl cursor-pointer"
          >
            <option value="" className="bg-white text-[#202033]">All Experience Levels</option>
            <option value="ENTRY_LEVEL" className="bg-white text-[#202033]">Entry Level</option>
            <option value="MID_LEVEL" className="bg-white text-[#202033]">Mid Level</option>
            <option value="SENIOR" className="bg-white text-[#202033]">Senior Level</option>
            <option value="LEAD" className="bg-white text-[#202033]">Lead / Principal</option>
            <option value="EXECUTIVE" className="bg-white text-[#202033]">Executive</option>
          </select>
        </div>
      </div>

      {/* Active Filter Pills and Clear Action */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3.5 mt-3.5 border-t border-[#E4E3EF] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#68677D] text-[11px] font-semibold">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/35 shadow-sm">
                <span>&quot;{search}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:text-[#5B4BD8] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/35 shadow-sm">
                <span>Location: {location}</span>
                <button
                  type="button"
                  onClick={() => setLocation('')}
                  className="hover:text-[#5B4BD8] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {employmentType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/35 shadow-sm">
                <span>Type: {employmentType.replace('_', ' ')}</span>
                <button
                  type="button"
                  onClick={() => setEmploymentType('')}
                  className="hover:text-[#5B4BD8] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {experienceLevel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#EAE7FF] text-[#6C5CE7] border border-[#8B7CF6]/35 shadow-sm">
                <span>Level: {experienceLevel.replace('_', ' ')}</span>
                <button
                  type="button"
                  onClick={() => setExperienceLevel('')}
                  className="hover:text-[#5B4BD8] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="neu-btn-secondary px-3 py-1 text-[11px] font-bold text-[#6C5CE7] hover:text-[#5B4BD8] rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
