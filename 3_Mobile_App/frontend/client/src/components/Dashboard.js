import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

import Sidebar from './Sidebar';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null); 
  const [detections, setDetections] = useState([]); 
  const [report, setReport] = useState(null);
  
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imgSize, setImgSize] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  const onSelectFile = (e) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setResults(null);
    setDetections([]);
    setReport(null);
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImgSize({
        naturalWidth: imageRef.current.naturalWidth,
        naturalHeight: imageRef.current.naturalHeight
      });
    }
  };

  const getCertaintyLevel = (confidence) => {
    let conf = parseFloat(confidence);
    if (conf <= 1.0) conf = conf * 100;

    if (conf >= 60) return "High Certainty";
    if (conf >= 40) return "Probable";
    return "Possible"; 
  };

  const getBoxStyle = (box) => {
    if (!imgSize.naturalWidth) return {};
    return {
      left: `${(box[0] / imgSize.naturalWidth) * 100}%`,
      top: `${(box[1] / imgSize.naturalHeight) * 100}%`,
      width: `${((box[2] - box[0]) / imgSize.naturalWidth) * 100}%`,
      height: `${((box[3] - box[1]) / imgSize.naturalHeight) * 100}%`,
      position: 'absolute',
      border: '3px solid #ff4757',
      backgroundColor: 'rgba(255, 71, 87, 0.15)',
      zIndex: 10
    };
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    const token = localStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('image', selectedImage);
    if (user?.medical_history) formData.append('medical_history', user.medical_history.join(", "));

    try {
      const response = await fetch(`${API_BASE_URL}/api/diagnoses/predict`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' },
        body: formData,
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        const aiAnalysis = resData.data.full_analysis;
        const yoloData = aiAnalysis.detection || [];
        const resnetData = aiAnalysis.classification || [];

        const mergedResultsMap = new Map();

        yoloData.forEach(d => {
            const diseaseName = d.label;
            let conf = parseFloat(d.confidence);
            if (conf <= 1.0) conf = conf * 100; 

            if (mergedResultsMap.has(diseaseName)) {
                const existingConf = mergedResultsMap.get(diseaseName);
                if (conf > existingConf) {
                    mergedResultsMap.set(diseaseName, conf);
                }
            } else {
                mergedResultsMap.set(diseaseName, conf);
            }
        });

        resnetData.forEach(r => {
            const diseaseName = r.disease;
            let conf = parseFloat(r.confidence);
            if (conf <= 1.0) conf = conf * 100; 

            if (!mergedResultsMap.has(diseaseName)) {
                mergedResultsMap.set(diseaseName, conf);
            }
        });

        const finalMergedResults = Array.from(mergedResultsMap, ([disease, confidence]) => ({
            disease,
            confidence
        })).sort((a, b) => b.confidence - a.confidence);

        setResults(finalMergedResults);
        setDetections(yoloData);        
        setReport(aiAnalysis.nlp_reports[0] || {});
        localStorage.setItem('currentDiagnosisId', resData.data.diagnosis_id);
      } else {
         alert("Error: " + (resData.message || "Analysis failed"));
      }
    } catch (error) {
      alert("Connection Error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('**').map((p, i) => i % 2 === 1 ? <strong key={i} style={{color: '#1565C0'}}>{p}</strong> : p);
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === 'Critical' || urgency === 'High') return 'urgency-high';
    if (urgency === 'Moderate') return 'urgency-moderate';
    return 'urgency-low';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="card">
          <header className="welcome-header" style={{marginBottom: '30px'}}>
            <h1 style={{color: '#1565C0', fontSize: '1.8rem', margin: 0}}>Welcome back, {user ? user.name.first : 'Doctor'}! 👋</h1>
            <p style={{color: '#777', marginTop: '5px'}}>Ready for a new intelligent diagnosis?</p>
          </header>

          <h2>🦷 Intelligent Dental Diagnosis</h2>
          <p style={{color: '#64748b', marginBottom: '20px'}}>AI-Powered Analysis & Report Generation</p>
          
          {!preview ? (
            <label className="upload-dropzone" onClick={() => fileInputRef.current.click()}>
              <span style={{fontSize:'3rem'}}>📸</span>
              <h3>Click to Upload Intra-oral Image</h3>
              <input 
                id="fileInput"
                type="file"
                ref={fileInputRef} 
                onChange={onSelectFile} 
                accept="image/*" 
                style={{ opacity: 0, position: 'absolute', zIndex: -1, width: '1px', height: '1px' }}// نستخدم الستايل بدل hidden عشان بعض المتصفحات
              />
            </label>
          ) : (
            <div className="results-view">
              <div className="analysis-results-grid">
                  <div className="analysis-card">
                      <div style={{fontWeight: '700', marginBottom: '10px', color: '#334155'}}>🖼️ Original Image</div>
                      <div className="medical-image-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img 
                            src={preview} 
                            alt="Original" 
                            style={{ maxWidth: '100%', maxHeight: '400px', width: 'auto', height: 'auto', display: 'block' }} 
                          />
                      </div>
                  </div>

                  <div className="analysis-card">
                      <div style={{fontWeight: '700', marginBottom: '10px', color: '#334155'}}>🎯 AI Analysis Result</div>
                      <div className="medical-image-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img 
                                ref={imageRef} 
                                src={preview} 
                                alt="Analyzed" 
                                onLoad={handleImageLoad} 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '400px', 
                                  width: 'auto', 
                                  height: 'auto', 
                                  display: 'block' 
                                }} 
                              />
                              {detections.map((det, idx) => (
                                <div key={idx} style={getBoxStyle(det.box)}>
                                  <span className="box-label">{det.label} - {getCertaintyLevel(det.confidence)}</span>
                                </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {!loading && !results && <button className="btn-analyze" onClick={handleAnalyze}>Start Diagnosis ⚡</button>}
              
              {loading && (
                <div style={{textAlign: 'center', margin: '30px 0'}}>
                  <div className="spinner" style={{margin: '0 auto 10px'}}></div>
                  <p style={{color: '#1565C0', fontWeight: 'bold'}}>Analyzing with YOLOv8 + ResNet50...</p>
                </div>
              )}

              {results && (
                <div style={{marginTop: '40px'}}>
                  <h3 style={{borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#1e293b'}}>📋 Clinical Findings</h3>
                  <div className="findings-list">
                    {results.map((item, index) => (
                      <div key={index} className="finding-row">
                        <span style={{fontWeight: '600', color: '#1e293b'}}>{item.disease}</span>
                        <span className="percentage-badge">
                            {parseFloat(item.confidence).toFixed(1)}% Confidence
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 👇 تم التعديل في هذا الجزء فقط لعرض التقرير كاملاً 👇 */}
                  {report && (
                    <div className={`gemini-report-box ${getUrgencyColor(report.Urgency)}`} style={{marginTop: '30px', padding: '25px', background: '#fff', direction: 'rtl', textAlign: 'right'}}>
                        
                        <div style={{fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                            <span>✨ AI Clinical Insight (Gemini)</span>
                            <span className="urgency-tag">{report.Urgency || 'Normal'}</span>
                        </div>
                        
                        {report.Advice && (
                          <div style={{lineHeight: '1.8', marginBottom: '20px'}}>
                              <strong style={{color: '#1565C0', fontSize: '1.1rem'}}>📝 نصيحة طبية:</strong>
                              <p style={{whiteSpace: 'pre-line', margin: '8px 0', color: '#334155'}}>{renderFormattedText(report.Advice)}</p>
                          </div>
                        )}

                        {report.Details && (
                          <div style={{lineHeight: '1.8', marginBottom: '20px', padding: '15px', background: '#fdfaf6', borderRight: '4px solid #f59e0b', borderRadius: '8px'}}>
                              <strong style={{color: '#d97706', fontSize: '1.1rem'}}>🔍 تفاصيل الحالة:</strong>
                              <p style={{whiteSpace: 'pre-line', margin: '8px 0', color: '#334155'}}>{renderFormattedText(report.Details)}</p>
                          </div>
                        )}

                        {report.Action_Plan && (
                          <div style={{lineHeight: '1.8', padding: '15px', background: '#ecfdf5', borderRight: '4px solid #10b981', borderRadius: '8px'}}>
                              <strong style={{color: '#059669', fontSize: '1.1rem'}}>🚑 خطة العلاج الموصى بها:</strong>
                              <p style={{whiteSpace: 'pre-line', margin: '8px 0', color: '#334155'}}>{renderFormattedText(report.Action_Plan)}</p>
                          </div>
                        )}

                    </div>
                  )}
                  {/* 👆 نهاية تعديل التقرير 👆 */}

                  <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
                      <button className="btn-chat" onClick={() => navigate('/chat')} style={{flex: 1, padding: '15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'}}>💬 Chat about this Case</button>
                      <button className="btn-reset" onClick={() => {setPreview(null); setResults(null); setDetections([]); setReport(null);}} style={{flex: 1, padding: '15px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'}}>Analyze New Image 🔄</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;