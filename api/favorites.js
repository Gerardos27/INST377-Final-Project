import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ favorites: data });
    }

    if (req.method === "POST") {
      const { title, competition, match_url } = req.body || {};
      if (!title) return res.status(400).json({ error: "title is required" });

      const { data, error } = await supabase
        .from("favorites")
        .insert([{ title, competition, match_url }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ favorite: data[0] });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Favorites endpoint failed" });
  }
}