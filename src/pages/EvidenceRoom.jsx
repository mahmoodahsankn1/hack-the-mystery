import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import GameTimer from '../components/GameTimer';
import NotesWidget from '../components/NotesWidget';
import { useAuth } from '../context/AuthContext';
import {
  CASE_OVERVIEW,
  SUSPECTS,
  CCTV_EVIDENCE,
  TIMELINE_EVENTS,
  INTERCEPTED_MESSAGES,
  TECHNICAL_LOGS
} from '../lib/evidenceData';

export default function EvidenceRoom() {
  const { gameState } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!gameState.is_started) {
    return (
      <>
        <Navbar />
        <div className="waiting-container">
          <div className="waiting-card">
            <h2 style={{ color: 'var(--gold-accent)', marginBottom: '1rem' }}>
              🕵️ INVESTIGATION ROOM LOCKED
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              The administrator has not started the game yet. Please wait in this lobby. The evidence
              room will unlock automatically across all team computers as soon as the start signal is
              given.
            </p>
            <div className="spinner"></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gold-accent)' }}>
              Awaiting Admin START GAME trigger...
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
        {/* HEADER */}
        <div
          className="section-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <h2>ROUND 1 — ANALYZE: THE EVIDENCE ROOM</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Investigate the theft of The Aurora. Analyze the evidence and use your notes to build
              your theory.
            </p>
          </div>
          <GameTimer
            startedAt={gameState.started_at}
            durationMinutes={gameState.round1_duration_minutes || 15}
          />
        </div>

        <div className="grid-2col">
          {/* LEFT: TABBED EVIDENCE */}
          <div>
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Case Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'suspects' ? 'active' : ''}`}
                onClick={() => setActiveTab('suspects')}
              >
                Suspect Profiles ({SUSPECTS.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'cctv' ? 'active' : ''}`}
                onClick={() => setActiveTab('cctv')}
              >
                CCTV Footage ({CCTV_EVIDENCE.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                Timeline Log
              </button>
              <button
                className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                Intercepts &amp; Logs
              </button>
            </div>

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="evidence-card">
                <h3 style={{ color: 'var(--gold-accent)', marginBottom: '1rem' }}>
                  {CASE_OVERVIEW.title}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Location:</strong>
                    <p>{CASE_OVERVIEW.location}</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>
                      Estimated Time of Crime:
                    </strong>
                    <p style={{ color: 'var(--gold-accent)' }}>{CASE_OVERVIEW.timeOfCrime}</p>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Estimated Value:</strong>
                    <p>{CASE_OVERVIEW.value}</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Incident Summary:</strong>
                  <p style={{ marginTop: '0.4rem', lineHeight: '1.6' }}>
                    {CASE_OVERVIEW.description}
                  </p>
                </div>
              </div>
            )}

            {/* ── SUSPECTS ── */}
            {activeTab === 'suspects' && (
              <div>
                {SUSPECTS.map((suspect) => (
                  <div className="evidence-card suspect-card" key={suspect.id}>
                    {/* Profile photo + header */}
                    <div className="suspect-profile-row">
                      <div className="suspect-photo-wrap">
                        <img
                          src={suspect.photo}
                          alt={suspect.name}
                          className="suspect-photo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="suspect-meta">
                        <div className="suspect-header">
                          <h3>{suspect.name}</h3>
                          <span className="badge-clearance">{suspect.clearance}</span>
                        </div>
                        <p
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.88rem',
                            marginTop: '0.25rem'
                          }}
                        >
                          <strong>Role:</strong> {suspect.role}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--cyan-accent)', fontSize: '0.85rem' }}>
                        Stated Alibi:
                      </strong>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{suspect.alibi}</p>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--gold-accent)', fontSize: '0.85rem' }}>
                        Potential Motive / Red Flag:
                      </strong>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{suspect.motive}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── CCTV ── */}
            {activeTab === 'cctv' && (
              <div>
                {CCTV_EVIDENCE.map((cam) => (
                  <div
                    className="evidence-card"
                    key={cam.id}
                    style={{
                      borderLeftWidth: '3px',
                      borderLeftStyle: 'solid',
                      borderLeftColor:
                        cam.type === 'critical' ? 'var(--danger-red)' : 'var(--cyan-accent)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <strong
                        style={{
                          color: cam.type === 'critical' ? 'var(--danger-red)' : 'var(--gold-accent)'
                        }}
                      >
                        {cam.camera}
                      </strong>
                      <span style={{ fontFamily: 'monospace', color: 'var(--cyan-accent)' }}>
                        {cam.timestamp}
                      </span>
                    </div>
                    <p
                      style={{ fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: '1.5' }}
                    >
                      "{cam.caption}"
                    </p>
                    <div
                      style={{
                        background: '#0a0d14',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>System Flag: </span>
                      <span>{cam.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TIMELINE ── */}
            {activeTab === 'timeline' && (
              <div className="timeline-vertical">
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.5rem',
                    fontStyle: 'italic'
                  }}
                >
                  Events listed in exact chronological order. Timestamps are not reordered or
                  changed.&nbsp;
                  <span style={{ color: 'var(--cyan-accent)' }}>Blue dots</span> = recorded
                  observations;&nbsp;
                  <span style={{ color: 'var(--danger-red)' }}>Red dots</span> = critical alerts.
                </p>

                {TIMELINE_EVENTS.map((item, idx) => (
                  <div className="tl-row" key={idx}>
                    {/* Connector line + dot */}
                    <div className="tl-spine">
                      <div
                        className="tl-dot"
                        style={{
                          background: item.type === 'critical' ? 'var(--danger-red)' : 'var(--cyan-accent)',
                          boxShadow:
                            item.type === 'critical'
                              ? '0 0 8px rgba(239,68,68,0.7)'
                              : '0 0 8px rgba(0,210,255,0.5)'
                        }}
                      />
                      {idx < TIMELINE_EVENTS.length - 1 && <div className="tl-line" />}
                    </div>

                    {/* Content */}
                    <div
                      className="tl-content"
                      style={{
                        borderColor: item.type === 'critical' ? 'rgba(239,68,68,0.35)' : 'var(--border-color)'
                      }}
                    >
                      <span
                        className="tl-time"
                        style={{
                          color: item.type === 'critical' ? 'var(--danger-red)' : 'var(--gold-accent)'
                        }}
                      >
                        {item.time}
                      </span>
                      <span className="tl-event">{item.event}</span>
                      {item.type === 'critical' && (
                        <span className="tl-badge-critical">⚠ CRITICAL</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── MESSAGES & LOGS ── */}
            {activeTab === 'messages' && (
              <div>
                {/* Intercepted Messages */}
                <div className="log-section-header">
                  <span className="log-section-icon">📡</span>
                  INTERCEPTED MESSAGES
                </div>

                <div className="message-log-panel">
                  {INTERCEPTED_MESSAGES.map((msg) => (
                    <div className="msg-row" key={msg.id}>
                      <div className="msg-id-badge">{msg.id}</div>
                      <div className="msg-body">
                        <div className="msg-meta">
                          <span className="msg-route">
                            <strong>{msg.sender}</strong>
                            <span style={{ color: 'var(--text-secondary)', margin: '0 0.4rem' }}>
                              →
                            </span>
                            <strong>{msg.recipient}</strong>
                          </span>
                          <span className="msg-time">{msg.time}</span>
                        </div>
                        <p className="msg-text">"{msg.text}"</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical & Security Logs */}
                <div className="log-section-header" style={{ marginTop: '2rem' }}>
                  <span className="log-section-icon">🔒</span>
                  SECURITY &amp; TECHNICAL LOGS
                </div>

                <div className="tech-log-panel">
                  {TECHNICAL_LOGS.map((log, idx) => (
                    <div className="tech-log-row" key={idx}>
                      <div className="tech-log-system">{log.system}</div>
                      <p className="tech-log-detail">{log.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: NOTES */}
          <div className="sidebar-panel">
            <NotesWidget />
          </div>
        </div>
      </div>
    </>
  );
}
