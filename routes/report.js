// routes/report.js
const express = require("express");
const router = express.Router();
const { companies } = require("../data");
const {
  filterActivitiesByRange,
  flattenAllActivitiesFromCompanies,
  aggregateHoursByType,
} = require("../utils/helpers");

// GET /report/overview
router.get("/overview", (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const totalCompanies = companies.length;
    let totalTeams = 0;
    let totalMembers = 0;
    let totalActivities = 0;
    let totalHours = 0;
    const activityTypeMap = {};

    companies.forEach((company) => {
      company.teams.forEach((team) => {
        totalTeams += 1;
        team.members.forEach((member) => {
          totalMembers += 1;
          const activities = filterActivitiesByRange(member.activities || [], startDate, endDate);
          totalActivities += activities.length;
          activities.forEach((a) => {
            totalHours += a.hours;
            activityTypeMap[a.type] = (activityTypeMap[a.type] || 0) + a.hours;
          });
        });
      });
    });

    // topActivityTypes array sorted desc by hours
    const topActivityTypes = Object.keys(activityTypeMap)
      .map((type) => ({ type, totalHours: activityTypeMap[type] }))
      .sort((a, b) => b.totalHours - a.totalHours);

    return res.json({
      totalCompanies,
      totalTeams,
      totalMembers,
      totalActivities,
      totalHours,
      topActivityTypes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /report/company/:companyId
router.get("/company/:companyId", (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    const company = companies.find((c) => c.companyId === companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const teams = company.teams.map((team) => {
      const members = team.members || [];
      const totalMembers = members.length;

      // gather team activities filtered by date range
      const allTeamActivities = [];
      members.forEach((m) => {
        const acts = filterActivitiesByRange(m.activities || [], startDate, endDate);
        acts.forEach((a) => {
          allTeamActivities.push({ ...a, memberId: m.memberId });
        });
      });

      const totalHours = allTeamActivities.reduce((s, a) => s + a.hours, 0);

      // Activity breakdown by type
      const activityBreakdown = Object.values(
        allTeamActivities.reduce((acc, a) => {
          if (!acc[a.type]) acc[a.type] = { type: a.type, totalHours: 0 };
          acc[a.type].totalHours += a.hours;
          return acc;
        }, {})
      ).sort((x, y) => y.totalHours - x.totalHours);

      // Unique tags
      const tagSet = new Set();
      allTeamActivities.forEach((a) => {
        (a.tags || []).forEach((t) => tagSet.add(t));
      });

      return {
        teamId: team.teamId,
        teamName: team.name,
        totalMembers,
        totalHours,
        activityBreakdown,
        uniqueTags: Array.from(tagSet),
      };
    });

    // Bonus: flattened activity summary across the company grouped by type
    const allCompanyActivities = flattenAllActivitiesFromCompanies([company], startDate, endDate);
    const activitySummaryByType = {}; // type => { totalHours, members:Set }

    allCompanyActivities.forEach((a) => {
      if (!activitySummaryByType[a.type]) {
        activitySummaryByType[a.type] = { totalHours: 0, members: new Set() };
      }
      activitySummaryByType[a.type].totalHours += a.hours;
      activitySummaryByType[a.type].members.add(a.memberId);
    });

    const activitySummaryByTypeOutput = {};
    Object.keys(activitySummaryByType).forEach((type) => {
      activitySummaryByTypeOutput[type] = {
        totalHours: activitySummaryByType[type].totalHours,
        members: activitySummaryByType[type].members.size,
      };
    });

    return res.json({
      companyId: company.companyId,
      companyName: company.name,
      teams,
      activitySummaryByType: activitySummaryByTypeOutput, // bonus included
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});



router.get('/report/company/:companyId', (req, res) => {
  const companyId = parseInt(req.params.companyId);
  const company = companies.find(c => c.id === companyId);

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  // Existing company report
  const report = {
    companyName: company.name,
    teams: company.teams.map(team => ({
      teamName: team.name,
      members: team.members.map(member => ({
        memberName: member.name,
        activities: member.activities
      }))
    }))
  };

  // New: Flattened summary by activity type
  const activitySummaryByType = {};

  company.teams.forEach(team => {
    team.members.forEach(member => {
      member.activities.forEach(activity => {
        if (!activitySummaryByType[activity.type]) {
          activitySummaryByType[activity.type] = {
            totalHours: 0,
            members: new Set()
          };
        }
        activitySummaryByType[activity.type].totalHours += activity.hours;
        activitySummaryByType[activity.type].members.add(member.name);
      });
    });
  });

  // Convert member sets to counts
  for (let type in activitySummaryByType) {
    activitySummaryByType[type] = {
      totalHours: activitySummaryByType[type].totalHours,
      members: activitySummaryByType[type].members.size
    };
  }

  report.activitySummaryByType = activitySummaryByType;

  res.json(report);
});


// GET /report/member/:memberId
router.get("/member/:memberId", (req, res) => {
  try {
    const { memberId } = req.params;
    const { startDate, endDate } = req.query;

    let foundMember = null;
    // locate member
    outer: for (const company of companies) {
      for (const team of company.teams) {
        for (const member of team.members) {
          if (member.memberId === memberId) {
            foundMember = { ...member };
            break outer;
          }
        }
      }
    }

    if (!foundMember) return res.status(404).json({ error: "Member not found" });

    const activities = filterActivitiesByRange(foundMember.activities || [], startDate, endDate);

    // group by date
    const dailyMap = activities.reduce((acc, a) => {
      if (!acc[a.date]) acc[a.date] = { date: a.date, activities: [], hours: 0 };
      acc[a.date].activities.push(a.type);
      acc[a.date].hours += a.hours;
      return acc;
    }, {});

    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => {
      // sort ascending by date string (YYYY-MM-DD)
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });

    const totalHours = activities.reduce((s, a) => s + a.hours, 0);

    return res.json({
      memberId: foundMember.memberId,
      name: foundMember.name,
      totalHours,
      dailyBreakdown,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
  