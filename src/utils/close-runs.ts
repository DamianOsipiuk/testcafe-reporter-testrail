import moment from "moment";
import type { TestRail } from "testrail-js-api";

import { throwOnApiError } from "./misc";
import type { Config } from "../types";

export const closeOldRuns = async (testrailAPI: TestRail, config: Config) => {
  if (config.runCloseAfterDays) {
    const { value: runsResult } = await throwOnApiError(
      testrailAPI.getRuns(config.projectId, { is_completed: 0 })
    );
    const runs = runsResult.runs || [];
    if (runs.length) {
      for (let i = 0; i < runs.length; i++) {
        const shouldClose =
          moment.unix(runs[i].created_on) <=
          moment().subtract(config.runCloseAfterDays, "days");
        if (shouldClose) {
          console.log(
            `[TestRail] Closing test run ${runs[i].id}: ${runs[i].name}`
          );
          await throwOnApiError(testrailAPI.closeRun(runs[i].id));
        }
      }
    }
  }
};
