import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { ActivityFeed } from '../../components/ActivityFeed';
import { TaskFilterBar, FilterState } from '../../components/TaskFilterBar';
import { CreateProjectModal } from '../../components/CreateProjectModal';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { CreateClientModal } from '../../components/CreateClientModal';
import { Task, Project } from '../../types';
import {
  FolderGit2,
  Calendar,
  AlertCircle,
  Plus,
  Clock,
  Layers,
  Building2,
} from 'lucide-react';

export const PMDashboard: React.FC = () => {
  const { taskUpdateSignal } = useWebSocket();
  const [metrics, setMetrics] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Sync filters with URL query parameters
  const [filters, setFilters] = useState<FilterState>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      status: (params.get('status') as any) || 'ALL',
      priority: (params.get('priority') as any) || 'ALL',
      dueDateRange: (params.get('dueDateRange') as any) || 'ALL',
    };
  });

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.status && newFilters.status !== 'ALL') params.set('status', newFilters.status);
    if (newFilters.priority && newFilters.priority !== 'ALL') params.set('priority', newFilters.priority);
    if (newFilters.dueDateRange && newFilters.dueDateRange !== 'ALL') params.set('dueDateRange', newFilters.dueDateRange);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState(null, '', newUrl);
  };

  const loadData = useCallback(async () => {
    try {
      const queryParts: string[] = [];
      if (filters.status && filters.status !== 'ALL') queryParts.push(`status=${filters.status}`);
      if (filters.priority && filters.priority !== 'ALL') queryParts.push(`priority=${filters.priority}`);
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const [metricsData, projectsData, tasksData] = await Promise.all([
        apiRequest('/api/dashboard'),
        apiRequest<Project[]>('/api/projects'),
        apiRequest<Task[]>(`/api/tasks${queryString}`),
      ]);

      setMetrics(metricsData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData, taskUpdateSignal]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Manager Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Managing owned client projects, team task delegations, and delivery schedules
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow transition"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>New Client</span>
          </button>

          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {/* Mandatory Metric Cards (Spec 6: own project summary, tasks by priority, upcoming due dates this week) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Own Projects Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">My Managed Projects</span>
            <FolderGit2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {metrics?.ownProjectsCount ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Strict ownership isolation: only projects you created
          </span>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tasks By Priority</span>
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-center space-x-2 mt-3 text-xs font-bold">
            <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300">
              CRITICAL: {metrics?.tasksByPriority?.CRITICAL ?? 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300">
              HIGH: {metrics?.tasksByPriority?.HIGH ?? 0}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-2">
            <span>MEDIUM: {metrics?.tasksByPriority?.MEDIUM ?? 0}</span>
            <span>·</span>
            <span>LOW: {metrics?.tasksByPriority?.LOW ?? 0}</span>
          </div>
        </div>

        {/* Upcoming Due Dates This Week */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Due This Week</span>
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3">
            {metrics?.upcomingTasksThisWeek?.length ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tasks scheduled within the next 7 days
          </span>
        </div>
      </div>

      {/* Main Grid: Projects & Upcoming + Team Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Due Dates This Week List */}
          {metrics?.upcomingTasksThisWeek?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Upcoming Due Dates This Week
                </h3>
              </div>
              <div className="space-y-2">
                {metrics.upcomingTasksThisWeek.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">
                        Task #{t.taskNumber}: {t.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Assigned to: {t.assignedTo?.name || 'Unassigned'} ({t.project.name})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-emerald-400">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managed Client Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-white text-sm mb-4">My Client Projects ({projects.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3 text-right">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-200">{p.name}</td>
                      <td className="py-3 text-slate-400">{p.client.name}</td>
                      <td className="py-3 text-right font-medium text-slate-300">
                        {p._count?.tasks ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* URL Filter Bar */}
          <TaskFilterBar filters={filters} onChange={updateFilters} />

          {/* Managed Tasks List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Managed Tasks ({tasks.length})</h2>
              <span className="text-[11px] text-slate-500 font-mono">
                URL params: {window.location.search || 'None'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-3">#</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Assignee</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3 text-slate-500 font-mono">#{t.taskNumber}</td>
                      <td className="py-3 font-medium text-slate-200">
                        {t.title}
                        {t.isOverdue && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">{t.assignedTo?.name || 'Unassigned'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'CRITICAL'
                              ? 'bg-rose-900/60 text-rose-300'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-900/60 text-amber-300'
                              : t.priority === 'MEDIUM'
                              ? 'bg-blue-900/60 text-blue-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="IN_REVIEW">IN REVIEW</option>
                          <option value="DONE">DONE</option>
                        </select>
                      </td>
                      <td className="py-3 text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PM Role Scoped Live Feed (Spec 4: PM sees activity ONLY from their own projects) */}
        <div className="lg:col-span-1">
          <ActivityFeed title="My Projects Live Activity" maxItems={20} />
        </div>
      </div>

      {/* Modals */}
      <CreateClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={loadData}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={loadData}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
