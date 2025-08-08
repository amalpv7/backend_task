// index.js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const reportRoutes = require("./routes/report");
const activityRoutes = require("./routes/activity");

app.use("/report", reportRoutes);
app.use("/activity", activityRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
