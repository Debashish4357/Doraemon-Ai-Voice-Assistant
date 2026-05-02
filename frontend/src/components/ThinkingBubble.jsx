import React, { memo } from 'react';

// ── Thinking dots component ─────────────────────────────────────────────────────
const ThinkingBubble = memo(({ avatar }) => (
  <div className="msg msg--agent">
    <img src={avatar} alt="AI" className="msg__avatar" />
    <div className="msg__bubble msg__bubble--agent msg__bubble--thinking">
      <span /><span /><span />
    </div>
  </div>
));

export default ThinkingBubble;
