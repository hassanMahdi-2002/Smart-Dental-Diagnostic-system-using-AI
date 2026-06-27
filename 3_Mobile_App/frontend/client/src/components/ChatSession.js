import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ReactMarkdown from 'react-markdown'
import API_BASE_URL from '../config';
import { Send, Bot } from 'lucide-react'; 

function ChatSession() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "أهلاً بك! أنا المساعد الذكي. قرأت تشخيصك وتاريخك المرضي، كيف يمكنني مساعدتك اليوم؟", 
      sender: "bot" 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom() }, [messages]);

  useEffect(() => {
    const storedId = localStorage.getItem('currentDiagnosisId');
    if (storedId){
      setDiagnosisId(storedId);
    } else {
      console.warn("No diagnosisId found in localStorage. Chat session will not be linked to a diagnosis.");
      setDiagnosisId(null);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !diagnosisId){
      if (!diagnosisId) alert("Please start a diagnosis first!");
     return;
    }

    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    
    const userQuestion = input; 
    setInput(""); 
    setLoading(true);

    try {
        const userToken = localStorage.getItem('userToken'); 
        
        const response = await fetch(`${API_BASE_URL}/api/diagnoses/agent-chat`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'bypass-tunnel-reminder': 'true',
              'Authorization': `Bearer ${userToken}` 
            },
            body: JSON.stringify({
                diagnosisId: diagnosisId,
                message: userQuestion 
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const botMsg = { id: Date.now() + 1, text: data.reply, sender: "bot" };
            setMessages((prev) => [...prev, botMsg]);
        } else {
            const errorMessageText = data.message || "حدث خطأ أثناء معالجة طلبك.";
            const errorMsg = { id: Date.now() + 1, text: "خطأ: " + errorMessageText, sender: "bot" };
            setMessages((prev) => [...prev, errorMsg]);
        }

    } catch (error) {
        const errorMsg = { id: Date.now() + 1, text: "فشل الاتصال بالسيرفر. تأكد من تشغيل الباك إند.", sender: "bot" };
        setMessages((prev) => [...prev, errorMsg]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="chat-container">
          
          {/* تم تحسين الهيدر */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '10px', color: '#1565C0' }}>
                <Bot size={24} />
              </div>
              <div>
                <h3>AI Dental Assistant</h3>
                <p>Smart & Concise Medical Advice</p>
              </div>
            </div>
          </div>
          
          <div className="messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="bubble">
                    <ReactMarkdown dir="auto">{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="bubble loading-bubble">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* تم تحسين منطقة الإدخال والزرار */}
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type your medical question here..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              <span>Send</span> 
              <Send size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ChatSession;