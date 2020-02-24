"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var utils_1 = require("./utils");
var testrail_1 = require("./testrail");
var interfaces_1 = require("./interfaces");
var TestrailReporter = (function (_super) {
    __extends(TestrailReporter, _super);
    function TestrailReporter(config) {
        var _this = _super.call(this) || this;
        _this.noColors = false;
        _this.testResults = [];
        _this.options = {
            testrailEnabled: process.env.TESTRAIL_ENABLE == "true" ||
                config.testrailEnabled ||
                false,
            host: process.env.TESTRAIL_HOST || config.host,
            user: process.env.TESTRAIL_USER || config.user,
            apiKey: process.env.TESTRAIL_API_KEY || config.apiKey,
            project: process.env.TESTRAIL_PROJECT || config.project,
            projectId: process.env.TESTRAIL_PROJECT_ID || config.projectId,
            plan: process.env.TESTRAIL_PLAN || config.plan,
            planId: process.env.TESTRAIL_PLAN_ID || config.planId,
            suite: process.env.TESTRAIL_SUITE || config.suite || "Master",
            suiteId: process.env.TESTRAIL_SUITE_ID || config.suiteId,
            caseMeta: process.env.TESTRAIL_CASE_META || config.caseMeta || "CID",
            runName: process.env.TESTRAIL_RUN_NAME || config.runName,
            runDescription: process.env.TESTRAIL_RUN_DESCRIPTION || config.runDescription,
            runCloseAfterDays: process.env.TESTRAIL_RUN_CLOSE_AFTER_DAYS || config.runCloseAfterDays,
            uploadScreenshots: process.env.TESTRAIL_UPLOAD_SCREENSHOT == "true" ||
                config.uploadScreenshots ||
                false,
        };
        return _this;
    }
    TestrailReporter.prototype.renderErrors = function (errs) {
        var _this = this;
        this.setIndent(2).newline();
        errs.forEach(function (err, idx) {
            var prefix = _this.chalk.red(idx + 1 + ") ");
            _this.newline()
                .write(_this.formatError(err, prefix))
                .newline()
                .newline();
        });
        this.setIndent(0);
    };
    TestrailReporter.prototype.reportTaskStart = function (startTime, userAgents, testCount) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.startTime = startTime;
                        this.userAgents = userAgents;
                        this.testCount = testCount;
                        this.newline()
                            .write(utils_1.separator)
                            .newline()
                            .write("Running tests in:")
                            .newline()
                            .setIndent(2);
                        userAgents.forEach(function (userAgent) {
                            _this.write(_this.chalk.blue(userAgent)).newline();
                        });
                        this.setIndent(0);
                        if (!this.options.testrailEnabled) return [3, 2];
                        if (!this.options.host ||
                            !this.options.user ||
                            !this.options.apiKey ||
                            (!this.options.project && !this.options.projectId)) {
                            if (!this.options.host) {
                                this.newline()
                                    .write(this.chalk.red.bold("Error: You have to specify Testrail hostname via env or config file."))
                                    .newline();
                            }
                            if (!this.options.user) {
                                this.newline()
                                    .write(this.chalk.red.bold("Error: You have to specify Testrail username via env or config file."))
                                    .newline();
                            }
                            if (!this.options.apiKey) {
                                this.newline()
                                    .write(this.chalk.red.bold("Error: You have to specify Testrail api key via env or config file."))
                                    .newline();
                            }
                            if (!this.options.project && !this.options.projectId) {
                                this.newline()
                                    .write(this.chalk.red.bold("Error: You have to specify Testrail project or projectId via env or config file."))
                                    .newline();
                            }
                            process.exit(1);
                        }
                        this.testrailAPI = new testrail_1.TestRail({
                            host: this.options.host,
                            user: this.options.user,
                            password: this.options.apiKey,
                        }, this);
                        return [4, this.testrailAPI.testConnection()];
                    case 1: return [2, _a.sent()];
                    case 2: return [2];
                }
            });
        });
    };
    TestrailReporter.prototype.reportFixtureStart = function (name, path, meta) {
        this.setIndent(0)
            .newline()
            .write("[Fixture] " + this.chalk.blue(name))
            .newline();
    };
    TestrailReporter.prototype.reportTestDone = function (name, testRunInfo, meta) {
        var durationFormatted = this.moment.duration(testRunInfo.durationMs).format("h[h] mm[m] ss[s]");
        var hasErr = testRunInfo.errs.length;
        var testStatus = null;
        if (testRunInfo.skipped) {
            testStatus = utils_1.Status.Blocked;
        }
        else if (hasErr === 0) {
            testStatus = utils_1.Status.Passed;
        }
        else {
            testStatus = utils_1.Status.Failed;
        }
        var caseId = 0;
        if (meta[this.options.caseMeta]) {
            caseId = Number(meta[this.options.caseMeta].replace("C", "").trim());
        }
        this.testResults.push({
            name: name,
            meta: meta,
            caseId: caseId,
            testRunInfo: testRunInfo,
            durationFormatted: durationFormatted,
            testStatus: testStatus,
        });
        this.setIndent(2)
            .write("[Test] " + this.chalk.blue(name))
            .write(">")
            .write(this.chalk.keyword(testStatus.color)(testStatus.text))
            .write("(" + durationFormatted + ")")
            .newline();
        if (hasErr > 0) {
            this.renderErrors(testRunInfo.errs);
        }
    };
    TestrailReporter.prototype.reportTaskDone = function (endTime, passed, warnings, result) {
        return __awaiter(this, void 0, void 0, function () {
            var durationFormatted, failedTests;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        durationFormatted = this.moment.duration(endTime - (this.startTime || 0)).format("h[h] mm[m] ss[s]");
                        failedTests = this.testResults.filter(function (result) { return result.testStatus.value === utils_1.Status.Failed.value; });
                        if (failedTests.length > 0) {
                            this.setIndent(0)
                                .newline()
                                .write(utils_1.separator)
                                .newline()
                                .write("" + this.chalk.red.bold("Failed tests summary"))
                                .newline()
                                .newline();
                            failedTests.forEach(function (testCase) {
                                _this.setIndent(2)
                                    .write("[Test] " + _this.chalk.blue(testCase.name))
                                    .write(">")
                                    .write(_this.chalk.keyword(testCase.testStatus.color)(testCase.testStatus.text))
                                    .write("(" + testCase.durationFormatted + ")");
                                _this.renderErrors(testCase.testRunInfo.errs);
                            });
                        }
                        this.setIndent(0)
                            .newline()
                            .write(utils_1.separator)
                            .newline()
                            .write("Tests:")
                            .setIndent(1);
                        if (result.passedCount) {
                            this.write(this.chalk.keyword(utils_1.Status.Passed.color)(result.passedCount + " " + utils_1.Status.Passed.text));
                        }
                        if (result.skippedCount) {
                            if (result.passedCount) {
                                this.write("/");
                            }
                            this.write(this.chalk.keyword(utils_1.Status.Blocked.color)(result.skippedCount + " " + utils_1.Status.Blocked.text));
                        }
                        if (result.failedCount) {
                            if (result.passedCount || result.skippedCount) {
                                this.write("/");
                            }
                            this.write(this.chalk.keyword(utils_1.Status.Failed.color)(result.failedCount + " " + utils_1.Status.Failed.text));
                        }
                        this.write("(" + this.testCount + " total)").setIndent(0);
                        this.newline()
                            .write("Time: " + durationFormatted)
                            .newline()
                            .newline();
                        if (!this.options.testrailEnabled) return [3, 2];
                        return [4, this.testrailAPI.publishTestRun(this.options, this.testResults, this.userAgents || [""])];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    return TestrailReporter;
}(interfaces_1.Reporter));
exports.TestrailReporter = TestrailReporter;
module.exports = function () {
    var config = utils_1.loadJSON(path_1.default.join(process.cwd(), ".testrailrc"));
    return new TestrailReporter(config);
};
