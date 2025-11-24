// Firebase Setup
import { database } from './firebase-config.js';
import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Apply saved theme immediately
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }

    const user = JSON.parse(currentUser);
    
    // Set greeting
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
      greetingElement.textContent = getGreeting();
    }
    
    // Set user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = user.nama || user.username;
    }
    
    // Set user class
    const userClassElement = document.getElementById('user-class');
    if (userClassElement) {
      userClassElement.textContent = user.kelas;
    }

    // Update time every second
    updateTime();
    setInterval(updateTime, 1000);

    // Toggle theme with switch
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

    // Profile link
    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
      profileLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          // Reload user data from Firebase to get latest info
          const userRef = ref(database, 'users/' + user.username);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const latestUser = snapshot.val();
            document.getElementById('profile-nisn').value = latestUser.nisn || '';
            document.getElementById('profile-nama').value = latestUser.nama || '';
            document.getElementById('profile-kelas').value = latestUser.kelas || '';
            document.getElementById('profile-phone').value = latestUser.phone || '';

            const modal = new bootstrap.Modal(document.getElementById('profileModal'));
            modal.show();
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          showToast('Gagal memuat profil!', 'danger');
        }
      });
    }

    // Profile form with confirmation
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;
        const phone = document.getElementById('profile-phone').value.trim();

        if (newPassword !== confirmPassword) {
          showToast('Konfirmasi password tidak cocok!', 'danger');
          return;
        }

        // Check if SweetAlert2 is available
        if (typeof Swal !== 'undefined') {
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
              updateProfile(newPassword, phone, user.username);
            }
          });
        } else {
          if (confirm("Apakah Anda yakin ingin menyimpan perubahan?")) {
            updateProfile(newPassword, phone, user.username);
          }
        }
      });
    }

    async function updateProfile(newPassword, phone, username) {
      try {
        const userRef = ref(database, 'users/' + username);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          userData.password = newPassword;
          userData.phone = phone;
          
          await set(userRef, userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              title: "Tersimpan!",
              text: "Profil Anda telah diperbarui.",
              icon: "success"
            });
          } else {
            showToast('Profil berhasil diperbarui!', 'success');
          }
          
          const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
          if (modal) {
            modal.hide();
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Gagal memperbarui profil!', 'danger');
      }
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
      });
    }
  } catch (error) {
    console.error('Error initializing page:', error);
    showToast('Terjadi kesalahan saat memuat halaman', 'danger');
  }
});
