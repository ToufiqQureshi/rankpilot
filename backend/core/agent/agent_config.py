
# Agent Logic Configuration
# Ye file Agent ko initialize karti hai (Brain setup)

from agno.agent import Agent
from agno.models.ollama import Ollama
from backend.core.db import db
from backend.core.agent.instructions import AGENT_INSTRUCTIONS
import os

# Tools Import (Modular Path)
from backend.core.tools.search import DuckDuckGoToolkit 
from backend.core.tools.imagebb import image_to_seo_html
from backend.core.tools.cpanel import CpanelDeployTools

def create_agent():
    """
    Creates and returns the unified content creation agent.
    """
    return Agent(
        name="Unified Content Creation Agent",
        # Model: DeepSeek (Fast & Smart)
        model=Ollama(
            id="deepseek-v3.1:671b-cloud",
            cache_response=True
        ),
        db=db,
        # Session State: Temporary (RAM)
        session_state={
            "featured_image_url": None, 
            "permalink": None, 
            "filename": None,
            "searched": False,
            "sources": []
        },
        add_session_state_to_context=True,
        
        # Tools List
        tools=[
            DuckDuckGoToolkit(),
            image_to_seo_html,
            CpanelDeployTools(),
        ],
        
        # Memory Settings
        add_history_to_context=True, 
        num_history_runs=10,
        enable_session_summaries=False,
        add_session_summary_to_context=False,
        
        # Instructions (Recipe)
        instructions=AGENT_INSTRUCTIONS,
        markdown=True,
    )

# Global Instance (Singleton)
unified_content_agent = create_agent()
