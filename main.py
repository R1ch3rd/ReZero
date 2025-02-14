from fastapi import FastAPI
from pydantic import BaseModel
from langchain.llms import OpenAI
from tavily import TavilyClient
import os

app = FastAPI()

# Load API keys from environment variables
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
llm = OpenAI(model="gpt-4")

class InputData(BaseModel):
    content: str

@app.post("/analyze")
async def analyze_content(data: InputData):
    # Pass content to AI model
    ai_response = llm.predict(f"Is this misinformation? {data.content}")

    # Fact-checking with Tavily
    fact_check_result = tavily_client.search(data.content, search_depth="basic")

    return {
        "ai_analysis": ai_response,
        "fact_check": fact_check_result
    }
