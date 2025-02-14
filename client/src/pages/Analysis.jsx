import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProgressIndicator from '../components/ProgressIndicator';
import ContentCard from '../components/ContentCard';

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white">
      <div className="container mx-auto px-6 py-12">
        <ContentCard>
          <h2 className="text-2xl font-bold mb-4">Upload Content for Misinformation Analysis</h2>
          <input
            type="file"
            onChange={handleFileUpload}
            className="bg-gray-700 text-white p-2 rounded-md"
          />
          {loading ? <ProgressIndicator /> : file && <p className="mt-4">File: {file.name}</p>}
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Analysis;
