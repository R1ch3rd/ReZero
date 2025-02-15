import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage'; // Replacing Profile with AuthPage

const App = () => {
  const [results, setResults] = useState(null);

  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis setResults={setResults} />} />
          <Route path="/dashboard" element={<Dashboard results={results} />} />
          <Route path="/auth" element={<AuthPage />} /> {/* Updated route */}
        </Routes>
      </main>
    </Router>
  );
};

export default App;
