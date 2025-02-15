from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from tavily import TavilyClient
import requests
import os
import re
import logging
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pdfplumber
import io
import torch
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    ViTImageProcessor, ViTForImageClassification
)
from PIL import Image
import base64

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
if not TAVILY_API_KEY:
    raise ValueError("TAVILY_API_KEY not found in environment variables")

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

# Initialize Tavily client
tavily_client = TavilyClient(TAVILY_API_KEY)

class InputData(BaseModel):
    content: str

class AIDetector:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")

        # Load text detection model
        logger.info("Loading text detection model...")
        self.text_model_name = "roberta-large-openai-detector"
        self.tokenizer = AutoTokenizer.from_pretrained(self.text_model_name)
        self.text_model = AutoModelForSequenceClassification.from_pretrained(
            self.text_model_name, ignore_mismatched_sizes=True
        ).to(self.device)
        self.text_model.eval()

        # Load image detection model
        logger.info("Loading image detection model...")
        self.image_model_name = "google/vit-base-patch16-224"
        self.image_processor = ViTImageProcessor.from_pretrained(self.image_model_name)
        self.image_model = ViTForImageClassification.from_pretrained(
            self.image_model_name, num_labels=2, ignore_mismatched_sizes=True
        ).to(self.device)
        self.image_model.eval()

        self.image_labels = {0: "✅ Real", 1: "🚩 AI-Generated"}
        logger.info("AI Detection models loaded successfully!")

    def detect_text(self, text, threshold=0.40):
        """Improved text detection with XAI outputs."""
        try:
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
            with torch.no_grad():
                outputs = self.text_model(**inputs)
                probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
                ai_probability = probabilities[0][1].item()

            label = "🚩 AI-Generated" if ai_probability > threshold else "✅ Real"
            confidence = ai_probability * 100
            return label, confidence, probabilities.tolist()

        except Exception as e:
            logger.error(f"Error in text detection: {e}")
            return "Error processing text", 0.0, []

    def detect_image(self, image_data, threshold=0.40):
        """Improved image detection with XAI outputs and data validation."""
        try:
            # Process the image data (can be a file path or bytes)
            if isinstance(image_data, str):
                # Assume it's a file path
                if not os.path.exists(image_data):
                    logger.error(f"❌ Error: Image file '{image_data}' not found!")
                    return "Error: Image not found", 0.0, []
                image = Image.open(image_data).convert('RGB')
            else:
                # Assume it's bytes data
                image = Image.open(io.BytesIO(image_data)).convert('RGB')

            inputs = self.image_processor(images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.image_model(**inputs)
                logits = outputs.logits
                probabilities = torch.nn.functional.softmax(logits, dim=-1)
                ai_probability = probabilities[0][1].item()

            label = "🚩 AI-Generated" if ai_probability > threshold else "✅ Real"
            confidence = ai_probability * 100
            return label, confidence, probabilities.tolist()

        except Exception as e:
            logger.error(f"❌ Error in image detection: {e}")
            return "Error processing image", 0.0, []

    def analyze_content(self, image_data=None, text=None):
        """Analyze both image and text with improved accuracy and XAI outputs."""
        results = {}

        if image_data:
            logger.info("🔍 Analyzing image...")
            image_result, image_conf, image_probs = self.detect_image(image_data)
            results["image"] = {
                "result": image_result,
                "confidence": f"{image_conf:.2f}%",
                "probabilities": image_probs
            }

        if text:
            logger.info("🔍 Analyzing text...")
            text_result, text_conf, text_probs = self.detect_text(text)
            results["text"] = {
                "result": text_result,
                "confidence": f"{text_conf:.2f}%",
                "probabilities": text_probs
            }

        return results

# Initialize the AI Detector
ai_detector = AIDetector()

def prepare_query_for_tavily(text: str) -> str:
    """Prepare text for Tavily search query."""
    # Remove any special characters and excessive whitespace
    text = re.sub(r'[^\w\s.,!?-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Get the first 200 characters
    text = text[:200]
    
    # Extract key sentences if the text is long
    sentences = text.split('.')
    if len(sentences) > 2:
        text = '. '.join(sentences[:2]) + '.'
    
    return text.strip()

def clean_text(text: str) -> str:
    """Clean and format text for analysis."""
    # Remove extra whitespace and normalize line endings
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    # Trim to reasonable length (Tavily has a max length limit)
    return text.strip()[:5000]

def extract_text_from_pdf(file_content) -> str:
    """Extract and clean text from PDF content."""
    try:
        pdf = pdfplumber.open(io.BytesIO(file_content))
        text_content = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        pdf.close()
        return ' '.join(text_content)
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

def fact_check_with_tavily(query: str):
    """Perform fact-checking using Tavily API with enhanced error handling."""
    try:
        # Prepare the query
        prepared_query = prepare_query_for_tavily(query)
        if not prepared_query:
            logger.warning("Empty query after preparation")
            return "No valid text content found to analyze."
        
        logger.info(f"Sending query to Tavily: {prepared_query}")
        
        response = tavily_client.search(
            query=prepared_query,
            search_depth="basic",
            max_results=3
        )
        
        logger.info(f"Received response from Tavily: {response is not None}")
        
        if not response or 'results' not in response:
            logger.warning("No results in Tavily response")
            return "No search results found."
            
        snippets = []
        for i, result in enumerate(response.get('results', [])[:3]):
            snippet = result.get('content', result.get('snippet', 'No content available'))
            url = result.get('url', 'No URL available')
            snippets.append(f"Source {i+1}: {snippet} ({url})")

        return "\n".join(snippets) if snippets else "No relevant information found."
        
    except Exception as e:
        logger.error(f"Tavily search error: {str(e)}")
        if "400 Client Error" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Invalid search query. Please try with a shorter or clearer text."
            )
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

def clean_response(response: str) -> str:
    """Clean and format the model's response."""
    response = re.sub(r'Analysis:|Conclusion:|Explain your reasoning.*|State whether.*', '', response)
    response = re.sub(r'[✅❌⚠️]', '', response)
    response = ' '.join(response.split())
    return response.strip()

def format_analysis_prompt(query: str, search_results: str) -> str:
    return f"""Analyze the following claim with provided sources:

CLAIM: {query}

EVIDENCE:
{search_results}

Provide a concise and clear analysis:
- Does the evidence support or contradict the claim?
- Summarize the sources' stance.
- Give a final conclusion on the credibility of the claim.

Your analysis:"""

def query_ollama(prompt: str):
    """Send the prompt to Ollama's Mistral model and return the response."""
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        )
        response.raise_for_status()
        return response.json().get("response", "No response generated.")
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama request error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama inference failed: {str(e)}")

def fact_check_agent(query: str):
    """Main function to coordinate fact checking process."""
    try:
        # Log the incoming query
        logger.info(f"Processing query of length: {len(query)}")
        
        if len(query) < 10:
            raise HTTPException(
                status_code=400,
                detail="Query too short. Please provide more context."
            )
            
        search_results = fact_check_with_tavily(query)
        if not search_results or search_results == "No search results found.":
            return {
                "result": "Unable to verify this claim due to insufficient information.",
                "sources": []
            }

        analysis_prompt = format_analysis_prompt(query, search_results)
        response = query_ollama(analysis_prompt)
        cleaned_response = clean_response(response)

        if len(cleaned_response) < 50:
            backup_prompt = f"""Based on these sources:

{search_results}

Is the claim \"{query}\" true or false? Explain briefly."""
            response = query_ollama(backup_prompt)
            cleaned_response = clean_response(response)

        if len(cleaned_response) < 20:
            cleaned_response = "Unable to determine credibility due to insufficient relevant information."

        return {
            "result": cleaned_response,
            "sources": search_results
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile):
    try:
        # Read file content
        content = await file.read()
        
        # Extract text from PDF
        extracted_text = extract_text_from_pdf(content)
        
        # Clean the extracted text
        cleaned_text = clean_text(extracted_text)
        
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="No valid text content found in PDF")
            
        return {"text": cleaned_text}
        
    except Exception as e:
        logger.error(f"PDF upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/analyze")
async def analyze_text(data: InputData):
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Empty content provided")
    return fact_check_agent(data.content)

# New endpoint for AI detection
@app.post("/detect-ai")
async def detect_ai(
    text: str = Form(None),
    image: UploadFile = File(None)
):
    try:
        image_data = None
        if image:
            image_data = await image.read()
        
        if not text and not image_data:
            raise HTTPException(
                status_code=400,
                detail="At least one of text or image must be provided"
            )
        
        results = ai_detector.analyze_content(
            image_data=image_data,
            text=text
        )
        
        return results
        
    except Exception as e:
        logger.error(f"AI detection error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI detection failed: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)