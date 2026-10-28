import { useNavigate } from 'react-router-dom';
import { FileText, Search, Shield, ArrowRight, Headphones } from 'lucide-react';

export function CustomerLanding() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.iconWrap}>
          <Headphones size={32} color="#059669" />
        </div>
        <h1 style={styles.heading}>SamadhanAI Support Centre</h1>
        <p style={styles.subheading}>
          We're here to help. Submit a complaint or track an existing one to get a quick resolution.
        </p>
      </div>

      <div style={styles.cardsRow}>
        <button style={styles.card} onClick={() => navigate('/submit')}>
          <div style={styles.cardIcon}>
            <FileText size={24} color="#059669" />
          </div>
          <h3 style={styles.cardTitle}>Submit a Complaint</h3>
          <p style={styles.cardDesc}>
            Describe your issue and we'll generate a unique reference number for tracking.
          </p>
          <span style={styles.cardLink}>
            Get Started <ArrowRight size={14} />
          </span>
        </button>

        <button style={styles.card} onClick={() => navigate('/track')}>
          <div style={styles.cardIcon}>
            <Search size={24} color="#059669" />
          </div>
          <h3 style={styles.cardTitle}>Track a Complaint</h3>
          <p style={styles.cardDesc}>
            Enter your reference number to view the current status, timeline, and resolution.
          </p>
          <span style={styles.cardLink}>
            Track Now <ArrowRight size={14} />
          </span>
        </button>
      </div>

      <div style={styles.trustRow}>
        <div style={styles.trustItem}>
          <Shield size={16} color="#059669" />
          <span>Your data is secure & private</span>
        </div>
        <div style={styles.trustItem}>
          <Headphones size={16} color="#059669" />
          <span>48-hour response guarantee</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '60px 20px 40px',
    textAlign: 'center' as const,
  },
  hero: {
    marginBottom: 40,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: '#ECFDF5',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
  },
  subheading: {
    fontSize: 16,
    color: '#6B7280',
    margin: 0,
    maxWidth: 480,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.5',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 32,
  },
  card: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 28,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: 'inherit',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: '#F0FDF4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    margin: 0,
    lineHeight: '1.5',
    flex: 1,
  },
  cardLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    fontWeight: 600,
    color: '#059669',
    marginTop: 8,
  },
  trustRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    flexWrap: 'wrap' as const,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#6B7280',
  },
};
