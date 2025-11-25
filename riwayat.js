// Firebase Setup
import { database } from './firebase-config.js';
import { ref, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Format date to Indonesian format
function formatDateID(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

  // Load completed reports
  await loadCompletedReports();

  // Search and filter listeners
  document.getElementById('search-history').addEventListener('input', () => loadCompletedReports());
  document.getElementById('filter-prioritas').addEventListener('change', () => loadCompletedReports());
  document.getElementById('sort-history').addEventListener('change', () => loadCompletedReports());

  // Export button
  document.getElementById('export-history').addEventListener('click', () => exportHistory());
});

async function loadCompletedReports() {
  const tbody = document.querySelector('#history-table tbody');
  tbody.innerHTML = '';

  try {
    const fasilitasRef = ref(database, 'fasilitasReports');
    const snapshot = await get(fasilitasRef);
    
    let completedReports = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const report = childSnapshot.val();
        // Only get reports with status 'selesai'
        if (report.status === 'selesai') {
          completedReports.push({
            id: childSnapshot.key,
            ...report
          });
        }
      });
    }

    // Calculate statistics
    updateStatistics(completedReports);

    // Search filter
    const searchTerm = document.getElementById('search-history').value.toLowerCase();
    if (searchTerm) {
      completedReports = completedReports.filter(r => 
        r.nama.toLowerCase().includes(searchTerm) ||
        r.kelas.toLowerCase().includes(searchTerm) ||
        r.lokasi.toLowerCase().includes(searchTerm) ||
        r.kategori.toLowerCase().includes(searchTerm)
      );
    }

    // Prioritas filter
    const prioritasFilter = document.getElementById('filter-prioritas').value;
    if (prioritasFilter) {
      completedReports = completedReports.filter(r => r.prioritas === prioritasFilter);
    }

    // Sort
    const sortBy = document.getElementById('sort-history').value;
    if (sortBy) {
      completedReports.sort((a, b) => {
        if (sortBy === 'tanggal') return new Date(b.tanggal) - new Date(a.tanggal);
        if (sortBy === 'selesai') return new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
        if (sortBy === 'nama') return a.nama.localeCompare(b.nama);
      });
    } else {
      // Default sort by completion date (newest first)
      completedReports.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    }

    // Display reports
    completedReports.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.nama}</td>
        <td>${item.kelas}</td>
        <td>${item.lokasi}</td>
        <td>${item.kategori || 'N/A'}</td>
        <td><span class="badge bg-${item.prioritas === 'tinggi' ? 'danger' : item.prioritas === 'sedang' ? 'warning' : 'success'}">${item.prioritas || 'rendah'}</span></td>
        <td>${item.deskripsi}</td>
        <td><img src="${item.foto}" alt="Foto Fasilitas" style="width: 50px; cursor: pointer;" onclick="showImageModal('${item.foto}')"></td>
        <td>${item.tanggal}</td>
        <td>${formatDateID(item.completedAt)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteReport('${item.id}', '${item.nama}')">
            <i class="bi bi-trash"></i> Hapus
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    if (completedReports.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Tidak ada laporan selesai</td></tr>';
    }
  } catch (error) {
    console.error('Error loading completed reports:', error);
    showToast('Gagal memuat riwayat!', 'danger');
  }
}

function updateStatistics(reports) {
  // Total completed
  document.getElementById('total-completed').textContent = reports.length;

  // Get current date info
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count completed this week
  const completedThisWeek = reports.filter(r => {
    if (!r.completedAt) return false;
    const completedDate = new Date(r.completedAt);
    return completedDate >= startOfWeek;
  }).length;

  // Count completed this month
  const completedThisMonth = reports.filter(r => {
    if (!r.completedAt) return false;
    const completedDate = new Date(r.completedAt);
    return completedDate >= startOfMonth;
  }).length;

  document.getElementById('completed-week').textContent = completedThisWeek;
  document.getElementById('completed-month').textContent = completedThisMonth;
}

window.showImageModal = (src) => {
  const modal = new bootstrap.Modal(document.getElementById('imageModal'));
  document.getElementById('modalImage').src = src;
  modal.show();
};

window.deleteReport = (id, nama) => {
  Swal.fire({
    title: 'Hapus dari riwayat?',
    text: `Laporan dari "${nama}" akan dihapus permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const reportRef = ref(database, 'fasilitasReports/' + id);
        await remove(reportRef);
        
        Toast.fire({
          icon: "success",
          title: "Laporan berhasil dihapus dari riwayat!"
        });
        
        loadCompletedReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        Swal.fire('Error!', 'Gagal menghapus laporan.', 'error');
      }
    }
  });
};

async function exportHistory() {
  try {
    const fasilitasRef = ref(database, 'fasilitasReports');
    const snapshot = await get(fasilitasRef);
    
    let completedReports = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const report = childSnapshot.val();
        if (report.status === 'selesai') {
          completedReports.push(report);
        }
      });
    }

    if (completedReports.length === 0) {
      showToast('Tidak ada data untuk diekspor!', 'warning');
      return;
    }

    const htmlContent = generateHTMLExport(completedReports);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'riwayat-laporan-selesai.html');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    Toast.fire({
      icon: "success",
      title: "Riwayat berhasil diekspor!"
    });
  } catch (error) {
    console.error('Error exporting history:', error);
    showToast('Gagal mengekspor data!', 'danger');
  }
}

function generateHTMLExport(data) {
  if (data.length === 0) return '';
  
  let html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Laporan Selesai - SMK Negeri 1 Geger</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #28a745;
            color: white;
            border-radius: 10px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #28a745;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        img { 
            max-width: 100px; 
            max-height: 100px;
            border-radius: 5px;
        }
        .badge {
            padding: 5px 10px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
        }
        .badge-danger { background-color: #dc3545; }
        .badge-warning { background-color: #ffc107; color: #000; }
        .badge-success { background-color: #28a745; }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Riwayat Laporan Selesai</h1>
        <p>SMK Negeri 1 Geger - Sistem Pelaporan Fasilitas</p>
        <p>Diekspor pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    <p><strong>Total Laporan Selesai:</strong> ${data.length}</p>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Pelapor</th>
                <th>Kelas</th>
                <th>Lokasi</th>
                <th>Kategori</th>
                <th>Prioritas</th>
                <th>Deskripsi</th>
                <th>Foto</th>
                <th>Tanggal Laporan</th>
                <th>Tanggal Selesai</th>
            </tr>
        </thead>
        <tbody>`;
  
  data.forEach((report, index) => {
    const prioritasClass = report.prioritas === 'tinggi' ? 'badge-danger' : 
                           report.prioritas === 'sedang' ? 'badge-warning' : 'badge-success';
    html += `
            <tr>
                <td>${index + 1}</td>
                <td>${report.nama}</td>
                <td>${report.kelas}</td>
                <td>${report.lokasi}</td>
                <td>${report.kategori || 'N/A'}</td>
                <td><span class="badge ${prioritasClass}">${report.prioritas || 'rendah'}</span></td>
                <td>${report.deskripsi}</td>
                <td><img src="${report.foto}" alt="Foto"></td>
                <td>${report.tanggal}</td>
                <td>${formatDateID(report.completedAt)}</td>
            </tr>`;
  });
  
  html += `
        </tbody>
    </table>
    <div class="footer">
        <p>© 2024 SMK Negeri 1 Geger - SPEKTRANESGER</p>
        <p>Dokumen ini digenerate secara otomatis dari sistem pelaporan fasilitas</p>
    </div>
</body>
</html>`;
  
  return html;
}
