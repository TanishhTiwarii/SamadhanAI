import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Inbox,
  CheckSquare,
  Clock,
  Bell,
  BarChart2,
  FileText,
  ExternalLink,
  Search,
  ShieldAlert,
  Server,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  exact?: boolean;
  badge?: number;
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavItem[] = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/admin/clusters', label: 'Complaint Clusters', icon: Layers },
    { path: '/admin/inbox', label: 'Complaint Inbox', icon: Inbox },
    { path: '/admin/resolution', label: 'Resolution Centre', icon: CheckSquare },
    { path: '/admin/promises', label: 'Promise Tracking', icon: Clock },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/admin/audit', label: 'Audit Log', icon: FileText },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/admin/inbox?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div style={styles.root}>
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.brandRow} onClick={() => navigate('/admin')}>
            <div style={styles.brandLogo}>
              <Sparkles size={18} color="#059669" />
            </div>
            <div>
              <div style={styles.brandName}>SamadhanAI</div>
              <div style={styles.brandSub}>Operations Intelligence</div>
            </div>
          </div>
          <div style={styles.simulatedPill}>
            <span style={styles.simulatedDot} />
            <span style={styles.simulatedText}>Local Demo Data</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={styles.navSection}>
          <div style={styles.navGroupLabel}>OPERATIONS CONTROL</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.path}
                style={{
                  ...styles.navBtn,
                  backgroundColor: active ? '#E5E7EB' : 'transparent',
                  color: active ? '#111827' : '#6B7280',
                  borderLeft: active ? '3px solid #059669' : '3px solid transparent',
                  fontWeight: active ? 600 : 500,
                }}
                onClick={() => navigate(item.path)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Icon size={17} color={active ? '#059669' : '#6B7280'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={styles.navBadge}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div style={styles.sidebarFooter}>
          <div style={styles.systemStatusBox}>
            <div style={styles.statusRow}>
              <Server size={13} color="#059669" />
              <span style={styles.statusLabel}>Clustering Engine: Active</span>
            </div>
            <div style={styles.statusSub}>Deterministic Key: Retailer+Cat</div>
          </div>

          <button
            style={styles.customerPortalLink}
            onClick={() => navigate('/')}
            title="Switch to customer complaint submission and tracking portal"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={14} color="#3B82F6" />
              <span>Customer Portal</span>
            </div>
            <span style={styles.portalTag}>Public View</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainWrapper}>
        {/* TOP COMMAND BAR */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <form onSubmit={handleGlobalSearch} style={styles.searchForm}>
              <Search size={15} color="#6B7280" />
              <input
                style={styles.searchInput}
                placeholder="Search reference, customer, order, or retailer..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <span style={styles.searchHint}>Enter to search</span>
            </form>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.timeBox}>
              <Clock size={13} color="#6B7280" />
              <span style={styles.timeText}>{currentTime || 'Synchronizing...'}</span>
            </div>

            <div style={styles.envTag}>
              <ShieldAlert size={13} color="#F59E0B" />
              <span>Demo Mode</span>
            </div>

            <button
              style={{
                ...styles.iconBtn,
                position: 'relative',
              }}
              onClick={() => navigate('/admin/notifications')}
              title="Operational Notifications"
            >
              <Bell size={17} color={unreadCount > 0 ? '#111827' : '#6B7280'} />
              {unreadCount > 0 && <span style={styles.topbarBadge}>{unreadCount}</span>}
            </button>
          </div>
        </header>

        {/* PAGE OUTLET */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#FAFBFC',
    color: '#111827',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 30,
  },
  sidebarHeader: {
    padding: '18px 16px 14px',
    borderBottom: '1px solid #E5E7EB',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    marginBottom: 8,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#064E3B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #059669',
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 500,
  },
  simulatedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 8px',
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  simulatedDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#F59E0B',
  },
  simulatedText: {
    fontSize: 10,
    color: '#FCD34D',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  },
  navSection: {
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    overflowY: 'auto' as const,
  },
  navGroupLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: '0.08em',
    padding: '6px 10px',
    marginBottom: 4,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 12px',
    borderRadius: '0 6px 6px 0',
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background-color 0.15s, color 0.15s',
    textAlign: 'left' as const,
    width: '100%',
    fontFamily: 'inherit',
  },
  navBadge: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 9999,
    padding: '1px 6px',
    minWidth: 18,
    textAlign: 'center' as const,
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  systemStatusBox: {
    padding: '8px 10px',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#CBD5E1',
  },
  statusSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  customerPortalLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: 6,
    backgroundColor: 'transparent',
    border: '1px solid #E5E7EB',
    color: '#6B7280',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, color 0.15s',
  },
  portalTag: {
    fontSize: 10,
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  mainWrapper: {
    marginLeft: 250,
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FAFBFC',
  },
  topbar: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
  },
  topbarLeft: {
    flex: 1,
    maxWidth: 420,
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '6px 12px',
    width: '100%',
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
  searchHint: {
    fontSize: 10,
    color: '#475569',
    backgroundColor: '#E5E7EB',
    padding: '1px 5px',
    borderRadius: 3,
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  timeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  },
  envTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: 600,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6B7280',
  },
  topbarBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 9999,
    padding: '1px 4px',
    minWidth: 16,
    textAlign: 'center' as const,
    border: '2px solid #FFFFFF',
  },
  content: {
    padding: '24px 28px',
    flex: 1,
  },
};
