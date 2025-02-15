import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Dashboard = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userActionsRef = collection(db, "users", user.uid, "actions");
        const q = query(userActionsRef, orderBy("timestamp", "desc"));

        // Real-time updates
        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          const userQueries = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setQueries(userQueries);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setQueries([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Your Past Queries</h2>

        {loading ? (
          <p>Loading...</p>
        ) : queries.length > 0 ? (
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query.id} className="p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">
                  <strong>Input:</strong> {query.input}
                </p>
                <p className="mt-2 text-green-400">
                  <strong>Analysis:</strong> {query.output}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {query.timestamp ? new Date(query.timestamp.seconds * 1000).toLocaleString() : "No timestamp"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No queries found.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
