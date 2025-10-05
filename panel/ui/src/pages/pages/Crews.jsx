import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Crews = () => {
  const [crews, setCrews] = useState({});
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newCrew, setNewCrew] = useState({ selectedAgents: [], selectedTasks: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [crewsRes, agentsRes, tasksRes] = await Promise.all([
          axios.get('/api/crews'),
          axios.get('/api/agents'),
          axios.get('/api/tasks'),
        ]);
        setCrews(crewsRes.data);
        setAgents(agentsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        setError('Failed to fetch initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckboxChange = (type, value) => {
    setNewCrew((prevState) => {
      const currentSelection = prevState[type];
      if (currentSelection.includes(value)) {
        return { ...prevState, [type]: currentSelection.filter((item) => item !== value) };
      } else {
        return { ...prevState, [type]: [...currentSelection, value] };
      }
    });
  };

  const handleCreateCrew = async (e) => {
    e.preventDefault();
    if (newCrew.selectedAgents.length === 0 || newCrew.selectedTasks.length === 0) {
      setError('Must select at least one agent and one task.');
      return;
    }
    try {
      const payload = { agents: newCrew.selectedAgents, tasks: newCrew.selectedTasks };
      const response = await axios.post('/api/crews', payload);
      const { crew_id } = response.data;
      setCrews((prev) => ({ ...prev, [crew_id]: payload }));
      setNewCrew({ selectedAgents: [], selectedTasks: [] });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create crew.');
    }
  };

  const handleKickoff = async (crewId) => {
    const inputs = executions[crewId]?.inputs || {};
    if (!inputs || Object.keys(inputs).length === 0) {
        alert("Please provide at least one input variable, e.g., {\"topic\": \"AI in healthcare\"}");
        return;
    }
    try {
        const parsedInputs = JSON.parse(inputs);
        const response = await axios.post(`/api/crews/${crewId}/kickoff`, { inputs: parsedInputs });
        const { execution_id } = response.data;
        setExecutions((prev) => ({
            ...prev,
            [crewId]: { ...prev[crewId], id: execution_id, status: 'RUNNING', result: null, error: null }
        }));
        pollExecutionStatus(crewId, execution_id);
    } catch (err) {
        setExecutions((prev) => ({
            ...prev,
            [crewId]: { ...prev[crewId], error: 'Failed to start execution.' }
        }));
    }
  };

  const pollExecutionStatus = (crewId, executionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/executions/${executionId}`);
        const { status, result } = response.data;
        if (status === 'COMPLETED' || status === 'FAILED') {
          clearInterval(interval);
        }
        setExecutions((prev) => ({
            ...prev,
            [crewId]: { ...prev[crewId], status, result }
        }));
      } catch (err) {
        clearInterval(interval);
        setExecutions((prev) => ({
            ...prev,
            [crewId]: { ...prev[crewId], status: 'FAILED', error: 'Failed to poll status.' }
        }));
      }
    }, 3000);
  };

  const handleInputChange = (crewId, value) => {
    setExecutions(prev => ({
        ...prev,
        [crewId]: { ...prev[crewId], inputs: value }
    }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Manage Crews</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Create New Crew</h2>
        <form onSubmit={handleCreateCrew}>
          <div>
            <h3>Select Agents</h3>
            {agents.map(agent => (
              <label key={agent.role} style={{ display: 'block' }}>
                <input type="checkbox" checked={newCrew.selectedAgents.includes(agent.role)} onChange={() => handleCheckboxChange('selectedAgents', agent.role)} />
                {agent.role}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}>
            <h3>Select Tasks</h3>
            {tasks.map(task => (
              <label key={task.description} style={{ display: 'block' }}>
                <input type="checkbox" checked={newCrew.selectedTasks.includes(task.description)} onChange={() => handleCheckboxChange('selectedTasks', task.description)} />
                {task.description}
              </label>
            ))}
          </div>
          <button type="submit" style={{ marginTop: '20px' }}>Create Crew</button>
        </form>
      </div>

      <h2>Existing Crews</h2>
      {Object.keys(crews).length === 0 ? <p>No crews found.</p> :
        Object.entries(crews).map(([crewId, crewData]) => (
          <div key={crewId} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <h3>Crew ID: {crewId.substring(0, 8)}</h3>
            <p><strong>Agents:</strong> {crewData.agents.join(', ')}</p>
            <p><strong>Tasks:</strong> {crewData.tasks.join(', ')}</p>
            <div style={{ marginTop: '10px' }}>
              <textarea
                placeholder='Enter inputs as JSON, e.g., {"topic": "AI in healthcare"}'
                style={{ width: '100%', minHeight: '60px', boxSizing: 'border-box' }}
                onChange={(e) => handleInputChange(crewId, e.target.value)}
              />
              <button onClick={() => handleKickoff(crewId)}>Kickoff Crew</button>
            </div>
            {executions[crewId]?.id && (
              <div style={{ marginTop: '10px', padding: '10px', border: '1px dashed #ccc' }}>
                <h4>Execution Status</h4>
                <p><strong>Execution ID:</strong> {executions[crewId].id}</p>
                <p><strong>Status:</strong> {executions[crewId].status}</p>
                {executions[crewId].status === 'COMPLETED' && <pre><strong>Result:</strong> {JSON.stringify(executions[crewId].result, null, 2)}</pre>}
                {executions[crewId].status === 'FAILED' && <p><strong>Error:</strong> {executions[crewId].result || executions[crewId].error}</p>}
              </div>
            )}
          </div>
        ))
      }
    </div>
  );
};

export default Crews;