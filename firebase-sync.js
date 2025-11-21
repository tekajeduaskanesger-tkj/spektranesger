<script type="module">
  import { firebaseDB, firebaseStorage } from './firebase-init.js';
  const { db, ref, get, set, push, onValue } = firebaseDB;
  const { storage, sRef, uploadBytes, getDownloadURL } = firebaseStorage;

  const toast = (msg, type='success') => {
    const t = document.getElementById('toast-message');
    if (t) t.textContent = msg;
    const toastEl = document.getElementById('toast');
    if (toastEl) {
      toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
      new bootstrap.Toast(toastEl).show();
    }
  };

  // Upload foto dari base64 ke Firebase Storage
  async function uploadFotoBase64(base64, folder) {
    if (!base64.startsWith('data:')) return base64;
    const blob = await (await fetch(base64)).blob();
    const path = `${folder}/${Date.now()}.jpg`;
    const snap = await uploadBytes(sRef(storage, path), blob);
    return await getDownloadURL(snap.ref);
  }

  // Sync semua data IndexedDB ke Firebase saat online
  async function syncToFirebase() {
    if (!db) return;
    const tx = db.transaction(['fasilitasReports', 'piketReports', 'users']);
    for (const storeName of tx.objectStoreNames) {
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = async () => {
        for (const item of req.result) {
          if (item.synced) continue;
          if (item.foto) item.foto = await uploadFotoBase64(item.foto, storeName);
          await push(ref(db, storeName), { ...item, synced: true, syncTime: new Date().toISOString() });
        }
      };
    }
    toast("Semua data berhasil disinkronkan ke cloud!", "success");
  }

  // Jalankan sync otomatis tiap buka aplikasi
  setTimeout(syncToFirebase, 3000);

  // Admin: tampilkan real-time dari Firebase
  if (location.pathname.includes('admin.html')) {
    onValue(ref(db, 'fasilitasReports'), s => {
      const tbody = document.querySelector('#fasilitas-table tbody') || document.querySelector('#user-fasilitas-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      s.forEach(c => {
        const d = c.val();
        tbody.innerHTML += `<tr><td>${d.nama}</td><td>${d.lokasi}</td><td><span class="badge bg-warning">${d.status||'baru'}</span></td><td>${d.tanggal}</td><td><a href="${d.foto}" target="_blank">Lihat</a></td></tr>`;
      });
    });

    onValue(ref(db, 'piketReports'), s => {
      const tbody = document.querySelector('#piket-table tbody') || document.querySelector('#user-piket-table tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      s.forEach(c => {
        const d = c.val();
        tbody.innerHTML += `<tr><td>${d.nama}</td><td>${d.kelas}</td><td>${d.tanggal}</td><td>${d.waktu}</td><td><a href="${d.foto}" target="_blank">Lihat</a></td></tr>`;
      });
    });
  }
</script>