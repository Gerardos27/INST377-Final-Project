require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SCOREBAT_API = process.env.SCOREBAT_API;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];
if (!SCOREBAT_API) missing.push("SCOREBAT_API");
if (!SUPABASE_URL) missing.push("SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

if (missing.length > 0) {
  console.warn("Missing env vars: " + missing.join(", "));
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "");

app.get("/api/highlights", async (req, res) => {
  try {
    const response = await fetch(SCOREBAT_API);
    const data = await response.json();

    const competition = String(req.query.competition || "").toLowerCase();
    let matches = Array.isArray(data.response) ? data.response : [];

    if (competition) {
      matches = matches.filter((m) =>
        String(m.competition || "").toLowerCase().includes(competition)
      );
    }

    res.json({ response: matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch highlights" });
  }
});

app.get("/api/favorites", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ favorites: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load favorites" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { title, competition, match_url } = req.body;

    if (!title) return res.status(400).json({ error: "title is required" });

    const { data, error } = await supabase
      .from("favorites")
      .insert([{ title, competition, match_url }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ favorite: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save favorite" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});