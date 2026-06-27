import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import API_BASE_URL from '../config';
import { ArrowLeft, Calendar, Clock, AlertTriangle, Printer, MessageSquare, ShieldCheck, Stethoscope, Activity } from 'lucide-react';

function ReportView() {
  const location = useLocation();
  const navigate = useNavigate();
  const record = location.state?.record; 

  const imageRef = useRef(null);
  // تعديل 1: استخدام الأبعاد الأصلية لضبط النسب المئوية للمربعات
  const [imgSize, setImgSize] = useState({ naturalWidth: 0, naturalHeight: 0 }); 

  if (!record) return (
    <div style={{padding:'50px', textAlign: 'center'}}>
      <h3>No record found.</h3>
      <button onClick={()=>navigate('/profile')} className="btn-reset">Go Back to Profile</button>
    </div>
  );

  const aiData = record.ai_analysis || {};
  const nlpReport = aiData.nlp_reports?.[0] || {};
  const detections = aiData.detection || [];
  
  const imageUrl = `${API_BASE_URL}/${record.imagePath.replace(/\\/g, '/')}`;
  const dateObj = new Date((record.createdAt || record.diagnosisDate));

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImgSize({
        naturalWidth: imageRef.current.naturalWidth,
        naturalHeight: imageRef.current.naturalHeight
      });
    }
  };

  // تعديل 2: حساب المربعات بالنسبة المئوية لمنع خروجها عند تصغير الشاشة أو الطباعة
  const getBoxStyle = (box) => {
    if (!imgSize.naturalWidth) return {};
    return {
      left: `${(box[0] / imgSize.naturalWidth) * 100}%`,
      top: `${(box[1] / imgSize.naturalHeight) * 100}%`,
      width: `${((box[2] - box[0]) / imgSize.naturalWidth) * 100}%`,
      height: `${((box[3] - box[1]) / imgSize.naturalHeight) * 100}%`,
      position: 'absolute', border: '3px solid #ff4757',
      backgroundColor: 'rgba(255, 71, 87, 0.15)', zIndex: 10
    };
  };

  // تعديل 3: دالة لتحويل علامات ** إلى خط عريض (Bold)
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('**').map((part, index) => 
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChat = () => {
    localStorage.setItem('currentDiagnosisId', record._id); 
    navigate('/chat'); 
  };

  return (
    <div className="app-layout">
      <div className="hide-on-print"><Sidebar /></div>
      
      <div className="main-content print-full-width">
        <div className="card report-card">
          
          <div className="hide-on-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <button onClick={() => navigate('/profile')} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#1565C0', fontSize:'1rem'}}>
              <ArrowLeft size={20} /> Back to Profile
            </button>
            
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={handlePrint} className="print-btn" style={{background:'#f1f5f9', border:'1px solid #e2e8f0', padding:'10px 18px', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold', color: '#334155', transition: '0.3s'}}>
                <Printer size={18} /> Print PDF
              </button>
              <button onClick={handleChat} style={{background:'#1565C0', color:'#fff', border:'none', padding:'10px 18px', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold', transition: '0.3s'}}>
                <MessageSquare size={18} /> Ask AI Assistant
              </button>
            </div>
          </div>

          <div className="report-header">
            <h1 style={{fontSize: '2rem', color: '#1e293b', margin: '0 0 10px'}}>📑 Official Diagnosis Report</h1>
            <div style={{display:'flex', gap:'15px', color:'#64748b', fontSize:'0.95rem'}}>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Calendar size={16}/> {dateObj.toLocaleDateString()}</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Clock size={16}/> {dateObj.toLocaleTimeString()}</span>
              <span style={{display:'flex', alignItems:'center', gap:'5px'}}><ShieldCheck size={16}/> System: Dental AI v1.0</span>
            </div>
            <hr style={{borderTop:'2px solid #e2e8f0', margin:'20px 0'}} />
          </div>

          <div className="results-view" style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
             
             {/* Image Section */}
             <div className="img-card analyzed" style={{alignSelf: 'center', width: '100%', maxWidth: '700px'}}>
                <h4 style={{textAlign:'center', color:'#1e293b', marginBottom: '15px'}}>Visual Scan Result 🎯</h4>
                
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <div className="image-wrapper" style={{ position: 'relative', display: 'inline-block', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 15px rgba(0,0,0,0.1)' }}>
                        <img 
                          ref={imageRef} src={imageUrl} alt="Scan" 
                          onLoad={handleImageLoad} style={{maxWidth: '100%', maxHeight: '450px', display: 'block', width: 'auto', height: 'auto'}}
                        />
                        {detections.map((det, idx) => (
                          <div key={idx} style={getBoxStyle(det.box)}>
                            <span className="box-label" style={{background:'#ff4757', color:'white', padding:'2px 6px', fontSize:'11px', fontWeight:'bold', borderRadius:'4px', position:'absolute', top:'-22px', left:'-3px', whiteSpace: 'nowrap'}}>{det.label}</span>
                          </div>
                        ))}
                    </div>
                </div>
             </div>

             {/* NLP Report Split into Beautiful Cards */}
             <div className="nlp-cards-grid">
                
                {/* الملخص */}
                <div className="nlp-card" style={{background:'#f8fafc', borderLeft:'5px solid #3b82f6', padding:'25px', borderRadius:'12px', border: '1px solid #e2e8f0'}}>
                   <h3 style={{color:'#2563eb', margin:0, display:'flex', alignItems:'center', gap:'8px', fontSize: '1.2rem'}}>
                     <Stethoscope size={22} /> Medical Summary
                   </h3>
                   <div className="nlp-text-content">
                       {renderFormattedText(nlpReport.Advice)}
                   </div>
                </div>

                {/* التفاصيل والتاريخ المرضي */}
                {nlpReport.Details && (
                  <div className="nlp-card" style={{background:'#fffbeb', borderLeft:'5px solid #f59e0b', padding:'25px', borderRadius:'12px', border: '1px solid #fef3c7'}}>
                    <h3 style={{color:'#d97706', margin:0, display:'flex', alignItems:'center', gap:'8px', fontSize: '1.2rem'}}>
                      <Activity size={22} /> Case Details & History
                    </h3>
                    <div className="nlp-text-content">
                        {renderFormattedText(nlpReport.Details)}
                    </div>
                  </div>
                )}

                {/* خطة العلاج */}
                {nlpReport.Action_Plan && (
                  <div className="nlp-card full-width" style={{background:'#ecfdf5', borderLeft:'5px solid #10b981', padding:'25px', borderRadius:'12px', border: '1px solid #d1fae5'}}>
                    <h3 style={{color:'#059669', margin:0, display:'flex', alignItems:'center', gap:'8px', fontSize: '1.2rem'}}>
                      <AlertTriangle size={22} /> Recommended Action Plan
                    </h3>
                    <div className="nlp-text-content">
                        {renderFormattedText(nlpReport.Action_Plan)}
                    </div>
                  </div>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportView;