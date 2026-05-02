import React from 'react';
import AnimatedAvatar from './AnimatedAvatar';

export default function SmartEmptyState({ status, onSuggestionClick }) {
  const suggestions = [
    { icon: '✅', text: 'Add task buy groceries' },
    { icon: '🧠', text: 'Remember my exam is tomorrow' },
    { icon: '📋', text: 'Show my tasks' },
    { icon: '💬', text: 'What did I tell you?' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto gap-8 mt-12 pb-20">
      
      {/* Center Avatar with Status */}
      <div className="flex flex-col items-center gap-4">
        <AnimatedAvatar state={status} />
        <div className="text-gray-400 font-medium tracking-wide text-sm uppercase">
          {status === 'idle' || !status ? 'Ready' : status}
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-6">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestionClick(s.text)}
            className="flex items-center gap-3 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 text-gray-700 text-sm font-medium hover:bg-white/70 hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-left"
          >
            <span className="text-xl">{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
