import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Chat() {
  const { chatHistory, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: chatHistory.slice(-10) // Send last 10 messages for context
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      addChatMessage({ role: 'assistant', content: data.reply });
    } catch (error: any) {
      addChatMessage({ 
        role: 'assistant', 
        content: `Error: ${error.message}. Ensure GEMINI_API_KEY is set in Settings > Secrets.` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-brand-dark text-white rounded-2xl shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <div className="w-8 h-8 bg-white bg-opacity-10 rounded-full flex items-center justify-center text-xs text-brand-accent">✦</div>
      </div>
      <div className="p-6 pb-2">
        <h3 className="font-serif text-lg mb-1 text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-accent" />
          Gemini AI Advisor
        </h3>
        <p className="text-xs text-brand-muted">Ask about materials, repairs, or message drafts.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-brand-muted space-y-2">
            <Bot className="w-10 h-10 opacity-30" />
            <p>How can I assist you today?</p>
          </div>
        )}
        
        {chatHistory.map((msg) => (
          <div key={msg.id} className={clsx("flex gap-3 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={clsx("px-4 py-3 rounded-lg",
              msg.role === 'user' 
                ? "bg-white bg-opacity-10 border border-white border-opacity-10 text-white italic" 
                : "bg-brand-accent text-brand-dark"
            )}>
              {msg.role === 'assistant' && <p className="font-bold mb-1">Gemini Says:</p>}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="px-4 py-3 rounded-lg bg-brand-accent text-brand-dark flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="font-bold">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-6 pt-2 relative">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about materials..."
            className="w-full bg-white bg-opacity-10 border-0 rounded-lg px-4 pr-12 py-3 text-xs focus:ring-1 focus:ring-brand-accent text-white placeholder-brand-muted"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square text-brand-accent rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
