import React, { useEffect, useState } from 'react';
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(collection(db, "users", user.uid, "actions"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const actionsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActions(actionsArray);
      });
      return () => unsubscribe();
    }
  }, []);

  const saveUserAction = async (input, output) => {
    const user = auth.currentUser;
    if (user) {
      const userActionsRef = collection(db, "users", user.uid, "actions");
      await addDoc(userActionsRef, { 
        input: input, 
        output: output, 
        timestamp: new Date() 
      });
    } else {
      console.log("No user logged in");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <p className="mb-4 text-gray-300">Here are your recent actions and analyses:</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actions.length > 0 ? (
            actions.map((action) => (
              <div key={action.id} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-transform cursor-pointer">
                <h3 className="text-xl font-semibold mb-2">Input:</h3>
                <p className="text-gray-300 mb-4">{action.input}</p>
                <h3 className="text-xl font-semibold mb-2">Output:</h3>
                <p className="text-gray-300">{action.output}</p>
                <p className="text-sm text-gray-500 mt-4">Timestamp: {new Date(action.timestamp.toDate()).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No actions recorded yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
