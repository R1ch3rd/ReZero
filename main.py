from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tavily import TavilyClient
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

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

# Create pipeline with specific settings for better responses
llm = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=256,  # Reduced for more focused responses
    do_sample=True,
    temperature=0.1,     # Reduced temperature for more focused outputs
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
            snippets.append(f"Source {i+1} ({url}): {snippet}")
        
        if not snippets:
            return "No relevant information found."
            
        return "\n".join(snippets)
        
    except Exception as e:
        print(f"Tavily search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

def format_analysis_prompt(query: str, search_results: str) -> str:
    return f"""<|im_start|>system
You are a helpful fact-checking assistant. Analyze the search results and provide a clear conclusion about the claim.
<|im_end|>
<|im_start|>user
Claim to check: {query}

Search Results:
{search_results}

Provide a clear fact-check response. State whether the claim is true, false, or if there's insufficient information. Explain your reasoning using the sources.
<|im_end|>
<|im_start|>assistant
Based on the search results, here is my analysis:"""

def fact_check_agent(query: str):
    try:
        # Get search results
        search_results = fact_check_with_tavily(query)
        
        # Format prompt
        analysis_prompt = format_analysis_prompt(query, search_results)
        
        # Get model's analysis
        response = llm(analysis_prompt)[0]['generated_text']
        
        # If response is empty, try a simpler prompt
        if not response.strip():
            backup_prompt = f"Is this claim true or false? {query}\n\nBased on these sources:\n{search_results}\n\nConclusion:"
            response = llm(backup_prompt)[0]['generated_text']
        
        # If still empty, return error message
        if not response.strip():
            response = "Unable to generate analysis. Please try rephrasing your query."
        
        return {
            "result": response.strip(),
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
        
        # Verify we have a response
        if not result["result"]:
            raise HTTPException(
                status_code=500,
                detail="Model generated empty response. Please try again."
            )
            
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