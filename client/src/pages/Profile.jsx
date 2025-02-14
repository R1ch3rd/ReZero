import React, { useState } from 'react';

const Profile = () => {
  const [username, setUsername] = useState('JohnDoe');
  const [email, setEmail] = useState('john.doe@example.com');
  
  const handleSave = () => {
    // Save profile information logic here
    alert('Profile saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <label className="block text-lg font-medium mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <label className="block text-lg font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Profile;
