// admin.js — VERSI FINAL YANG BENAR-BENAR SESUAI DENGAN YANG KAMU KIRIM DARI AWAL

const ADMIN_PASSWORD = "admin123"; // GANTI DI SINI SAJA KALAU MAU UBAH PASSWORD!!

let chartInstance = null;

function showToast(msg, type = 'success') {
  document.getElementById('toast-message').textContent = msg;
  const toast = document.getElementById('toast');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  new bootstrap.Toast(toast).show();
}

document.addEventListener('DOMContentLoaded', () => {

  // Toggle show password
  document.getElementById('toggle-admin-password').addEventListener('click', () => {
    const input = document.getElementById('admin-password');
    const icon = document.getElementById('toggle-admin-password');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
  });

  // Login admin — CUMA PASSWORD
  document.getElementById('admin-login-form').addEventListener('submit', e => {
    e.preventDefault();
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadAllData();
      showToast('Login berhasil!', 'success');
    } else {
      showToast('Password salah!', 'danger');
      document.getElementById('admin-password').value = '';
    }
  });

  if (localStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    loadAllData();
  }

  // Tab switching
  document.querySelectorAll('#adminTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminTabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-laporan').style.display = 'none';
      document.getElementById('tab-piket').style.display = 'none';
      document.getElementById('tab-siswa').style.display = 'none';
      document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
    });
  });

  function loadAllData() {
    loadLaporanFasilitas();
    loadAbsensiPiket();
    loadDaftarSiswa();
    updateChart();
  }

  // ==================== LAPORAN FASILITAS ====================
  function loadLaporanFasilitas() {
    firebase.database().ref('laporan_fasilitas').on('value', snap => {
      const tbody = document.querySelector('#fasilitas-table tbody');
      tbody.innerHTML = '';
      snap.forEach(child => {
        const d = child.val();
        const key = child.key;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${d.nama}</td>
          <td>${d.kelas || '-'}</td>
          <td>${d.lokasi}</td>
          <td>${d.kategori}</td>
          <td><span class="badge bg-${d.prioritas === 'tinggi' ? 'danger' : d.prioritas === 'sedang' ? 'warning' : 'secondary'}">${d.prioritas}</span></td>
          <td>
            <select class="form-select form-select-sm status-select" data-key="${key}">
              <option value="baru" ${d.status === 'baru' ? 'selected' : ''}>Baru</option>
              <option value="diproses" ${d.status === 'diproses' ? 'selected' : ''}>Diproses</option>
              <option value="selesai" ${d.status === 'selesai' ? 'selected' : ''}>Selesai</option>
            </select>
          </td>
          <td><button class="btn btn-sm btn-info view-img" data-url="${d.foto}">Lihat</button></td>
          <td>${d.tanggal}</td>
          <td><button class="btn btn-sm btn-danger hapus" data-type="laporan_fasilitas" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      attachEvents();
    });
  }

  // ==================== ABSENSI PIKET ====================
  function loadAbsensiPiket() {
    firebase.database().ref('absensi_piket').on('value', snap => {
      const tbody = document.querySelector('#piket-table tbody');
      tbody.innerHTML = '';
      snap.forEach(child => {
        const d = child.val();
        const key = child.key;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${d.nama}</td>
          <td>${d.kelas || '-'}</td>
          <td>${d.tanggal}</td>
          <td>${d.waktu}</td>
          <td><button class="btn btn-sm btn-info view-img" data-url="${d.foto}">Lihat</button></td>
          <td><button class="btn btn-sm btn-danger hapus" data-type="absensi_piket" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      attachEvents();
    });
  }

  // ==================== DAFTAR SISWA ====================
  function loadDaftarSiswa() {
    firebase.database().ref('users').on('value', snap => {
      const tbody = document.querySelector('#siswa-table tbody');
      tbody.innerHTML = '';
      snap.forEach(child => {
        const u = child.val();
        if (u.username && u.username !== 'admin') {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${u.username}</td>
            <td>${u.nama || '-'}</td>
            <td>${u.kelas || '-'}</td>
            <td>${u.phone || '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning edit-siswa" data-username="${u.username}">Edit</button>
              <button class="btn btn-sm btn-danger hapus-siswa" data-username="${u.username}">Hapus</button>
            </td>
          `;
          tbody.appendChild(row);
        }
      });
      attachEvents();
    });
  }

  // ==================== EVENT LISTENERS ====================
  function attachEvents() {
    // Lihat foto
    document.querySelectorAll('.view-img').forEach(b => {
      b.onclick = () => {
        document.getElementById('modalImage').src = b.dataset.url;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
      };
    });

    // Ubah status
    document.querySelectorAll('.status-select').forEach(s => {
      s.onchange = () => {
        firebase.database().ref('laporan_fasilitas/' + s.dataset.key).update({ status: s.value });
        showToast('Status diperbarui!');
      };
    });

    // Hapus
    document.querySelectorAll('.hapus').forEach(b => {
      b.onclick = () => {
        Swal.fire({ title: 'Yakin hapus?', icon: 'warning', showCancelButton: true }).then(r => {
          if (r.isConfirmed) {
            firebase.database().ref(b.dataset.type + '/' + b.dataset.key).remove();
            showToast('Data dihapus!');
          }
        });
      };
    });

    // Edit & Hapus siswa
    document.querySelectorAll('.edit-siswa').forEach(b => b.onclick = () => editSiswa(b.dataset.username));
    document.querySelectorAll('.hapus-siswa').forEach(b => {
      b.onclick = () => {
        Swal.fire({ title: 'Hapus siswa ini?', icon: 'warning', showCancelButton: true }).then(r => {
          if (r.isConfirmed) {
            firebase.database().ref('users/' + b.dataset.username).remove();
            showToast('Siswa dihapus!');
          }
        });
      };
    });
  }

  // ==================== TAMBAH / EDIT SISWA ====================
  document.getElementById('tambah-siswa').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Tambah Siswa Baru';
    document.getElementById('form-siswa').reset();
    document.getElementById('username').readOnly = false;
    new bootstrap.Modal(document.getElementById('siswaModal')).show();
  });

  document.getElementById('form-siswa').addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const data = {
      username,
      password: document.getElementById('password').value,
      nama: document.getElementById('nama').value,
      kelas: document.getElementById('kelas').value,
      phone: document.getElementById('phone').value || ''
    };
    firebase.database().ref('users/' + username).set(data).then(() => {
      showToast('Siswa berhasil disimpan!');
      bootstrap.Modal.getInstance(document.getElementById('siswaModal')).hide();
    });
  });

  function editSiswa(username) {
    firebase.database().ref('users/' + username).once('value').then(snap => {
      const u = snap.val();
      document.getElementById('modalTitle').textContent = 'Edit Siswa';
      document.getElementById('username').value = u.username;
      document.getElementById('username').readOnly = true;
      document.getElementById('password').value = u.password;
      document.getElementById('nama').value = u.nama;
      document.getElementById('kelas').value = u.kelas;
      document.getElementById('phone').value = u.phone || '';
      new bootstrap.Modal(document.getElementById('siswaModal')).show();
    });
  }

  // ==================== EXPORT HTML ====================
  document.getElementById('export-laporan').onclick = () => exportToHTML('laporan_fasilitas', 'Laporan_Fasilitas.html');
  document.getElementById('export-piket').onclick = () => exportToHTML('absensi_piket', 'Absensi_Piket.html');

  function exportToHTML(ref, filename) {
    firebase.database().ref(ref).once('value').then(snap => {
      const data = [];
      snap.forEach(c => data.push(c.val()));
      const headers = Object.keys(data[0] || {});
      let rows = data.map(row => `<tr>${headers.map(h => {
        const val = row[h] || '';
        return val.includes('firebasestorage') ? `<td><img src="${val}" width="120"></td>` : `<td>${val}</td>`;
      }).join('')}</tr>`).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #000;padding:8px;}th{background:#333;color:#fff;}</style></head><body><h1>${filename}</h1><table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rows}</table></body></html>`;
      const blob = new Blob([html], {type: 'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
    });
  }

  // ==================== CHART ====================
  function updateChart() {
    firebase.database().ref('laporan_fasilitas').once('value').then(snap => {
      const count = { baru: 0, diproses: 0, selesai: 0 };
      snap.forEach(c => count[c.val().status || 'baru']++);
      const ctx = document.getElementById('statusChart').getContext('2d');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Baru', 'Diproses', 'Selesai'],
          datasets: [{ data: [count.baru, count.diproses, count.selesai], backgroundColor: ['#dc3545', '#ffc107', '#28a745'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    });
  }
});
