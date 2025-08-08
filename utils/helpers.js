// utils/helpers.js
function parseDateSafe(dateStr) {
  // Accept YYYY-MM-DD; return Date object at start of day (UTC safe)
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  // Create date in local timezone; comparisons will use getTime()
  return new Date(y, m - 1, d);
}

function withinDateRange(activityDateStr, startDate, endDate) {
  const ad = parseDateSafe(activityDateStr);
  if (!ad) return false;
  if (startDate && ad < startDate) return false;
  if (endDate && ad > endDate) return false;
  return true;
}

function filterActivitiesByRange(activities = [], startDateStr, endDateStr) {
  const start = parseDateSafe(startDateStr);
  const end = parseDateSafe(endDateStr);
  // If end present, set end to end of day (so inclusive)
  if (end) end.setHours(23, 59, 59, 999);
  return activities.filter((a) => withinDateRange(a.date, start, end));
}

function flattenAllActivitiesFromCompanies(companies, startDateStr, endDateStr) {
  const all = [];
  companies.forEach((company) => {
    company.teams.forEach((team) => {
      team.members.forEach((member) => {
        const filtered = filterActivitiesByRange(member.activities || [], startDateStr, endDateStr);
        filtered.forEach((act) => {
          all.push({
            companyId: company.companyId,
            companyName: company.name,
            teamId: team.teamId,
            teamName: team.name,
            memberId: member.memberId,
            memberName: member.name,
            date: act.date,
            type: act.type,
            hours: act.hours,
            tags: act.tags || [],
          });
        });
      });
    });
  });
  return all;
}

function aggregateHoursByType(activities) {
  // activities: array of {type, hours}
  return Object.values(
    activities.reduce((acc, a) => {
      if (!acc[a.type]) acc[a.type] = { type: a.type, totalHours: 0 };
      acc[a.type].totalHours += a.hours;
      return acc;
    }, {})
  ).sort((x, y) => y.totalHours - x.totalHours);
}

module.exports = {
  parseDateSafe,
  filterActivitiesByRange,
  flattenAllActivitiesFromCompanies,
  aggregateHoursByType,
};
