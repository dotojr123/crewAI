import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import Crews from './pages/Crews';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="crews" element={<Crews />} />
      </Route>
    </Routes>
  );
}

export default App;