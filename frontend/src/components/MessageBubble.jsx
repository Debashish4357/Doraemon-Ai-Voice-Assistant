import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const MessageBubble = memo(({ msg, avatar }) => {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/50 flex-shrink-0 shadow-sm">
            <img src={avatar || '/default.png'} alt="AI" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
              : 'glass-card !bg-white/40 backdrop-blur-2xl text-slate-800 rounded-bl-none border-white/40 shadow-xl'
          }`}
        >
          {msg.typing ? (
            <div className="flex gap-1 py-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          ) : (
            msg.text?.replace(/<function=.*?>.*?<\/function>/gs, '').trim()
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/50 flex-shrink-0 shadow-sm">
            <img src="/nobita.png" alt="Nobita" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default MessageBubble;
