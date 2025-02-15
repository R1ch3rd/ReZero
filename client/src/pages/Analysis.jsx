import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressIndicator from "../components/ProgressIndicator";
import ContentCard from "../components/ContentCard";
import axios from "axios";
import { serverTimestamp } from "firebase/firestore";

const BACKEND_URL = "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Analysis = () => {
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [sources, setSources] = useState([]);
  const [aiDetectionResult, setAiDetectionResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const handlePdfUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setMessage("File size exceeds 10MB limit");
        return;
      }
      if (selectedFile.type !== "application/pdf") {
        setMessage("Please upload a PDF file for text extraction");
        return;
      }
      setPdfFile(selectedFile);
      setMessage("");
    }
  };

  const handleImageUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setMessage("Image file size exceeds 10MB limit");
        return;
      }
      
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(selectedFile.type)) {
        setMessage("Please upload a valid image file (JPEG, PNG, GIF, WEBP)");
        return;
      }
      
      setImageFile(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      
      setMessage("");
    }
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    setMessage("");
  };

  const saveUserAction = async (input, output, type = "factCheck") => {
    const user = auth.currentUser;
    if (user) {
      const userActionsRef = collection(db, "users", user.uid, "actions");
      await addDoc(userActionsRef, {
        type: type,
        input: input,
        output: output,
        timestamp: serverTimestamp(),
      });
    } else {
      console.log("No user logged in");
    }
  };

  const handleSubmit = async () => {
    if (!pdfFile && !textInput.trim() && !imageFile) {
      setMessage("Please upload a file (PDF or image) or enter text for analysis.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysisResult(null);
    setSources([]);
    setAiDetectionResult(null);

    try {
      // Handle text analysis (from PDF or text input)
      if (pdfFile || textInput.trim()) {
        let content = textInput;

        if (pdfFile) {
          const formData = new FormData();
          formData.append("file", pdfFile);

          try {
            const fileResponse = await axios.post(`${BACKEND_URL}/upload-pdf`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              maxContentLength: MAX_FILE_SIZE,
              maxBodyLength: MAX_FILE_SIZE,
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

        if (content.trim()) {
          try {
            // Run fact-checking analysis
            const response = await axios.post(`${BACKEND_URL}/analyze`, {
              content: content,
            });

            if (response.data) {
              setAnalysisResult(response.data.result || "No result returned.");
              const sourcesData = response.data.sources;
              setSources(typeof sourcesData === "string" ? sourcesData.split("\n") : sourcesData || []);

              // Run AI detection on the text
              const formData = new FormData();
              formData.append("text", content);
              
              const aiDetectionResponse = await axios.post(
                `${BACKEND_URL}/detect-ai`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              
              if (aiDetectionResponse.data && aiDetectionResponse.data.text) {
                setAiDetectionResult(prevResult => ({
                  ...prevResult,
                  text: aiDetectionResponse.data.text
                }));
              }

              // Save user action to Firestore
              await saveUserAction(content, response.data.result, "factCheck");
            }
          } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            setMessage(`Error during text analysis: ${errorMessage}`);
            console.error("Text analysis error:", error);
          }
        }
      }

      // Handle image analysis
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("image", imageFile);
          
          const aiDetectionResponse = await axios.post(
            `${BACKEND_URL}/detect-ai`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              maxContentLength: MAX_FILE_SIZE,
              maxBodyLength: MAX_FILE_SIZE,
            }
          );
          
          if (aiDetectionResponse.data && aiDetectionResponse.data.image) {
            setAiDetectionResult(prevResult => ({
              ...prevResult,
              image: aiDetectionResponse.data.image
            }));
            
            // Save user action to Firestore
            await saveUserAction(
              "Image upload", 
              JSON.stringify(aiDetectionResponse.data.image),
              "aiImageDetection"
            );
          }
        } catch (error) {
          const errorMessage = error.response?.data?.detail || error.message;
          setMessage(`Error during image analysis: ${errorMessage}`);
          console.error("Image analysis error:", error);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      setMessage(`Error during analysis: ${errorMessage}`);
      console.error("Full error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setPdfFile(null);
    setImageFile(null);
    setImagePreview(null);
    setTextInput("");
    setMessage("");
    setAnalysisResult(null);
    setSources([]);
    setAiDetectionResult(null);
    
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = "";
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto px-6 py-12">
        <ContentCard>
          <h2 className="text-2xl font-bold mb-4">Content Analysis Tool</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Text Analysis</h3>
            <textarea
              className="w-full h-32 p-3 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text here for analysis..."
              value={textInput}
              onChange={handleTextChange}
            />

            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Or upload a PDF for text extraction:</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="bg-gray-700 text-white p-2 rounded-md cursor-pointer w-full"
              />
              <p className="text-sm text-gray-400 mt-1">Maximum file size: 10MB</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Image Analysis</h3>
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Upload an image for AI detection:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-gray-700 text-white p-2 rounded-md cursor-pointer w-full"
              />
              <p className="text-sm text-gray-400 mt-1">Supported formats: JPEG, PNG, GIF, WEBP</p>
            </div>
            
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Image preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-48 rounded-md border border-gray-600"
                />
              </div>
            )}
          </div>

          {loading && <ProgressIndicator />}
          {message && <p className="mt-4 text-red-400">{message}</p>}

          {/* Fact-checking Results */}
          {analysisResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="text-lg font-semibold">Fact-checking Results:</h3>
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

          {/* AI Detection Results */}
          {aiDetectionResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="text-lg font-semibold mb-2">AI Detection Results:</h3>
              
              {aiDetectionResult.text && (
                <div className="mb-3">
                  <h4 className="text-md font-medium">Text Analysis:</h4>
                  <p className="text-yellow-300">{aiDetectionResult.text.result}</p>
                  <p className="text-sm text-gray-400">Confidence: {aiDetectionResult.text.confidence}</p>
                </div>
              )}
              
              {aiDetectionResult.image && (
                <div>
                  <h4 className="text-md font-medium">Image Analysis:</h4>
                  <p className="text-yellow-300">{aiDetectionResult.image.result}</p>
                  <p className="text-sm text-gray-400">Confidence: {aiDetectionResult.image.confidence}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={clearForm}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "Processing..." : "Analyze Content"}
            </button>
          </div>
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Analysis;