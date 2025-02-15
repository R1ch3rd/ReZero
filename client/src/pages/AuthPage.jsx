import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);

  const toggleAuthMode = () => setIsLogin(!isLogin);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        await fetchUserData(userCredential.user.uid);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          fullName,
          email,
          phone,
          bio,
        });
        setCurrentUser(user);
        setUserData({ fullName, email, phone, bio });
      }
      alert('Authentication successful!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const fetchUserData = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        {currentUser ? (
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome, {userData?.fullName || 'User'}</h2>
            <p className="text-gray-300 mb-2"><strong>Email:</strong> {userData?.email}</p>
            <p className="text-gray-300 mb-2"><strong>Phone:</strong> {userData?.phone}</p>
            <p className="text-gray-300 mb-6"><strong>Bio:</strong> {userData?.bio}</p>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-6">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form className="bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-md max-w-md w-full backdrop-blur-lg" onSubmit={handleAuth}>
              {!isLogin && (
                <>
                  <label className="block text-lg font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white mb-4"
                    required
                  />
                  <label className="block text-lg font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white mb-4"
                    required
                  />
                  <label className="block text-lg font-medium mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white mb-4"
                    placeholder="Tell us about yourself..."
                    required
                  />
                </>
              )}
              <label className="block text-lg font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white mb-4"
                required
              />
              <label className="block text-lg font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-500 rounded-lg bg-gray-700 text-white mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-transform duration-300 transform hover:scale-105"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </button>
              <p className="mt-4 text-center cursor-pointer text-blue-400 hover:underline" onClick={toggleAuthMode}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </p>
            </form>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;
