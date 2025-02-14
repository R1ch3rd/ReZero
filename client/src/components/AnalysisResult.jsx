import React from 'react';

const AnalysisResult = ({ result }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">Analysis Results</h2>
      <p className="mt-2">Text Analysis: {result.text}</p>
      <p className={`mt-2 ${result.isFlagged ? 'text-red-600' : 'text-green-600'}`}>
        {result.isFlagged ? 'Flagged as Misinformation' : 'Content is Authentic'}
      </p>
      {result.details && <p className="text-sm text-gray-500 mt-1">{result.details}</p>}
    </div>
  );
};

export default AnalysisResult;
