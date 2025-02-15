import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const reports = [
    { id: 1, title: 'Twitter Analysis', summary: 'Misinformation flagged on Twitter post.', details: 'This analysis detected manipulated media in a Twitter post related to the elections.' },
    { id: 2, title: 'Instagram Profile Check', summary: 'Fake profile detected.', details: 'Deepfake detection flagged this Instagram profile as suspicious with AI-generated profile images.' },
    { id: 3, title: 'Reddit Thread Review', summary: 'Verified content.', details: 'This Reddit thread was analyzed and marked as authentic with high confidence.' },
  ];

  const handleCardClick = (report) => {
    setSelectedCard(report);
  };

  const handleClose = () => {
    setSelectedCard(null);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header /> {/* Consistent Header */}
      <div className="flex-grow container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleCardClick(report)}
            >
              <h3 className="text-xl font-semibold mb-2">{report.title}</h3>
              <p className="text-gray-300">{report.summary}</p>
            </div>
          ))}
        </div>

        {selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-lg shadow-2xl max-w-lg w-full animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">{selectedCard.title}</h2>
              <p className="mb-6">{selectedCard.details}</p>
              <button
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer /> {/* Consistent Footer */}
    </div>
  );
};

export default Dashboard;
