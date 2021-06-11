import { TestRail, AddResultForCase, Test, Result } from "testrail-js-api";

import { throwOnApiError } from "../utils";
import type { Config, Screenshot } from "../types";

type UploadScreenshots = (options: {
  config: Config;
  tests: Test[];
  results: Result[];
  resultsToPush: AddResultForCase[];
  screenshots: {
    [key: string]: Screenshot[];
  };
  testrailAPI: TestRail;
}) => void;

export const uploadScreenshots: UploadScreenshots = async ({
  config,
  tests,
  results,
  resultsToPush,
  screenshots,
  testrailAPI,
}) => {
  if (config.uploadScreenshots) {
    console.log("[TestRail] Uploading screenshots...");
    for (let i = 0; i < resultsToPush.length; i++) {
      const test = tests.find(
        (test) => test.case_id === resultsToPush[i].case_id
      );
      const result = results.find((result) => result.test_id === test?.id);
      if (result) {
        const screenshotList = screenshots[resultsToPush[i].case_id];
        if (screenshotList) {
          for (let j = 0; j < screenshotList.length; j++) {
            await throwOnApiError(
              testrailAPI.addAttachmentToResult(
                result.id,
                screenshotList[j].screenshotPath
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
};
