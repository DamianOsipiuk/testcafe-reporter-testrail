import { TestRail, TestStatus, Run, AddResultForCase } from "testrail-js-api";

import { prepareConfig, verifyConfig } from "./config";
import { uploadScreenshots } from "./utils/upload-screenshots";
import { uploadVideos } from "./utils/upload-videos";
import { closeOldRuns } from "./utils/close-runs";
import { getAllCases, getAllTests } from "./utils/testrail-getResults";

import {
  prepareReference,
  prepareReportName,
  throwOnApiError,
} from "./utils/misc";

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
    const { value: runsResult } = await throwOnApiError(
      testrailAPI.getRuns(projectId, { is_completed: 0 })
    );
    existingRun = runsResult?.runs?.find((run) => run.refs === refs);
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
    const tests = await getAllTests(testrailAPI, config);
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

    const caseIdList: number[] = [];
    if (meta[this.config.caseMeta]) {
      if (typeof meta[this.config.caseMeta] === "string") {
        caseIdList.push(
          parseInt(meta[this.config.caseMeta].replace("C", "").trim(), 10)
        );
      } else {
        for (let i = 0; i < meta[this.config.caseMeta].length; i++) {
          caseIdList.push(
            Number(meta[this.config.caseMeta][i].replace("C", "").trim())
          );
        }
      }
    }

    if (caseIdList.length > 0) {
      for (let i = 0; i < caseIdList.length; i++) {
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
        let testDuration;
        if (testRunInfo.durationMs > 0) {
          testDuration = (testRunInfo.durationMs / 1000).toString() + "s";
        }
        this.results.push({
          case_id: caseIdList[i],
          status_id: testStatus.value,
          comment: `Test ${testStatus.text}\n${errorLog}`,
          elapsed: testDuration,
        });
        if (testRunInfo.screenshots.length) {
          this.screenshots[caseIdList[i]] = testRunInfo.screenshots;
        }
        if (testRunInfo.videos?.length) {
          this.videos[caseIdList[i]] = testRunInfo.videos;
        }
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
    const { host, user, apiKey } = this.config;

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
          const cases = await getAllCases(testrailAPI, this.config);
          const existingCaseIds = cases.map((item) => item.id)
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
    const tests = await getAllTests(testrailAPI, this.config);

    if (this.config.uploadScreenshots) {
      await uploadScreenshots({
        tests,
        results,
        resultsToPush,
        screenshots: this.screenshots,
        testrailAPI,
      });
    }

    if (this.config.uploadVideos) {
      await uploadVideos({
        tests,
        results,
        resultsToPush,
        videos: this.videos,
        testrailAPI,
      });
    }

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
