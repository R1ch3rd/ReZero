from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tavily import TavilyClient
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
from dotenv import load_dotenv
import os
import re
from fastapi.middleware.cors import CORSMiddleware
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

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

print("Loading TinyLlama...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Create pipeline with optimized settings
llm = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512,
    do_sample=True,
    temperature=0.1,  # Very low temperature for more focused outputs
    top_p=0.95,
    num_return_sequences=1,
    return_full_text=False,
    pad_token_id=tokenizer.eos_token_id,
    eos_token_id=tokenizer.eos_token_id,
)

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
    # Remove any instruction-like text
    response = re.sub(r'Analysis:|Conclusion:|Explain your reasoning.*|State whether.*', '', response)
    
    # Remove emojis and special characters
    response = re.sub(r'[✅❌⚠️]', '', response)
    
    # Remove extra whitespace and newlines
    response = ' '.join(response.split())
    
    return response.strip()

def format_analysis_prompt(query: str, search_results: str) -> str:
    return f"""Review this claim and the evidence carefully:

CLAIM: {query}

EVIDENCE:
{search_results}

Provide a short analysis focusing on:
1. Whether the claim is supported by the evidence
2. What the sources actually say
3. Your conclusion about whether the claim is true or false

Keep your response focused and clear. Don't repeat the instructions.

Your analysis:"""

def fact_check_agent(query: str):
    try:
        # Get search results
        search_results = fact_check_with_tavily(query)
        
        # Format prompt
        analysis_prompt = format_analysis_prompt(query, search_results)
        
        # Get model's analysis
        response = llm(analysis_prompt)[0]['generated_text']
        
        # Clean the response
        cleaned_response = clean_response(response)
        
        # If response is too short or empty, try a simpler prompt
        if len(cleaned_response) < 50:
            backup_prompt = f"""Based on these sources:

{search_results}

Is the claim "{query}" true or false? Explain why in 2-3 sentences:"""
            
            response = llm(backup_prompt)[0]['generated_text']
            cleaned_response = clean_response(response)
        
        # If still too short, return error
        if len(cleaned_response) < 20:
            cleaned_response = "Unable to generate a clear analysis. The sources don't provide enough relevant information to make a determination."
        
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