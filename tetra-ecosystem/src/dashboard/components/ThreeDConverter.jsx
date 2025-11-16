import React, { useState } from 'react';

const ThreeDConverter = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [convertedModel, setConvertedModel] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      // ارسال به API تبدیل 3D
      convertTo3D(file);
    }
  };

  const convertTo3D = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setConvertedModel(result.modelUrl);
    } catch (error) {
      console.error('خطا در تبدیل:', error);
    }
  };

  return (
    <div className="converter-card">
      <h3>تبدیل تصویر 2D به مدل 3D</h3>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {selectedImage && (
          <img src={selectedImage} alt="آپلود شده" />
        )}
      </div>

      {convertedModel && (
        <div className="result-section">
          <h4>مدل 3D تولید شده:</h4>
          {/* نمایش‌دهنده مدل 3D */}
          <a href={convertedModel} download>
            دانلود مدل
          </a>
        </div>
      )}
    </div>
  );
};

export default ThreeDConverter;
