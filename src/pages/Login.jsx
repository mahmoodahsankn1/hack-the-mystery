import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [teamName, setTeamName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('team_name', teamName)
        .eq('passcode', passcode)
        .single();

      if (fetchError || !data) {
        throw new Error('Invalid Team Name or Passcode.');
      }

      loginTeam(data);
      if (data.is_admin) {
        navigate('/admin');
      } else {
        navigate('/room');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ color: 'var(--gold-accent)', marginBottom: '0.5rem', textAlign: 'center' }}>
          TEAM LOGIN
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          HACK THE MYSTERY — THE DIAMOND HEIST
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              className="form-control"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="Enter team name"
            />
          </div>

          <div className="form-group">
            <label>Team Passcode</label>
            <input
              type="password"
              className="form-control"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              placeholder="Enter passcode"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Need to register?{' '}
          <a href="/register" style={{ color: 'var(--gold-accent)' }}>
            Register Team
          </a>
        </p>
      </div>
    </div>
  );
}
