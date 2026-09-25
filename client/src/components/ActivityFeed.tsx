import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Activity, Radio } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';

interface ActivityFeedProps {
  title?: string;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title = 'Live Activity Feed',
  maxItems = 20,
}) => {
  const { activities } = useWebSocket();
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center space-x-1.5 bg-blue-500/10 text-blue-400 text-[11px] font-medium px-2.5 py-1 rounded-full border border-blue-500/20">
          <Radio className="w-3 h-3 animate-pulse text-blue-400" />
          <span>Real-time</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {displayActivities.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No activity events recorded yet
          </p>
        ) : (
          displayActivities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-800/80 hover:border-slate-700 transition flex items-start space-x-3 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 font-medium leading-relaxed">
                  {act.message}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                  {act.project?.name && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {act.project.name}
                    </span>
                  )}
                  <span>·</span>
                  <span>{timeAgo(act.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
