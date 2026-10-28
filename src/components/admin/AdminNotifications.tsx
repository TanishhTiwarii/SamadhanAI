import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useNotifications, useStoreActions } from '../../hooks/useStore';
import { SeverityBadge } from '../shared/AdminBadges';
import type { Notification } from '../../types';

export function AdminNotifications() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { markNotificationRead, markAllNotificationsRead } = useStoreActions();

  const [filterType, setFilterType] = useState<string>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (onlyUnread && n.read) return false;
    if (filterType !== 'all') {
      if (filterType === 'cluster' && n.type !== 'cluster') return false;
      if (filterType === 'promise' && n.type !== 'promise') return false;
      if (filterType === 'alert' && n.type !== 'alert' && n.type !== 'error') return false;
    }
    return true;
  });

  const getIcon = (n: Notification) => {
    if (n.type === 'cluster') return <Layers size={18} color="#38BDF8" />;
    if (n.type === 'promise') return <Clock size={18} color="#F59E0B" />;
    if (n.type === 'success') return <CheckCircle2 size={18} color="#059669" />;
    if (n.type === 'error' || n.type === 'alert') return <AlertTriangle size={18} color="#EF4444" />;
    return <Info size={18} color="#3B82F6" />;
  };

  const handleClickItem = (n: Notification) => {
    markNotificationRead(n.id);
    if (n.clusterId) {
      navigate(`/admin/clusters/${n.clusterId}`);
    } else if (n.complaintId) {
      navigate(`/admin/complaint/${n.complaintId}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <Bell size={20} color="#38BDF8" />
          </div>
          <div>
            <h1 style={styles.title}>Operational Notifications</h1>
            <p style={styles.subtitle}>
              Aggregated incident telemetry, SLA breach warnings, and critical triage notifications
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {unreadCount > 0 && (
            <button style={styles.markAllBtn} onClick={markAllNotificationsRead}>
              <CheckCheck size={14} /> Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <Filter size={13} color="#6B7280" />
          <span style={styles.filterLabel}>FILTER:</span>
          {(['all', 'cluster', 'promise', 'alert'] as const).map((t) => (
            <button
              key={t}
              style={{
                ...styles.filterPill,
                backgroundColor: filterType === t ? '#E5E7EB' : 'transparent',
                color: filterType === t ? '#38BDF8' : '#6B7280',
                borderColor: filterType === t ? '#38BDF8' : 'transparent',
              }}
              onClick={() => setFilterType(t)}
            >
              {t === 'all'
                ? 'All Notifications'
                : t === 'cluster'
                ? 'Aggregated Incidents'
                : t === 'promise'
                ? 'SLA & Promises'
                : 'Urgent Alerts'}
            </button>
          ))}
        </div>

        <label style={styles.unreadToggle}>
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
          />
          <span style={{ fontSize: 12, color: '#CBD5E1' }}>Unread only</span>
        </label>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div style={styles.list}>
        {filtered.map((n) => {
          const isClusterAlert = n.type === 'cluster' && n.clusterId;

          return (
            <div
              key={n.id}
              style={{
                ...styles.item,
                backgroundColor: n.read ? '#FFFFFF' : '#142038',
                borderLeft: n.read ? '3px solid transparent' : '3px solid #38BDF8',
              }}
              onClick={() => handleClickItem(n)}
            >
              <div style={styles.itemIconBox}>{getIcon(n)}</div>

              <div style={styles.itemContent}>
                <div style={styles.itemTopRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={styles.itemTitle}>{n.title}</span>
                    {n.severity && <SeverityBadge severity={n.severity} />}
                    {isClusterAlert && (
                      <span style={styles.aggregatedPill}>
                        Aggregated Incident ({n.affectedCount || 'Multiple'} complaints)
                      </span>
                    )}
                  </div>
                  <span style={styles.itemTime}>
                    {new Date(n.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p style={styles.itemMessage}>{n.message}</p>

                <div style={styles.itemBottomRow}>
                  {n.clusterId ? (
                    <span style={styles.actionPrompt}>
                      Click to inspect cluster & member complaints <ArrowRight size={12} />
                    </span>
                  ) : n.complaintId ? (
                    <span style={styles.actionPrompt}>
                      Click to inspect complaint details <ArrowRight size={12} />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={styles.emptyCard}>
            <Bell size={32} color="#6B7280" />
            <h3 style={styles.emptyTitle}>No Notifications Found</h3>
            <p style={styles.emptySub}>You have addressed all active operational notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxWidth: 1400,
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#0C2340',
    border: '1px solid #1D4ED8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    margin: '3px 0 0',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    color: '#111827',
    fontSize: 12,
    fontWeight: 600,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  filterPill: {
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid transparent',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  unreadToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  item: {
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    gap: 14,
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  aggregatedPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid #0284C7',
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 3,
  },
  itemTime: {
    fontSize: 11,
    color: '#6B7280',
    whiteSpace: 'nowrap' as const,
  },
  itemMessage: {
    fontSize: 13,
    color: '#CBD5E1',
    margin: '4px 0 8px',
    lineHeight: 1.4,
  },
  itemBottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  actionPrompt: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#38BDF8',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: 48,
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    margin: 0,
  },
};
