[![NPM](https://img.shields.io/npm/v/testcafe-reporter-testrail)](https://www.npmjs.com/package/testcafe-reporter-testrail) [![NPM](https://img.shields.io/npm/l/testcafe-reporter-testrail)](https://github.com/DamianOsipiuk/testcafe-reporter-testrail/blob/master/LICENSE) [![NPM](https://img.shields.io/node/v/testcafe-reporter-testrail)](https://github.com/DamianOsipiuk/testcafe-reporter-testrail/blob/master/package.json)

# testcafe-reporter-testrail

Testcafe reporter plugin that automatically publishes test run details to the TestRail system.

# Install

`npm install testcafe-reporter-testrail`

# Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

`testcafe chrome 'path/to/test/file.js' --reporter testrail`

When you use API, pass the reporter name to the reporter() method:

```
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('testrail') // <-
    .run();
```

# Prerequisites

- NodeJS >= 8
- User account on TestRail instance with generated `API_KEY`
- Created TestRail project
- All test cases should have a valid mapping between TestCafe and TestRail. TestRail `Case ID` should be put into TestCafe test metadata. (Example: `test.meta({CID: 'C123'})('test name', async t => { .... });`)

# Additional Configuration

Additional configuration can be provided via ENV variables or configuration file.

**Keep in mind that you have to provide at least hostname, username, api key and project.**

## Configuring via `ENV`

| ENV Variable                  | Description                                                                                               |     Default      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | :--------------: |
| TESTRAIL_ENABLE               | Enables TestRail integration.                                                                             |     `false`      |
| TESTRAIL_HOST                 | Url of the TestRail instance.                                                                             |        -         |
| TESTRAIL_USER                 | Account name which will be used to push results.                                                          |        -         |
| TESTRAIL_API_KEY              | API_KEY which can be generated on the profile page in TestRail.                                           |        -         |
| TESTRAIL_PROJECT              | Project name in which test cases are stored.                                                              |        -         |
| TESTRAIL_PROJECT_ID           | Project id in which test cases are stored.                                                                |        -         |
| TESTRAIL_PLAN                 | Plan name in which test run results will be stored.                                                       |        -         |
| TESTRAIL_PLAN_ID              | Plan id in which test run results will be stored.                                                         |        -         |
| TESTRAIL_SUITE                | Suite name in which test cases are stored.                                                                |    `'Master'`    |
| TESTRAIL_SUITE_ID             | Suite id in which test cases are stored.                                                                  |        -         |
| TESTRAIL_CASE_META            | Meta attribute to be used to get TestRail case id mapping.                                                |     `'CID'`      |
| TESTRAIL_RUN_NAME             | Run name which can contain two placeholders. %DATE% for date and %AGENT% for agent on which test was run. | `%DATE% %AGENTS%` |
| TESTRAIL_RUN_DESCRIPTION      | Additional run description, which can for example contain a link to the CI system.                        |        -         |
| TESTRAIL_RUN_CLOSE_AFTER_DAYS | After how many days should reporter close old Runs in testrail. 0 means do not close any.                 |        -         |
| TESTRAIL_UPLOAD_SCREENSHOT    | Should upload screenshots to testrail. Requires test result edit enabled in testrail.                     |      false       |

## Configuring via `configuration file`

Create `.testrailrc` file in the root directory of your project

| Option            | Description                                                                                               |     Default      |
| ----------------- | --------------------------------------------------------------------------------------------------------- | :--------------: |
| testrailEnabled   | Enables TestRail integration.                                                                             |     `false`      |
| host              | Url of the TestRail instance.                                                                             |        -         |
| user              | Account name which will be used to push results.                                                          |        -         |
| apiKey            | API_KEY which can be generated on the profile page in TestRail.                                           |        -         |
| project           | Project name in which test cases are stored.                                                              |        -         |
| projectId         | Project id in which test cases are stored.                                                                |        -         |
| plan              | Plan name in which test run results will be stored.                                                       |        -         |
| planId            | Plan id in which test run results will be stored.                                                         |        -         |
| suite             | Suite name in which test cases are stored.                                                                |    `'Master'`    |
| suiteId           | Suite id in which test cases are stored.                                                                  |        -         |
| caseMeta          | Meta attribute to be used to get TestRail case id mapping.                                                |     `'CID'`      |
| runName           | Run name which can contain two placeholders. %DATE% for date and %AGENT% for agent on which test was run. | `%DATE% %AGENTS%` |
| runDescription    | Additional run description, which can for example contain a link to the CI system.                        |        -         |
| runCloseAfterDays | After how many days should reporter close old Runs in testrail. 0 means do not close any.                 |        -         |
| uploadScreenshots | Should upload screenshots to testrail. Requires test result edit enabled in testrail.                     |      false       |

Example:

```
{
  "host": "https://demo.testrail.io/",
  "user": "john.doe@example.com",
  "apiKey": "apiKeyHash",
  "project": "DEMO_PROJECT",
  "plan": "DEMO_PLAN_1",
  "suite": "DEMO_SUITE_1",
  "caseMeta": "CID"
}
```
