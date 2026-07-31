# Panduan Integrasi PHP + MySQL ke index.js

## 1. Struktur folder di server (XAMPP/Laragon)

```
htdocs/
└── perpustakaan/
    ├── index.html
    ├── index.css
    ├── index.js
    └── api/
        ├── config.php
        ├── buku.php
        ├── pengguna.php
        └── transaksi.php
```

## 2. Import database
Import file `perpustakaan_sma.sql` yang sudah dibuat sebelumnya ke MySQL
(lewat phpMyAdmin atau `mysql -u root -p < perpustakaan_sma.sql`).

## 3. Sesuaikan `config.php`
Buka `api/config.php`, sesuaikan `DB_USER` / `DB_PASS` dengan MySQL kamu.

## 4. Endpoint yang tersedia

| Endpoint                          | Method | Fungsi                                   |
|-----------------------------------|--------|-------------------------------------------|
| `api/buku.php`                    | GET    | Ambil semua buku                          |
| `api/buku.php`                    | POST   | Tambah buku baru                          |
| `api/buku.php`                    | PUT    | Update/edit buku                          |
| `api/buku.php`                    | DELETE | Hapus buku                                |
| `api/pengguna.php`                | GET    | Ambil semua anggota                       |
| `api/pengguna.php`                | POST   | Register anggota baru                     |
| `api/pengguna.php?action=login`   | POST   | Login (nis + password)                    |
| `api/pengguna.php`                | PUT    | Update password/nama                      |
| `api/pengguna.php`                | DELETE | Hapus anggota                             |
| `api/transaksi.php`               | POST   | Proses pinjam/kembali (`tipe: pinjam/kembali`) |
| `api/transaksi.php?action=riwayat`| GET    | Ambil riwayat transaksi                   |

## 5. Perubahan di `index.js`

Karena seluruh sistem lama sinkron (`localStorage`), sedangkan API berbasis
`fetch()` itu asinkron (`Promise`), bagian-bagian berikut **wajib** diubah
jadi `async/await`. Berikut titik-titik utama yang perlu diganti:

### a. Ganti load data awal (baris ~203-206)

**Sebelum:**
```javascript
let books = JSON.parse(localStorage.getItem('booksDB'));
let users = JSON.parse(localStorage.getItem('usersDB'));
let history = JSON.parse(localStorage.getItem('historyDB'));
let currentUser = JSON.parse(sessionStorage.getItem('activeUser')) || null;
```

**Sesudah:**
```javascript
const API_URL = 'api'; // ganti sesuai path server kamu

let books = [];
let users = [];
let history = [];
let currentUser = JSON.parse(sessionStorage.getItem('activeUser')) || null;

async function loadAllData() {
  const [bRes, uRes, hRes] = await Promise.all([
    fetch(`${API_URL}/buku.php`).then(r => r.json()),
    fetch(`${API_URL}/pengguna.php`).then(r => r.json()),
    fetch(`${API_URL}/transaksi.php?action=riwayat`).then(r => r.json())
  ]);
  books = bRes.data || [];
  users = uRes.data || [];
  history = hRes.data || [];
  renderBooks();      // panggil ulang fungsi render yang sudah ada
  renderDashboard();  // sesuaikan nama fungsi render yang ada di index.js kamu
}

loadAllData();
```

### b. Ganti `saveData()` (baris ~218-221)

`saveData()` lama menulis semua state ke `localStorage` sekaligus. Dengan
API, tiap aksi (tambah buku, pinjam, dsb) langsung `POST`/`PUT` ke server
saat aksinya terjadi — jadi `saveData()` tidak lagi dipakai untuk
buku/user/history. Cukup hapus pemanggilannya di bagian itu, atau biarkan
kosong:

```javascript
function saveData() {
  // Tidak lagi diperlukan untuk books/users/history — sudah disimpan
  // langsung ke database lewat fetch() di masing-masing aksi.
  // Tetap dipakai untuk data lokal ringan seperti tema, dsb bila perlu.
}
```

### c. Tambah buku (sekitar baris 1140-1165)

**Sebelum:**
```javascript
books.push({ id: newId, judul, pengarang, kategori, stok, cover: cover || '', penerbit, tahun, isbn });
saveData();
```

**Sesudah:**
```javascript
async function tambahBuku() {
  const judul = document.getElementById('input-judul-buku').value.trim();
  const pengarang = document.getElementById('input-pengarang-buku').value.trim();
  const kategori = document.getElementById('input-kategori-buku').value;
  const stok = parseInt(document.getElementById('input-stok-buku').value);
  const penerbit = document.getElementById('input-penerbit-buku').value.trim();
  const tahun = document.getElementById('input-tahun-buku').value.trim();
  const isbn = document.getElementById('input-isbn-buku').value.trim();
  const cover = coverFile || coverUrl; // sesuaikan dengan variabel cover yang sudah ada

  if (!judul || !pengarang || !kategori || isNaN(stok) || stok < 1) {
    showToast('Lengkapi data buku dengan benar.', 'error');
    return;
  }

  const res = await fetch(`${API_URL}/buku.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ judul, pengarang, kategori, stok, cover, penerbit, tahun, isbn })
  }).then(r => r.json());

  if (res.success) {
    showToast('Buku berhasil ditambahkan', 'success');
    await loadAllData(); // refresh data dari database
  } else {
    showToast(res.message || 'Gagal menambah buku', 'error');
  }
}
```

### d. Edit buku (sekitar baris 1100-1109)

```javascript
async function simpanEditBuku(id) {
  const payload = {
    id,
    judul: document.getElementById('edit-judul').value.trim(),
    pengarang: document.getElementById('edit-pengarang').value.trim(),
    kategori: document.getElementById('edit-kategori').value,
    stok: parseInt(document.getElementById('edit-stok').value) || 0,
    penerbit: document.getElementById('edit-penerbit').value.trim(),
    tahun: document.getElementById('edit-tahun').value.trim(),
    isbn: document.getElementById('edit-isbn').value.trim(),
    cover: coverFile || coverUrl
  };

  const res = await fetch(`${API_URL}/buku.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.success) {
    showToast('Buku berhasil diperbarui', 'success');
    await loadAllData();
  } else {
    showToast(res.message || 'Gagal memperbarui buku', 'error');
  }
}
```

### e. Hapus buku (sekitar baris 1126-1127)

```javascript
async function hapusBuku(id) {
  const res = await fetch(`${API_URL}/buku.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).then(r => r.json());

  if (res.success) {
    showToast('Buku dihapus', 'success');
    await loadAllData();
  }
}
```

### f. Pinjam / Kembalikan buku (proses scan QR, sekitar baris 959-1019)

Setiap kali sistem menyetujui transaksi (approve pinjam/kembali di modal
konfirmasi admin), panggil:

```javascript
async function prosesTransaksi(nis, idBuku, tipe) {
  // tipe: 'pinjam' atau 'kembali'
  const res = await fetch(`${API_URL}/transaksi.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nis, id_buku: idBuku, tipe })
  }).then(r => r.json());

  if (res.success) {
    showToast(res.message, 'success');
    await loadAllData();
  } else {
    showToast(res.message, 'error');
  }
}
```

Panggil `prosesTransaksi(...)` ini di dalam handler tombol "Ya, Setujui"
(`confirm-ok-btn`), menggantikan logika manual push/filter ke
`targetUser.borrowed` yang lama.

### g. Login & Register (sekitar baris 1234 dan fungsi login)

**Login:**
```javascript
async function login(nis, password) {
  const res = await fetch(`${API_URL}/pengguna.php?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nis, password })
  }).then(r => r.json());

  if (res.success) {
    currentUser = res.data;
    sessionStorage.setItem('activeUser', JSON.stringify(currentUser));
    // lanjutkan render UI setelah login seperti kode lama
  } else {
    showToast(res.message, 'error');
  }
}
```

**Register:**
```javascript
async function registerAnggota(nis, nama, password, role) {
  const res = await fetch(`${API_URL}/pengguna.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nis, nama, password, role })
  }).then(r => r.json());

  if (res.success) {
    showToast('Registrasi berhasil', 'success');
    await loadAllData();
  } else {
    showToast(res.message, 'error');
  }
}
```

## 6. Catatan penting

- Semua fungsi yang tadinya sinkron (langsung `books.push(...)` lalu render)
  sekarang **harus `async`** dan dipanggil dengan `await`, karena butuh
  menunggu respons server.
- Setelah tiap aksi berhasil, panggil ulang `loadAllData()` supaya tampilan
  selalu sinkron dengan isi database — jangan lagi mengandalkan variabel
  `books`/`users` lokal yang diubah manual.
- Password di skema ini masih plain text (mengikuti sistem lama). Untuk
  keamanan nyata, gunakan `password_hash()` saat register dan
  `password_verify()` saat login di `pengguna.php`.
- Jalankan lewat `http://localhost/perpustakaan/index.html` (bukan `file://`),
  karena `fetch()` ke PHP butuh dilayani oleh web server (Apache/Nginx).
