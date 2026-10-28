import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useAuditLogs } from '../../../hooks/useStore';

export function AuditLogView() {
  const navigate = useNavigate();
  const logs = useAuditLogs();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.targetId.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((l) => l.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (actorFilter !== 'all') {
      result = result.filter((l) => l.actor === actorFilter);
    }

    return result;
  }, [logs, search, categoryFilter, actorFilter]);

  const uniqueActors = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.actor)));
  }, [logs]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.category)));
  }, [logs]);

  const handleNavigateTarget = (targetId: string, targetType: string) => {
    if (targetType === 'cluster' || targetType === 'resolution' || targetType === 'promise') {
      navigate(`/admin/clusters/${targetId}`);
    } else if (targetType === 'complaint') {
      navigate(`/admin/complaint/${targetId}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <FileText size={20} color="#F59E0B" />
          </div>
          <div>
            <h1 style={styles.title}>System Audit Log</h1>
            <p style={styles.subtitle}>
              Chronological, immutable record of incident status updates, batch settlement actions, and triage modifications
            </p>
          </div>
        </div>

        <div style={styles.countBadge}>
          <span style={{ color: '#6B7280' }}>Total Audit Entries:</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>{logs.length}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={styles.filterCard}>
        <div style={styles.searchWrap}>
          <Search size={14} color="#6B7280" />
          <input
            style={styles.searchInput}
            placeholder="Search audit action, target reference, actor, or payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.selectWrap}>
            <Filter size={12} color="#6B7280" />
            <select
              style={styles.select}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={styles.selectWrap}>
            <select
              style={styles.select}
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            >
              <option value="all">All Actors</option>
              {uniqueActors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Actor</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Action Taken</th>
              <th style={styles.th}>Target Record</th>
              <th style={styles.th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => {
              return (
                <tr key={log.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.timeVal}>
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                    <div style={styles.dateVal}>
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.actorName}>{log.actor}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.categoryBadge}>{log.category}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {log.status === 'success' ? (
                        <CheckCircle2 size={13} color="#059669" />
                      ) : log.status === 'warning' ? (
                        <AlertTriangle size={13} color="#EF4444" />
                      ) : (
                        <Info size={13} color="#38BDF8" />
                      )}
                      <span style={{ fontWeight: 600, color: '#111827' }}>{log.action}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.targetLink}
                      onClick={() => handleNavigateTarget(log.targetId, log.targetType)}
                      title={`Open ${log.targetType} details`}
                    >
                      <span style={{ fontFamily: 'ui-monospace, monospace' }}>{log.targetId}</span>
                      <ExternalLink size={11} />
                    </button>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.detailsText}>{log.details}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div style={styles.emptyCard}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>No audit logs found for the applied filter.</p>
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
    backgroundColor: '#2D1B03',
    border: '1px solid #D97706',
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
  countBadge: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    display: 'flex',
    gap: 6,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  searchWrap: {
    flex: 1,
    minWidth: 280,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '7px 12px',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#111827',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: 12,
  },
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  selectWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '0 8px',
  },
  select: {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 500,
    padding: '7px 4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tr: {
    borderBottom: '1px solid #E5E7EB',
  },
  td: {
    padding: '10px 14px',
    verticalAlign: 'middle' as const,
  },
  timeVal: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 600,
    color: '#111827',
  },
  dateVal: {
    fontSize: 10,
    color: '#6B7280',
  },
  actorName: {
    fontWeight: 600,
    color: '#38BDF8',
  },
  categoryBadge: {
    fontSize: 10,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  targetLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#059669',
    cursor: 'pointer',
    fontSize: 11,
    padding: 0,
    fontWeight: 600,
  },
  detailsText: {
    color: '#CBD5E1',
    lineHeight: 1.4,
  },
  emptyCard: {
    padding: 40,
    textAlign: 'center' as const,
  },
};
