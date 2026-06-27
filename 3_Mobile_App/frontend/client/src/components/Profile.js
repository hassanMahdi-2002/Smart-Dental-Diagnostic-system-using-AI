import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Sidebar from './Sidebar';
import API_BASE_URL from '../config';

import { User, Mail, Phone, MapPin, Activity, Calendar, Clock, AlertTriangle, Trash2, Edit3, X, Save } from 'lucide-react';

function Profile() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // حالات جديدة خاصة بالتعديل
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const navigate = useNavigate(); 

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // تجهيز بيانات الفورم مبدئياً
      setEditFormData({
        firstName: parsedUser.name.first,
        lastName: parsedUser.name.last,
        phone: parsedUser.phone,
        city: parsedUser.address.city,
        gov: parsedUser.address.gov,
        history: parsedUser.medical_history?.join(', ') || ''
      });
    }

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('userToken'); 
        if (!token) return setLoadingHistory(false);

        const response = await fetch(`${API_BASE_URL}/api/diagnoses/history?limit=10`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
        });

        const result = await response.json();
        if (response.ok && result.success) setHistory(result.data);
      } catch (error) {
        console.error("Server error:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    const token = localStorage.getItem('userToken');

    const payload = {
      name: `${editFormData.firstName} ${editFormData.lastName}`,
      phone: editFormData.phone,
      address: { city: editFormData.city, gov: editFormData.gov },
      medical_history: editFormData.history.split(',').map(item => item.trim())
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // تحديث الـ localStorage والـ State فوراً
        const updatedUser = {
          ...user,
          name: { first: editFormData.firstName, last: editFormData.lastName },
          phone: editFormData.phone,
          address: { city: editFormData.city, gov: editFormData.gov },
          medical_history: payload.medical_history
        };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowEditModal(false);
        alert("Profile updated successfully! ✨");
      } else {
        alert(result.message || "Update failed");
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (e, recordId) => {
    e.stopPropagation(); 
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) return;

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/diagnoses/${recordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item._id !== recordId));
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  if (!user) return <div style={{padding:'50px', textAlign:'center', color: '#1565C0'}}>Loading Profile Data...</div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header Card */}
          <div className="profile-header-card">
            <div className="profile-avatar">
              {user.name.first[0].toUpperCase()}{user.name.last[0].toUpperCase()}
            </div>
            <div style={{ flexGrow: 1 }}>
              <h1 style={{margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.8rem'}}>{user.name.first} {user.name.last}</h1>
              <span style={{background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'}}>
                Patient Account
              </span>
            </div>
            {/* زرار التعديل الجديد */}
            <button className="btn-edit-profile" onClick={() => setShowEditModal(true)}>
                <Edit3 size={18} /> Edit Profile
            </button>
          </div>

          {/* User Info Grid */}
          <div className="info-grid">
            <div className="info-card">
                <div className="icon-wrapper blue"><Mail size={22} /></div>
                <div><label className="info-label">Email</label><p className="info-value">{user.email}</p></div>
            </div>
            <div className="info-card">
                <div className="icon-wrapper blue"><Phone size={22} /></div>
                <div><label className="info-label">Phone</label><p className="info-value">{user.phone}</p></div>
            </div>
            <div className="info-card">
                <div className="icon-wrapper blue"><MapPin size={22} /></div>
                <div><label className="info-label">Address</label><p className="info-value">{user.address.city}, {user.address.gov}</p></div>
            </div>
             <div className="info-card history-banner">
                <div className="icon-wrapper orange"><Activity size={22} /></div>
                <div>
                    <label className="info-label" style={{color: '#c2410c'}}>Medical History</label>
                    <p className="info-value" style={{color: '#9a3412'}}>
                    {user.medical_history?.length > 0 ? user.medical_history.join(', ') : "No chronic diseases recorded."}
                    </p>
                </div>
            </div>
          </div>

          <h2 style={{color: '#1e293b', marginBottom: '25px', fontSize: '1.5rem'}}>📂 Previous Diagnosis Scans</h2>

          {loadingHistory ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>Loading your medical history...</div>
          ) : history.length === 0 ? (
            <div style={{textAlign: 'center', padding: '50px', background: 'white', borderRadius: '20px', color: '#64748b', border: '1px dashed #cbd5e1'}}>
                No diagnostic scans found.
            </div>
          ) : (
            <div className="scans-grid">
              {history.map((record) => {
                const dateObj = new Date(record.createdAt || record.diagnosisDate);
                const imageUrl = `${API_BASE_URL}/${record.imagePath.replace(/\\/g, '/')}`;
                const primaryDiagnosis = record.ai_analysis?.primary_diagnosis || "Unknown";
                const confidence = record.confidence_score || 0;
                const urgency = record.ai_analysis?.nlp_reports?.[0]?.Urgency || 'Normal';

                return (
                  <div key={record._id} className="scan-card" onClick={() => navigate('/report', { state: { record } })}>
                    <button onClick={(e) => handleDelete(e, record._id)} className="delete-btn"><Trash2 size={18} /></button>
                    <div className="scan-image-container"><img src={imageUrl} alt="scan" /></div>
                    <div className="scan-details">
                      <div className="scan-meta">
                        <span><Calendar size={14} /> {dateObj.toLocaleDateString()}</span>
                        <span><Clock size={14} /> {dateObj.toLocaleTimeString()}</span>
                      </div>
                      <h3 className="scan-title">{primaryDiagnosis}</h3>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <span className="badge badge-success">Conf: {parseFloat(confidence).toFixed(1)}%</span>
                        <span className={`badge ${urgency === 'Critical' || urgency === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                          <AlertTriangle size={12} /> {urgency}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal التعديل (Popup) */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Personal Information</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-row">
                <div className="input-field">
                  <label>First Name</label>
                  <input type="text" value={editFormData.firstName} onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} required />
                </div>
                <div className="input-field">
                  <label>Last Name</label>
                  <input type="text" value={editFormData.lastName} onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="input-field">
                <label>Phone Number</label>
                <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="input-field">
                  <label>City</label>
                  <input type="text" value={editFormData.city} onChange={(e) => setEditFormData({...editFormData, city: e.target.value})} required />
                </div>
                <div className="input-field">
                  <label>Governorate</label>
                  <input type="text" value={editFormData.gov} onChange={(e) => setEditFormData({...editFormData, gov: e.target.value})} required />
                </div>
              </div>
              <div className="input-field">
                <label>Medical History (separate by comma)</label>
                <textarea rows="3" value={editFormData.history} onChange={(e) => setEditFormData({...editFormData, history: e.target.value})} placeholder="e.g. Diabetes, Hypertension" />
              </div>
              <button type="submit" className="btn-save" disabled={updateLoading}>
                {updateLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;