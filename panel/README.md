# CrewAI Web Panel

Welcome to the CrewAI Web Panel, a complete web interface to create, manage, and monitor your CrewAI agents, tasks, and crews.

This panel provides a user-friendly way to interact with the core features of CrewAI without writing Python code directly for configuration. It consists of two main parts:
1.  **Backend API:** A FastAPI server that exposes endpoints to manage and execute crews.
2.  **Frontend UI:** A React application that provides a rich user interface in your browser.

## Prerequisites

- Python 3.8+ and `pip`
- Node.js 18+ and `npm`

## How to Run

You need to run two separate processes in two different terminal windows: one for the backend API and one for the frontend UI.

### 1. Running the Backend API

The backend server is responsible for all the logic of interacting with the `crewai` library.

```bash
# 1. Navigate to the API directory
cd panel/api

# 2. (Recommended) Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# 3. Install the required Python dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload
```

The API server will start, typically on `http://127.0.0.1:8000`.

### 2. Running the Frontend UI

The frontend provides the web interface you will interact with.

```bash
# 1. Navigate to the UI directory in a new terminal
cd panel/ui

# 2. Install the required Node.js dependencies
npm install

# 3. Start the React development server
npm run dev
```

The React application will start, typically on `http://127.0.0.1:5173`. Open this URL in your web browser to use the panel.

## How It Works

- The **React UI** (frontend) makes HTTP requests to the **FastAPI API** (backend).
- A proxy is configured in the frontend's `vite.config.js`. Any request made from the UI to a path starting with `/api` is automatically forwarded to the backend server running on port 8000. This avoids CORS issues during development.
- The backend API uses the `crewai` library to instantiate and run your crews. Executions are run in background threads to avoid blocking the API.
- The UI allows you to create agents and tasks, assemble them into crews, and then "kick off" an execution with specific inputs. You can monitor the status of the execution in real-time.