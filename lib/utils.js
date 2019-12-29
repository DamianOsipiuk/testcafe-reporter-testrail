const fs = require("fs");

module.exports = {
  loadJSON(file) {
    const data = fs.readFileSync(file);
    return JSON.parse(data);
  },
  STATUS: {
    PASS: "PASSED",
    SKIP: "SKIPPED",
    FAIL: "FAILED"
  },
  separator: "------------------------------"
};
