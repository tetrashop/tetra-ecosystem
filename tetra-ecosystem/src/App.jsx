import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial',
      textAlign: 'center',
      direction: 'rtl',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{fontSize: '2.5rem', marginBottom: '20px'}}>🎯 پلتفرم تترا</h1>
      <p style={{fontSize: '1.2rem', marginBottom: '30px'}}>سیستم تبدیل 2D به 3D</p>
      
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        color: 'black',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h2>تبدیل تصویر به مدل 3D</h2>
        <input type="file" style={{margin: '15px 0', padding: '10px'}} />
        <br />
        <button style={{
          padding: '12px 30px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          cursor: 'pointer'
        }}>
          آپلود و تبدیل
        </button>
        
        <div style={{marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
          <h4>پلن‌های اشتراک</h4>
          <p>🆓 رایگان: ۱ تبدیل در روز</p>
          <p>⭐ حرفه‌ای: تبدیل نامحدود</p>
        </div>
      </div>
    </div>
  );
}

export default App;
