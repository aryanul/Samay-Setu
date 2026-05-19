/**
 * Seeds a handful of demo members and trades so the Live Bridge feed is
 * populated for development / design review.
 *
 * Usage:
 *   npm run db:seed-demo
 *
 * Idempotent — re-running won't duplicate members (linkedin_sub is UNIQUE)
 * or trades (each demo trade is checked by member + skill_offered + skill_needed).
 * Demo accounts are namespaced by linkedin_sub = "demo:<slug>".
 *
 * Wipe with: npm run db:wipe-users
 */

import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch (err) {
  console.warn("Could not read .env.local:", err.message);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing. Put it in .env.local.");
  process.exit(1);
}

const DEMOS = [
  {
    slug: "priya-finance",
    fullName: "Priya Sengupta",
    title: "Chartered Accountant · GST & ITC specialist",
    proof: "https://www.linkedin.com/in/priya-sengupta-demo/",
    trades: [
      {
        pillar: "finance-tax",
        offered: "GST Registration & ITC Structuring",
        needed: "High-End Web Developer (MERN Stack)",
        location: "Kolkata / Remote",
      },
    ],
  },
  {
    slug: "arjun-cfo",
    fullName: "Arjun Iyer",
    title: "Fractional CFO for D2C founders",
    proof: "https://www.linkedin.com/in/arjun-iyer-demo/",
    trades: [
      {
        pillar: "finance-tax",
        offered: "Fractional CFO & Cash Flow Forecasting",
        needed: "Executive Wellness & Strength Coach",
        location: "Hyderabad",
      },
    ],
  },
  {
    slug: "ritika-tax",
    fullName: "Ritika Bansal",
    title: "Tax counsel · Section 17(5) niche",
    proof: "https://www.linkedin.com/in/ritika-bansal-demo/",
    trades: [
      {
        pillar: "finance-tax",
        offered: "Corporate Tax Planning & Section 17(5)",
        needed: "Local SEO & Google Maps Specialist",
        location: "Delhi NCR",
      },
    ],
  },
  {
    slug: "neel-wealth",
    fullName: "Neel Kapoor",
    title: "Personal wealth advisor · HNI focus",
    proof: "https://www.linkedin.com/in/neel-kapoor-demo/",
    trades: [
      {
        pillar: "finance-tax",
        offered: "Personal Wealth Management Portfolio",
        needed: "Content Strategist for LinkedIn Video",
        location: "Mumbai",
      },
    ],
  },
  {
    slug: "ananya-seo",
    fullName: "Ananya Roy",
    title: "Growth & SEO lead · ex-agency",
    proof: "https://www.linkedin.com/in/ananya-roy-demo/",
    trades: [
      {
        pillar: "growth-seo",
        offered: "Local SEO & Google Maps Specialist",
        needed: "Corporate Tax Planning & Section 17(5)",
        location: "Delhi NCR",
      },
      {
        pillar: "growth-seo",
        offered: "Programmatic SEO Audit",
        needed: "Senior React Engineer (mentorship)",
        location: "Remote",
      },
    ],
  },
  {
    slug: "vikram-content",
    fullName: "Vikram Shah",
    title: "Content strategist · LinkedIn video",
    proof: "https://www.linkedin.com/in/vikram-shah-demo/",
    trades: [
      {
        pillar: "creative-content",
        offered: "Content Strategist for LinkedIn Video",
        needed: "Personal Wealth Management Portfolio",
        location: "Mumbai",
      },
    ],
  },
  {
    slug: "meera-hr",
    fullName: "Meera Krishnan",
    title: "Head of People · 14yrs across IT & D2C",
    proof: "https://www.linkedin.com/in/meera-krishnan-demo/",
    trades: [
      {
        pillar: "hr-leadership",
        offered: "Executive Hiring & Org Design",
        needed: "Fractional CFO & Cash Flow Forecasting",
        location: "Bengaluru",
      },
    ],
  },
  {
    slug: "rohan-coach",
    fullName: "Rohan Deshpande",
    title: "Executive wellness & strength coach",
    proof: "https://www.linkedin.com/in/rohan-deshpande-demo/",
    trades: [
      {
        pillar: "prem-lifestyle",
        offered: "Executive Wellness & Strength Coach",
        needed: "Fractional CFO & Cash Flow Forecasting",
        location: "Pune / Remote",
      },
    ],
  },
  {
    slug: "ishita-leadership",
    fullName: "Ishita Verma",
    title: "Leadership coach · ICF PCC",
    proof: "https://www.linkedin.com/in/ishita-verma-demo/",
    trades: [
      {
        pillar: "hr-leadership",
        offered: "1:1 Founder Leadership Coaching",
        needed: "Programmatic SEO Audit",
        location: "Gurgaon",
      },
    ],
  },
  {
    slug: "kabir-dev",
    fullName: "Kabir Mukherjee",
    title: "Senior fullstack engineer (MERN)",
    proof: "https://www.linkedin.com/in/kabir-mukherjee-demo/",
    trades: [
      {
        pillar: "tech-product",
        offered: "High-End Web Developer (MERN Stack)",
        needed: "GST Registration & ITC Structuring",
        location: "Kolkata / Remote",
      },
    ],
  },
];

const conn = await mysql.createConnection({
  uri: url,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

let membersInserted = 0;
let membersReused = 0;
let tradesInserted = 0;
let tradesSkipped = 0;

try {
  for (const demo of DEMOS) {
    const linkedinSub = `demo:${demo.slug}`;
    const expertise = demo.trades[0]?.offered ?? "";
    const need = demo.trades[0]?.needed ?? "";

    const [existingRows] = await conn.query(
      "SELECT id FROM verified_architect_onboarding WHERE linkedin_sub = ? LIMIT 1",
      [linkedinSub]
    );
    let memberId;
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      memberId = existingRows[0].id;
      membersReused += 1;
    } else {
      const [result] = await conn.execute(
        `INSERT INTO verified_architect_onboarding
           (linkedin_sub, full_name, professional_title, profile_picture_url,
            email, primary_expertise, current_need, proof_of_wisdom_url, source, is_visible)
         VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, 'demo-seed', 1)`,
        [linkedinSub, demo.fullName, demo.title, expertise, need, demo.proof]
      );
      memberId = result.insertId;
      membersInserted += 1;
    }

    for (const trade of demo.trades) {
      const [tradeExisting] = await conn.query(
        `SELECT id FROM trades
          WHERE member_id = ? AND skill_offered = ? AND skill_needed = ?
          LIMIT 1`,
        [memberId, trade.offered, trade.needed]
      );
      if (Array.isArray(tradeExisting) && tradeExisting.length > 0) {
        // Backfill pillar in case the row predates the column.
        await conn.execute(
          "UPDATE trades SET pillar = ? WHERE id = ? AND (pillar IS NULL OR pillar = 'general')",
          [trade.pillar, tradeExisting[0].id]
        );
        tradesSkipped += 1;
        continue;
      }
      await conn.execute(
        `INSERT INTO trades
           (member_id, skill_offered, skill_needed, location_preference, pillar, status)
         VALUES (?, ?, ?, ?, ?, 'open')`,
        [memberId, trade.offered, trade.needed, trade.location, trade.pillar]
      );
      tradesInserted += 1;
    }
  }

  console.log(
    `Demo seed complete:\n` +
      `  members  : +${membersInserted} new, ${membersReused} reused\n` +
      `  trades   : +${tradesInserted} new, ${tradesSkipped} already present\n` +
      `\nLog in via /login with any LinkedIn account that has been onboarded — ` +
      `demo accounts are read-only (no login tokens are generated).`
  );
} catch (e) {
  console.error("Seed failed:", e.message || e);
  process.exitCode = 1;
} finally {
  await conn.end();
}
