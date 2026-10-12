import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { team, gameState, setGameState } = useAuth();
  const [teamsList, setTeamsList] = useState([]);
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamsAndSubmissions();
  }, []);

  const fetchTeamsAndSubmissions = async () => {
    try {
      const { data: teams } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
      setTeamsList(teams || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleStartGame = async () => {
    setStarting(true);
    setError('');
    const now = new Date().toISOString();

    try {
      const { data, error: updateErr } = await supabase
        .from('game_state')
        .update({
          is_started: true,
          started_at: now,
          updated_at: now
        })
        .eq('id', 1)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setGameState(data);
    } catch (err) {
      setError(err.message || 'Failed to start game.');
    } finally {
      setStarting(false);
    }
  };

  const handleResetGame = async () => {
    if (!window.confirm('Are you sure you want to reset the game state?')) return;
    setResetting(true);
    setError('');

    try {
      const { data, error: updateErr } = await supabase
        .from('game_state')
        .update({
          is_started: false,
          started_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setGameState(data);
    } catch (err) {
      setError(err.message || 'Failed to reset game.');
    } finally {
      setResetting(false);
    }
  };

  if (!team || !team.is_admin) {
    return (
      <>
        <Navbar />
        <div className="waiting-container">
          <div className="waiting-card" style={{ borderColor: 'var(--danger-red)' }}>
            <h2 style={{ color: 'var(--danger-red)', marginBottom: '1rem' }}>⚠️ ACCESS DENIED</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You do not have administrator permissions to access this control panel.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="evidence-room">
        <div className="section-header">
          <h2>🛡️ ADMINISTRATOR CONTROL PANEL</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage game execution, monitor team registrations, and review Round 1 theory submissions.
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* GAME CONTROLS */}
        <div className="panel-box" style={{ marginBottom: '2rem' }}>
          <h3 className="panel-title">⚡ GLOBAL GAME CONTROLS</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
            <div>
              <p><strong>Game Status:</strong> {gameState.is_started ? <span style={{ color: '#22c55e' }}>GAME IN PROGRESS</span> : <span style={{ color: 'var(--gold-accent)' }}>WAITING TO START</span>}</p>
              {gameState.started_at && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Started at: {new Date(gameState.started_at).toLocaleString()}</p>}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {!gameState.is_started ? (
                <button
                  onClick={handleStartGame}
                  className="btn-primary"
                  style={{ background: '#22c55e', width: 'auto', padding: '0.75rem 2rem' }}
                  disabled={starting}
                >
                  {starting ? 'Starting...' : '▶ START GAME'}
                </button>
              ) : (
                <button
                  onClick={handleResetGame}
                  className="btn-primary"
                  style={{ background: 'var(--danger-red)', width: 'auto', padding: '0.75rem 2rem' }}
                  disabled={resetting}
                >
                  {resetting ? 'Resetting...' : '⏹ RESET GAME'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* REGISTERED TEAMS */}
        <div className="panel-box" style={{ marginBottom: '2rem' }}>
          <h3 className="panel-title">👥 REGISTERED TEAMS ({teamsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--gold-accent)' }}>
                  <th style={{ padding: '0.75rem' }}>Team Name</th>
                  <th style={{ padding: '0.75rem' }}>Participant 1</th>
                  <th style={{ padding: '0.75rem' }}>Participant 2</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {teamsList.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{t.team_name}</td>
                    <td style={{ padding: '0.75rem' }}>{t.member1_name}</td>
                    <td style={{ padding: '0.75rem' }}>{t.member2_name}</td>
                    <td style={{ padding: '0.75rem' }}>{t.is_admin ? <span className="badge-clearance">ADMIN</span> : 'Team'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
