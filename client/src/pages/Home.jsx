import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentCard from '../components/ContentCard';
import SearchBar from '../components/SearchBar';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white"> 
    
      <div className="container mx-auto px-6 py-12">
        <ContentCard className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Re:Zero</h1>
          <p className="text-xl mb-4">Upload text, images, or videos for real-time misinformation analysis.</p>
          <SearchBar onSearch={(query) => console.log(query)} />
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
