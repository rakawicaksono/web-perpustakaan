<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ===== GET: riwayat transaksi (menggantikan historyDB) =====
if ($method === 'GET' && $action === 'riwayat') {
  $stmt = $pdo->query("SELECT * FROM riwayat_transaksi ORDER BY waktu DESC");
  sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ===== POST: proses pinjam / kembalikan buku =====
if ($method === 'POST') {
  $input = getJsonInput();
  $nis      = trim($input['nis'] ?? '');
  $idBuku   = intval($input['id_buku'] ?? 0);
  $tipe     = trim($input['tipe'] ?? ''); // 'pinjam' atau 'kembali'

  if (!$nis || !$idBuku || !in_array($tipe, ['pinjam', 'kembali'])) {
    sendResponse(['success' => false, 'message' => 'Data transaksi tidak valid.'], 400);
  }

  $user = $pdo->prepare("SELECT * FROM pengguna WHERE nis = :nis");
  $user->execute([':nis' => $nis]);
  $user = $user->fetch(PDO::FETCH_ASSOC);
  if (!$user) sendResponse(['success' => false, 'message' => 'Pengguna tidak ditemukan.'], 404);

  $buku = $pdo->prepare("SELECT * FROM buku WHERE id = :id");
  $buku->execute([':id' => $idBuku]);
  $buku = $buku->fetch(PDO::FETCH_ASSOC);
  if (!$buku) sendResponse(['success' => false, 'message' => 'Buku tidak ditemukan.'], 404);

  $pdo->beginTransaction();
  try {
    if ($tipe === 'pinjam') {
      // cek batas maksimal 3 buku aktif
      $cek = $pdo->prepare("SELECT COUNT(*) AS total FROM peminjaman WHERE id_pengguna = :id AND status = 'dipinjam'");
      $cek->execute([':id' => $user['id']]);
      if ($cek->fetch()['total'] >= 3) {
        throw new Exception('Anggota sudah meminjam maksimal 3 buku.');
      }
      if ($buku['stok'] < 1) {
        throw new Exception('Stok buku habis.');
      }

      $pdo->prepare("INSERT INTO peminjaman (id_pengguna, id_buku, status) VALUES (:u, :b, 'dipinjam')")
          ->execute([':u' => $user['id'], ':b' => $idBuku]);

      $pdo->prepare("UPDATE buku SET stok = stok - 1 WHERE id = :id")->execute([':id' => $idBuku]);

    } else { // kembali
      $pinjam = $pdo->prepare("SELECT * FROM peminjaman WHERE id_pengguna = :u AND id_buku = :b AND status = 'dipinjam' LIMIT 1");
      $pinjam->execute([':u' => $user['id'], ':b' => $idBuku]);
      $pinjam = $pinjam->fetch(PDO::FETCH_ASSOC);
      if (!$pinjam) throw new Exception('Data peminjaman tidak ditemukan.');

      $pdo->prepare("UPDATE peminjaman SET status = 'dikembalikan' WHERE id = :id")
          ->execute([':id' => $pinjam['id']]);

      $pdo->prepare("UPDATE buku SET stok = stok + 1 WHERE id = :id")->execute([':id' => $idBuku]);
    }

    // catat ke riwayat_transaksi
    $pdo->prepare("INSERT INTO riwayat_transaksi (id_pengguna, id_buku, nama, nis, role, judul_buku, tipe)
                   VALUES (:idu, :idb, :nama, :nis, :role, :judul, :tipe)")
        ->execute([
          ':idu' => $user['id'], ':idb' => $idBuku, ':nama' => $user['nama'],
          ':nis' => $user['nis'], ':role' => $user['role'], ':judul' => $buku['judul'], ':tipe' => $tipe
        ]);

    $pdo->commit();
    sendResponse(['success' => true, 'message' => $tipe === 'pinjam' ? 'Peminjaman berhasil' : 'Pengembalian berhasil']);

  } catch (Exception $e) {
    $pdo->rollBack();
    sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
  }
}

sendResponse(['success' => false, 'message' => 'Request tidak dikenali'], 400);
