// admin.js - Modifikasi untuk Firebase
let chartInstance = null;

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

  const loginSection = document.getElementById('login-section');
  const adminContent = document.getElementById('admin-content');

  // Admin login (hardcode or from Firebase, here hardcode for simplicity, change password if needed)
  document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === 'admin' && password === 'admin2025') {
      localStorage.setItem('adminLoggedIn', true);
      loginSection.style.display = 'none';
      adminContent.style.display = 'block';
      loadAdminData();
      showToast('Login admin berhasil!', 'success');
    } else {
      showToast('Username atau password salah!', 'danger');
    }
  });

  // Check if admin logged in
  if (localStorage.getItem('adminLoggedIn')) {
    loginSection.style.display = 'none';
    adminContent.style.display = 'block';
    loadAdminData();
  } else {
    loginSection.style.display = 'block';
  }

  // Tab switching
  document.getElementById('tab-laporan').addEventListener('click', () => switchTab('content-laporan'));
  document.getElementById('tab-piket').addEventListener('click', () => switchTab('content-piket'));
  document.getElementById('tab-student').addEventListener('click', () => switchTab('content-student'));

  function switchTab(id) {
    document.querySelectorAll('[id^="content-"]').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + id.split('-')[1]).classList.add('active');
  }

  // Load data
  function loadAdminData() {
    // Load laporan fasilitas
    firebase.database().ref('laporan_fasilitas').on('value', (snap) => {
      const tbody = document.querySelector('#admin-fasilitas-table tbody');
      tbody.innerHTML = '';
      snap.forEach((child) => {
        const report = child.val();
        const key = child.key;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${report.nama}</td>
          <td>${report.kelas}</td>
          <td>${report.lokasi}</td>
          <td>${report.kategori}</td>
          <td>${report.prioritas}</td>
          <td>${report.deskripsi}</td>
          <td><button class="btn btn-sm btn-info view-image" data-url="${report.foto}">Lihat</button></td>
          <td>
            <select class="form-select status-select" data-key="${key}">
              <option value="baru" ${report.status === 'baru' ? 'selected' : ''}>Baru</option>
              <option value="diproses" ${report.status === 'diproses' ? 'selected' : ''}>Diproses</option>
              <option value="selesai" ${report.status === 'selesai' ? 'selected' : ''}>Selesai</option>
            </select>
          </td>
          <td><button class="btn btn-sm btn-danger delete-report" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      addEventListeners();
      updateChart();
    });

    // Load absensi piket
    firebase.database().ref('absensi_piket').on('value', (snap) => {
      const tbody = document.querySelector('#admin-piket-table tbody');
      tbody.innerHTML = '';
      snap.forEach((child) => {
        const report = child.val();
        const key = child.key;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${report.nama}</td>
          <td>${report.kelas}</td>
          <td>${report.tanggal}</td>
          <td>${report.waktu}</td>
          <td><button class="btn btn-sm btn-info view-image" data-url="${report.foto}">Lihat</button></td>
          <td><button class="btn btn-sm btn-danger delete-report" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      addEventListeners();
    });

    // Load students
    firebase.database().ref('users').on('value', (snap) => {
      const tbody = document.querySelector('#student-table tbody');
      tbody.innerHTML = '';
      snap.forEach((child) => {
        const user = child.val();
        if (user.username !== 'admin') {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.nama}</td>
            <td>${user.kelas}</td>
            <td>${user.phone || '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning edit-student" data-username="${user.username}">Edit</button>
              <button class="btn btn-sm btn-danger delete-student" data-username="${user.username}">Hapus</button>
            </td>
          `;
          tbody.appendChild(row);
        }
      });
      addEventListeners();
    });
  }

  function addEventListeners() {
    // View image
    document.querySelectorAll('.view-image').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.getElementById('modalImage').src = e.target.dataset.url;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
      });
    });

    // Change status
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        firebase.database().ref('laporan_fasilitas/' + key).update({ status: e.target.value }).then(() => {
          showToast('Status updated!');
        });
      });
    });

    // Delete report
    document.querySelectorAll('.delete-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        const ref = e.target.closest('table').id.includes('fasilitas') ? 'laporan_fasilitas' : 'absensi_piket';
        Swal.fire({
          title: 'Yakin hapus?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, hapus!'
        }).then((result) => {
          if (result.isConfirmed) {
            firebase.database().ref(ref + '/' + key).remove().then(() => {
              showToast('Data dihapus!');
            });
          }
        });
      });
    });

    // Edit student
    document.querySelectorAll('.edit-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.dataset.username;
        firebase.database().ref('users/' + username).once('value').then((snap) => {
          const user = snap.val();
          document.getElementById('studentModalTitle').textContent = 'Edit Siswa';
          document.getElementById('student-username').value = user.username;
          document.getElementById('student-username').readOnly = true;
          document.getElementById('student-password').value = user.password;
          document.getElementById('student-nama').value = user.nama;
          document.getElementById('student-kelas').value = user.kelas;
          document.getElementById('student-phone').value = user.phone;
          new bootstrap.Modal(document.getElementById('studentModal')).show();
        });
      });
    });

    // Delete student
    document.querySelectorAll('.delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.dataset.username;
        Swal.fire({
          title: 'Yakin hapus siswa?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, hapus!'
        }).then((result) => {
          if (result.isConfirmed) {
            firebase.database().ref('users/' + username).remove().then(() => {
              showToast('Siswa dihapus!');
            });
          }
        });
      });
    });
  }

  // Add student button
  document.getElementById('add-student-btn').addEventListener('click', () => {
    document.getElementById('studentModalTitle').textContent = 'Tambah Siswa';
    document.getElementById('student-form').reset();
    document.getElementById('student-username').readOnly = false;
    new bootstrap.Modal(document.getElementById('studentModal')).show();
  });

  // Student form
  document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('student-username').value;
    const password = document.getElementById('student-password').value;
    const nama = document.getElementById('student-nama').value;
    const kelas = document.getElementById('student-kelas').value;
    const phone = document.getElementById('student-phone').value;

    const userData = {
      username,
      password,
      nama,
      kelas,
      phone
    };

    firebase.database().ref('users/' + username).set(userData).then(() => {
      showToast('Siswa disimpan!');
      bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    }).catch((err) => {
      showToast('Gagal simpan siswa: ' + err.message, 'danger');
    });
  });

  // Export buttons
  document.getElementById('export-laporan').addEventListener('click', () => exportData('laporan_fasilitas', 'laporan_fasilitas.html'));
  document.getElementById('export-piket').addEventListener('click', () => exportData('absensi_piket', 'absensi_piket.html'));

  function exportData(refName, filename) {
    firebase.database().ref(refName).once('value').then((snap) => {
      const data = [];
      snap.forEach((child) => {
        data.push(child.val());
      });
      const htmlContent = convertToHTMLTable(data, refName);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      Toast.fire({
        icon: "success",
        title: "Data berhasil diekspor!"
      });
    });
  }

  function convertToHTMLTable(data, storeName) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported ${storeName} Data</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100px; max-height: 100px; }
    </style>
</head>
<body>
    <h1>Exported ${storeName} Data</h1>
    <table>
        <thead>
            <tr>`;
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += `
            </tr>
        </thead>
        <tbody>`;
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        if (header === 'foto' && value) {
          html += `<td><img src="${value}" alt="Foto"></td>`;
        } else {
          html += `<td>${value || 'N/A'}</td>`;
        }
      });
      html += '</tr>';
    });
    html += `
        </tbody>
    </table>
</body>
</html>`;
    return html;
  }

  // Update chart (contoh, adjust if needed)
  function updateChart() {
    firebase.database().ref('laporan_fasilitas').once('value').then((snap) => {
      const statusCount = { baru: 0, diproses: 0, selesai: 0 };
      snap.forEach((child) => {
        const status = child.val().status || 'baru';
        statusCount[status]++;
      });
      const ctx = document.getElementById('chart').getContext('2d');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Baru', 'Diproses', 'Selesai'],
          datasets: [{
            data: [statusCount.baru, statusCount.diproses, statusCount.selesai],
            backgroundColor: ['#dc3545', '#ffc107', '#28a745']
          }]
        },
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Status Laporan Fasilitas'
          }
        }
      });
    });
  }
});
