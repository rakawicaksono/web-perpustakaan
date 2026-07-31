<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {

  // ===== GET: daftar semua pengguna (untuk dashboard admin) =====
  case 'GET':
    $stmt = $pdo->query("SELECT id, nis, nama, role, nuptk FROM pengguna ORDER BY id ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // sertakan daftar buku yang sedang dipinjam tiap user (menggantikan field `borrowed`)
    foreach ($users as &$u) {
      $s = $pdo->prepare("SELECT id_buku FROM peminjaman WHERE id_pengguna = :id AND status = 'dipinjam'");
      $s->execute([':id' => $u['id']]);
      $u['borrowed'] = array_column($s->fetchAll(PDO::FETCH_ASSOC), 'id_buku');
    }
    sendResponse(['success' => true, 'data' => $users]);
    break;

  // ===== POST: register akun baru / login =====
  case 'POST':
    $input = getJsonInput();

    if ($action === 'login') {
      $nis = trim($input['nis'] ?? '');
      $password = trim($input['password'] ?? '');

      $stmt = $pdo->prepare("SELECT * FROM pengguna WHERE nis = :nis");
      $stmt->execute([':nis' => $nis]);
      $user = $stmt->fetch(PDO::FETCH_ASSOC);

      if (!$user) {
        sendResponse(['success' => false, 'message' => 'NIS/NUPTK tidak ditemukan.'], 401);
      }

      // NOTE: bandingkan plain text di sini karena skema awal memakai plain text.
      // Untuk produksi sebaiknya pakai password_hash()/password_verify().
      //
      // Admin WAJIB isi password yang cocok persis.
      // Siswa/Guru cukup login dengan NIS/NUPTK saja (form login mereka memang
      // tidak menampilkan kolom password) — KECUALI akun itu sudah punya password
      // tersimpan (mis. pernah diatur admin atau lewat "Lupa Password"), maka
      // password tsb wajib cocok.
      if ($user['role'] === 'admin') {
        if ($user['password'] !== $password) {
          sendResponse(['success' => false, 'message' => 'Username atau password salah.'], 401);
        }
      } else {
        $hasPassword = isset($user['password']) && $user['password'] !== '';
        if ($hasPassword && $user['password'] !== $password) {
          sendResponse(['success' => false, 'message' => 'Password salah.'], 401);
        }
      }

      $s = $pdo->prepare("SELECT id_buku FROM peminjaman WHERE id_pengguna = :id AND status = 'dipinjam'");
      $s->execute([':id' => $user['id']]);
      $user['borrowed'] = array_column($s->fetchAll(PDO::FETCH_ASSOC), 'id_buku');
      unset($user['password']); // jangan kirim balik password ke client

      sendResponse(['success' => true, 'data' => $user]);

    } else {
      // registrasi anggota baru (dari form register publik ATAU dari admin panel)
      $nis = trim($input['nis'] ?? '');
      $nama = trim($input['nama'] ?? '');
      $password = trim($input['password'] ?? '');
      $role = trim($input['role'] ?? 'siswa');
      $nuptk = trim($input['nuptk'] ?? '');

      // Password wajib diisi HANYA untuk role admin.
      // Siswa/Guru boleh tanpa password (login cukup NIS/NUPTK).
      if (!$nis || !$nama || ($role === 'admin' && !$password)) {
        sendResponse(['success' => false, 'message' => 'Data registrasi tidak lengkap.'], 400);
      }

      $cek = $pdo->prepare("SELECT id FROM pengguna WHERE nis = :nis");
      $cek->execute([':nis' => $nis]);
      if ($cek->fetch()) {
        sendResponse(['success' => false, 'message' => 'NIS sudah terdaftar.'], 409);
      }

      $stmt = $pdo->prepare("INSERT INTO pengguna (nis, nama, password, role, nuptk)
                             VALUES (:nis, :nama, :password, :role, :nuptk)");
      $stmt->execute([
        ':nis' => $nis, ':nama' => $nama, ':password' => $password,
        ':role' => $role, ':nuptk' => $nuptk ?: null
      ]);

      sendResponse(['success' => true, 'message' => 'Registrasi berhasil', 'id' => $pdo->lastInsertId()]);
    }
    break;

  // ===== PUT: update password / data user =====
  case 'PUT':
    $input = getJsonInput();
    $nis = trim($input['nis'] ?? '');
    if (!$nis) sendResponse(['success' => false, 'message' => 'NIS tidak ditemukan.'], 400);

    if (isset($input['password'])) {
      $stmt = $pdo->prepare("UPDATE pengguna SET password = :password WHERE nis = :nis");
      $stmt->execute([':password' => $input['password'], ':nis' => $nis]);
    }
    if (isset($input['nama'])) {
      $stmt = $pdo->prepare("UPDATE pengguna SET nama = :nama WHERE nis = :nis");
      $stmt->execute([':nama' => $input['nama'], ':nis' => $nis]);
    }

    sendResponse(['success' => true, 'message' => 'Data pengguna diperbarui']);
    break;

  // ===== DELETE: hapus anggota =====
  case 'DELETE':
    $input = getJsonInput();
    $nis = trim($input['nis'] ?? ($_GET['nis'] ?? ''));
    if (!$nis) sendResponse(['success' => false, 'message' => 'NIS tidak ditemukan.'], 400);

    $stmt = $pdo->prepare("DELETE FROM pengguna WHERE nis = :nis");
    $stmt->execute([':nis' => $nis]);

    sendResponse(['success' => true, 'message' => 'Anggota dihapus']);
    break;

  default:
    sendResponse(['success' => false, 'message' => 'Method tidak didukung'], 405);
}