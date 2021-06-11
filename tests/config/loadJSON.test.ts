import { readFileSync } from "fs";

import { loadJSON } from "../../src/config";

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

const readFileSyncMock = readFileSync as jest.Mock;

describe("loadJSON", () => {
  test("should return parsed object if present", () => {
    const fileContent = {
      enabled: true,
    };
    readFileSyncMock.mockReturnValueOnce(JSON.stringify(fileContent));

    const json = loadJSON("");

    expect(json).toEqual(fileContent);
  });

  test("should return empty object if content is empty", () => {
    readFileSyncMock.mockReturnValueOnce(undefined);

    const json = loadJSON("");

    expect(json).toEqual({});
  });

  test("should return empty object when throws", () => {
    readFileSyncMock.mockImplementationOnce(() => {
      throw new Error();
    });

    const json = loadJSON("");

    expect(json).toEqual({});
  });
});
