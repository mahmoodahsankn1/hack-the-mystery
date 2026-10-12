import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function NotesWidget() {
  const { team } = useAuth();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!team) return;

    async function loadNotes() {
      const { data } = await supabase
        .from('team_notes')
        .select('content')
        .eq('team_id', team.id)
        .single();

      if (data) {
        setNotes(data.content || '');
      }
    }

    loadNotes();
  }, [team]);

  const handleSaveNotes = async () => {
    if (!team) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('team_notes')
        .upsert(
          { team_id: team.id, content: notes, updated_at: new Date().toISOString() },
          { onConflict: 'team_id' }
        );

      if (error) throw error;
      setMessage('Notes saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setMessage('Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel-box">
      <h3 className="panel-title">📝 PRIVATE INVESTIGATION NOTES</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Notes are private to <strong>{team?.team_name}</strong> and saved to Supabase.
      </p>

      {message && <div className="success-banner" style={{ fontSize: '0.8rem', padding: '0.4rem' }}>{message}</div>}

      <textarea
        className="notes-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Record timeline anomalies, suspect contradictions, or hypothesis details..."
      />

      <button
        onClick={handleSaveNotes}
        className="btn-primary"
        style={{ marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.85rem' }}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Notes'}
      </button>
    </div>
  );
}
