import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useComplaints, useClusters, useAuditLogs } from '../../hooks/useStore';
import { SeverityBadge, ClusterStatusBadge } from '../shared/AdminBadges';
import { CATEGORY_LABELS } from '../../types';
import type { ComplaintCategory } from '../../types';

const CATEGORY_COLORS: Record<ComplaintCategory, string> = {
  billing: '#3B82F6', // Blue
  delivery: '#059669', // Emerald
  product_quality: '#EF4444', // Red
  customer_service: '#F59E0B', // Amber
  technical: '#8B5CF6', // Violet
  refund: '#06B6D4', // Cyan
  other: '#6B7280', // Slate
};

const STATUS_BAR_COLORS = [
  { key: 'open', label: 'Open', color: '#F59E0B' },
  { key: 'under_review', label: 'Under Review', color: '#8B5CF6' },
  { key: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { key: 'escalated', label: 'Escalated', color: '#EF4444' },
  { key: 'resolved', label: 'Resolved', color: '#059669' },
];

export function AdminOverview() {
  const navigate = useNavigate();
  const complaints = useComplaints();
  const clusters = useClusters();
  const auditLogs = useAuditLogs();
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  // Filter complaints based on selected time window
  const filteredComplaints = useMemo(() => {
    const now = new Date().getTime();
    if (timeFilter === 'all') return complaints;
    const hours = timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 720;
    const cutoff = now - hours * 60 * 60 * 1000;
    return complaints.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
  }, [complaints, timeFilter]);

  // Key performance indicators calculation
  const metrics = useMemo(() => {
    const total = filteredComplaints.length;
    const now = new Date().getTime();

    const openComplaints = filteredComplaints.filter(
      (c) => c.status === 'open' || c.status === 'in_progress' || c.status === 'under_review' || c.status === 'escalated'
    );
    const resolvedComplaints = filteredComplaints.filter(
      (c) => c.status === 'resolved' || c.status === 'closed'
    );

    const urgent = filteredComplaints.filter(
      (c) => c.priority === 'critical' || c.status === 'escalated' || (c.clusterId && clusters.find((cl) => cl.id === c.clusterId)?.severity === 'critical')
    );

    const overdueComplaints = filteredComplaints.filter((c) => {
      if (c.status === 'resolved' || c.status === 'closed') return false;
      return new Date(c.dueDate).getTime() < now;
    });

    const overduePromises = clusters.filter((cl) => {
      if (cl.status === 'resolved') return false;
      if (!cl.promiseDeadline) return false;
      return new Date(cl.promiseDeadline).getTime() < now;
    });

    const resolutionRate = total > 0 ? Math.round((resolvedComplaints.length / total) * 100) : 0;

    // True calculation from resolved complaints
    const resolvedWithDurations = resolvedComplaints.map((c) => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      return Math.max(0.1, (updated - created) / (1000 * 60 * 60 * 24));
    });

    const avgResolutionDays =
      resolvedWithDurations.length > 0
        ? (resolvedWithDurations.reduce((acc, curr) => acc + curr, 0) / resolvedWithDurations.length).toFixed(1)
        : '0.0';

    return {
      total,
      openCount: openComplaints.length,
      urgentCount: urgent.length,
      resolvedCount: resolvedComplaints.length,
      overdueCount: overdueComplaints.length + overduePromises.length,
      resolutionRate,
      avgResolutionDays,
    };
  }, [filteredComplaints, clusters]);

  // Volume Trend chart data
  const volumeTrendData = useMemo(() => {
    const dayBuckets: Record<string, { date: string; total: number; resolved: number }> = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayBuckets[label] = { date: label, total: 0, resolved: 0 };
    }

    complaints.forEach((c) => {
      const d = new Date(c.createdAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayBuckets[label]) {
        dayBuckets[label].total += 1;
        if (c.status === 'resolved' || c.status === 'closed') {
          dayBuckets[label].resolved += 1;
        }
      }
    });

    return Object.values(dayBuckets);
  }, [complaints]);

  // Category Donut data
  const categoryData = useMemo(() => {
    const counts: Partial<Record<ComplaintCategory, number>> = {};
    filteredComplaints.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });

    return Object.entries(counts).map(([cat, count]) => ({
      name: CATEGORY_LABELS[cat as ComplaintCategory] || cat,
      categoryKey: cat as ComplaintCategory,
      value: count,
      color: CATEGORY_COLORS[cat as ComplaintCategory] || '#6B7280',
    }));
  }, [filteredComplaints]);

  // Status breakdown data
  const statusBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {
      open: 0,
      under_review: 0,
      in_progress: 0,
      escalated: 0,
      resolved: 0,
    };
    filteredComplaints.forEach((c) => {
      if (c.status in counts) {
        counts[c.status]++;
      } else if (c.status === 'closed') {
        counts['resolved']++;
      }
    });

    return STATUS_BAR_COLORS.map((item) => ({
      name: item.label,
      count: counts[item.key] || 0,
      fill: item.color,
    }));
  }, [filteredComplaints]);

  // High priority / urgent clusters for panel
  const urgentItems = useMemo(() => {
    return [...clusters]
      .sort((a, b) => {
        const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityRank[b.severity] - severityRank[a.severity] || b.affectedCount - a.affectedCount;
      })
      .slice(0, 4);
  }, [clusters]);

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Operations Intelligence Control</h1>
            <div style={styles.demoBadge}>
              <ShieldAlert size={12} color="#F59E0B" />
              <span>Simulated Data • No External API</span>
            </div>
          </div>
          <p style={styles.subtitle}>
            Real-time incident clustering, retailer dispute telemetry & promise resolution tracking
          </p>
        </div>

        {/* TIME PERIOD SELECTOR */}
        <div style={styles.timePills}>
          {(['24h', '7d', '30d', 'all'] as const).map((t) => (
            <button
              key={t}
              style={{
                ...styles.timePill,
                backgroundColor: timeFilter === t ? '#E5E7EB' : 'transparent',
                color: timeFilter === t ? '#059669' : '#6B7280',
                borderColor: timeFilter === t ? '#059669' : 'transparent',
              }}
              onClick={() => setTimeFilter(t)}
            >
              {t === '24h' ? 'Last 24h' : t === '7d' ? 'Last 7 Days' : t === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* TOP KPI CARDS ROW */}
      <div style={styles.kpiGrid}>
        {/* KPI 1 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/inbox')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Ingested Complaints</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#0C2340', color: '#60A5FA' }}>
              <Inbox size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{metrics.total}</div>
          <div style={styles.kpiMeta}>
            <span style={{ color: '#059669', fontWeight: 600 }}>Active Database</span>
            <span style={styles.kpiSub}>across all connected merchants</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/clusters')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Active Complaint Clusters</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#1E1B4B', color: '#C084FC' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{clusters.length}</div>
          <div style={styles.kpiMeta}>
            <span style={{ color: '#C084FC', fontWeight: 600 }}>
              {clusters.reduce((acc, c) => acc + c.affectedCount, 0)} member tickets
            </span>
            <span style={styles.kpiSub}>grouped by key</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/clusters')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Urgent Attention Required</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#380B0F', color: '#FCA5A5' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#EF4444' }}>{metrics.urgentCount}</div>
          <div style={styles.kpiMeta}>
            <span style={{ color: '#EF4444', fontWeight: 600 }}>Critical / Escalated</span>
            <span style={styles.kpiSub}>requires priority triage</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/resolution')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Resolution Rate</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#062E20', color: '#34D399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#059669' }}>{metrics.resolutionRate}%</div>
          <div style={styles.kpiMeta}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{metrics.resolvedCount} Resolved</span>
            <span style={styles.kpiSub}>of {metrics.total} total</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/analytics')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Avg. Resolution Time</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#092742', color: '#93C5FD' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{metrics.avgResolutionDays} <span style={{ fontSize: 16 }}>days</span></div>
          <div style={styles.kpiMeta}>
            <span style={styles.kpiSub}>from submission to verified closure</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div style={styles.kpiCard} onClick={() => navigate('/admin/promises')}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Overdue Resolutions</span>
            <div style={{ ...styles.kpiIconBox, backgroundColor: '#2E1A04', color: '#FBBF24' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: metrics.overdueCount > 0 ? '#F59E0B' : '#059669' }}>
            {metrics.overdueCount}
          </div>
          <div style={styles.kpiMeta}>
            <span style={{ color: metrics.overdueCount > 0 ? '#F59E0B' : '#059669', fontWeight: 600 }}>
              {metrics.overdueCount > 0 ? 'SLA Breached' : 'Within SLA'}
            </span>
            <span style={styles.kpiSub}>deadlines exceeded</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1: VOLUME TREND & CATEGORY DISTRIBUTION */}
      <div style={styles.gridRow2}>
        {/* A. COMPLAINT VOLUME TREND */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#3B82F6" />
              <h3 style={styles.cardTitle}>Complaint Influx & Resolution Trend</h3>
            </div>
            <span style={styles.cardBadge}>Last 7 Days Activity</span>
          </div>
          <div style={{ height: 260, width: '100%', marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: 6,
                    color: '#111827',
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#111827' }}
                />
                <Area type="monotone" dataKey="total" name="Total Influx" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#resolvedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. CATEGORY DISTRIBUTION DONUT */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="#059669" />
              <h3 style={styles.cardTitle}>Category Distribution</h3>
            </div>
            <span style={styles.cardBadge}>{filteredComplaints.length} Tickets</span>
          </div>
          <div style={{ height: 260, width: '100%', marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: 6,
                    color: '#111827',
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: '#6B7280', fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: STATUS BREAKDOWN & URGENT ISSUE PANEL */}
      <div style={styles.gridRow2_Equal}>
        {/* C. COMPLAINT STATUS BREAKDOWN */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="#8B5CF6" />
              <h3 style={styles.cardTitle}>Operational Status Breakdown</h3>
            </div>
            <span style={styles.cardBadge}>Active Pipeline</span>
          </div>
          <div style={{ height: 220, width: '100%', marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: 6,
                    color: '#111827',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusBreakdownData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D. URGENT ISSUE PANEL */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#EF4444" />
              <h3 style={styles.cardTitle}>High Impact Incidents & Clusters</h3>
            </div>
            <button
              style={styles.viewAllBtn}
              onClick={() => navigate('/admin/clusters')}
            >
              All Clusters <ChevronRight size={13} />
            </button>
          </div>

          <div style={styles.urgentList}>
            {urgentItems.map((cluster) => (
              <div
                key={cluster.id}
                style={styles.urgentItem}
                onClick={() => navigate(`/admin/clusters/${cluster.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.urgentItemTitleRow}>
                    <span style={styles.urgentItemTitle}>{cluster.title}</span>
                    <SeverityBadge severity={cluster.severity} />
                  </div>
                  <div style={styles.urgentItemMeta}>
                    <span style={{ color: '#FCD34D', fontWeight: 600 }}>{cluster.affectedCount} complaints</span>
                    <span>•</span>
                    <span>{cluster.retailer}</span>
                    <span>•</span>
                    <span style={{ color: '#6B7280' }}>{cluster.oldestAgeDays}d age</span>
                  </div>
                </div>
                <div style={styles.urgentItemRight}>
                  <ClusterStatusBadge status={cluster.status} />
                  <ArrowRight size={14} color="#6B7280" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 3: RECENT AUDIT ACTIVITY TIMELINE */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#F59E0B" />
            <h3 style={styles.cardTitle}>Operational Audit & Activity Stream</h3>
          </div>
          <button style={styles.viewAllBtn} onClick={() => navigate('/admin/audit')}>
            Full Audit Log <ChevronRight size={13} />
          </button>
        </div>

        <div style={styles.activityList}>
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} style={styles.activityItem}>
              <div style={styles.activityIndicator}>
                <span
                  style={{
                    ...styles.activityDot,
                    backgroundColor: log.status === 'success' ? '#059669' : log.status === 'warning' ? '#EF4444' : '#3B82F6',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.activityRowTop}>
                  <span style={styles.activityActor}>{log.actor}</span>
                  <span style={styles.activityAction}>{log.action}</span>
                  <span style={styles.activityTarget}>[{log.targetId}]</span>
                  <span style={styles.activityTime}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={styles.activityDetails}>{log.details}</p>
              </div>
            </div>
          ))}
        </div>
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
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  demoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#FCD34D',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    margin: '4px 0 0',
  },
  timePills: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: 3,
    gap: 2,
  },
  timePill: {
    padding: '5px 12px',
    borderRadius: 4,
    border: '1px solid transparent',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 14,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.1,
    marginBottom: 6,
  },
  kpiMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
  },
  kpiSub: {
    color: '#6B7280',
  },
  gridRow2: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: 16,
  },
  gridRow2_Equal: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '18px 20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  cardBadge: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid #E5E7EB',
  },
  viewAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'transparent',
    border: 'none',
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  urgentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  urgentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  urgentItemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  urgentItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  },
  urgentItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  urgentItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 14,
  },
  activityItem: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottom: '1px solid #E5E7EB',
  },
  activityIndicator: {
    marginTop: 5,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  activityRowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    marginBottom: 2,
    flexWrap: 'wrap' as const,
  },
  activityActor: {
    fontWeight: 700,
    color: '#111827',
  },
  activityAction: {
    color: '#38BDF8',
    fontWeight: 500,
  },
  activityTarget: {
    color: '#6B7280',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
  },
  activityTime: {
    color: '#475569',
    fontSize: 11,
    marginLeft: 'auto',
  },
  activityDetails: {
    fontSize: 12,
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.4,
  },
};
