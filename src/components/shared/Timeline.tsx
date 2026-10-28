import { Clock, MessageSquare, AlertTriangle, CheckCircle2, XCircle, PlusCircle, Layers } from 'lucide-react';
import type { TimelineEvent } from '../../types';
import { format } from 'date-fns';

const ICON_MAP: Record<TimelineEvent['type'], React.ReactNode> = {
  created: <PlusCircle size={16} style={{ color: '#059669' }} />,
  updated: <Clock size={16} style={{ color: '#2563EB' }} />,
  note: <MessageSquare size={16} style={{ color: '#7C3AED' }} />,
  escalated: <AlertTriangle size={16} style={{ color: '#DC2626' }} />,
  resolved: <CheckCircle2 size={16} style={{ color: '#059669' }} />,
  closed: <XCircle size={16} style={{ color: '#6B7280' }} />,
  cluster_assigned: <Layers size={16} style={{ color: '#3B82F6' }} />,
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div
        style={{
          position: 'absolute',
          left: 7,
          top: 4,
          bottom: 4,
          width: 2,
          background: '#E5E7EB',
          borderRadius: 1,
        }}
      />
      {events.map((event, i) => (
        <div
          key={event.id}
          style={{
            position: 'relative',
            paddingBottom: i < events.length - 1 ? 20 : 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -28,
              top: 2,
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              borderRadius: '50%',
            }}
          >
            {ICON_MAP[event.type]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                {event.title}
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                {format(new Date(event.timestamp), 'MMM d, yyyy · h:mm a')}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: '1.5' }}>
              {event.description}
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>by {event.actor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
