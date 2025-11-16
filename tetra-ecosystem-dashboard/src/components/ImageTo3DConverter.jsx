import React, { useState, useCallback } from 'react';
import Tetra3DService from '../services/tetra3d-service';

const ImageTo3DConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionStatus, setConversionStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState(null);
  
  const service = new Tetra3DService();

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setConversionStatus('ready');
      setMessage(`فایل انتخاب شده: ${file.name}`);
      setProgress(0);
    } else {
      setMessage('لطفا یک فایل تصویر معتبر انتخاب کنید (JPG, PNG, etc.)');
    }
  }, []);

  const handleConvert = async () => {
    if (!selectedFile) return;

    setConversionStatus('uploading');
    setProgress(10);
    setMessage('در حال آپلود تصویر...');

    try {
      const initialResponse = await service.convertImage(selectedFile);
      setJobId(initialResponse.job_id);
      
      setConversionStatus('processing');
      setProgress(30);
      setMessage('در حال تبدیل به مدل سه‌بعدی...');

      const finalStatus = await service.waitForCompletion(
        initialResponse.job_id,
        (status) => {
          setProgress(status.progress);
          setMessage(status.message);
        }
      );

      setConversionStatus('completed');
      setProgress(100);
      setMessage('تبدیل با موفقیت انجام شد! مدل 3D آماده دانلود است.');

    } catch (error) {
      setConversionStatus('error');
      setMessage(`خطا: ${error.message}`);
    }
  };

  const handleDownload = () => {
    if (jobId) {
      service.downloadModel(jobId, `tetra_3d_model_${jobId}.obj`);
    }
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setConversionStatus('idle');
    setProgress(0);
    setMessage('');
    setJobId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setConversionStatus('ready');
      setMessage(`فایل انتخاب شده: ${file.name}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎮 تبدیل تصویر به مدل 3D</h2>
        <p style={styles.subtitle}>سیستم پیشرفته تبدیل دو بعدی به سه بعدی با فرمول ریاضی اختصاصی</p>
      </div>

      <div style={styles.uploadSection} 
           onDragOver={handleDragOver}
           onDrop={handleDrop}>
        <label htmlFor="image-upload" style={styles.uploadLabel}>
          <div style={styles.uploadArea}>
            <div style={styles.uploadIcon}>
              {selectedFile ? '📷' : '📁'}
            </div>
            <p style={styles.uploadText}>
              {selectedFile ? selectedFile.name : 'تصویر خود را اینجا رها کنید یا کلیک کنید'}
            </p>
            {!selectedFile && (
              <p style={styles.uploadHint}>فرمت‌های پشتیبانی شده: JPG, PNG, JPEG</p>
            )}
          </div>
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={styles.fileInput}
        />
      </div>

      {(conversionStatus === 'processing' || conversionStatus === 'uploading') && (
        <div style={styles.progressSection}>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
          <div style={styles.progressInfo}>
            <span style={styles.progressText}>{progress}%</span>
            <span style={styles.progressMessage}>{message}</span>
          </div>
        </div>
      )}

      <div style={styles.controlSection}>
        <button
          onClick={handleConvert}
          disabled={!selectedFile || conversionStatus === 'processing'}
          style={{
            ...styles.button,
            ...(conversionStatus === 'processing' ? styles.buttonDisabled : styles.buttonPrimary)
          }}
        >
          {conversionStatus === 'processing' ? '🔮 در حال پردازش...' : '🚀 شروع تبدیل'}
        </button>

        {conversionStatus === 'completed' && (
          <button onClick={handleDownload} style={styles.buttonSuccess}>
            📥 دانلود مدل 3D
          </button>
        )}

        {(conversionStatus === 'completed' || conversionStatus === 'error') && (
          <button onClick={resetConverter} style={styles.buttonSecondary}>
            🔄 تبدیل جدید
          </button>
        )}
      </div>

      {message && conversionStatus !== 'processing' && conversionStatus !== 'uploading' && (
        <div style={{
          ...styles.messageSection,
          ...(conversionStatus === 'error' ? styles.errorMessage : {})
        }}>
          <p style={styles.messageText}>{message}</p>
        </div>
      )}

      <div style={styles.systemInfo}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>🛠️ موتور:</span>
          <span style={styles.infoValue}>Tetra Math Engine</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>📷 دوربین:</span>
          <span style={styles.infoValue}>سیستم چند دوربینی</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>⚡ وضعیت:</span>
          <span style={styles.infoValue}>
            {conversionStatus === 'idle' && 'آماده'}
            {conversionStatus === 'ready' && 'فایل انتخاب شده'}
            {conversionStatus === 'uploading' && 'در حال آپلود'}
            {conversionStatus === 'processing' && 'در حال پردازش'}
            {conversionStatus === 'completed' && 'تکمیل شده'}
            {conversionStatus === 'error' && 'خطا'}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    borderBottom: '2px solid #f7fafc',
    paddingBottom: '20px',
  },
  title: {
    color: '#2d3748',
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    color: '#718096',
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  uploadSection: {
    marginBottom: '24px',
  },
  uploadLabel: {
    cursor: 'pointer',
    display: 'block',
  },
  uploadArea: {
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: '#f7fafc',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  uploadText: {
    color: '#4a5568',
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '500',
  },
  uploadHint: {
    color: '#a0aec0',
    margin: '0',
    fontSize: '12px',
  },
  fileInput: {
    display: 'none',
  },
  progressSection: {
    marginBottom: '24px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#edf2f7',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4299e1',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: '14px',
    color: '#4a5568',
    fontWeight: '600',
  },
  progressMessage: {
    fontSize: '12px',
    color: '#718096',
  },
  controlSection: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    minWidth: '140px',
  },
  buttonPrimary: {
    backgroundColor: '#4299e1',
    color: 'white',
  },
  buttonSuccess: {
    backgroundColor: '#48bb78',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#ed8936',
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
    color: '#e2e8f0',
    cursor: 'not-allowed',
  },
  messageSection: {
    padding: '16px',
    borderRadius: '6px',
    backgroundColor: '#f7fafc',
    marginBottom: '20px',
  },
  errorMessage: {
    backgroundColor: '#fed7d7',
    border: '1px solid #feb2b2',
  },
  messageText: {
    margin: '0',
    fontSize: '14px',
    color: '#4a5568',
    textAlign: 'center',
  },
  systemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    fontSize: '12px',
    border: '1px solid #e2e8f0',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '4px',
  },
  infoValue: {
    color: '#718096',
    fontSize: '11px',
  },
};

export default ImageTo3DConverter;
