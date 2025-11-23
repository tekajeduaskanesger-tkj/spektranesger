// admin.js — Firebase Version + Login cuma password

let chartInstance = null;

function showToast(msg, type = 'success') {
  document.getElementById('toast-message').textContent = msg;
  const toast = document.getElementById('toast');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  new bootstrap.Toast(toast).show();
}

// Ganti password di sini aja kalau mau ubah
const ADMIN_PASSWORD = "admin123";

document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  document.getElementById('toggle-theme').checked = savedTheme === 'dark';
  document.getElementById('toggle-theme').addEventListener('change', e => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  });

  // Toggle password visibility
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

  // Login admin (cuma password)
  document.getElementById('admin-login-form').addEventListener('submit', e => {
    e.preventDefault();
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
      localStorage.setItem('adminLoggedIn', 'true');
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      loadAllData();
      showToast('Login admin berhasil!', 'success');
    } else {
      showToast('Password salah!', 'danger');
    }
  });

  // Cek sudah login belum
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

  // Load semua data realtime
  function loadAllData() {
    loadLaporanFasilitas();
    loadAbsensiPiket();
    loadDaftarSiswa();
    updateChart();
  }

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
          <td><button class="btn btn-sm btn-danger hapus" data-key="${key}" data-type="laporan_fasilitas">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      attachEventListeners();
    });
  }

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
          <td><button class="btn btn-sm btn-danger hapus" data-key="${key}" data-type="absensi_piket">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
      attachEventListeners();
    });
  }

  function loadDaftarSiswa() {
    firebase.database().ref('users').on('value', snap => {
      const tbody = document.querySelector('#siswa-table tbody');
      tbody.innerHTML = '';
      snap.forEach(child => {
        const user = child.val();
        if (user.username && user.username !== 'admin') {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.nama || '-'}</td>
            <td>${user.kelas || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning edit-siswa" data-username="${user.username}">Edit</button>
              <button class="btn btn-sm btn-danger hapus-siswa" data-username="${user.username}">Hapus</button>
            </td>
          `;
          tbody.appendChild(row);
        }
      });
      attachEventListeners();
    });
  }

  function attachEventListeners() {
    // Lihat gambar
    document.querySelectorAll('.view-img').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('modalImage').src = btn.dataset.url;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
      };
    });

    // Ubah status
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.onchange = () => {
        firebase.database().ref('laporan_fasilitas/' + sel.dataset.key).update({ status: sel.value });
      };
    });

    // Hapus laporan/absensi
    document.querySelectorAll('.hapus').forEach(btn => {
      btn.onclick = () => {
        Swal.fire({
          title: 'Yakin hapus data ini?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, hapus!'
        }).then(res => {
          if (res.isConfirmed) {
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

  // Tambah siswa
  document.getElementById('tambah-siswa').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Tambah Siswa Baru';
    document.getElementById('form-siswa').reset();
    document.getElementById('username').readOnly = false;
    new bootstrap.Modal(document.getElementById('siswaModal')).show();
  });

  // Simpan siswa
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
      const user = snap.val();
      document.getElementById('modalTitle').textContent = 'Edit Siswa';
      document.getElementById('username').value = user.username;
      document.getElementById('username').readOnly = true;
      document.getElementById('password').value = user.password;
      document.getElementById('nama').value = user.nama;
      document.getElementById('kelas').value = user.kelas;
      document.getElementById('phone').value = user.phone || '';
      new bootstrap.Modal(document.getElementById('siswaModal')).show();
    });
  }

  // Export
  document.getElementById('export-laporan').addEventListener('click', () => exportToHTML('laporan_fasilitas', 'Laporan_Fasilitas_Rusak.html'));
  document.getElementById('export-piket').addEventListener('click', () => exportToHTML('absensi_piket', 'Absensi_Piket.html'));

  function exportToHTML(ref, filename) {
    firebase.database().ref(ref).once('value').then(snap => {
      const data = [];
      snap.forEach(child => data.push(child.val()));
      const html = generateHTMLTable(data, ref);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
    });
  }

  function generateHTMLTable(data, title) {
    // (sama seperti sebelumnya, terlalu panjang → tetap pakai fungsi yang sudah ada di versi lama)
    // Untuk hemat tempat, kamu bisa copy dari admin.js lama bagian convertToHTMLTable
    // Atau pakai yang ini (singkat):
    let rows = data.map(d => `<tr>${Object.values(d).map(v => v?.includes?.('firebasestorage') ? `<td><img src="${v}" width="100"></td>` : `<td>${v || ''}</td>`).join('')}</tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f0f0f0}</style></head><body><h1>${title}</h1><table><tr>${Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join('')}</tr>${rows}</table></body></html>`;
  }

  // Chart
  function updateChart() {
    firebase.database().ref('laporan_fasilitas').once('value').then(snap => {
      const count = { baru: 0, diproses: 0, selesai: 0 };
      snap.forEach(child => {
        const status = child.val().status || 'baru';
        count[status]++;
      });
      const ctx = document.getElementById('statusChart').getContext('2d');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Baru', 'Diproses', 'Selesai'],
          datasets: [{
            data: [count.baru, count.diproses, count.selesai],
            backgroundColor: ['#dc3545', '#ffc107', '#28a745']
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    });
  }
});
