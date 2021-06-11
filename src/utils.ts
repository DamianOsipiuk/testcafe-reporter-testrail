import moment from "moment";
import { Response } from "node-fetch";

import type { Config } from "./types";

export async function throwOnApiError<
  T extends { response: Response; value: unknown }
>(apiResult: Promise<T>): Promise<T> {
  const { response, value } = await apiResult;
  if (response.status >= 400) {
    console.error("[TestRail] Error during API request");
    throw {
      url: response.url,
      status: response.status,
      message: value,
    };
  }

  return Promise.resolve({ response, value } as T);
}

export const prepareReportName = (
  config: Config,
  branch: string,
  buildNo: string,
  userAgents: string[]
) => {
  const date = moment().format(config.dateFormat);
  return config.runName
    .replace("%BRANCH%", branch)
    .replace("%BUILD%", buildNo)
    .replace("%DATE%", date)
    .replace("%AGENTS%", `(${userAgents.join(", ")})`);
};

export const prepareReference = (
  config: Config,
  branch: string,
  buildNo: string
) => {
  return config.reference
    ? config.reference.replace("%BRANCH%", branch).replace("%BUILD%", buildNo)
    : "";
};
