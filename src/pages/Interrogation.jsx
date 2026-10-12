import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import GameTimer from '../components/GameTimer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ── Suspect catalogue ─────────────────────────────────────────────────────────
const SUSPECTS = [
  {
    id: 'ryan-dsouza',
    name: "Ryan D'Souza",
    role: 'Chief Security Director',
    access: 'Level 5 — Master Access',
    intro: "D'Souza here. If you have questions, ask them plainly. I've already been through the incident logs.",
    description: "Oversaw server maintenance on the night of the theft. Seen near the display at 10:45 PM.",
    initials: 'RD',
    color: '#d4af37',
  },
  {
    id: 'kabir-shah',
    name: 'Kabir Shah',
    role: 'Senior Systems Engineer',
    access: 'Level 4 — Technical Admin',
    intro: "Shah. If your question relates to the technical records, I'll give you the timestamps. Ask something specific.",
    description: "Logged a manual E-03 check at 10:58 PM. Was asked to verify E-03 again before closing.",
    initials: 'KS',
    color: '#00d2ff',
  },
  {
    id: 'maya-thomas',
    name: 'Maya Thomas',
    role: 'Restoration & Conservation Lead',
    access: 'Level 2 — Lab & Display Access',
    intro: "I'm Maya Thomas. I'll answer what I can — though I expect you to distinguish what the records show from what you're assuming.",
    description: "Recorded leaving the administration area at 11:46:50 PM. Sent Kabir a message about E-03.",
    initials: 'MT',
    color: '#a78bfa',
  },
  {
    id: 'dev-malhotra',
    name: 'Dev Malhotra',
    role: 'Night Security Supervisor',
    access: 'Level 3 — Gallery Patrol',
    intro: "Malhotra. I know why you're here. Go ahead and ask, but keep your accusations to what the record actually establishes.",
    description: "Received a maintenance request at 11:35 PM. DEV-118 credential logged in Exhibition Room at 11:47:05 PM.",
    initials: 'DM',
    color: '#f97316',
  },
  {
    id: 'nisha-varma',
    name: 'Nisha Varma',
    role: 'Head Curator of Antiquities',
    access: 'Level 3 — Vault Access',
    intro: "Varma. I left the museum before ten o'clock. If you have questions about that evening, I'll do my best to help.",
    description: "States she left the museum at 9:45 PM. Departure is not independently verified.",
    initials: 'NV',
    color: '#34d399',
  },
];

const SUSPECT_MAP = Object.fromEntries(SUSPECTS.map(s => [s.id, s]));

const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interrogate`;

export default function Interrogation() {
  const { team, gameState } = useAuth();

  // Round 2 session state
  const [session, setSession] = useState(null); // { questions_used, locked_suspect }
  const [questions, setQuestions] = useState([]); // accepted Q&A rows

  // UI state
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null); // before first Q
  const [showConfirm, setShowConfirm] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [roundEnded, setRoundEnded] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const isRound2Active = gameState?.round2_status === 'active';
  const isRound2Waiting = gameState?.round2_status === 'waiting' || !gameState?.round2_status;
  const round2StartedAt = gameState?.round2_started_at;
  const round2Duration = gameState?.round2_duration_minutes || 6;

  // Derive deadline
  const deadlineMs = round2StartedAt
    ? new Date(round2StartedAt).getTime() + round2Duration * 60000
    : null;

  // Auto-detect expired
  useEffect(() => {
    if (!deadlineMs) return;
    const check = () => {
      if (Date.now() >= deadlineMs) setRoundEnded(true);
    };
    check();
    const iv = setInterval(check, 1000);
    return () => clearInterval(iv);
  }, [deadlineMs]);

  useEffect(() => {
    if (gameState?.round2_status === 'ended') setRoundEnded(true);
  }, [gameState?.round2_status]);

  // ── Load session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!team?.id) return;
    loadSession();
  }, [team?.id]);

  const loadSession = async () => {
    setLoadingSession(true);
    try {
      // Fetch session row
      const { data: sessionRow } = await supabase
        .from('round2_sessions')
        .select('*')
        .eq('team_id', team.id)
        .single();

      if (sessionRow) {
        setSession(sessionRow);
        if (sessionRow.locked_suspect) {
          setSelectedSuspect(sessionRow.locked_suspect);
        }
      }

      // Fetch accepted questions
      const { data: qRows } = await supabase
        .from('round2_questions')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: true });

      if (qRows) setQuestions(qRows);
    } catch (err) {
      console.error('Error loading Round 2 session:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!team?.id) return;

    const sessionSub = supabase
      .channel('round2_session_' + team.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'round2_sessions',
        filter: `team_id=eq.${team.id}`,
      }, (payload) => {
        if (payload.new) setSession(payload.new);
      })
      .subscribe();

    const questionSub = supabase
      .channel('round2_questions_' + team.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'round2_questions',
        filter: `team_id=eq.${team.id}`,
      }, () => {
        // Re-fetch on any change
        supabase
          .from('round2_questions')
          .select('*')
          .eq('team_id', team.id)
          .order('created_at', { ascending: true })
          .then(({ data }) => { if (data) setQuestions(data); });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(questionSub);
    };
  }, [team?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questions, submitting]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectSuspect = (suspectId) => {
    if (session?.locked_suspect) return; // Already locked — no switching
    setPendingSelection(suspectId);
    setShowConfirm(true);
  };

  const handleConfirmSuspect = () => {
    setSelectedSuspect(pendingSelection);
    setShowConfirm(false);
    setPendingSelection(null);
    setSubmitError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setPendingSelection(null);
  };

  const handleBackToSelection = () => {
    if (session?.locked_suspect) return; // Can't go back once locked
    setSelectedSuspect(null);
    setSubmitError('');
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    const q = questionInput.trim();
    if (!q || submitting) return;
    if (roundEnded) {
      setSubmitError('Interrogation time has expired.');
      return;
    }
    if ((session?.questions_used ?? 0) >= 3) {
      setSubmitError('Your team has used all 3 questions.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const idempotencyKey = `${team.id}-${selectedSuspect}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: team.id,
          suspect_id: selectedSuspect,
          question: q,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Request failed. Please try again.');
        return;
      }

      // Update local state immediately (realtime will also fire)
      if (data.questions_used !== undefined) {
        setSession(prev => ({
          ...prev,
          questions_used: data.questions_used,
          locked_suspect: data.locked_suspect || selectedSuspect,
        }));
      }

      setQuestionInput('');
      await loadSession(); // refresh questions list
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const questionsUsed = session?.questions_used ?? 0;
  const questionsLeft = Math.max(0, 3 - questionsUsed);
  const lockedSuspect = session?.locked_suspect;

  // Questions for the selected suspect view
  const visibleQuestions = questions.filter(q => q.suspect_id === selectedSuspect);
  const currentSuspectData = selectedSuspect ? SUSPECT_MAP[selectedSuspect] : null;

  // ── RENDER: Waiting for admin ─────────────────────────────────────────────
  if (isRound2Waiting && !isRound2Active && !roundEnded) {
    return (
      <>
        <Navbar />
        <div className="waiting-container">
          <div className="waiting-card">
            <h2 style={{ color: 'var(--gold-accent)', marginBottom: '1rem' }}>
              🔒 ROUND 2 — INTERROGATE
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Five suspects. Three questions. Choose carefully.</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              The interrogation room is locked. The administrator has not started Round 2 yet.
              All teams will gain access simultaneously when the round begins.
            </p>
            <div className="spinner"></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gold-accent)' }}>
              Awaiting admin START ROUND 2 trigger...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── RENDER: Loading session ───────────────────────────────────────────────
  if (loadingSession) {
    return (
      <>
        <Navbar />
        <div className="waiting-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading your session...</p>
        </div>
      </>
    );
  }

  // ── RENDER: Round ended (or time expired) — show summary ─────────────────
  if (roundEnded || gameState?.round2_status === 'ended') {
    return (
      <>
        <Navbar />
        <div className="evidence-room">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>ROUND 2 — INTERROGATE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Interrogation session closed.
              </p>
            </div>
            <div className="r2-closed-badge">⏹ INTERROGATION CLOSED</div>
          </div>

          <div className="panel-box" style={{ marginBottom: '2rem', borderColor: 'rgba(239,68,68,0.4)' }}>
            <h3 className="panel-title" style={{ color: 'var(--danger-red)' }}>⏱ TIME EXPIRED</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              The six-minute interrogation window has closed. Your submitted questions and answers are preserved below.
            </p>
            {lockedSuspect && currentSuspectData && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                You interrogated: <strong style={{ color: 'var(--gold-accent)' }}>{currentSuspectData.name}</strong>
                {' '} — {questionsUsed} of 3 question{questionsUsed !== 1 ? 's' : ''} used.
              </p>
            )}
            {!lockedSuspect && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Your team did not submit any questions during Round 2.
              </p>
            )}
          </div>

          {questions.length > 0 && (
            <div className="panel-box">
              <h3 className="panel-title">📋 INTERROGATION TRANSCRIPT</h3>
              <div className="r2-chat-log">
                {questions.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: '1.5rem' }}>
                    <div className="r2-chat-q-label">Q{i + 1} — {SUSPECT_MAP[q.suspect_id]?.name}</div>
                    <div className="r2-chat-bubble r2-bubble-team">{q.question_text}</div>
                    {q.answer_text && (
                      <div className="r2-chat-bubble r2-bubble-suspect">{q.answer_text}</div>
                    )}
                    {q.status === 'error' && !q.answer_text && (
                      <div className="r2-chat-bubble r2-bubble-error">AI response failed for this question.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0.75rem 2rem' }}
              onClick={() => window.location.href = '/room'}
            >
              ← Return to Evidence Room
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── RENDER: Suspect confirmation modal ────────────────────────────────────
  const pendingSuspectData = pendingSelection ? SUSPECT_MAP[pendingSelection] : null;

  // ── RENDER: Active round — suspect selection ──────────────────────────────
  if (!selectedSuspect) {
    return (
      <>
        <Navbar />
        <div className="evidence-room">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>ROUND 2 — INTERROGATE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Five suspects. Three questions. Choose <em>one</em> suspect carefully — you cannot switch after your first question.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <GameTimer startedAt={round2StartedAt} durationMinutes={round2Duration} onExpire={() => setRoundEnded(true)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--gold-accent)' }}>
                {questionsLeft} of 3 questions remaining
              </span>
            </div>
          </div>

          {/* Confirmation modal */}
          {showConfirm && pendingSuspectData && (
            <div className="r2-modal-overlay">
              <div className="r2-modal">
                <h3 style={{ color: 'var(--gold-accent)', marginBottom: '1rem' }}>⚠ Confirm Selection</h3>
                <p style={{ marginBottom: '0.5rem' }}>
                  You are about to select <strong style={{ color: 'var(--gold-accent)' }}>{pendingSuspectData.name}</strong>.
                </p>
                <div className="r2-modal-warning">
                  Choose carefully. Once you submit your first question, <strong>this suspect is locked for the entire round</strong>. You cannot switch.
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-primary" style={{ width: 'auto', padding: '0.7rem 1.5rem', background: 'var(--gold-accent)' }} onClick={handleConfirmSuspect}>
                    Proceed to Interrogation
                  </button>
                  <button className="btn-logout" onClick={handleCancelConfirm}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="r2-suspect-grid">
            {SUSPECTS.map(suspect => (
              <div
                key={suspect.id}
                className={`r2-suspect-card ${lockedSuspect && lockedSuspect !== suspect.id ? 'r2-suspect-disabled' : ''}`}
                onClick={() => !lockedSuspect && handleSelectSuspect(suspect.id)}
                style={{ cursor: lockedSuspect ? 'default' : 'pointer' }}
              >
                <div className="r2-suspect-avatar" style={{ background: `${suspect.color}22`, borderColor: suspect.color, color: suspect.color }}>
                  {suspect.initials}
                </div>
                <div className="r2-suspect-info">
                  <h3 style={{ color: 'var(--gold-accent)' }}>{suspect.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>{suspect.role}</p>
                  <span className="badge-clearance" style={{ marginTop: '0.4rem', display: 'inline-block' }}>{suspect.access}</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.6rem', lineHeight: 1.5 }}>
                    {suspect.description}
                  </p>
                </div>
                <button
                  className="r2-interrogate-btn"
                  style={{ borderColor: suspect.color, color: suspect.color }}
                  disabled={!!lockedSuspect}
                  onClick={(e) => { e.stopPropagation(); if (!lockedSuspect) handleSelectSuspect(suspect.id); }}
                >
                  Interrogate
                </button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── RENDER: Active round — chat view ──────────────────────────────────────
  const isLocked = !!lockedSuspect;
  const canAsk = !roundEnded && questionsLeft > 0 && !submitting;

  return (
    <>
      <Navbar />
      <div className="evidence-room">
        {/* Header */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isLocked && (
              <button
                className="btn-logout"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={handleBackToSelection}
              >
                ← Back
              </button>
            )}
            <div>
              <h2>ROUND 2 — INTERROGATE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Interrogating: <strong style={{ color: 'var(--gold-accent)' }}>{currentSuspectData?.name}</strong>
                {isLocked && <span style={{ color: 'var(--danger-red)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>🔒 LOCKED</span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <GameTimer startedAt={round2StartedAt} durationMinutes={round2Duration} onExpire={() => setRoundEnded(true)} />
            <span style={{ fontSize: '0.85rem', color: questionsLeft === 0 ? 'var(--danger-red)' : 'var(--gold-accent)' }}>
              {questionsLeft} of 3 questions remaining
            </span>
          </div>
        </div>

        <div className="r2-chat-layout">
          {/* Suspect info panel */}
          <div className="r2-chat-sidebar">
            <div className="panel-box" style={{ borderColor: `${currentSuspectData?.color}44` }}>
              <div className="r2-suspect-avatar-lg" style={{ background: `${currentSuspectData?.color}22`, borderColor: currentSuspectData?.color, color: currentSuspectData?.color }}>
                {currentSuspectData?.initials}
              </div>
              <h3 style={{ color: 'var(--gold-accent)', marginTop: '1rem' }}>{currentSuspectData?.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{currentSuspectData?.role}</p>
              <span className="badge-clearance" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{currentSuspectData?.access}</span>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#0a0d14', borderRadius: '6px', borderLeft: `2px solid ${currentSuspectData?.color}` }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {currentSuspectData?.description}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div className="r2-q-counter">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>QUESTIONS USED</span>
                  <div className="r2-q-dots">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`r2-q-dot ${i < questionsUsed ? 'r2-q-dot-used' : ''}`} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: questionsLeft === 0 ? 'var(--danger-red)' : 'var(--text-primary)' }}>
                    {questionsUsed}/3
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="r2-chat-main">
            <div className="r2-chat-window">
              {/* Welcome intro */}
              <div className="r2-chat-bubble r2-bubble-suspect r2-intro-bubble">
                <span className="r2-bubble-label">{currentSuspectData?.name}</span>
                <p>{currentSuspectData?.intro}</p>
              </div>

              {/* Q&A history */}
              {visibleQuestions.map((q, i) => (
                <React.Fragment key={q.id}>
                  <div className="r2-chat-bubble r2-bubble-team">
                    <span className="r2-bubble-label">Your Team</span>
                    <p>{q.question_text}</p>
                  </div>
                  {q.status === 'pending' && !q.answer_text && (
                    <div className="r2-chat-bubble r2-bubble-suspect r2-bubble-thinking">
                      <span className="r2-bubble-label">{currentSuspectData?.name}</span>
                      <div className="r2-thinking-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  {q.answer_text && (
                    <div className="r2-chat-bubble r2-bubble-suspect">
                      <span className="r2-bubble-label">{currentSuspectData?.name}</span>
                      <p>{q.answer_text}</p>
                    </div>
                  )}
                  {q.status === 'error' && !q.answer_text && (
                    <div className="r2-chat-bubble r2-bubble-error">
                      <p>⚠ The response failed. This question credit has been refunded — please try again.</p>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Submission loading */}
              {submitting && (
                <div className="r2-chat-bubble r2-bubble-suspect r2-bubble-thinking">
                  <span className="r2-bubble-label">{currentSuspectData?.name}</span>
                  <div className="r2-thinking-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {submitError && (
              <div className="error-banner" style={{ margin: '0 0 0.75rem 0' }}>
                {submitError}
              </div>
            )}

            {questionsLeft === 0 || roundEnded ? (
              <div className="r2-no-questions-banner">
                {roundEnded
                  ? '⏱ Interrogation time has expired.'
                  : '✓ You have used all 3 questions. Review the answers above.'}
              </div>
            ) : (
              <form className="r2-chat-input-row" onSubmit={handleSubmitQuestion}>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control r2-chat-input"
                  placeholder={`Ask ${currentSuspectData?.name} a question…`}
                  value={questionInput}
                  onChange={e => setQuestionInput(e.target.value)}
                  maxLength={500}
                  disabled={submitting || !canAsk}
                />
                <button
                  type="submit"
                  className="btn-primary r2-send-btn"
                  disabled={!questionInput.trim() || submitting || !canAsk}
                >
                  {submitting ? '…' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
