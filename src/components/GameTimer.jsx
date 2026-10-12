import React, { useState, useEffect } from 'react';

export default function GameTimer({ startedAt, durationMinutes, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startedAt) return;

    const startTime = new Date(startedAt).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpire]);

  if (timeLeft === null) return null;

  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isLowTime = totalSeconds < 180; // Less than 3 mins

  return (
    <div className={`timer-badge ${isLowTime ? 'low-time' : ''}`}>
      <span className="timer-icon">⏱️</span>
      <span className="timer-label">TIME REMAINING:</span>
      <span className="timer-digits">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isExpired && <span className="expired-tag">EXPIRED</span>}
    </div>
  );
}
