import React, { useState } from 'react';

const FeedbackForm = ({ onSubmit }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(feedback);
    setFeedback('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold">Give Feedback on the Result</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-2 mt-4 border border-gray-300 rounded"
        placeholder="Enter your feedback here"
      />
      <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">Submit Feedback</button>
    </form>
  );
};

export default FeedbackForm;
