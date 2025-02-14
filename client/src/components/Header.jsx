import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-xl font-bold text-white">Misinformation Detector</a>
        <div className="space-x-4">
          <a href="/dashboard" className="text-white hover:text-gray-200">Dashboard</a>
          <a href="/Analysis" className="text-white hover:text-gray-200">Analysis</a>
          <a href="/profile" className="text-white hover:text-gray-200">Profile</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
