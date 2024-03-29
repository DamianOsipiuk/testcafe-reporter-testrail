import type { TestRail, AddResultForCase, Test, Result } from "testrail-js-api";

import { throwOnApiError } from "./misc";
import type { Screenshot } from "../types";

export interface UploadScreenshotsProps {
  tests: Test[];
  results: Result[];
  resultsToPush: AddResultForCase[];
  screenshots: {
    [key: string]: Screenshot[];
  };
  testrailAPI: TestRail;
}

export const uploadScreenshots = async ({
  tests,
  results,
  resultsToPush,
  screenshots,
  testrailAPI,
}: UploadScreenshotsProps) => {
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
};
