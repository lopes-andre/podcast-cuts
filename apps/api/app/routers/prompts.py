"""Prompt template endpoints."""
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.prompts import PromptCreate, PromptResponse, PromptUpdate
from app.services.prompt_service import PromptService

router = APIRouter()
prompt_service = PromptService()


@router.post("", response_model=PromptResponse)
async def create_prompt(data: PromptCreate) -> PromptResponse:
    """Create a new prompt template."""
    prompt = await prompt_service.create_prompt(data.model_dump())
    return PromptResponse(**prompt)


@router.get("", response_model=List[PromptResponse])
async def list_prompts(active_only: bool = False) -> List[PromptResponse]:
    """List all prompt templates."""
    prompts = await prompt_service.list_prompts(active_only=active_only)
    return [PromptResponse(**p) for p in prompts]


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str) -> PromptResponse:
    """Get a single prompt template by ID."""
    prompt = await prompt_service.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return PromptResponse(**prompt)


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(prompt_id: str, data: PromptUpdate) -> PromptResponse:
    """Update a prompt template."""
    prompt = await prompt_service.update_prompt(prompt_id, data.model_dump(exclude_unset=True))
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return PromptResponse(**prompt)


@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: str) -> dict[str, str]:
    """Delete a prompt template."""
    success = await prompt_service.delete_prompt(prompt_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"message": "Prompt deleted successfully"}

