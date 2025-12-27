"""
WHAT IS THIS FILE? (Yeh file kya hai?)
Yeh hamara "Jassos" (Spy) hai.
Iska kaam hai Internet pe jaake information dhundna.

WHY IS IT NEEDED? (Kyu chahiye?)
AI ka knowledge cutoff hota hai (purana data).
Latest news ya data janne ke liye hume internet search chahiye.
Yeh tool DuckDuckGo search engine use karta hai.
"""

from typing import List, Dict, Optional
from agno.tools import Toolkit
from agno.utils.log import logger
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json

try:
    from ddgs import DDGS # DuckDuckGo unofficial API
except ImportError:
    raise ImportError("pip install ddgs")

class DuckDuckGoToolkit(Toolkit):
    """DuckDuckGo Toolkit – Production grade for AI Agents"""

    def __init__(
        self,
        enable_search: bool = True,
        enable_news: bool = False,
        enable_search_and_fetch: bool = True,
        char_limit: int = 3000,
        **kwargs
    ):
        # Kon-kon se jasoosi tools on karne hain
        tools = []
        if enable_search:
            tools.append(self.duckduckgo_search) # Google search jaisa
        if enable_news:
            tools.append(self.duckduckgo_news)   # News search
        if enable_search_and_fetch:
            tools.append(self.search_and_fetch)  # Search + Padhna

        super().__init__(
            name="duckduckgo",
            tools=tools,
            **kwargs
        )
        self.char_limit = char_limit # Kitna text padhna hai page se

    # -------------------------
    # SEARCH FUNCTION (Dhundne wala)
    # -------------------------
    def duckduckgo_search(
        self,
        query: str,
        max_results: int = 5,
        modifier: Optional[str] = None,
        site: Optional[str] = None,
    ) -> str:
        """Internet pe search karta hai aur result JSON (List) mein deta hai"""
        final_query = query
        if modifier:
            final_query = f"{modifier} {final_query}"
        
        # Log karte hain ki kya dhund rahe hain
        logger.debug(f"DDG Search → {final_query}")

        try:
            # DDGS library use karke search kiya
            with DDGS() as ddgs:
                results = ddgs.text(query=final_query, max_results=max_results)

            # Result ko clean format mein banaya
            formatted_results = [
                {"title": r.get("title"), "url": r.get("href"), "snippet": r.get("body")}
                for r in results
            ]
            
            # JSON format mein wapis kiya taaki code padh sake
            # Hum JSON.dumps isliye karte hain taaki frontend isse easily tod sake
            return json.dumps(formatted_results)
            
        except Exception as e:
            logger.error(f"DDG search failed: {e}")
            return json.dumps({"error": str(e)})

    # -------------------------
    # NEWS FUNCTION (Khabar laane wala)
    # -------------------------
    def duckduckgo_news(self, query: str, max_results: int = 5) -> str:
        """Latest news dhundta hai"""
        logger.debug(f"DDG News → {query}")

        try:
            with DDGS() as ddgs:
                results = ddgs.news(query=query, max_results=max_results)

            formatted_results = [
                {
                    "title": r.get("title"),
                    "url": r.get("url"),
                    "source": r.get("source"),
                    "date": r.get("date"),
                }
                for r in results
            ]
            
            return json.dumps(formatted_results)
            
        except Exception as e:
            return json.dumps({"error": str(e)})

    # -------------------------
    # SEARCH + FETCH (Dhund ke Padhne wala)
    # -------------------------
    def search_and_fetch(
        self,
        query: str,
        source_type: str = "blog",
        max_results: int = 1,
    ) -> str:
        """Pehle search karega, fir top result ko khol ke padhega"""
        
        # Step 1: Search karo
        search_json = self.duckduckgo_search(query=query, max_results=max_results)
        
        try:
            results = json.loads(search_json)
            if not results or "error" in results:
                return "Kuch nahi mila."
                
            # Pehla result uthao
            first_result = results[0]
            url = first_result.get('url')
            
        except json.JSONDecodeError:
            return f"Result padh nahi paaya."

        # Step 2: Page ko fetch karo (Padho)
        content = self._fetch_page_content(url)

        if not content:
            return f"Page khul nahi raha: {url}"

        # Step 3: Padhai hui cheez wapis karo
        output = f"""URL: {url}
Title: {first_result.get('title')}

---
**FETCHED CONTENT (Page ka Text):**

{content[:2000]}...

(Text truncated to 2000 chars)
"""
        return output

    # -------------------------
    # HELPERS (Chote Madadgar)
    # -------------------------
    def _fetch_page_content(self, url: str) -> Optional[str]:
        """Kisi bhi website ka text nikalta hai (HTML hata ke)"""
        try:
            # Website ko request bhejo (Jaise browser bhejta hai)
            resp = requests.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (AI Agent)"},
                timeout=10
            )

            # BeautifulSoup use karke HTML saaf karo
            soup = BeautifulSoup(resp.text, "html.parser")

            # Scripts aur Styles hatao (kachra hatao)
            for tag in soup(["script", "style", "noscript", "iframe"]):
                tag.decompose()

            # Saaf text return karo
            text = " ".join(soup.get_text().split())
            return text[: self.char_limit]

        except Exception as e:
            logger.error(f"Page fetch failed: {e}")
            return None