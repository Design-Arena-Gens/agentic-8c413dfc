import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agentic LLM',
  description: 'A tiny built-in LLM with streaming chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header className="header">
            <h1>Agentic LLM</h1>
            <p className="subtitle">Mini language model with local Markov generation</p>
          </header>
          {children}
          <footer className="footer">Built for demo purposes. No external APIs required.</footer>
        </main>
      </body>
    </html>
  );
}
