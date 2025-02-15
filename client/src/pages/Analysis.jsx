import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProgressIndicator from '../components/ProgressIndicator';
import ContentCard from '../components/ContentCard';

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState("");

  const handleFileUpload = (e) => setFile(e.target.files[0]);
  const handleTextChange = (e) => setTextInput(e.target.value);

  const handleSubmit = () => {
    if (!file && !textInput.trim()) {
      setMessage("Please upload a file or enter text for analysis.");
      return;
    }
    setLoading(true);
    setMessage("");
    setTimeout(() => {
      setLoading(false);
      setMessage("Analysis submitted successfully! Processing your content...");
    }, 2000);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header /> {/* Unified Header */}
      <div className="flex-grow max-w-2xl mx-auto px-6 py-12">
        <ContentCard>
          <h2 className="text-2xl font-bold mb-4">Upload Content for Misinformation Analysis</h2>
          <textarea
            className="w-full h-32 p-3 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter text here for analysis..."
            value={textInput}
            onChange={handleTextChange}
          />
          <div className="mt-4">
            <input
              type="file"
              onChange={handleFileUpload}
              className="bg-gray-700 text-white p-2 rounded-md cursor-pointer"
            />
          </div>
          {loading && <ProgressIndicator />}
          {message && <p className="mt-4 text-green-400">{message}</p>}
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 self-end ml-auto block"
          >
            Submit
          </button>
        </ContentCard>
      </div>
      <Footer /> {/* Unified Footer */}
    </div>
  );
};

export default Analysis;
