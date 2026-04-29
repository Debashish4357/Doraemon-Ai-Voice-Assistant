import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
TAVILY_URL = "https://api.tavily.com/search"

async def search_tavily(query: str, max_results: int = 3):
    if not TAVILY_API_KEY:
        logger.error("TAVILY_API_KEY not found in environment.")
        return "Search is currently unavailable (missing API key)."

    logger.info(f"Searching Tavily for: {query}")
    
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
        "include_answer": True
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(TAVILY_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Use the AI-generated answer if available
            if data.get("answer"):
                return data["answer"]
            
            # Otherwise, summarize results
            results = data.get("results", [])
            if not results:
                return "No relevant search results found."
            
            summary = "\n".join([f"- {r['title']}: {r['content'][:200]}..." for r in results])
            return summary

    except Exception as e:
        logger.error(f"Tavily search error: {e}")
        return f"Error performing search: {str(e)}"
