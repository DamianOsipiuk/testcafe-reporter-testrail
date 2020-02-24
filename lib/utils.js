"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var interfaces_1 = require("./interfaces");
function loadJSON(file) {
    var data = fs_1.default.readFileSync(file, { encoding: "utf8" });
    return JSON.parse(data);
}
exports.loadJSON = loadJSON;
exports.Status = {
    Passed: {
        value: interfaces_1.TestStatus.Passed,
        text: "PASSED",
        color: "yellow",
    },
    Blocked: {
        value: interfaces_1.TestStatus.Blocked,
        text: "SKIPPED",
        color: "green",
    },
    Failed: {
        value: interfaces_1.TestStatus.Failed,
        text: "FAILED",
        color: "red",
    },
};
exports.separator = "------------------------------";
