// Firebase Setup
import { database } from './firebase-config.js';
import { ref, set, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.className = `toast align-items-center text-white bg-${type} border-0 animate-pop-up`;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }
}

// Function to apply theme
function applyTheme(theme) {
  const toggleElement = document.getElementById('toggle-theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    if (toggleElement) {
      toggleElement.checked = true;
    }
  } else {
    document.body.classList.remove('dark-mode');
    if (toggleElement) {
      toggleElement.checked = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme immediately
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Check if user is logged in
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    showUserDashboard(JSON.parse(currentUser));
  } else {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.style.display = 'block';
    }
  }

  // Toggle theme with animation
  const toggleTheme = document.getElementById('toggle-theme');
  if (toggleTheme) {
    toggleTheme.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const userRef = ref(database, 'users/' + username);
        const snapshot = await get(userRef);
        
        if (snapshot.exists() && snapshot.val().password === password) {
          const userData = snapshot.val();
          localStorage.setItem('currentUser', JSON.stringify(userData));
          Toast.fire({
            icon: "success",
            title: "Signed in successfully"
          });
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1000);
        } else {
          showToast('Username atau password salah!', 'danger');
        }
      } catch (error) {
        console.error('Login error:', error);
        showToast('Terjadi kesalahan saat login!', 'danger');
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      location.reload();
    });
  }

  // Preview setup
  function setupPreview(inputId, previewId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.addEventListener('change', function(e) {
        const preview = document.getElementById(previewId);
        const file = e.target.files[0];
        if (file && preview) {
          const reader = new FileReader();
          reader.onload = function(event) {
            preview.src = event.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  setupPreview('foto-fasilitas', 'preview-fasilitas');
  setupPreview('foto-piket', 'preview-piket');

  // Submit fasilitas form
  const fasilitasForm = document.getElementById('fasilitas-form');
  if (fasilitasForm) {
    fasilitasForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) return;

      const previewElement = document.getElementById('preview-fasilitas');
      if (!previewElement || !previewElement.src) {
        showToast('Mohon upload foto!', 'warning');
        return;
      }

      const data = {
        nama: document.getElementById('nama-fasilitas').value,
        kelas: currentUser.kelas,
        lokasi: document.getElementById('lokasi-fasilitas').value,
        kategori: document.getElementById('kategori-fasilitas').value,
        prioritas: document.getElementById('prioritas-fasilitas').value,
        deskripsi: document.getElementById('deskripsi-fasilitas').value,
        foto: previewElement.src,
        status: 'baru',
        tanggal: formatDate(new Date()),
        username: currentUser.username
      };

      try {
        const newReportRef = push(ref(database, 'fasilitasReports'));
        await set(newReportRef, data);
        showToast('Laporan fasilitas berhasil dikirim!');
        this.reset();
        previewElement.style.display = 'none';
        loadUserReports();
      } catch (error) {
        console.error('Error saving report:', error);
        showToast('Gagal mengirim laporan!', 'danger');
      }
    });
  }

  // Submit piket form
  const piketForm = document.getElementById('piket-form');
  if (piketForm) {
    piketForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) return;

      const previewElement = document.getElementById('preview-piket');
      if (!previewElement || !previewElement.src) {
        showToast('Mohon upload foto!', 'warning');
        return;
      }

      const data = {
        nama: document.getElementById('nama-piket').value,
        kelas: currentUser.kelas,
        tanggal: document.getElementById('tanggal-piket').value,
        foto: previewElement.src,
        waktu: new Date().toLocaleString(),
        username: currentUser.username
      };

      try {
        const newReportRef = push(ref(database, 'piketReports'));
        await set(newReportRef, data);
        showToast('Absensi piket berhasil disimpan!');
        this.reset();
        previewElement.style.display = 'none';
        loadUserReports();
      } catch (error) {
        console.error('Error saving attendance:', error);
        showToast('Gagal menyimpan absensi!', 'danger');
      }
    });
  }

  function showUserDashboard(user) {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const formsSection = document.getElementById('forms-section');
    const userNameElement = document.getElementById('user-name');

    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'block';
    if (formsSection) formsSection.style.display = 'block';
    if (userNameElement) userNameElement.textContent = user.username;
    
    loadUserReports();
  }

  async function loadUserReports() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
      // Load fasilitas reports
      const fasilitasRef = ref(database, 'fasilitasReports');
      const fasilitasSnapshot = await get(fasilitasRef);
      
      const fasilitasTableBody = document.querySelector('#user-fasilitas-table tbody');
      if (fasilitasTableBody) {
        fasilitasTableBody.innerHTML = '';
        
        if (fasilitasSnapshot.exists()) {
          const reports = [];
          fasilitasSnapshot.forEach((childSnapshot) => {
            const report = childSnapshot.val();
            if (report.username === currentUser.username) {
              reports.push(report);
            }
          });
          
          reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${report.lokasi}</td>
              <td><span class="badge bg-${report.status === 'selesai' ? 'success' : report.status === 'diproses' ? 'warning' : 'secondary'}">${report.status}</span></td>
              <td>${report.tanggal}</td>
            `;
            fasilitasTableBody.appendChild(row);
          });
        }
      }

      // Load piket reports
      const piketRef = ref(database, 'piketReports');
      const piketSnapshot = await get(piketRef);
      
      const piketTableBody = document.querySelector('#user-piket-table tbody');
      if (piketTableBody) {
        piketTableBody.innerHTML = '';
        
        if (piketSnapshot.exists()) {
          const reports = [];
          piketSnapshot.forEach((childSnapshot) => {
            const report = childSnapshot.val();
            if (report.username === currentUser.username) {
              reports.push(report);
            }
          });
          
          reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${report.tanggal}</td>
              <td>${report.waktu}</td>
            `;
            piketTableBody.appendChild(row);
          });
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }
});
