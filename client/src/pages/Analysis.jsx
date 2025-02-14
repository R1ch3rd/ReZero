import React, { useState } from 'react';
import ProgressIndicator from '../components/ProgressIndicator';
import AnalysisResult from '../components/AnalysisResult';
import ContentCard from '../components/ContentCard';

const Analysis = () => {
  const [content, setContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setAnalysisResult({
        text: content,
        isFlagged: Math.random() > 0.5,
        details: 'Fake news detected based on fact-checking algorithm.',
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Submit Content for Analysis</h2>
      <form onSubmit={handleContentSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Enter text to analyze..."
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Analyze Content</button>
      </form>

      {isLoading && <ProgressIndicator        />}
      <div className="mt-6">
        {analysisResult && <AnalysisResult result={analysisResult} />}
        <div className="mt-6">
          <ContentCard content={{ type: 'Article', text: 'This is an example content.' }} analysisResult={analysisResult || {}} />
        </div>
      </div>
    </div>
  );
};

export default Analysis;

