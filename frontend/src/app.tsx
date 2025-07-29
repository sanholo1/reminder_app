import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthorPage from './pages/AuthorPage';
import './app.css';

function App() {
  return (
    <Router>
      <div className="container">
        <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/">Strona główna</Link>
          <Link to="/author">O autorze</Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/author" element={<AuthorPage />} />
        </Routes>
      </div>
      <footer className="footer">
        © {new Date().getFullYear()} sanholo1
      </footer>
    </Router>
  );
}

export default App;
