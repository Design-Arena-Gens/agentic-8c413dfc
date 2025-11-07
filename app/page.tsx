"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am a tiny built-in LLM. Ask me anything.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function send() {
    if (!canSend) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setInput('');
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '' }]);

    const abort = new AbortController();
    controllerRef.current = abort;
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error('Generation failed');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: last.content + chunk };
            }
            return copy;
          });
        }
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry, I had an issue: ${err?.message ?? String(err)}` },
      ]);
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function stop() {
    controllerRef.current?.abort();
  }

  return (
    <div className="card">
      <div className="messages" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`.trim()}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.content}
          </div>
        ))}
      </div>
      <div className="inputRow">
        <input
          className="textInput"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button className="button" onClick={loading ? stop : send} disabled={!canSend && !loading}>
          {loading ? 'Stop' : 'Send'}
        </button>
      </div>
      <div className="small">This demo streams output from a small Markov model built on the fly.</div>
    </div>
  );
}
