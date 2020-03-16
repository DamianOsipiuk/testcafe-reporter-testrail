import fs from "fs";
import path from "path";
import moment from "moment";
import { TestRail, TestStatus, Run, AddResultForCase } from "testrail-js-api";

interface Config<T = number> {
  enabled: boolean;
  host: string;
  user: string;
  apiKey: string;
  projectId: T;
  planId?: T;
  suiteId: T;
  runName: string;
  runDescription?: string;
  reference?: string;
  branchEnv: string;
  buildNoEnv: string;
  dateFormat: string;
  caseMeta: string;
  runCloseAfterDays?: number;
  uploadScreenshots: boolean;
}

export interface TestResult {
  name: string;
  meta: Meta;
  caseId: number;
  testRunInfo: TestRunInfo;
  testStatus: {
    value: TestStatus;
    text: string;
    color: string;
  };
}

export interface Meta {
  [key: string]: string;
}

export interface TaskResult {
  passedCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface Screenshot {
  screenshotPath: string;
  thumbnailPath: string;
  userAgent: string;
  quarantineAttempt: number;
  takenOnFail: boolean;
}

export interface TestRunInfo {
  errs: any[];
  warnings: string[];
  durationMs: number;
  unstable: boolean;
  screenshotPath: string;
  screenshots: Screenshot[];
  quarantine: { [key: string]: { passed: boolean } };
  skipped: boolean;
}

const Status = {
  Passed: {
    value: TestStatus.Passed,
    text: "PASSED",
    color: "yellow",
  },
  Blocked: {
    value: TestStatus.Blocked,
    text: "SKIPPED",
    color: "green",
  },
  Failed: {
    value: TestStatus.Failed,
    text: "FAILED",
    color: "red",
  },
};

const loadJSON = (file: string) => {
  const data = fs.readFileSync(file, { encoding: "utf8" });

  return JSON.parse(data);
};

const prepareConfig = (options: Config = {} as any): Config => {
  const config: Config<string> = Object.assign(loadJSON(path.join(process.cwd(), ".testrailrc")), options);

  return {
    enabled: process.env.TESTRAIL_ENABLED === "true" || config.enabled || false,
    host: process.env.TESTRAIL_HOST || config.host,
    user: process.env.TESTRAIL_USER || config.user,
    apiKey: process.env.TESTRAIL_API_KEY || config.apiKey,
    projectId: Number((process.env.TESTRAIL_PROJECT_ID || config.projectId || "").replace("P", "").trim()),
    planId: Number((process.env.TESTRAIL_PLAN_ID || config.planId || "").replace("R", "").trim()),
    suiteId: Number((process.env.TESTRAIL_SUITE_ID || config.suiteId || "").replace("S", "").trim()),
    runName: process.env.TESTRAIL_RUN_NAME || config.runName || "%BRANCH%#%BUILD% - %DATE%",
    runDescription: process.env.TESTRAIL_RUN_DESCRIPTION || config.runDescription,
    reference: process.env.TESTRAIL_REFERENCE || config.reference,
    branchEnv: process.env.TESTRAIL_BRANCH_ENV || config.branchEnv || "BRANCH",
    buildNoEnv: process.env.TESTRAIL_BUILD_NO_ENV || config.buildNoEnv || "BUILD_NUMBER",
    dateFormat: process.env.TESTRAIL_DATE_FORMAT || config.dateFormat || "YYYY-MM-DD HH:mm:ss",
    caseMeta: process.env.TESTRAIL_CASE_META || config.caseMeta || "CID",
    runCloseAfterDays: Number(process.env.TESTRAIL_RUN_CLOSE_AFTER_DAYS || config.runCloseAfterDays),
    uploadScreenshots: process.env.TESTRAIL_UPLOAD_SCREENSHOTS == "true" || config.uploadScreenshots || false,
  };
};

const prepareReportName = (config: Config, branch: string, buildNo: string, userAgents: string[]) => {
  const date = moment().format(config.dateFormat);
  return config.runName
    .replace("%BRANCH%", branch)
    .replace("%BUILD%", buildNo)
    .replace("%DATE%", date)
    .replace("%AGENTS%", `(${userAgents.join(", ")})`);
};

const prepareReference = (config: Config, branch: string, buildNo: string) => {
  return config.reference ? config.reference.replace("%BRANCH%", branch).replace("%BUILD%", buildNo) : "";
};

export class TestcafeTestrailReporter {
  noColors: boolean;
  formatError: any;

  private config: Config;
  private branch: string;
  private buildNo: string;

  userAgents!: string[];
  results: AddResultForCase[];
  screenshots: {
    [key: string]: Screenshot[];
  };

  constructor() {
    this.config = prepareConfig();
    this.branch = process.env[this.config.branchEnv] || "master";
    this.buildNo = process.env[this.config.buildNoEnv] || "unknown";

    this.noColors = false;
    this.results = [];
    this.screenshots = {};
  }

  reportTaskStart = async (startTime: number, userAgents: string[]) => {
    this.userAgents = userAgents;
  };

  reportFixtureStart = async () => {};

  async reportTestDone(name: string, testRunInfo: TestRunInfo, meta: Meta) {
    const hasErr = testRunInfo.errs.length;

    let testStatus = null;

    if (testRunInfo.skipped) {
      testStatus = Status.Blocked;
    } else if (hasErr === 0) {
      testStatus = Status.Passed;
    } else {
      testStatus = Status.Failed;
    }

    let caseId = 0;
    if (meta[this.config.caseMeta]) {
      caseId = Number(meta[this.config.caseMeta].replace("C", "").trim());
    }

    if (caseId > 0) {
      const errorLog = testRunInfo.errs
        .map((x: object) => {
          const formatted = this.formatError(x).replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
            ""
          );

          return formatted;
        })
        .join("\n");

      this.results.push({
        case_id: caseId,
        status_id: testStatus.value,
        comment: `Test ${testStatus.text}\n${errorLog}`,
      });
      if (testRunInfo.screenshots.length) {
        this.screenshots[caseId] = testRunInfo.screenshots;
      }
    } else {
      console.warn(`[TestRail] Test missing the TestRail Case ID in test metadata: ${name}`);
    }
  }

  reportTaskDone = async (endTime: number, passed: number, warnings: string[], result: TaskResult) => {
    const { enabled, host, user, apiKey, projectId } = this.config;
    try {
      if (enabled && host && user && apiKey) {
        if (this.results.length) {
          const testrailAPI = new TestRail(host, user, apiKey);

          const { value: runs } = await testrailAPI.getRuns(projectId, { is_completed: 0 });

          const runName = prepareReportName(this.config, this.branch, this.buildNo, this.userAgents);
          const refs = prepareReference(this.config, this.branch, this.buildNo);
          const caseIdList = this.results.map((result) => result.case_id);

          const existingRun = runs?.find((run) => run.refs === refs);

          let run: Run;
          if (existingRun) {
            run = existingRun;
            const { value: tests } = await testrailAPI.getTests(existingRun.id);
            const currentCaseIds = tests?.map((test) => test.case_id) || [];
            const additionalDescription = "\n" + this.config.runDescription;

            await testrailAPI.updateRun(existingRun.id, {
              description: existingRun.description.replace(additionalDescription, "") + additionalDescription,
              case_ids: [...currentCaseIds, ...caseIdList],
            });

            console.info(`[TestRail] Test run updated successfully: ${runName}`);
          } else {
            const payload = {
              suite_id: this.config.suiteId,
              include_all: false,
              case_ids: caseIdList,
              name: runName,
              description: this.config.runDescription,
              refs,
            };

            if (this.config.planId) {
              const { value: planEntry } = await testrailAPI.addPlanEntry(this.config.planId, payload);
              run = planEntry.runs[0];
            } else {
              await this.closeOldRuns(testrailAPI, this.config);
              const { value: newRun } = await testrailAPI.addRun(this.config.projectId, payload);
              run = newRun;
            }

            console.info(`[TestRail] Test run added successfully: ${runName}`);
          }

          await this.publishTestResults(testrailAPI, run, this.results);
        } else {
          console.warn("[TestRail] No test case data found to publish");
        }
      }
    } catch (error) {
      console.error("[TestRail] Sending report to TestRail failed", error.toString());
    }
  };

  closeOldRuns = async (testrailAPI: TestRail, config: Config) => {
    if (config.runCloseAfterDays) {
      const { value: runs } = await testrailAPI.getRuns(config.projectId, { is_completed: 0 });
      if (runs?.length) {
        for (const run of runs) {
          const shouldClose = moment.unix(run.created_on) <= moment().subtract(config.runCloseAfterDays, "days");
          if (shouldClose) {
            console.info(`[TestRail] Closing test run ${run.id}: ${run.name}`);
            await testrailAPI.closeRun(run.id);
          }
        }
      } else {
        console.error("[TestRail] Error during test runs closing");
      }
    }
  };

  publishTestResults = async (testrailAPI: TestRail, run: Run, resultsToPush: AddResultForCase[]) => {
    const runId = run.id;
    const { value: results } = await testrailAPI.addResultsForCases(runId, resultsToPush);
    const { value: tests } = await testrailAPI.getTests(runId);

    if (this.config.uploadScreenshots) {
      for (const testResult of resultsToPush) {
        const test = tests.find((test) => test.case_id === testResult.case_id);
        const result = results.find((result) => result.test_id === test?.id);
        if (result) {
          for (const screenshot of this.screenshots[testResult.case_id]) {
            await testrailAPI.addAttachmentToResult(result.id, screenshot.screenshotPath);
          }
        } else {
          console.error(
            `[TestRail] Could not upload screenshot for a failed test. Case ID: ${testResult.caseId}. Test ID: ${test?.id}`
          );
        }
      }
    }

    if (results.length == 0) {
      console.info("[TestRail] No Data has been published to TestRail");
    } else {
      console.info("[TestRail] Test results added to the TestRail successfully");
    }
  };
}

module.exports = function() {
  return new TestcafeTestrailReporter();
};