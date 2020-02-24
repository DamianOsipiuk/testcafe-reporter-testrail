import path from "path";
import { loadJSON, Status, separator } from "./utils";
import { TestRail } from "./testrail";
import {
  Reporter,
  Options,
  Meta,
  TestRunInfo,
  TaskResult,
  TestResult,
} from "./interfaces";

export class TestrailReporter extends Reporter {
  noColors: boolean;

  options: Options;
  testrailAPI!: TestRail;
  startTime?: number;
  userAgents?: string[];
  testCount?: number;
  testResults: TestResult[];

  constructor(config: Options) {
    super();

    this.noColors = false;
    this.testResults = [];

    this.options = {
      testrailEnabled:
        process.env.TESTRAIL_ENABLE == "true" ||
        config.testrailEnabled ||
        false,
      host: process.env.TESTRAIL_HOST || config.host,
      user: process.env.TESTRAIL_USER || config.user,
      apiKey: process.env.TESTRAIL_API_KEY || config.apiKey,
      project: process.env.TESTRAIL_PROJECT || config.project,
      projectId: process.env.TESTRAIL_PROJECT_ID || config.projectId,
      plan: process.env.TESTRAIL_PLAN || config.plan,
      planId: process.env.TESTRAIL_PLAN_ID || config.planId,
      suite: process.env.TESTRAIL_SUITE || config.suite || "Master",
      suiteId: process.env.TESTRAIL_SUITE_ID || config.suiteId,
      caseMeta: process.env.TESTRAIL_CASE_META || config.caseMeta || "CID",
      runName: process.env.TESTRAIL_RUN_NAME || config.runName,
      runDescription:
        process.env.TESTRAIL_RUN_DESCRIPTION || config.runDescription,
      runCloseAfterDays:
        process.env.TESTRAIL_RUN_CLOSE_AFTER_DAYS || config.runCloseAfterDays,
      uploadScreenshots:
        process.env.TESTRAIL_UPLOAD_SCREENSHOT == "true" ||
        config.uploadScreenshots ||
        false,
    };
  }

  renderErrors(errs: object[]) {
    this.setIndent(2).newline();

    errs.forEach((err, idx) => {
      var prefix = this.chalk.red(idx + 1 + ") ");

      this.newline()
        .write(this.formatError(err, prefix))
        .newline()
        .newline();
    });
    this.setIndent(0);
  }

  async reportTaskStart(
    startTime: number,
    userAgents: string[],
    testCount: number
  ) {
    this.startTime = startTime;
    this.userAgents = userAgents;
    this.testCount = testCount;

    this.newline()
      .write(separator)
      .newline()
      .write("Running tests in:")
      .newline()
      .setIndent(2);

    userAgents.forEach((userAgent) => {
      this.write(this.chalk.blue(userAgent)).newline();
    });

    this.setIndent(0);

    // Check if env was set up
    if (this.options.testrailEnabled) {
      if (
        !this.options.host ||
        !this.options.user ||
        !this.options.apiKey ||
        (!this.options.project && !this.options.projectId)
      ) {
        if (!this.options.host) {
          this.newline()
            .write(
              this.chalk.red.bold(
                "Error: You have to specify Testrail hostname via env or config file."
              )
            )
            .newline();
        }
        if (!this.options.user) {
          this.newline()
            .write(
              this.chalk.red.bold(
                "Error: You have to specify Testrail username via env or config file."
              )
            )
            .newline();
        }
        if (!this.options.apiKey) {
          this.newline()
            .write(
              this.chalk.red.bold(
                "Error: You have to specify Testrail api key via env or config file."
              )
            )
            .newline();
        }
        if (!this.options.project && !this.options.projectId) {
          this.newline()
            .write(
              this.chalk.red.bold(
                "Error: You have to specify Testrail project or projectId via env or config file."
              )
            )
            .newline();
        }
        process.exit(1);
      }

      this.testrailAPI = new TestRail(
        {
          host: this.options.host,
          user: this.options.user,
          password: this.options.apiKey,
        },
        this
      );

      return await this.testrailAPI.testConnection();
    }
  }

  reportFixtureStart(name: string, path: string, meta: Meta) {
    this.setIndent(0)
      .newline()
      .write(`[Fixture] ${this.chalk.blue(name)}`)
      .newline();
  }

  reportTestDone(name: string, testRunInfo: TestRunInfo, meta: Meta) {
    const durationFormatted = (this.moment.duration(
      testRunInfo.durationMs
    ) as any).format("h[h] mm[m] ss[s]");
    const hasErr = testRunInfo.errs.length;

    let testStatus = null;

    if (testRunInfo.skipped) {
      testStatus = Status.Blocked;
    } else if (hasErr === 0) {
      testStatus = Status.Passed;
    } else {
      testStatus = Status.Failed;
    }

    let caseId = 0;
    if (meta[this.options.caseMeta]) {
      caseId = Number(meta[this.options.caseMeta].replace("C", "").trim());
    }

    this.testResults.push({
      name,
      meta,
      caseId,
      testRunInfo: testRunInfo,
      durationFormatted: durationFormatted,
      testStatus: testStatus,
    });

    this.setIndent(2)
      .write(`[Test] ${this.chalk.blue(name)}`)
      .write(">")
      .write(this.chalk.keyword(testStatus.color)(testStatus.text))
      .write(`(${durationFormatted})`)
      .newline();

    if (hasErr > 0) {
      this.renderErrors(testRunInfo.errs);
    }
  }

  async reportTaskDone(
    endTime: number,
    passed: number,
    warnings: string[],
    result: TaskResult
  ) {
    const durationFormatted = (this.moment.duration(
      endTime - (this.startTime || 0)
    ) as any).format("h[h] mm[m] ss[s]");

    const failedTests = this.testResults.filter(
      (result) => result.testStatus.value === Status.Failed.value
    );

    if (failedTests.length > 0) {
      // Display failed tests summary
      this.setIndent(0)
        .newline()
        .write(separator)
        .newline()
        .write(`${this.chalk.red.bold("Failed tests summary")}`)
        .newline()
        .newline();
      failedTests.forEach((testCase) => {
        this.setIndent(2)
          .write(`[Test] ${this.chalk.blue(testCase.name)}`)
          .write(">")
          .write(
            this.chalk.keyword(testCase.testStatus.color)(
              testCase.testStatus.text
            )
          )
          .write(`(${testCase.durationFormatted})`);
        this.renderErrors(testCase.testRunInfo.errs);
      });
    }

    this.setIndent(0)
      .newline()
      .write(separator)
      .newline()
      .write("Tests:")
      .setIndent(1);

    if (result.passedCount) {
      this.write(
        this.chalk.keyword(Status.Passed.color)(
          `${result.passedCount} ${Status.Passed.text}`
        )
      );
    }
    if (result.skippedCount) {
      if (result.passedCount) {
        this.write("/");
      }
      this.write(
        this.chalk.keyword(Status.Blocked.color)(
          `${result.skippedCount} ${Status.Blocked.text}`
        )
      );
    }
    if (result.failedCount) {
      if (result.passedCount || result.skippedCount) {
        this.write("/");
      }
      this.write(
        this.chalk.keyword(Status.Failed.color)(
          `${result.failedCount} ${Status.Failed.text}`
        )
      );
    }
    this.write(`(${this.testCount} total)`).setIndent(0);

    this.newline()
      .write(`Time: ${durationFormatted}`)
      .newline()
      .newline();

    if (this.options.testrailEnabled) {
      await this.testrailAPI.publishTestRun(
        this.options,
        this.testResults,
        this.userAgents || [""]
      );
    }
  }
}

module.exports = function() {
  const config = loadJSON(path.join(process.cwd(), ".testrailrc"));

  return new TestrailReporter(config);
};
