import React, { useState, useEffect } from 'react';
import tetra3DIntegration from '../services/tetra3d-integration';

const Tetra3DConverter = () => {
  const [isReady, setIsReady] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);

  useEffect(() => {
    // مقداردهی اولیه submodule هنگام بارگذاری کامپوننت
    const initSubmodule = async () => {
      const ready = await tetra3DIntegration.initialize();
      setIsReady(ready);
    };

    initSubmodule();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile || !isReady) return;

    setIsConverting(true);
    try {
      const result = await tetra3DIntegration.convertImage(selectedFile);
      setConversionResult(result);
    } catch (error) {
      console.error('خطا در تبدیل:', error);
      alert(`خطا در تبدیل تصویر: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (conversionResult) {
      // منطق دانلود مدل 3D
      const blob = new Blob([conversionResult.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model_3d.${conversionResult.format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>🔧 در حال راه‌اندازی موتور تبدیل 3D...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>🎮 تبدیل تصویر به مدل 3D</h3>
        <p>با استفاده از موتور تبدیل پیشرفته Tetra</p>
      </div>

      <div style={styles.uploadSection}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={styles.fileInput}
        />
        {selectedFile && (
          <p style={styles.fileInfo}>📷 فایل انتخاب شده: {selectedFile.name}</p>
        )}
      </div>

      <div style={styles.controls}>
        <button
          onClick={handleConvert}
          disabled={!selectedFile || isConverting}
          style={{
            ...styles.button,
            ...(isConverting ? styles.buttonDisabled : styles.buttonPrimary)
          }}
        >
          {isConverting ? '🔮 در حال تبدیل...' : '🚀 شروع تبدیل'}
        </button>

        {conversionResult && (
          <button onClick={handleDownload} style={styles.buttonSuccess}>
            📥 دانلود مدل 3D
          </button>
        )}
      </div>

      {conversionResult && (
        <div style={styles.resultSection}>
          <h4>✅ تبدیل با موفقیت انجام شد!</h4>
          <p>مدل 3D با {conversionResult.vertices.length} رأس ایجاد شد</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafbfc',
    maxWidth: '500px',
    margin: '20px auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  uploadSection: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  fileInput: {
    margin: '10px 0'
  },
  fileInfo: {
    fontSize: '14px',
    color: '#333',
    margin: '10px 0'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonPrimary: {
    backgroundColor: '#1890ff',
    color: 'white'
  },
  buttonSuccess: {
    backgroundColor: '#52c41a',
    color: 'white'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    color: '#666',
    cursor: 'not-allowed'
  },
  resultSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '5px',
    textAlign: 'center'
  }
};

export default Tetra3DConverter;
