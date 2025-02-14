import React from 'react';

const ContentCard = ({ children, className }) => {
  return (
    <div className={`bg-gray-800 text-white p-6 rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default ContentCard;
