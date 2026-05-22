import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User } from 'lucide-react';
import { api } from '../services/api';

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'bot',
      text: 'Hello! I am your AI Lab Assistant. How can I help you today? You can ask me about equipment availability, low stock inventory items, active experiments, or student attendance.'
    }
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userText = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await api.post('/api/v1/ai/chatbot', { message: userText });
      if (res.success) {
        setChatHistory(prev => [...prev, { role: 'bot', text: res.reply }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'bot', text: '⚠️ Failed to connect to the AI model. Please try again.' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: '⚠️ Connection lost. Please ensure the backend is running.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Sparkle Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-darkBg flex items-center justify-center btn-glow-violet shadow-2xl hover:scale-105 transition transform duration-200"
          aria-label="Open Chatbot"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-white">Lab AI Assistant</h3>
                <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> Live Context Aware
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {/* Messages Stream */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex gap-2.5 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {chat.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-primary shrink-0 border border-white/5">
                    <Bot size={14} />
                  </div>
                )}
                <div className={`
                  max-w-[78%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap
                  ${chat.role === 'user'
                    ? 'bg-secondary/20 text-white rounded-tr-none border border-secondary/20'
                    : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'}
                `}>
                  {chat.text}
                </div>
                {chat.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-secondary/30 flex items-center justify-center text-secondary shrink-0 border border-secondary/20">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-primary shrink-0 border border-white/5">
                  <Bot size={14} />
                </div>
                <div className="bg-white/5 text-gray-400 rounded-xl rounded-tl-none px-3 py-2 border border-white/5 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSend} className="p-3 bg-white/2 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything about the lab..."
              className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="px-3 bg-primary text-darkBg rounded-lg flex items-center justify-center hover:bg-primary/90 transition disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
