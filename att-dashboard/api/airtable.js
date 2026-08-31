// api/airtable.js
// Serverless proxy so the Airtable token never reaches the browser.
// The student-facing page calls /api/airtable?table=...&filterByFormula=...
// instead of api.airtable.com directly.

const BASE_ID = "appEikovLHpe11LB2";

// Only these tables can be read through this endpoint.
const ALLOWED_TABLES = new Set([
  "Students",
  "Schools",
  "Tasks",
  "Submissions",
  "Rewards",
  "Dashboard Config",
  "Advisors",
  "Reward Log"
]);

module.exports = async (req, res) => {
  // Read-only for now — this only needs to support the dashboard's GET calls.
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { table, recordId, filterByFormula } = req.query;

  if (!table || !ALLOWED_TABLES.has(table)) {
    res.status(400).json({ error: "Invalid or missing table" });
    return;
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Server misconfigured: AIRTABLE_TOKEN is not set" });
    return;
  }

  let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  if (recordId) {
    url += `/${encodeURIComponent(recordId)}`;
  } else if (filterByFormula) {
    url += `?filterByFormula=${encodeURIComponent(filterByFormula)}`;
  }

  try {
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await airtableRes.json();
    res.status(airtableRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Airtable" });
  }
};
