import { readFileSync } from "fs";
import fetch from "node-fetch";

import TestCafeReporterTestrail from "../src/index";

jest.mock("fs");
jest.mock("node-fetch", () => jest.fn());
// const { Response } = jest.requireActual("node-fetch");
const fetchMock: jest.MockedFunction<typeof fetch> = fetch as any;
const fsMock: jest.MockedFunction<typeof readFileSync> = readFileSync as any;
const logMock = jest.fn();
const errorMock = jest.fn();

console.log = logMock;
console.error = errorMock;

describe("Reporter Plugin", () => {
  const config: any = {
    enabled: true,
    host: "host",
    user: "user",
    apiKey: "apiKey",
    projectId: "P1",
    suiteId: "S2",
    coverageCaseId: "C123",
    reference: "refs",
  };

  const injectedScope = {
    formatError: (error: string) => error,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockRestore();
    fsMock.mockRestore();
    fsMock.mockReturnValue(JSON.stringify(config));
  });

  test("plugin disabled", async () => {
    const disabledConfig: any = {
      enabled: false,
    };

    fsMock.mockReturnValue(JSON.stringify(disabledConfig));

    const plugin = TestCafeReporterTestrail();
    await plugin.reportTaskDone(123, 1, [], {} as any);
    expect(logMock).toBeCalledTimes(0);
    expect(errorMock).toBeCalledTimes(0);
    expect(fetchMock).toBeCalledTimes(0);
  });

  test("required config not provided", async () => {
    const disabledConfig: any = {
      enabled: true,
    };

    fsMock.mockReturnValue(JSON.stringify(disabledConfig));

    const plugin = TestCafeReporterTestrail();
    await plugin.reportTaskDone(123, 1, [], {} as any);
    expect(logMock).toBeCalledTimes(4);
    expect(errorMock).toBeCalledTimes(0);
    expect(fetchMock).toBeCalledTimes(0);
  });

  test("reportTaskStart", async () => {
    const plugin = TestCafeReporterTestrail();
    await plugin.reportTaskStart(123, ["userAgent1"]);
    expect(logMock).toBeCalledTimes(0);
    expect(errorMock).toBeCalledTimes(0);
    expect(fetchMock).toBeCalledTimes(0);
  });

  describe("reportTestDone", () => {
    test("no case id", async () => {
      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: false,
        errs: [],
        screenshots: [],
      };
      const meta: any = {};

      await plugin.reportTestDone.call(injectedScope, "test with no case id", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual([]);
      expect(logMock).toBeCalledTimes(1);
      expect(logMock).toBeCalledWith(
        "[TestRail] Test missing the TestRail Case ID in test metadata: test with no case id"
      );
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });

    test("skipped", async () => {
      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: true,
        errs: [],
        screenshots: [],
      };
      const meta: any = {
        CID: "C123",
      };

      const expected = [
        {
          case_id: 123,
          comment: "Test SKIPPED\n",
          status_id: 2,
        },
      ];

      await plugin.reportTestDone.call(injectedScope, "test skipped", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual(expected);
      expect(logMock).toBeCalledTimes(0);
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });

    test("error", async () => {
      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: false,
        errs: ["error1"],
        screenshots: [],
      };
      const meta: any = {
        CID: "C123",
      };

      const expected = [
        {
          case_id: 123,
          comment: "Test FAILED\nerror1",
          status_id: 5,
        },
      ];

      await plugin.reportTestDone.call(injectedScope, "test failed", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual(expected);
      expect(logMock).toBeCalledTimes(0);
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });

    test("success", async () => {
      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: false,
        errs: [],
        screenshots: [],
      };
      const meta: any = {
        CID: "C123",
      };

      const expected = [
        {
          case_id: 123,
          comment: "Test PASSED\n",
          status_id: 1,
        },
      ];

      await plugin.reportTestDone.call(injectedScope, "test passed", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual(expected);
      expect(logMock).toBeCalledTimes(0);
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });

    test("with screenshot", async () => {
      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: false,
        errs: [],
        screenshots: ["screesnot1"],
      };
      const meta: any = {
        CID: "C123",
      };

      const expectedResult = [
        {
          case_id: 123,
          comment: "Test PASSED\n",
          status_id: 1,
        },
      ];
      const expectedScreenshots = { "123": ["screesnot1"] };

      await plugin.reportTestDone.call(injectedScope, "test passed", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual(expectedResult);
      expect(plugin.reporter.screenshots).toStrictEqual(expectedScreenshots);
      expect(logMock).toBeCalledTimes(0);
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });

    test("using existing run", async () => {

      const existingRunConfig: any = {
        ...config,
        runId: "R123"
      };
  
      fsMock.mockReturnValue(JSON.stringify(existingRunConfig));

      const plugin = TestCafeReporterTestrail();
      const testInfo: any = {
        skipped: false,
        errs: [],
        screenshots: ["screesnot1"],
      };
      const meta: any = {
        CID: "C123",
      };

      const expectedResult = [
        {
          case_id: 123,
          comment: "Test PASSED\n",
          status_id: 1,
        },
      ];

      await plugin.reportTestDone.call(injectedScope, "test passed", testInfo, meta);
      expect(plugin.reporter.results).toStrictEqual(expectedResult);
      expect(logMock).toBeCalledTimes(0);
      expect(errorMock).toBeCalledTimes(0);
      expect(fetchMock).toBeCalledTimes(0);
    });
  });

  describe("reportTaskDone", () => {
    // TODO
  });
});
