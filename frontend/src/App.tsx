import React, { useState } from 'react';

function App() {

  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ action: string; datetime: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {

      const res = await fetch('/parse', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),

      });

      if (!res.ok) throw new Error('Backend connection failure...');

      const data = await res.json();

      setResult(data);

    } catch (err: any) {

      setError(err.message || 'Unknown error...');

    } finally {

      setLoading(false);

    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 50 }}>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type something..."
        />

        <button type="submit" disabled={loading || !input.trim()}>Send</button>

      </form>

      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}

      {error && <div style={{ marginTop: 20, color: 'red' }}>{error}</div>}

      {result && (

        <div style={{ marginTop: 20 }}>

          <div><strong>Activity:</strong> {result.action}</div>

          <div><strong>Date and hour:</strong> {result.datetime ? result.datetime : 'Recognize failure...'}</div>

        </div>

      )}

    </div>

  );

}

export default App;
