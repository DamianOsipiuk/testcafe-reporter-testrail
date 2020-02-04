const path = require("path");
const utils = require("./utils");
const TestRail = require("./testrail");

module.exports = function() {
  const config = utils.loadJSON(path.join(process.cwd(), ".testrailrc"));

  const STATUS = utils.STATUS;
  const separator = utils.separator;

  return {
    noColors: false,

    options: {},
    testrailAPI: null,

    startTime: null,
    userAgents: null,
    testCount: null,

    currentFixture: {
      name: null,
      path: null
    },

    passed: 0,
    failed: 0,
    skipped: 0,

    failedTests: [],
    testResults: [],

    renderErrors(errs) {
      this.setIndent(2).newline();

      errs.forEach((err, idx) => {
        var prefix = this.chalk.red(idx + 1 + ") ");

        this.newline()
          .write(this.formatError(err, prefix))
          .newline()
          .newline();
      });
      this.setIndent(0);
    },

    async reportTaskStart(startTime, userAgents, testCount) {
      this.startTime = startTime;
      this.userAgents = userAgents;
      this.testCount = testCount;

      this.options = {
        testrailEnabled: process.env.TESTRAIL_ENABLE == "true" || false,
        testrailHost: process.env.TESTRAIL_HOST || config.host,
        testrailUser: process.env.TESTRAIL_USER || config.user,
        testrailPass: process.env.TESTRAIL_API_KEY || config.apiKey,
        testrailProject: process.env.TESTRAIL_PROJECT || config.project,
        testrailProjectId: process.env.TESTRAIL_PROJECT_ID || config.projectId,
        testrailPlan: process.env.TESTRAIL_PLAN || config.plan,
        testrailPlanId: process.env.TESTRAIL_PLAN_ID || config.planId,
        testrailSuite: process.env.TESTRAIL_SUITE || config.suite || "Master",
        testrailSuiteId: process.env.TESTRAIL_SUITE_ID || config.suiteId,
        testrailRunName: process.env.TESTRAIL_RUN_NAME,
        testrailCaseIdMeta:
          process.env.TESTRAIL_CASE_META || config.caseMeta || "CID"
      };

      this.newline()
        .write(separator)
        .newline()
        .write("Running tests in:")
        .newline()
        .setIndent(2);

      userAgents.forEach(userAgent => {
        this.write(this.chalk.blue(userAgent)).newline();
      });

      this.setIndent(0);

      // Check if env was set up
      if (this.options.testrailEnabled) {
        if (
          !this.options.testrailHost ||
          !this.options.testrailUser ||
          !this.options.testrailPass ||
          (!this.options.testrailProject && !this.options.testrailProjectId)
        ) {
          if (!this.options.testrailHost) {
            this.newline()
              .write(
                this.chalk.red.bold(
                  "Error: You have to specify Testrail hostname via env or config file."
                )
              )
              .newline();
          }
          if (!this.options.testrailUser) {
            this.newline()
              .write(
                this.chalk.red.bold(
                  "Error: You have to specify Testrail username via env or config file."
                )
              )
              .newline();
          }
          if (!this.options.testrailPass) {
            this.newline()
              .write(
                this.chalk.red.bold(
                  "Error: You have to specify Testrail api key via env or config file."
                )
              )
              .newline();
          }
          if (!this.options.testrailProject && !this.options.testrailProject) {
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
            host: this.options.testrailHost,
            user: this.options.testrailUser,
            password: this.options.testrailPass
          },
          this
        );

        await this.testrailAPI.testConnection();
      }
    },

    reportFixtureStart(name, path, meta) {
      this.currentFixture = {
        name: name,
        path: path,
        meta: meta
      };

      this.setIndent(0)
        .newline()
        .write(`[Fixture] ${this.chalk.blue(this.currentFixture.name)}`)
        .newline();
    },

    reportTestStart(name, meta) {
      this.setIndent(2)
        .write(`[Test] ${this.chalk.blue(name)}`)
        .write(">");
    },

    reportTestDone(name, testRunInfo, meta) {
      const durationFormatted = this.moment
        .duration(testRunInfo.durationMs)
        .format("h[h] mm[m] ss[s]");
      const hasErr = testRunInfo.errs.length;

      let testStatus = "";
      let testStatusPlain = "";

      if (testRunInfo.skipped) {
        testStatus = this.chalk.yellow(STATUS.SKIP);
        testStatusPlain = STATUS.SKIP;
        this.skipped += 1;
      } else if (hasErr === 0) {
        testStatus = this.chalk.green(STATUS.PASS);
        testStatusPlain = STATUS.PASS;
        this.passed += 1;
      } else {
        testStatus = this.chalk.red(STATUS.FAIL);
        testStatusPlain = STATUS.FAIL;
        this.failedTests.push({
          fixture: this.currentFixture,
          test: {
            name: name,
            meta: meta
          },
          testRunInfo: testRunInfo,
          durationFormatted: durationFormatted,
          status: testStatus
        });
        this.failed += 1;
      }

      this.testResults.push({
        fixture: this.currentFixture,
        test: {
          name: name,
          meta: meta,
          status: testStatusPlain
        },
        testRunInfo: testRunInfo,
        durationFormatted: durationFormatted,
        status: testStatus
      });

      this.write(testStatus)
        .write(`(${durationFormatted})`)
        .newline();

      if (hasErr > 0) {
        this.renderErrors(testRunInfo.errs);
      }
    },

    async reportTaskDone(endTime, passed, warnings) {
      const durationFormatted = this.moment
        .duration(endTime - this.startTime)
        .format("h[h] mm[m] ss[s]");

      if (this.failedTests.length > 0) {
        // Display failed tests summary
        this.newline()
          .write(separator)
          .newline()
          .write(`${this.chalk.red.bold("Failed tests summary")}`)
          .newline()
          .newline();
        this.failedTests.forEach(testCase => {
          this.setIndent(2)
            .write(`[Test] ${this.chalk.blue(testCase.test.name)}`)
            .write(">")
            .write(testCase.status)
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

      if (this.passed) {
        this.write(this.chalk.green(`${this.passed} ${STATUS.PASS}`));
      }
      if (this.skipped) {
        if (this.passed) {
          this.write("/");
        }
        this.write(this.chalk.yellow(`${this.skipped} ${STATUS.SKIP}`));
      }
      if (this.failed) {
        if (this.passed || this.skipped) {
          this.write("/");
        }
        this.write(this.chalk.red(`${this.failed} ${STATUS.FAIL}`));
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
          this.userAgents
        );
      }
    }
  };
};
