"use strict";
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
var fs_1 = __importDefault(require("fs"));
var querystring_1 = __importDefault(require("querystring"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var utils_1 = require("./utils");
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["Get"] = "get";
    HttpMethod["Post"] = "post";
})(HttpMethod || (HttpMethod = {}));
var TestRail = (function () {
    function TestRail(options, reporter) {
        var _this = this;
        this.printError = function (error) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger
                    .newline()
                    .write(this.chalk.red.bold("Error: " + error))
                    .newline();
                return [2];
            });
        }); };
        this.testConnection = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger
                            .newline()
                            .write(utils_1.separator)
                            .newline()
                            .write(this.chalk.green("Testing connection to TestRail..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.getProjects()];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.printError("Connection to TestRail instance could not be established.");
                        process.exit(1);
                        return [3, 4];
                    case 4:
                        this.logger
                            .write(this.chalk.green("Done"))
                            .newline()
                            .write(utils_1.separator)
                            .newline();
                        return [2];
                }
            });
        }); };
        this.getProjectId = function (projectName, projectId) { return __awaiter(_this, void 0, void 0, function () {
            var project, projects, pid_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        project = void 0;
                        return [4, this.getProjects()];
                    case 1:
                        projects = _a.sent();
                        if (projectId) {
                            pid_1 = Number(projectId.replace("P", ""));
                            project = projects.find(function (project) { return project.id === pid_1; });
                        }
                        else {
                            project = projects.find(function (project) { return project.name === projectName; });
                        }
                        if (project && project.id) {
                            this.logger
                                .write(this.chalk.blue.bold("Project name (id)") + " " + this.chalk.yellow(project.name + " (" + project.id + ")"))
                                .newline();
                            return [2, project.id];
                        }
                        else {
                            this.printError("Project does not exist.");
                            process.exit(1);
                        }
                        return [3, 3];
                    case 2:
                        error_2 = _a.sent();
                        this.printError("Could not retrieve project list.");
                        this.logger.write(error_2.toString()).newline();
                        process.exit(1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); };
        this.getPlanId = function (planName, planId, projectId) { return __awaiter(_this, void 0, void 0, function () {
            var plan, plans, pid_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!planName && !planId) {
                            return [2, undefined];
                        }
                        plan = void 0;
                        return [4, this.getPlans(projectId)];
                    case 1:
                        plans = _a.sent();
                        if (planId) {
                            pid_2 = Number(planId.replace("R", ""));
                            plan = plans.find(function (plan) { return plan.id === pid_2; });
                        }
                        else {
                            plan = plans.find(function (plan) { return plan.name === planName; });
                        }
                        if (plan && plan.id) {
                            this.logger
                                .write(this.chalk.blue.bold("Plan name (id)") + " " + this.chalk.yellow(plan.name + " (" + plan.id + ")"))
                                .newline();
                            return [2, plan.id];
                        }
                        else {
                            this.printError("Plan does not exist.");
                            process.exit(1);
                        }
                        return [3, 3];
                    case 2:
                        error_3 = _a.sent();
                        this.printError("Could not retrieve plan list.");
                        this.logger.write(error_3.toString()).newline();
                        process.exit(1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); };
        this.getSuiteId = function (suiteName, suiteId, projectId) { return __awaiter(_this, void 0, void 0, function () {
            var suite, suites, sid_1, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        suite = void 0;
                        return [4, this.getSuites(projectId)];
                    case 1:
                        suites = _a.sent();
                        if (suiteId) {
                            sid_1 = Number(suiteId.replace("S", ""));
                            suite = suites.find(function (suite) { return suite.id === sid_1; });
                        }
                        else {
                            suite = suites.find(function (suite) { return suite.name === suiteName; });
                        }
                        if (suite && suite.id) {
                            this.logger
                                .write(this.chalk.blue.bold("Suite name (id)") + " " + this.chalk.yellow(suite.name + " (" + suite.id + ")"))
                                .newline();
                            return [2, suite.id];
                        }
                        else {
                            this.printError("Suite does not exist.");
                            process.exit(1);
                        }
                        return [3, 3];
                    case 2:
                        error_4 = _a.sent();
                        this.printError("Could not retrieve suite list.");
                        this.logger.write(error_4.toString()).newline();
                        process.exit(1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); };
        this.closeOldRuns = function (projectId, options) { return __awaiter(_this, void 0, void 0, function () {
            var runs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options.runCloseAfterDays) return [3, 2];
                        return [4, this.getRuns(projectId)];
                    case 1:
                        runs = _a.sent();
                        runs.forEach(function (run) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(!run.is_completed &&
                                            this.moment.unix(run.created_on) <=
                                                this.moment().subtract(options.runCloseAfterDays, "days"))) return [3, 2];
                                        this.logger.write("Closing outdated run: " + run.name).newline();
                                        return [4, this.closeRun(run.id)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2];
                                }
                            });
                        }); });
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        }); };
        this.publishTestResults = function (run, results, testResults, options) { return __awaiter(_this, void 0, void 0, function () {
            var payload, runId, results_1, tests_1, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            results: results,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        runId = run.id;
                        return [4, this.addResultsForCases(runId, payload)];
                    case 2:
                        results_1 = _a.sent();
                        return [4, this.getTests(runId)];
                    case 3:
                        tests_1 = _a.sent();
                        if (options.uploadScreenshots) {
                            testResults.forEach(function (testResult) {
                                var test = tests_1.find(function (test) { return test.case_id === testResult.caseId; });
                                var result = results_1.find(function (result) { return result.test_id === (test === null || test === void 0 ? void 0 : test.id); });
                                if (result) {
                                    testResult.testRunInfo.screenshots.forEach(function (screenshot) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4, this.addAttachmentToResult(result.id, screenshot.screenshotPath)];
                                                case 1:
                                                    _a.sent();
                                                    return [2];
                                            }
                                        });
                                    }); });
                                }
                            });
                        }
                        if (results_1.length == 0) {
                            this.logger
                                .newline()
                                .write(this.chalk.yellow("Warning: No Data has been published to Testrail."))
                                .newline();
                        }
                        else {
                            this.logger
                                .newline()
                                .write("------------------------------------------------------")
                                .newline()
                                .write(this.chalk.green("Result added to the testrail successfully."))
                                .newline()
                                .newline();
                        }
                        return [3, 5];
                    case 4:
                        error_5 = _a.sent();
                        this.printError("Could not post test results.");
                        this.logger.write(error_5.toString()).newline();
                        process.exit(1);
                        return [3, 5];
                    case 5: return [2];
                }
            });
        }); };
        this.publishTestRun = function (options, testResults, userAgents) { return __awaiter(_this, void 0, void 0, function () {
            var results, caseIdList, projectId, planId, suiteId, creationDate, runName, payload, run, planEntry, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger
                            .newline()
                            .write(utils_1.separator)
                            .newline()
                            .write(this.chalk.green("Publishing the results to testrail..."))
                            .newline();
                        results = [];
                        caseIdList = [];
                        testResults.forEach(function (testResult) {
                            if (testResult.caseId > 0) {
                                var errorLog = testResult.testRunInfo.errs
                                    .map(function (x) {
                                    return _this.logger
                                        .formatError(x)
                                        .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
                                })
                                    .join("\n");
                                var result = {
                                    case_id: testResult.caseId,
                                    status_id: testResult.testStatus.value,
                                    comment: "Test " + testResult.testStatus.text + "\n" + errorLog,
                                };
                                results.push(result);
                                caseIdList.push(testResult.caseId);
                            }
                            else {
                                _this.logger
                                    .write("Warning: Test " + _this.chalk.yellow(testResult.name) + " missing the TestRail Case ID in test metadata")
                                    .newline();
                            }
                        });
                        if (!results.length) return [3, 13];
                        return [4, this.getProjectId(options.project, options.projectId)];
                    case 1:
                        projectId = _a.sent();
                        return [4, this.getPlanId(options.plan, options.planId, projectId)];
                    case 2:
                        planId = _a.sent();
                        return [4, this.getSuiteId(options.suite, options.suiteId, projectId)];
                    case 3:
                        suiteId = _a.sent();
                        creationDate = this.moment().format("YYYY-MM-DD HH:mm:ss");
                        runName = "";
                        if (options.runName) {
                            runName = options.runName
                                .replace("%DATE%", creationDate)
                                .replace("%AGENTS%", "(" + userAgents.join(", ") + ")");
                        }
                        else {
                            runName = creationDate + " (" + userAgents.join(", ") + ")";
                        }
                        payload = {
                            suite_id: suiteId,
                            include_all: false,
                            case_ids: caseIdList,
                            name: runName,
                            description: options.runDescription,
                        };
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 11, , 12]);
                        run = void 0;
                        if (!planId) return [3, 6];
                        return [4, this.addPlanEntry(planId, payload)];
                    case 5:
                        planEntry = _a.sent();
                        run = planEntry.runs[0];
                        return [3, 9];
                    case 6: return [4, this.closeOldRuns(projectId, options)];
                    case 7:
                        _a.sent();
                        return [4, this.addRun(projectId, payload)];
                    case 8:
                        run = _a.sent();
                        _a.label = 9;
                    case 9:
                        this.logger
                            .newline()
                            .write(utils_1.separator)
                            .newline()
                            .write(this.chalk.green("Run added successfully."))
                            .newline()
                            .write(this.chalk.blue.bold("Run name") + " " + runName)
                            .newline();
                        return [4, this.publishTestResults(run, results, testResults, options)];
                    case 10:
                        _a.sent();
                        return [3, 12];
                    case 11:
                        error_6 = _a.sent();
                        this.printError("Could not post test results.");
                        this.logger.write(error_6.toString()).newline();
                        process.exit(1);
                        return [3, 12];
                    case 12: return [3, 14];
                    case 13:
                        this.logger
                            .newline()
                            .write(this.chalk.red.bold(this.logger.symbols.err))
                            .write("No test case data found to publish")
                            .newline();
                        _a.label = 14;
                    case 14: return [2];
                }
            });
        }); };
        this._callAPI = function (method, apiUrl, queryVariables, body) { return __awaiter(_this, void 0, void 0, function () {
            var requestBody, url;
            return __generator(this, function (_a) {
                requestBody = body ? JSON.stringify(body) : undefined;
                url = this.host + this.baseUrl + apiUrl;
                if (queryVariables != null) {
                    url += "&" + querystring_1.default.stringify(queryVariables);
                }
                return [2, node_fetch_1.default(url, {
                        method: method,
                        body: requestBody,
                        headers: {
                            "Content-Type": "application/json",
                            accept: "application/json",
                            Authorization: this.authHeader,
                        },
                    }).then(function (res) { return res.json(); })];
            });
        }); };
        this.apiGet = function (apiUrl, queryVariables) {
            if (queryVariables === void 0) { queryVariables = undefined; }
            return _this._callAPI(HttpMethod.Get, apiUrl, queryVariables);
        };
        this.apiPost = function (apiUrl, body, queryVariables) {
            if (body === void 0) { body = undefined; }
            if (queryVariables === void 0) { queryVariables = undefined; }
            return _this._callAPI(HttpMethod.Post, apiUrl, queryVariables, body);
        };
        this.getCase = function (id) {
            return _this.apiGet("get_case/" + id);
        };
        this.getCases = function (project_id, filters) {
            return _this.apiGet("get_cases/" + project_id, filters);
        };
        this.addCase = function (section_id, data) {
            return _this.apiPost("add_case/" + section_id, data);
        };
        this.updateCase = function (case_id, data) {
            return _this.apiPost("update_case/" + case_id, data);
        };
        this.deleteCase = function (case_id) {
            return _this.apiPost("delete_case/" + case_id);
        };
        this.getCaseFields = function () {
            return _this.apiGet("get_case_fields");
        };
        this.getCaseTypes = function () {
            return _this.apiGet("get_case_types");
        };
        this.getConfigs = function (project_id) {
            return _this.apiGet("get_configs/" + project_id);
        };
        this.addConfigGroup = function (project_id, data) {
            return _this.apiPost("add_config_group/" + project_id, data);
        };
        this.addConfig = function (config_group_id, data) {
            return _this.apiPost("add_config/" + config_group_id, data);
        };
        this.updateConfigGroup = function (config_group_id, data) {
            return _this.apiPost("update_config_group/" + config_group_id, data);
        };
        this.updateConfig = function (config_id, data) {
            return _this.apiPost("update_config/" + config_id, data);
        };
        this.deleteConfigGroup = function (config_group_id) {
            return _this.apiPost("delete_config_group/" + config_group_id);
        };
        this.deleteConfig = function (config_id) {
            return _this.apiPost("delete_config/" + config_id);
        };
        this.getMilestone = function (id) {
            return _this.apiGet("get_milestone/" + id);
        };
        this.getMilestones = function (project_id, filters) {
            return _this.apiGet("get_milestones/" + project_id, filters);
        };
        this.addMilestone = function (project_id, data) {
            return _this.apiPost("add_milestone/" + project_id, data);
        };
        this.updateMilestone = function (milestone_id, data) {
            return _this.apiPost("update_milestone/" + milestone_id, data);
        };
        this.deleteMilestone = function (milestone_id) {
            return _this.apiPost("delete_milestone/" + milestone_id);
        };
        this.getPlan = function (id) {
            return _this.apiGet("get_plan/" + id);
        };
        this.getPlans = function (project_id, filters) {
            return _this.apiGet("get_plans/" + project_id, filters);
        };
        this.addPlan = function (project_id, data) {
            return _this.apiPost("add_plan/" + project_id, data);
        };
        this.addPlanEntry = function (plan_id, data) {
            return _this.apiPost("add_plan_entry/" + plan_id, data);
        };
        this.updatePlan = function (plan_id, data) {
            return _this.apiPost("update_plan/" + plan_id, data);
        };
        this.updatePlanEntry = function (plan_id, entry_id, data) {
            return _this.apiPost("update_plan_entry/" + plan_id + "/" + entry_id, data);
        };
        this.closePlan = function (plan_id) {
            return _this.apiPost("close_plan/" + plan_id);
        };
        this.deletePlan = function (plan_id) {
            return _this.apiPost("delete_plan/" + plan_id);
        };
        this.deletePlanEntry = function (plan_id, entry_id) {
            return _this.apiPost("delete_plan_entry/" + plan_id + "/" + entry_id);
        };
        this.getPriorities = function () {
            return _this.apiGet("get_priorities");
        };
        this.getProject = function (id) {
            return _this.apiGet("get_project/" + id);
        };
        this.getProjects = function (filters) {
            return _this.apiGet("get_projects", filters);
        };
        this.addProject = function (data) {
            return _this.apiPost("add_project", data);
        };
        this.updateProject = function (project_id, data) {
            return _this.apiPost("update_project/" + project_id, data);
        };
        this.deleteProject = function (project_id) {
            return _this.apiPost("delete_project/" + project_id);
        };
        this.getResults = function (test_id, filters) {
            return _this.apiGet("get_results/" + test_id, filters);
        };
        this.getResultsForCase = function (run_id, case_id, filters) {
            return _this.apiGet("get_results_for_case/" + run_id + "/" + case_id, filters);
        };
        this.getResultsForRun = function (run_id, filters) {
            return _this.apiGet("get_results_for_run/" + run_id, filters);
        };
        this.addResult = function (test_id, data) {
            return _this.apiPost("add_result/" + test_id, data);
        };
        this.addResultForCase = function (run_id, case_id, data) {
            return _this.apiPost("add_result_for_case/" + run_id + "/" + case_id, data);
        };
        this.addResults = function (run_id, data) {
            return _this.apiPost("add_results/" + run_id, data);
        };
        this.addResultsForCases = function (run_id, data) {
            return _this.apiPost("add_results_for_cases/" + run_id, data);
        };
        this.getResultFields = function () {
            return _this.apiGet("get_result_fields");
        };
        this.getRun = function (id) {
            return _this.apiGet("get_run/" + id);
        };
        this.getRuns = function (project_id, filters) {
            return _this.apiGet("get_runs/" + project_id, filters);
        };
        this.addRun = function (project_id, data) {
            return _this.apiPost("add_run/" + project_id, data);
        };
        this.updateRun = function (run_id, data) {
            return _this.apiPost("update_run/" + run_id, data);
        };
        this.closeRun = function (run_id) {
            return _this.apiPost("close_run/" + run_id);
        };
        this.deleteRun = function (run_id) {
            return _this.apiPost("delete_run/" + run_id);
        };
        this.getSection = function (id) {
            return _this.apiGet("get_section/" + id);
        };
        this.getSections = function (project_id, filters) {
            return _this.apiGet("get_sections/" + project_id, filters);
        };
        this.addSection = function (project_id, data) {
            return _this.apiPost("add_section/" + project_id, data);
        };
        this.updateSection = function (section_id, data) {
            return _this.apiPost("update_section/" + section_id, data);
        };
        this.deleteSection = function (section_id) {
            return _this.apiPost("delete_section/" + section_id);
        };
        this.getStatuses = function () {
            return _this.apiGet("get_statuses");
        };
        this.getSuite = function (id) {
            return _this.apiGet("get_suite/" + id);
        };
        this.getSuites = function (project_id) {
            return _this.apiGet("get_suites/" + project_id);
        };
        this.addSuite = function (project_id, data) {
            return _this.apiPost("add_suite/" + project_id, data);
        };
        this.updateSuite = function (suite_id, data) {
            return _this.apiPost("update_suite/" + suite_id, data);
        };
        this.deleteSuite = function (suite_id) {
            return _this.apiPost("delete_suite/" + suite_id);
        };
        this.getTemplates = function (project_id) {
            return _this.apiGet("get_templates/" + project_id);
        };
        this.getTest = function (id) {
            return _this.apiGet("get_test/" + id);
        };
        this.getTests = function (run_id, filters) {
            return _this.apiGet("get_tests/" + run_id, filters);
        };
        this.getUser = function (id) {
            return _this.apiGet("get_user/" + id);
        };
        this.getUserByEmail = function (email) {
            return _this.apiGet("get_user_by_email", { email: email });
        };
        this.getUsers = function () {
            return _this.apiGet("get_users");
        };
        this.addAttachmentToResult = function (result_id, filePath) {
            var url = _this.host + _this.baseUrl + "add_attachment_to_result/" + result_id;
            return node_fetch_1.default(url, {
                method: "post",
                headers: {
                    "Content-Type": "multipart/form-data",
                    accept: "application/json",
                    Authorization: _this.authHeader,
                },
                body: fs_1.default.createReadStream(filePath),
            }).then(function (res) { return res.json(); });
        };
        this.host = options.host;
        this.baseUrl = "/index.php?/api/v2/";
        this.authHeader =
            "Basic " +
                Buffer.from(options.user + ":" + options.password).toString("base64");
        this.logger = reporter;
        this.chalk = reporter.chalk;
        this.moment = reporter.moment;
    }
    return TestRail;
}());
exports.TestRail = TestRail;
