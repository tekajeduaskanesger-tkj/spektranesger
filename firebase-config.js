// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfnZZ8kLLs8qVuJVortXE759gXhl1VzGY",
  authDomain: "spektranesger-2025.firebaseapp.com",
  databaseURL: "https://spektranesger-2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spektranesger-2025",
  storageBucket: "spektranesger-2025.firebasestorage.app",
  messagingSenderId: "608440457854",
  appId: "1:608440457854:web:8d93b85f32fe12e6e3d62f",
  measurementId: "G-GJNRK8Z094"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, analytics, database };
