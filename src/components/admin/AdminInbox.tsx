import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useComplaints, useClusters } from '../../hooks/useStore';
import { StatusBadge, PriorityBadge } from '../shared/AdminBadges';
import { CATEGORY_LABELS, AVAILABLE_RETAILERS } from '../../types';
import type { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '../../types';

export function AdminInbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const complaints = useComplaints();
  const clusters = useClusters();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [retailerFilter, setRetailerFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  // Filtering & sorting
  const filtered = useMemo(() => {
    let result = [...complaints];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.referenceId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.customerEmail.toLowerCase().includes(q) ||
          c.orderId.toLowerCase().includes(q) ||
          c.retailer.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.subcategory.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (retailerFilter !== 'all') {
      result = result.filter((c) => c.retailer === retailerFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((c) => c.priority === priorityFilter);
    }

    const priorityOrder: Record<ComplaintPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return result;
  }, [complaints, search, statusFilter, retailerFilter, categoryFilter, priorityFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <div style={styles.iconBox}>
            <Inbox size={20} color="#3B82F6" />
          </div>
          <div>
            <h1 style={styles.title}>Complaint Inbox</h1>
            <p style={styles.subtitle}>
              Full operational log of individual customer dispute filings across connected merchant partners
            </p>
          </div>
        </div>

        <div style={styles.totalBadge}>
          <span style={{ color: '#6B7280' }}>Filtered:</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>{filtered.length} of {complaints.length} tickets</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div style={styles.filtersCard}>
        <div style={styles.searchWrap}>
          <Search size={14} color="#6B7280" />
          <input
            style={styles.searchInput}
            placeholder="Search reference, customer, order ID, retailer, or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div style={styles.filtersRow}>
          <div style={styles.selectBox}>
            <Filter size={12} color="#6B7280" />
            <select
              style={styles.select}
              value={retailerFilter}
              onChange={(e) => {
                setRetailerFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Retailers</option>
              {AVAILABLE_RETAILERS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={styles.selectBox}>
            <select
              style={styles.select}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div style={styles.selectBox}>
            <select
              style={styles.select}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>

          <div style={styles.selectBox}>
            <select
              style={styles.select}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={styles.selectBox}>
            <ArrowUpDown size={12} color="#6B7280" />
            <select
              style={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="priority">Sort: Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Retailer</th>
              <th style={styles.th}>Category / Subcategory</th>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Reported</th>
              <th style={styles.th}>Assigned Lead</th>
              <th style={styles.th}>Cluster</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedComplaints.map((c) => {
              const clusterObj = c.clusterId ? clusters.find((cl) => cl.id === c.clusterId) : undefined;
              const isOverdue =
                !['resolved', 'closed'].includes(c.status) &&
                new Date(c.dueDate).getTime() < new Date().getTime();

              return (
                <tr
                  key={c.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  }}
                  onClick={() => navigate(`/admin/complaint/${c.id}`)}
                >
                  <td style={styles.td}>
                    <span style={styles.refCode}>{c.referenceId}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.customerName}>{c.customerName}</div>
                    <div style={styles.customerEmail}>{c.customerEmail}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.retailerName}>{c.retailer}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ color: '#E2E8F0', fontWeight: 500, fontSize: 12 }}>
                      {CATEGORY_LABELS[c.category] || c.category}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: 11 }}>{c.subcategory}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.orderCode}>{c.orderId}</span>
                  </td>
                  <td style={styles.td}>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>
                      {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    {isOverdue && <span style={styles.overdueFlag}>OVERDUE</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{c.assignedTo || 'Unassigned'}</span>
                  </td>
                  <td style={styles.td}>
                    {clusterObj ? (
                      <button
                        style={styles.clusterBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/clusters/${clusterObj.id}`);
                        }}
                        title={`View parent cluster: ${clusterObj.title}`}
                      >
                        <Layers size={11} color="#059669" />
                        <span>Cluster ({clusterObj.affectedCount})</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#6B7280' }}>Standalone</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      style={styles.viewBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/complaint/${c.id}`);
                      }}
                      aria-label={`Open complaint ${c.referenceId}`}
                    >
                      View details <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={styles.emptyWrap}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 13 }}>No complaints match your filters.</p>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        <div style={styles.paginationBar}>
          <span style={styles.pageInfo}>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} complaints
          </span>

          <div style={styles.paginationBtns}>
            <button
              style={styles.pageBtn}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={styles.pageIndicator}>
              Page {page} of {totalPages}
            </span>
            <button
              style={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
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
  totalBadge: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    display: 'flex',
    gap: 6,
  },
  filtersCard: {
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
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  selectBox: {
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
  viewBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #A7F3D0', borderRadius: 6, background: '#ECFDF5', color: '#047857', padding: '6px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  tr: {
    cursor: 'pointer',
    borderBottom: '1px solid #E5E7EB',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '10px 14px',
    verticalAlign: 'middle' as const,
  },
  refCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 700,
    color: '#059669',
  },
  customerName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  customerEmail: {
    fontSize: 11,
    color: '#6B7280',
  },
  retailerName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#38BDF8',
  },
  orderCode: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    color: '#CBD5E1',
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
  },
  overdueFlag: {
    display: 'block',
    fontSize: 9,
    fontWeight: 800,
    color: '#EF4444',
    letterSpacing: '0.04em',
    marginTop: 2,
  },
  clusterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #059669',
    color: '#34D399',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyWrap: {
    padding: 40,
    textAlign: 'center' as const,
  },
  paginationBar: {
    padding: '10px 16px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  pageInfo: {
    fontSize: 11,
    color: '#6B7280',
  },
  paginationBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#111827',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: 11,
    color: '#6B7280',
  },
};
