import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentCard from '../components/ContentCard';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white">

      <div className="container mx-auto px-6 py-12">
        <ContentCard>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="mt-2">View your past analysis results and flagged misinformation reports.</p>
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
