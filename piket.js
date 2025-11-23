// piket.js - Modifikasi untuk Firebase

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
  // Apply theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  document.getElementById('toggle-theme').checked = savedTheme === 'dark';

  // Toggle theme
  document.getElementById('toggle-theme').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  const namaPiket = document.getElementById('nama-piket');
  const tanggalPiket = document.getElementById('tanggal-piket');
  const fotoPiket = document.getElementById('foto-piket');
  const previewPiket = document.getElementById('preview-piket');
  const piketForm = document.getElementById('piket-form');

  namaPiket.value = currentUser.nama || currentUser.username;
  namaPiket.readOnly = true;

  tanggalPiket.value = new Date().toISOString().split('T')[0];

  // Preview foto
  fotoPiket.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewPiket.src = e.target.result;
        previewPiket.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      previewPiket.style.display = 'none';
    }
  });

  // Submit form
  piketForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!fotoPiket.files[0]) return showToast('Mohon upload foto bukti piket!', 'warning');

    const file = fotoPiket.files[0];
    const storageRef = firebase.storage().ref('piket/' + Date.now() + '_' + file.name);

    storageRef.put(file).then(() => {
      return storageRef.getDownloadURL();
    }).then((fotoURL) => {
      const reportData = {
        nama: namaPiket.value.trim(),
        kelas: currentUser.kelas,
        tanggal: tanggalPiket.value.trim(),
        foto: fotoURL,
        waktu: new Date().toLocaleTimeString('id-ID'),
        timestamp: new Date().toISOString(),
        username: currentUser.username
      };

      firebase.database().ref('absensi_piket').push(reportData).then(() => {
        showToast('Absensi berhasil dikirim!');
        piketForm.reset();
        namaPiket.value = currentUser.nama || currentUser.username;
        tanggalPiket.value = new Date().toISOString().split('T')[0];
        previewPiket.style.display = 'none';
      }).catch((err) => {
        showToast('Gagal mengirim absensi!', 'danger');
      });
    }).catch((err) => {
      showToast('Gagal upload foto: ' + err.message, 'danger');
    });
  });
});
