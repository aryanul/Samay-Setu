<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Samay Setu — Trade Time, Not Money</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #1a1a18;
    --stone: #3d3b35;
    --gold: #c9a96e;
    --gold-light: #e8d5b0;
    --cream: #f7f3ed;
    --sage: #8a9e8b;
    --sage-bg: #eef2ee;
    --white: #ffffff;
    --border: rgba(26,26,24,0.12);
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--sans);
    background: var(--white);
    color: var(--ink);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── NAV ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; color: var(--ink);
  }
  .logo-icon {
    width: 36px; height: 36px; position: relative;
  }
  .logo-icon svg { width: 36px; height: 36px; }
  .logo-text { font-family: var(--serif); font-size: 1.3rem; font-weight: 500; letter-spacing: 0.02em; }
  .logo-text span { color: var(--gold); }
  .nav-links {
    display: flex; align-items: center; gap: 36px;
    list-style: none;
  }
  .nav-links a {
    font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--stone); text-decoration: none; font-weight: 400;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--gold); }
  .nav-cta {
    font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
    font-weight: 500; color: var(--ink); border: 1.5px solid var(--ink);
    padding: 10px 22px; text-decoration: none;
    transition: all 0.25s; background: transparent;
  }
  .nav-cta:hover { background: var(--ink); color: var(--white); }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    background-image:
      radial-gradient(circle at 10% 50%, rgba(0,0,0,0.55) 0%, transparent 40%),
      radial-gradient(circle at 90% 50%, rgba(0,0,0,0.55) 0%, transparent 40%),
      url('images/hero_image3.png');
    background-size: cover;
    background-position: 60% center;
    background-repeat: no-repeat;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding-top: 68px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.4) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-left {
    padding: 80px 60px 80px 80px;
    position: relative; z-index: 2;
  }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gold); font-weight: 500; margin-bottom: 28px;
  }
  .hero-tag::before {
    content: ''; width: 24px; height: 1px; background: var(--gold);
  }
  .hero-headline {
    font-family: var(--serif); font-size: clamp(2.8rem, 4.5vw, 4.2rem);
    font-weight: 300; line-height: 1.15; color: var(--ink);
    margin-bottom: 24px; letter-spacing: -0.01em;
  }
  .hero-headline em { font-style: italic; color: var(--stone); }
  .hero-sub {
    font-size: 0.95rem; line-height: 1.75; color: var(--stone);
    max-width: 420px; margin-bottom: 48px; font-weight: 300;
  }
  .hero-sub strong { font-weight: 500; color: var(--ink); }
  .hero-form {
    display: flex; gap: 0; max-width: 440px;
  }
  .hero-form input {
    flex: 1; padding: 14px 20px; border: 1.5px solid var(--ink);
    border-right: none; font-family: var(--sans); font-size: 0.88rem;
    background: var(--white); color: var(--ink); outline: none;
    transition: border-color 0.2s;
  }
  .hero-form input::placeholder { color: #aaa; }
  .hero-form input:focus { border-color: var(--gold); }
  .hero-form button {
    padding: 14px 28px; background: var(--ink); color: var(--white);
    border: 1.5px solid var(--ink); font-family: var(--sans);
    font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase;
    font-weight: 500; cursor: pointer; transition: background 0.2s;
  }
  .hero-form button:hover { background: var(--stone); border-color: var(--stone); }
  .hero-form button:disabled { opacity: 0.75; cursor: wait; }
  .hero-form-status {
    margin-top: 10px;
    font-size: 0.78rem;
    color: #2f5f4a;
    min-height: 1rem;
  }
  .hero-form-status.error { color: #8f2f2f; }
  .hero-trust {
    margin-top: 14px; font-size: 0.75rem; color: #999; letter-spacing: 0.04em;
  }
  .hero-trust span { color: var(--gold); font-weight: 500; }

  .hero-right {
    position: relative; height: 100%; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-visual {
    position: relative; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .hero-bg-text {
    position: absolute; font-family: var(--serif); font-size: 18vw;
    font-weight: 300; color: rgba(201,169,110,0.08); line-height: 1;
    user-select: none; letter-spacing: -0.05em; top: 50%; left: 50%;
    transform: translate(-50%, -50%); white-space: nowrap;
  }
  .circle-anim {
    position: relative; width: 340px; height: 340px; z-index: 2;
  }
  .circle-anim .ring {
    position: absolute; border-radius: 50%; border: 1px solid;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: slowSpin 30s linear infinite;
  }
  .circle-anim .ring:nth-child(1) {
    width: 340px; height: 340px; border-color: rgba(201,169,110,0.3);
    animation-direction: normal;
  }
  .circle-anim .ring:nth-child(2) {
    width: 260px; height: 260px; border-color: rgba(26,26,24,0.1);
    animation-direction: reverse; animation-duration: 20s;
  }
  .circle-anim .ring:nth-child(3) {
    width: 180px; height: 180px; border-color: rgba(201,169,110,0.5);
    animation-duration: 15s;
  }
  .circle-center {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%); z-index: 3;
    text-align: center;
    padding: 10px 18px;
    background: rgba(255,255,255,0.32);
    backdrop-filter: blur(6px);
    border-radius: 999px;
    border: 1px solid rgba(201,169,110,0.45);
  }
  .circle-center .big-num {
    font-family: var(--serif); font-size: 2.2rem; font-weight: 400;
    color: #2b251b; line-height: 1;
    letter-spacing: 0.05em;
  }
  .circle-center .label {
    font-size: 0.52rem; letter-spacing: 0.24em; text-transform: uppercase;
    color: rgba(43,37,27,0.8); margin-top: 6px;
  }
  .dot-ring {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  }
  .dot-ring span {
    position: absolute; width: 6px; height: 6px; background: var(--gold);
    border-radius: 50%; top: 50%; left: 50%;
    transform-origin: 0 0;
  }
  @keyframes slowSpin {
    from { transform: translate(-50%,-50%) rotate(0deg); }
    to { transform: translate(-50%,-50%) rotate(360deg); }
  }

  /* ── FOUNDING CIRCLE ── */
  .founding {
    padding: 96px 80px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }
  .founding-left .section-tag {
    font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gold); font-weight: 500; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .founding-left .section-tag::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
  .founding-left h2 {
    font-family: var(--serif); font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 300; line-height: 1.2; margin-bottom: 24px;
  }
  .founding-left p {
    font-size: 0.95rem; line-height: 1.8; color: var(--stone);
    font-weight: 300; margin-bottom: 16px;
  }
  .founding-left blockquote {
    border-left: 2px solid var(--gold); padding-left: 20px;
    font-family: var(--serif); font-size: 1.1rem; font-style: italic;
    color: var(--stone); line-height: 1.6; margin: 32px 0;
  }
  .founding-right { position: relative; }
  .progress-card {
    background: var(--cream); padding: 40px; position: relative;
    border: 1px solid var(--border);
  }
  .progress-label {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 16px;
  }
  .progress-label span:first-child {
    font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--stone);
  }
  .progress-label span:last-child {
    font-family: var(--serif); font-size: 2rem; font-weight: 300; color: var(--ink);
  }
  .progress-track {
    height: 3px; background: rgba(26,26,24,0.1); margin-bottom: 32px; position: relative;
  }
  .progress-fill {
    height: 100%; background: var(--gold); width: 35%;
    transition: width 1s ease; position: relative;
  }
  .progress-fill::after {
    content: ''; position: absolute; right: -4px; top: -4px;
    width: 10px; height: 10px; background: var(--gold); border-radius: 50%;
  }
  .progress-members {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;
  }
  .progress-stat { }
  .progress-stat .num {
    font-family: var(--serif); font-size: 2.4rem; font-weight: 300; color: var(--ink);
    line-height: 1;
  }
  .progress-stat .desc {
    font-size: 0.75rem; color: var(--stone); letter-spacing: 0.04em; margin-top: 4px;
  }
  .cta-gold {
    display: inline-block; background: var(--gold); color: var(--ink);
    padding: 14px 32px; font-size: 0.75rem; letter-spacing: 0.1em;
    text-transform: uppercase; font-weight: 500; text-decoration: none;
    transition: background 0.2s; cursor: pointer; border: none; width: 100%;
    text-align: center; font-family: var(--sans);
  }
  .cta-gold:hover { background: #b8933a; color: var(--white); }
  .bonus-badge {
    position: absolute; top: -14px; right: 24px;
    background: var(--ink); color: var(--white);
    padding: 6px 16px; font-size: 0.68rem; letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ── SKILLS TICKER ── */
  .skills-section {
    padding: 80px 0; background: var(--ink); overflow: hidden;
  }
  .skills-section .section-header {
    text-align: center; padding: 0 80px 48px;
  }
  .skills-section .section-header h2 {
    font-family: var(--serif); font-size: clamp(1.8rem, 3vw, 2.8rem);
    font-weight: 300; color: var(--white); margin-bottom: 12px;
  }
  .skills-section .section-header p {
    font-size: 0.9rem; color: rgba(255,255,255,0.5); font-weight: 300;
    font-style: italic; font-family: var(--serif);
  }
  .ticker-wrap { overflow: hidden; position: relative; }
  .ticker-wrap::before, .ticker-wrap::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 100px; z-index: 2;
  }
  .ticker-wrap::before { left: 0; background: linear-gradient(to right, var(--ink), transparent); }
  .ticker-wrap::after { right: 0; background: linear-gradient(to left, var(--ink), transparent); }
  .ticker {
    display: flex; gap: 0; animation: ticker 30s linear infinite;
    width: max-content;
  }
  .ticker-row { display: flex; gap: 0; }
  .ticker-row:last-child { animation-direction: reverse; }
  .skill-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 24px; margin: 6px 8px;
    border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7);
    font-size: 0.82rem; white-space: nowrap; letter-spacing: 0.04em;
    font-weight: 300;
  }
  .skill-pill .dot { width: 5px; height: 5px; background: var(--gold); border-radius: 50%; }
  .skill-pill.highlight { border-color: rgba(201,169,110,0.4); color: var(--gold-light); }
  @keyframes ticker {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .ticker2 { animation: ticker2 25s linear infinite; }
  @keyframes ticker2 {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  /* ── HOW IT WORKS ── */
  .how {
    padding: 96px 80px;
    background: var(--white);
    border-bottom: 1px solid var(--border);
  }
  .section-header-center { text-align: center; margin-bottom: 72px; }
  .section-header-center .section-tag {
    font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--gold); font-weight: 500; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .section-header-center .section-tag::before,
  .section-header-center .section-tag::after {
    content: ''; width: 32px; height: 1px; background: var(--gold);
  }
  .section-header-center h2 {
    font-family: var(--serif); font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 300; color: var(--ink);
  }
  .pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .pillar {
    padding: 48px 40px; position: relative;
    border-right: 1px solid var(--border);
    transition: background 0.3s;
  }
  .pillar:last-child { border-right: none; }
  .pillar:hover { background: var(--cream); }
  .pillar-num {
    font-family: var(--serif); font-size: 5rem; font-weight: 300;
    color: rgba(201,169,110,0.2); line-height: 1; margin-bottom: 24px;
    letter-spacing: -0.04em;
  }
  .pillar-icon { margin-bottom: 20px; }
  .pillar-icon svg { width: 32px; height: 32px; stroke: var(--gold); stroke-width: 1.5; fill: none; }
  .pillar h3 {
    font-family: var(--serif); font-size: 1.5rem; font-weight: 400;
    margin-bottom: 12px; color: var(--ink);
  }
  .pillar p { font-size: 0.88rem; line-height: 1.8; color: var(--stone); font-weight: 300; }

  /* ── PHILOSOPHY ── */
  .philosophy {
    padding: 96px 80px;
    background: var(--sage-bg);
    position: relative; overflow: hidden;
  }
  .philosophy::before {
    content: '"';
    position: absolute; font-family: var(--serif); font-size: 40vw;
    color: rgba(138,158,139,0.08); line-height: 0.8;
    top: -10%; left: -5%; font-weight: 300; pointer-events: none;
  }
  .philosophy-inner {
    max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 2;
  }
  .philosophy-inner .section-tag {
    font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--sage); font-weight: 500; margin-bottom: 32px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .philosophy-inner .section-tag::before,
  .philosophy-inner .section-tag::after {
    content: ''; width: 32px; height: 1px; background: var(--sage);
  }
  .philosophy-inner blockquote {
    font-family: var(--serif); font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 300; line-height: 1.5; color: #2d3d2e;
    font-style: italic;
  }
  .philosophy-inner .attribution {
    margin-top: 32px; font-size: 0.75rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--sage);
  }
  .equal-rule {
    display: flex; align-items: center; justify-content: center; gap: 32px;
    margin-top: 56px; padding-top: 48px; border-top: 1px solid rgba(138,158,139,0.3);
    flex-wrap: wrap; gap: 40px;
  }
  .equal-item { text-align: center; }
  .equal-item .skill-name {
    font-family: var(--serif); font-size: 1.2rem; font-style: italic; color: #2d3d2e;
    display: block; margin-bottom: 4px;
  }
  .equal-item .time { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sage); }
  .equal-sep { font-family: var(--serif); font-size: 2rem; color: var(--sage); opacity: 0.5; }

  /* ── WAITLIST MAP ── */
  .waitlist {
    padding: 96px 80px;
    background: var(--white);
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
  }
  .waitlist-left h2 {
    font-family: var(--serif); font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 300; line-height: 1.2; margin-bottom: 24px;
  }
  .waitlist-left p {
    font-size: 0.92rem; line-height: 1.8; color: var(--stone); font-weight: 300; margin-bottom: 36px;
  }
  .waitlist-count {
    display: flex; align-items: baseline; gap: 12px; margin-bottom: 36px;
  }
  .waitlist-count .num {
    font-family: var(--serif); font-size: 4rem; font-weight: 300; color: var(--ink); line-height: 1;
  }
  .waitlist-count .desc { font-size: 0.85rem; color: var(--stone); font-weight: 300; line-height: 1.5; max-width: 160px; }
  .ping-btn {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; border: 1.5px solid var(--ink);
    padding: 14px 28px; font-family: var(--sans); font-size: 0.78rem;
    letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
    color: var(--ink); transition: all 0.25s; font-weight: 500;
  }
  .ping-btn:hover { background: var(--ink); color: var(--white); }
  .ping-btn .pulse {
    width: 8px; height: 8px; background: var(--gold); border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.5); }
  }
  .map-visual {
    position: relative; background: var(--cream);
    padding: 40px; min-height: 380px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border);
  }
  .map-svg { width: 100%; max-width: 360px; opacity: 0.85; }
  .map-dot {
    position: absolute; width: 12px; height: 12px; background: var(--gold);
    border-radius: 50%; border: 2px solid var(--white);
    box-shadow: 0 0 0 4px rgba(201,169,110,0.25);
    animation: mapPulse 2s infinite;
  }
  .map-dot:nth-child(2) { top: 30%; left: 40%; animation-delay: 0.5s; }
  .map-dot:nth-child(3) { top: 50%; left: 55%; animation-delay: 1s; }
  .map-dot:nth-child(4) { top: 65%; left: 35%; animation-delay: 1.5s; }
  .map-dot:nth-child(5) { top: 40%; left: 65%; animation-delay: 0.2s; }
  .map-dot:nth-child(6) { top: 70%; left: 60%; animation-delay: 0.8s; }
  @keyframes mapPulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(201,169,110,0.25); }
    50% { box-shadow: 0 0 0 10px rgba(201,169,110,0.05); }
  }
  .map-label {
    position: absolute; bottom: 20px; left: 20px;
    font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--stone);
  }

  /* ── FOOTER ── */
  footer {
    background: var(--ink); color: rgba(255,255,255,0.6);
    padding: 64px 80px 40px;
  }
  .footer-top {
    display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 60px;
    padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 36px;
  }
  .footer-brand .logo-text { color: var(--white); }
  .footer-brand p {
    font-size: 0.82rem; line-height: 1.75; margin-top: 16px;
    color: rgba(255,255,255,0.4); font-weight: 300; max-width: 240px;
  }
  .footer-col h4 {
    font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); margin-bottom: 20px; font-weight: 500;
  }
  .footer-col ul { list-style: none; }
  .footer-col ul li { margin-bottom: 12px; }
  .footer-col ul li a {
    font-size: 0.85rem; color: rgba(255,255,255,0.55); text-decoration: none;
    font-weight: 300; transition: color 0.2s;
  }
  .footer-col ul li a:hover { color: var(--gold); }
  .footer-bottom {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.75rem; color: rgba(255,255,255,0.25);
  }
  .footer-bottom a { color: rgba(255,255,255,0.35); text-decoration: none; }
  .footer-bottom a:hover { color: var(--gold); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.8s ease both; }
  .fade-up-1 { animation-delay: 0.1s; }
  .fade-up-2 { animation-delay: 0.25s; }
  .fade-up-3 { animation-delay: 0.4s; }
  .fade-up-4 { animation-delay: 0.55s; }

  /* Scroll reveal placeholder - simple */
  .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.visible { opacity: 1; transform: none; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    nav {
      padding: 0 24px;
    }
    .hero {
      grid-template-columns: 1.2fr 1fr;
    }
    .hero-left {
      padding: 80px 40px 64px 40px;
    }
    .founding,
    .waitlist {
      padding: 72px 40px;
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .skills-section .section-header,
    .how,
    .philosophy {
      padding: 72px 40px;
    }
    .footer-top {
      grid-template-columns: 1.5fr 1fr 1fr;
      row-gap: 32px;
    }
  }

  @media (max-width: 768px) {
    nav {
      padding: 0 20px;
      height: 64px;
    }
    .nav-links {
      display: none;
    }
    .nav-cta {
      padding: 8px 16px;
      font-size: 0.68rem;
    }

    .hero {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: 64px;
      padding-bottom: 56px;
      text-align: left;
      background-position: 55% center;
    }
    .hero-left {
      padding: 64px 20px 32px 20px;
      max-width: 520px;
    }
    .hero-tag {
      color: #f0d8ab;
      background: rgba(26, 26, 24, 0.36);
      padding: 8px 12px;
      border-radius: 4px;
      backdrop-filter: blur(2px);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .hero-tag::before {
      background: #f0d8ab;
    }
    .hero-sub {
      max-width: none;
    }
    .hero-form {
      flex-direction: column;
      max-width: none;
    }
    .hero-form input {
      width: 100%;
      border-right: 1.5px solid var(--ink);
      margin-bottom: 10px;
    }
    .hero-form button {
      width: 100%;
      text-align: center;
    }
    .hero-trust {
      max-width: 320px;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    .hero-trust span {
      color: #f0d8ab;
    }
    .hero-right {
      min-height: 260px;
      padding: 16px 0 0 0;
    }
    .circle-anim {
      width: 260px;
      height: 260px;
    }
    .circle-center .big-num {
      font-size: 1.8rem;
    }
    .circle-center .label {
      font-size: 0.5rem;
    }

    .founding,
    .how,
    .skills-section,
    .philosophy,
    .waitlist {
      padding: 56px 20px;
    }
    .pillars {
      grid-template-columns: 1fr;
      border-top: 1px solid var(--border);
    }
    .pillar {
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: 32px 0;
    }
    .pillar:last-child {
      border-bottom: none;
    }

    .skills-section .section-header {
      padding: 0 0 32px;
    }

    footer {
      padding: 48px 20px 32px;
    }
    .footer-top {
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .footer-bottom {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .logo-text {
      font-size: 1.05rem;
    }
    .hero-headline {
      font-size: 2.2rem;
    }
    .hero-left {
      padding-top: 52px;
    }
    .waitlist-count .num {
      font-size: 3rem;
    }
    .footer-top {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo">
    <div class="logo-icon">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" stroke-width="2" stroke-linecap="round"/>
        <circle cx="8" cy="24" r="2.5" fill="#C9A96E"/>
        <circle cx="28" cy="12" r="2.5" fill="#1a1a18"/>
      </svg>
    </div>
    <span class="logo-text">samay <span>setu</span></span>
  </a>
  <ul class="nav-links">
    <li><a href="#how">How it Works</a></li>
    <li><a href="#skills">Skill Directory</a></li>
    <li><a href="#philosophy">The Ethics</a></li>
  </ul>
  <a href="#founding" class="nav-cta">Apply for Founding Membership</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-left">
    <div class="hero-tag fade-up fade-up-1">Launching in North Kolkata · Pilot Phase</div>
    <h1 class="hero-headline fade-up fade-up-2">
      Your time is the only<br>
      <em>currency that matters.</em>
    </h1>
    <p class="hero-sub fade-up fade-up-3">
      Samay Setu is a private exchange for your neighbourhood. 
      Trade your <strong>professional skills</strong> for local help — 
      no money, just minutes.
    </p>
    <form class="hero-form fade-up fade-up-4" id="earlyAccessForm" novalidate>
      <input id="earlyAccessEmail" type="email" placeholder="Your email address" required>
      <button id="earlyAccessBtn" type="submit">Get Early Access</button>
    </form>
    <p class="hero-form-status fade-up fade-up-4" id="earlyAccessStatus" aria-live="polite"></p>
    <p class="hero-trust fade-up fade-up-4">
      <span>Limited to the first 20 Founding Members.</span> No spam. Ever.
    </p>
  </div>
  <div class="hero-right">
    <div class="hero-visual">
      <div class="hero-bg-text">समय</div>
      <div class="circle-anim">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="circle-center">
          <span class="big-num">1hr</span>
          <span class="label">equals 1hr always</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOUNDING CIRCLE -->
<section class="founding" id="founding">
  <div class="founding-left reveal">
    <div class="section-tag">Founding Circle</div>
    <h2>The Pilot Circle<br>is Now Open.</h2>
    <blockquote>
      "We are hand-selecting the first 20 neighbours to bridge the gap between skills and needs."
    </blockquote>
    <p>
      As a Founding Member, you don't just join the platform — you help write its rules. 
      Your voice shapes how this community grows, what skills are valued, and how trust is built.
    </p>
    <p>
      Join now to receive a <strong>5-hour Trust Bonus</strong> in your account from day one.
    </p>
  </div>
  <div class="founding-right reveal">
    <div class="progress-card">
      <div class="bonus-badge">5hr Trust Bonus</div>
      <div class="progress-label">
        <span>Founding Seats Filled</span>
        <span>7 / 20</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: 35%;"></div>
      </div>
      <div class="progress-members">
        <div class="progress-stat">
          <div class="num">7</div>
          <div class="desc">Members Verified</div>
        </div>
        <div class="progress-stat">
          <div class="num">13</div>
          <div class="desc">Seats Remaining</div>
        </div>
        <div class="progress-stat">
          <div class="num">4</div>
          <div class="desc">Skills Listed</div>
        </div>
        <div class="progress-stat">
          <div class="num">∞</div>
          <div class="desc">Potential Exchanges</div>
        </div>
      </div>
      <a href="join-circle.php" class="cta-gold">Claim Your Founding Seat →</a>
    </div>
  </div>
</section>

<!-- SKILLS TICKER -->
<section class="skills-section" id="skills">
  <div class="section-header">
    <h2>What flows through the bridge</h2>
    <p>"Imagine trading one hour of SEO advice for one hour of home-cooked meal prep."</p>
  </div>
  <div class="ticker-wrap" style="margin-bottom: 12px;">
    <div class="ticker">
      <div class="ticker-row" id="row1">
        <span class="skill-pill highlight"><span class="dot"></span>SEO Strategy</span>
        <span class="skill-pill"><span class="dot"></span>Pet Sitting</span>
        <span class="skill-pill highlight"><span class="dot"></span>Web Design</span>
        <span class="skill-pill"><span class="dot"></span>Math Tutoring</span>
        <span class="skill-pill"><span class="dot"></span>Content Writing</span>
        <span class="skill-pill highlight"><span class="dot"></span>Guitar Lessons</span>
        <span class="skill-pill"><span class="dot"></span>Grocery Runs</span>
        <span class="skill-pill"><span class="dot"></span>Plant Care</span>
        <span class="skill-pill highlight"><span class="dot"></span>Language Exchange</span>
        <span class="skill-pill"><span class="dot"></span>Cooking</span>
        <span class="skill-pill"><span class="dot"></span>Photography</span>
        <span class="skill-pill highlight"><span class="dot"></span>Yoga Classes</span>
        <span class="skill-pill"><span class="dot"></span>Accounting Help</span>
        <span class="skill-pill"><span class="dot"></span>Home Repairs</span>
      </div>
      <div class="ticker-row" aria-hidden="true">
        <span class="skill-pill highlight"><span class="dot"></span>SEO Strategy</span>
        <span class="skill-pill"><span class="dot"></span>Pet Sitting</span>
        <span class="skill-pill highlight"><span class="dot"></span>Web Design</span>
        <span class="skill-pill"><span class="dot"></span>Math Tutoring</span>
        <span class="skill-pill"><span class="dot"></span>Content Writing</span>
        <span class="skill-pill highlight"><span class="dot"></span>Guitar Lessons</span>
        <span class="skill-pill"><span class="dot"></span>Grocery Runs</span>
        <span class="skill-pill"><span class="dot"></span>Plant Care</span>
        <span class="skill-pill highlight"><span class="dot"></span>Language Exchange</span>
        <span class="skill-pill"><span class="dot"></span>Cooking</span>
        <span class="skill-pill"><span class="dot"></span>Photography</span>
        <span class="skill-pill highlight"><span class="dot"></span>Yoga Classes</span>
        <span class="skill-pill"><span class="dot"></span>Accounting Help</span>
        <span class="skill-pill"><span class="dot"></span>Home Repairs</span>
      </div>
    </div>
  </div>
  <div class="ticker-wrap">
    <div class="ticker ticker2">
      <div class="ticker-row">
        <span class="skill-pill"><span class="dot"></span>Resume Writing</span>
        <span class="skill-pill highlight"><span class="dot"></span>Legal Advice</span>
        <span class="skill-pill"><span class="dot"></span>Tailoring</span>
        <span class="skill-pill highlight"><span class="dot"></span>Coding Help</span>
        <span class="skill-pill"><span class="dot"></span>Elder Care</span>
        <span class="skill-pill"><span class="dot"></span>Childcare</span>
        <span class="skill-pill highlight"><span class="dot"></span>Bangla Tutoring</span>
        <span class="skill-pill"><span class="dot"></span>Tax Filing</span>
        <span class="skill-pill"><span class="dot"></span>Moving Help</span>
        <span class="skill-pill highlight"><span class="dot"></span>Interior Design</span>
        <span class="skill-pill"><span class="dot"></span>Medical Advice</span>
        <span class="skill-pill"><span class="dot"></span>Catering</span>
        <span class="skill-pill highlight"><span class="dot"></span>Carpentry</span>
        <span class="skill-pill"><span class="dot"></span>App Design</span>
      </div>
      <div class="ticker-row" aria-hidden="true">
        <span class="skill-pill"><span class="dot"></span>Resume Writing</span>
        <span class="skill-pill highlight"><span class="dot"></span>Legal Advice</span>
        <span class="skill-pill"><span class="dot"></span>Tailoring</span>
        <span class="skill-pill highlight"><span class="dot"></span>Coding Help</span>
        <span class="skill-pill"><span class="dot"></span>Elder Care</span>
        <span class="skill-pill"><span class="dot"></span>Childcare</span>
        <span class="skill-pill highlight"><span class="dot"></span>Bangla Tutoring</span>
        <span class="skill-pill"><span class="dot"></span>Tax Filing</span>
        <span class="skill-pill"><span class="dot"></span>Moving Help</span>
        <span class="skill-pill highlight"><span class="dot"></span>Interior Design</span>
        <span class="skill-pill"><span class="dot"></span>Medical Advice</span>
        <span class="skill-pill"><span class="dot"></span>Catering</span>
        <span class="skill-pill highlight"><span class="dot"></span>Carpentry</span>
        <span class="skill-pill"><span class="dot"></span>App Design</span>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how" id="how">
  <div class="section-header-center reveal">
    <div class="section-tag">Three Pillars</div>
    <h2>Simple by design. Profound by nature.</h2>
  </div>
  <div class="pillars">
    <div class="pillar reveal">
      <div class="pillar-num">01</div>
      <div class="pillar-icon">
        <svg viewBox="0 0 32 32"><path d="M16 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM4 28c0-6.627 5.373-12 12-12s12 5.373 12 12"/><path d="M21 20l3 3-3 3"/></svg>
      </div>
      <h3>Verify</h3>
      <p>Apply to join. We verify every neighbour personally to keep the circle safe and intimate. This is not a social media platform — it is a trusted neighbourhood.</p>
    </div>
    <div class="pillar reveal">
      <div class="pillar-num">02</div>
      <div class="pillar-icon">
        <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/><path d="M16 8v8l4 4"/><path d="M8 16h4"/></svg>
      </div>
      <h3>Give</h3>
      <p>Share a skill you love. Earn 1 Samay Credit for every 1 hour given. Your expertise — no matter what it is — has the same value as everyone else's.</p>
    </div>
    <div class="pillar reveal">
      <div class="pillar-num">03</div>
      <div class="pillar-icon">
        <svg viewBox="0 0 32 32"><path d="M4 20c0-4 4-8 12-8s12 4 12 8"/><path d="M8 12c0-2 1-4 4-5"/><path d="M24 12c0-2-1-4-4-5"/><circle cx="16" cy="8" r="4"/></svg>
      </div>
      <h3>Receive</h3>
      <p>Spend your credits on any service within the community. A web designer can receive home cooking. A tutor can receive plant care. Time is the great equaliser.</p>
    </div>
  </div>
</section>

<!-- PHILOSOPHY -->
<section class="philosophy" id="philosophy">
  <div class="philosophy-inner reveal">
    <div class="section-tag">The Ethics</div>
    <blockquote>
      "At Samay Setu, an hour is an hour. Whether you are designing a website or walking a neighbour's dog, the value of your time remains equal. We trade in humanity, not hierarchy."
    </blockquote>
    <p class="attribution">— The Founding Principle of Samay Setu</p>
    <div class="equal-rule">
      <div class="equal-item">
        <span class="skill-name">Website Design</span>
        <span class="time">1 Samay Credit · 1 Hour</span>
      </div>
      <div class="equal-sep">=</div>
      <div class="equal-item">
        <span class="skill-name">Home Cooking</span>
        <span class="time">1 Samay Credit · 1 Hour</span>
      </div>
      <div class="equal-sep">=</div>
      <div class="equal-item">
        <span class="skill-name">Math Tutoring</span>
        <span class="time">1 Samay Credit · 1 Hour</span>
      </div>
      <div class="equal-sep">=</div>
      <div class="equal-item">
        <span class="skill-name">Plant Care</span>
        <span class="time">1 Samay Credit · 1 Hour</span>
      </div>
    </div>
  </div>
</section>

<!-- WAITLIST / MAP -->
<section class="waitlist">
  <div class="waitlist-left reveal">
    <div class="section-tag" style="font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 500; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
      <span style="width:24px;height:1px;background:var(--gold);display:inline-block;"></span>
      Live Waitlist
    </div>
    <h2>Your neighbours<br>are already waiting.</h2>
    <p>8 people in North Kolkata and surrounding areas are waiting for the bridge to open. Each of them has a skill to share and a need to fill. The circle is almost complete.</p>
    <div class="waitlist-count">
      <span class="num">8</span>
      <span class="desc">Neighbours currently on the waitlist</span>
    </div>
    <button class="ping-btn">
      <span class="pulse"></span>
      Ping Me When We Launch
    </button>
  </div>
  <div class="waitlist-right reveal">
    <div class="map-visual">
      <!-- Minimal abstract map SVG -->
      <svg class="map-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Streets grid -->
        <line x1="0" y1="80" x2="400" y2="80" stroke="#d4cfc7" stroke-width="1"/>
        <line x1="0" y1="150" x2="400" y2="150" stroke="#d4cfc7" stroke-width="1"/>
        <line x1="0" y1="220" x2="400" y2="220" stroke="#d4cfc7" stroke-width="1"/>
        <line x1="80" y1="0" x2="80" y2="300" stroke="#d4cfc7" stroke-width="1"/>
        <line x1="200" y1="0" x2="200" y2="300" stroke="#d4cfc7" stroke-width="1"/>
        <line x1="320" y1="0" x2="320" y2="300" stroke="#d4cfc7" stroke-width="1"/>
        <!-- Diagonal road -->
        <line x1="0" y1="300" x2="400" y2="0" stroke="#c9c3b9" stroke-width="1.5"/>
        <!-- Blocks -->
        <rect x="90" y="90" width="100" height="50" fill="rgba(201,169,110,0.08)" stroke="rgba(201,169,110,0.2)" stroke-width="0.5"/>
        <rect x="210" y="160" width="100" height="50" fill="rgba(201,169,110,0.08)" stroke="rgba(201,169,110,0.2)" stroke-width="0.5"/>
        <rect x="90" y="160" width="100" height="50" fill="rgba(26,26,24,0.04)" stroke="rgba(26,26,24,0.08)" stroke-width="0.5"/>
        <rect x="210" y="90" width="100" height="50" fill="rgba(26,26,24,0.04)" stroke="rgba(26,26,24,0.08)" stroke-width="0.5"/>
        <!-- River/bridge line -->
        <path d="M0 200 Q100 190 200 200 Q300 210 400 200" stroke="rgba(138,158,139,0.5)" stroke-width="2" fill="none"/>
        <text x="130" y="198" font-size="7" fill="rgba(138,158,139,0.7)" font-family="Georgia, serif" font-style="italic">Hugli River</text>
      </svg>
      <!-- Dots -->
      <div class="map-dot"></div>
      <div class="map-dot"></div>
      <div class="map-dot"></div>
      <div class="map-dot"></div>
      <div class="map-dot"></div>
      <div class="map-label">North Kolkata</div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <a href="#" class="nav-logo" style="text-decoration:none;display:flex;align-items:center;gap:10px;">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" stroke-width="2" stroke-linecap="round"/>
          <circle cx="8" cy="24" r="2.5" fill="#C9A96E"/>
          <circle cx="28" cy="12" r="2.5" fill="#ffffff"/>
        </svg>
        <span class="logo-text" style="color:#fff;">samay <span>setu</span></span>
      </a>
      <p>A private time-exchange for trusted neighbours. No money. Just minutes. Built in North Kolkata.</p>
    </div>
    <div class="footer-col">
      <h4>Platform</h4>
      <ul>
        <li><a href="#">How it Works</a></li>
        <li><a href="#">Skill Directory</a></li>
        <li><a href="#">Apply for Membership</a></li>
        <li><a href="#">FAQ</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Community</h4>
      <ul>
        <li><a href="#">The Ethics</a></li>
        <li><a href="#">Community Guidelines</a></li>
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">What is Timebanking?</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Connect</h4>
      <ul>
        <li><a href="#">Instagram (Behind the Scenes)</a></li>
        <li><a href="#">WhatsApp Circle</a></li>
        <li><a href="#">Contact Us</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>Samay Setu &copy; 2025 — A Neighbourhood Initiative</span>
    <span>समय ही सेतु है &nbsp;·&nbsp; <a href="#">Privacy</a> &nbsp;·&nbsp; <a href="#">Terms</a></span>
  </div>
</footer>

<script>
  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(r => io.observe(r));

  // Dot ring animation positions
  const dotsPositions = [
    { top: '30%', left: '40%' },
    { top: '50%', left: '55%' },
    { top: '65%', left: '35%' },
    { top: '40%', left: '65%' },
    { top: '70%', left: '60%' },
  ];

  const earlyAccessForm = document.getElementById('earlyAccessForm');
  const earlyAccessEmail = document.getElementById('earlyAccessEmail');
  const earlyAccessBtn = document.getElementById('earlyAccessBtn');
  const earlyAccessStatus = document.getElementById('earlyAccessStatus');

  if (earlyAccessForm && earlyAccessEmail && earlyAccessBtn && earlyAccessStatus) {
    earlyAccessForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = earlyAccessEmail.value.trim();
      if (!email) {
        earlyAccessStatus.textContent = 'Please enter your email.';
        earlyAccessStatus.classList.add('error');
        return;
      }

      earlyAccessStatus.textContent = '';
      earlyAccessStatus.classList.remove('error');
      earlyAccessBtn.disabled = true;
      earlyAccessBtn.textContent = 'Saving...';

      try {
        const payload = new FormData();
        payload.append('email', email);
        payload.append('source', 'homepage-early-access');

        const response = await fetch('waitlist-signup.php', {
          method: 'POST',
          body: payload
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          earlyAccessStatus.textContent = (result && result.message) ? result.message : 'Unable to save right now.';
          earlyAccessStatus.classList.add('error');
          earlyAccessBtn.disabled = false;
          earlyAccessBtn.textContent = 'Get Early Access';
          return;
        }

        earlyAccessStatus.textContent = result.message || 'Thanks! We will notify you at launch.';
        earlyAccessStatus.classList.remove('error');
        earlyAccessForm.reset();
      } catch (err) {
        earlyAccessStatus.textContent = 'Network issue. Please try again.';
        earlyAccessStatus.classList.add('error');
      } finally {
        earlyAccessBtn.disabled = false;
        earlyAccessBtn.textContent = 'Get Early Access';
      }
    });
  }
</script>
</body>
</html>