import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Re:Zero</h1>
      <p className="mb-4">Detect and flag misinformation in real-time across text, images, and videos.</p>
      <Link to="/analysis" className="bg-blue-600 text-white px-6 py-2 rounded">Start Analyzing Content</Link>
    </div>
  );
};

export default Home;
