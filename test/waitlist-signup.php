<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'ok' => false,
        'message' => 'Method not allowed.',
    ));
    exit;
}

$email = trim((string) ($_POST['email'] ?? ''));
$source = trim((string) ($_POST['source'] ?? 'home-early-access'));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(array(
        'ok' => false,
        'message' => 'Please enter a valid email address.',
    ));
    exit;
}

$payload = array(
    'createdAt' => date('c'),
    'email' => $email,
    'source' => $source,
    'ip' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : null,
    'userAgent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null,
);

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}

$filePath = $dataDir . DIRECTORY_SEPARATOR . 'waitlist-emails.jsonl';
$jsonOptions = defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0;
$written = @file_put_contents($filePath, json_encode($payload, $jsonOptions) . PHP_EOL, FILE_APPEND | LOCK_EX);

if ($written === false) {
    http_response_code(500);
    echo json_encode(array(
        'ok' => false,
        'message' => 'Unable to save your request right now.',
    ));
    exit;
}

echo json_encode(array(
    'ok' => true,
    'message' => 'Thanks! We will notify you at launch.',
));
