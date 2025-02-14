import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

const App = () => {
  const [results, setResults] = useState(null);

  return (
    <Router>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis setResults={setResults} />} />
          <Route path="/dashboard" element={<Dashboard results={results} />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
