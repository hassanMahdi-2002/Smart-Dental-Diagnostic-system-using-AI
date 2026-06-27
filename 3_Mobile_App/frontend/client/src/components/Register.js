import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import { User, Mail, Lock, Phone, MapPin, Calendar, FileText, Stethoscope } from 'lucide-react';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'Male',
    city: '',
    gov: '',
    history: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 👇 التعديل الجوهري هنا: دمج الاسم الأول والأخير في حقل واحد كما يتوقعه الباك إند
    const fullName = `${formData.firstName} ${formData.lastName}`;

    const payload = {
      name: fullName, // إرسال الاسم كنص ليقوم السيرفر بمعالجته
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      age: parseInt(formData.age), // التأكد من إرسال السن كرقم
      gender: formData.gender,
      address: { 
        city: formData.city, 
        gov: formData.gov 
      },
      medical_history: formData.history ? [formData.history] : []
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Account Created Successfully! Please Login.");
        navigate('/'); 
      } else {
        // عرض رسائل الخطأ القادمة من express-validator في السيرفر
       // const errorMsg = data.errors ? data.errors.map(err => err.msg).join(', ') : (data.message || 'Registration failed');
        setError(data.message || 'Registration failed. Please check your data.');
      }
    } catch (err) {
      setError('Server Error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card register-card">
        <div className="login-header">
          <div className="logo-icon">
            <Stethoscope size={40} color="#fff" />
          </div>
          <h2>Create New Account</h2>
          <p>Join our Dental AI System</p>
        </div>

        {error && <div className="error-msg" style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <User size={18} />
              <input name="firstName" placeholder="First Name" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <User size={18} />
              <input name="lastName" placeholder="Last Name" required onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <Mail size={18} />
            <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input name="password" type="password" placeholder="Password (Min. 6 chars)" required onChange={handleChange} minLength="6" />
          </div>

          <div className="form-row">
            <div className="input-group">
                <Phone size={18} />
                <input name="phone" placeholder="Phone Number" required onChange={handleChange} />
            </div>
            <div className="input-group short">
                <Calendar size={18} />
                <input name="age" type="number" placeholder="Age" required onChange={handleChange} />
            </div>
             <div className="input-group short">
                <select name="gender" onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
          </div>

          <div className="form-row">
             <div className="input-group">
                <MapPin size={18} />
                <input name="gov" placeholder="Governorate" required onChange={handleChange} />
            </div>
            <div className="input-group">
                <MapPin size={18} />
                <input name="city" placeholder="City" required onChange={handleChange} />
            </div>
          </div>

           <div className="input-group">
            <FileText size={18} />
            <input name="history" placeholder="Medical History (e.g. Diabetes, None)" onChange={handleChange} />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up Now 🚀'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/" style={{color: '#64b5f6', fontWeight: 'bold'}}>Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;