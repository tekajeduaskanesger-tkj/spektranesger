// script.js — Versi FINAL yang pasti jalan

let db; // untuk IndexedDB
const dbName = 'LaporanAppDB';
const dbVersion = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains('fasilitasReports')) {
        db.createObjectStore('fasilitasReports', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('piketReports')) {
        db.createObjectStore('piketReports', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getStore(storeName, mode = 'readonly') {
  const transaction = db.transaction([storeName], mode);
  return transaction.objectStore(storeName);
}

function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.className = `toast align-items-center text-bg-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success'} border-0`;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Dark mode & theme
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    if (document.getElementById('toggle-theme')) document.getElementById('toggle-theme').checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    if (document.getElementById('toggle-theme')) document.getElementById('toggle-theme').checked = false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();

  // Apply theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Toggle theme
  const toggle = document.getElementById('toggle-theme');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // Cek login
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    showUserDashboard(JSON.parse(currentUser));
  } else {
    document.getElementById('auth-section').style.display = 'block';
  }

  // Login handler
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const store = getStore('users');
    const request = store.get(username);
    request.onsuccess = () => {
      if (request.result && request.result.password === password) {
        localStorage.setItem('currentUser', JSON.stringify(request.result));
        showUserDashboard(request.result);
        showToast('Login berhasil! Selamat datang ' + username, 'success');
      } else {
        showToast('Username atau password salah!', 'danger');
      }
    };
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    location.reload();
  });

  // Preview foto
  function setupPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input && preview) {
      input.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          preview.src = URL.createObjectURL(e.target.files[0]);
          preview.style.display = 'block';
        }
      });
    }
  }
  setupPreview('foto-fasilitas', 'preview-fasilitas');
  setupPreview('foto-piket', 'preview-piket');

  // Submit laporan fasilitas
  document.getElementById('fasilitas-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const data = {
      nama: document.getElementById('nama-fasilitas').value,
      kelas: user.kelas || '-',
      lokasi: document.getElementById('lokasi-fasilitas').value,
      kategori: document.getElementById('kategori-fasilitas').value,
      prioritas: document.getElementById('prioritas-fasilitas').value,
      deskripsi: document.getElementById('deskripsi-fasilitas').value,
      foto: document.getElementById('preview-fasilitas').src,
      status: 'baru',
      tanggal: formatDate(new Date()),
      username: user.username,
      timestamp: Date.now()
    };

    // Simpan ke IndexedDB
    const store = getStore('fasilitasReports', 'readwrite');
    store.add(data);

    // Sync ke Firebase
    try {
      const file = document.getElementById('foto-fasilitas').files[0];
      let fotoURL = data.foto;
      if (file) {
        const ref = firebase.storage().ref('fasilitas/' + Date.now() + '_' + file.name);
        await ref.put(file);
        fotoURL = await ref.getDownloadURL();
      }
      await firebase.database().ref('laporan_fasilitas').push({ ...data, foto: fotoURL });
    } catch (err) { console.log("Firebase gagal:", err); }

    showToast('Laporan berhasil dikirim!');
    this.reset();
    document.getElementById('preview-fasilitas').style.display = 'none';
    loadUserReports();
  });

  // Submit absensi piket (sama seperti atas)
  document.getElementById('piket-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const data = {
      nama: document.getElementById('nama-piket').value,
      kelas: user.kelas || '-',
      tanggal: document.getElementById('tanggal-piket').value,
      foto: document.getElementById('preview-piket').src,
      waktu: new Date().toLocaleString('id-ID'),
      username: user.username,
      timestamp: Date.now()
    };

    const store = getStore('piketReports', 'readwrite');
    store.add(data);

    try {
      const file = document.getElementById('foto-piket').files[0];
      let fotoURL = data.foto;
      if (file) {
        const ref = firebase.storage().ref('piket/' + Date.now() + '_' + file.name);
        await ref.put(file);
        fotoURL = await ref.getDownloadURL();
      }
      await firebase.database().ref('absensi_piket').push({ ...data, foto: fotoURL });
    } catch (err) { console.log("Firebase gagal:", err); }

    showToast('Absensi berhasil!');
    this.reset();
    document.getElementById('preview-piket').style.display = 'none';
    loadUserReports();
  });

  function showUserDashboard(user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('forms-section').style.display = 'block';
    document.getElementById('user-name').textContent = user.username || user.nama;
    loadUserReports();
  }

  window.loadUserReports = function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    // Fasilitas
    const tbody1 = document.querySelector('#user-fasilitas-table tbody');
    tbody1.innerHTML = '';
    const req1 = getStore('fasilitasReports').getAll();
    req1.onsuccess = () => {
      req1.result.filter(r => r.username === user.username).forEach(r => {
        tbody1.innerHTML += `<tr><td>${r.lokasi}</td><td><span class="badge bg-secondary">baru</span></td><td>${r.tanggal}</td></tr>`;
      });
    };

    // Piket
    const tbody2 = document.querySelector('#user-piket-table tbody');
    tbody2.innerHTML = '';
    const req2 = getStore('piketReports').getAll();
    req2.onsuccess = () => {
      req2.result.filter(r => r.username === user.username).forEach(r => {
        tbody2.innerHTML += `<tr><td>${r.tanggal}</td><td>${r.waktu}</td></tr>`;
      });
    };
  };
});
