import fs from "fs";
import path from "path";
import moment from "moment";
import { TestRail, TestStatus, Run, AddResultForCase } from "testrail-js-api";
import { Response } from "node-fetch";

interface Config<T = number> {
  enabled: boolean;
  host: string;
  user: string;
  apiKey: string;
  projectId: T;
  suiteId: T;
  runId: T;
  runName: string;
  runDescription?: string;
  reference?: string;
  branchEnv: string;
  buildNoEnv: string;
  dateFormat: string;
  caseMeta: string;
  runCloseAfterDays?: number;
  uploadScreenshots: boolean;
  updateRunTestCases: boolean;
}

interface Meta {
  [key: string]: string;
}

interface TaskResult {
  passedCount: number;
  failedCount: number;
  skippedCount: number;
}

interface Screenshot {
  screenshotPath: string;
  thumbnailPath: string;
  userAgent: string;
  quarantineAttempt: number;
  takenOnFail: boolean;
}

interface TestRunInfo {
  errs: Record<string, unknown>[];
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
  try {
    const data = fs.readFileSync(file, { encoding: "utf8" });

    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore error when file does not exist or it's malformed
  }

  return {};
};

const prepareConfig = (options: Config = {} as Config): Config => {
  const config: Config<string> = Object.assign(
    loadJSON(path.join(process.cwd(), ".testrailrc")),
    options
  );

  return {
    enabled: process.env.TESTRAIL_ENABLED === "true" || config.enabled || false,
    host: process.env.TESTRAIL_HOST || config.host,
    user: process.env.TESTRAIL_USER || config.user,
    apiKey: process.env.TESTRAIL_API_KEY || config.apiKey,
    projectId: Number(
      (process.env.TESTRAIL_PROJECT_ID || config.projectId || "")
        .replace("P", "")
        .trim()
    ),
    suiteId: Number(
      (process.env.TESTRAIL_SUITE_ID || config.suiteId || "")
        .replace("S", "")
        .trim()
    ),
    runId: Number(
      (process.env.TESTRAIL_RUN_ID || config.runId || "")
        .replace("R", "")
        .trim()
    ),
    runName:
      process.env.TESTRAIL_RUN_NAME ||
      config.runName ||
      "%BRANCH%#%BUILD% - %DATE%",
    runDescription:
      process.env.TESTRAIL_RUN_DESCRIPTION || config.runDescription,
    reference: process.env.TESTRAIL_REFERENCE || config.reference,
    branchEnv: process.env.TESTRAIL_BRANCH_ENV || config.branchEnv || "BRANCH",
    buildNoEnv:
      process.env.TESTRAIL_BUILD_NO_ENV || config.buildNoEnv || "BUILD_NUMBER",
    dateFormat:
      process.env.TESTRAIL_DATE_FORMAT ||
      config.dateFormat ||
      "YYYY-MM-DD HH:mm:ss",
    caseMeta: process.env.TESTRAIL_CASE_META || config.caseMeta || "CID",
    runCloseAfterDays:
      Number(
        process.env.TESTRAIL_RUN_CLOSE_AFTER_DAYS || config.runCloseAfterDays
      ) || 0,
    uploadScreenshots:
      process.env.TESTRAIL_UPLOAD_SCREENSHOTS == "true" ||
      config.uploadScreenshots ||
      false,
    updateRunTestCases:
      process.env.TESTRAIL_UPDATE_RUN_TEST_CASES == "true" ||
      config.updateRunTestCases !== false,
  };
};

const prepareReportName = (
  config: Config,
  branch: string,
  buildNo: string,
  userAgents: string[]
) => {
  const date = moment().format(config.dateFormat);
  return config.runName
    .replace("%BRANCH%", branch)
    .replace("%BUILD%", buildNo)
    .replace("%DATE%", date)
    .replace("%AGENTS%", `(${userAgents.join(", ")})`);
};

const prepareRun = async (
  testrailAPI: TestRail,
  config: Config,
  runName: string,
  refs: string,
  caseIdList: number[]
): Promise<Run> => {
  const {
    projectId,
    suiteId,
    runDescription,
    runId,
    updateRunTestCases,
  } = config;
  let existingRun: Run | undefined;

  if (runId) {
    const { value: returnedRun } = await throwOnApiError(
      testrailAPI.getRun(runId)
    );
    existingRun = returnedRun;
  } else {
    const { value: runs } = await throwOnApiError(
      testrailAPI.getRuns(projectId, { is_completed: 0 })
    );
    existingRun = runs?.find((run) => run.refs === refs);
  }

  if (!updateRunTestCases) {
    if (existingRun) {
      return existingRun;
    } else {
      throw new Error(
        `[TestRail] Flag 'updateRunTestCases' enabled but the run was not found, please create it`
      );
    }
  } else if (existingRun) {
    const { value: tests } = await throwOnApiError(
      testrailAPI.getTests(existingRun.id)
    );
    const currentCaseIds = tests?.map((test) => test.case_id) || [];
    const additionalDescription = "\n" + runDescription;

    await throwOnApiError(
      testrailAPI.updateRun(existingRun.id, {
        description: existingRun.description.replace(additionalDescription, "") + additionalDescription,
        case_ids: [...currentCaseIds, ...caseIdList],
      })
    );
    console.log(`[TestRail] Test run updated successfully: ${runName}`);
    return existingRun;
  } else {
    const payload = {
      suite_id: suiteId,
      include_all: false,
      case_ids: caseIdList,
      name: runName,
      description: runDescription,
      refs,
    };

    const { value: newRun } = await throwOnApiError(
      testrailAPI.addRun(projectId, payload)
    );

    console.log(`[TestRail] Test run added successfully: ${runName}`);
    return newRun;
  }
};

const prepareReference = (config: Config, branch: string, buildNo: string) => {
  return config.reference
    ? config.reference.replace("%BRANCH%", branch).replace("%BUILD%", buildNo)
    : "";
};

const verifyConfig = (config: Config) => {
  const { enabled, host, user, apiKey, projectId, suiteId } = config;
  if (enabled) {
    if (!host) {
      console.log("[TestRail] Hostname was not provided.");
    }

    if (!user || !apiKey) {
      console.log("[TestRail] Username or api key was not provided.");
    }

    if (!projectId) {
      console.log("[TestRail] Project id was not provided.");
    }

    if (!suiteId) {
      console.log("[TestRail] Suite id was not provided.");
    }

    if (host && user && apiKey && projectId && suiteId) {
      return true;
    }
  }

  return false;
};

const throwOnApiError = async <
  T extends { response: Response; value: unknown }
>(
  apiResult: Promise<T>
): Promise<T> => {
  const { response, value } = await apiResult;
  if (response.status >= 400) {
    console.error("[TestRail] Error during API request");
    throw {
      url: response.url,
      status: response.status,
      message: value,
    };
  }

  return Promise.resolve({ response, value } as T);
};

class TestcafeTestrailReporter {
  noColors: boolean;
  formatError: unknown;

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

  reportTaskStart = async (_startTime: number, userAgents: string[]) => {
    this.userAgents = userAgents;
  };

  reportFixtureStart = async () => {
    // Not needed
  };

  reportTestDone = async (
    name: string,
    testRunInfo: TestRunInfo,
    meta: Meta,
    formatError: (x: Record<string, unknown>) => string
  ) => {
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
        .map((x: Record<string, unknown>) => {
          const formatted = formatError(x).replace(
            // eslint-disable-next-line no-control-regex
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
      console.log(
        `[TestRail] Test missing the TestRail Case ID in test metadata: ${name}`
      );
    }
  };

  reportTaskDone = async (
    _endTime: number,
    _passed: number,
    _warnings: string[],
    _result: TaskResult
  ) => {
    const { host, user, apiKey, projectId, suiteId } = this.config;

    if (verifyConfig(this.config)) {
      try {
        if (this.results.length) {
          const runName = prepareReportName(
            this.config,
            this.branch,
            this.buildNo,
            this.userAgents
          );
          const refs = prepareReference(this.config, this.branch, this.buildNo);
          const caseIdList = this.results.map((result) => result.case_id);

          const testrailAPI = new TestRail(host, user, apiKey);
          const { value: caseList } = await throwOnApiError(
            testrailAPI.getCases(projectId, { suite_id: suiteId })
          );
          const existingCaseIds = caseList.map((item) => item.id);

          caseIdList.forEach((id) => {
            if (!existingCaseIds.includes(id)) {
              console.error(
                `[TestRail] All TestRail mappings should be valid. Following test case id does not exist in TestRail: ${id}.`
              );
            }
          });
          const run: Run = await prepareRun(
            testrailAPI,
            this.config,
            runName,
            refs,
            caseIdList
          );

          await this.publishTestResults(testrailAPI, run, this.results);
          await this.closeOldRuns(testrailAPI, this.config);
        } else {
          console.log("[TestRail] No test case data found to publish");
        }
      } catch (error) {
        console.error("[TestRail] Sending report to TestRail failed", error);
        throw error;
      }
    }
  };

  closeOldRuns = async (testrailAPI: TestRail, config: Config) => {
    if (config.runCloseAfterDays) {
      const { value: runs } = await throwOnApiError(
        testrailAPI.getRuns(config.projectId, { is_completed: 0 })
      );
      if (runs.length) {
        for (let i = 0; i < runs.length; i++) {
          const shouldClose =
            moment.unix(runs[i].created_on) <=
            moment().subtract(config.runCloseAfterDays, "days");
          if (shouldClose) {
            console.log(
              `[TestRail] Closing test run ${runs[i].id}: ${runs[i].name}`
            );
            await throwOnApiError(testrailAPI.closeRun(runs[i].id));
          }
        }
      }
    }
  };

  publishTestResults = async (
    testrailAPI: TestRail,
    run: Run,
    resultsToPush: AddResultForCase[]
  ) => {
    const runId = run.id;
    const { value: results } = await throwOnApiError(
      testrailAPI.addResultsForCases(runId, resultsToPush)
    );
    const { value: tests } = await throwOnApiError(testrailAPI.getTests(runId));

    if (this.config.uploadScreenshots) {
      console.log("[TestRail] Uploading screenshots...");
      for (let i = 0; i < resultsToPush.length; i++) {
        const test = tests.find(
          (test) => test.case_id === resultsToPush[i].case_id
        );
        const result = results.find((result) => result.test_id === test?.id);
        if (result) {
          const screenshots = this.screenshots[resultsToPush[i].case_id];
          if (screenshots) {
            for (let j = 0; j < screenshots.length; j++) {
              await throwOnApiError(
                testrailAPI.addAttachmentToResult(
                  result.id,
                  screenshots[j].screenshotPath
                )
              );
            }
          }
        } else {
          console.error(
            `[TestRail] Could not upload screenshot for a failed test. Case ID: ${resultsToPush[i].caseId}. Test ID: ${test?.id}`
          );
        }
      }
    }

    if (results.length == 0) {
      console.log("[TestRail] No data has been published to TestRail");
    } else {
      console.log("[TestRail] Test results added to the TestRail successfully");
    }
  };
}

/// This weird setup is required due to TestCafe prototype injection method.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export = () => {
  const reporter = new TestcafeTestrailReporter();
  return {
    reportTaskStart: reporter.reportTaskStart,
    reportFixtureStart: reporter.reportFixtureStart,
    async reportTestDone(
      name: string,
      testRunInfo: TestRunInfo,
      meta: Meta
    ): Promise<void> {
      return reporter.reportTestDone(
        name,
        testRunInfo,
        meta,
        // @ts-expect-error Inject testrail error formatting method with bound context
        this.formatError.bind(this)
      );
    },
    reportTaskDone: reporter.reportTaskDone,
    reporter,
  };
};
