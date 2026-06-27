import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

import { LayoutDashboard, MessageSquare, Users, LogOut, Stethoscope, Info, Menu, X } from 'lucide-react';

function Sidebar() {
  // حالة التحكم في القائمة (مفتوحة أو مقفولة) - الديفولت مفتوحة
  const [isOpen, setIsOpen] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  // تحديد العنصر النشط في القائمة بناءً على المسار الحالي
  const isActive = (path) => location.pathname === path ? 'active' : '';

  // دالة الخروج: تنظيف شامل لـ localStorage
  const handleLogout = () => {
    localStorage.removeItem('userToken'); // مسح توكن المصادقة
    localStorage.removeItem('userData');  // مسح بيانات المستخدم
    localStorage.removeItem('currentDiagnosisId'); // مسح رقم آخر تشخيص
    navigate('/'); // العودة لصفحة تسجيل الدخول
  };

  return (
    <>
      {/* زرار الإخفاء والإظهار العائم */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
           left: isOpen ? '240px' : '20px', // بيتحرك مع القائمة بنعومة
        }}
      >
        {/* تغيير شكل الأيقونة حسب حالة القائمة (مفتوحة/مقفولة) */}
        {isOpen ? <X size={22} color="#64748b" /> : <Menu size={22} color="#1565C0" />}
      </button>

      {/* القائمة الجانبية - بيتم إضافة كلاس collapsed لما تكون مقفولة */}
      <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
        
        {/* اللوجو */}
        <div className="sidebar-logo-container">
          <div style={{ background: '#1565C0', borderRadius: '50%', padding: '6px', display: 'flex' }}>
              <Stethoscope size={24} color="#fff" />
          </div>
          <div>Dental<span>AI</span></div>
        </div>

        {/* روابط الصفحات */}
        <div className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Link to="/dashboard" className={`menu-item ${isActive('/dashboard')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link to="/chat" className={`menu-item ${isActive('/chat')}`}>
            <MessageSquare size={20} />
            <span>AI Chat</span>
          </Link>
          
          <Link to="/profile" className={`menu-item ${isActive('/profile')}`}>
            <Users size={20} />
            <span>My Profile</span>
          </Link>
          
          {/* <Link to="/team" className={`menu-item ${isActive('/team')}`}>
            <Info size={20} />
            <span>Our Team</span>
          </Link> */}
        </div>

        {/* زرار تسجيل الخروج */}
        <button onClick={handleLogout} className="menu-item logout-btn">
          <LogOut size={20} /> 
          <span>Logout</span>
        </button>
        
      </div>
    </>
  );
}

export default Sidebar;