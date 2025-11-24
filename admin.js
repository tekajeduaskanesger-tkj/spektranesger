// Firebase Setup
import { database } from './firebase-config.js';
import { ref, set, get, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
    document.getElementById('toggle-theme').checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('toggle-theme').checked = false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme immediately
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Toggle theme with animation
  document.getElementById('toggle-theme').addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });

  // Admin login
  document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    if (password === 'admin123') {
      Toast.fire({
        icon: "success",
        title: "Login telah berhasil!"
      });
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadStudents();
      loadReports();
      loadStatistics();
      loadChart();
    } else {
      showToast('Password salah!', 'danger');
    }
  });

  // Search and sort for fasilitas
  document.getElementById('search-fasilitas').addEventListener('input', () => loadFasilitas());
  document.getElementById('sort-fasilitas').addEventListener('change', () => loadFasilitas());

  // Search and sort for piket
  document.getElementById('search-piket').addEventListener('input', () => loadPiket());
  document.getElementById('sort-piket').addEventListener('change', () => loadPiket());

  // Add student form
  document.getElementById('add-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('student-username').value;
    const password = document.getElementById('student-password').value;
    const nisn = document.getElementById('student-nisn').value;
    const nama = document.getElementById('student-nama').value;
    const kelas = document.getElementById('student-kelas').value;
    const phone = document.getElementById('student-phone').value || '';

    try {
      const userRef = ref(database, 'users/' + username);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        showToast('Username sudah ada!', 'danger');
        return;
      }

      await set(userRef, { 
        username, 
        password, 
        nisn, 
        nama, 
        kelas, 
        phone 
      });

      Toast.fire({
        icon: "success",
        title: "Siswa berhasil ditambahkan!"
      });
      document.getElementById('add-student-form').reset();
      bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
      loadStudents();
      loadStatistics();
    } catch (error) {
      console.error('Error adding student:', error);
      showToast('Gagal menambahkan siswa!', 'danger');
    }
  });

  // Store original username for editing
  let originalUsername = '';

  // Edit student form - Username can be edited now
  document.getElementById('edit-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newUsername = document.getElementById('edit-student-username').value;
    const newPassword = document.getElementById('edit-student-password').value;
    const nisn = document.getElementById('edit-student-nisn').value;
    const nama = document.getElementById('edit-student-nama').value;
    const kelas = document.getElementById('edit-student-kelas').value;
    const phone = document.getElementById('edit-student-phone').value || '';

    Swal.fire({
      title: "Apakah sudah siap disimpan?",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      denyButtonText: `Jangan Simpan`
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // If username changed, delete old and create new
          if (originalUsername !== newUsername) {
            // Check if new username already exists
            const newUserRef = ref(database, 'users/' + newUsername);
            const newSnapshot = await get(newUserRef);
            
            if (newSnapshot.exists() && originalUsername !== newUsername) {
              Swal.fire("Error!", "Username sudah digunakan!", "error");
              return;
            }
            
            // Get old data
            const oldUserRef = ref(database, 'users/' + originalUsername);
            const oldSnapshot = await get(oldUserRef);
            
            if (oldSnapshot.exists()) {
              const userData = {
                username: newUsername,
                password: newPassword || oldSnapshot.val().password,
                nisn: nisn,
                nama: nama,
                kelas: kelas,
                phone: phone
              };
              
              // Create new user
              await set(newUserRef, userData);
              // Delete old user
              await remove(oldUserRef);
              
              Swal.fire("Tersimpan!", "Data berhasil diupdate!", "success");
              bootstrap.Modal.getInstance(document.getElementById('editStudentModal')).hide();
              loadStudents();
              loadStatistics();
            }
          } else {
            // Just update existing
            const userRef = ref(database, 'users/' + originalUsername);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
              const userData = snapshot.val();
              if (newPassword) userData.password = newPassword;
              userData.nisn = nisn;
              userData.nama = nama;
              userData.kelas = kelas;
              userData.phone = phone;
              
              await set(userRef, userData);
              
              Swal.fire("Tersimpan!", "Data berhasil diupdate!", "success");
              bootstrap.Modal.getInstance(document.getElementById('editStudentModal')).hide();
              loadStudents();
              loadStatistics();
            }
          }
        } catch (error) {
          console.error('Error updating student:', error);
          Swal.fire("Error!", "Gagal mengupdate data!", "error");
        }
      } else if (result.isDenied) {
        Swal.fire("Perubahan tidak tersimpan!", "", "info");
      }
    });
  });

  // Export functions
  document.getElementById('export-fasilitas').addEventListener('click', () => exportToHTMLTable('fasilitasReports', 'fasilitas-reports.html'));
  document.getElementById('export-piket').addEventListener('click', () => exportToHTMLTable('piketReports', 'piket-reports.html'));

  async function loadReports() {
    await loadFasilitas();
    await loadPiket();
  }

  async function loadStatistics() {
    try {
      // Load fasilitas statistics
      const fasilitasRef = ref(database, 'fasilitasReports');
      const fasilitasSnapshot = await get(fasilitasRef);
      
      let fasilitasReports = [];
      if (fasilitasSnapshot.exists()) {
        fasilitasSnapshot.forEach((childSnapshot) => {
          fasilitasReports.push(childSnapshot.val());
        });
      }
      
      document.getElementById('total-fasilitas').textContent = fasilitasReports.length;
      document.getElementById('selesai-fasilitas').textContent = fasilitasReports.filter(r => r.status === 'selesai').length;
      const uniqueClasses = new Set(fasilitasReports.map(r => r.kelas));
      document.getElementById('total-kelas').textContent = uniqueClasses.size;

      // Load piket statistics
      const piketRef = ref(database, 'piketReports');
      const piketSnapshot = await get(piketRef);
      
      let piketReports = [];
      if (piketSnapshot.exists()) {
        piketSnapshot.forEach((childSnapshot) => {
          piketReports.push(childSnapshot.val());
        });
      }
      document.getElementById('total-piket').textContent = piketReports.length;

      // Load users statistics
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      let usersCount = 0;
      if (usersSnapshot.exists()) {
        usersSnapshot.forEach(() => {
          usersCount++;
        });
      }
      document.getElementById('total-users').textContent = usersCount;
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async function loadChart() {
    try {
      const fasilitasRef = ref(database, 'fasilitasReports');
      const snapshot = await get(fasilitasRef);
      
      let reports = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          reports.push(childSnapshot.val());
        });
      }

      const statusCounts = {
        baru: reports.filter(r => r.status === 'baru').length,
        diproses: reports.filter(r => r.status === 'diproses').length,
        selesai: reports.filter(r => r.status === 'selesai').length
      };

      const ctx = document.getElementById('fasilitas-chart').getContext('2d');
      
      // Destroy previous chart if exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Baru', 'Diproses', 'Selesai'],
          datasets: [{
            data: [statusCounts.baru, statusCounts.diproses, statusCounts.selesai],
            backgroundColor: ['#ff6384', '#ffcd56', '#4bc0c0']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading chart:', error);
    }
  }

  async function loadFasilitas() {
    const tbody = document.querySelector('#fasilitas-table tbody');
    tbody.innerHTML = '';

    try {
      const fasilitasRef = ref(database, 'fasilitasReports');
      const snapshot = await get(fasilitasRef);
      
      let reports = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          reports.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }

      // Search
      const searchTerm = document.getElementById('search-fasilitas').value.toLowerCase();
      if (searchTerm) {
        reports = reports.filter(r => 
          r.nama.toLowerCase().includes(searchTerm) ||
          r.kelas.toLowerCase().includes(searchTerm) ||
          r.lokasi.toLowerCase().includes(searchTerm)
        );
      }

      // Sort
      const sortBy = document.getElementById('sort-fasilitas').value;
      if (sortBy) {
        reports.sort((a, b) => {
          if (sortBy === 'nama') return a.nama.localeCompare(b.nama);
          if (sortBy === 'tanggal') return new Date(a.tanggal) - new Date(b.tanggal);
          if (sortBy === 'status') return a.status.localeCompare(b.status);
        });
      }

      reports.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.nama}</td>
          <td>${item.kelas}</td>
          <td>${item.lokasi}</td>
          <td>${item.kategori || 'N/A'}</td>
          <td><span class="badge bg-${item.prioritas === 'tinggi' ? 'danger' : item.prioritas === 'sedang' ? 'warning' : 'success'}">${item.prioritas || 'rendah'}</span></td>
          <td>${item.deskripsi}</td>
          <td><img src="${item.foto}" alt="Foto Fasilitas" style="width: 50px; cursor: pointer;" onclick="showImageModal('${item.foto}')"></td>
          <td><span class="badge bg-${item.status === 'selesai' ? 'success' : item.status === 'diproses' ? 'warning' : 'secondary'}">${item.status}</span></td>
          <td>${item.tanggal}</td>
          <td>
            <select class="form-select form-select-sm" onchange="updateStatus('${item.id}', this.value)">
              <option value="baru" ${item.status === 'baru' ? 'selected' : ''}>Baru</option>
              <option value="diproses" ${item.status === 'diproses' ? 'selected' : ''}>Diproses</option>
              <option value="selesai" ${item.status === 'selesai' ? 'selected' : ''}>Selesai</option>
            </select>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error loading fasilitas:', error);
    }
  }

  async function loadPiket() {
    const tbody = document.querySelector('#piket-table tbody');
    tbody.innerHTML = '';

    try {
      const piketRef = ref(database, 'piketReports');
      const snapshot = await get(piketRef);
      
      let reports = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          reports.push(childSnapshot.val());
        });
      }

      // Search
      const searchTerm = document.getElementById('search-piket').value.toLowerCase();
      if (searchTerm) {
        reports = reports.filter(r =>
          r.nama.toLowerCase().includes(searchTerm) ||
          r.kelas.toLowerCase().includes(searchTerm)
        );
      }

      // Sort
      const sortBy = document.getElementById('sort-piket').value;
      if (sortBy) {
        reports.sort((a, b) => {
          if (sortBy === 'nama') return a.nama.localeCompare(b.nama);
          if (sortBy === 'tanggal') return new Date(a.tanggal) - new Date(b.tanggal);
        });
      }

      reports.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.nama}</td>
          <td>${item.kelas}</td>
          <td>${item.tanggal}</td>
          <td><img src="${item.foto}" alt="Foto Piket" style="width: 50px; cursor: pointer;" onclick="showImageModal('${item.foto}')"></td>
          <td>${item.waktu}</td>
        `;
        tbody.appendChild(row);
      });

      // Load class list
      loadClassList(reports);
    } catch (error) {
      console.error('Error loading piket:', error);
    }
  }

  async function loadClassList(piketReports) {
    const classListDiv = document.getElementById('class-list');
    classListDiv.innerHTML = '';

    const allClasses = [
      'X TKJ 1', 'X TKJ 2', 'X TKJ 3',
      'XI TKJ 1', 'XI TKJ 2', 'XI TKJ 3',
      'XII TKJ 1', 'XII TKJ 2', 'XII TKJ 3',
      'X TSM 1', 'X TSM 2', 'X TSM 3',
      'XI TSM 1', 'XI TSM 2', 'XI TSM 3',
      'XII TSM 1', 'XII TSM 2', 'XII TSM 3',
      'X AKL 1', 'X AKL 2', 'X AKL 3',
      'XI AKL 1', 'XI AKL 2', 'XI AKL 3',
      'XII AKL 1', 'XII AKL 2', 'XII AKL 3',
      'X MP 1', 'X MP 2', 'XI MP 1',
      'XI MP 2', 'XII MP 1', 'XII MP 2',
      'X LPS 1', 'X LPS 2', 'XI LPS 1',
      'XI LPS 2', 'XII LPS 1', 'XII LPS2'
    ];

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    allClasses.forEach(kelas => {
      const hasSubmitted = piketReports.some(r => r.kelas === kelas && r.tanggal === today);
      const col = document.createElement('div');
      col.className = 'col-md-3 mb-2';
      col.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="check-${kelas.replace(/\s+/g, '-')}" ${hasSubmitted ? 'checked' : ''} disabled>
          <label class="form-check-label" for="check-${kelas.replace(/\s+/g, '-')}">
            ${kelas}
          </label>
        </div>
      `;
      classListDiv.appendChild(col);
    });
  }

  window.updateStatus = async (id, status) => {
    try {
      const reportRef = ref(database, 'fasilitasReports/' + id);
      const snapshot = await get(reportRef);
      
      if (snapshot.exists()) {
        const report = snapshot.val();
        report.status = status;
        await set(reportRef, report);
        
        Toast.fire({
          icon: "success",
          title: "Status berhasil diperbarui!"
        });
        loadFasilitas();
        loadStatistics();
        loadChart();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Gagal memperbarui status!', 'danger');
    }
  };

  async function loadStudents() {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';

    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const student = childSnapshot.val();
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${student.username}</td>
            <td>${student.nisn || 'N/A'}</td>
            <td>${student.nama || 'N/A'}</td>
            <td>${student.kelas}</td>
            <td>${student.phone || 'N/A'}</td>
            <td>
              <button class="btn btn-sm btn-warning me-2" onclick="editStudent('${student.username}')"><i class="bi bi-pencil"></i> Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.username}')"><i class="bi bi-trash"></i> Hapus</button>
            </td>
          `;
          tbody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  window.editStudent = async (username) => {
    originalUsername = username;
    try {
      const userRef = ref(database, 'users/' + username);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const student = snapshot.val();
        document.getElementById('edit-student-username').value = student.username;
        document.getElementById('edit-student-username').readOnly = false;
        document.getElementById('edit-student-password').value = '';
        document.getElementById('edit-student-password').dataset.oldPassword = student.password;
        document.getElementById('edit-student-nisn').value = student.nisn || '';
        document.getElementById('edit-student-nama').value = student.nama || '';
        document.getElementById('edit-student-kelas').value = student.kelas;
        document.getElementById('edit-student-phone').value = student.phone || '';
        const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
        modal.show();
      }
    } catch (error) {
      console.error('Error loading student for edit:', error);
      showToast('Gagal memuat data siswa!', 'danger');
    }
  };

  window.deleteStudent = (username) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data siswa akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userRef = ref(database, 'users/' + username);
          await remove(userRef);
          Swal.fire('Terhapus!', 'Siswa berhasil dihapus.', 'success');
          loadStudents();
          loadStatistics();
        } catch (error) {
          console.error('Error deleting student:', error);
          Swal.fire('Error!', 'Gagal menghapus siswa.', 'error');
        }
      }
    });
  };

  window.showImageModal = (src) => {
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    document.getElementById('modalImage').src = src;
    modal.show();
  };

  async function exportToHTMLTable(storeName, filename) {
    try {
      const dataRef = ref(database, storeName);
      const snapshot = await get(dataRef);
      
      let data = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          data.push(childSnapshot.val());
        });
      }

      if (data.length === 0) {
        showToast('Tidak ada data untuk diekspor!', 'warning');
        return;
      }

      const htmlContent = convertToHTMLTable(data, storeName);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      Toast.fire({
        icon: "success",
        title: "Data berhasil diekspor!"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Gagal mengekspor data!', 'danger');
    }
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
});

