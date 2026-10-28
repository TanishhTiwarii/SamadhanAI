import { useMemo } from 'react';
import {
  BarChart2,
  Building,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { useComplaints, useClusters } from '../../../hooks/useStore';
import { CATEGORY_LABELS } from '../../../types';
import type { ComplaintCategory } from '../../../types';

export function AnalyticsDashboard() {
  const complaints = useComplaints();
  const clusters = useClusters();

  // Retailer volume & resolution performance
  const retailerStats = useMemo(() => {
    const stats: Record<string, { retailer: string; total: number; resolved: number; open: number }> = {};
    complaints.forEach((c) => {
      const r = c.retailer || 'Unknown';
      if (!stats[r]) {
        stats[r] = { retailer: r, total: 0, resolved: 0, open: 0 };
      }
      stats[r].total++;
      if (c.status === 'resolved' || c.status === 'closed') {
        stats[r].resolved++;
      } else {
        stats[r].open++;
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [complaints]);

  // Category average resolution duration in days
  const categorySpeedStats = useMemo(() => {
    const durations: Record<string, number[]> = {};
    complaints.forEach((c) => {
      if (c.status === 'resolved' || c.status === 'closed') {
        const cat = c.category;
        const created = new Date(c.createdAt).getTime();
        const updated = new Date(c.updatedAt).getTime();
        const days = Math.max(0.2, (updated - created) / (1000 * 60 * 60 * 24));
        if (!durations[cat]) durations[cat] = [];
        durations[cat].push(days);
      }
    });

    return Object.entries(durations).map(([cat, list]) => {
      const avg = list.reduce((a, b) => a + b, 0) / list.length;
      return {
        category: CATEGORY_LABELS[cat as ComplaintCategory] || cat,
        avgDays: parseFloat(avg.toFixed(1)),
        count: list.length,
      };
    });
  }, [complaints]);

  // Root cause distribution among active clusters
  const rootCauseDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      verified: 0,
      suspected: 0,
      unidentified: 0,
    };
    clusters.forEach((cl) => {
      counts[cl.rootCauseStatus] = (counts[cl.rootCauseStatus] || 0) + 1;
    });

    return [
      { name: 'Verified Root Cause', value: counts.verified, color: '#059669' },
      { name: 'Suspected (Under Review)', value: counts.suspected, color: '#F59E0B' },
      { name: 'Unidentified / Triage', value: counts.unidentified, color: '#6B7280' },
    ];
  }, [clusters]);

  // Dynamic average resolution days across all resolved complaints
  const avgClosureDays = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed');
    if (resolved.length === 0) return '0.0';
    const totalDays = resolved.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      return sum + Math.max(0.1, (updated - created) / (1000 * 60 * 60 * 24));
    }, 0);
    return (totalDays / resolved.length).toFixed(1);
  }, [complaints]);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <BarChart2 size={20} color="#8B5CF6" />
          </div>
          <div>
            <h1 style={styles.title}>Operations Analytics & Deep-Dives</h1>
            <p style={styles.subtitle}>
              Merchant dispute velocity, resolution speed benchmarks, and incident root cause telemetry
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>INGESTED VOLUME</span>
          <span style={styles.kpiValue}>{complaints.length} tickets</span>
          <span style={styles.kpiSub}>across {retailerStats.length} merchant partners</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>INCIDENT CLUSTERS</span>
          <span style={{ ...styles.kpiValue, color: '#38BDF8' }}>{clusters.length} active</span>
          <span style={styles.kpiSub}>deterministic grouping</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>AVERAGE CLOSURE TIME</span>
          <span style={{ ...styles.kpiValue, color: '#059669' }}>{avgClosureDays} days</span>
          <span style={styles.kpiSub}>calculated from {complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length} resolved records</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ROOT CAUSE VERIFICATION</span>
          <span style={{ ...styles.kpiValue, color: '#FCD34D' }}>
            {clusters.filter((c) => c.rootCauseStatus === 'verified').length} / {clusters.length}
          </span>
          <span style={styles.kpiSub}>confirmed with merchant telemetry</span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div style={styles.chartsGrid}>
        {/* RETAILER VOLUME COMPARISON */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={16} color="#38BDF8" />
              <h3 style={styles.cardTitle}>Merchant Dispute Frequency Breakdown</h3>
            </div>
          </div>
          <p style={styles.cardDesc}>Total volume and open vs resolved proportion by merchant</p>

          <div style={{ height: 260, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retailerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="retailer" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: 6,
                    color: '#111827',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="open" name="Open Complaints" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Complaints" fill="#059669" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROOT CAUSE DISTRIBUTION */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#059669" />
              <h3 style={styles.cardTitle}>Incident Root Cause Confidence</h3>
            </div>
          </div>
          <p style={styles.cardDesc}>Status of identified root causes across active incident clusters</p>

          <div style={{ height: 260, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rootCauseDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {rootCauseDistribution.map((entry, index) => (
                    <Cell key={`rc-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
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

        {/* RESOLUTION SPEED BY CATEGORY */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#FBBF24" />
              <h3 style={styles.cardTitle}>Average Resolution Velocity by Category</h3>
            </div>
            <span style={styles.badge}>Days from submission to verified resolution</span>
          </div>

          <div style={{ height: 220, width: '100%', marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySpeedStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} unit="d" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderRadius: 6,
                    color: '#111827',
                    fontSize: 12,
                  }}
                  formatter={(val: any) => [`${val} days`, 'Avg Closure Time']}
                />
                <Bar dataKey="avgDays" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
    backgroundColor: '#1E1B4B',
    border: '1px solid #7C3AED',
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
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111827',
  },
  kpiSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  chartsGrid: {
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
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    margin: 0,
  },
  badge: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid #E5E7EB',
  },
};
