from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any
import uuid

from crewai import Agent, Task, Crew, Process
from .models import AgentModel, TaskModel, CrewModel, CrewKickoffModel

app = FastAPI(
    title="CrewAI Web Panel API",
    description="An API to manage and interact with CrewAI crews, agents, and tasks.",
)

# In-memory storage
db: Dict[str, Dict[str, Any]] = {
    "agents": {},
    "tasks": {},
    "crews": {},
    "executions": {}
}

@app.get("/")
def read_root():
    return {"message": "Welcome to the CrewAI Web Panel API"}

# --- Agents Endpoints ---

@app.post("/agents", status_code=201, summary="Create a new agent")
def create_agent(agent_data: AgentModel):
    """
    Creates a new agent in the system.
    The agent's role must be unique.
    """
    if agent_data.role in db["agents"]:
        raise HTTPException(status_code=400, detail=f"Agent with role '{agent_data.role}' already exists.")

    # For now, we store the model data. We'll instantiate the crewai object on crew creation.
    db["agents"][agent_data.role] = agent_data.model_dump()
    return {"role": agent_data.role, "message": "Agent created successfully."}

@app.get("/agents", response_model=List[AgentModel], summary="List all agents")
def list_agents():
    """
    Returns a list of all agents currently in the system.
    """
    return list(db["agents"].values())

# --- Tasks Endpoints ---

@app.post("/tasks", status_code=201, summary="Create a new task")
def create_task(task_data: TaskModel):
    """
    Creates a new task in the system.
    The task's description is used as its unique identifier for now.
    """
    if task_data.description in db["tasks"]:
        raise HTTPException(status_code=400, detail=f"Task with description '{task_data.description}' already exists.")

    if task_data.agent not in db["agents"]:
        raise HTTPException(status_code=404, detail=f"Agent with role '{task_data.agent}' not found.")

    db["tasks"][task_data.description] = task_data.model_dump()
    return {"description": task_data.description, "message": "Task created successfully."}

@app.get("/tasks", response_model=List[TaskModel], summary="List all tasks")
def list_tasks():
    """
    Returns a list of all tasks currently in the system.
    """
    return list(db["tasks"].values())

# --- Crews Endpoints ---

@app.post("/crews", status_code=201, summary="Create a new crew")
def create_crew(crew_data: CrewModel):
    """
    Creates a new crew, associating existing agents and tasks.
    """
    crew_id = str(uuid.uuid4())

    # Validate that all agents and tasks exist
    for agent_role in crew_data.agents:
        if agent_role not in db["agents"]:
            raise HTTPException(status_code=404, detail=f"Agent '{agent_role}' not found.")

    for task_desc in crew_data.tasks:
        if task_desc not in db["tasks"]:
            raise HTTPException(status_code=404, detail=f"Task '{task_desc}' not found.")

    db["crews"][crew_id] = crew_data.model_dump()
    return {"crew_id": crew_id, "message": "Crew created successfully."}

@app.get("/crews", summary="List all crews")
def list_crews():
    """
    Returns a list of all crews and their configurations.
    """
    return db["crews"]

# --- Execution Endpoints ---

def run_crew_in_background(crew_id: str, execution_id: str, inputs: Dict[str, Any]):
    """
    A function to run the crew kickoff process in a background thread.
    """
    try:
        crew_data = db["crews"].get(crew_id)
        if not crew_data:
            db["executions"][execution_id] = {"status": "FAILED", "result": "Crew not found."}
            return

        # 1. Instantiate Agents
        crew_agents = []
        for agent_role in crew_data["agents"]:
            agent_data = db["agents"].get(agent_role)
            if not agent_data:
                 db["executions"][execution_id] = {"status": "FAILED", "result": f"Agent {agent_role} not found."}
                 return
            crew_agents.append(Agent(**agent_data))

        # 2. Instantiate Tasks
        crew_tasks = []
        for task_desc in crew_data["tasks"]:
            task_data = db["tasks"].get(task_desc)
            if not task_data:
                db["executions"][execution_id] = {"status": "FAILED", "result": f"Task {task_desc} not found."}
                return

            # Find the agent instance for this task
            task_agent = next((agent for agent in crew_agents if agent.role == task_data["agent"]), None)
            if not task_agent:
                db["executions"][execution_id] = {"status": "FAILED", "result": f"Agent {task_data['agent']} for task {task_desc} not found in crew."}
                return

            crew_tasks.append(Task(
                description=task_data["description"],
                expected_output=task_data["expected_output"],
                agent=task_agent
            ))

        # 3. Instantiate and Kickoff Crew
        crew = Crew(
            agents=crew_agents,
            tasks=crew_tasks,
            process=Process[crew_data["process"].lower()],
            verbose=True
        )

        result = crew.kickoff(inputs=inputs)
        db["executions"][execution_id] = {"status": "COMPLETED", "result": result}

    except Exception as e:
        db["executions"][execution_id] = {"status": "FAILED", "result": str(e)}


@app.post("/crews/{crew_id}/kickoff", status_code=202, summary="Start a crew execution")
def kickoff_crew(crew_id: str, kickoff_data: CrewKickoffModel):
    """
    Initiates the execution of a specific crew in the background.
    """
    if crew_id not in db["crews"]:
        raise HTTPException(status_code=404, detail="Crew not found.")

    execution_id = str(uuid.uuid4())
    db["executions"][execution_id] = {"status": "RUNNING", "result": None}

    # Using threading to run the blocking crew kickoff in the background
    import threading
    thread = threading.Thread(
        target=run_crew_in_background,
        args=(crew_id, execution_id, kickoff_data.inputs)
    )
    thread.start()

    return {"execution_id": execution_id, "message": "Crew execution started."}


@app.get("/executions/{execution_id}", summary="Get execution status and result")
def get_execution_status(execution_id: str):
    """
    Retrieves the status and result of a crew execution.
    """
    execution = db["executions"].get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found.")

    return execution