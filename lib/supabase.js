// Supabase client (service role — server-side only).
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

const supabase = url && key ? createClient(url, key) : null;

module.exports = { supabase };
