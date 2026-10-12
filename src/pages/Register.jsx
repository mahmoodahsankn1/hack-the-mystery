import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [teamName, setTeamName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if team name exists
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('team_name', teamName)
        .single();

      if (existing) {
        throw new Error('Team name already exists. Please choose a different team name or login.');
      }

      const { data, error: insertError } = await supabase
        .from('teams')
        .insert([
          {
            team_name: teamName,
            member1_name: member1,
            member2_name: member2,
            passcode: passcode,
            is_admin: false
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      loginTeam(data);
      if (data.is_admin) {
        navigate('/admin');
      } else {
        navigate('/room');
      }
    } catch (err) {
      setError(err.message || 'Failed to register team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ color: 'var(--gold-accent)', marginBottom: '0.5rem', textAlign: 'center' }}>
          TEAM REGISTRATION
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          HACK THE MYSTERY — THE DIAMOND HEIST
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              className="form-control"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="e.g. Cyber Detectives"
            />
          </div>

          <div className="form-group">
            <label>Participant 1 Name</label>
            <input
              type="text"
              className="form-control"
              value={member1}
              onChange={(e) => setMember1(e.target.value)}
              required
              placeholder="Full Name"
            />
          </div>

          <div className="form-group">
            <label>Participant 2 Name</label>
            <input
              type="text"
              className="form-control"
              value={member2}
              onChange={(e) => setMember2(e.target.value)}
              required
              placeholder="Full Name"
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
              placeholder="Create a team passcode"
            />
          </div>


          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register Team'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <a href="/login" style={{ color: 'var(--gold-accent)' }}>
            Sign In Here
          </a>
        </p>
      </div>
    </div>
  );
}
