import React, { useState } from 'react';

export default function AdminLoginDirect() {
  const [status, setStatus] = useState('');

  const handleLogin = async () => {
    setStatus('Logging in...');
    
    try {
      const response = await fetch('https://backend-backend-c520.up.railway.app/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'nvisionmg@gmail.com', 
          password: 'NOPmg512!' 
        })
      });
      
      const data = await response.json();
      setStatus('Response: ' + JSON.stringify(data));
      
      if (data.success) {
        localStorage.setItem('adminToken', 'admin-logged-in');
        localStorage.setItem('adminEmail', 'nvisionmg@gmail.com');
        setStatus('Success! Redirecting...');
        
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1000);
      }
    } catch (error) {
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Direct Admin Login Test</h1>
      <button 
        onClick={handleLogin}
        style={{ 
          padding: '15px 30px', 
          fontSize: '18px',
          background: '#FFD700',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Login as Admin
      </button>
      <p style={{ marginTop: '20px', fontSize: '16px' }}>{status}</p>
    </div>
  );
}
