import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Users,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useClusters } from '../../../hooks/useStore';
import {
  SeverityBadge,
  ClusterStatusBadge,
  RootCauseBadge,
} from '../../shared/AdminBadges';
import { CATEGORY_LABELS, AVAILABLE_RETAILERS } from '../../../types';
import type { ClusterSeverity } from '../../../types';

export function ClusterList() {
  const navigate = useNavigate();
  const clusters = useClusters();

  const [search, setSearch] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'count' | 'severity' | 'age' | 'activity'>('count');

  // Filter & sort logic
  const filteredClusters = useMemo(() => {
    let result = [...clusters];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.retailer.toLowerCase().includes(q) ||
          c.subcategory.toLowerCase().includes(q) ||
          (c.assignedTo && c.assignedTo.toLowerCase().includes(q))
      );
    }

    if (selectedRetailer !== 'all') {
      result = result.filter((c) => c.retailer === selectedRetailer);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (selectedSeverity !== 'all') {
      result = result.filter((c) => c.severity === selectedSeverity);
    }

    if (selectedStatus !== 'all') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // Sort
    const severityWeight: Record<ClusterSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      if (sortBy === 'count') {
        return b.affectedCount - a.affectedCount;
      }
      if (sortBy === 'severity') {
        return severityWeight[b.severity] - severityWeight[a.severity] || b.affectedCount - a.affectedCount;
      }
      if (sortBy === 'age') {
        return b.oldestAgeDays - a.oldestAgeDays;
      }
      if (sortBy === 'activity') {
        return new Date(b.lastReportedAt).getTime() - new Date(a.lastReportedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [clusters, search, selectedRetailer, selectedCategory, selectedSeverity, selectedStatus, sortBy]);

  const totalAffectedTickets = useMemo(() => {
    return clusters.reduce((acc, c) => acc + c.affectedCount, 0);
  }, [clusters]);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.titleRow}>
            <div style={styles.iconBox}>
              <Layers size={20} color="#059669" />
            </div>
            <div>
              <h1 style={styles.title}>Incident & Complaint Clusters</h1>
              <p style={styles.subtitle}>
                Deterministic pattern aggregation: grouping high-volume retailer issues into single actionable incidents
              </p>
            </div>
          </div>
        </div>

        <div style={styles.headerStats}>
          <div style={styles.statPill}>
            <span style={styles.statPillLabel}>Active Clusters</span>
            <span style={styles.statPillValue}>{clusters.length}</span>
          </div>
          <div style={styles.statPill}>
            <span style={styles.statPillLabel}>Grouped Tickets</span>
            <span style={{ ...styles.statPillValue, color: '#38BDF8' }}>{totalAffectedTickets}</span>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={15} color="#6B7280" />
          <input
            style={styles.searchInput}
            placeholder="Search cluster title, retailer, subcategory, or owner..."
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
            <Filter size={13} color="#6B7280" />
            <select
              style={styles.select}
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
            >
              <option value="all">All Retailers</option>
              {AVAILABLE_RETAILERS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={styles.selectWrap}>
            <select
              style={styles.select}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          <div style={styles.selectWrap}>
            <select
              style={styles.select}
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={styles.selectWrap}>
            <select
              style={styles.select}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="detecting">Detecting</option>
              <option value="investigating">Investigating</option>
              <option value="action_proposed">Action Proposed</option>
              <option value="action_approved">Action Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div style={styles.selectWrap}>
            <ArrowUpDown size={13} color="#6B7280" />
            <select
              style={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="count">Sort: Complaint Volume</option>
              <option value="severity">Sort: Severity</option>
              <option value="age">Sort: Oldest Ticket Age</option>
              <option value="activity">Sort: Recent Influx</option>
            </select>
          </div>
        </div>
      </div>

      {/* CLUSTERS GRID / CARDS */}
      <div style={styles.clusterList}>
        {filteredClusters.map((cluster) => {
          const isHighVolumeExample = cluster.affectedCount >= 50;

          return (
            <div
              key={cluster.id}
              style={{
                ...styles.clusterCard,
                borderColor: isHighVolumeExample ? '#047857' : '#E5E7EB',
              }}
              onClick={() => navigate(`/admin/clusters/${cluster.id}`)}
            >
              {/* Card Top Row */}
              <div style={styles.clusterTopRow}>
                <div style={styles.retailerTag}>
                  <span>{cluster.retailer}</span>
                  <span style={styles.dotSeparator}>•</span>
                  <span>{CATEGORY_LABELS[cluster.category] || cluster.category}</span>
                  <span style={styles.dotSeparator}>•</span>
                  <span style={{ color: '#E2E8F0' }}>{cluster.subcategory}</span>
                </div>

                <div style={styles.badgeRow}>
                  <RootCauseBadge status={cluster.rootCauseStatus} />
                  <SeverityBadge severity={cluster.severity} />
                  <ClusterStatusBadge status={cluster.status} />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div style={styles.clusterTitleRow}>
                <h3 style={styles.clusterTitle}>{cluster.title}</h3>
                {isHighVolumeExample && (
                  <span style={styles.sampleFlag}>
                    Key Demo Incident: 50 Complaints Consolidated
                  </span>
                )}
              </div>

              {/* Next Recommended Action */}
              <div style={styles.nextActionBox}>
                <span style={styles.nextActionLabel}>NEXT RECOMMENDED ACTION:</span>
                <span style={styles.nextActionText}>{cluster.nextRecommendedAction}</span>
              </div>

              {/* Metrics Matrix Bar */}
              <div style={styles.metricsMatrix}>
                <div style={styles.matrixItem}>
                  <span style={styles.matrixLabel}>AFFECTED TICKETS</span>
                  <span style={styles.matrixValueVolume}>{cluster.affectedCount} complaints</span>
                </div>

                <div style={styles.matrixItem}>
                  <span style={styles.matrixLabel}>UNIQUE CUSTOMERS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={14} color="#6B7280" />
                    <span style={styles.matrixValue}>{cluster.affectedCustomersCount}</span>
                  </div>
                </div>

                <div style={styles.matrixItem}>
                  <span style={styles.matrixLabel}>OLDEST TICKET AGE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={14} color="#6B7280" />
                    <span style={styles.matrixValue}>{cluster.oldestAgeDays} days</span>
                  </div>
                </div>

                <div style={styles.matrixItem}>
                  <span style={styles.matrixLabel}>ASSIGNED LEAD</span>
                  <span style={styles.matrixValue}>{cluster.assignedTo || 'Unassigned'}</span>
                </div>

                <div style={{ ...styles.matrixItem, flex: 1.2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={styles.matrixLabel}>RESOLUTION PROGRESS</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                      {cluster.resolutionProgress}%
                    </span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${cluster.resolutionProgress}%`,
                        backgroundColor: cluster.resolutionProgress === 100 ? '#059669' : '#3B82F6',
                      }}
                    />
                  </div>
                </div>

                <div style={styles.actionBtnCol}>
                  <button
                    style={styles.inspectBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/clusters/${cluster.id}`);
                    }}
                  >
                    <span>Investigate</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClusters.length === 0 && (
          <div style={styles.emptyCard}>
            <AlertCircle size={32} color="#6B7280" />
            <h3 style={styles.emptyTitle}>No Matching Complaint Clusters</h3>
            <p style={styles.emptySubtitle}>
              Try adjusting your search criteria, retailer filters, or severity selections.
            </p>
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
    gap: 20,
    maxWidth: 1400,
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
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
    backgroundColor: '#064E3B',
    border: '1px solid #059669',
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
  headerStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  statPill: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  statPillValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
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
    flexWrap: 'wrap' as const,
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
  clusterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  clusterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  clusterTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  retailerTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#6B7280',
  },
  dotSeparator: {
    color: '#475569',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  clusterTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap' as const,
  },
  clusterTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  sampleFlag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid #059669',
    color: '#34D399',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
  },
  nextActionBox: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  nextActionLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#38BDF8',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  },
  nextActionText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 1.3,
  },
  metricsMatrix: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    paddingTop: 12,
    borderTop: '1px solid #E5E7EB',
    flexWrap: 'wrap' as const,
  },
  matrixItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 110,
  },
  matrixLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  matrixValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#E2E8F0',
  },
  matrixValueVolume: {
    fontSize: 14,
    fontWeight: 800,
    color: '#FBBF24',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  actionBtnCol: {
    marginLeft: 'auto',
  },
  inspectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    color: '#111827',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '48px 24px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    margin: 0,
    maxWidth: 400,
  },
};
