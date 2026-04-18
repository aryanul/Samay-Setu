<?php
declare(strict_types=1);

session_start();

const SESSION_AUTH_KEY = 'samaysetu_admin_authenticated';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'SamaySetu@2026';

$loginError = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout'])) {
    $_SESSION = array();
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
    header('Location: admin.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    $usernameValid = hash_equals(ADMIN_USERNAME, $username);
    $passwordValid = hash_equals(ADMIN_PASSWORD, $password);

    if ($usernameValid && $passwordValid) {
        session_regenerate_id(true);
        $_SESSION[SESSION_AUTH_KEY] = true;
        header('Location: admin.php');
        exit;
    }

    $loginError = 'Invalid username or password.';
}

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function formatDateTime(string $value): string
{
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return $value;
    }

    return date('d M Y, h:i A', $timestamp);
}

function readJsonlRows(string $path): array
{
    if (!is_file($path) || !is_readable($path)) {
        return array();
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return array();
    }

    $rows = array();
    foreach ($lines as $line) {
        $decoded = json_decode($line, true);
        if (!is_array($decoded)) {
            continue;
        }
        $rows[] = $decoded;
    }

    // Newest first for easier admin review.
    return array_reverse($rows);
}

$isAuthenticated = !empty($_SESSION[SESSION_AUTH_KEY]);
$applicationsFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'applications.jsonl';
$waitlistEmailsFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'waitlist-emails.jsonl';
$applications = $isAuthenticated ? readJsonlRows($applicationsFile) : array();
$waitlistEmails = $isAuthenticated ? readJsonlRows($waitlistEmailsFile) : array();

$view = 'dashboard';
if ($isAuthenticated) {
    $requestedView = isset($_GET['view']) ? trim((string) $_GET['view']) : 'dashboard';
    $allowedViews = array('dashboard', 'applications', 'emails');
    if (in_array($requestedView, $allowedViews, true)) {
        $view = $requestedView;
    }
}

$applicationsToday = 0;
$emailsToday = 0;
$localityCounts = array();
$recentApplications = array_slice($applications, 0, 5);
$recentEmails = array_slice($waitlistEmails, 0, 5);
$recentActivity = array();
$todayKey = date('Y-m-d');

if ($isAuthenticated) {
    foreach ($applications as $app) {
        $createdAt = (string) ($app['createdAt'] ?? '');
        $timestamp = strtotime($createdAt);
        if ($timestamp !== false && date('Y-m-d', $timestamp) === $todayKey) {
            $applicationsToday++;
        }

        $locality = trim((string) ($app['locality'] ?? ''));
        if ($locality === '') {
            $locality = 'Unknown';
        }
        if (!isset($localityCounts[$locality])) {
            $localityCounts[$locality] = 0;
        }
        $localityCounts[$locality]++;

        $recentActivity[] = array(
            'type' => 'Application',
            'label' => (string) ($app['name'] ?? 'Unknown applicant'),
            'meta' => $locality,
            'createdAt' => $createdAt,
            'timestamp' => $timestamp !== false ? $timestamp : 0,
        );
    }

    foreach ($waitlistEmails as $emailRow) {
        $createdAt = (string) ($emailRow['createdAt'] ?? '');
        $timestamp = strtotime($createdAt);
        if ($timestamp !== false && date('Y-m-d', $timestamp) === $todayKey) {
            $emailsToday++;
        }

        $recentActivity[] = array(
            'type' => 'Email',
            'label' => (string) ($emailRow['email'] ?? 'Unknown email'),
            'meta' => (string) ($emailRow['source'] ?? 'homepage-early-access'),
            'createdAt' => $createdAt,
            'timestamp' => $timestamp !== false ? $timestamp : 0,
        );
    }

    usort($recentActivity, static function ($a, $b) {
        return (int) $b['timestamp'] <=> (int) $a['timestamp'];
    });
    $recentActivity = array_slice($recentActivity, 0, 8);
}

$topLocality = 'No data yet';
if (!empty($localityCounts)) {
    arsort($localityCounts);
    $localityNames = array_keys($localityCounts);
    $topLocality = (string) $localityNames[0];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Samay Setu Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #1a1a18;
      --stone: #3d3b35;
      --gold: #c9a96e;
      --gold-soft: #e8d5b0;
      --paper: #f8f4ee;
      --mist: #f0ece5;
      --white: #ffffff;
      --ok: #2a6d54;
      --error: #8f2f2f;
      --border: rgba(26, 26, 24, 0.14);
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans: "DM Sans", Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--sans);
      color: var(--ink);
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% 0%, rgba(201, 169, 110, 0.2), transparent 35%),
        radial-gradient(circle at 94% 8%, rgba(26, 26, 24, 0.1), transparent 34%),
        linear-gradient(180deg, #faf6f0 0%, #f4efe8 100%);
    }

    .wrap {
      width: min(1180px, calc(100% - 28px));
      margin: 20px auto 40px;
      padding: 0 16px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 18px;
      padding: 14px 18px;
      border: 1px solid var(--border);
      border-radius: 16px;
      backdrop-filter: blur(8px);
      background: rgba(250, 246, 240, 0.82);
      box-shadow: 0 10px 26px rgba(26, 26, 24, 0.07);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--ink);
    }

    .logo-text {
      font-family: var(--serif);
      font-size: 1.32rem;
      letter-spacing: 0.02em;
    }

    .logo-text span {
      color: var(--gold);
    }

    .pilot-chip {
      border: 1px solid var(--border);
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(255, 255, 255, 0.88);
      color: var(--stone);
    }

    .card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.76));
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 22px 50px rgba(41, 37, 30, 0.08);
    }

    h1 {
      font-family: var(--serif);
      font-size: clamp(1.85rem, 3vw, 2.3rem);
      font-weight: 500;
      margin: 0 0 10px;
    }

    .muted {
      color: #5c584f;
      font-size: 0.88rem;
      margin-bottom: 18px;
    }

    form {
      display: grid;
      gap: 12px;
      max-width: 380px;
    }

    label {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      color: #504a3f;
    }

    input {
      width: 100%;
      border: 1px solid #d8cdbd;
      background: #fffdfa;
      border-radius: 11px;
      padding: 12px 13px;
      font-size: 0.95rem;
      color: #2a2722;
      outline: none;
    }

    input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.18);
    }

    button {
      border: none;
      border-radius: 11px;
      padding: 11px 16px;
      background: var(--ink);
      color: #fff;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: transform 0.18s ease, background 0.18s ease;
    }

    button:hover {
      background: #2b2b27;
      transform: translateY(-1px);
    }

    .logout-form {
      display: inline;
    }

    .error {
      color: var(--error);
      background: rgba(143, 47, 47, 0.08);
      border: 1px solid rgba(143, 47, 47, 0.2);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 0.88rem;
      margin-bottom: 8px;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .top-row .left h1 {
      margin-bottom: 6px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .count-chip {
      border: 1px solid rgba(42, 109, 84, 0.25);
      background: linear-gradient(90deg, rgba(42, 109, 84, 0.12), rgba(255, 255, 255, 0.82));
      color: #23493b;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }

    .admin-nav {
      margin: 12px 0 18px;
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.75);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-link {
      text-decoration: none;
      color: #413d36;
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .nav-link:hover {
      border-color: #dfd2bf;
      background: #fcf8f2;
    }

    .nav-link.active {
      color: #23493b;
      border-color: rgba(42, 109, 84, 0.28);
      background: linear-gradient(90deg, rgba(42, 109, 84, 0.12), rgba(255, 255, 255, 0.84));
    }

    .badge {
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 0.67rem;
      letter-spacing: 0.05em;
      background: #f2ece3;
      color: #615a4f;
      border: 1px solid #e2d7c8;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.92);
      padding: 14px;
      box-shadow: 0 8px 20px rgba(26, 26, 24, 0.04);
    }

    .stat-title {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6f685b;
      margin-bottom: 8px;
    }

    .stat-value {
      font-family: var(--serif);
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 6px;
    }

    .stat-sub {
      font-size: 0.78rem;
      color: #5c584f;
    }

    .panels-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 14px;
    }

    .panel {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.92);
      padding: 14px;
      box-shadow: 0 8px 20px rgba(26, 26, 24, 0.04);
    }

    .panel h3 {
      font-family: var(--serif);
      font-size: 1.28rem;
      margin-bottom: 10px;
    }

    .activity-list {
      list-style: none;
      display: grid;
      gap: 8px;
    }

    .activity-item {
      border: 1px solid #e6dbca;
      background: #fcf9f4;
      border-radius: 10px;
      padding: 10px;
      display: grid;
      gap: 3px;
    }

    .activity-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tag {
      border-radius: 999px;
      font-size: 0.64rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
      padding: 2px 8px;
      border: 1px solid #ddd0bc;
      background: #f5ecdf;
      color: #655f53;
    }

    .tag.email {
      border-color: rgba(42, 109, 84, 0.24);
      background: rgba(42, 109, 84, 0.1);
      color: #23493b;
    }

    .activity-label {
      font-size: 0.86rem;
      color: #292621;
      word-break: break-word;
    }

    .activity-meta {
      font-size: 0.76rem;
      color: #6e675c;
    }

    .split-note {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 0.78rem;
      color: #5e584e;
    }

    .split-note span {
      border: 1px dashed #d8ccb9;
      padding: 5px 8px;
      border-radius: 8px;
      background: #fdf9f2;
    }

    .section-block {
      margin-top: 22px;
    }

    .section-title {
      font-family: var(--serif);
      font-size: 1.35rem;
      margin-bottom: 10px;
    }

    .section-note {
      color: #5c584f;
      font-size: 0.84rem;
      margin-bottom: 12px;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
      background: #fff;
    }

    th, td {
      text-align: left;
      vertical-align: top;
      padding: 10px 12px;
      border-bottom: 1px solid #ece8df;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    th {
      background: #f6f1e8;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: #5f594f;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tbody tr:hover td {
      background: #fcf8f2;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .empty {
      padding: 16px;
      color: #6d665b;
      background: #fcf8f2;
      border: 1px dashed #d9ccb7;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    code {
      font-family: Consolas, monospace;
      background: #f1ece3;
      border: 1px solid #e3d8c7;
      border-radius: 6px;
      padding: 2px 5px;
      font-size: 0.8rem;
    }

    @media (max-width: 760px) {
      .wrap {
        width: min(1180px, calc(100% - 16px));
        margin: 12px auto 20px;
        padding: 0 6px;
      }

      .topbar {
        padding: 10px 12px;
        border-radius: 14px;
      }

      .logo-text {
        font-size: 1.1rem;
      }

      .pilot-chip {
        width: 100%;
        text-align: center;
      }

      .card {
        border-radius: 16px;
        padding: 16px;
      }

      .admin-nav {
        gap: 6px;
      }

      .nav-link {
        width: 100%;
        justify-content: space-between;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .panels-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="topbar">
      <a class="brand" href="index.php" aria-label="Samay Setu">
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" stroke-width="2" stroke-linecap="round"/>
          <circle cx="8" cy="24" r="2.5" fill="#C9A96E"/>
          <circle cx="28" cy="12" r="2.5" fill="#1a1a18"/>
        </svg>
        <span class="logo-text">samay <span>setu</span></span>
      </a>
      <div class="pilot-chip">Admin Console</div>
    </header>

    <div class="card">
      <?php if (!$isAuthenticated): ?>
        <h1>Admin Login</h1>
        <p class="muted">Use your admin credentials to view submitted applications.</p>
        <?php if ($loginError !== ''): ?>
          <p class="error"><?php echo esc($loginError); ?></p>
        <?php endif; ?>
        <form method="post" autocomplete="off">
          <input type="hidden" name="login" value="1">
          <div>
            <label for="username">Username</label>
            <input id="username" name="username" type="text" required>
          </div>
          <div>
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required>
          </div>
          <button type="submit">Login</button>
        </form>
      <?php else: ?>
        <div class="top-row">
          <div class="left">
            <h1>Admin Dashboard</h1>
            <div class="meta-row">
              <span class="count-chip"><?php echo count($applications); ?> applications</span>
              <span class="count-chip"><?php echo count($waitlistEmails); ?> emails</span>
            </div>
          </div>
          <form method="post" class="logout-form">
            <input type="hidden" name="logout" value="1">
            <button type="submit">Logout</button>
          </form>
        </div>

        <nav class="admin-nav" aria-label="Admin sections">
          <a href="admin.php?view=dashboard" class="nav-link <?php echo $view === 'dashboard' ? 'active' : ''; ?>">
            Dashboard
          </a>
          <a href="admin.php?view=applications" class="nav-link <?php echo $view === 'applications' ? 'active' : ''; ?>">
            Join Circle
            <span class="badge"><?php echo count($applications); ?></span>
          </a>
          <a href="admin.php?view=emails" class="nav-link <?php echo $view === 'emails' ? 'active' : ''; ?>">
            Email Waitlist
            <span class="badge"><?php echo count($waitlistEmails); ?></span>
          </a>
        </nav>

        <?php if ($view === 'dashboard'): ?>
          <section class="stats-grid">
            <article class="stat-card">
              <p class="stat-title">Total Applications</p>
              <p class="stat-value"><?php echo count($applications); ?></p>
              <p class="stat-sub">Founding membership requests</p>
            </article>
            <article class="stat-card">
              <p class="stat-title">Total Waitlist Emails</p>
              <p class="stat-value"><?php echo count($waitlistEmails); ?></p>
              <p class="stat-sub">Homepage early-access signups</p>
            </article>
            <article class="stat-card">
              <p class="stat-title">Today's Entries</p>
              <p class="stat-value"><?php echo $applicationsToday + $emailsToday; ?></p>
              <p class="stat-sub"><?php echo $applicationsToday; ?> applications • <?php echo $emailsToday; ?> emails</p>
            </article>
            <article class="stat-card">
              <p class="stat-title">Top Locality</p>
              <p class="stat-value" style="font-size:1.35rem;"><?php echo esc($topLocality); ?></p>
              <p class="stat-sub">Most application activity</p>
            </article>
          </section>

          <section class="panels-grid">
            <article class="panel">
              <h3>Recent Activity</h3>
              <?php if (!$recentActivity): ?>
                <div class="empty">No activity found yet. New entries will appear here.</div>
              <?php else: ?>
                <ul class="activity-list">
                  <?php foreach ($recentActivity as $activity): ?>
                    <li class="activity-item">
                      <div class="activity-top">
                        <span class="tag <?php echo strtolower((string) $activity['type']) === 'email' ? 'email' : ''; ?>">
                          <?php echo esc((string) $activity['type']); ?>
                        </span>
                        <span class="activity-meta"><?php echo esc(formatDateTime((string) $activity['createdAt'])); ?></span>
                      </div>
                      <p class="activity-label"><?php echo esc((string) $activity['label']); ?></p>
                      <p class="activity-meta"><?php echo esc((string) $activity['meta']); ?></p>
                    </li>
                  <?php endforeach; ?>
                </ul>
              <?php endif; ?>
            </article>

            <article class="panel">
              <h3>Quick Snapshot</h3>
              <p class="section-note">Use the navbar tabs to inspect complete records.</p>
              <div class="split-note">
                <span>Apps file: <code>data/applications.jsonl</code></span>
                <span>Emails file: <code>data/waitlist-emails.jsonl</code></span>
              </div>

              <h3 style="margin-top:16px;">Latest Entries</h3>
              <ul class="activity-list">
                <?php if ($recentApplications): ?>
                  <li class="activity-item">
                    <div class="activity-top">
                      <span class="tag">Application</span>
                    </div>
                    <p class="activity-label"><?php echo esc((string) ($recentApplications[0]['name'] ?? 'Unknown applicant')); ?></p>
                    <p class="activity-meta"><?php echo esc(formatDateTime((string) ($recentApplications[0]['createdAt'] ?? ''))); ?></p>
                  </li>
                <?php endif; ?>
                <?php if ($recentEmails): ?>
                  <li class="activity-item">
                    <div class="activity-top">
                      <span class="tag email">Email</span>
                    </div>
                    <p class="activity-label"><?php echo esc((string) ($recentEmails[0]['email'] ?? 'Unknown email')); ?></p>
                    <p class="activity-meta"><?php echo esc(formatDateTime((string) ($recentEmails[0]['createdAt'] ?? ''))); ?></p>
                  </li>
                <?php endif; ?>
                <?php if (!$recentApplications && !$recentEmails): ?>
                  <li class="activity-item">
                    <p class="activity-label">No recent records yet.</p>
                  </li>
                <?php endif; ?>
              </ul>
            </article>
          </section>
        <?php endif; ?>

        <?php if ($view === 'applications'): ?>
          <section class="section-block">
            <h2 class="section-title">Join Circle Applications</h2>
            <p class="section-note">Data source: <?php echo esc($applicationsFile); ?></p>
            <?php if (!$applications): ?>
              <div class="empty">No application data found yet in <code>data/applications.jsonl</code>.</div>
            <?php else: ?>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Created At</th>
                      <th>Name</th>
                      <th>WhatsApp</th>
                      <th>Locality</th>
                      <th>Offer</th>
                      <th>Need</th>
                      <th>Source</th>
                      <th>IP</th>
                      <th>User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($applications as $row): ?>
                      <tr>
                        <td><?php echo esc(formatDateTime((string) ($row['createdAt'] ?? ''))); ?></td>
                        <td><?php echo esc((string) ($row['name'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['whatsapp'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['locality'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['offer'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['need'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['source'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['ip'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['userAgent'] ?? '')); ?></td>
                      </tr>
                    <?php endforeach; ?>
                  </tbody>
                </table>
              </div>
            <?php endif; ?>
          </section>
        <?php endif; ?>

        <?php if ($view === 'emails'): ?>
          <section class="section-block">
            <h2 class="section-title">Homepage Early Access Emails</h2>
            <p class="section-note">Data source: <?php echo esc($waitlistEmailsFile); ?></p>
            <?php if (!$waitlistEmails): ?>
              <div class="empty">No email signups yet in <code>data/waitlist-emails.jsonl</code>.</div>
            <?php else: ?>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Created At</th>
                      <th>Email</th>
                      <th>Source</th>
                      <th>IP</th>
                      <th>User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <?php foreach ($waitlistEmails as $row): ?>
                      <tr>
                        <td><?php echo esc(formatDateTime((string) ($row['createdAt'] ?? ''))); ?></td>
                        <td><?php echo esc((string) ($row['email'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['source'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['ip'] ?? '')); ?></td>
                        <td><?php echo esc((string) ($row['userAgent'] ?? '')); ?></td>
                      </tr>
                    <?php endforeach; ?>
                  </tbody>
                </table>
              </div>
            <?php endif; ?>
          </section>
        <?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
