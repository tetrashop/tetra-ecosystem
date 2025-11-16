class Tetra3DService {
  constructor() {
    this.apiBaseUrl = 'https://tetra-3d-api.vercel.app';
  }

  async convertImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${this.apiBaseUrl}/convert`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`خطا در ارسال تصویر: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`خطا در ارتباط با سرور: ${error.message}`);
    }
  }

  async checkStatus(jobId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`خطا در دریافت وضعیت: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`خطا در ارتباط با سرور: ${error.message}`);
    }
  }

  async waitForCompletion(jobId, onProgress = null, interval = 2000) {
    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const status = await this.checkStatus(jobId);
          
          if (onProgress && typeof onProgress === 'function') {
            onProgress(status);
          }
          
          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.message || 'پردازش ناموفق بود'));
          } else {
            setTimeout(check, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      check();
    });
  }

  downloadModel(jobId, filename = '3d_model.obj') {
    const downloadUrl = `${this.apiBaseUrl}/download/${jobId}`;
    window.open(downloadUrl, '_blank');
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// ایجاد instance جهانی برای استفاده در کل پروژه
if (typeof window !== 'undefined') {
  window.tetra3DService = new Tetra3DService();
}

export default Tetra3DService;
