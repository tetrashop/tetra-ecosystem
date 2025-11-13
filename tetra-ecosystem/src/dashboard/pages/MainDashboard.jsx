import React from 'react';
import ThreeDConverter from '../components/ThreeDConverter.jsx';
import UserProfile from '../components/UserProfile.jsx';
import BillingPlans from '../components/BillingPlans.jsx';

const MainDashboard = () => {
  return (
    <div className="dashboard">
      <header>
        <h1>پلتفرم اکوسیستم تترا</h1>
        <UserProfile />
      </header>

      <div className="dashboard-grid">
        <ThreeDConverter />
        <BillingPlans />
        {/* ماژول‌های آینده */}
      </div>
    </div>
  );
};

export default MainDashboard;
