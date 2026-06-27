import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Lock, Mail, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../config';

import '../App.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true'},
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // 👇 1. توحيد اسم التوكن ليكون userToken في كل المشروع
        localStorage.setItem('userToken', data.token);
        
        // 👇 2. معالجة مشكلة الاسم: تحويل النص لـ Object ليتوافق مع Dashboard
        const fullName = data.user.name.split(' ');
        const processedUser = {
            ...data.user,
            name: {
                first: fullName[0],
                last: fullName[fullName.length - 1] || ""
            }
        };

        localStorage.setItem('userData', JSON.stringify(processedUser)); 
        
        navigate('/dashboard'); 
      } else {
        setError(data.message || 'Invalid Email or Password');
      }
    } catch (err) {
      setError('Server Error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">
            <Stethoscope size={40} color="white" />
          </div>
          <h2>Smart Dental AI</h2>
          <p>Next Gen Diagnosis System</p>
        </div>

        {error && <div className="error-msg" style={{color: '#ff6b6b', marginBottom: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px'}}>{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="loader-spin"></span> : (
                <>
                  Access Dashboard <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="login-footer">
            <p>Graduation Project 2026 &copy; Team Leaders</p>
            <p style={{fontSize: '0.9rem', marginTop: '10px'}}>
              Don't have an account? <Link to="/register" style={{color: '#4fc3f7', fontWeight: 'bold'}}>Register here</Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default Login;