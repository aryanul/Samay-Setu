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

/**
 * Gender-matched portrait. We pick from randomuser.me's stable, free
 * headshot buckets: /men/<n>.jpg for male names, /women/<n>.jpg for female
 * names (n = 0–99). Each demo person uses a distinct index so no two share
 * a face. Gender is set explicitly per person so the photo never mismatches
 * the name.
 */
function portrait(gender, n) {
  const bucket = gender === "female" ? "women" : "men";
  return `https://randomuser.me/api/portraits/${bucket}/${n}.jpg`;
}

const DEMOS = [
  // ───── Finance & Tax ─────
  {
    slug: "priya-finance",
    fullName: "Priya Sengupta",
    gender: "female",
    pic: 1,
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
    gender: "male",
    pic: 11,
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
    gender: "female",
    pic: 5,
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
    gender: "male",
    pic: 12,
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

  // ───── Growth & SEO ─────
  {
    slug: "ananya-seo",
    fullName: "Ananya Roy",
    gender: "female",
    pic: 9,
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
    slug: "sandeep-growth",
    fullName: "Sandeep Nair",
    gender: "male",
    pic: 32,
    title: "Performance marketing lead · paid + SEO",
    proof: "https://www.linkedin.com/in/sandeep-nair-demo/",
    trades: [
      {
        pillar: "growth-seo",
        offered: "Paid Acquisition & Funnel Optimisation",
        needed: "Brand & Visual Identity Design",
        location: "Bengaluru",
      },
    ],
  },
  {
    slug: "tara-organic",
    fullName: "Tara Pillai",
    gender: "female",
    pic: 26,
    title: "Organic growth strategist · content-led SEO",
    proof: "https://www.linkedin.com/in/tara-pillai-demo/",
    trades: [
      {
        pillar: "growth-seo",
        offered: "Content-led SEO & Topical Authority",
        needed: "Product Discovery & Roadmapping",
        location: "Remote",
      },
    ],
  },

  // ───── HR & Leadership ─────
  {
    slug: "meera-hr",
    fullName: "Meera Krishnan",
    gender: "female",
    pic: 16,
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
    slug: "ishita-leadership",
    fullName: "Ishita Verma",
    gender: "female",
    pic: 20,
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
    slug: "aditya-talent",
    fullName: "Aditya Menon",
    gender: "male",
    pic: 33,
    title: "Talent & culture partner · scale-ups",
    proof: "https://www.linkedin.com/in/aditya-menon-demo/",
    trades: [
      {
        pillar: "hr-leadership",
        offered: "Hiring Funnels & Comp Benchmarking",
        needed: "Holistic Nutrition & Lifestyle Plan",
        location: "Gurgaon",
      },
    ],
  },

  // ───── Prem Lifestyle ─────
  {
    slug: "rohan-coach",
    fullName: "Rohan Deshpande",
    gender: "male",
    pic: 14,
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
    slug: "nisha-nutrition",
    fullName: "Nisha Reddy",
    gender: "female",
    pic: 44,
    title: "Holistic nutritionist · gut & energy",
    proof: "https://www.linkedin.com/in/nisha-reddy-demo/",
    trades: [
      {
        pillar: "prem-lifestyle",
        offered: "Holistic Nutrition & Lifestyle Plan",
        needed: "Personal Wealth Management Portfolio",
        location: "Bengaluru",
      },
    ],
  },
  {
    slug: "vivaan-travel",
    fullName: "Vivaan Malhotra",
    gender: "male",
    pic: 45,
    title: "Luxury travel & experience curator",
    proof: "https://www.linkedin.com/in/vivaan-malhotra-demo/",
    trades: [
      {
        pillar: "prem-lifestyle",
        offered: "Bespoke Travel & Experience Planning",
        needed: "1:1 Founder Leadership Coaching",
        location: "Goa / Remote",
      },
    ],
  },

  // ───── Tech & Product ─────
  {
    slug: "kabir-dev",
    fullName: "Kabir Mukherjee",
    gender: "male",
    pic: 15,
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
  {
    slug: "riya-product",
    fullName: "Riya Chatterjee",
    gender: "female",
    pic: 47,
    title: "Senior product manager · fintech",
    proof: "https://www.linkedin.com/in/riya-chatterjee-demo/",
    trades: [
      {
        pillar: "tech-product",
        offered: "Product Discovery & Roadmapping",
        needed: "Content-led SEO & Topical Authority",
        location: "Bengaluru",
      },
    ],
  },
  {
    slug: "arnav-frontend",
    fullName: "Arnav Saxena",
    gender: "male",
    pic: 51,
    title: "Staff frontend engineer · React/Next",
    proof: "https://www.linkedin.com/in/arnav-saxena-demo/",
    trades: [
      {
        pillar: "tech-product",
        offered: "Senior React Engineer (mentorship)",
        needed: "Programmatic SEO Audit",
        location: "Remote",
      },
    ],
  },
  {
    slug: "shreya-data",
    fullName: "Shreya Iyengar",
    gender: "female",
    pic: 65,
    title: "Data scientist · ML & analytics",
    proof: "https://www.linkedin.com/in/shreya-iyengar-demo/",
    trades: [
      {
        pillar: "tech-product",
        offered: "Analytics & ML Model Review",
        needed: "Corporate Tax Planning & Section 17(5)",
        location: "Pune",
      },
    ],
  },

  // ───── Creative & Content ─────
  {
    slug: "vikram-content",
    fullName: "Vikram Shah",
    gender: "male",
    pic: 13,
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
    slug: "diya-brand",
    fullName: "Diya Kapadia",
    gender: "female",
    pic: 68,
    title: "Brand & visual identity designer",
    proof: "https://www.linkedin.com/in/diya-kapadia-demo/",
    trades: [
      {
        pillar: "creative-content",
        offered: "Brand & Visual Identity Design",
        needed: "Paid Acquisition & Funnel Optimisation",
        location: "Mumbai",
      },
    ],
  },
  {
    slug: "aman-video",
    fullName: "Aman Khurana",
    gender: "male",
    pic: 75,
    title: "Video editor & motion designer",
    proof: "https://www.linkedin.com/in/aman-khurana-demo/",
    trades: [
      {
        pillar: "creative-content",
        offered: "Short-form Video Editing & Motion",
        needed: "Product Discovery & Roadmapping",
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
    const picture = portrait(demo.gender, demo.pic);

    const [existingRows] = await conn.query(
      "SELECT id FROM verified_architect_onboarding WHERE linkedin_sub = ? LIMIT 1",
      [linkedinSub]
    );
    let memberId;
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      memberId = existingRows[0].id;
      membersReused += 1;
      // Backfill the gender-matched photo + title onto members seeded earlier
      // (the original seed left profile_picture_url NULL).
      await conn.execute(
        `UPDATE verified_architect_onboarding
            SET profile_picture_url = ?, professional_title = ?
          WHERE id = ?`,
        [picture, demo.title, memberId]
      );
    } else {
      const [result] = await conn.execute(
        `INSERT INTO verified_architect_onboarding
           (linkedin_sub, full_name, professional_title, profile_picture_url,
            email, primary_expertise, current_need, proof_of_wisdom_url, source, is_visible)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'demo-seed', 1)`,
        [linkedinSub, demo.fullName, demo.title, picture, expertise, need, demo.proof]
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
