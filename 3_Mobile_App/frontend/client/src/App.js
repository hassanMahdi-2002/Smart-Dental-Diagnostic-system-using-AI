import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ChatSession from './components/ChatSession';
// import Team from './components/Team'; 
import Register from './components/Register';
import Profile from './components/Profile';
import ReportView from './components/ReportView';

function App() {
  return (
    <Router>
      <Routes>
        {/* الصفحة الرئيسية تبدأ بالدخول */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatSession />} />
        <Route path="/profile" element={<Profile />} />
        {/* <Route path="/team" element={<Team />} /> */}
        <Route path="/report" element={<ReportView />} />
      </Routes>
    </Router>
  );
}

export default App;