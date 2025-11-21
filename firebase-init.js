<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  import { getDatabase, ref, set, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
  import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCfnZZ8kLLs8qVuJVortXE759gXhl1VzGY",
    authDomain: "spektranesger-2025.firebaseapp.com",
    databaseURL: "https://spektranesger-2025-default-rtdb.firebaseio.com",
    projectId: "spektranesger-2025",
    storageBucket: "spektranesger-2025.firebasestorage.app",
    messagingSenderId: "608440457854",
    appId: "1:608440457854:web:8d93b85f32fe12e6e3d62f"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const storage = getStorage(app);

  window.firebaseDB = { db, ref, get, set, push, onValue };
  window.firebaseStorage = { storage, sRef, uploadBytes, getDownloadURL };
</script>