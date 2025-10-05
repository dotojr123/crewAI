import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
  const navStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #ccc',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '16px',
  };

  return (
    <div>
      <nav style={navStyle}>
        <Link to="/" style={linkStyle}>Dashboard</Link>
        <Link to="/agents" style={linkStyle}>Agents</Link>
        <Link to="/tasks" style={linkStyle}>Tasks</Link>
        <Link to="/crews" style={linkStyle}>Crews</Link>
      </nav>
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;