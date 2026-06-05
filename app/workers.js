// Seed worker pool for the demo. In production these live in Supabase.
// `wallet` must be a real address on Somnia testnet to receive released STT.
// Display-only fields (role, emoji, tagline, jobsDone) make the marketplace UI feel real.
module.exports.WORKERS = [
  {
    id: "w1",
    name: "Ali Raza",
    role: "Plumber",
    emoji: "🔧",
    skills: ["plumbing", "general"],
    rating: 4.8,
    jobsDone: 127,
    available: true,
    location: "Lahore",
    tagline: "Leak-free guarantee. Same-day callouts.",
    wallet: "0x000000000000000000000000000000000000dEaD",
  },
  {
    id: "w2",
    name: "Sara Khan",
    role: "Electrician",
    emoji: "⚡",
    skills: ["electrical", "tech"],
    rating: 4.6,
    jobsDone: 98,
    available: true,
    location: "Lahore",
    tagline: "Certified wiring & smart-home installs.",
    wallet: "0x000000000000000000000000000000000000bEEF",
  },
  {
    id: "w3",
    name: "Hassan Iqbal",
    role: "Cleaner",
    emoji: "🧹",
    skills: ["cleaning", "delivery"],
    rating: 4.9,
    jobsDone: 211,
    available: true,
    location: "Karachi",
    tagline: "Deep cleans & reliable doorstep delivery.",
    wallet: "0x000000000000000000000000000000000000CAFE",
  },
];
