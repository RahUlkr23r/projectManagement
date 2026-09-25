import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { ActivityFeed } from '../../components/ActivityFeed';
import { TaskFilterBar, FilterState } from '../../components/TaskFilterBar';
import { Task, TaskStatus } from '../../types';
import {
  Clock,
  PlayCircle,
  Eye,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { taskUpdateSignal } = useWebSocket();
  const [metrics, setMetrics] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

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

      const [metricsData, tasksData] = await Promise.all([
        apiRequest('/api/dashboard'),
        apiRequest<Task[]>(`/api/tasks${queryString}`),
      ]);

      setMetrics(metricsData);
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

  // Status transition handler
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // The WebSocket TASK_UPDATED event and local state update will trigger
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Developer Workspace</h1>
        <p className="text-xs text-slate-400 mt-1">
          Assigned tasks automatically sorted by priority and due date with instant real-time sync
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Assigned</span>
          <p className="text-3xl font-extrabold text-white mt-2">
            {metrics?.totalAssigned ?? 0}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">In Progress</span>
          <p className="text-3xl font-extrabold text-blue-400 mt-2">
            {metrics?.inProgressCount ?? 0}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Completed</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            {metrics?.completedCount ?? 0}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Overdue</span>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">
            {metrics?.overdueCount ?? 0}
          </p>
        </div>
      </div>

      {/* Main Grid: Task Cards + Developer Scoped Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* URL Filter Bar */}
          <TaskFilterBar filters={filters} onChange={updateFilters} />

          {/* Task Board / List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">
                Assigned Tasks ({tasks.length}) — Sorted by Priority & Due Date
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                URL params: {window.location.search || 'None'}
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                No tasks match your selected filter criteria
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-sm transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">
                          #{task.taskNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-900/60 text-rose-300'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-900/60 text-amber-300'
                              : task.priority === 'MEDIUM'
                              ? 'bg-blue-900/60 text-blue-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.isOverdue && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>OVERDUE</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-100 text-base mt-1.5">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Current Status
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          task.status === 'DONE'
                            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                            : task.status === 'IN_REVIEW'
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center space-x-4">
                      {task.project?.name && (
                        <span>Project: <strong className="text-slate-300">{task.project.name}</strong></span>
                      )}
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
                      {task.status !== 'TODO' && (
                        <button
                          disabled={updatingTaskId === task.id}
                          onClick={() => handleStatusChange(task.id, 'TODO')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                        >
                          To Do
                        </button>
                      )}

                      {task.status !== 'IN_PROGRESS' && (
                        <button
                          disabled={updatingTaskId === task.id}
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/40 text-blue-300 text-[11px] font-medium transition"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      )}

                      {task.status !== 'IN_REVIEW' && (
                        <button
                          disabled={updatingTaskId === task.id}
                          onClick={() => handleStatusChange(task.id, 'IN_REVIEW')}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/40 text-purple-300 text-[11px] font-medium transition"
                          title="Notify PM for review"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Submit Review</span>
                        </button>
                      )}

                      {task.status !== 'DONE' && (
                        <button
                          disabled={updatingTaskId === task.id}
                          onClick={() => handleStatusChange(task.id, 'DONE')}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 text-[11px] font-medium transition"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Developer Role Scoped Live Feed (Spec 4: Developer sees activity ONLY on tasks assigned to them) */}
        <div className="lg:col-span-1">
          <ActivityFeed title="My Assigned Tasks Activity" maxItems={20} />
        </div>
      </div>
    </div>
  );
};
