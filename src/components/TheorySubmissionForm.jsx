import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function TheorySubmissionForm({ isExpired }) {
  const { team, gameState } = useAuth();
  const [theory, setTheory] = useState('');
  const [investigationFocus, setInvestigationFocus] = useState('');
  const [evidence1, setEvidence1] = useState('');
  const [evidence2, setEvidence2] = useState('');
  const [unansweredQuestions, setUnansweredQuestions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!team) return;
    async function checkExistingSubmission() {
      const { data } = await supabase
        .from('round1_submissions')
        .select('*')
        .eq('team_id', team.id)
        .single();

      if (data) {
        setSubmitted(true);
        setTheory(data.theory);
        setInvestigationFocus(data.investigation_focus);
        setEvidence1(data.supporting_evidence_1);
        setEvidence2(data.supporting_evidence_2);
        setUnansweredQuestions(data.unanswered_questions);
      }
    }
    checkExistingSubmission();
  }, [team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) return;
    setError('');

    // Client validation
    if (!theory || !investigationFocus || !evidence1 || !evidence2 || !unansweredQuestions) {
      setError('Please fill out all required fields.');
      return;
    }

    if (evidence1 === evidence2) {
      setError('Please select two distinct supporting evidence records.');
      return;
    }

    setLoading(true);

    try {
      // Server-side timer check against gameState.started_at
      const startTime = new Date(gameState.started_at).getTime();
      const durationMs = (gameState.round1_duration_minutes || 15) * 60 * 1000;
      const isLate = Date.now() > (startTime + durationMs);

      const { error: insertError } = await supabase
        .from('round1_submissions')
        .insert([
          {
            team_id: team.id,
            theory,
            investigation_focus: investigationFocus,
            supporting_evidence_1: evidence1,
            supporting_evidence_2: evidence2,
            unanswered_questions: unansweredQuestions,
            is_late: isLate
          }
        ]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="panel-box">
        <h3 className="panel-title" style={{ color: '#22c55e' }}>✓ INITIAL THEORY SUBMITTED</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Your team's initial findings for Round 1 have been recorded securely. Round 2 interrogation will unlock once Round 1 completes.
        </p>
        <div style={{ background: '#0a0d14', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
          <p><strong>Primary Theory:</strong> {theory}</p>
          <p style={{ marginTop: '0.5rem' }}><strong>Investigation Focus:</strong> {investigationFocus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-box">
      <h3 className="panel-title">📋 SUBMIT INITIAL THEORY</h3>
      {error && <div className="error-banner">{error}</div>}
      {isExpired && (
        <div className="error-banner">
          ⚠️ Round 1 time has expired. Submissions made now will be flagged as LATE on the server.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label>Primary Working Theory</label>
          <textarea
            className="form-control"
            rows="3"
            value={theory}
            onChange={(e) => setTheory(e.target.value)}
            required
            placeholder="Describe what you believe happened during the 22:14-22:30 breach window..."
          />
        </div>

        <div className="form-group">
          <label>Primary Investigation Focus</label>
          <input
            type="text"
            className="form-control"
            value={investigationFocus}
            onChange={(e) => setInvestigationFocus(e.target.value)}
            required
            placeholder="e.g. Server B-4 telemetry, Maintenance Code 4492, Bay 3 exit"
          />
        </div>

        <div className="form-group">
          <label>Supporting Evidence Record #1</label>
          <select
            className="form-control"
            value={evidence1}
            onChange={(e) => setEvidence1(e.target.value)}
            required
          >
            <option value="">Select Evidence Record 1</option>
            <option value="CAM-01">CCTV CAM-01 (Maintenance Figure w/ Pelican Case)</option>
            <option value="CAM-02">CCTV CAM-02 (Pedestal Glitch & Weight Drop)</option>
            <option value="CAM-03">CCTV CAM-03 (Stairwell Exit w/ Smartwatch)</option>
            <option value="CAM-04">CCTV CAM-04 (Control Room & Server Room 2 Entry)</option>
            <option value="CAM-05">CCTV CAM-05 (Loading Dock Bay 3 Courier Van)</option>
            <option value="MSG-M01">Intercepted Message M-01 (Frequency Shift Warning)</option>
            <option value="MSG-M02">Intercepted Message M-02 (Kabir & R. D'Souza Server B-4)</option>
            <option value="MSG-M03">Intercepted Message M-03 (Code 4492 Instructions)</option>
            <option value="MSG-M04">Intercepted Message M-04 (Nisha V. Art Buyer Transfer)</option>
            <option value="LOG-882">Maintenance Log #882 (Diagnostic Mute Approved)</option>
            <option value="LOG-E03">Security Log E-03 (Keycard #3309 Dev Malhotra)</option>
            <option value="LOG-VIB">Display Case Vibration Sensor (Chemical Lubricant Dampening)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Supporting Evidence Record #2 (Must be distinct)</label>
          <select
            className="form-control"
            value={evidence2}
            onChange={(e) => setEvidence2(e.target.value)}
            required
          >
            <option value="">Select Evidence Record 2</option>
            <option value="CAM-01">CCTV CAM-01 (Maintenance Figure w/ Pelican Case)</option>
            <option value="CAM-02">CCTV CAM-02 (Pedestal Glitch & Weight Drop)</option>
            <option value="CAM-03">CCTV CAM-03 (Stairwell Exit w/ Smartwatch)</option>
            <option value="CAM-04">CCTV CAM-04 (Control Room & Server Room 2 Entry)</option>
            <option value="CAM-05">CCTV CAM-05 (Loading Dock Bay 3 Courier Van)</option>
            <option value="MSG-M01">Intercepted Message M-01 (Frequency Shift Warning)</option>
            <option value="MSG-M02">Intercepted Message M-02 (Kabir & R. D'Souza Server B-4)</option>
            <option value="MSG-M03">Intercepted Message M-03 (Code 4492 Instructions)</option>
            <option value="MSG-M04">Intercepted Message M-04 (Nisha V. Art Buyer Transfer)</option>
            <option value="LOG-882">Maintenance Log #882 (Diagnostic Mute Approved)</option>
            <option value="LOG-E03">Security Log E-03 (Keycard #3309 Dev Malhotra)</option>
            <option value="LOG-VIB">Display Case Vibration Sensor (Chemical Lubricant Dampening)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Unanswered Questions / Key Inconsistencies</label>
          <textarea
            className="form-control"
            rows="2"
            value={unansweredQuestions}
            onChange={(e) => setUnansweredQuestions(e.target.value)}
            required
            placeholder="What key questions remain before Round 2 interrogation?"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Round 1 Theory'}
        </button>
      </form>
    </div>
  );
}
