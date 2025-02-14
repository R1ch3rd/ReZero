import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">User Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Recent Analyses</h3>
          <p className="mt-2">View recent content analyses and feedback.</p>
          <Link to="/analysis" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded">Go to Analysis</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
