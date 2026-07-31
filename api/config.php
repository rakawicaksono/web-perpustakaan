<?php
// ===== KONFIGURASI DATABASE =====
// Sesuaikan dengan pengaturan MySQL di server/hosting kamu (mis. XAMPP/Laragon).

define('DB_HOST', 'localhost');
define('DB_PORT', '3307');       // MySQL XAMPP kamu jalan di port 3307 (cek XAMPP Control Panel)
define('DB_NAME', 'perpustakaan_sma');
define('DB_USER', 'root');       // ganti sesuai user MySQL kamu
define('DB_PASS', '');           // ganti sesuai password MySQL kamu

// Header umum untuk semua endpoint (API dipanggil via fetch() dari index.js)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // longgarkan CORS untuk dev lokal
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

function getDB() {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
  DB_USER,
  DB_PASS,
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
    } catch (PDOException $e) {
      http_response_code(500);
      echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
      exit;
    }
  }
  return $pdo;
}

// Helper: ambil JSON body dari request POST/PUT
function getJsonInput() {
  $data = json_decode(file_get_contents('php://input'), true);
  return $data ?? [];
}

// Helper: kirim response JSON lalu selesai
function sendResponse($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data);
  exit;
}