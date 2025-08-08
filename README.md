# backend_task
Small Node.js + Express backend showing activity analytics (in-memory data).

## Project structure
backend_task/
├── index.js
├── data.js
├── routes/
│ ├── report.js
│ └── activity.js
├── utils/
│ └── helpers.js
├── package.json
└── README.md


## Quick setup (Local)

### Prerequisites
- Node.js (v14+) and npm installed.
- (Optional) `nodemon` for dev auto-reload.

### Install & run
cd path/to/backend_task
npm install
# Start server
node index.js
# or (recommended for dev)
npx nodemon index.js


#### Sample Responses

GET http://localhost:3000/report/overview

{
  "totalCompanies": 2,
  "totalTeams": 3,
  "totalMembers": 5,
  "totalActivities": 12,
  "totalHours": 34,
  "topActivityTypes": [
    { "type": "coding", "totalHours": 11 },
    { "type": "content", "totalHours": 7 },
    { "type": "meeting", "totalHours": 7 },
    { "type": "design", "totalHours": 4 },
    { "type": "seo", "totalHours": 2 },
    { "type": "review", "totalHours": 1 }
  ]
}


