export default async function handler(req, res) {
  try {
    const SCOREBAT_API = process.env.SCOREBAT_API;
    if (!SCOREBAT_API) {
      return res.status(500).json({ error: "Missing SCOREBAT_API" });
    }

    const r = await fetch(SCOREBAT_API);
    if (!r.ok) return res.status(500).json({ error: "Scorebat request failed" });

    const data = await r.json();

    const competition = String(req.query.competition || "").toLowerCase();
    let matches = Array.isArray(data.response) ? data.response : [];

    if (competition) {
      matches = matches.filter((m) =>
        String(m.competition || "").toLowerCase().includes(competition)
      );
    }

    res.status(200).json({ response: matches });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch highlights" });
  }
}