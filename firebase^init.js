// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage, ref, push, set, storageRef, uploadBytes, getDownloadURL };