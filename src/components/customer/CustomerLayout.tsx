import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Headphones, FileText, Search, LayoutDashboard } from 'lucide-react';

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoRow} onClick={() => navigate('/')}>
            <div style={styles.logoIcon}>
              <Headphones size={18} color="#059669" />
            </div>
            <span style={styles.logoText}>SamadhanAI</span>
          </div>
          <nav style={styles.nav}>
            <button
              style={{
                ...styles.navBtn,
                color: location.pathname === '/submit' ? '#059669' : '#6B7280',
                fontWeight: location.pathname === '/submit' ? 600 : 500,
              }}
              onClick={() => navigate('/submit')}
            >
              <FileText size={16} /> Submit
            </button>
            <button
              style={{
                ...styles.navBtn,
                color: location.pathname.startsWith('/track') ? '#059669' : '#6B7280',
                fontWeight: location.pathname.startsWith('/track') ? 600 : 500,
              }}
              onClick={() => navigate('/track')}
            >
              <Search size={16} /> Track
            </button>
            <div style={styles.divider} />
            <button
              style={styles.adminLink}
              onClick={() => navigate('/admin')}
            >
              <LayoutDashboard size={14} /> Admin
            </button>
          </nav>
        </div>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: '#FAFBFC',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 20px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#ECFDF5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'none',
    color: '#6B7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  divider: {
    width: 1,
    height: 20,
    background: '#E5E7EB',
    margin: '0 8px',
  },
  adminLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#6B7280',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  main: {
    minHeight: 'calc(100vh - 56px)',
  },
};
