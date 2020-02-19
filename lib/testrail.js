// API reference: http://docs.gurock.com/testrail-api2/start

const qs = require("querystring");
const fetch = require("node-fetch");
const utils = require("./utils");

const STATUS = utils.STATUS;
const separator = utils.separator;

class TestRail {
  constructor(options, logger) {
    this.host = options.host;
    this.baseUrl = "/index.php?/api/v2/";
    this.authHeader =
      "Basic " +
      Buffer.from(options.user + ":" + options.password).toString("base64");

    this.logger = logger;
    this.chalk = this.logger.chalk;
    this.moment = this.logger.moment;
  }

  printError = async error => {
    this.logger
      .newline()
      .write(this.chalk.red.bold(`Error: ${error}`))
      .newline();
  };

  testConnection = async () => {
    this.logger
      .newline()
      .write(separator)
      .newline()
      .write(this.chalk.green("Testing connection to TestRail..."));

    try {
      await this.getProjects();
    } catch (error) {
      this.printError(
        "Connection to TestRail instance could not be established."
      );
      process.exit(1);
    }

    this.logger
      .write(this.chalk.green("Done"))
      .newline()
      .write(separator)
      .newline();
  };

  getProjectId = async (projectName, projectId) => {
    try {
      let project;

      const projects = await this.getProjects();
      if (projectId) {
        const pid = Number(projectId.replace("P", ""));
        project = projects.find(project => project.id === pid);
      } else {
        project = projects.find(project => project.name === projectName);
      }

      if (project && project.id) {
        this.logger
          .write(
            `${this.chalk.blue.bold("Project name (id)")} ${this.chalk.yellow(
              `${project.name} (${project.id})`
            )}`
          )
          .newline();

        return project.id;
      } else {
        this.printError("Project does not exist.");
        process.exit(1);
      }
    } catch (error) {
      this.printError("Could not retrieve project list.");
      this.logger.write(error.toString()).newline();
      process.exit(1);
    }
  };

  getPlanId = async (planName, planId, projectId) => {
    try {
      if (!planName && !planId) {
        return undefined;
      }

      let plan;
      const plans = await this.getPlans(projectId);
      if (planId) {
        const pid = Number(planId.replace("R", ""));
        plan = plans.find(plan => plan.id === pid);
      } else {
        plan = plans.find(plan => plan.name === planName);
      }

      if (plan && plan.id) {
        this.logger
          .write(
            `${this.chalk.blue.bold("Plan name (id)")} ${this.chalk.yellow(
              `${plan.name} (${plan.id})`
            )}`
          )
          .newline();

        return plan.id;
      } else {
        this.printError("Plan does not exist.");
        process.exit(1);
      }
    } catch (error) {
      this.printError("Could not retrieve plan list.");
      this.logger.write(error.toString()).newline();
      process.exit(1);
    }
  };

  getSuiteId = async (suiteName, suiteId, projectId) => {
    try {
      let suite;
      const suites = await this.getSuites(projectId);
      if (suiteId) {
        const sid = Number(suiteId.replace("S", ""));
        suite = suites.find(suite => suite.id === sid);
      } else {
        suite = suites.find(suite => suite.name === suiteName);
      }

      if (suite && suite.id) {
        this.logger
          .write(
            `${this.chalk.blue.bold("Suite name (id)")} ${this.chalk.yellow(
              `${suite.name} (${suite.id})`
            )}`
          )
          .newline();

        return suite.id;
      } else {
        this.printError("Suite does not exist.");
        process.exit(1);
      }
    } catch (error) {
      this.printError("Could not retrieve suite list.");
      this.logger.write(error.toString()).newline();
      process.exit(1);
    }
  };

  publishTestResults = async (run, results) => {
    const payload = {
      results
    };

    try {
      const runId = run.runs ? run.runs[0].id : run.id;
      const response = await this.addResultsForCases(runId, payload);

      if (response.length == 0) {
        this.logger
          .newline()
          .write(
            this.chalk.yellow(
              "Warning: No Data has been published to Testrail."
            )
          )
          .newline();
      } else {
        this.logger
          .newline()
          .write("------------------------------------------------------")
          .newline()
          .write(this.chalk.green("Result added to the testrail successfully."))
          .newline()
          .newline();
      }
    } catch (error) {
      this.printError("Could not post test results.");
      this.logger.write(error.toString()).newline();
      process.exit(1);
    }
  };

  publishTestRun = async (options, testResults, userAgents) => {
    this.logger
      .newline()
      .write(separator)
      .newline()
      .write(this.chalk.green("Publishing the results to testrail..."))
      .newline();

    const results = [];
    const caseIdList = [];

    testResults.forEach(testResult => {
      const testMetadata = testResult.test.meta;
      if (testMetadata[options.testrailCaseIdMeta]) {
        const caseId = testMetadata[options.testrailCaseIdMeta]
          .replace("C", "")
          .trim();

        const result = {
          case_id: caseId
        };

        if (testResult.test.status === STATUS.SKIP) {
          result.status_id = 2;
          result.comment = "Test Skipped";
        } else if (testResult.test.status === STATUS.PASS) {
          result.status_id = 1;
          result.comment = "Test Passed";
        } else {
          result.status_id = 5;
          result.comment = testResult.testRunInfo.errs
            .map(x =>
              this.logger
                .formatError(x)
                .replace(
                  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
                  ""
                )
            )
            .join("\n");
        }

        results.push(result);
        caseIdList.push(caseId);
      } else {
        this.logger
          .write(
            `Warning: Test ${this.chalk.yellow(
              testResult.test.name
            )} missing the TestRail Case ID in test metadata`
          )
          .newline();
      }
    });

    if (results.length) {
      const projectId = await this.getProjectId(
        options.testrailProject,
        options.testrailProjectId
      );
      const planId = await this.getPlanId(
        options.testrailPlan,
        options.testrailPlanId,
        projectId
      );
      const suiteId = await this.getSuiteId(
        options.testrailSuite,
        options.testrailSuiteId,
        projectId
      );

      this.creationDate = this.moment().format("YYYY-MM-DD HH:mm:ss");

      const agent = userAgents[0].split("/");

      let runName = "";
      if (options.testrailRunName) {
        runName = options.testrailRunName
          .replace("%DATE%", this.creationDate)
          .replace("%AGENT%", `(${agent[0]}/${agent[1]})`);
      } else {
        runName = `${this.creationDate} (${agent[0]}/${agent[1]})`;
      }

      const payload = {
        suite_id: suiteId,
        include_all: false,
        case_ids: caseIdList,
        name: runName,
        description: options.testrailRunDescription,
      };

      try {
        let run;
        if (planId) {
          run = await this.addPlanEntry(planId, payload);
        } else {
          run = await this.addRun(projectId, payload);
        }

        this.logger
          .newline()
          .write(separator)
          .newline()
          .write(this.chalk.green("Run added successfully."))
          .newline()
          .write(`${this.chalk.blue.bold("Run name")} ${runName}`)
          .newline();

        await this.publishTestResults(run, results);
      } catch (error) {
        this.printError("Could not post test results.");
        this.logger.write(error.toString()).newline();
        process.exit(1);
      }
    } else {
      this.logger
        .newline()
        .write(this.chalk.red.bold(this.logger.symbols.err))
        .write("No test case data found to publish")
        .newline();
    }
  };

  // API

  _callAPI = async (method, apiUrl, queryVariables, body) => {
    const requestBody = body ? JSON.stringify(body) : undefined;
    let url = this.host + this.baseUrl + apiUrl;

    if (queryVariables != null) {
      url += "&" + qs.stringify(queryVariables);
    }

    return fetch(url, {
      method,
      body: requestBody,
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: this.authHeader
      }
    }).then(res => res.json());
  };

  apiGet = (apiUrl, queryVariables) => {
    return this._callAPI("get", apiUrl, queryVariables, null);
  };

  apiPost = (apiUrl, body, queryVariables) => {
    return this._callAPI("post", apiUrl, queryVariables, body);
  };

  // ----- Cases -----

  getCase = id => {
    return this.apiGet("get_case/" + id);
  };

  getCases = (project_id, filters) => {
    return this.apiGet("get_cases/" + project_id, filters);
  };

  addCase = (section_id, data) => {
    return this.apiPost("add_case/" + section_id, data);
  };

  updateCase = (case_id, data) => {
    return this.apiPost("update_case/" + case_id, data);
  };

  deleteCase = case_id => {
    return this.apiPost("delete_case/" + case_id);
  };

  // ----- Case Fields -----

  getCaseFields = () => {
    return this.apiGet("get_case_fields");
  };

  // ----- Case Types -----

  getCaseTypes = () => {
    return this.apiGet("get_case_types");
  };

  // ----- Configurations -----

  getConfigs = project_id => {
    return this.apiGet("get_configs/" + project_id);
  };

  addConfigGroup = (project_id, data) => {
    return this.apiPost("add_config_group/" + project_id, data);
  };

  addConfig = (config_group_id, data) => {
    return this.apiPost("add_config/" + config_group_id, data);
  };

  updateConfigGroup = (config_group_id, data) => {
    return this.apiPost("update_config_group/" + config_group_id, data);
  };

  updateConfig = (config_id, data) => {
    return this.apiPost("update_config/" + config_id, data);
  };

  deleteConfigGroup = config_group_id => {
    return this.apiPost("delete_config_group/" + config_group_id);
  };

  deleteConfig = config_id => {
    return this.apiPost("delete_config/" + config_id);
  };

  // ----- Milestones -----

  getMilestone = id => {
    return this.apiGet("get_milestone/" + id);
  };

  getMilestones = (project_id, filters) => {
    return this.apiGet("get_milestones/" + project_id, filters);
  };

  addMilestone = (project_id, data) => {
    return this.apiPost("add_milestone/" + project_id, data);
  };

  updateMilestone = (milestone_id, data) => {
    return this.apiPost("update_milestone/" + milestone_id, data);
  };

  deleteMilestone = milestone_id => {
    return this.apiPost("delete_milestone/" + milestone_id);
  };

  // ----- Plans -----

  getPlan = id => {
    return this.apiGet("get_plan/" + id);
  };

  getPlans = (project_id, filters) => {
    return this.apiGet("get_plans/" + project_id, filters);
  };

  addPlan = (project_id, data) => {
    return this.apiPost("add_plan/" + project_id, data);
  };

  addPlanEntry = (plan_id, data) => {
    return this.apiPost("add_plan_entry/" + plan_id, data);
  };

  updatePlan = (plan_id, data) => {
    return this.apiPost("update_plan/" + plan_id, data);
  };

  updatePlanEntry = (plan_id, entry_id, data) => {
    return this.apiPost("update_plan_entry/" + plan_id + "/" + entry_id, data);
  };

  closePlan = plan_id => {
    return this.apiPost("close_plan/" + plan_id);
  };

  deletePlan = plan_id => {
    return this.apiPost("delete_plan/" + plan_id);
  };

  deletePlanEntry = (plan_id, entry_id) => {
    return this.apiPost("delete_plan_entry/" + plan_id + "/" + entry_id);
  };

  // ----- Priorities -----

  getPriorities = () => {
    return this.apiGet("get_priorities");
  };

  // ----- Projects -----

  getProject = id => {
    return this.apiGet("get_project/" + id);
  };

  getProjects = filters => {
    return this.apiGet("get_projects", filters);
  };

  addProject = data => {
    return this.apiPost("add_project", data);
  };

  updateProject = (project_id, data) => {
    return this.apiPost("update_project/" + project_id, data);
  };

  deleteProject = project_id => {
    return this.apiPost("delete_project/" + project_id);
  };

  // ----- Results -----

  getResults = (test_id, filters) => {
    return this.apiGet("get_results/" + test_id, filters);
  };

  getResultsForCase = (run_id, case_id, filters) => {
    return this.apiGet(
      "get_results_for_case/" + run_id + "/" + case_id,
      filters
    );
  };

  getResultsForRun = (run_id, filters) => {
    return this.apiGet("get_results_for_run/" + run_id, filters);
  };

  addResult = (test_id, data) => {
    return this.apiPost("add_result/" + test_id, data);
  };

  addResultForCase = (run_id, case_id, data) => {
    return this.apiPost("add_result_for_case/" + run_id + "/" + case_id, data);
  };

  addResults = (run_id, data) => {
    return this.apiPost("add_results/" + run_id, data);
  };

  addResultsForCases = (run_id, data) => {
    return this.apiPost("add_results_for_cases/" + run_id, data);
  };

  // ----- Result Fields -----

  getResultFields = () => {
    return this.apiGet("get_result_fields");
  };

  // ----- Runs -----

  getRun = id => {
    return this.apiGet("get_run/" + id);
  };

  getRuns = (project_id, filters) => {
    return this.apiGet("get_runs/" + project_id, filters);
  };

  addRun = (project_id, data) => {
    return this.apiPost("add_run/" + project_id, data);
  };

  updateRun = (run_id, data) => {
    return this.apiPost("update_run/" + run_id, data);
  };

  closeRun = run_id => {
    return this.apiPost("close_run/" + run_id);
  };

  deleteRun = run_id => {
    return this.apiPost("delete_run/" + run_id);
  };

  // ----- Sections -----

  getSection = id => {
    return this.apiGet("get_section/" + id);
  };

  getSections = (project_id, filters) => {
    return this.apiGet("get_sections/" + project_id, filters);
  };

  addSection = (project_id, data) => {
    return this.apiPost("add_section/" + project_id, data);
  };

  updateSection = (section_id, data) => {
    return this.apiPost("update_section/" + section_id, data);
  };

  deleteSection = section_id => {
    return this.apiPost("delete_section/" + section_id);
  };

  // ----- Statuses -----

  getStatuses = () => {
    return this.apiGet("get_statuses");
  };

  // ----- Suites -----

  getSuite = id => {
    return this.apiGet("get_suite/" + id);
  };

  getSuites = project_id => {
    return this.apiGet("get_suites/" + project_id);
  };

  addSuite = (project_id, data) => {
    return this.apiPost("add_suite/" + project_id, data);
  };

  updateSuite = (suite_id, data) => {
    return this.apiPost("update_suite/" + suite_id, data);
  };

  deleteSuite = suite_id => {
    return this.apiPost("delete_suite/" + suite_id);
  };

  // ----- Templates -----

  getTemplates = project_id => {
    return this.apiGet("get_templates/" + project_id);
  };

  // ----- Tests -----

  getTest = id => {
    return this.apiGet("get_test/" + id);
  };

  getTests = (run_id, filters) => {
    return this.apiGet("get_tests/" + run_id, filters);
  };

  // ----- Users -----

  getUser = id => {
    return this.apiGet("get_user/" + id);
  };

  getUserByEmail = email => {
    return this.apiGet("get_user_by_email", { email: email });
  };

  getUsers = () => {
    return this.apiGet("get_users");
  };
}

module.exports = TestRail;
