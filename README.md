[![NPM](https://img.shields.io/npm/v/testcafe-reporter-testrail)](https://www.npmjs.com/package/testcafe-reporter-testrail) [![NPM](https://img.shields.io/npm/l/testcafe-reporter-testrail)](https://github.com/DamianOsipiuk/testcafe-reporter-testrail/blob/master/LICENSE) [![NPM](https://img.shields.io/node/v/testcafe-reporter-testrail)](https://github.com/DamianOsipiuk/testcafe-reporter-testrail/blob/master/package.json)

# Description

Reporter plugin that sends test results to TestRail

**It does not provide test output to console, please use with combination with the default reporter**

# Usage

1. Installation

   `npm install testcafe-reporter-testrail --save-dev`

2. Add reporter to testrail configuration. Make sure to also include **default** reporter if **reporters** option was not provided

   Command Line:

   ```
   testcafe chrome tests/* -r spec,testrail:out.xml
   ```

   API:

   ```
   testCafe
       .createRunner()
       .src('path/to/test/file.js')
       .browsers('chrome')
       .reporter(['spec', { name: 'testrail', output: '' }]) // <-
       .run();
   ```

3. Provide required options from the configuration section

# Prerequisites

- All test cases should have a valid mapping between TestCafe and TestRail. TestRail `Case ID` should be put into TestCafe test metadata. (Example: `test.meta({CID: 'C123'})('test name', async t => { .... });`)

# Configuration

Configuration can be provided via:

- ENV variables
- configuration file (.testrailrc)

| ENV Variable                   | Config             | Description                                                                                                                                                                                                                                                                                                        |           Default           | Required |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------: | :------: |
| TESTRAIL_ENABLED               | enabled            | Enables TestRail integration.                                                                                                                                                                                                                                                                                      |           `false`           |          |
| TESTRAIL_HOST                  | host               | URL of the TestRail instance.                                                                                                                                                                                                                                                                                      |                             |  `true`  |
| TESTRAIL_USER                  | user               | Account name which will be used to push results.                                                                                                                                                                                                                                                                   |                             |  `true`  |
| TESTRAIL_API_KEY               | apiKey             | API key which can be generated on the profile page in TestRail.                                                                                                                                                                                                                                                    |                             |  `true`  |
| TESTRAIL_PROJECT_ID            | projectId          | Project id in which test cases are stored. Ex. `P123`                                                                                                                                                                                                                                                              |                             |  `true`  |
| TESTRAIL_SUITE_ID              | suiteId            | Suite id in which test cases are stored. Ex. `S123`                                                                                                                                                                                                                                                                |                             |  `true`  |
| TESTRAIL_RUN_ID                | runId              | Run id which test cases are stored. Ex `R123`                                                                                                                                                                                                                                                                      |                             |          |
| TESTRAIL_CASE_META             | caseMeta           | Meta attribute to be used to get TestRail case id mapping.                                                                                                                                                                                                                                                         |           `'CID'`           |          |
| TESTRAIL_RUN_NAME              | runName            | Test Run name. Configurable with variables <ul><li>`%BRANCH%` - see config option `branchEnv`</li><li>`%BUILD%` - see config option `buildNoEnv`</li><li>`%DATE%` - see config option `dateFormat`</li></ul>                                                                                                       | `%BRANCH%#%BUILD% - %DATE%` |          |
| TESTRAIL_RUN_DESCRIPTION       | runDescription     | You can provide you own Test Run description. If this option is not configured, it will contain test results and test coverage.                                                                                                                                                                                    |                             |          |
| TESTRAIL_REFERENCE             | reference          | String that will be added to the `refs` field in TestRail. This can enable integration with other tools like https://github.com/DamianOsipiuk/jest-reporter-testrail/. Configurable with variables <ul><li>`%BRANCH%` - see config option `branchEnv`</li><li>`%BUILD%` - see config option `buildNoEnv`</li></ul> |                             |          |
| TESTRAIL_BRANCH_ENV            | branchEnv          | Which ENV variable is used to store branch name on which tests are run.                                                                                                                                                                                                                                            |          `BRANCH`           |          |
| TESTRAIL_BUILD_NO_ENV          | buildNoEnv         | Which ENV variable is used to store build number of tests run.                                                                                                                                                                                                                                                     |       `BUILD_NUMBER`        |          |
| TESTRAIL_DATE_FORMAT           | dateFormat         | What date format should be used for `%DATE%` placeholder. https://momentjs.com/ formats supported.                                                                                                                                                                                                                 |    `YYYY-MM-DD HH:mm:ss`    |          |
| TESTRAIL_RUN_CLOSE_AFTER_DAYS  | runCloseAfterDays  | After how many days should reporter close old Runs in testrail.                                                                                                                                                                                                                                                    |                             |          |
| TESTRAIL_UPLOAD_SCREENSHOTS    | uploadScreenshots  | Should upload screenshots to testrail. Requires test result edit enabled in testrail.                                                                                                                                                                                                                              |           `false`           |          |
| TESTRAIL_UPLOAD_VIDEOS         | uploadVideos       | Should upload videos to testrail. Requires test result edit enabled in testrail.                                                                                                                                                                                                                                   |           `false`           |          |
| TESTRAIL_UPDATE_RUN_TEST_CASES | updateRunTestCases | Tells to the reporting tool to no create or update the given test run, you need to create the mapping for the testcases manually                                                                                                                                                                                   |           `true`            |          |
