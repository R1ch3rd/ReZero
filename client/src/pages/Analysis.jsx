import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressIndicator from "../components/ProgressIndicator";
import ContentCard from "../components/ContentCard";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [sources, setSources] = useState([]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setMessage("File size exceeds 10MB limit");
        return;
      }
      if (selectedFile.type !== 'application/pdf') {
        setMessage("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      setMessage("");
    }
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!file && !textInput.trim()) {
      setMessage("Please upload a file or enter text for analysis.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysisResult(null);
    setSources([]);

    try {
      let content = textInput;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        try {
          const fileResponse = await axios.post(`${BACKEND_URL}/upload-pdf`, formData, {
            headers: { 
              "Content-Type": "multipart/form-data"
            },
            maxContentLength: MAX_FILE_SIZE,
            maxBodyLength: MAX_FILE_SIZE
          });
          
          if (!fileResponse.data.text) {
            throw new Error("No text content extracted from PDF");
          }
          content = fileResponse.data.text;
        } catch (error) {
          const errorMessage = error.response?.data?.detail || error.message;
          setMessage(`Error processing PDF: ${errorMessage}`);
          setLoading(false);
          return;
        }
      }

      if (!content.trim()) {
        setMessage("No valid content to analyze");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${BACKEND_URL}/analyze`, { 
        content: content
      });

      if (response.data) {
        setAnalysisResult(response.data.result || "No result returned.");
        const sourcesData = response.data.sources;
        setSources(typeof sourcesData === 'string' ? sourcesData.split('\n') : sourcesData || []);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      setMessage(`Error during analysis: ${errorMessage}`);
      console.error('Full error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFile(null);
    setTextInput("");
    setMessage("");
    setAnalysisResult(null);
    setSources([]);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header />
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
              accept=".pdf" 
              onChange={handleFileUpload} 
              className="bg-gray-700 text-white p-2 rounded-md cursor-pointer" 
            />
            <p className="text-sm text-gray-400 mt-1">Maximum file size: 10MB</p>
          </div>

          {loading && <ProgressIndicator />}
          {message && <p className="mt-4 text-red-400">{message}</p>}

          {analysisResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="text-lg font-semibold">Analysis Result:</h3>
              <p className="text-green-300">{analysisResult}</p>
              {sources.length > 0 && (
                <>
                  <h4 className="mt-3 text-md font-semibold">Sources:</h4>
                  <ul className="list-disc pl-5">
                    {sources.map((source, index) => (
                      <li key={index} className="text-blue-400">{source}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <button 
              onClick={clearForm}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Clear
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Analysis;