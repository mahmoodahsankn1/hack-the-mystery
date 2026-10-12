import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { team, logoutTeam, gameState } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutTeam();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => navigate('/room')} style={{ cursor: 'pointer' }}>
        <span className="brand-title">HACK THE MYSTERY</span>
        <span className="brand-subtitle">THE DIAMOND HEIST — ROUND 1</span>
      </div>

      <div className="nav-actions">
        {team ? (
          <>
            <span className="team-badge">
              {team.is_admin ? '👑 ADMIN: ' : '🕵️ TEAM: '}
              <strong>{team.team_name}</strong>
            </span>

            {team.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid var(--gold-accent)',
                  color: 'var(--gold-accent)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Control Panel
              </button>
            )}

            <button onClick={handleLogout} className="btn-logout">
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="btn-logout">
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
