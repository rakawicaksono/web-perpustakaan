<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  // ===== GET: ambil semua buku =====
  case 'GET':
    $stmt = $pdo->query("SELECT * FROM buku ORDER BY id ASC");
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['success' => true, 'data' => $books]);
    break;

  // ===== POST: tambah buku baru =====
  case 'POST':
    $input = getJsonInput();

    $judul     = trim($input['judul'] ?? '');
    $pengarang = trim($input['pengarang'] ?? '');
    $kategori  = trim($input['kategori'] ?? '');
    $stok      = intval($input['stok'] ?? 0);
    $cover     = trim($input['cover'] ?? '');
    $penerbit  = trim($input['penerbit'] ?? '');
    $tahun     = !empty($input['tahun']) ? intval($input['tahun']) : null;
    $isbn      = trim($input['isbn'] ?? '');

    if (!$judul || !$pengarang || !$kategori || $stok < 0) {
      sendResponse(['success' => false, 'message' => 'Data buku tidak lengkap/valid.'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO buku (judul, pengarang, kategori, stok, cover, penerbit, tahun, isbn)
                           VALUES (:judul, :pengarang, :kategori, :stok, :cover, :penerbit, :tahun, :isbn)");
    $stmt->execute([
      ':judul' => $judul, ':pengarang' => $pengarang, ':kategori' => $kategori,
      ':stok' => $stok, ':cover' => $cover, ':penerbit' => $penerbit,
      ':tahun' => $tahun, ':isbn' => $isbn
    ]);

    sendResponse(['success' => true, 'message' => 'Buku ditambahkan', 'id' => $pdo->lastInsertId()]);
    break;

  // ===== PUT: update buku (edit) =====
  case 'PUT':
    $input = getJsonInput();
    $id = intval($input['id'] ?? 0);
    if (!$id) sendResponse(['success' => false, 'message' => 'ID buku tidak ditemukan.'], 400);

    $stmt = $pdo->prepare("UPDATE buku SET
        judul = :judul, pengarang = :pengarang, kategori = :kategori,
        stok = :stok, cover = :cover, penerbit = :penerbit,
        tahun = :tahun, isbn = :isbn
      WHERE id = :id");
    $stmt->execute([
      ':judul' => trim($input['judul'] ?? ''),
      ':pengarang' => trim($input['pengarang'] ?? ''),
      ':kategori' => trim($input['kategori'] ?? ''),
      ':stok' => intval($input['stok'] ?? 0),
      ':cover' => trim($input['cover'] ?? ''),
      ':penerbit' => trim($input['penerbit'] ?? ''),
      ':tahun' => !empty($input['tahun']) ? intval($input['tahun']) : null,
      ':isbn' => trim($input['isbn'] ?? ''),
      ':id' => $id
    ]);

    sendResponse(['success' => true, 'message' => 'Buku diperbarui']);
    break;

  // ===== DELETE: hapus buku =====
  case 'DELETE':
    $input = getJsonInput();
    $id = intval($input['id'] ?? ($_GET['id'] ?? 0));
    if (!$id) sendResponse(['success' => false, 'message' => 'ID buku tidak ditemukan.'], 400);

    $stmt = $pdo->prepare("DELETE FROM buku WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendResponse(['success' => true, 'message' => 'Buku dihapus']);
    break;

  default:
    sendResponse(['success' => false, 'message' => 'Method tidak didukung'], 405);
}
