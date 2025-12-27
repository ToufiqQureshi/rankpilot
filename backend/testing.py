import json
import random
import threading
from queue import Queue, Empty
from typing import Any, List, Dict, Optional

from agno.tools import Toolkit
from agno.utils.log import logger

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    raise ImportError(
        "Install playwright using `pip install playwright` "
        "and run `playwright install chromium`"
    )


class _BrowserPool:
    """Thread-safe browser pool for connection reuse."""
    _instance = None
    _lock = threading.Lock()

    def __init__(self, size: int, headless: bool):
        self.queue: Queue = Queue(maxsize=size)
        self.playwright = sync_playwright().start()
        for _ in range(size):
            browser = self.playwright.chromium.launch(headless=headless)
            self.queue.put(browser)

    @classmethod
    def instance(cls, size: int = 2, headless: bool = True):
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls(size, headless)
        return cls._instance

    def acquire(self, timeout: int = 10):
        try:
            return self.queue.get(timeout=timeout)
        except Empty:
            raise RuntimeError("No browser available in pool")

    def release(self, browser):
        self.queue.put(browser)


class PlaywrightTools(Toolkit):
    """
    Playwright Toolkit for web scraping and automation.

    Args:
        headless: Run browser in headless mode.
        pool_size: Number of browsers in the pool.
        proxy: Optional proxy configuration.
        timeout_ms: Default page timeout in milliseconds.
    """

    def __init__(
        self,
        headless: bool = True,
        pool_size: int = 2,
        proxy: Optional[Dict[str, str]] = None,
        timeout_ms: int = 30000,
    ):
        self.headless = headless
        self.pool_size = pool_size
        self.proxy = proxy
        self.timeout_ms = timeout_ms
        self._pool: Optional[_BrowserPool] = None

        super().__init__(
            name="playwright_tools",
            tools=[
                self.observe_page,
                self.run_actions,
                self.extract_candidates,
            ],
        )

    @property
    def pool(self) -> _BrowserPool:
        if self._pool is None:
            self._pool = _BrowserPool.instance(self.pool_size, self.headless)
        return self._pool

    def _open(self, url: str):
        """Open a page and return (page, context, browser)."""
        browser = self.pool.acquire()
        context = browser.new_context(proxy=self.proxy)
        page = context.new_page()
        page.set_default_timeout(self.timeout_ms)
        page.goto(url, wait_until="domcontentloaded")
        return page, context, browser

    def observe_page(self, url: str) -> str:
        """
        Observe page structure without selectors.

        Args:
            url: The URL to observe.

        Returns:
            JSON string with headings, buttons, links, and body preview.
        """
        try:
            page, context, browser = self._open(url)
            try:
                logger.debug(f"[Playwright] Observing {url}")
                data = {
                    "headings": page.locator("h1, h2, h3").all_inner_texts(),
                    "buttons": page.locator("button").all_inner_texts(),
                    "links": page.locator("a").all_inner_texts(),
                    "body_preview": page.inner_text("body")[:4000],
                }
                return json.dumps(data, indent=2)
            finally:
                context.close()
                self.pool.release(browser)
        except PlaywrightTimeout as e:
            logger.warning(f"[Playwright] Timeout observing {url}: {e}")
            return json.dumps({"error": f"Timeout: {e}"})
        except Exception as e:
            logger.error(f"[Playwright] Error observing {url}: {e}")
            return json.dumps({"error": str(e)})

    def run_actions(self, url: str, steps: List[Dict[str, Any]]) -> str:
        """
        Run declarative actions on a page.

        Args:
            url: The URL to navigate to.
            steps: List of action dicts (action, selector, value, text).

        Returns:
            JSON string with steps executed and extracted data.
        """
        try:
            page, context, browser = self._open(url)
            try:
                logger.debug(f"[Playwright] Running actions on {url}")
                extracted = []
                for step in steps:
                    action = step.get("action")
                    if action == "scroll":
                        page.mouse.wheel(0, random.randint(300, 700))
                        page.wait_for_timeout(random.randint(200, 600))
                    elif action == "click":
                        page.click(step["selector"])
                    elif action == "fill":
                        page.fill(step["selector"], step["value"])
                    elif action == "wait_for_text":
                        page.wait_for_function(
                            "text => document.body.innerText.includes(text)",
                            step["text"],
                            timeout=5000,
                        )
                    elif action == "extract_text":
                        extracted.append({
                            "selector": step["selector"],
                            "text": page.inner_text(step["selector"]).strip(),
                        })
                    else:
                        return json.dumps({"error": f"Unsupported action: {action}"})
                return json.dumps({"steps_executed": len(steps), "extracted": extracted}, indent=2)
            finally:
                context.close()
                self.pool.release(browser)
        except Exception as e:
            logger.error(f"[Playwright] Error running actions: {e}")
            return json.dumps({"error": str(e)})

    def extract_candidates(self, url: str, hints: List[str], max_per_hint: int = 5) -> str:
        """
        Extract text matching hints from a page.

        Args:
            url: The URL to scrape.
            hints: Keywords to search for.
            max_per_hint: Max matches per hint.

        Returns:
            JSON string with matched lines.
        """
        try:
            page, context, browser = self._open(url)
            try:
                body = page.inner_text("body")
                matches: Dict[str, List[str]] = {}
                for hint in hints:
                    for line in body.split("\n"):
                        if hint.lower() in line.lower():
                            matches.setdefault(hint, []).append(line.strip())
                return json.dumps(
                    {"url": url, "matches": {k: v[:max_per_hint] for k, v in matches.items()}},
                    indent=2,
                )
            finally:
                context.close()
                self.pool.release(browser)
        except Exception as e:
            logger.error(f"[Playwright] Error extracting candidates: {e}")
            return json.dumps({"error": str(e)})




from agno.agent import Agent
from agno.models.ollama import Ollama

# Create the web scraping agent
web_scraper = Agent(
    name="Web Scraper Agent",
 model=Ollama(
            id="deepseek-v3.1:671b-cloud",
            cache_response=True
        ),    tools=[PlaywrightTools(headless=False, pool_size=2)],
    instructions=[
        "You are a web scraping expert.",
        "Use observe_page to understand page structure first.",
        "Use extract_candidates for semantic data extraction.",
        "Use run_actions for form filling and interactions.",
    ],
    markdown=True,
)

# Example usage
if __name__ == "__main__":
    # Observe a page
    web_scraper.print_response(
        "Observe the structure of https://news.ycombinator.com",
        stream=True
    )
    
    # Extract specific data
    web_scraper.print_response(
        "Extract all prices and ratings from https://example.com/products",
        stream=True
    )