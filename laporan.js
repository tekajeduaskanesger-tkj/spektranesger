// laporan.js - Modifikasi untuk Firebase

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  toastMessage.textContent = message;
  toast.className = `toast align-items-center text-white bg-${type} border-0 animate-pop-up`;
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
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

  const namaFasilitas = document.getElementById('nama-fasilitas');
  const lokasiFasilitas = document.getElementById('lokasi-fasilitas');
  const kategoriFasilitas = document.getElementById('kategori-fasilitas');
  const prioritasFasilitas = document.getElementById('prioritas-fasilitas');
  const deskripsiFasilitas = document.getElementById('deskripsi-fasilitas');
  const fotoFasilitas = document.getElementById('foto-fasilitas');
  const previewFasilitas = document.getElementById('preview-fasilitas');
  const customKategoriContainer = document.getElementById('custom-kategori-container');
  const fasilitasForm = document.getElementById('fasilitas-form');

  namaFasilitas.value = currentUser.nama || currentUser.username;
  namaFasilitas.readOnly = true;

  // Kategori lain
  kategoriFasilitas.addEventListener('change', (e) => {
    customKategoriContainer.style.display = e.target.value === 'Lainnya' ? 'block' : 'none';
  });

  // Preview foto
  fotoFasilitas.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewFasilitas.src = e.target.result;
        previewFasilitas.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      previewFasilitas.style.display = 'none';
    }
  });

  // Submit form
  fasilitasForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let kategori = kategoriFasilitas.value;
    if (kategori === 'Lainnya') {
      kategori = document.getElementById('custom-kategori').value.trim();
      if (!kategori) return showToast('Mohon isi kategori lainnya!', 'warning');
    }

    if (!fotoFasilitas.files[0]) return showToast('Mohon upload foto kerusakan!', 'warning');

    const file = fotoFasilitas.files[0];
    const storageRef = firebase.storage().ref('fasilitas/' + Date.now() + '_' + file.name);

    storageRef.put(file).then(() => {
      return storageRef.getDownloadURL();
    }).then((fotoURL) => {
      const reportData = {
        nama: namaFasilitas.value.trim(),
        kelas: currentUser.kelas,
        lokasi: lokasiFasilitas.value.trim(),
        kategori: kategori,
        prioritas: prioritasFasilitas.value.trim(),
        deskripsi: deskripsiFasilitas.value.trim(),
        foto: fotoURL,
        status: 'baru',
        tanggal: formatDate(new Date()),
        username: currentUser.username
      };

      firebase.database().ref('laporan_fasilitas').push(reportData).then(() => {
        showToast('Laporan berhasil dikirim!');
        fasilitasForm.reset();
        namaFasilitas.value = currentUser.nama || currentUser.username;
        previewFasilitas.style.display = 'none';
        customKategoriContainer.style.display = 'none';
      }).catch((err) => {
        showToast('Gagal mengirim laporan!', 'danger');
      });
    }).catch((err) => {
      showToast('Gagal upload foto: ' + err.message, 'danger');
    });
  });
});
