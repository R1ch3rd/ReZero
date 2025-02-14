import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Re:Zero</Link>
        <nav>
          <ul className="flex space-x-6">
            <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
            <li><Link to="/analysis" className="hover:text-blue-200">Analysis</Link></li>
            <li><Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link></li>
            <li><Link to="/profile" className="hover:text-blue-200">Profile</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
