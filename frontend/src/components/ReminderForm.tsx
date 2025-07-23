import React from 'react';

interface ReminderFormProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ input, setInput, loading, handleSubmit }) => (
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
      {loading ? 'Tworzenie...' : 'Utwórz Przypomnienie'}
    </button>
  </form>
);

export default ReminderForm; 