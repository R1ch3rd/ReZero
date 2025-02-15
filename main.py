from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tavily import TavilyClient
import requests
import os
import re
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
if not TAVILY_API_KEY:
    raise ValueError("TAVILY_API_KEY not found in environment variables")

OLLAMA_API_URL = "http://localhost:11434/api/generate"  # Default Ollama local server URL
OLLAMA_MODEL = "mistral"

# Initialize Tavily client
tavily_client = TavilyClient(TAVILY_API_KEY)

def fact_check_with_tavily(query: str):
    try:
        response = tavily_client.search(query, search_depth="basic")

        if not response or 'results' not in response:
            return "No search results found."
            
        snippets = []
        for i, result in enumerate(response.get('results', [])[:3]):
            snippet = result.get('content', result.get('snippet', 'No content available'))
            url = result.get('url', 'No URL available')
            snippets.append(f"Source {i+1}: {snippet}")

        if not snippets:
            return "No relevant information found."
            
        return "\n".join(snippets)
        
    except Exception as e:
        print(f"Tavily search error: {str(e)}")
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
        print(f"Ollama request error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ollama inference failed: {str(e)}")

def fact_check_agent(query: str):
    try:
        search_results = fact_check_with_tavily(query)
        analysis_prompt = format_analysis_prompt(query, search_results)
        response = query_ollama(analysis_prompt)
        cleaned_response = clean_response(response)

        if len(cleaned_response) < 50:
            backup_prompt = f"""Based on these sources:

{search_results}

Is the claim "{query}" true or false? Explain briefly."""
            response = query_ollama(backup_prompt)
            cleaned_response = clean_response(response)

        if len(cleaned_response) < 20:
            cleaned_response = "Unable to determine credibility due to insufficient relevant information."

        return {
            "result": cleaned_response,
            "sources": search_results
        }
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

class InputData(BaseModel):
    content: str

@app.post("/analyze")
async def analyze_content(data: InputData):
    try:
        if not data.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
            
        result = fact_check_agent(data.content)
        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
