import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ activity: string; datetime: string | null; error?: string | null } | null>(null);
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

      if (!res.ok) {
        throw new Error('Backend connection failure...');
      }

      const data = await res.json();

      setResult(data);

    } catch (err: any) {
      setError(err.message || 'Unknown error...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Reminder App</h1>
      <p className="subtitle">Create smart reminders with natural language</p>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()} 
          className="button"
        >
          {loading ? 'Creating...' : 'Create Reminder'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          Processing your reminder...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {result && result.error && (
        <div className="error">
          {result.error}
        </div>
      )}

      {result && !result.error && (
        <div className="result">
          <div className="result-item">
            <div className="result-label">Activity:</div>
            <div className="result-value">
              {result.activity}
            </div>
          </div>
          <div className="result-item">
            <div className="result-label">Date and Time:</div>
            <div className="result-value">
              {result.datetime ? result.datetime : 'Time not recognized'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
