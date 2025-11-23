// script.js - Modifikasi untuk Firebase
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
  toastMessage.textContent = message;
  toast.className = `toast align-items-center text-white bg-${type} border-0 animate-pop-up`;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Function to apply theme
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  document.getElementById('toggle-theme').checked = savedTheme === 'dark';

  // Toggle theme
  document.getElementById('toggle-theme').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  });

  // Check if logged in
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    showUserDashboard(JSON.parse(currentUser));
  } else {
    document.getElementById('auth-section').style.display = 'block';
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    firebase.database().ref('users/' + username).once('value').then((snap) => {
      const user = snap.val();
      if (user && user.password === password) {
        localStorage.setItem('currentUser', JSON.stringify(user));
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
    }).catch((err) => {
      showToast('Error login: ' + err.message, 'danger');
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    location.reload();
  });

  function showUserDashboard(user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('forms-section').style.display = 'block';
    document.getElementById('user-name').textContent = user.username;
    loadUserReports();
  }

  function loadUserReports() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    // Load fasilitas reports from Firebase
    firebase.database().ref('laporan_fasilitas').orderByChild('username').equalTo(currentUser.username).on('value', (snap) => {
      const tbody = document.querySelector('#user-fasilitas-table tbody');
      tbody.innerHTML = '';
      snap.forEach((child) => {
        const report = child.val();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${report.lokasi}</td>
          <td><span class="badge bg-${report.status === 'selesai' ? 'success' : report.status === 'diproses' ? 'warning' : 'secondary'}">${report.status || 'baru'}</span></td>
          <td>${report.tanggal}</td>
        `;
        tbody.appendChild(row);
      });
    });

    // Load piket reports from Firebase
    firebase.database().ref('absensi_piket').orderByChild('username').equalTo(currentUser.username).on('value', (snap) => {
      const tbody = document.querySelector('#user-piket-table tbody');
      tbody.innerHTML = '';
      snap.forEach((child) => {
        const report = child.val();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${report.tanggal}</td>
          <td>${report.waktu}</td>
        `;
        tbody.appendChild(row);
      });
    });
  }
});
