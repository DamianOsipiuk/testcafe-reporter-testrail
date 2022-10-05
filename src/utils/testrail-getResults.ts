import type { TestRail } from "testrail-js-api";
import type { Config } from "../types";
import { throwOnApiError } from "./misc";

export const getAllCases = async (testrailAPI: TestRail, config: Config) => {
  let { value: caseListResult } = await throwOnApiError(
    testrailAPI.getCases(config.projectId, { suite_id: config.suiteId })
  );
  let cases = caseListResult?.cases || [];
  let offsetVal = 0;
  while (caseListResult._links.next !== null) {
    offsetVal += 250;
    ({ value: caseListResult } = await throwOnApiError(
      testrailAPI.getCases(config.projectId, {
        suite_id: config.suiteId,
        offset: offsetVal,
      })
    ));
    cases = cases.concat(caseListResult?.cases);
  }
  return cases;
};

export const getAllTests = async (testrailAPI: TestRail, config: Config) => {
  let { value: testsResult } = await throwOnApiError(
    testrailAPI.getTests(config.runId)
  );
  let tests = testsResult.tests || [];
  let offsetVal = 0;
  while (testsResult._links.next !== null) {
    offsetVal += 250;
    ({ value: testsResult } = await throwOnApiError(
      testrailAPI.getTests(config.runId, { offset: offsetVal })
    ));
    tests = tests.concat(testsResult.tests);
  }
  return tests;
};
