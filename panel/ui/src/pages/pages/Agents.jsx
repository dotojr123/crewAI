import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({
    role: '',
    goal: '',
    backstory: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents');
        setAgents(response.data);
      } catch (err) {
        setError('Failed to fetch agents.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgent((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAgent.role || !newAgent.goal || !newAgent.backstory) {
      setError('All fields are required.');
      return;
    }
    try {
      const response = await axios.post('/api/agents', newAgent);
      setAgents((prevAgents) => [...prevAgents, newAgent]);
      setNewAgent({ role: '', goal: '', backstory: '' }); // Clear form
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create agent.');
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

  const agentListStyle = {
    listStyle: 'none',
    padding: 0,
  };

  const agentItemStyle = {
    border: '1px solid #eee',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
  };

  return (
    <div>
      <h1>Manage Agents</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <h2>Create New Agent</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          name="role"
          value={newAgent.role}
          onChange={handleInputChange}
          placeholder="Agent Role (e.g., 'Senior Research Analyst')"
          style={inputStyle}
        />
        <textarea
          name="goal"
          value={newAgent.goal}
          onChange={handleInputChange}
          placeholder="Agent Goal (e.g., 'Uncover cutting-edge advancements in AI')"
          style={inputStyle}
          rows="3"
        />
        <textarea
          name="backstory"
          value={newAgent.backstory}
          onChange={handleInputChange}
          placeholder="Agent Backstory (e.g., 'A seasoned analyst with a passion for technology...')"
          style={inputStyle}
          rows="5"
        />
        <button type="submit" style={buttonStyle}>Create Agent</button>
      </form>

      <h2>Existing Agents</h2>
      {loading ? (
        <p>Loading agents...</p>
      ) : (
        <ul style={agentListStyle}>
          {agents.map((agent, index) => (
            <li key={index} style={agentItemStyle}>
              <h3>{agent.role}</h3>
              <p><strong>Goal:</strong> {agent.goal}</p>
              <p><strong>Backstory:</strong> {agent.backstory}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Agents;