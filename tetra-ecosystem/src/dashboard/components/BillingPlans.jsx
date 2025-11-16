import React from 'react';

const BillingPlans = () => {
  return (
    <div className="billing-card">
      <h3>پلن‌های اشتراک</h3>
      <div className="plans">
        <div className="plan free">
          <h4>🆓 رایگان</h4>
          <p>۱ تبدیل در روز</p>
        </div>
        <div className="plan pro">
          <h4>⭐ حرفه‌ای</h4>
          <p>تبدیل نامحدود</p>
          <button>خرید</button>
        </div>
      </div>
    </div>
  );
};

export default BillingPlans;
