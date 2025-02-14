import React from 'react';
import { motion } from 'framer-motion';

const ProfileTitleCard = ({ title, subtitle }) => {
  return (
    <motion.div
      className="relative bg-gradient-to-r from-purple-500 via-blue-400 to-violet-400 p-6 rounded-2xl shadow-xl text-center text-white max-w-lg mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-2xl backdrop-blur-md"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-lg mt-2">{subtitle}</p>
      </div>
    </motion.div>
  );
};

export default ProfileTitleCard;
