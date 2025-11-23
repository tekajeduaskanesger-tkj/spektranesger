// admin.js — VERSI FINAL 100% SESUAI PERMINTAANMU
// Login cuma password | Semua data realtime Firebase | Bisa dari device lain

const ADMIN_PASSWORD = "admin123";  // GANTI DI SINI AJA KALAU MAU UBAH PASSWORD!!

let chartInstance = null;

function showToast(msg, type = 'success') {
  const toastEl = document.getElementById('liveToast') || createToastElement();
  document.getElementById('toast-body').textContent = msg;
  toastEl.className = `toast align-items-center text-bg-${type === 'danger' ? 'danger' : 'success'} border-0`;
  new bootstrap.Toast(toastEl).show();
}

function createToastElement() {
  const div = document.createElement('div');
  div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
  div.innerHTML = `
    <div id="liveToast" class="toast" role="alert">
      <div class="toast-header">
        <strong class="me-auto">Notifikasi</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body" id="toast-body"></div>
    </div>
  `;
  document.body.appendChild(div);
  return document.getElementById('liveToast');
}

document.addEventListener('DOMContentLoaded', () => {

  // Toggle show/hide password
  document.getElementById('toggle-admin-password').addEventListener('click', () => {
    const pass = document.getElementById('admin-password');
    const icon = document.getElementById('toggle-admin-password');
    if (pass.type === 'password') {
      pass.type = 'text';
      icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
      pass.type = 'password';
      icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
  });

  // LOGIN ADMIN — CUMA PASSWORD DOANG
  document.getElementById('admin-login-form').addEventListener('submit', e => {
    e.preventDefault();
    const inputPass = document.getElementById('admin-password').value;
    if (inputPass === ADMIN_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadAllData();
      showToast('Login admin berhasil!', 'success');
    } else {
      showToast('Password salah!', 'danger');
      document.getElementById('admin-password').value = '';
    }
  });

  // Auto login kalau sudah pernah masuk
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
    firebase.database().ref('laporan_fasilitas').on('value', snapshot => {
      const tbody = document.querySelector('#fasilitas-table tbody');
      tbody.innerHTML = '';
      snapshot.forEach(child => {
        const data = child.val();
        const key = child.key;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${data.nama || '-'}</td>
          <td>${data.kelas || '-'}</td>
          <td>${data.lokasi}</td>
          <td>${data.kategori}</td>
          <td><span class="badge bg-${data.prioritas === 'tinggi' ? 'danger' : data.prioritas === 'sedang' ? 'warning' : 'info'}">${data.prioritas}</span></td>
          <td>
            <select class="form-select form-select-sm status-select" data-key="${key}">
              <option value="baru" ${data.status === 'baru' ? 'selected' : ''}>Baru</option>
              <option value="diproses" ${data.status === 'diproses' ? 'selected' : ''}>Diproses</option>
              <option value="selesai" ${data.status === 'selesai' ? 'selected' : ''}>Selesai</option>
            </select>
          </td>
          <td><button class="btn btn-sm btn-info view-img" data-url="${data.foto}">Lihat</button></td>
          <td>${data.tanggal}</td>
          <td><button class="btn btn-sm btn-danger hapus" data-type="laporan_fasilitas" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
      attachEventListeners();
    });
  }

  // ==================== ABSENSI PIKET ====================
  function loadAbsensiPiket() {
    firebase.database().ref('absensi_piket').on('value', snapshot => {
      const tbody = document.querySelector('#piket-table tbody');
      tbody.innerHTML = '';
      snapshot.forEach(child => {
        const data = child.val();
        const key = child.key;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${data.nama || '-'}</td>
          <td>${data.kelas || '-'}</td>
          <td>${data.tanggal}</td>
          <td>${data.waktu}</td>
          <td><button class="btn btn-sm btn-info view-img" data-url="${data.foto}">Lihat</button></td>
          <td><button class="btn btn-sm btn-danger hapus" data-type="absensi_piket" data-key="${key}">Hapus</button></td>
        `;
        tbody.appendChild(tr);
      });
      attachEventListeners();
    });
  }

  // ==================== DAFTAR SISWA ====================
  function loadDaftarSiswa() {
    firebase.database().ref('users').on('value', snapshot => {
      const tbody = document.querySelector('#siswa-table tbody');
      tbody.innerHTML = '';
      snapshot.forEach(child => {
        const user = child.val();
        if (user.username && user.username !== 'admin') {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.nama || '-'}</td>
            <td>${user.kelas || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning edit-siswa" data-username="${user.username}">Edit</button>
              <button class="btn btn-sm btn-danger hapus-siswa" data-username="${user.username}">Hapus</button>
            </td>
          `;
          tbody.appendChild(tr);
        }
      });
      attachEventListeners();
    });
  }

  // ==================== EVENT LISTENERS ====================
  function attachEventListeners() {
    // Lihat foto besar
    document.querySelectorAll('.view-img').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('modalImage').src = btn.dataset.url;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
      };
    });

    // Ubah status laporan
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.onchange = () => {
        firebase.database().ref('laporan_fasilitas/' + sel.dataset.key).update({ status: sel.value });
        showToast('Status diperbarui!');
      };
    });

    // Hapus data
    document.querySelectorAll('.hapus').forEach(btn => {
      btn.onclick = () => {
        Swal.fire({
          title: 'Yakin hapus?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, hapus!'
        }).then(result => {
          if (result.isConfirmed) {
            firebase.database().ref(btn.dataset.type + '/' + btn.dataset.key).remove();
            showToast('Data dihapus!');
          }
        });
      };
    });

    // Edit & Hapus siswa
    document.querySelectorAll('.edit-siswa').forEach(btn => {
      btn.onclick = () => editSiswa(btn.dataset.username);
    });
    document.querySelectorAll('.hapus-siswa').forEach(btn => {
      btn.onclick = () => {
        Swal.fire({
          title: 'Hapus siswa ini?',
          icon: 'warning',
          showCancelButton: true
        }).then(res => {
          if (res.isConfirmed) {
            firebase.database().ref('users/' + btn.dataset.username).remove();
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
  document.getElementById('export-laporan').addEventListener('click', () => exportHTML('laporan_fasilitas', 'Laporan_Fasilitas.html'));
  document.getElementById('export-piket').addEventListener('click', () => exportHTML('absensi_piket', 'Absensi_Piket.html'));

  function exportHTML(ref, filename) {
    firebase.database().ref(ref).once('value').then(snap => {
      const data = [];
      snap.forEach(c => data.push(c.val()));
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f0f0f0;}</style></head><body><h1>${filename}</h1><table><thead><tr>${Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(row => `<tr>${Object.values(row).map(v => v && v.includes('firebasestorage') ? `<td><img src="${v}" width="150"></td>` : `<td>${v || ''}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
    });
  }

  // ==================== CHART ====================
  function updateChart() {
    firebase.database().ref('laporan_fasilitas').once('value').then(snap => {
      const count = { baru: 0, diproses: 0, selesai: 0 };
      snap.forEach(child => count[child.val().status || 'baru']++);
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

// TAMBAH MODAL INI DI admin.html (kalau belum ada)
const modalHTML = `
<div class="modal fade" id="siswaModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="modalTitle">Tambah Siswa</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <form id="form-siswa">
          <div class="mb-3"><label>Username (NISN)</label><input type="text" class="form-control" id="username" required></div>
          <div class="mb-3"><label>Password</label><input type="password" class="form-control" id="password" required></div>
          <div class="mb-3"><label>Nama Lengkap</label><input type="text" class="form-control" id="nama" required></div>
          <div class="mb-3"><label>Kelas</label><select class="form-select" id="kelas" required>${[...Array(9)].map((_,i)=>`<option value="X TKJ ${i+1}">X TKJ ${i+1}</option><option value="XI TKJ ${i+1}">XI TKJ ${i+1}</option><option value="XII TKJ ${i+1}">XII TKJ ${i+1}</option>`).join('').slice(0,-28)}</select></div>
          <div class="mb-3"><label>No HP (opsional)</label><input type="tel" class="form-control" id="phone"></div>
          <button type="submit" class="btn btn-primary w-100">Simpan</button>
        </form>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="imageModal" tabindex="-1">
  <div class="modal-dialog modal-lg"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Bukti Foto</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body text-center"><img id="modalImage" src="" class="img-fluid rounded" alt="Foto"></div>
  </div></div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);
