import React from 'react';
import { Filter, X } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../types';

export interface FilterState {
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  dueDateRange?: 'ALL' | 'OVERDUE' | 'THIS_WEEK' | 'FUTURE';
}

interface TaskFilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({ filters, onChange }) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      status: e.target.value as any,
    });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      priority: e.target.value as any,
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      dueDateRange: e.target.value as any,
    });
  };

  const clearFilters = () => {
    onChange({
      status: 'ALL',
      priority: 'ALL',
      dueDateRange: 'ALL',
    });
  };

  const hasActiveFilters =
    (filters.status && filters.status !== 'ALL') ||
    (filters.priority && filters.priority !== 'ALL') ||
    (filters.dueDateRange && filters.dueDateRange !== 'ALL');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold uppercase tracking-wider">
        <Filter className="w-4 h-4 text-blue-400" />
        <span>Filters (URL Synced):</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-xs text-slate-400">Status:</label>
          <select
            value={filters.status || 'ALL'}
            onChange={handleStatusChange}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-xs text-slate-400">Priority:</label>
          <select
            value={filters.priority || 'ALL'}
            onChange={handlePriorityChange}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Due Date Range Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-xs text-slate-400">Due Date:</label>
          <select
            value={filters.dueDateRange || 'ALL'}
            onChange={handleDateChange}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Due Dates</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="THIS_WEEK">Due This Week</option>
            <option value="FUTURE">Future Due Dates</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};
