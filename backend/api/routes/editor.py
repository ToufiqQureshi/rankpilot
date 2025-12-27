from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.core.agent.agent_config import create_agent

router = APIRouter(prefix="/api/editor", tags=["Editor"])

class TransformRequest(BaseModel):
    text: str
    action: str # rewrite, shorten, expand, tone_shift
    instruction: str | None = None # Extra context like "make it funny"

@router.post("/transform")
def transform_text(request: TransformRequest):
    """
    Transforms text based on the requested action using the AI agent.
    """
    try:
        agent = create_agent()
        
        prompt = ""
        if request.action == "rewrite":
            prompt = f"Rewrite the following text to be more clear and engaging:\n\n{request.text}"
        elif request.action == "shorten":
            prompt = f"Condense the following text without losing key information:\n\n{request.text}"
        elif request.action == "expand":
            prompt = f"Expand on the following text with more details and examples:\n\n{request.text}"
        elif request.action == "tone_shift":
            prompt = f"Rewrite the following text in a {request.instruction or 'professional'} tone:\n\n{request.text}"
        else:
            prompt = f"{request.action}: {request.text}"
            
        # Run agent non-streaming for simplicity in editor
        response = agent.run(prompt)
        
        # Extract text content from response
        # Agno agents return a RunResponse object, or stream chunks. 
        # agent.run(stream=False) returns a RunResponse.
        # We need to get .content from it.
        
        return {"success": True, "result": response.content}
        
    except Exception as e:
        print(f"Editor Transform Error: {e}")
        return {"success": False, "error": str(e)}
