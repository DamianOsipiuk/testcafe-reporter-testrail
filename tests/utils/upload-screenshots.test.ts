import type { AddResultForCase, Result, Test, TestRail } from "testrail-js-api";

import { Screenshot } from "../../src/types";
import { uploadScreenshots } from "../../src/utils/upload-screenshots";

describe("uploadScreenshots", () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  test("should upload matching screenshots", async () => {
    const testrailAPI = {
      addAttachmentToResult: jest.fn(() => {
        return {
          response: "",
          value: "",
        };
      }),
    } as unknown as TestRail;
    const resultsToPush = [
      {
        case_id: 111,
      },
    ] as AddResultForCase[];
    const tests = [
      {
        case_id: 111,
        id: 222,
      },
    ] as Test[];
    const results = [
      {
        id: 333,
        test_id: 222,
      },
    ] as Result[];
    const screenshots: Record<number, Screenshot[]> = {
      111: [
        {
          screenshotPath: "path1",
        },
        {
          screenshotPath: "path2",
        },
      ] as Screenshot[],
    };

    await uploadScreenshots({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      screenshots,
    });

    expect(testrailAPI.addAttachmentToResult).toHaveBeenNthCalledWith(
      1,
      333,
      "path1"
    );
    expect(testrailAPI.addAttachmentToResult).toHaveBeenNthCalledWith(
      2,
      333,
      "path2"
    );
  });

  test("should error for a failed test", async () => {
    const testrailAPI = {
      addAttachmentToResult: jest.fn(() => {
        return {
          response: "",
          value: "",
        };
      }),
    } as unknown as TestRail;
    const resultsToPush = [
      {
        case_id: 111,
      },
    ] as AddResultForCase[];
    const tests = [
      {
        case_id: 111,
        id: 222,
      },
    ] as Test[];
    const results = [
      {
        id: 333,
        test_id: 4321,
      },
    ] as Result[];
    const screenshots: Record<number, Screenshot[]> = {
      111: [
        {
          screenshotPath: "path1",
        },
        {
          screenshotPath: "path2",
        },
      ] as Screenshot[],
    };

    await uploadScreenshots({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      screenshots,
    });

    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test("should error for a non-existing test", async () => {
    const testrailAPI = {
      addAttachmentToResult: jest.fn(() => {
        return {
          response: "",
          value: "",
        };
      }),
    } as unknown as TestRail;
    const resultsToPush = [
      {
        case_id: 111,
      },
    ] as AddResultForCase[];
    const tests = [
      {
        case_id: 555,
        id: 222,
      },
    ] as Test[];
    const results = [
      {
        id: 333,
        test_id: 222,
      },
    ] as Result[];
    const screenshots: Record<number, Screenshot[]> = {
      111: [
        {
          screenshotPath: "path1",
        },
        {
          screenshotPath: "path2",
        },
      ] as Screenshot[],
    };

    await uploadScreenshots({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      screenshots,
    });

    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
