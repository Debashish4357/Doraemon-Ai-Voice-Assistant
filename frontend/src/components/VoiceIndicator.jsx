import React, { memo } from 'react';

// ── Waveform animation component ───────────────────────────────────────────────
export const Waveform = memo(({ active }) => (
  <div className={`waveform ${active ? 'waveform--active' : ''}`}>
    {[...Array(7)].map((_, i) => (
      <span key={i} className="waveform__bar" style={{ animationDelay: `${i * 0.08}s` }} />
    ))}
  </div>
));

// ── Voice Status Indicator ─────────────────────────────────────────────────────
export const VoiceStatus = ({ status, isRunning }) => {
  const config = {
    idle:      { icon: '🟢', label: 'Ready',      cls: 'idle' },
    listening: { icon: '🎤', label: 'Listening…',  cls: 'listening' },
    thinking:  { icon: '🧠', label: 'Thinking…',  cls: 'thinking' },
    speaking:  { icon: '🔊', label: 'Speaking…',  cls: 'speaking' },
  }[status] || { icon: '🟢', label: 'Ready', cls: 'idle' };

  if (!isRunning && status === 'idle') return null;

  return (
    <div className={`voice-status voice-status--${config.cls}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};
