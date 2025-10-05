from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AgentModel(BaseModel):
    role: str
    goal: str
    backstory: str
    llm: Optional[str] = None
    allow_delegation: bool = True
    verbose: bool = False
    tools: List[str] = []

class TaskModel(BaseModel):
    description: str
    expected_output: str
    agent: str  # The role of the agent assigned to this task

class CrewModel(BaseModel):
    agents: List[str]  # List of agent roles
    tasks: List[str]   # List of task descriptions
    process: str = "sequential"
    manager_llm: Optional[str] = None

class CrewKickoffModel(BaseModel):
    inputs: Dict[str, Any]