import type { AddResultForCase, Result, Test, TestRail } from "testrail-js-api";

import { Video } from "../../src/types";
import { uploadVideos } from "../../src/utils/upload-videos";

describe("uploadVideos", () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  test("should upload matching videos", async () => {
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
    const videos: Record<number, Video[]> = {
      111: [
        {
          videoPath: "path1",
        },
        {
          videoPath: "path2",
        },
      ] as Video[],
    };

    await uploadVideos({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      videos,
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
    const videos: Record<number, Video[]> = {
      111: [
        {
          videoPath: "path1",
        },
        {
          videoPath: "path2",
        },
      ] as Video[],
    };

    await uploadVideos({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      videos,
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
    const videos: Record<number, Video[]> = {
      111: [
        {
          videoPath: "path1",
        },
        {
          videoPath: "path2",
        },
      ] as Video[],
    };

    await uploadVideos({
      testrailAPI,
      resultsToPush,
      results,
      tests,
      videos,
    });

    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
