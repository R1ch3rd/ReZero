import React, { useState } from 'react';
import ProfileTitleCard from '../components/ProfileTitleCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Profile = () => {
  const [username, setUsername] = useState('JohnDoe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [fullName, setFullName] = useState('John Doe');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    alert('Profile saved successfully!');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header /> {/* Consistent Header */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <ProfileTitleCard title="User Profile" subtitle="Manage your account details" />

        <div className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-md mt-6 max-w-md w-full backdrop-blur-lg">
          <label className="block text-lg font-medium mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

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

          <label className="block text-lg font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <label className="block text-lg font-medium mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Tell us about yourself..."
          />

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-transform duration-300 transform hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </div>
      <Footer /> {/* Consistent Footer */}
    </div>
  );
};

export default Profile;
