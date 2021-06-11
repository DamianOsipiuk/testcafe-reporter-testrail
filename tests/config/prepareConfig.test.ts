import { readFileSync } from "fs";

import { prepareConfig } from "../../src/config";

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

const ENV_COPY = process.env;
const readFileSyncMock = readFileSync as jest.Mock;

const defaultConfig = {
  apiKey: undefined,
  branchEnv: "BRANCH",
  buildNoEnv: "BUILD_NUMBER",
  caseMeta: "CID",
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  enabled: false,
  host: undefined,
  projectId: 0,
  reference: undefined,
  runCloseAfterDays: 0,
  runDescription: undefined,
  runId: 0,
  runName: "%BRANCH%#%BUILD% - %DATE%",
  suiteId: 0,
  updateRunTestCases: true,
  uploadScreenshots: false,
  user: undefined,
};

const envConfig = {
  TESTRAIL_ENABLED: "true",
  TESTRAIL_HOST: "host",
  TESTRAIL_USER: "user",
  TESTRAIL_API_KEY: "key",
  TESTRAIL_PROJECT_ID: "123",
  TESTRAIL_SUITE_ID: "234",
  TESTRAIL_RUN_ID: "345",
  TESTRAIL_RUN_NAME: "run",
  TESTRAIL_RUN_DESCRIPTION: "description",
  TESTRAIL_REFERENCE: "ref",
  TESTRAIL_BRANCH_ENV: "branch",
  TESTRAIL_BUILD_NO_ENV: "build",
  TESTRAIL_DATE_FORMAT: "date",
  TESTRAIL_CASE_META: "meta",
  TESTRAIL_RUN_CLOSE_AFTER_DAYS: 111,
  TESTRAIL_UPLOAD_SCREENSHOTS: "true",
  TESTRAIL_UPDATE_RUN_TEST_CASES: "true",
};

const fileConfig = {
  apiKey: "key2",
  branchEnv: "branch2",
  buildNoEnv: "build2",
  caseMeta: "meta2",
  dateFormat: "date2",
  enabled: true,
  host: "host2",
  projectId: "1111",
  reference: "ref2",
  runCloseAfterDays: "2222",
  runDescription: "description2",
  runId: "3333",
  runName: "run2",
  suiteId: "4444",
  updateRunTestCases: true,
  uploadScreenshots: false,
  user: "user2",
};

describe("prepareConfig", () => {
  beforeEach(() => {
    process.env = { ...ENV_COPY };
  });

  afterEach(() => {
    process.env = ENV_COPY;
  });

  describe("with prefix", () => {
    test("should strip prefix from project", () => {
      Object.assign(process.env, {
        TESTRAIL_PROJECT_ID: "P123",
      });

      const config = prepareConfig();

      expect(config).toMatchObject({
        projectId: 123,
      });
    });

    test("should strip prefix from suite", () => {
      Object.assign(process.env, {
        TESTRAIL_SUITE_ID: "S123",
      });

      const config = prepareConfig();

      expect(config).toMatchObject({
        suiteId: 123,
      });
    });

    test("should strip prefix from run", () => {
      Object.assign(process.env, {
        TESTRAIL_RUN_ID: "R123",
      });

      const config = prepareConfig();

      expect(config).toMatchObject({
        runId: 123,
      });
    });
  });

  test("should return default config", () => {
    const config = prepareConfig();

    expect(config).toEqual(defaultConfig);
  });

  test("should return config from ENV", () => {
    Object.assign(process.env, envConfig);

    const config = prepareConfig();

    expect(config).toEqual({
      apiKey: "key",
      branchEnv: "branch",
      buildNoEnv: "build",
      caseMeta: "meta",
      dateFormat: "date",
      enabled: true,
      host: "host",
      projectId: 123,
      reference: "ref",
      runCloseAfterDays: 111,
      runDescription: "description",
      runId: 345,
      runName: "run",
      suiteId: 234,
      updateRunTestCases: true,
      uploadScreenshots: true,
      user: "user",
    });
  });

  test("should return config from file", () => {
    readFileSyncMock.mockReturnValueOnce(JSON.stringify(fileConfig));

    const config = prepareConfig();

    expect(config).toEqual({
      apiKey: "key2",
      branchEnv: "branch2",
      buildNoEnv: "build2",
      caseMeta: "meta2",
      dateFormat: "date2",
      enabled: true,
      host: "host2",
      projectId: 1111,
      reference: "ref2",
      runCloseAfterDays: 2222,
      runDescription: "description2",
      runId: 3333,
      runName: "run2",
      suiteId: 4444,
      updateRunTestCases: true,
      uploadScreenshots: false,
      user: "user2",
    });
  });

  test("should override config from file with ENV", () => {
    Object.assign(process.env, envConfig);
    readFileSyncMock.mockReturnValueOnce(JSON.stringify(fileConfig));

    const config = prepareConfig();

    expect(config).toEqual({
      apiKey: "key",
      branchEnv: "branch",
      buildNoEnv: "build",
      caseMeta: "meta",
      dateFormat: "date",
      enabled: true,
      host: "host",
      projectId: 123,
      reference: "ref",
      runCloseAfterDays: 111,
      runDescription: "description",
      runId: 345,
      runName: "run",
      suiteId: 234,
      updateRunTestCases: true,
      uploadScreenshots: true,
      user: "user",
    });
  });
});
