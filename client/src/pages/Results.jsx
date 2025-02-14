import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnalysisResult from '../components/AnalysisResult';

const Results = () => {
  const [flagged, setFlagged] = useState(true);
  const [message, setMessage] = useState("Deepfake detected! High likelihood.");
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white">
    
      <div className="container mx-auto px-6 py-12">
        <AnalysisResult flagged={flagged} message={message} />
      </div>
      <Footer />
    </div>
  );
};

export default Results;
