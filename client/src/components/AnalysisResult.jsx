import React from 'react';

const AnalysisResult = ({ flagged, message }) => {
  return (
    <div className={`bg-${flagged ? 'red' : 'green'}-500 text-white p-4 rounded-xl shadow-lg`}>
      <h3 className="text-2xl font-semibold">{flagged ? '⚠️ Misinformation Detected' : '✅ Content Valid'}</h3>
      <p className="mt-2">{message}</p>
    </div>
  );
};

export default AnalysisResult;
