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
  const [videoFile, setVideoFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [sources, setSources] = useState([]);
  const [aiDetectionResult, setAiDetectionResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
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

  const handleVideoUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setMessage("Video file size exceeds 10MB limit");
        return;
      }
      
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!validVideoTypes.includes(selectedFile.type)) {
        setMessage("Please upload a valid video file (MP4, WebM, Ogg)");
        return;
      }
      
      setVideoFile(selectedFile);
      
      // Create video preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
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
    if (!pdfFile && !textInput.trim() && !imageFile && !videoFile) {
      setMessage("Please upload a file (PDF, image, or video) or enter text for analysis.");
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

      // Handle video analysis
      if (videoFile) {
        try {
          const formData = new FormData();
          formData.append("video", videoFile);
          
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
          
          if (aiDetectionResponse.data && aiDetectionResponse.data.video) {
            setAiDetectionResult(prevResult => ({
              ...prevResult,
              video: aiDetectionResponse.data.video
            }));
            
            // Save user action to Firestore
            await saveUserAction(
              "Video upload", 
              JSON.stringify(aiDetectionResponse.data.video),
              "aiVideoDetection"
            );
          }
        } catch (error) {
          const errorMessage = error.response?.data?.detail || error.message;
          setMessage(`Error during video analysis: ${errorMessage}`);
          console.error("Video analysis error:", error);
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
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white">
      <Header />
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ContentCard>
          <h2 className="text-2xl font-bold mb-6 text-center">Content Analysis Tool</h2>
          
          <div className="space-y-8">
            {/* Text Analysis Section */}
            <section className="p-4 bg-gray-800 bg-opacity-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Text Analysis</h3>
              <textarea
                className="w-full h-32 p-3 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Enter text here for analysis..."
                value={textInput}
                onChange={handleTextChange}
              />

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">Or upload a PDF for text extraction:</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-gray-700 rounded-md cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
              </div>
            </section>

            {/* Image Analysis Section */}
            <section className="p-4 bg-gray-800 bg-opacity-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Image Analysis</h3>
              <label className="block text-sm font-medium mb-2">Upload an image for AI detection:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-gray-700 rounded-md cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-1">Supported formats: JPEG, PNG, GIF, WEBP</p>
              
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Image preview:</p>
                  <div className="relative overflow-hidden rounded-md border border-gray-600">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 max-w-full object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Video Analysis Section */}
            <section className="p-4 bg-gray-800 bg-opacity-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Video Analysis</h3>
              <label className="block text-sm font-medium mb-2">Upload a video for AI detection:</label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoUpload}
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-gray-700 rounded-md cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-1">Supported formats: MP4, WebM, Ogg</p>
              
              {videoPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Video preview:</p>
                  <div className="relative rounded-md border border-gray-600 bg-black">
                    <video 
                      src={videoPreview} 
                      controls
                      className="max-h-48 max-w-full mx-auto"
                    ></video>
                  </div>
                </div>
              )}
            </section>

            {/* Loading indicator and error messages */}
            {loading && <div className="py-4"><ProgressIndicator /></div>}
            {message && (
              <div className="mt-4 p-3 bg-red-900 bg-opacity-50 text-red-200 rounded-md">
                {message}
              </div>
            )}

            {/* Fact-checking Results */}
            {analysisResult && (
              <section className="p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Fact-checking Results</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-green-300">{analysisResult}</p>
                </div>
                {sources.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Sources:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {sources.map((source, index) => (
                        <li key={index} className="text-blue-400 break-words">{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* AI Detection Results */}
            {aiDetectionResult && (
              <section className="p-4 bg-gray-800 bg-opacity-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">AI Detection Results</h3>
                
                <div className="space-y-4">
                  {aiDetectionResult.text && (
                    <div className="p-3 bg-gray-800 rounded-md">
                      <h4 className="text-md font-medium mb-2 text-blue-300">Text Analysis</h4>
                      <p className="text-yellow-300 text-lg">{aiDetectionResult.text.result}</p>
                      <p className="text-sm text-gray-400 mt-1">Confidence: {aiDetectionResult.text.confidence}</p>
                    </div>
                  )}
                  
                  {aiDetectionResult.image && (
                    <div className="p-3 bg-gray-800 rounded-md">
                      <h4 className="text-md font-medium mb-2 text-blue-300">Image Analysis</h4>
                      <p className="text-yellow-300 text-lg">{aiDetectionResult.image.result}</p>
                      <p className="text-sm text-gray-400 mt-1">Confidence: {aiDetectionResult.image.confidence}</p>
                    </div>
                  )}

                  {aiDetectionResult.video && (
                    <div className="p-3 bg-gray-800 rounded-md">
                      <h4 className="text-md font-medium mb-2 text-blue-300">Video Analysis</h4>
                      <p className="text-yellow-300 text-lg">{aiDetectionResult.video.result}</p>
                      <p className="text-sm text-gray-400 mt-1">Confidence: {aiDetectionResult.video.confidence}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-4 mt-6">
              <button
                onClick={clearForm}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Processing..." : "Analyze Content"}
              </button>
            </div>
          </div>
        </ContentCard>
      </div>
      <Footer />
    </div>
  );
};

export default Analysis;