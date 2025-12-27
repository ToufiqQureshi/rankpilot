import os
import re
import hashlib
from datetime import datetime
from typing import Optional
import xml.etree.ElementTree as ET

import requests
from agno.tools import Toolkit
from agno.utils.log import logger


class CpanelDeployTools(Toolkit):
    def __init__(
        self,
        host: Optional[str] = None,
        user: Optional[str] = None,
        token: Optional[str] = None,
        public_dir: str = "/public_html",
        site_url: Optional[str] = None,
        **kwargs
    ):
        self.host = host or os.getenv("CPANEL_HOST")
        self.user = user or os.getenv("CPANEL_USER")
        self.token = token or os.getenv("CPANEL_API_TOKEN")
        self.public_dir = public_dir or os.getenv("CPANEL_PUBLIC_DIR", "/public_html")
        self.site_url = site_url or os.getenv("SITE_BASE_URL")

        tools = [
            self.deploy_to_cpanel,
            self.update_sitemap,
        ]

        super().__init__(name="cpanel_deploy_tools", tools=tools, **kwargs)

    def _get_headers(self) -> dict:
        return {"Authorization": f"cpanel {self.user}:{self.token}"}

    def _validate_config(self) -> Optional[str]:
        if not all([self.host, self.user, self.token, self.site_url]):
            return "cPanel env vars missing (CPANEL_HOST, CPANEL_USER, CPANEL_API_TOKEN, SITE_BASE_URL)"
        return None

    def deploy_to_cpanel(
        self,
        html_content: str,
        blog_title: str,
        dry_run: bool = False,
    ) -> str:
        """
        Deploy HTML content to cPanel hosting.

        Args:
            html_content: The HTML content to deploy.
            blog_title: The title of the blog post (used for filename/slug).
            dry_run: If True, returns preview without deploying.

        Returns:
            str: JSON result with status, filename, and URL.
        """
        import json

        if error := self._validate_config():
            return json.dumps({"status": "error", "reason": error})

        if not html_content or len(html_content.strip()) < 100:
            return json.dumps({"status": "error", "reason": "HTML content too short"})

        # SEO-safe slug
        slug = re.sub(r"[^a-z0-9]+", "-", blog_title.lower()).strip("-")[:60]
        content_hash = hashlib.md5(html_content.encode()).hexdigest()[:6]
        filename = f"{slug}-{content_hash}.html"
        permalink = f"{self.site_url}/{filename}"

        if dry_run:
            return json.dumps({"status": "preview", "filename": filename, "url": permalink})

        # SEO wrapper
        description = re.sub("<[^<]+?>", "", html_content)[:155]
        full_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{blog_title}</title>
<meta name="description" content="{description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{permalink}">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
{html_content}
</body>
</html>
"""

        try:
            res = requests.post(
                f"{self.host}/execute/Fileman/save_file_content",
                headers=self._get_headers(),
                data={"dir": self.public_dir, "file": filename, "content": full_html},
                timeout=20,
            )

            if res.status_code != 200 or res.json().get("status") != 1:
                logger.error(f"Deploy failed: {res.text}")
                return json.dumps({"status": "error", "reason": "Deploy failed"})

            logger.info(f"Deployed {filename} to {permalink}")
            return json.dumps({
                "status": "success",
                "filename": filename,
                "url": permalink,
                "deployed_at": datetime.utcnow().isoformat()
            })

        except Exception as e:
            logger.error(f"Deploy exception: {e}")
            return json.dumps({"status": "error", "reason": str(e)})

    def update_sitemap(self, page_url: str) -> str:
        """
        Safely update sitemap.xml with a new page URL.

        Args:
            page_url: The full URL of the page to add to sitemap.

        Returns:
            str: JSON result with status and sitemap URL.
        """
        import json

        if error := self._validate_config():
            return json.dumps({"status": "error", "reason": error})

        try:
            # Fetch existing sitemap
            fetch = requests.get(
                f"{self.host}/execute/Fileman/get_file_content",
                headers=self._get_headers(),
                params={"dir": self.public_dir, "file": "sitemap.xml"},
                timeout=15,
            )

            sitemap_exists = fetch.status_code == 200 and fetch.json().get("status") == 1

            if sitemap_exists:
                root = ET.fromstring(fetch.json()["data"]["content"])
                for loc in root.findall(".//{*}loc"):
                    if loc.text == page_url:
                        return json.dumps({
                            "status": "ok",
                            "message": "URL already exists in sitemap",
                            "sitemap": f"{self.site_url}/sitemap.xml"
                        })
            else:
                root = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

            # Append new URL
            url_el = ET.SubElement(root, "url")
            ET.SubElement(url_el, "loc").text = page_url
            ET.SubElement(url_el, "lastmod").text = datetime.utcnow().date().isoformat()

            xml_data = ET.tostring(root, encoding="utf-8", xml_declaration=True)

            save = requests.post(
                f"{self.host}/execute/Fileman/save_file_content",
                headers=self._get_headers(),
                data={"dir": self.public_dir, "file": "sitemap.xml", "content": xml_data},
                timeout=15,
            )

            if save.status_code != 200 or save.json().get("status") != 1:
                return json.dumps({"status": "error", "reason": "Failed to save sitemap"})

            logger.info(f"Added {page_url} to sitemap")
            return json.dumps({
                "status": "success",
                "added_url": page_url,
                "sitemap": f"{self.site_url}/sitemap.xml"
            })

        except ET.ParseError:
            return json.dumps({"status": "error", "reason": "sitemap.xml corrupted", "action": "manual_fix_required"})
        except Exception as e:
            logger.error(f"Sitemap update exception: {e}")
            return json.dumps({"status": "error", "reason": str(e)})