import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentCard from '../components/ContentCard';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: query }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white">
      <div className="container mx-auto px-6 py-12">
        <ContentCard className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Re:Zero</h1>
          <p className="text-xl mb-4">Upload text, images, or videos for real-time misinformation analysis.</p>
          <SearchBar onSearch={handleSearch} />
          {loading && <p className="text-yellow-400 mt-4">Loading...</p>}
          {error && <p className="text-red-500 mt-4">Error: {error}</p>}
          {result && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h2 className="text-2xl font-semibold">Analysis Result:</h2>
              <p className="mt-2">{result}</p>
            </div>
          )}
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
