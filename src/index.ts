import moment from "moment";
import { TestRail, TestStatus, Run, AddResultForCase } from "testrail-js-api";

import { prepareConfig, verifyConfig } from "./config";
import {
  prepareReference,
  prepareReportName,
  throwOnApiError,
  uploadScreenshots,
  uploadVideos,
} from "./utils";
import type {
  Config,
  Meta,
  Screenshot,
  TaskResult,
  TestRunInfo,
  Video,
} from "./types";

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

const prepareRun = async (
  testrailAPI: TestRail,
  config: Config,
  runName: string,
  refs: string,
  caseIdList: number[]
): Promise<Run> => {
  const { projectId, suiteId, runDescription, runId, updateRunTestCases } =
    config;
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
    const newDescription = existingRun.description
      ? existingRun.description.replace(additionalDescription, "") +
        additionalDescription
      : additionalDescription;

    await throwOnApiError(
      testrailAPI.updateRun(existingRun.id, {
        description: newDescription,
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

const closeOldRuns = async (testrailAPI: TestRail, config: Config) => {
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
  videos: {
    [key: string]: Video[];
  };

  constructor() {
    this.config = prepareConfig();
    this.branch = process.env[this.config.branchEnv] || "master";
    this.buildNo = process.env[this.config.buildNoEnv] || "unknown";

    this.noColors = false;
    this.results = [];
    this.screenshots = {};
    this.videos = {};
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
      if (testRunInfo.videos?.length) {
        this.videos[caseId] = testRunInfo.videos;
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
          await closeOldRuns(testrailAPI, this.config);
        } else {
          console.log("[TestRail] No test case data found to publish");
        }
      } catch (error) {
        console.error("[TestRail] Sending report to TestRail failed", error);
        throw error;
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

    uploadScreenshots({
      config: this.config,
      tests,
      results,
      resultsToPush,
      screenshots: this.screenshots,
      testrailAPI,
    });

    uploadVideos({
      config: this.config,
      tests,
      results,
      resultsToPush,
      videos: this.videos,
      testrailAPI,
    });

    if (results.length == 0) {
      console.log("[TestRail] No data has been published to TestRail");
    } else {
      console.log("[TestRail] Test results added to the TestRail successfully");
    }
  };
}

/// This weird setup is required due to TestCafe prototype injection method.
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
