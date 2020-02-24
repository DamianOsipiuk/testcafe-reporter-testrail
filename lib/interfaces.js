"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Reporter = (function () {
    function Reporter() {
    }
    return Reporter;
}());
exports.Reporter = Reporter;
var TestStatus;
(function (TestStatus) {
    TestStatus[TestStatus["Passed"] = 1] = "Passed";
    TestStatus[TestStatus["Blocked"] = 2] = "Blocked";
    TestStatus[TestStatus["Untested"] = 3] = "Untested";
    TestStatus[TestStatus["Retest"] = 4] = "Retest";
    TestStatus[TestStatus["Failed"] = 5] = "Failed";
})(TestStatus = exports.TestStatus || (exports.TestStatus = {}));
