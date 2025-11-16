const API_BASE = 'http://localhost:8000';

export const tetra3dAPI = {
  // بررسی سلامت API
  async checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  },

  // تبدیل تصویر به مدل 3D
  async convertTo3D(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE}/convert`, {
      method: 'POST',
      body: formData
    });

    return await response.json();
  },

  // بررسی وضعیت پردازش
  async getStatus(jobId) {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    return await response.json();
  },

  // دانلود مدل
  async downloadModel(jobId) {
    const response = await fetch(`${API_BASE}/download/${jobId}`);
    return await response.blob();
  }
};
