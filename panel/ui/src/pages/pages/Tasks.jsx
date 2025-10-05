import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newTask, setNewTask] = useState({
    description: '',
    expected_output: '',
    agent: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, agentsResponse] = await Promise.all([
          axios.get('/api/tasks'),
          axios.get('/api/agents'),
        ]);
        setTasks(tasksResponse.data);
        setAgents(agentsResponse.data);
        if (agentsResponse.data.length > 0) {
          setNewTask((prev) => ({ ...prev, agent: agentsResponse.data[0].role }));
        }
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.description || !newTask.expected_output || !newTask.agent) {
      setError('All fields are required.');
      return;
    }
    try {
      await axios.post('/api/tasks', newTask);
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setNewTask({
        description: '',
        expected_output: '',
        agent: agents.length > 0 ? agents[0].role : '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
      console.error(err);
    }
  };

  const formStyle = {
    marginBottom: '40px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const taskListStyle = {
    listStyle: 'none',
    padding: 0,
  };

  const taskItemStyle = {
    border: '1px solid #eee',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
  };

  return (
    <div>
      <h1>Manage Tasks</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <h2>Create New Task</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <textarea
          name="description"
          value={newTask.description}
          onChange={handleInputChange}
          placeholder="Task Description (e.g., 'Analyze the latest trends in AI')"
          style={inputStyle}
          rows="3"
        />
        <textarea
          name="expected_output"
          value={newTask.expected_output}
          onChange={handleInputChange}
          placeholder="Expected Output (e.g., 'A comprehensive report on AI trends')"
          style={inputStyle}
          rows="3"
        />
        <select
          name="agent"
          value={newTask.agent}
          onChange={handleInputChange}
          style={inputStyle}
        >
          {agents.map((agent) => (
            <option key={agent.role} value={agent.role}>
              {agent.role}
            </option>
          ))}
        </select>
        <button type="submit" style={buttonStyle}>Create Task</button>
      </form>

      <h2>Existing Tasks</h2>
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <ul style={taskListStyle}>
          {tasks.map((task, index) => (
            <li key={index} style={taskItemStyle}>
              <h3>Description: {task.description}</h3>
              <p><strong>Expected Output:</strong> {task.expected_output}</p>
              <p><strong>Assigned Agent:</strong> {task.agent}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Tasks;