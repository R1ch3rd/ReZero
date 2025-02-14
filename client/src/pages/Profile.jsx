import React, { useState } from 'react';
import ProfileTitleCard from '../components/ProfileTitleCard';

const Profile = () => {
  const [username, setUsername] = useState('JohnDoe');
  const [email, setEmail] = useState('john.doe@example.com');

  const handleSave = () => {
    alert('Profile saved!');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col items-center justify-center px-4">
      {/* Profile Title Card */}
      <ProfileTitleCard title="User Profile" subtitle="Manage your account details" />

      <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-md mt-6 max-w-md w-full backdrop-blur-lg">
        <label className="block text-lg font-medium mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <label className="block text-lg font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-transform duration-300 transform hover:scale-105"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Profile;
