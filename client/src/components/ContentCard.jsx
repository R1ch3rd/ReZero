import React from 'react';

const ContentCard = ({ content, analysisResult }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h2 className="font-bold text-xl">{content.type}</h2>
      <p className="mt-2">{content.text}</p>
      <p className={`mt-2 ${analysisResult.isFlagged ? 'text-red-600' : 'text-green-600'}`}>
        {analysisResult.isFlagged ? 'Flagged as Misinformation' : 'Content is Authentic'}
      </p>
      {analysisResult.details && <p className="text-sm text-gray-500 mt-1">{analysisResult.details}</p>}
    </div>
  );
};

export default ContentCard;
