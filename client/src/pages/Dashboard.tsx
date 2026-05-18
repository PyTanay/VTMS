import React, { useEffect, useState } from 'react';
import api from '../api';

interface DashboardStats {
  totalApplications: number;
  activeTrainees: number;
  totalDepartments: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeTrainees: 0,
    totalDepartments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/applications/stats');
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        setError('Error fetching stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2>Welcome to VTMS Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
        Manage vocational training programs effectively.
      </p>

      {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.1)' }}>
          <h3 style={{ color: 'var(--primary-accent)', marginBottom: '8px' }}>Total Applications</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {loading ? '...' : stats.totalApplications}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(236, 72, 153, 0.1)' }}>
          <h3 style={{ color: 'var(--secondary-accent)', marginBottom: '8px' }}>Active Trainees</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {loading ? '...' : stats.activeTrainees}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.1)' }}>
          <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Departments</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {loading ? '...' : stats.totalDepartments}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
