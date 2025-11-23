// home.js - Modifikasi untuk Firebase

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.className = `toast align-items-center text-white bg-${type} border-0 animate-pop-up`;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

// Function to apply theme
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    const toggleElement = document.getElementById('toggle-theme');
    if (toggleElement) {
      toggleElement.checked = true;
    }
  } else {
    document.body.classList.remove('dark-mode');
    const toggleElement = document.getElementById('toggle-theme');
    if (toggleElement) {
      toggleElement.checked = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Toggle theme
  document.getElementById('toggle-theme').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  });

  // Set greeting
  document.getElementById('greeting').textContent = getGreeting();

  // Update time every second
  updateTime();
  setInterval(updateTime, 1000);

  // Check login
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // Profile link
  document.getElementById('profile-link').addEventListener('click', (e) => {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    document.getElementById('profile-nisn').value = currentUser.nisn || '';
    document.getElementById('profile-nama').value = currentUser.nama || currentUser.username;
    document.getElementById('profile-kelas').value = currentUser.kelas || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    modal.show();
  });

  // Profile form
  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;
    const phone = document.getElementById('profile-phone').value;

    if (newPassword !== confirmPassword) {
      showToast('Password tidak cocok!', 'danger');
      return;
    }

    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Profil Anda akan diperbarui!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, simpan!",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        updateProfile(newPassword, phone, currentUser.username);
      }
    });
  });

  function updateProfile(newPassword, phone, username) {
    const updates = {};
    if (newPassword) updates.password = newPassword;
    if (phone) updates.phone = phone;

    firebase.database().ref('users/' + username).update(updates).then(() => {
      const updatedUser = { ...currentUser, password: newPassword, phone: phone };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      Swal.fire({
        title: "Tersimpan!",
        text: "Profil Anda telah diperbarui.",
        icon: "success"
      });
      bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
    }).catch((err) => {
      showToast('Gagal update profile: ' + err.message, 'danger');
    });
  }

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });
});
