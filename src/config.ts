import { readFileSync } from "fs";
import path from "path";

import type { Config } from "./types";

export const loadJSON = (file: string) => {
  try {
    const data = readFileSync(file, { encoding: "utf8" });

    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore error when file does not exist or it's malformed
  }

  return {};
};

export const prepareConfig = (options: Config = {} as Config): Config => {
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

export const verifyConfig = (config: Config) => {
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
