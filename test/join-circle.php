<?php

$localities = array('Bangur Avenue', 'Lake Town', 'Salt Lake');
$hubDisplayLocalities = array('Bangur', 'Lake Town', 'Salt Lake');
$initialSkills = array('Digital Marketing', 'Home Care', 'Education');

$hubName = 'North Kolkata Hub';
$foundingSlotsRemaining = '12/50 Remaining';
$statusLabel = 'Pilot Phase (Open)';

$requestedLocality = isset($_GET['locality']) ? trim((string) $_GET['locality']) : '';
$prefillLocality = $requestedLocality;

if (!function_exists('set_status_code')) {
  function set_status_code($code)
  {
    if (function_exists('http_response_code')) {
      http_response_code((int) $code);
      return;
    }

    header('X-PHP-Response-Code: ' . (int) $code, true, (int) $code);
  }
}

if (!function_exists('safe_strlen')) {
  function safe_strlen($value)
  {
    if (function_exists('mb_strlen')) {
      return mb_strlen($value, 'UTF-8');
    }

    return strlen($value);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && (isset($_POST['action']) ? $_POST['action'] : '') === 'apply') {
    header('Content-Type: application/json; charset=utf-8');

  $locality = isset($_POST['locality']) ? trim((string) $_POST['locality']) : '';
  $offer = isset($_POST['offer']) ? trim((string) $_POST['offer']) : '';
  $need = isset($_POST['need']) ? trim((string) $_POST['need']) : '';
  $name = isset($_POST['name']) ? trim((string) $_POST['name']) : '';
  $whatsapp = isset($_POST['whatsapp']) ? trim((string) $_POST['whatsapp']) : '';

    $errors = array();

    if (safe_strlen($locality) < 2) {
      $errors[] = 'Please enter your locality.';
    }

    if (safe_strlen($offer) < 6) {
        $errors[] = 'Please add a meaningful skill or hobby offer.';
    }

    if (safe_strlen($need) < 6) {
        $errors[] = 'Please add one help request.';
    }

    if (safe_strlen($name) < 2) {
        $errors[] = 'Please enter your name.';
    }

    $digits = preg_replace('/\D+/', '', $whatsapp);
    if ($digits === null) {
      $digits = '';
    }
    if (strlen($digits) < 10) {
        $errors[] = 'Please enter a valid WhatsApp number.';
    }

    if ($errors) {
      set_status_code(422);
      echo json_encode(array(
            'ok' => false,
            'message' => $errors[0],
            'errors' => $errors,
      ));
        exit;
    }

    $payload = array(
        'createdAt' => date('c'),
        'locality' => $locality,
        'offer' => $offer,
        'need' => $need,
        'name' => $name,
        'whatsapp' => $digits,
        'source' => 'north-kolkata-qr-landing',
        'ip' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : null,
        'userAgent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null,
    );

    $dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0775, true);
    }

    $filePath = $dataDir . DIRECTORY_SEPARATOR . 'applications.jsonl';
    $jsonOptions = defined('JSON_UNESCAPED_UNICODE') ? JSON_UNESCAPED_UNICODE : 0;
    $written = file_put_contents($filePath, json_encode($payload, $jsonOptions) . PHP_EOL, FILE_APPEND | LOCK_EX);

    if ($written === false) {
      set_status_code(500);
      echo json_encode(array(
            'ok' => false,
            'message' => 'Unable to save your application right now. Please try again.',
      ));
        exit;
    }

    echo json_encode(array(
        'ok' => true,
        'message' => 'Application received.',
    ));
    exit;
}

function esc($value)
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samay Setu | Join the Circle</title>
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
    --border: rgba(26, 26, 24, 0.14);
    --serif: "Cormorant Garamond", Georgia, serif;
    --sans: "DM Sans", sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--sans);
    color: var(--ink);
    background:
      radial-gradient(circle at 5% 0%, rgba(201, 169, 110, 0.18), transparent 35%),
      radial-gradient(circle at 90% 10%, rgba(26, 26, 24, 0.08), transparent 35%),
      linear-gradient(180deg, #faf6f0 0%, #f4efe8 100%);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
    isolation: isolate;
  }

  .ambient-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
  }

  .ambient-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(61, 59, 53, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61, 59, 53, 0.04) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.85), transparent 70%);
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(2px);
    opacity: 0.5;
    animation: orbDrift 16s ease-in-out infinite;
  }

  .orb-1 {
    width: 360px;
    height: 360px;
    top: -110px;
    left: -70px;
    background: radial-gradient(circle, rgba(201, 169, 110, 0.42), rgba(201, 169, 110, 0));
  }

  .orb-2 {
    width: 320px;
    height: 320px;
    right: -90px;
    top: 22%;
    background: radial-gradient(circle, rgba(42, 109, 84, 0.26), rgba(42, 109, 84, 0));
    animation-delay: -5s;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    bottom: -130px;
    left: 34%;
    background: radial-gradient(circle, rgba(201, 169, 110, 0.34), rgba(201, 169, 110, 0));
    animation-delay: -10s;
  }

  @keyframes orbDrift {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(10px, -14px, 0) scale(1.08);
    }
  }

  .page-wrap {
    width: min(1180px, calc(100% - 32px));
    margin: 20px auto 56px;
    position: relative;
    z-index: 1;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border: 1px solid var(--border);
    border-radius: 16px;
    position: sticky;
    top: 12px;
    backdrop-filter: blur(8px);
    background: rgba(250, 246, 240, 0.82);
    box-shadow: 0 10px 26px rgba(26, 26, 24, 0.07);
    z-index: 20;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--ink);
    transition: transform 0.2s ease;
  }

  .brand:hover {
    transform: translateY(-1px);
  }

  .brand .logo-text {
    font-family: var(--serif);
    font-size: 1.4rem;
    letter-spacing: 0.02em;
  }

  .brand .logo-text span {
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
  }

  .hero {
    margin-top: 22px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72));
    border: 1px solid var(--border);
    box-shadow: 0 22px 50px rgba(41, 37, 30, 0.08);
    border-radius: 24px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    will-change: transform;
  }

  .hero-left {
    padding: 40px 40px 44px;
    position: relative;
    animation: riseIn 0.55s ease both;
  }

  .hero-left::after {
    content: "";
    position: absolute;
    right: 0;
    top: 40px;
    bottom: 40px;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(61, 59, 53, 0.18), transparent);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--stone);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.7rem;
    margin-bottom: 16px;
  }

  .eyebrow::before {
    content: "";
    width: 20px;
    height: 1px;
    background: var(--gold);
  }

  h1 {
    font-family: var(--serif);
    font-size: clamp(2.1rem, 4vw, 3.6rem);
    line-height: 1.04;
    font-weight: 500;
    margin-bottom: 10px;
  }

  .subhead {
    font-size: clamp(1rem, 1.8vw, 1.18rem);
    line-height: 1.55;
    color: var(--stone);
    max-width: 620px;
  }

  .subhead strong {
    font-weight: 600;
    color: var(--ink);
  }

  .ticker {
    margin-top: 26px;
    border: 1px solid rgba(42, 109, 84, 0.22);
    background: linear-gradient(90deg, rgba(42, 109, 84, 0.12), rgba(255, 255, 255, 0.82));
    border-radius: 14px;
    padding: 13px 14px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .ticker-item {
    border-right: 1px solid rgba(42, 109, 84, 0.18);
    padding-right: 10px;
    transition: transform 0.18s ease;
  }

  .ticker-item:last-child {
    border-right: none;
    padding-right: 0;
  }

  .ticker-item:hover {
    transform: translateY(-1px);
  }

  .ticker-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #2d5948;
    margin-bottom: 4px;
  }

  .ticker-value {
    font-size: 0.9rem;
    color: #23493b;
    font-weight: 600;
  }

  .hero-message {
    margin-top: 20px;
    font-size: 1rem;
    line-height: 1.65;
    color: #2b2722;
    max-width: 620px;
  }

  .hero-right {
    padding: 36px;
    background:
      radial-gradient(circle at 100% 0%, rgba(201, 169, 110, 0.16), transparent 40%),
      linear-gradient(180deg, rgba(243, 235, 225, 0.55), rgba(255, 255, 255, 0.72));
    animation: riseIn 0.68s ease both;
  }

  .app-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 14px 36px rgba(26, 26, 24, 0.08);
    padding: 22px;
    transition: transform 0.24s ease, box-shadow 0.24s ease;
  }

  .app-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 42px rgba(26, 26, 24, 0.12);
  }

  .app-tag {
    display: inline-block;
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.11em;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(201, 169, 110, 0.38);
    background: #fcf8f1;
    color: #725420;
    margin-bottom: 14px;
  }

  .step-progress {
    margin-bottom: 18px;
  }

  .step-progress-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: #5d5951;
    margin-bottom: 8px;
  }

  .bar {
    height: 5px;
    border-radius: 999px;
    background: #ece5da;
    overflow: hidden;
  }

  .bar > span {
    display: block;
    height: 100%;
    width: 25%;
    background: linear-gradient(90deg, #c9a96e, #b8933a);
    transition: width 0.24s ease;
  }

  .question {
    animation: fadeIn 0.25s ease;
  }

  .question h2 {
    font-family: var(--serif);
    font-size: 1.72rem;
    line-height: 1.2;
    margin-bottom: 14px;
  }

  .field {
    width: 100%;
    border: 1px solid #d8cdbd;
    background: #fffdfa;
    border-radius: 12px;
    padding: 12px 13px;
    font-family: var(--sans);
    font-size: 0.95rem;
    color: #2a2722;
    outline: none;
  }

  .field:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.18);
  }

  textarea.field {
    min-height: 100px;
    resize: vertical;
    line-height: 1.45;
  }

  .hint {
    margin-top: 8px;
    color: #726f66;
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .actions {
    margin-top: 18px;
    display: flex;
    gap: 10px;
  }

  .btn {
    border: none;
    border-radius: 11px;
    padding: 12px 16px;
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: var(--sans);
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn-secondary {
    background: #f2ece3;
    color: #514a40;
    border: 1px solid #e1d5c5;
    min-width: 96px;
  }

  .btn-primary {
    background: var(--ink);
    color: #ffffff;
    min-width: 130px;
  }

  .btn-primary:hover {
    background: #2b2b27;
  }

  .btn-success {
    background: #2b614b;
    color: #fff;
    min-width: 140px;
  }

  .error {
    margin-top: 10px;
    color: #8f2f2f;
    font-size: 0.82rem;
    min-height: 1.1rem;
  }

  .success-screen {
    display: none;
    animation: fadeIn 0.3s ease;
    padding-top: 4px;
  }

  .success-screen h2 {
    font-family: var(--serif);
    font-size: 2rem;
    margin-bottom: 12px;
  }

  .success-screen p {
    color: #3f3b35;
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .next-steps {
    margin-top: 14px;
    border: 1px solid #e4d9c8;
    border-radius: 12px;
    background: #fdfaf5;
    padding: 14px;
  }

  .next-steps h3 {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b6458;
    margin-bottom: 8px;
  }

  .next-steps ol {
    margin-left: 18px;
    color: #2f2b25;
    line-height: 1.7;
    font-size: 0.92rem;
  }

  .note {
    margin-top: 10px;
    font-size: 0.78rem;
    color: #6f685c;
  }

  .footer-note {
    margin-top: 18px;
    text-align: center;
    font-size: 0.75rem;
    color: #6f6a62;
    letter-spacing: 0.03em;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 980px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .hero-left::after {
      display: none;
    }

    .hero-right {
      padding-top: 0;
    }
  }

  @media (max-width: 680px) {
    .page-wrap {
      width: min(1180px, calc(100% - 18px));
      margin-top: 10px;
      margin-bottom: 20px;
    }

    .topbar {
      padding: 10px 12px;
      position: static;
      backdrop-filter: none;
      background: rgba(255, 255, 255, 0.92);
      border-radius: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .brand .logo-text {
      font-size: 1.14rem;
    }

    .pilot-chip {
      font-size: 0.62rem;
      letter-spacing: 0.08em;
      padding: 7px 10px;
      width: 100%;
      text-align: center;
    }

    .hero-left,
    .hero-right {
      padding: 20px 16px;
    }

    .hero {
      border-radius: 18px;
    }

    h1 {
      font-size: 2rem;
    }

    .subhead,
    .hero-message {
      font-size: 0.95rem;
    }

    .ticker {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .ticker-item {
      border-right: none;
      border-bottom: 1px solid rgba(42, 109, 84, 0.12);
      padding-right: 0;
      padding-bottom: 8px;
    }

    .ticker-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .question h2 {
      font-size: 1.42rem;
    }

    .two-col {
      grid-template-columns: 1fr;
    }

    .actions {
      justify-content: space-between;
    }

    .btn {
      flex: 1;
      text-align: center;
      min-width: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orb,
    .hero-left,
    .hero-right,
    .question,
    .btn,
    .ticker-item,
    .app-card {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }
</style>
</head>
<body>
  <div class="ambient-bg" aria-hidden="true">
    <div class="ambient-grid"></div>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <div class="page-wrap">
    <header class="topbar">
      <a class="brand" href="index.php" aria-label="Samay Setu">
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" stroke-width="2" stroke-linecap="round"/>
          <circle cx="8" cy="24" r="2.5" fill="#C9A96E"/>
          <circle cx="28" cy="12" r="2.5" fill="#1a1a18"/>
        </svg>
        <span class="logo-text">samay <span>setu</span></span>
      </a>
      <div class="pilot-chip"><?php echo esc($hubName); ?> Founding Circle</div>
    </header>

    <main class="hero">
      <section class="hero-left" aria-label="Landing Introduction">
        <div class="eyebrow">Immediate Recognition</div>
        <h1>Welcome, Neighbor.</h1>
        <p class="subhead">The <strong><?php echo esc($hubName); ?> (<?php echo esc(implode(' | ', $hubDisplayLocalities)); ?>)</strong> is now building its bridge.</p>

        <div class="ticker" aria-label="Pilot Status Ticker">
          <article class="ticker-item">
            <p class="ticker-label">Status</p>
            <p class="ticker-value"><?php echo esc($statusLabel); ?></p>
          </article>
          <article class="ticker-item">
            <p class="ticker-label">Founding Slots</p>
            <p class="ticker-value"><?php echo esc($foundingSlotsRemaining); ?></p>
          </article>
          <article class="ticker-item">
            <p class="ticker-label">Initial Skills</p>
            <p class="ticker-value"><?php echo esc(implode(', ', $initialSkills)); ?></p>
          </article>
        </div>

        <p class="hero-message">We are hand-selecting 50 founding members to kickstart a local economy where time is the only currency.</p>
      </section>

      <section class="hero-right" aria-label="Application Form Section">
        <div class="app-card" id="appCard">
          <span class="app-tag">Join the Circle Application</span>

          <div class="step-progress" id="stepProgressWrap">
            <div class="step-progress-head">
              <span id="stepLabel">Step 1 of 4</span>
              <span>Founding Intake</span>
            </div>
            <div class="bar">
              <span id="progressBar"></span>
            </div>
          </div>

          <form id="multiStepForm" novalidate>
            <div class="question" id="questionWrap"></div>
            <p class="error" id="errorText"></p>
            <div class="actions">
              <button type="button" id="backBtn" class="btn btn-secondary">Back</button>
              <button type="button" id="nextBtn" class="btn btn-primary">Next</button>
              <button type="submit" id="applyBtn" class="btn btn-success" style="display:none;">Apply</button>
            </div>
          </form>

          <section class="success-screen" id="successScreen" aria-live="polite">
            <h2>Application Received.</h2>
            <p>To keep our circle safe and high-quality, we verify every neighbor manually.</p>
            <div class="next-steps">
              <h3>What's next?</h3>
              <ol>
                <li>We will verify your profile within 24 hours.</li>
                <li>Once approved, you will receive a 5-Hour Trust Bonus in your Samay Setu account.</li>
                <li>You will receive a private invite to our WhatsApp Community.</li>
              </ol>
            </div>
            <p class="note">Thanks for applying from the <?php echo esc($hubName); ?>. We value quality over quantity.</p>
          </section>
        </div>
      </section>
    </main>

    <p class="footer-note">Samay Setu | Trusted local time exchange for <?php echo esc(implode(', ', $hubDisplayLocalities)); ?>.</p>
  </div>

<script>
  const serverConfig = {
    localities: <?php echo json_encode($localities, JSON_UNESCAPED_UNICODE); ?>,
    prefillLocality: <?php echo json_encode($prefillLocality, JSON_UNESCAPED_UNICODE); ?>
  };

  const form = document.getElementById("multiStepForm");
  const questionWrap = document.getElementById("questionWrap");
  const errorText = document.getElementById("errorText");
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const applyBtn = document.getElementById("applyBtn");
  const stepLabel = document.getElementById("stepLabel");
  const progressBar = document.getElementById("progressBar");
  const successScreen = document.getElementById("successScreen");
  const stepProgressWrap = document.getElementById("stepProgressWrap");

  const steps = [
    {
      title: "Which locality do you live in?",
      type: "select",
      key: "locality",
      placeholder: "Type your locality"
    },
    {
      title: "What is one professional skill or hobby you would be happy to offer?",
      type: "textarea",
      key: "offer",
      placeholder: "e.g., I can give 1 hour of SEO advice"
    },
    {
      title: "What is one thing you often wish you had help with?",
      type: "textarea",
      key: "need",
      placeholder: "e.g., I need 1 hour of yoga coaching"
    },
    {
      title: "Name and WhatsApp Number",
      type: "double",
      key: "identity"
    }
  ];

  let currentStep = 0;
  const answers = {
    locality: serverConfig.prefillLocality || "",
    offer: "",
    need: "",
    name: "",
    whatsapp: ""
  };

  function updateProgress() {
    const totalSteps = steps.length;
    const current = currentStep + 1;
    stepLabel.textContent = "Step " + current + " of " + totalSteps;
    progressBar.style.width = String((current / totalSteps) * 100) + "%";
    backBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";

    if (currentStep === totalSteps - 1) {
      nextBtn.style.display = "none";
      applyBtn.style.display = "inline-block";
    } else {
      nextBtn.style.display = "inline-block";
      applyBtn.style.display = "none";
    }
  }

  function currentStepValid() {
    const step = steps[currentStep];

    if (step.key === "locality") {
      return answers.locality.trim() !== "";
    }

    if (step.key === "offer") {
      return answers.offer.trim().length >= 6;
    }

    if (step.key === "need") {
      return answers.need.trim().length >= 6;
    }

    if (step.key === "identity") {
      const whatsappClean = answers.whatsapp.replace(/\D/g, "");
      return answers.name.trim().length >= 2 && whatsappClean.length >= 10;
    }

    return true;
  }

  function renderStep() {
    errorText.textContent = "";

    const step = steps[currentStep];
    let html = "<h2>" + step.title + "</h2>";

    if (step.type === "select") {
      html += "<input id='field-locality' class='field' type='text' placeholder='" + step.placeholder + "' value='" + answers.locality + "'>";
      html += "<p class='hint'>Example: Bangur Avenue, Lake Town, Salt Lake.</p>";
    }

    if (step.type === "textarea" && step.key === "offer") {
      html += "<textarea id='field-offer' class='field' placeholder='" + step.placeholder + "'>" + answers.offer + "</textarea>";
      html += "<p class='hint'>Specific offers help us match faster.</p>";
    }

    if (step.type === "textarea" && step.key === "need") {
      html += "<textarea id='field-need' class='field' placeholder='" + step.placeholder + "'>" + answers.need + "</textarea>";
      html += "<p class='hint'>Tell us a practical need from your weekly life.</p>";
    }

    if (step.type === "double") {
      html += "<div class='two-col'>";
      html += "<input id='field-name' class='field' type='text' placeholder='Your full name' value='" + answers.name + "'>";
      html += "<input id='field-whatsapp' class='field' type='tel' inputmode='numeric' placeholder='WhatsApp number' value='" + answers.whatsapp + "'>";
      html += "</div>";
      html += "<p class='hint'>We use WhatsApp only for profile verification and your private invite.</p>";
    }

    questionWrap.innerHTML = html;

    const localityField = document.getElementById("field-locality");
    const offerField = document.getElementById("field-offer");
    const needField = document.getElementById("field-need");
    const nameField = document.getElementById("field-name");
    const whatsappField = document.getElementById("field-whatsapp");

    if (localityField) {
      localityField.addEventListener("input", function(e) {
        answers.locality = e.target.value;
      });
    }

    if (offerField) {
      offerField.addEventListener("input", function(e) {
        answers.offer = e.target.value;
      });
    }

    if (needField) {
      needField.addEventListener("input", function(e) {
        answers.need = e.target.value;
      });
    }

    if (nameField) {
      nameField.addEventListener("input", function(e) {
        answers.name = e.target.value;
      });
    }

    if (whatsappField) {
      whatsappField.addEventListener("input", function(e) {
        answers.whatsapp = e.target.value;
      });
    }

    updateProgress();
  }

  function showValidationError() {
    if (currentStep === 0) {
      errorText.textContent = "Please enter your locality.";
      return;
    }

    if (currentStep === 1) {
      errorText.textContent = "Please add one skill or hobby you can offer.";
      return;
    }

    if (currentStep === 2) {
      errorText.textContent = "Please add one thing you often need help with.";
      return;
    }

    if (currentStep === 3) {
      errorText.textContent = "Please enter your name and a valid WhatsApp number.";
    }
  }

  nextBtn.addEventListener("click", function() {
    if (!currentStepValid()) {
      showValidationError();
      return;
    }

    if (currentStep < steps.length - 1) {
      currentStep += 1;
      renderStep();
    }
  });

  backBtn.addEventListener("click", function() {
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!currentStepValid()) {
      showValidationError();
      return;
    }

    errorText.textContent = "";
    applyBtn.disabled = true;
    applyBtn.textContent = "Applying...";

    try {
      const payload = new FormData();
      payload.append("action", "apply");
      payload.append("locality", answers.locality);
      payload.append("offer", answers.offer);
      payload.append("need", answers.need);
      payload.append("name", answers.name);
      payload.append("whatsapp", answers.whatsapp);

      const response = await fetch(window.location.pathname + window.location.search, {
        method: "POST",
        body: payload
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        errorText.textContent = (result && result.message) ? result.message : "Unable to submit right now.";
        applyBtn.disabled = false;
        applyBtn.textContent = "Apply";
        return;
      }

      form.style.display = "none";
      stepProgressWrap.style.display = "none";
      successScreen.style.display = "block";
    } catch (err) {
      errorText.textContent = "Network issue. Please try once again.";
      applyBtn.disabled = false;
      applyBtn.textContent = "Apply";
    }
  });

  renderStep();
</script>
</body>
</html>
