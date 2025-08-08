// routes/activity.js
const express = require("express");
const router = express.Router();
const { companies } = require("../data");

// POST /activity
// Body: { memberId, date: "YYYY-MM-DD", type, hours, tags: [] }
router.post("/", (req, res) => {
  try {
    const { memberId, date, type, hours, tags } = req.body;
    if (!memberId || !date || !type || typeof hours !== "number") {
      return res.status(400).json({ error: "memberId, date, type and numeric hours are required" });
    }

    let found = false;
    for (const company of companies) {
      for (const team of company.teams) {
        for (const member of team.members) {
          if (member.memberId === memberId) {
            member.activities = member.activities || [];
            member.activities.push({ date, type, hours, tags: tags || [] });
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) return res.status(404).json({ error: "Member not found" });

    return res.status(201).json({ message: "Activity added" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
