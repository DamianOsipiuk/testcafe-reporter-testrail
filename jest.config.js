/* eslint-disable */
const { jsWithTs } = require("ts-jest/presets");

module.exports = {
  collectCoverage: true,
  moduleFileExtensions: ["ts", "js"],
  testRegex: ".test.ts$",
  transform: {
    ...jsWithTs.transform,
  },
};
