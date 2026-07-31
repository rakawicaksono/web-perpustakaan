// ===== LIBRARYOS v2.0 — SMAN 15 Kota Tangerang =====

// ===== DATABASE INIT =====

const DEFAULT_BOOKS = [
  { id: 1, judul: "Matematika Diskrit", pengarang: "Rinaldi Munir", kategori: "Referensi Akademik", stok: 5, cover: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&q=80" },
  { id: 2, judul: "Sejarah Dunia Modern", pengarang: "J.M. Roberts", kategori: "Ilmu Sosial", stok: 2, cover: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&q=80" },
  { id: 3, judul: "Pemrograman Web Dasar", pengarang: "Romi Satria Wahono", kategori: "Teknologi", stok: 8, cover: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80" },
  { id: 4, judul: "Fisika Kuantum Dasar", pengarang: "Yohanes Surya", kategori: "Sains", stok: 3, cover: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80" },
  { id: 5, judul: "Laskar Pelangi", pengarang: "Andrea Hirata", kategori: "Fiksi", stok: 3, cover: "https://mojokstore.com/wp-content/uploads/2019/07/Laskar-Pelangi-600x890.jpg" },
  { id: 6, judul: "Algoritma dan Pemrograman", pengarang: "Thomas H. Cormen", kategori: "Teknologi", stok: 4, cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80" },
  { id: 7, judul: "Bumi Manusia", pengarang: "Pramoedya Ananta Toer", kategori: "Fiksi", stok: 2, cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80" },
  { id: 8, judul: "Sosiologi Pendidikan", pengarang: "Nasution", kategori: "Ilmu Sosial", stok: 6, cover: "https://images.unsplash.com/photo-1577896852618-01ed9b2c3c76?w=400&q=80" },
];

const DEFAULT_ADMIN = {
  nis: 'admin', nama: 'Administrator', password: 'admin',
  borrowed: [], role: 'admin', nuptk: 'ADMIN'
};

function initDB() {
  if (!localStorage.getItem('booksDB')) {
    localStorage.setItem('booksDB', JSON.stringify(DEFAULT_BOOKS));
  }
  if (!localStorage.getItem('usersDB')) {
    localStorage.setItem('usersDB', JSON.stringify([DEFAULT_ADMIN]));
  } else {
    let users = JSON.parse(localStorage.getItem('usersDB'));
    const adminExists = users.find(u => u.nis === 'admin');
    if (!adminExists) {
      users.push(DEFAULT_ADMIN);
      localStorage.setItem('usersDB', JSON.stringify(users));
    }
  }
  if (!localStorage.getItem('historyDB')) {
    localStorage.setItem('historyDB', JSON.stringify([]));
  }
}

initDB();

// Setup cover URL extractors after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupCoverUrlExtractor('input-cover-buku');
  setupCoverUrlExtractor('edit-cover');
});
// Also run immediately in case DOM is already loaded
setupCoverUrlExtractor('input-cover-buku');
setupCoverUrlExtractor('edit-cover');

// ===== COVER URL EXTRACTOR (Google Images & other sources) =====
// Extracts direct image URL from Google Images link or passes through direct URLs
function extractImageUrl(input) {
  if (!input) return '';
  input = input.trim();
  try {
    // Handle Google Images URL (contains imgurl= parameter)
    if (input.includes('google.com/imgres') || input.includes('imgurl=')) {
      const url = new URL(input);
      const imgurl = url.searchParams.get('imgurl');
      if (imgurl) return decodeURIComponent(imgurl);
    }
    // Handle Google redirect links
    if (input.includes('google.com/url') || input.includes('gstatic.com')) {
      const url = new URL(input);
      const q = url.searchParams.get('q') || url.searchParams.get('url');
      if (q) return decodeURIComponent(q);
    }
  } catch(e) { /* not a valid URL, use as-is */ }
  return input; // Direct URL (from other sites, etc)
}

// Hook into cover URL inputs to auto-extract on paste/blur
function setupCoverUrlExtractor(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const process = () => {
    const extracted = extractImageUrl(el.value);
    if (extracted !== el.value) {
      el.value = extracted;
      showToast('URL gambar berhasil diekstrak! ✨', 'success');
    }
  };
  el.addEventListener('paste', () => setTimeout(process, 100));
  el.addEventListener('blur', process);
}

// ===== COVER INPUT TAB SWITCHER =====
window.switchCoverTab = function(panelId, btn) {
  const group = btn.closest('.cover-input-group');
  group.querySelectorAll('.cover-tab').forEach(t => t.classList.remove('active'));
  group.querySelectorAll('.cover-tab-panel').forEach(p => p.classList.add('hidden'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.remove('hidden');
};

// ===== FILE TO BASE64 HELPER =====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) { reject(new Error('Ukuran gambar max 2MB')); return; }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

// ===== UPLOAD COVER — TAMBAH BUKU =====
(function setupTambahUpload() {
  let pendingBase64Tambah = '';
  const fileInput = document.getElementById('input-cover-file-tambah');
  const preview = document.getElementById('preview-tambah');
  const zone = document.getElementById('upload-zone-tambah');

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) { showToast('Pilih file gambar!', 'error'); return; }
    try {
      const b64 = await fileToBase64(file);
      pendingBase64Tambah = b64;
      preview.src = b64;
      preview.classList.remove('hidden');
      zone.querySelector('.upload-zone-inner').classList.add('hidden');
    } catch(e) { showToast(e.message, 'error'); }
  }

  fileInput?.addEventListener('change', e => handleFile(e.target.files[0]));
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; });
  zone?.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone?.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; handleFile(e.dataTransfer.files[0]); });

  // expose getter so btn-tambah-buku can read it
  window.getPendingCoverTambah = () => pendingBase64Tambah;
  window.resetCoverTambah = () => {
    pendingBase64Tambah = '';
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (zone) zone.querySelector('.upload-zone-inner')?.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
  };
})();

// ===== UPLOAD COVER — EDIT BUKU =====
(function setupEditUpload() {
  let pendingBase64Edit = '';
  const fileInput = document.getElementById('input-cover-file-edit');
  const preview = document.getElementById('preview-edit');
  const zone = document.getElementById('upload-zone-edit');

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) { showToast('Pilih file gambar!', 'error'); return; }
    try {
      const b64 = await fileToBase64(file);
      pendingBase64Edit = b64;
      preview.src = b64;
      preview.classList.remove('hidden');
      zone.querySelector('.upload-zone-inner').classList.add('hidden');
    } catch(e) { showToast(e.message, 'error'); }
  }

  fileInput?.addEventListener('change', e => handleFile(e.target.files[0]));
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; });
  zone?.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone?.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; handleFile(e.dataTransfer.files[0]); });

  window.getPendingCoverEdit = () => pendingBase64Edit;
  window.resetCoverEdit = () => {
    pendingBase64Edit = '';
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (zone) zone.querySelector('.upload-zone-inner')?.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
  };
})();

// ===== LOGO UPLOAD (Admin only) =====
(function setupLogoUpload() {
  const fileInput = document.getElementById('logo-file-input');
  const logoDefault = document.getElementById('logo-icon-default');
  const logoImg = document.getElementById('logo-img-custom');

  // Load saved logo (custom upload overrides asset logo)
  const savedLogo = localStorage.getItem('customLogo');
  if (savedLogo) {
    logoDefault.classList.add('hidden');
    logoImg.src = savedLogo;
    logoImg.classList.remove('hidden');
  }
  // If no saved logo, the img already points to asset/logo sman 15.jpeg from HTML

  fileInput?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) { showToast('Pilih file gambar!', 'error'); return; }
    try {
      const b64 = await fileToBase64(file);
      localStorage.setItem('customLogo', b64);
      logoDefault.classList.add('hidden');
      logoImg.src = b64;
      logoImg.classList.remove('hidden');
      showToast('Logo berhasil diperbarui!', 'success');
    } catch(e) { showToast(e.message, 'error'); }
  });
})();

// ===== KONFIGURASI API (PHP + MySQL) =====
const API_URL = 'api'; // sesuaikan path jika folder api/ ada di lokasi lain

// ===== STATE =====
// books, users, history sekarang diambil dari database via API,
// bukan lagi dari localStorage. Diisi kosong dulu lalu dimuat oleh loadAllData().
let books = [];
let users = [];
let history = [];
let currentUser = JSON.parse(sessionStorage.getItem('activeUser')) || null;
let isLoggedIn = currentUser !== null;
let isAdmin = isLoggedIn && currentUser.role === 'admin';
let currentCategory = 'semua';
let currentPage = 1;
const booksPerPage = 10;
let html5QrcodeScanner = null;
let loginRole = 'siswa_guru';
let registerRole = 'siswa';
let editingBookId = null;

// ===== LOAD DATA DARI DATABASE (menggantikan localStorage) =====
async function loadAllData() {
  try {
    const [bRes, uRes, hRes] = await Promise.all([
      fetch(`${API_URL}/buku.php`).then(r => r.json()),
      fetch(`${API_URL}/pengguna.php`).then(r => r.json()),
      fetch(`${API_URL}/transaksi.php?action=riwayat`).then(r => r.json())
    ]);
    books = bRes.data || [];
    users = uRes.data || [];
    // Normalisasi bentuk data riwayat dari API (judul_buku -> judul,
    // tipe 'pinjam'/'kembali' -> 'Pinjam'/'Kembali') agar cocok dengan
    // renderLaporan() yang sudah ada sebelumnya.
    history = (hRes.data || []).map(h => ({
      ...h,
      judul: h.judul_buku,
      tipe: h.tipe === 'pinjam' ? 'Pinjam' : 'Kembali'
    }));

    // Jika ada user yang sedang login, sinkronkan datanya dengan yang terbaru dari server
    if (currentUser) {
      const fresh = users.find(u => u.nis === currentUser.nis);
      if (fresh) { currentUser = fresh; sessionStorage.setItem('activeUser', JSON.stringify(currentUser)); }
    }

    // Render ulang tampilan setelah data dari database siap
    if (typeof renderKatalog === 'function') renderKatalog(document.getElementById('search-input')?.value || '');
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof updateHeroStats === 'function') updateHeroStats();
    if (typeof renderLaporan === 'function') renderLaporan();
  } catch (e) {
    showToast('Gagal memuat data dari server. Pastikan XAMPP/Apache & MySQL aktif.', 'error');
    console.error(e);
  }
}

// ===== SAVE =====
// Tidak lagi menulis ke localStorage untuk books/users/history.
// Setiap aksi (tambah/edit/hapus buku, pinjam/kembali, login, register)
// langsung memanggil API dan menyimpan ke database MySQL secara real-time.
function saveData() {
  if (currentUser) sessionStorage.setItem('activeUser', JSON.stringify(currentUser));
}

function addHistory(user, buku, tipe) {
  // Riwayat kini dicatat otomatis oleh server (transaksi.php) saat
  // prosesTransaksi() dipanggil, jadi di sini cukup update tampilan lokal
  // agar terasa instan sebelum loadAllData() menyegarkan dari database.
  history.unshift({
    waktu: new Date().toLocaleString('id-ID'),
    nama: user.nama, nis: user.nis, role: user.role || 'siswa',
    judul: buku.judul, tipe
  });
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===== HIGHLIGHT =====
function hl(text, kw) {
  if (!kw) return text;
  return text.replace(new RegExp(`(${kw})`, 'gi'), "<mark class='highlight'>$1</mark>");
}

// ===== RENDER KATALOG =====
function renderKatalog(filterText = '') {
  const container = document.getElementById('katalog-container');
  container.innerHTML = '';

  const filtered = books.filter(b => {
    const matchSearch = b.judul.toLowerCase().includes(filterText.toLowerCase()) ||
      (b.pengarang || '').toLowerCase().includes(filterText.toLowerCase()) ||
      b.kategori.toLowerCase().includes(filterText.toLowerCase());
    const matchCat = currentCategory === 'semua' || b.kategori === currentCategory;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-book-open-reader"></i></div>
        <h3>Buku tidak ditemukan</h3>
        <p>Coba kata kunci atau kategori lain</p>
      </div>`;
    document.getElementById('pagination-controls').innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(filtered.length / booksPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const slice = filtered.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

  slice.forEach(buku => {
    const borrowedByMe = currentUser ? currentUser.borrowed.includes(buku.id) : false;
    const coverSrc = buku.cover || `https://via.placeholder.com/300x450/e2e8f0/64748b?text=${encodeURIComponent(buku.judul)}`;

    let badge = buku.stok === 0
      ? '<span class="book-badge badge-empty">Habis</span>'
      : borrowedByMe
        ? '<span class="book-badge badge-borrowed">Dipinjam</span>'
        : '<span class="book-badge badge-available">Tersedia</span>';

    let btn = '';
    if (!isAdmin) {
      if (borrowedByMe) {
        const diKeranjangKembali = returnCart.includes(buku.id);
        btn = diKeranjangKembali
          ? `<button class="book-btn book-btn-in-cart" onclick="kembalikanBuku(${buku.id})"><i class="fa-solid fa-check"></i> Dipilih</button>`
          : `<button class="book-btn book-btn-return" onclick="kembalikanBuku(${buku.id})">Kembalikan</button>`;
      } else if (buku.stok > 0 && isLoggedIn) {
        const diKeranjang = borrowCart.includes(buku.id);
        btn = diKeranjang
          ? `<button class="book-btn book-btn-in-cart" onclick="pinjamBuku(${buku.id})"><i class="fa-solid fa-check"></i> Dipilih</button>`
          : `<button class="book-btn book-btn-borrow" onclick="pinjamBuku(${buku.id})">+ Pinjam</button>`;
      } else if (!isLoggedIn && buku.stok > 0) {
        btn = `<button class="book-btn book-btn-borrow" onclick="showLogin()">Pinjam</button>`;
      } else {
        btn = `<button class="book-btn book-btn-disabled" disabled>Habis</button>`;
      }
    }

    let adminBtns = isAdmin ? `
      <div class="admin-book-actions">
        <button class="book-btn btn-success" style="flex:1;" onclick="bukaEditBuku(${buku.id})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="book-btn btn-danger" style="flex:1;" onclick="hapusBuku(${buku.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
      </div>` : '';

    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="book-img-wrap" onclick="bukaDetailBuku(${buku.id})">
        <img src="${coverSrc}" alt="${buku.judul}" onerror="this.src='https://via.placeholder.com/300x450/e2e8f0/64748b?text=No+Cover'">
        ${badge}
        <div class="book-overlay"><button class="overlay-btn">Lihat Detail</button></div>
      </div>
      <div class="book-body">
        <div class="book-category">${buku.kategori}</div>
        <div class="book-title" onclick="bukaDetailBuku(${buku.id})">${hl(buku.judul, filterText)}</div>
        <div class="book-author">${hl(buku.pengarang || 'Unknown', filterText)}</div>
        <div class="book-footer">
          <div class="stock-info">Stok: <span>${buku.stok}</span></div>
          ${btn}
        </div>
        ${adminBtns}
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination(totalPages);
}

function renderPagination(total) {
  const ctrl = document.getElementById('pagination-controls');
  if (total <= 1) { ctrl.innerHTML = ''; return; }
  ctrl.innerHTML = `
    <button class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="currentPage--; renderKatalog(document.getElementById('search-input').value)"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="pg-info">Hal ${currentPage} / ${total}</span>
    <button class="pg-btn" ${currentPage === total ? 'disabled' : ''} onclick="currentPage++; renderKatalog(document.getElementById('search-input').value)"><i class="fa-solid fa-chevron-right"></i></button>
  `;
}

window.filterKategori = function(kat, el) {
  currentCategory = kat; currentPage = 1;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderKatalog(document.getElementById('search-input').value);
};

// ===== RENDER DASHBOARD =====
function renderDashboard() {
  if (!currentUser) return;
  document.getElementById('nama-siswa').textContent = currentUser.nama;
  document.getElementById('dashboard-subtitle').textContent =
    isAdmin ? 'Panel Administrasi Perpustakaan' :
    currentUser.role === 'guru' ? 'Portal Guru — Peminjaman Buku' :
    'Portal Siswa — Pantau Pinjaman Kamu';

  if (isAdmin) {
    document.getElementById('admin-stats').classList.remove('hidden');
    document.getElementById('admin-tabs').classList.remove('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
    // Reset admin tabs to show peminjaman first
    document.querySelectorAll('#admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    const firstAdminTab = document.querySelector('#admin-tabs .tab-btn');
    if (firstAdminTab) firstAdminTab.classList.add('active');
    document.getElementById('tab-peminjaman').classList.remove('hidden');
    updateAdminStats();
    renderAdminBorrows();
    renderUserList();
  } else {
    document.getElementById('admin-stats').classList.add('hidden');
    document.getElementById('admin-tabs').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
    // Tab peminjaman aktif disembunyikan untuk siswa/guru
    document.getElementById('tab-peminjaman').classList.add('hidden');
    renderStudentBorrows();
    updateStudentStats();
  }
}

function updateAdminStats() {
  const totalBorrows = users.reduce((acc, u) => acc + (u.borrowed ? u.borrowed.length : 0), 0);
  const lowStock = books.filter(b => b.stok <= 1).length;
  document.getElementById('sc-total-books').textContent = books.length;
  document.getElementById('sc-total-members').textContent = users.filter(u => u.role !== 'admin').length;
  document.getElementById('sc-active-borrows').textContent = totalBorrows;
  document.getElementById('sc-low-stock').textContent = lowStock;
}

function renderAdminBorrows() {
  const container = document.getElementById('daftar-semua-pinjaman');
  container.innerHTML = '';
  let hasBorrows = false;

  users.forEach(user => {
    if (!user.borrowed) return;
    user.borrowed.forEach(idBuku => {
      hasBorrows = true;
      const buku = books.find(b => b.id === idBuku);
      if (!buku) return;
      const cover = buku.cover || '';
      const roleTag = user.role === 'guru' ? 'guru' : '';
      const card = document.createElement('div');
      card.className = 'borrow-card';
      card.innerHTML = `
        <img src="${cover}" alt="${buku.judul}" class="borrow-cover" onerror="this.src='https://via.placeholder.com/60x80/e2e8f0/64748b'">
        <div class="borrow-info">
          <div class="borrow-title">${buku.judul}</div>
          <div class="borrow-user-tag">
            <span class="tag ${roleTag}">${user.role === 'guru' ? 'Guru' : 'Siswa'}</span>
            ${user.nama} (${user.nis})
          </div>
          <div class="borrow-actions">
            <button class="btn-success" onclick="adminApproveReturn('${user.nis}', ${buku.id})"><i class="fa-solid fa-check"></i> Terima Kembali</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });

  if (!hasBorrows) {
    container.innerHTML = '<p style="color: var(--gray-500); text-align:center; padding: 32px 0; grid-column: 1/-1;">Belum ada buku yang dipinjam saat ini.</p>';
  }
}

function renderUserList(keyword) {
  const container = document.getElementById('user-list-container');
  const kw = (keyword !== undefined ? keyword : (document.getElementById('user-search')?.value || '')).trim().toLowerCase();
  let nonAdmins = users.filter(u => u.role !== 'admin');

  if (kw) {
    nonAdmins = nonAdmins.filter(u =>
      u.nama.toLowerCase().includes(kw) || String(u.nis).toLowerCase().includes(kw)
    );
  }

  if (nonAdmins.length === 0) {
    container.innerHTML = `<p style="color: var(--gray-500); text-align:center; padding:24px;">${kw ? `Tidak ada anggota yang cocok dengan "${keyword}".` : 'Belum ada anggota terdaftar.'}</p>`;
    return;
  }
  let rows = nonAdmins.map(u => `
    <tr>
      <td><strong>${hl(u.nama, kw)}</strong></td>
      <td>${hl(String(u.nis), kw)}</td>
      <td><span class="role-chip role-chip-${u.role === 'guru' ? 'guru' : 'siswa'}">${u.role === 'guru' ? 'Guru' : 'Siswa'}</span></td>
      <td>${u.borrowed ? u.borrowed.length : 0} buku</td>
      <td><button class="btn-danger" onclick="hapusUser('${u.nis}')"><i class="fa-solid fa-trash"></i> Hapus</button></td>
    </tr>
  `).join('');
  container.innerHTML = `
    <div class="user-table-wrap">
      <table class="user-table">
        <thead><tr><th>Nama</th><th>NIS/NUPTK</th><th>Role</th><th>Dipinjam</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

document.getElementById('user-search')?.addEventListener('input', function() {
  renderUserList(this.value);
});

// ===== ADMIN: TAMBAH ANGGOTA LANGSUNG DARI DASHBOARD =====
document.getElementById('input-role-anggota')?.addEventListener('change', function() {
  const role = this.value;
  const nisLabel = document.getElementById('label-nis-anggota');
  const pwLabel = document.getElementById('label-password-anggota');
  const nisInput = document.getElementById('input-nis-anggota');
  if (role === 'guru') {
    nisLabel.textContent = 'NUPTK *';
    nisInput.placeholder = 'Masukkan NUPTK';
  } else if (role === 'admin') {
    nisLabel.textContent = 'Username *';
    nisInput.placeholder = 'Masukkan username admin';
  } else {
    nisLabel.textContent = 'NIS *';
    nisInput.placeholder = 'Masukkan NIS';
  }
  pwLabel.textContent = role === 'admin' ? 'Password *' : 'Password (opsional untuk Siswa/Guru)';
});

document.getElementById('btn-tambah-anggota')?.addEventListener('click', async () => {
  if (!isAdmin) return;
  const role = document.getElementById('input-role-anggota').value;
  const nis = document.getElementById('input-nis-anggota').value.trim();
  const nama = document.getElementById('input-nama-anggota').value.trim();
  const password = document.getElementById('input-password-anggota').value.trim();

  if (!nis || !nama) { showToast('Isi Role, NIS/NUPTK, dan Nama terlebih dahulu!', 'error'); return; }
  if (role === 'admin' && !password) { showToast('Password wajib diisi untuk akun Admin!', 'error'); return; }

  try {
    const res = await fetch(`${API_URL}/pengguna.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, nama, password, role })
    }).then(r => r.json());

    if (!res.success) { showToast(res.message || 'Gagal menambah anggota (mungkin NIS/NUPTK sudah dipakai).', 'error'); return; }

    showToast(`Anggota "${nama}" berhasil ditambahkan!`, 'success');
    document.getElementById('input-nis-anggota').value = '';
    document.getElementById('input-nama-anggota').value = '';
    document.getElementById('input-password-anggota').value = '';
    document.getElementById('input-role-anggota').value = 'siswa';
    document.getElementById('label-nis-anggota').textContent = 'NIS *';
    document.getElementById('label-password-anggota').textContent = 'Password (opsional untuk Siswa/Guru)';
    await loadAllData();
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

function updateStudentStats() {
  if (!currentUser) return;
  const activeBorrows = currentUser.borrowed ? currentUser.borrowed.length : 0;
  // Hitung total pernah dipinjam dari historyDB milik user ini (tipe Pinjam)
  const totalBorrowed = history.filter(h => h.nis === currentUser.nis && h.tipe === 'Pinjam').length;
  const totalReturned = history.filter(h => h.nis === currentUser.nis && h.tipe === 'Kembali').length;

  const el1 = document.getElementById('ss-active-borrows');
  const el2 = document.getElementById('ss-total-borrowed');
  const el3 = document.getElementById('ss-total-returned');
  if (el1) el1.textContent = activeBorrows;
  if (el2) el2.textContent = totalBorrowed;
  if (el3) el3.textContent = totalReturned;
}

function renderStudentBorrows() {
  const container = document.getElementById('daftar-pinjaman');
  container.innerHTML = '';

  if (!currentUser.borrowed || currentUser.borrowed.length === 0) {
    container.innerHTML = '<p class="empty-borrow-msg">Belum ada buku yang sedang dipinjam.</p>';
    updateReturnCartBar();
    return;
  }

  currentUser.borrowed.forEach(idBuku => {
    const buku = books.find(b => b.id === idBuku);
    if (!buku) return;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID');
    const dipilih = returnCart.includes(idBuku);

    const card = document.createElement('div');
    card.className = `borrow-card return-selectable${dipilih ? ' return-selected' : ''}`;
    card.dataset.id = idBuku;
    card.innerHTML = `
      <div class="return-check-wrap" onclick="kembalikanBuku(${idBuku})">
        <div class="return-check-box${dipilih ? ' checked' : ''}">
          <i class="fa-solid fa-check"></i>
        </div>
      </div>
      <img src="${buku.cover || ''}" alt="${buku.judul}" class="borrow-cover" onerror="this.src='https://via.placeholder.com/60x80/e2e8f0/64748b'">
      <div class="borrow-info">
        <div class="borrow-title">${buku.judul}</div>
        <div class="borrow-user-tag"><i class="fa-solid fa-feather"></i> ${buku.pengarang || 'Pengarang tidak diketahui'}</div>
        <div class="borrow-user-tag" style="margin-top:2px;"><i class="fa-regular fa-calendar-xmark"></i> Batas: ${dueDate}</div>
        <div class="borrow-actions" style="margin-top:10px;">
          <button class="btn-return-toggle${dipilih ? ' selected' : ''}" onclick="kembalikanBuku(${idBuku})">
            ${dipilih
              ? '<i class="fa-solid fa-xmark"></i> Batalkan Pilihan'
              : '<i class="fa-solid fa-rotate-left"></i> Pilih untuk Kembalikan'}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  updateReturnCartBar();
}

function renderMemberQR() {
  const container = document.getElementById('my-member-qr');
  container.innerHTML = '';
  new QRCode(container, {
    text: JSON.stringify({ action: 'member', nis: currentUser.nis }),
    width: 180, height: 180, colorDark: '#0f172a', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ===== RENDER LAPORAN =====
function parseWaktu(waktuStr) {
  // Format: "DD/MM/YYYY, HH:MM:SS" (id-ID locale)
  try {
    const parts = waktuStr.split(', ')[0].split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  } catch(e) {}
  return new Date(waktuStr);
}

function getFilteredHistory() {
  const filterText = document.getElementById('laporan-search')?.value || '';
  const filterTanggal = document.getElementById('filter-tanggal')?.value || '';

  return history.filter(h => {
    const matchText = h.nama.toLowerCase().includes(filterText.toLowerCase()) ||
      h.judul.toLowerCase().includes(filterText.toLowerCase());

    if (!matchText) return false;

    if (filterTanggal) {
      const d = parseWaktu(h.waktu);
      const tgl = new Date(filterTanggal);
      return d.getFullYear() === tgl.getFullYear() &&
             d.getMonth() === tgl.getMonth() &&
             d.getDate() === tgl.getDate();
    }

    return true;
  });
}

function populateTahunFilter(preserveValue = true) {
  const sel = document.getElementById('filter-tahun');
  if (!sel) return;
  const years = [...new Set(history.map(h => parseWaktu(h.waktu).getFullYear()))].filter(y => !isNaN(y)).sort((a,b) => b - a);
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">Semua Tahun</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  if (preserveValue && currentVal) sel.value = currentVal;
}

function renderLaporanSummary(filtered) {
  const totalPinjam = filtered.filter(h => h.tipe === 'Pinjam').length;
  const totalKembali = filtered.filter(h => h.tipe === 'Kembali').length;
  const uniqueMembers = new Set(filtered.map(h => h.nis)).size;
  const uniqueBuku = new Set(filtered.map(h => h.judul)).size;

  const summaryEl = document.getElementById('laporan-summary');
  if (!summaryEl) return;
  summaryEl.innerHTML = `
    <div class="laporan-stat-card lsc-blue">
      <div class="lsc-icon"><i class="fa-solid fa-book-open"></i></div>
      <div class="lsc-info"><div class="lsc-num">${totalPinjam}</div><div class="lsc-label">Total Pinjam</div></div>
    </div>
    <div class="laporan-stat-card lsc-green">
      <div class="lsc-icon"><i class="fa-solid fa-rotate-left"></i></div>
      <div class="lsc-info"><div class="lsc-num">${totalKembali}</div><div class="lsc-label">Total Kembali</div></div>
    </div>
    <div class="laporan-stat-card lsc-purple">
      <div class="lsc-icon"><i class="fa-solid fa-users"></i></div>
      <div class="lsc-info"><div class="lsc-num">${uniqueMembers}</div><div class="lsc-label">Anggota Aktif</div></div>
    </div>
    <div class="laporan-stat-card lsc-amber">
      <div class="lsc-icon"><i class="fa-solid fa-books"></i></div>
      <div class="lsc-info"><div class="lsc-num">${uniqueBuku}</div><div class="lsc-label">Judul Buku</div></div>
    </div>
  `;
}

function renderLaporan(preserveFilters = true) {
  const tbody = document.getElementById('table-history-body');
  const filtered = getFilteredHistory();
  renderLaporanSummary(filtered);

  const countBadge = document.getElementById('laporan-result-count');
  if (countBadge) countBadge.textContent = `${filtered.length} transaksi`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div style="text-align:center;padding:48px 20px;color:var(--gray-400);"><div style="font-size:48px;margin-bottom:12px;">🔍</div><div style="font-weight:700;font-size:16px;color:var(--gray-500);margin-bottom:4px;">Tidak ada data ditemukan</div><div style="font-size:13px;">Coba ubah filter atau klik Reset</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((item, i) => `
    <tr>
      <td style="white-space:nowrap;color:var(--gray-500);font-size:13px;">${item.waktu}</td>
      <td><strong style="color:var(--navy);">${item.nama}</strong></td>
      <td style="color:var(--gray-500);">${item.nis}</td>
      <td><span class="role-chip role-chip-${item.role === 'guru' ? 'guru' : item.role === 'admin' ? 'admin' : 'siswa'}" style="text-transform:capitalize;">${item.role||'siswa'}</span></td>
      <td style="font-weight:500;">${item.judul}</td>
      <td><span class="activity-badge ${item.tipe==='Pinjam'?'badge-pinjam':'badge-kembali'}"><i class="fa-solid ${item.tipe==='Pinjam'?'fa-arrow-down':'fa-arrow-up'}" style="font-size:10px;margin-right:3px;"></i>${item.tipe}</span></td>
    </tr>
  `).join('');
}


// ===== HERO STATS =====
function updateHeroStats() {
  const totalBorrows = history.length;
  animateNum('stat-books', books.length);
  // Anggota & Transaksi hanya tampil sebelum login atau saat login sebagai admin
  const showAll = !isLoggedIn || isAdmin;
  const memberEl = document.getElementById('stat-members');
  const borrowEl = document.getElementById('stat-borrows');
  const dividers = document.querySelectorAll('.stat-divider');
  if (memberEl) memberEl.closest('.stat-item')?.classList.toggle('hidden', !showAll);
  if (borrowEl) borrowEl.closest('.stat-item')?.classList.toggle('hidden', !showAll);
  dividers.forEach(d => d.classList.toggle('hidden', !showAll));
  if (showAll) {
    animateNum('stat-members', users.filter(u => u.role !== 'admin').length);
    animateNum('stat-borrows', totalBorrows);
  }
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start;
    if (start >= target) clearInterval(timer);
  }, 30);
}

// ===== DETAIL BUKU =====
window.bukaDetailBuku = function(id) {
  const buku = books.find(b => b.id === id);
  if (!buku) return;
  document.getElementById('detail-judul').textContent = buku.judul;
  document.getElementById('detail-pengarang').textContent = buku.pengarang || 'Tidak diketahui';
  document.getElementById('detail-kategori-badge').textContent = buku.kategori;
  document.getElementById('detail-penerbit').textContent = buku.penerbit || 'Tidak tersedia';
  document.getElementById('detail-tahun').textContent = buku.tahun || 'Tidak tersedia';
  document.getElementById('detail-isbn').textContent = buku.isbn || 'Tidak tersedia';
  document.getElementById('detail-cover').src = buku.cover || `https://via.placeholder.com/200x300/e2e8f0/64748b?text=${encodeURIComponent(buku.judul)}`;

  const stokEl = document.getElementById('detail-stok-info');
  stokEl.innerHTML = buku.stok > 0
    ? `<span style="color:var(--green); font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${buku.stok} eksemplar tersedia</span>`
    : `<span style="color:var(--red); font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Stok habis</span>`;

  const borrowedByMe = currentUser ? currentUser.borrowed.includes(buku.id) : false;
  const actionContainer = document.getElementById('detail-action-container');
  actionContainer.innerHTML = '';

  if (!isAdmin) {
    if (borrowedByMe) {
      const diKeranjangKembali = returnCart.includes(buku.id);
      actionContainer.innerHTML = diKeranjangKembali
        ? `<button class="btn-danger" style="width:100%; background: var(--green); color:white; border-color: var(--green);" onclick="kembalikanBuku(${buku.id})"><i class="fa-solid fa-check"></i> Dipilih — Klik untuk Batal</button>`
        : `<button class="btn-danger" style="width:100%;" onclick="kembalikanBuku(${buku.id})"><i class="fa-solid fa-rotate-left"></i> Pilih untuk Dikembalikan</button>`;
    } else if (buku.stok > 0) {
      if (isLoggedIn) {
        const diKeranjang = borrowCart.includes(buku.id);
        actionContainer.innerHTML = diKeranjang
          ? `<button class="btn-primary" style="width:100%; background: var(--green);" onclick="pinjamBuku(${buku.id})"><i class="fa-solid fa-check"></i> Dipilih — Klik untuk Batal</button>`
          : `<button class="btn-primary" style="width:100%;" onclick="pinjamBuku(${buku.id})"><i class="fa-solid fa-book"></i> Pilih untuk Dipinjam</button>`;
      } else {
        actionContainer.innerHTML = `<button class="btn-primary" style="width:100%;" onclick="showLogin()"><i class="fa-solid fa-right-to-bracket"></i> Login untuk Pinjam</button>`;
      }
    } else {
      actionContainer.innerHTML = `<button class="btn-ghost" style="width:100%; cursor:not-allowed;" disabled>Stok Habis</button>`;
    }
  }

  openModal('detail-modal');
};

function closeDetailModal() { closeModal('detail-modal'); }

// ===== KERANJANG PINJAM (pilih beberapa buku -> 1 QR Code) =====
let borrowCart = [];
const MAX_PINJAM = 3; // sesuai aturan peminjaman: maksimal 3 buku per anggota

window.pinjamBuku = function(idBuku) {
  if (!isLoggedIn) { showLogin(); return; }
  const buku = books.find(b => b.id === idBuku);
  if (!buku) return;
  if (currentUser.borrowed && currentUser.borrowed.includes(idBuku)) { showToast('Buku ini sudah kamu pinjam.', 'error'); return; }

  if (borrowCart.includes(idBuku)) {
    borrowCart = borrowCart.filter(id => id !== idBuku);
  } else {
    const totalAktif = (currentUser.borrowed ? currentUser.borrowed.length : 0) + borrowCart.length;
    if (totalAktif >= MAX_PINJAM) {
      showToast(`Maksimal ${MAX_PINJAM} buku per anggota. Buat QR untuk buku yang sudah dipilih dulu.`, 'error');
      return;
    }
    if (buku.stok <= 0) { showToast('Stok buku habis!', 'error'); return; }
    borrowCart.push(idBuku);
    showToast(`"${buku.judul}" ditambahkan ke pilihan pinjam.`, 'success');
  }
  renderKatalog(document.getElementById('search-input').value);
  updateBorrowCartBar();
  // Jika modal detail buku ini sedang terbuka, refresh tombolnya juga
  const detailModal = document.getElementById('detail-modal');
  if (detailModal && !detailModal.classList.contains('hidden') && document.getElementById('detail-judul').textContent === buku.judul) {
    bukaDetailBuku(idBuku);
  }
};

function updateBorrowCartBar() {
  const bar = document.getElementById('borrow-cart-bar');
  if (!bar) return;
  if (borrowCart.length === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const judulList = borrowCart.map(id => books.find(b => b.id === id)?.judul).filter(Boolean).join(', ');
  document.getElementById('cart-count-text').textContent = `${borrowCart.length} buku dipilih: ${judulList}`;
}

window.batalkanBorrowCart = function() {
  borrowCart = [];
  renderKatalog(document.getElementById('search-input').value);
  updateBorrowCartBar();
};

window.buatQRDariCart = function() {
  if (!isLoggedIn) { showLogin(); return; }
  if (borrowCart.length === 0) { showToast('Pilih minimal 1 buku terlebih dahulu.', 'error'); return; }
  generateQR(currentUser.nis, [...borrowCart]);
  borrowCart = [];
  renderKatalog(document.getElementById('search-input').value);
  updateBorrowCartBar();
};

// ===== KERANJANG KEMBALI (pilih beberapa buku -> 1 QR Code pengembalian) =====
let returnCart = [];

window.kembalikanBuku = function(idBuku) {
  if (!isLoggedIn) return;
  const buku = books.find(b => b.id === idBuku);
  if (!buku) return;
  if (!currentUser.borrowed || !currentUser.borrowed.includes(idBuku)) {
    showToast('Buku ini tidak sedang kamu pinjam.', 'error'); return;
  }

  if (returnCart.includes(idBuku)) {
    returnCart = returnCart.filter(id => id !== idBuku);
  } else {
    returnCart.push(idBuku);
    showToast(`"${buku.judul}" ditambahkan ke pilihan kembali.`, 'success');
  }
  renderStudentBorrows();
};

function updateReturnCartBar() {
  const bar = document.getElementById('return-cart-bar');
  const borrowBar = document.getElementById('borrow-cart-bar');
  if (!bar) return;
  if (returnCart.length === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const judulList = returnCart.map(id => books.find(b => b.id === id)?.judul).filter(Boolean);
  const preview = judulList.length <= 2
    ? judulList.join(', ')
    : `${judulList.slice(0,2).join(', ')} +${judulList.length - 2} lainnya`;
  document.getElementById('return-cart-count-text').textContent =
    `${returnCart.length} buku dipilih: ${preview}`;
  // Kalau borrow cart juga aktif, naikan return bar supaya tidak tumpang tindih
  if (borrowBar && !borrowBar.classList.contains('hidden')) {
    bar.style.bottom = '90px';
  } else {
    bar.style.bottom = '22px';
  }
}

window.batalkanReturnCart = function() {
  returnCart = [];
  renderStudentBorrows();
};

window.buatQRDariReturnCart = function() {
  if (!isLoggedIn) { showLogin(); return; }
  if (returnCart.length === 0) { showToast('Pilih minimal 1 buku terlebih dahulu.', 'error'); return; }
  generateReturnQR(currentUser.nis, [...returnCart]);
  returnCart = [];
  renderStudentBorrows();
};

window.adminApproveReturn = function(nis, idBuku) {
  const targetUser = users.find(u => u.nis === nis);
  const buku = books.find(b => b.id === idBuku);
  if (!targetUser || !buku) return;
  showConfirmModal({
    type: 'success',
    title: 'Konfirmasi Pengembalian',
    message: `Setujui pengembalian buku ini dari <strong>${targetUser.nama}</strong>?`,
    cover: buku.cover, bookTitle: buku.judul, bookSub: `NIS/NUPTK: ${nis}`,
    onConfirm: () => {
      buku.stok += 1;
      targetUser.borrowed = targetUser.borrowed.filter(id => id !== idBuku);
      if (currentUser && currentUser.nis === nis) {
        currentUser.borrowed = currentUser.borrowed.filter(id => id !== idBuku);
      }
      addHistory(targetUser, buku, 'Kembali');
      showToast(`Pengembalian "${buku.judul}" disetujui!`, 'success');
      renderDashboard(); renderKatalog(document.getElementById('search-input').value);
      if (!document.getElementById('laporan').classList.contains('hidden')) renderLaporan();
    }
  });
};

window.hapusUser = function(nis) {
  if (!isAdmin) return;
  const user = users.find(u => u.nis === nis);
  if (!user) return;
  showConfirmModal({
    type: 'danger',
    title: 'Hapus Anggota?',
    message: `Hapus anggota <strong>${user.nama}</strong> (${nis})? Semua data peminjaman akan dihapus.`,
    onConfirm: async () => {
      try {
        const res = await fetch(`${API_URL}/pengguna.php`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nis })
        }).then(r => r.json());

        if (!res.success) { showToast(res.message || 'Gagal menghapus anggota', 'error'); return; }

        showToast('Anggota berhasil dihapus.', 'success');
        await loadAllData();
      } catch (e) {
        showToast('Gagal terhubung ke server.', 'error');
        console.error(e);
      }
    }
  });
};

// ===== QR SYSTEM (mendukung 1 QR untuk banyak buku sekaligus — pinjam & kembali) =====
function generateQR(nis, idBukuInput) {
  const idList = Array.isArray(idBukuInput) ? idBukuInput : [idBukuInput];
  const bukuList = idList.map(id => books.find(b => b.id === id)).filter(Boolean);
  if (bukuList.length === 0) return;
  const targetUser = users.find(u => u.nis === nis);
  const payload = JSON.stringify({ action: 'borrow', nis, idBuku: idList });

  const container = document.getElementById('qr-code-container');
  container.innerHTML = '';
  new QRCode(container, {
    text: payload, width: 200, height: 200,
    colorDark: '#1b2435', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
  });

  const jumlah = bukuList.length;
  document.getElementById('qr-title').textContent = jumlah > 1 ? `📖 QR Pinjam ${jumlah} Buku` : '📖 QR Pinjam Buku';
  document.getElementById('qr-instructions').textContent = 'Peminjaman akan aktif setelah dikonfirmasi Admin';

  // Info peminjam
  document.getElementById('qr-peminjam-info').textContent = targetUser ? `${targetUser.nama} · ${nis}` : nis;

  // Daftar buku (bisa lebih dari satu, tetap dalam 1 QR yang sama)
  document.getElementById('qr-book-list').innerHTML = bukuList.map(b => `
    <div class="qr-book-chip">
      <img src="${b.cover || ''}" alt="" class="qr-book-cover" onerror="this.src='https://via.placeholder.com/42x56/e7e0d2/6f6657?text=📖'">
      <div class="qr-book-info">
        <div class="qr-book-title">${b.judul}</div>
      </div>
    </div>
  `).join('');

  openModal('qr-display-modal');
}

function generateReturnQR(nis, idBukuInput) {
  const idList = Array.isArray(idBukuInput) ? idBukuInput : [idBukuInput];
  const bukuList = idList.map(id => books.find(b => b.id === id)).filter(Boolean);
  if (bukuList.length === 0) return;
  const targetUser = users.find(u => u.nis === nis);
  const payload = JSON.stringify({ action: 'return', nis, idBuku: idList });

  const container = document.getElementById('qr-code-container');
  container.innerHTML = '';
  new QRCode(container, {
    text: payload, width: 200, height: 200,
    colorDark: '#1b2435', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
  });

  const jumlah = bukuList.length;
  document.getElementById('qr-title').textContent = jumlah > 1 ? `🔄 QR Kembalikan ${jumlah} Buku` : '🔄 QR Kembalikan Buku';
  document.getElementById('qr-instructions').textContent = 'Pengembalian akan aktif setelah dikonfirmasi Admin';

  document.getElementById('qr-peminjam-info').textContent = targetUser ? `${targetUser.nama} · ${nis}` : nis;

  document.getElementById('qr-book-list').innerHTML = bukuList.map(b => `
    <div class="qr-book-chip">
      <img src="${b.cover || ''}" alt="" class="qr-book-cover" onerror="this.src='https://via.placeholder.com/42x56/e7e0d2/6f6657?text=📖'">
      <div class="qr-book-info">
        <div class="qr-book-title">${b.judul}</div>
      </div>
    </div>
  `).join('');

  openModal('qr-display-modal');
}


function startScanner() {
  if (html5QrcodeScanner) return;
  html5QrcodeScanner = new Html5Qrcode('qr-reader');
  html5QrcodeScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    onScanSuccess, () => {}
  ).catch(() => {
    showToast('Tidak bisa mengakses kamera. Periksa izin kamera browser Anda.', 'error');
  });
}

document.getElementById('btn-scan-qr')?.addEventListener('click', () => {
  openModal('qr-scan-modal');
  startScanner();
});

function onScanSuccess(decodedText) {
  stopScanner();
  closeModal('qr-scan-modal');
  processTransactionPayload(decodedText);
}

// Proses payload transaksi hasil scan QR (mendukung 1 atau banyak buku sekaligus)
function processTransactionPayload(decodedText) {
  let data;
  try { data = JSON.parse(decodedText); } catch(e) { showToast('QR tidak valid!', 'error'); return; }

  if (data.action === 'member') {
    showToast(`QR anggota: ${data.nis}`, 'info'); return;
  }

  const { action, nis } = data;
  const idList = Array.isArray(data.idBuku) ? data.idBuku : [data.idBuku];
  const targetUser = users.find(u => u.nis === nis);
  if (!targetUser) { showToast('Data anggota tidak valid!', 'error'); return; }
  const bukuList = idList.map(id => books.find(b => b.id === id)).filter(Boolean);
  if (bukuList.length === 0) { showToast('Data buku tidak valid!', 'error'); return; }

  if (action === 'borrow') {
    const valid = bukuList.filter(b => b.stok > 0 && !targetUser.borrowed.includes(b.id));
    const dilewati = bukuList.length - valid.length;
    if (valid.length === 0) { showToast('Buku tidak tersedia atau sudah dipinjam.', 'error'); return; }
    const daftarJudul = valid.map(b => b.judul).join(', ');
    showConfirmModal({
      type: 'success',
      title: 'Konfirmasi Peminjaman',
      message: `Setujui peminjaman ${valid.length > 1 ? valid.length + ' buku' : 'buku ini'} (${daftarJudul}) oleh <strong>${targetUser.nama}</strong>?` +
        (dilewati > 0 ? `<br><small style="color:var(--red);">${dilewati} buku dilewati (stok habis / sudah dipinjam).</small>` : ''),
      cover: valid[0].cover,
      bookTitle: valid.length > 1 ? `${valid.length} Buku Dipilih` : valid[0].judul,
      bookSub: `NIS/NUPTK: ${nis}`,
      onConfirm: async () => {
        try {
          for (const buku of valid) {
            const res = await fetch(`${API_URL}/transaksi.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nis, id_buku: buku.id, tipe: 'pinjam' })
            }).then(r => r.json());
            if (!res.success) { showToast(`${buku.judul}: ${res.message}`, 'error'); }
          }
          showToast(`✅ Peminjaman ${valid.length > 1 ? valid.length + ' buku' : `"${valid[0].judul}"`} disetujui!`, 'success');
          closeModal('qr-display-modal');
          await loadAllData();
          if (isAdmin && !document.getElementById('laporan').classList.contains('hidden')) renderLaporan();
        } catch (e) {
          showToast('Gagal terhubung ke server.', 'error');
          console.error(e);
        }
      }
    });
  } else if (action === 'return') {
    const valid = bukuList.filter(b => targetUser.borrowed && targetUser.borrowed.includes(b.id));
    const dilewati = bukuList.length - valid.length;
    if (valid.length === 0) { showToast('Buku tidak sedang dipinjam oleh anggota ini.', 'error'); return; }
    const daftarJudul = valid.map(b => b.judul).join(', ');
    showConfirmModal({
      type: 'success',
      title: 'Konfirmasi Pengembalian',
      message: `Setujui pengembalian ${valid.length > 1 ? valid.length + ' buku' : 'buku ini'} (${daftarJudul}) dari <strong>${targetUser.nama}</strong>?` +
        (dilewati > 0 ? `<br><small style="color:var(--red);">${dilewati} buku dilewati (bukan sedang dipinjam).</small>` : ''),
      cover: valid[0].cover,
      bookTitle: valid.length > 1 ? `${valid.length} Buku Dipilih` : valid[0].judul,
      bookSub: `NIS/NUPTK: ${nis}`,
      onConfirm: async () => {
        try {
          for (const buku of valid) {
            const res = await fetch(`${API_URL}/transaksi.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nis, id_buku: buku.id, tipe: 'kembali' })
            }).then(r => r.json());
            if (!res.success) { showToast(`${buku.judul}: ${res.message}`, 'error'); }
          }
          showToast(`✅ Pengembalian ${valid.length > 1 ? valid.length + ' buku' : `"${valid[0].judul}"`} disetujui!`, 'success');
          closeModal('qr-display-modal');
          await loadAllData();
          if (isAdmin && !document.getElementById('laporan').classList.contains('hidden')) renderLaporan();
        } catch (e) {
          showToast('Gagal terhubung ke server.', 'error');
          console.error(e);
        }
      }
    });
  } else {
    showToast('QR tidak dikenali.', 'error');
  }
}

function stopScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      html5QrcodeScanner.clear();
      html5QrcodeScanner = null;
    }).catch(() => { html5QrcodeScanner = null; });
  }
}

// ===== CUSTOM CONFIRM MODAL (replaces native confirm()) ===== //
function showConfirmModal({ type = 'success', title = 'Konfirmasi', message = '', cover = '', bookTitle = '', bookSub = '', onConfirm }) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').innerHTML = message;

  const iconEl = document.getElementById('confirm-icon');
  iconEl.className = 'modal-icon-header confirm-icon' + (type === 'danger' ? ' danger' : type === 'success' ? ' success' : '');
  iconEl.innerHTML = type === 'danger'
    ? '<i class="fa-solid fa-triangle-exclamation"></i>'
    : '<i class="fa-solid fa-circle-check"></i>';

  const chip = document.getElementById('confirm-book-chip');
  if (bookTitle) {
    chip.classList.remove('hidden');
    document.getElementById('confirm-book-cover').src = cover || '';
    document.getElementById('confirm-book-cover').onerror = function() { this.src = 'https://via.placeholder.com/42x56/e7e0d2/6f6657?text=📖'; };
    document.getElementById('confirm-book-title').textContent = bookTitle;
    document.getElementById('confirm-book-sub').textContent = bookSub;
  } else {
    chip.classList.add('hidden');
  }

  openModal('confirm-modal');

  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  // Clone untuk membersihkan listener lama
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  const newCancel = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

  newOk.addEventListener('click', () => { closeModal('confirm-modal'); onConfirm && onConfirm(); });
  newCancel.addEventListener('click', () => closeModal('confirm-modal'));
}
window.showConfirmModal = showConfirmModal;

// ===== ADMIN CRUD =====
window.bukaEditBuku = function(id) {
  editingBookId = id;
  const buku = books.find(b => b.id === id);
  if (!buku) return;
  document.getElementById('edit-judul').value = buku.judul;
  document.getElementById('edit-pengarang').value = buku.pengarang || '';
  document.getElementById('edit-kategori').value = buku.kategori;
  document.getElementById('edit-stok').value = buku.stok;
  document.getElementById('edit-cover').value = buku.cover || '';
  document.getElementById('edit-penerbit').value = buku.penerbit || '';
  document.getElementById('edit-tahun').value = buku.tahun || '';
  document.getElementById('edit-isbn').value = buku.isbn || '';
  openModal('edit-modal');
};

document.getElementById('btn-simpan-edit').addEventListener('click', async () => {
  if (!isAdmin) return;
  const idx = books.findIndex(b => b.id === editingBookId);
  if (idx === -1) return;

  const coverUrl = extractImageUrl(document.getElementById('edit-cover').value.trim());
  const coverFile = window.getPendingCoverEdit ? window.getPendingCoverEdit() : '';

  const payload = {
    id: editingBookId,
    judul: document.getElementById('edit-judul').value.trim(),
    pengarang: document.getElementById('edit-pengarang').value.trim(),
    kategori: document.getElementById('edit-kategori').value,
    stok: parseInt(document.getElementById('edit-stok').value) || 0,
    penerbit: document.getElementById('edit-penerbit').value.trim(),
    tahun: document.getElementById('edit-tahun').value.trim(),
    isbn: document.getElementById('edit-isbn').value.trim(),
    cover: coverFile || coverUrl
  };

  try {
    const res = await fetch(`${API_URL}/buku.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (!res.success) { showToast(res.message || 'Gagal memperbarui buku', 'error'); return; }

    if (window.resetCoverEdit) window.resetCoverEdit();
    closeModal('edit-modal');
    showToast('Buku berhasil diperbarui!', 'success');
    await loadAllData();
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

window.hapusBuku = function(id) {
  if (!isAdmin) return;
  const buku = books.find(b => b.id === id);
  if (!buku) return;
  showConfirmModal({
    type: 'danger',
    title: 'Hapus Buku?',
    message: 'Buku ini akan dihapus secara permanen dari katalog.',
    cover: buku.cover, bookTitle: buku.judul, bookSub: `Stok saat ini: ${buku.stok}`,
    onConfirm: async () => {
      try {
        const res = await fetch(`${API_URL}/buku.php`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).then(r => r.json());

        if (!res.success) { showToast(res.message || 'Gagal menghapus buku', 'error'); return; }

        showToast('Buku berhasil dihapus.', 'success');
        await loadAllData();
      } catch (e) {
        showToast('Gagal terhubung ke server.', 'error');
        console.error(e);
      }
    }
  });
};

document.getElementById('btn-tambah-buku').addEventListener('click', async () => {
  if (!isAdmin) return;
  const judul = document.getElementById('input-judul-buku').value.trim();
  const pengarang = document.getElementById('input-pengarang-buku').value.trim();
  const kategori = document.getElementById('input-kategori-buku').value;
  const stok = parseInt(document.getElementById('input-stok-buku').value);
  const coverUrl = extractImageUrl(document.getElementById('input-cover-buku').value.trim());
  const coverFile = window.getPendingCoverTambah ? window.getPendingCoverTambah() : '';
  const cover = coverFile || coverUrl;
  const penerbit = document.getElementById('input-penerbit-buku').value.trim();
  const tahun = document.getElementById('input-tahun-buku').value.trim();
  const isbn = document.getElementById('input-isbn-buku').value.trim();

  if (!judul || !pengarang || !kategori || isNaN(stok) || stok < 1) {
    showToast('Isi semua field dengan benar!', 'error'); return;
  }

  try {
    const res = await fetch(`${API_URL}/buku.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, pengarang, kategori, stok, cover: cover || '', penerbit, tahun, isbn })
    }).then(r => r.json());

    if (!res.success) { showToast(res.message || 'Gagal menambah buku', 'error'); return; }

    showToast('Buku baru berhasil ditambahkan!', 'success');
    document.getElementById('input-judul-buku').value = '';
    document.getElementById('input-pengarang-buku').value = '';
    document.getElementById('input-kategori-buku').value = '';
    document.getElementById('input-stok-buku').value = '';
    document.getElementById('input-cover-buku').value = '';
    document.getElementById('input-penerbit-buku').value = '';
    document.getElementById('input-tahun-buku').value = '';
    document.getElementById('input-isbn-buku').value = '';
    if (window.resetCoverTambah) window.resetCoverTambah();

    await loadAllData(); // ambil data terbaru (termasuk buku baru) langsung dari database
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

// ===== LOGIN / AUTH =====
window.selectRole = function(role, el) {
  loginRole = role;
  document.querySelectorAll('#login-modal .role-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const label = document.getElementById('login-id-label');
  const pwGroup = document.getElementById('login-password-group');
  const roleHint = document.getElementById('login-role-hint');
  if (role === 'siswa_guru') {
    label.textContent = 'Nomor Induk (NIS/NUPTK)';
    if (pwGroup) pwGroup.style.display = 'none';
    if (roleHint) roleHint.style.display = 'flex';
  } else {
    label.textContent = 'Username Admin';
    if (pwGroup) pwGroup.style.display = 'block';
    if (roleHint) roleHint.style.display = 'none';
  }
  document.getElementById('input-nis').placeholder = role === 'admin' ? 'admin' : 'Masukkan NIS (Siswa) atau NUPTK (Guru)';
};

window.selectRegRole = function(role, el) {
  registerRole = role;
  document.querySelectorAll('#register-modal .role-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('reg-id-label').textContent = role === 'guru' ? 'NUPTK / NIP' : 'Nomor Induk Siswa (NIS)';
  document.getElementById('reg-nis').placeholder = role === 'guru' ? 'Masukkan NUPTK' : 'Masukkan NIS';
};

document.getElementById('btn-submit-login').addEventListener('click', async () => {
  const nis = document.getElementById('input-nis').value.trim();
  const password = document.getElementById('input-password').value.trim();

  if (loginRole === 'admin' && (!nis || !password)) { showToast('Isi semua kolom!', 'error'); return; }
  if (loginRole !== 'admin' && !nis) { showToast('Masukkan NIS/NUPTK!', 'error'); return; }

  try {
    const res = await fetch(`${API_URL}/pengguna.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, password: password || '' })
    }).then(r => r.json());

    if (!res.success) {
      showToast(loginRole === 'admin' ? 'Username atau password admin salah!' : 'NIS/NUPTK tidak ditemukan!', 'error');
      return;
    }

    const user = res.data;
    if (loginRole === 'admin' && user.role !== 'admin') { showToast('Akun ini bukan admin!', 'error'); return; }
    if (loginRole !== 'admin' && user.role === 'admin') { showToast('Gunakan mode login Admin.', 'error'); return; }

    currentUser = user; isLoggedIn = true; isAdmin = user.role === 'admin';
    sessionStorage.setItem('activeUser', JSON.stringify(currentUser));
    closeModal('login-modal');

    const roleKeterangan = user.role === 'admin' ? 'Admin' : user.role === 'guru' ? 'Guru' : 'Siswa';
    showToast(`Selamat datang, ${user.nama}! Anda login sebagai ${roleKeterangan} 👋`, 'success');
    await loadAllData();
    checkLoginState();
    document.getElementById('input-nis').value = '';
    document.getElementById('input-password').value = '';
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

document.getElementById('btn-submit-register').addEventListener('click', async () => {
  const nis = document.getElementById('reg-nis').value.trim();
  const nama = document.getElementById('reg-nama').value.trim();

  if (!nis || !nama) { showToast('Isi semua kolom!', 'error'); return; }

  try {
    const res = await fetch(`${API_URL}/pengguna.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, nama, password: '', role: registerRole })
    }).then(r => r.json());

    if (!res.success) { showToast(res.message || 'NIS/NUPTK sudah terdaftar!', 'error'); return; }

    showToast('Registrasi berhasil! Silakan login.', 'success');
    closeModal('register-modal'); showLogin();
    await loadAllData();
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

document.getElementById('btn-submit-forgot')?.addEventListener('click', async () => {
  const nis = document.getElementById('forgot-nis').value.trim();
  const nama = document.getElementById('forgot-nama').value.trim();
  const newPw = document.getElementById('forgot-password').value.trim();
  if (!nis || !nama || !newPw) { showToast('Isi semua kolom!', 'error'); return; }
  const target = users.find(u => u.nis === nis && u.nama.toLowerCase() === nama.toLowerCase());
  if (!target) { showToast('Data tidak cocok!', 'error'); return; }
  if (newPw.length < 6) { showToast('Password minimal 6 karakter!', 'error'); return; }

  try {
    const res = await fetch(`${API_URL}/pengguna.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, password: newPw })
    }).then(r => r.json());

    if (!res.success) { showToast(res.message || 'Gagal memperbarui password', 'error'); return; }

    showToast('Password berhasil diperbarui!', 'success');
    closeModal('forgot-modal'); showLogin();
  } catch (e) {
    showToast('Gagal terhubung ke server.', 'error');
    console.error(e);
  }
});

// ===== SEARCH & FILTER =====
document.getElementById('search-input').addEventListener('input', (e) => {
  currentPage = 1;
  const val = e.target.value;
  document.getElementById('clear-search').classList.toggle('hidden', val.length === 0);
  renderKatalog(val);
});

document.getElementById('clear-search').addEventListener('click', () => {
  document.getElementById('search-input').value = '';
  document.getElementById('clear-search').classList.add('hidden');
  currentPage = 1; renderKatalog('');
  document.getElementById('search-input').focus();
});

document.getElementById('laporan-search')?.addEventListener('input', () => renderLaporan());

document.getElementById('filter-tanggal')?.addEventListener('change', () => renderLaporan());
document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
  const srch = document.getElementById('laporan-search');
  const tgl  = document.getElementById('filter-tanggal');
  if (srch) srch.value = '';
  if (tgl)  tgl.value  = '';
  renderLaporan(false);
});

document.getElementById('btn-export-excel')?.addEventListener('click', () => {
  const filtered = getFilteredHistory();
  if (filtered.length === 0) { showToast('Tidak ada data untuk diekspor!', 'error'); return; }

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Detail Transaksi ──────────────────────────────────────
  const headers = ['No', 'Waktu', 'Nama', 'NIS/NUPTK', 'Role', 'Judul Buku', 'Aktivitas'];
  const rows = filtered.map((h, i) => [
    i + 1,
    h.waktu,
    h.nama,
    h.nis,
    h.role === 'admin' ? 'Admin' : h.role === 'guru' ? 'Guru' : 'Siswa',
    h.judul,
    h.tipe
  ]);

  // Title rows + header + data
  const wsData = [
    ['LAPORAN AKTIVITAS PERPUSTAKAAN'],
    ['SMAN 15 Kota Tangerang'],
    [`Dicetak: ${new Date().toLocaleString('id-ID')}`],
    [`Total Data: ${filtered.length} transaksi`],
    [], // blank row
    headers,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge title cells across 7 columns (A1:G1, A2:G2, etc.)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 22 }, // Waktu
    { wch: 28 }, // Nama
    { wch: 16 }, // NIS/NUPTK
    { wch: 10 }, // Role
    { wch: 38 }, // Judul Buku
    { wch: 13 }, // Aktivitas
  ];

  // Apply cell styles
  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: '1e3a5f' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };
  const subStyle = {
    font: { bold: false, sz: 11, color: { rgb: '475569' } },
    alignment: { horizontal: 'center' }
  };
  const headerStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1d4ed8' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { rgb: '93c5fd' } },
      bottom: { style: 'thin', color: { rgb: '93c5fd' } },
      left:   { style: 'thin', color: { rgb: '93c5fd' } },
      right:  { style: 'thin', color: { rgb: '93c5fd' } },
    }
  };

  // Title & subtitle styling
  ['A1','A2','A3','A4'].forEach((ref, i) => {
    if (ws[ref]) ws[ref].s = i === 0 ? titleStyle : subStyle;
  });

  // Header row styling (row index 5 = wsData[5])
  headers.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: 5, c: ci });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  });

  // Data row styling — alternate row colors, activity badge color
  rows.forEach((row, ri) => {
    const isEven = ri % 2 === 0;
    const rowBg = isEven ? 'f0f7ff' : 'ffffff';
    row.forEach((_, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: ri + 6, c: ci });
      if (!ws[cellRef]) return;
      let cellStyle = {
        fill: { fgColor: { rgb: rowBg } },
        alignment: { vertical: 'center', wrapText: ci === 5 },
        border: {
          top:    { style: 'hair', color: { rgb: 'cbd5e1' } },
          bottom: { style: 'hair', color: { rgb: 'cbd5e1' } },
          left:   { style: 'hair', color: { rgb: 'cbd5e1' } },
          right:  { style: 'hair', color: { rgb: 'cbd5e1' } },
        }
      };
      // Aktivitas column coloring
      if (ci === 6) {
        const val = row[6];
        cellStyle.font = { bold: true, color: { rgb: val === 'Pinjam' ? '1d4ed8' : '15803d' } };
        cellStyle.alignment = { horizontal: 'center', vertical: 'center' };
      }
      ws[cellRef].s = cellStyle;
    });
  });

  // Row heights: title rows taller
  ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 16 }, { hpt: 16 }, { hpt: 6 }, { hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Detail Transaksi');

  // ── Sheet 2: Ringkasan / Summary ──────────────────────────────────
  const totalPinjam  = filtered.filter(h => h.tipe === 'Pinjam').length;
  const totalKembali = filtered.filter(h => h.tipe === 'Kembali').length;

  // Count by book
  const bukuCount = {};
  filtered.forEach(h => { bukuCount[h.judul] = (bukuCount[h.judul] || 0) + 1; });
  const topBuku = Object.entries(bukuCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Count by member
  const memberCount = {};
  filtered.forEach(h => { memberCount[h.nama] = (memberCount[h.nama] || 0) + 1; });
  const topMember = Object.entries(memberCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const ws2Data = [
    ['RINGKASAN LAPORAN PERPUSTAKAAN'],
    ['SMAN 15 Kota Tangerang'],
    [`Periode: ${new Date().toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' })}`],
    [],
    ['STATISTIK UMUM', ''],
    ['Total Transaksi', filtered.length],
    ['Total Peminjaman', totalPinjam],
    ['Total Pengembalian', totalKembali],
    [],
    ['10 BUKU TERPOPULER', 'Jumlah Transaksi'],
    ...topBuku.map(([judul, count]) => [judul, count]),
    [],
    ['10 ANGGOTA TERAKTIF', 'Jumlah Transaksi'],
    ...topMember.map(([nama, count]) => [nama, count]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!cols'] = [{ wch: 42 }, { wch: 20 }];
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];

  // Section header styles for summary
  const sectionStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0f172a' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
  const labelStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'e2e8f0' } } };

  if (ws2['A1']) ws2['A1'].s = { font: { bold: true, sz: 15, color: { rgb: '1e3a5f' } }, alignment: { horizontal: 'center' } };
  if (ws2['A2']) ws2['A2'].s = { font: { sz: 11, color: { rgb: '475569' } }, alignment: { horizontal: 'center' } };
  if (ws2['A3']) ws2['A3'].s = { font: { sz: 10, color: { rgb: '64748b' } }, alignment: { horizontal: 'center' } };

  [4, 9, 12 + topBuku.length].forEach(r => {
    const ref = XLSX.utils.encode_cell({ r, c: 0 });
    const ref2 = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws2[ref]) ws2[ref].s = sectionStyle;
    if (ws2[ref2]) ws2[ref2].s = sectionStyle;
  });

  [5, 6, 7].forEach(r => {
    const ref = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws2[ref]) ws2[ref].s = labelStyle;
  });

  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

  // ── Build filename ────────────────────────────────────────────────
  const tahun  = document.getElementById('filter-tahun')?.value;
  const bulan  = document.getElementById('filter-bulan')?.value;
  const tanggal = document.getElementById('filter-tanggal')?.value;
  let suffix = '';
  if (tanggal) suffix = `-${tanggal}`;
  else if (tahun || bulan) suffix = `${tahun ? '-' + tahun : ''}${bulan ? '-bln' + bulan : ''}`;

  XLSX.writeFile(wb, `laporan-perpustakaan${suffix}.xlsx`);
  showToast(`✅ Laporan Excel berhasil diekspor! (${filtered.length} data, 2 sheet)`, 'success');
});

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.showLogin = function() {
  closeModal('register-modal'); closeModal('forgot-modal');
  openModal('login-modal');
};
window.showRegister = function() { closeModal('login-modal'); openModal('register-modal'); };
window.showForgot = function() { closeModal('login-modal'); openModal('forgot-modal'); };

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay.id === 'qr-scan-modal') stopScanner();
      closeModal(overlay.id);
    }
  });
});

document.getElementById('close-login-modal').addEventListener('click', () => closeModal('login-modal'));
document.getElementById('close-register-modal').addEventListener('click', () => closeModal('register-modal'));
document.getElementById('close-forgot-modal')?.addEventListener('click', () => closeModal('forgot-modal'));
document.getElementById('close-edit-modal').addEventListener('click', () => closeModal('edit-modal'));
document.getElementById('close-detail-modal').addEventListener('click', () => closeModal('detail-modal'));
document.getElementById('close-qr-display').addEventListener('click', () => closeModal('qr-display-modal'));
document.getElementById('close-qr-scan').addEventListener('click', () => {
  stopScanner();
  closeModal('qr-scan-modal');
});

document.getElementById('hero-login-btn').addEventListener('click', showLogin);

window.togglePw = function(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
};

// ===== TABS =====
window.switchTab = function(tab, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  el.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
};

// ===== NAV =====
document.getElementById('btn-login-nav').addEventListener('click', (e) => {
  e.preventDefault();
  if (isLoggedIn) {
    isLoggedIn = false; currentUser = null; isAdmin = false;
    sessionStorage.removeItem('activeUser');
    showToast('Logout berhasil. Sampai jumpa!', 'info');
    checkLoginState();
  } else { showLogin(); }
});

document.getElementById('nav-dashboard')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('nav-laporan')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('laporan').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('main-nav').classList.toggle('open');
});

// ===== NAV INDICATOR (highlight ikut geser saat menu diklik, dan tetap pindah ke section-nya) =====
(function() {
  const mainNav = document.getElementById('main-nav');
  const navIndicator = document.getElementById('nav-indicator');
  if (!mainNav || !navIndicator) return;

  function moveNavIndicatorTo(link) {
    if (!link || link.classList.contains('hidden')) return;
    const navRect = mainNav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navIndicator.style.width = linkRect.width + 'px';
    navIndicator.style.height = linkRect.height + 'px';
    navIndicator.style.transform = `translate(${linkRect.left - navRect.left}px, ${linkRect.top - navRect.top}px)`;
    navIndicator.style.opacity = '1';
  }

  function setActiveNav(link) {
    mainNav.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    moveNavIndicatorTo(link);
  }

  // Catatan: TIDAK memanggil preventDefault, supaya link <a href="#..."> tetap
  // melakukan navigasi/scroll bawaan browser ke section tujuannya seperti biasa.
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => setActiveNav(link));
  });

  // Reposisi saat ukuran layar berubah (desktop <-> mobile, dsb)
  window.addEventListener('resize', () => {
    const active = mainNav.querySelector('.nav-link.active');
    if (active) moveNavIndicatorTo(active);
  });

  // Reposisi otomatis kalau ada menu yang muncul/hilang (mis. Dashboard & Laporan setelah login)
  const navObserver = new MutationObserver(() => {
    const active = mainNav.querySelector('.nav-link.active');
    if (active) moveNavIndicatorTo(active);
  });
  navObserver.observe(mainNav, { attributes: true, attributeFilter: ['class'], subtree: true });

  function initNavIndicator() {
    const active = mainNav.querySelector('.nav-link.active') || mainNav.querySelector('.nav-link');
    if (!active) return;
    navIndicator.style.transition = 'none';
    moveNavIndicatorTo(active);
    void navIndicator.offsetWidth; // paksa reflow sebelum transisi diaktifkan lagi
    navIndicator.style.transition = '';
  }

  window.addEventListener('load', initNavIndicator);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initNavIndicator);
  }

  // ===== SCROLLSPY: indikator otomatis ikut pindah saat halaman di-scroll manual =====
  // Dihitung ULANG setiap saat (bukan urutan tetap), karena heading yang benar-benar
  // tampil beda-beda tergantung kondisi:
  //   - Tampilan awal (belum login): Beranda, Katalog, Kontak
  //   - Siswa/Guru login: Dashboard, Katalog, Kontak (Beranda diganti welcome banner, tanpa Laporan)
  //   - Admin login: Dashboard, Laporan, Katalog, Kontak
  const navSectionPairs = [
    { link: mainNav.querySelector('a[href="#beranda"]'), id: 'beranda' },
    { link: document.getElementById('nav-dashboard'), id: 'dashboard' },
    { link: document.getElementById('nav-laporan'), id: 'laporan' },
    { link: mainNav.querySelector('a[href="#katalog"]'), id: 'katalog' },
    { link: mainNav.querySelector('a[href="#kontak"]'), id: 'kontak' }
  ];

  function getActiveScrollTargets() {
    return navSectionPairs
      .filter(p => p.link && !p.link.classList.contains('hidden'))
      .map(p => ({ link: p.link, el: document.getElementById(p.id) }))
      .filter(p => p.el && !p.el.classList.contains('hidden'))
      // urutkan berdasarkan posisi ASLI section saat ini di halaman, bukan urutan tetap,
      // supaya selalu cocok walau urutan/heading yang tampil berbeda per role
      .sort((a, b) => a.el.offsetTop - b.el.offsetTop);
  }

  let scrollSpyTicking = false;
  function updateScrollSpy() {
    scrollSpyTicking = false;
    const targets = getActiveScrollTargets();
    if (targets.length === 0) return;
    const headerH = document.getElementById('main-header')?.offsetHeight || 80;
    const scrollPos = window.scrollY + headerH + 40;
    let current = targets[0].link;
    targets.forEach(t => { if (t.el.offsetTop <= scrollPos) current = t.link; });
    // Kalau sudah nyaris di dasar halaman, pastikan heading terakhir (Kontak) yang aktif
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = targets[targets.length - 1].link;
    }
    if (current && !current.classList.contains('active')) setActiveNav(current);
  }
  window.addEventListener('scroll', () => {
    if (!scrollSpyTicking) { window.requestAnimationFrame(updateScrollSpy); scrollSpyTicking = true; }
  });

  // Dipanggil dari luar (mis. setelah login/logout) supaya indikator langsung
  // menyesuaikan begitu heading yang tampil berubah, tanpa harus scroll dulu.
  window.__refreshNavScrollSpy = function() {
    requestAnimationFrame(updateScrollSpy);
  };
})();

// NAVBAR SCROLL
window.addEventListener('scroll', () => {
  document.getElementById('main-header').classList.toggle('scrolled', window.scrollY > 20);
});

// ===== WELCOME BANNER =====
function showWelcomeBanner() {
  const banner = document.getElementById('welcome-banner');
  if (!banner || !currentUser) return;
  banner.classList.remove('hidden');

  // Avatar & name
  const avatar = document.getElementById('wb-avatar');
  const username = document.getElementById('wb-username');
  const roleTag = document.getElementById('wb-role-tag');
  const greeting = document.getElementById('wb-greeting');

  if (avatar) avatar.textContent = currentUser.nama.charAt(0).toUpperCase();
  if (username) username.textContent = currentUser.nama;

  const roleColors = {
    admin: { label: 'Administrator', cls: 'wb-role-admin' },
    guru:  { label: 'Guru',          cls: 'wb-role-guru' },
    siswa: { label: 'Siswa',         cls: 'wb-role-siswa' },
  };
  const roleInfo = roleColors[currentUser.role] || roleColors.siswa;
  if (roleTag) { roleTag.textContent = roleInfo.label; roleTag.className = 'wb-role-tag ' + roleInfo.cls; }

  // Greeting by time
  const hour = new Date().getHours();
  const greetText = hour < 11 ? 'Selamat pagi,' : hour < 15 ? 'Selamat siang,' : hour < 18 ? 'Selamat sore,' : 'Selamat malam,';
  if (greeting) greeting.textContent = greetText;

  // Stats — anggota & transaksi hanya untuk admin
  const totalBorrows = history.length;
  const wbBooks = document.getElementById('wb-stat-books');
  const wbMembers = document.getElementById('wb-stat-members');
  const wbBorrows = document.getElementById('wb-stat-borrows');
  if (wbBooks) wbBooks.textContent = books.length;
  if (wbMembers) {
    wbMembers.textContent = users.filter(u => u.role !== 'admin').length;
    wbMembers.closest('.wb-stat-pill')?.classList.toggle('hidden', !isAdmin);
  }
  if (wbBorrows) {
    wbBorrows.textContent = totalBorrows;
    wbBorrows.closest('.wb-stat-pill')?.classList.toggle('hidden', !isAdmin);
  }

  // Today's date
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayEl = document.getElementById('wb-today-date');
  if (todayEl) todayEl.textContent = today;

  // Avatar background based on role
  if (avatar) {
    const bgMap = { admin: 'linear-gradient(150deg,#c08a2e,#9c6f1f)', guru: 'linear-gradient(150deg,#0f8a5f,#0b6b49)', siswa: 'linear-gradient(150deg,#1e4d8c,#163a6b)' };
    avatar.style.background = bgMap[currentUser.role] || bgMap.siswa;
  }

  // Quotes
  const quotes = [
    '"Membaca adalah jendela dunia — setiap buku membawa petualangan baru."',
    '"Ilmu adalah harta yang tidak akan habis meski dibagi-bagikan."',
    '"Satu buku yang kamu baca hari ini adalah investasi terbaik untuk masa depan."',
    '"Perpustakaan adalah tempat di mana masa lalu dan masa depan bertemu."',
    '"Orang yang membaca buku akan menguasai orang yang hanya menonton layar."',
  ];
  const quoteEl = document.getElementById('wb-quote');
  if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  // Admin-specific: show/hide dashboard btn label
  const dashBtn = document.getElementById('wb-dashboard-btn');
  if (dashBtn) {
    dashBtn.textContent = '';
    dashBtn.innerHTML = isAdmin
      ? '<i class="fa-solid fa-chart-simple"></i> Panel Admin'
      : '<i class="fa-solid fa-book-bookmark"></i> Buku Dipinjam';
  }
}

// ===== CHECK LOGIN STATE =====
function checkLoginState() {
  const btnNav = document.getElementById('btn-login-nav');
  const userChip = document.getElementById('user-chip');
  const userNameNav = document.getElementById('user-name-nav');
  const userAvatarNav = document.getElementById('user-avatar-nav');
  const roleBadge = document.getElementById('role-badge-nav');

  if (isLoggedIn && currentUser) {
    btnNav.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
    btnNav.classList.add('btn-logout-state');
    userChip.classList.remove('hidden');
    userNameNav.textContent = currentUser.nama;
    userAvatarNav.textContent = currentUser.nama.charAt(0).toUpperCase();
    const roleLabel = currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'guru' ? 'Guru' : 'Siswa';
    roleBadge.textContent = roleLabel;
    roleBadge.className = 'role-badge ' + (currentUser.role || 'siswa');
    document.getElementById('nav-dashboard').classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    // Show logo upload button only for admin
    const logoUploadBtn = document.getElementById('logo-upload-btn');
    if (logoUploadBtn) logoUploadBtn.classList.toggle('hidden', !isAdmin);
    if (isAdmin) {
      document.getElementById('nav-laporan').classList.remove('hidden');
      document.getElementById('laporan').classList.remove('hidden');
      renderLaporan();
    } else {
      document.getElementById('nav-laporan').classList.add('hidden');
      document.getElementById('laporan').classList.add('hidden');
    }
    // Hide hero, show welcome banner
    document.getElementById('beranda').classList.add('hidden');
    showWelcomeBanner();
    renderDashboard();
  } else {
    btnNav.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
    btnNav.classList.remove('btn-logout-state');
    btnNav.style.background = '';
    userChip.classList.add('hidden');
    document.getElementById('nav-dashboard').classList.add('hidden');
    document.getElementById('nav-laporan').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('laporan').classList.add('hidden');
    const logoUploadBtn = document.getElementById('logo-upload-btn');
    if (logoUploadBtn) logoUploadBtn.classList.add('hidden');
    // Show hero, hide welcome banner
    document.getElementById('beranda').classList.remove('hidden');
    document.getElementById('welcome-banner').classList.add('hidden');
  }
  renderKatalog(document.getElementById('search-input').value);
  updateHeroStats();
  // Heading yang tampil di nav berubah (Beranda/Dashboard/Laporan bisa muncul-hilang),
  // jadi indikator perlu langsung disesuaikan tanpa nunggu discroll dulu.
  if (window.__refreshNavScrollSpy) window.__refreshNavScrollSpy();
}

// ===== THEME TOGGLE (Light / Dark Mode) =====
function applyTheme(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
  }
  localStorage.setItem('libraryTheme', theme);
}

function initTheme() {
  // Tema sudah diterapkan lebih awal lewat script di <head> (mencegah kedipan),
  // di sini cukup sinkronkan ikon & localStorage sesuai state saat ini.
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.classList.remove(isDark ? 'fa-moon' : 'fa-sun');
    icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
  }
  if (!localStorage.getItem('libraryTheme')) {
    localStorage.setItem('libraryTheme', isDark ? 'dark' : 'light');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
}

document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);
initTheme();

// ===== INIT =====
checkLoginState();
loadAllData(); // muat buku, anggota, dan riwayat dari database MySQL saat halaman dibuka
