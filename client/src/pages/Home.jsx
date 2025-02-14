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

        {/* New Professional Content Section */}
        <div className="mt-12 bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-4">About Re:Zero</h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Re:Zero is an AI-powered misinformation detection platform designed to combat the spread of 
            false information across digital media. Using cutting-edge Natural Language Processing (NLP), 
            image forensics, and deep learning models, we analyze content in real time to assess its credibility. 
            Our system leverages cross-referencing with trusted sources and fact-checking databases to provide 
            users with accurate insights on the authenticity of online content.
          </p>

          <h3 className="text-xl font-medium mt-6">Key Features:</h3>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-2">
            <li><span className="font-semibold">Real-Time Analysis:</span> Instantly verify the authenticity of text, images, and videos.</li>
            <li><span className="font-semibold">AI-Powered Fact-Checking:</span> Cross-check content against verified sources.</li>
            <li><span className="font-semibold">Deepfake Detection:</span> Identify manipulated media and synthetic content.</li>
            <li><span className="font-semibold">User-Friendly Dashboard:</span> Access detailed reports and credibility scores.</li>
            <li><span className="font-semibold">Continuous Learning:</span> Adaptive AI models that improve detection over time.</li>
          </ul>

          <p className="text-lg text-gray-300 mt-6">
            Join us in the fight against misinformation and ensure the integrity of the digital landscape.
            Start analyzing content today with Re:Zero.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
