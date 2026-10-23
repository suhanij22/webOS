const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const uptimeCase = app.match(/case "uptime":\s*print\(`up \$\{Math\.floor\(\(Date\.now\(\) - boot\) \/ (\d+)\)\} minutes`\);/);
assert.ok(uptimeCase, "uptime command should calculate elapsed time in minutes");

const elapsedMilliseconds = 2 * 60 * 1000;
const reportedMinutes = Math.floor(elapsedMilliseconds / Number(uptimeCase[1]));
assert.equal(reportedMinutes, 2);
