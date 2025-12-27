import os
import base64
import mimetypes
import requests
from agno.tools import tool


@tool(
    name="image_to_seo_html",
    description="Upload image, generate SEO alt text, and return ready HTML"
)
def image_to_seo_html(
    image_path: str,
    topic: str,
    timeout: int = 10,
):
    # 1️⃣ checks
    API_KEY = os.getenv("imagebb_api_key")
    if not API_KEY:
        return {"error": "IMGBB API key missing"}

    if not os.path.exists(image_path):
        return {"error": "Image file not found"}

    mime, _ = mimetypes.guess_type(image_path)
    if not mime or not mime.startswith("image/"):
        return {"error": "Only image files allowed"}

    # 2️⃣ upload image
    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read())

    res = requests.post(
        "https://api.imgbb.com/1/upload",
        data={"key": API_KEY, "image": encoded},
        timeout=timeout,
    )

    if res.status_code != 200:
        return {"error": "Image upload failed"}

    data = res.json()["data"]
    image_url = data["url"]

    # 3️⃣ SEO alt text (simple + effective)
    alt_text = f"{topic} – high quality illustration, SEO optimized, clear and descriptive"

    # 4️⃣ HTML ready for blog
    html = f"""
<img 
  src="{image_url}"
  alt="{alt_text}"
  loading="lazy"
  width="{data.get('width')}"
  height="{data.get('height')}"
/>
""".strip()

    return {
        "image_url": image_url,
        "alt_text": alt_text,
        "html": html,
        "size_bytes": data.get("size"),
    }
