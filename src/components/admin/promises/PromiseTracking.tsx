import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { useClusters, useComplaints, useStoreActions } from '../../../hooks/useStore';
import { PromiseOutcomeBadge, SeverityBadge } from '../../shared/AdminBadges';

export function PromiseTracking() {
  const navigate = useNavigate();
  const clusters = useClusters();
  const complaints = useComplaints();
  const { runPromiseVerification } = useStoreActions();

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Compute promise statistics across all clusters
  const promiseStats = useMemo(() => {
    let totalPromisedIncidents = 0;
    let totalPromisedTickets = 0;
    let fulfilledCount = 0;
    let pendingCount = 0;
    let breachedCount = 0;

    clusters.forEach((cl) => {
      if (cl.promiseDeadline) {
        totalPromisedIncidents++;
        totalPromisedTickets += cl.affectedCount;
        if (cl.promiseOutcome === 'confirmed_completed') {
          fulfilledCount++;
        } else if (cl.promiseOutcome === 'failed') {
          breachedCount++;
        } else {
          pendingCount++;
        }
      }
    });

    return {
      totalPromisedIncidents,
      totalPromisedTickets,
      fulfilledCount,
      pendingCount,
      breachedCount,
      complianceRate:
        totalPromisedIncidents > 0
          ? Math.round((fulfilledCount / totalPromisedIncidents) * 100)
          : 0,
    };
  }, [clusters]);

  const clustersWithPromises = useMemo(() => {
    return clusters.filter((c) => !!c.promiseDeadline);
  }, [clusters]);

  const handleVerify = (clusterId: string) => {
    setVerifyingId(clusterId);
    setTimeout(() => {
      runPromiseVerification(clusterId, 'Promise Audit Controller');
      setVerifyingId(null);
    }, 600);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <Clock size={20} color="#F59E0B" />
          </div>
          <div>
            <h1 style={styles.title}>Resolution Promise & SLA Tracking</h1>
            <p style={styles.subtitle}>
              Verification of promised resolution commitments, delivery turnaround guarantees, and refund disbursement SLAs
            </p>
          </div>
        </div>

        <div style={styles.simulatedTag}>
          <ShieldCheck size={13} color="#059669" />
          <span>Automated Verification (Simulated Logs)</span>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>ACTIVE PROMISE COMMITMENTS</div>
          <div style={styles.metricVal}>{promiseStats.totalPromisedIncidents}</div>
          <div style={styles.metricSub}>covering {promiseStats.totalPromisedTickets} customer tickets</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>CONFIRMED FULFILLED (100%)</div>
          <div style={{ ...styles.metricVal, color: '#059669' }}>{promiseStats.fulfilledCount}</div>
          <div style={styles.metricSub}>verified against transaction logs</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>ACTIVE / IN-FLIGHT</div>
          <div style={{ ...styles.metricVal, color: '#38BDF8' }}>{promiseStats.pendingCount}</div>
          <div style={styles.metricSub}>within SLA window</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>SLA OVERDUE / BREACHED</div>
          <div style={{ ...styles.metricVal, color: promiseStats.breachedCount > 0 ? '#EF4444' : '#059669' }}>
            {promiseStats.breachedCount}
          </div>
          <div style={styles.metricSub}>passed target resolution date</div>
        </div>
      </div>

      {/* PROMISE COMMITMENTS LIST */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Tracked Operational Commitments</h3>
          <span style={styles.sectionBadge}>{clustersWithPromises.length} Monitored Clusters</span>
        </div>

        <div style={styles.clusterList}>
          {clustersWithPromises.map((cluster) => {
            const memberComplaints = complaints.filter(
              (c) => c.clusterId === cluster.id || cluster.complaintIds.includes(c.id)
            );
            const now = new Date().getTime();
            const deadlineTime = cluster.promiseDeadline ? new Date(cluster.promiseDeadline).getTime() : 0;
            const isOverdue = deadlineTime > 0 && deadlineTime < now && cluster.status !== 'resolved';

            // Member breakdown counts
            const confirmedCount = memberComplaints.filter(
              (c) => c.refundStatus === 'refund_confirmed_completed' || c.status === 'resolved'
            ).length;
            const pendingCount = memberComplaints.filter(
              (c) => c.status === 'open' || c.status === 'under_review' || c.status === 'in_progress'
            ).length;
            const failedCount = memberComplaints.filter((c) => c.refundStatus === 'refund_failed').length;
            const unknownCount = memberComplaints.filter(
              (c) => c.refundStatus === 'refund_unknown' || (!c.refundStatus && c.status !== 'resolved')
            ).length;

            const completionRatio =
              memberComplaints.length > 0
                ? Math.round((confirmedCount / memberComplaints.length) * 100)
                : 0;

            const isVerifying = verifyingId === cluster.id;

            return (
              <div key={cluster.id} style={styles.promiseCard}>
                <div style={styles.cardTopRow}>
                  <div>
                    <div style={styles.retailerRow}>
                      <span style={{ color: '#38BDF8', fontWeight: 700 }}>{cluster.retailer}</span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span style={{ color: '#6B7280' }}>{cluster.subcategory}</span>
                    </div>
                    <h4 style={styles.clusterTitle}>{cluster.title}</h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PromiseOutcomeBadge outcome={cluster.promiseOutcome} size="md" />
                    <SeverityBadge severity={cluster.severity} />
                  </div>
                </div>

                {/* TARGET SLA DETAILS */}
                <div style={styles.slaDetailsRow}>
                  <div style={styles.slaBox}>
                    <Calendar size={13} color="#6B7280" />
                    <span style={styles.slaLabel}>PROMISE DEADLINE:</span>
                    <span style={{ color: isOverdue ? '#EF4444' : '#111827', fontWeight: 600 }}>
                      {cluster.promiseDeadline
                        ? new Date(cluster.promiseDeadline).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Unspecified'}
                    </span>
                    {isOverdue && <span style={styles.breachPill}>OVERDUE</span>}
                  </div>

                  <div style={styles.slaBox}>
                    <Layers size={13} color="#6B7280" />
                    <span style={styles.slaLabel}>AFFECTED TICKETS:</span>
                    <span style={{ color: '#FCD34D', fontWeight: 700 }}>{cluster.affectedCount} customer complaints</span>
                  </div>

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      style={styles.verifyBtn}
                      disabled={isVerifying}
                      onClick={() => handleVerify(cluster.id)}
                    >
                      <RotateCw size={13} style={{ animation: isVerifying ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{isVerifying ? 'Verifying...' : 'Run Audit Check'}</span>
                    </button>
                    <button
                      style={styles.investigateBtn}
                      onClick={() => navigate(`/admin/clusters/${cluster.id}`)}
                    >
                      <span>Cluster Workspace</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* PROGRESS BAR & HONEST BREAKDOWN MATRIX */}
                <div style={styles.breakdownMatrix}>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>VERIFIED COMPLETION RATIO</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        {confirmedCount} of {memberComplaints.length} ({completionRatio}%)
                      </span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${completionRatio}%`,
                          backgroundColor: completionRatio === 100 ? '#059669' : '#3B82F6',
                        }}
                      />
                    </div>
                  </div>

                  {/* 4 SEPARATE OUTCOME BUCKETS */}
                  <div style={styles.bucketsGrid}>
                    <div style={styles.bucketItem}>
                      <span style={styles.bucketLabel}>CONFIRMED COMPLETED</span>
                      <span style={{ ...styles.bucketVal, color: '#059669' }}>{confirmedCount}</span>
                      <span style={styles.bucketSub}>Verified in logs</span>
                    </div>

                    <div style={styles.bucketItem}>
                      <span style={styles.bucketLabel}>STILL PENDING</span>
                      <span style={{ ...styles.bucketVal, color: '#FCD34D' }}>{pendingCount}</span>
                      <span style={styles.bucketSub}>In processing queue</span>
                    </div>

                    <div style={styles.bucketItem}>
                      <span style={styles.bucketLabel}>FAILED / DISPUTED</span>
                      <span style={{ ...styles.bucketVal, color: '#EF4444' }}>{failedCount}</span>
                      <span style={styles.bucketSub}>Gateway rejections</span>
                    </div>

                    <div style={styles.bucketItem}>
                      <span style={styles.bucketLabel}>UNKNOWN / UNVERIFIED</span>
                      <span style={{ ...styles.bucketVal, color: '#6B7280' }}>{unknownCount}</span>
                      <span style={styles.bucketSub}>Awaiting audit</span>
                    </div>
                  </div>

                  {/* AUDIT DETAILS TEXT */}
                  {cluster.promiseVerificationDetails && (
                    <div style={styles.auditLogNote}>
                      <strong>LATEST VERIFICATION NOTE ({new Date(cluster.promiseVerificationDetails.verifiedAt).toLocaleTimeString()}):</strong>{' '}
                      {cluster.promiseVerificationDetails.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
  simulatedTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #059669',
    color: '#34D399',
    fontSize: 11,
    fontWeight: 600,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  metricVal: {
    fontSize: 26,
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.1,
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  sectionBadge: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid #E5E7EB',
  },
  clusterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  promiseCard: {
    backgroundColor: '#FAFBFC',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '16px 18px',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  retailerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    marginBottom: 2,
  },
  clusterTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  slaDetailsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  slaBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
  },
  slaLabel: {
    color: '#6B7280',
    fontWeight: 700,
  },
  breachPill: {
    fontSize: 9,
    fontWeight: 800,
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #991B1B',
    padding: '1px 5px',
    borderRadius: 3,
  },
  verifyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    border: '1px solid #059669',
    borderRadius: 4,
    color: '#34D399',
    fontSize: 11,
    fontWeight: 700,
    padding: '5px 10px',
    cursor: 'pointer',
  },
  investigateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#111827',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    cursor: 'pointer',
  },
  breakdownMatrix: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  bucketsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  bucketItem: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  bucketLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: '#6B7280',
    letterSpacing: '0.04em',
  },
  bucketVal: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  bucketSub: {
    fontSize: 10,
    color: '#6B7280',
  },
  auditLogNote: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    padding: '6px 10px',
  },
};
