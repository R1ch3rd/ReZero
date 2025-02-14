import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="max-w-screen-xl mx-auto text-center">
        <p>&copy; 2025 Re:Zero</p>
        <div className="space-x-4 mt-2">
          <a href="#" className="hover:text-blue-200">Privacy Policy</a>
          <a href="#" className="hover:text-blue-200">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
