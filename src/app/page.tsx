"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./page.css";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reveals = rootRef.current?.querySelectorAll<HTMLElement>(".reveal");
    if (!reveals || reveals.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ text: "Please enter your email.", error: true });
      return;
    }
    setStatus({ text: "", error: false });
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage-early-access" }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setStatus({ text: result?.message || "Unable to save right now.", error: true });
        return;
      }
      setStatus({ text: result.message || "Thanks! We will notify you at launch.", error: false });
      setEmail("");
    } catch {
      setStatus({ text: "Network issue. Please try again.", error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ss-home" ref={rootRef}>
      <nav>
        <a href="#" className="nav-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
              <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
            </svg>
          </div>
          <span className="logo-text">
            samay <span>setu</span>
          </span>
        </a>
        <ul className="nav-links">
          <li><a href="#how">How it Works</a></li>
          <li><a href="#skills">Skill Directory</a></li>
          <li><a href="#philosophy">The Ethics</a></li>
        </ul>
        <a href="#founding" className="nav-cta">Apply for Founding Membership</a>
      </nav>

      <section className="hero">
        <div className="hero-left">
          <div className="hero-tag fade-up fade-up-1">Launching in North Kolkata · Pilot Phase</div>
          <h1 className="hero-headline fade-up fade-up-2">
            Your time is the only<br />
            <em>currency that matters.</em>
          </h1>
          <p className="hero-sub fade-up fade-up-3">
            Samay Setu is a private exchange for your neighbourhood. Trade your <strong>professional skills</strong> for local help — no money, just minutes.
          </p>
          <form className="hero-form fade-up fade-up-4" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Get Early Access"}
            </button>
          </form>
          <p className={`hero-form-status fade-up fade-up-4${status.error ? " error" : ""}`} aria-live="polite">
            {status.text}
          </p>
          <p className="hero-trust fade-up fade-up-4">
            <span>Limited to the first 20 Founding Members.</span> No spam. Ever.
          </p>
        </div>
        <div className="hero-right">
          <div className="hero-visual">
            <div className="hero-bg-text">समय</div>
            <div className="circle-anim">
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="circle-center">
                <span className="big-num">1hr</span>
                <span className="label">equals 1hr always</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="founding" id="founding">
        <div className="founding-left reveal">
          <div className="section-tag">Founding Circle</div>
          <h2>The Pilot Circle<br />is Now Open.</h2>
          <blockquote>
            &ldquo;We are hand-selecting the first 20 neighbours to bridge the gap between skills and needs.&rdquo;
          </blockquote>
          <p>
            As a Founding Member, you don&apos;t just join the platform — you help write its rules. Your voice shapes how this community grows, what skills are valued, and how trust is built.
          </p>
          <p>
            Join now to receive a <strong>5-hour Trust Bonus</strong> in your account from day one.
          </p>
        </div>
        <div className="founding-right reveal">
          <div className="progress-card">
            <div className="bonus-badge">5hr Trust Bonus</div>
            <div className="progress-label">
              <span>Founding Seats Filled</span>
              <span>7 / 20</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "35%" }}></div>
            </div>
            <div className="progress-members">
              <div className="progress-stat">
                <div className="num">7</div>
                <div className="desc">Members Verified</div>
              </div>
              <div className="progress-stat">
                <div className="num">13</div>
                <div className="desc">Seats Remaining</div>
              </div>
              <div className="progress-stat">
                <div className="num">4</div>
                <div className="desc">Skills Listed</div>
              </div>
              <div className="progress-stat">
                <div className="num">∞</div>
                <div className="desc">Potential Exchanges</div>
              </div>
            </div>
            <Link href="/onboarding" className="cta-gold">
              Claim Your Founding Seat →
            </Link>
          </div>
        </div>
      </section>

      <section className="skills-section" id="skills">
        <div className="section-header">
          <h2>What flows through the bridge</h2>
          <p>&ldquo;Imagine trading one hour of SEO advice for one hour of home-cooked meal prep.&rdquo;</p>
        </div>
        <div className="ticker-wrap" style={{ marginBottom: 12 }}>
          <div className="ticker">
            <div className="ticker-row">
              <span className="skill-pill highlight"><span className="dot"></span>SEO Strategy</span>
              <span className="skill-pill"><span className="dot"></span>Pet Sitting</span>
              <span className="skill-pill highlight"><span className="dot"></span>Web Design</span>
              <span className="skill-pill"><span className="dot"></span>Math Tutoring</span>
              <span className="skill-pill"><span className="dot"></span>Content Writing</span>
              <span className="skill-pill highlight"><span className="dot"></span>Guitar Lessons</span>
              <span className="skill-pill"><span className="dot"></span>Grocery Runs</span>
              <span className="skill-pill"><span className="dot"></span>Plant Care</span>
              <span className="skill-pill highlight"><span className="dot"></span>Language Exchange</span>
              <span className="skill-pill"><span className="dot"></span>Cooking</span>
              <span className="skill-pill"><span className="dot"></span>Photography</span>
              <span className="skill-pill highlight"><span className="dot"></span>Yoga Classes</span>
              <span className="skill-pill"><span className="dot"></span>Accounting Help</span>
              <span className="skill-pill"><span className="dot"></span>Home Repairs</span>
            </div>
            <div className="ticker-row" aria-hidden="true">
              <span className="skill-pill highlight"><span className="dot"></span>SEO Strategy</span>
              <span className="skill-pill"><span className="dot"></span>Pet Sitting</span>
              <span className="skill-pill highlight"><span className="dot"></span>Web Design</span>
              <span className="skill-pill"><span className="dot"></span>Math Tutoring</span>
              <span className="skill-pill"><span className="dot"></span>Content Writing</span>
              <span className="skill-pill highlight"><span className="dot"></span>Guitar Lessons</span>
              <span className="skill-pill"><span className="dot"></span>Grocery Runs</span>
              <span className="skill-pill"><span className="dot"></span>Plant Care</span>
              <span className="skill-pill highlight"><span className="dot"></span>Language Exchange</span>
              <span className="skill-pill"><span className="dot"></span>Cooking</span>
              <span className="skill-pill"><span className="dot"></span>Photography</span>
              <span className="skill-pill highlight"><span className="dot"></span>Yoga Classes</span>
              <span className="skill-pill"><span className="dot"></span>Accounting Help</span>
              <span className="skill-pill"><span className="dot"></span>Home Repairs</span>
            </div>
          </div>
        </div>
        <div className="ticker-wrap">
          <div className="ticker ticker2">
            <div className="ticker-row">
              <span className="skill-pill"><span className="dot"></span>Resume Writing</span>
              <span className="skill-pill highlight"><span className="dot"></span>Legal Advice</span>
              <span className="skill-pill"><span className="dot"></span>Tailoring</span>
              <span className="skill-pill highlight"><span className="dot"></span>Coding Help</span>
              <span className="skill-pill"><span className="dot"></span>Elder Care</span>
              <span className="skill-pill"><span className="dot"></span>Childcare</span>
              <span className="skill-pill highlight"><span className="dot"></span>Bangla Tutoring</span>
              <span className="skill-pill"><span className="dot"></span>Tax Filing</span>
              <span className="skill-pill"><span className="dot"></span>Moving Help</span>
              <span className="skill-pill highlight"><span className="dot"></span>Interior Design</span>
              <span className="skill-pill"><span className="dot"></span>Medical Advice</span>
              <span className="skill-pill"><span className="dot"></span>Catering</span>
              <span className="skill-pill highlight"><span className="dot"></span>Carpentry</span>
              <span className="skill-pill"><span className="dot"></span>App Design</span>
            </div>
            <div className="ticker-row" aria-hidden="true">
              <span className="skill-pill"><span className="dot"></span>Resume Writing</span>
              <span className="skill-pill highlight"><span className="dot"></span>Legal Advice</span>
              <span className="skill-pill"><span className="dot"></span>Tailoring</span>
              <span className="skill-pill highlight"><span className="dot"></span>Coding Help</span>
              <span className="skill-pill"><span className="dot"></span>Elder Care</span>
              <span className="skill-pill"><span className="dot"></span>Childcare</span>
              <span className="skill-pill highlight"><span className="dot"></span>Bangla Tutoring</span>
              <span className="skill-pill"><span className="dot"></span>Tax Filing</span>
              <span className="skill-pill"><span className="dot"></span>Moving Help</span>
              <span className="skill-pill highlight"><span className="dot"></span>Interior Design</span>
              <span className="skill-pill"><span className="dot"></span>Medical Advice</span>
              <span className="skill-pill"><span className="dot"></span>Catering</span>
              <span className="skill-pill highlight"><span className="dot"></span>Carpentry</span>
              <span className="skill-pill"><span className="dot"></span>App Design</span>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="section-header-center reveal">
          <div className="section-tag">Three Pillars</div>
          <h2>Simple by design. Profound by nature.</h2>
        </div>
        <div className="pillars">
          <div className="pillar reveal">
            <div className="pillar-num">01</div>
            <div className="pillar-icon">
              <svg viewBox="0 0 32 32">
                <path d="M16 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" />
                <path d="M21 20l3 3-3 3" />
              </svg>
            </div>
            <h3>Verify</h3>
            <p>Apply to join. We verify every neighbour personally to keep the circle safe and intimate. This is not a social media platform — it is a trusted neighbourhood.</p>
          </div>
          <div className="pillar reveal">
            <div className="pillar-num">02</div>
            <div className="pillar-icon">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" />
                <path d="M16 8v8l4 4" />
                <path d="M8 16h4" />
              </svg>
            </div>
            <h3>Give</h3>
            <p>Share a skill you love. Earn 1 Samay Credit for every 1 hour given. Your expertise — no matter what it is — has the same value as everyone else&apos;s.</p>
          </div>
          <div className="pillar reveal">
            <div className="pillar-num">03</div>
            <div className="pillar-icon">
              <svg viewBox="0 0 32 32">
                <path d="M4 20c0-4 4-8 12-8s12 4 12 8" />
                <path d="M8 12c0-2 1-4 4-5" />
                <path d="M24 12c0-2-1-4-4-5" />
                <circle cx="16" cy="8" r="4" />
              </svg>
            </div>
            <h3>Receive</h3>
            <p>Spend your credits on any service within the community. A web designer can receive home cooking. A tutor can receive plant care. Time is the great equaliser.</p>
          </div>
        </div>
      </section>

      <section className="philosophy" id="philosophy">
        <div className="philosophy-inner reveal">
          <div className="section-tag">The Ethics</div>
          <blockquote>
            &ldquo;At Samay Setu, an hour is an hour. Whether you are designing a website or walking a neighbour&apos;s dog, the value of your time remains equal. We trade in humanity, not hierarchy.&rdquo;
          </blockquote>
          <p className="attribution">— The Founding Principle of Samay Setu</p>
          <div className="equal-rule">
            <div className="equal-item">
              <span className="skill-name">Website Design</span>
              <span className="time">1 Samay Credit · 1 Hour</span>
            </div>
            <div className="equal-sep">=</div>
            <div className="equal-item">
              <span className="skill-name">Home Cooking</span>
              <span className="time">1 Samay Credit · 1 Hour</span>
            </div>
            <div className="equal-sep">=</div>
            <div className="equal-item">
              <span className="skill-name">Math Tutoring</span>
              <span className="time">1 Samay Credit · 1 Hour</span>
            </div>
            <div className="equal-sep">=</div>
            <div className="equal-item">
              <span className="skill-name">Plant Care</span>
              <span className="time">1 Samay Credit · 1 Hour</span>
            </div>
          </div>
        </div>
      </section>

      <section className="waitlist">
        <div className="waitlist-left reveal">
          <div
            className="section-tag"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 500,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 24, height: 1, background: "var(--gold)", display: "inline-block" }}></span>
            Live Waitlist
          </div>
          <h2>Your neighbours<br />are already waiting.</h2>
          <p>8 people in North Kolkata and surrounding areas are waiting for the bridge to open. Each of them has a skill to share and a need to fill. The circle is almost complete.</p>
          <div className="waitlist-count">
            <span className="num">8</span>
            <span className="desc">Neighbours currently on the waitlist</span>
          </div>
          <button className="ping-btn" type="button">
            <span className="pulse"></span>
            Ping Me When We Launch
          </button>
        </div>
        <div className="waitlist-right reveal">
          <div className="map-visual">
            <svg className="map-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="80" x2="400" y2="80" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="0" y1="220" x2="400" y2="220" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="80" y1="0" x2="80" y2="300" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="320" y1="0" x2="320" y2="300" stroke="#d4cfc7" strokeWidth="1" />
              <line x1="0" y1="300" x2="400" y2="0" stroke="#c9c3b9" strokeWidth="1.5" />
              <rect x="90" y="90" width="100" height="50" fill="rgba(201,169,110,0.08)" stroke="rgba(201,169,110,0.2)" strokeWidth="0.5" />
              <rect x="210" y="160" width="100" height="50" fill="rgba(201,169,110,0.08)" stroke="rgba(201,169,110,0.2)" strokeWidth="0.5" />
              <rect x="90" y="160" width="100" height="50" fill="rgba(26,26,24,0.04)" stroke="rgba(26,26,24,0.08)" strokeWidth="0.5" />
              <rect x="210" y="90" width="100" height="50" fill="rgba(26,26,24,0.04)" stroke="rgba(26,26,24,0.08)" strokeWidth="0.5" />
              <path d="M0 200 Q100 190 200 200 Q300 210 400 200" stroke="rgba(138,158,139,0.5)" strokeWidth="2" fill="none" />
              <text x="130" y="198" fontSize="7" fill="rgba(138,158,139,0.7)" fontFamily="Georgia, serif" fontStyle="italic">Hugli River</text>
            </svg>
            <div className="map-dot"></div>
            <div className="map-dot"></div>
            <div className="map-dot"></div>
            <div className="map-dot"></div>
            <div className="map-dot"></div>
            <div className="map-label">North Kolkata</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="nav-logo" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
                <circle cx="28" cy="12" r="2.5" fill="#ffffff" />
              </svg>
              <span className="logo-text" style={{ color: "#fff" }}>
                samay <span>setu</span>
              </span>
            </a>
            <p>A private time-exchange for trusted neighbours. No money. Just minutes. Built in North Kolkata.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#">How it Works</a></li>
              <li><a href="#">Skill Directory</a></li>
              <li><a href="#">Apply for Membership</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <ul>
              <li><a href="#">The Ethics</a></li>
              <li><a href="#">Community Guidelines</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">What is Timebanking?</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><a href="#">Instagram (Behind the Scenes)</a></li>
              <li><a href="#">WhatsApp Circle</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Samay Setu &copy; 2025 — A Neighbourhood Initiative</span>
          <span>समय ही सेतु है &nbsp;·&nbsp; <a href="#">Privacy</a> &nbsp;·&nbsp; <a href="#">Terms</a></span>
        </div>
      </footer>
    </div>
  );
}
