import chalk from "chalk";
import moment from "moment";
export interface Options {
    testrailEnabled: boolean;
    host: string;
    user: string;
    apiKey: string;
    project: string;
    projectId: string;
    plan: string;
    planId: string;
    suite: string;
    suiteId: string;
    runName: string;
    runDescription: string;
    runCloseAfterDays: string;
    caseMeta: string;
    uploadScreenshots: boolean;
}
export interface TestResult {
    name: string;
    meta: Meta;
    caseId: number;
    testRunInfo: TestRunInfo;
    durationFormatted: string;
    testStatus: {
        value: TestStatus;
        text: string;
        color: string;
    };
}
export interface Meta {
    [key: string]: string;
}
export interface TaskResult {
    passedCount: number;
    failedCount: number;
    skippedCount: number;
}
export interface Screenshot {
    screenshotPath: string;
    thumbnailPath: string;
    userAgent: string;
    quarantineAttempt: number;
    takenOnFail: boolean;
}
export interface TestRunInfo {
    errs: any[];
    warnings: string[];
    durationMs: number;
    unstable: boolean;
    screenshotPath: string;
    screenshots: Screenshot[];
    quarantine: {
        [key: string]: {
            passed: boolean;
        };
    };
    skipped: boolean;
}
export declare abstract class Reporter {
    newline: () => Reporter;
    write: (text: string) => Reporter;
    useWordWrap: (use: boolean) => Reporter;
    setIndent: (indent: number) => Reporter;
    indentString: (text: string, indent: number) => string;
    wordWrap: (text: string, indent: number, width: number) => string;
    escapeHtml: (html: string) => string;
    formatError: (error: object, prefix?: string) => string;
    chalk: typeof chalk;
    moment: typeof moment;
    symbols: {
        err: string;
    };
    abstract noColors: boolean;
    abstract reportTaskStart(startTime: number, userAgents: string[], testCount: number): Promise<void>;
    abstract reportFixtureStart(name: string, path: string, meta: Meta): void;
    reportTestStart?(name: string, meta: Meta): void;
    abstract reportTestDone(name: string, testRunInfo: TestRunInfo, meta: Meta): void;
    abstract reportTaskDone(endTime: number, passed: number, warnings: string[], result: TaskResult): void;
}
export declare enum TestStatus {
    Passed = 1,
    Blocked = 2,
    Untested = 3,
    Retest = 4,
    Failed = 5
}
export interface Case {
    created_by: number;
    created_on: number;
    estimate: string;
    estimate_forecast: string;
    id: number;
    milestone_id: number;
    priority_id: number;
    refs: string;
    section_id: number;
    suite_id: number;
    template_id: number;
    title: string;
    type_id: number;
    updated_by: number;
    updated_on: number;
}
export interface NewCase {
    title: string;
    template_id: number;
    type_id: number;
    priority_id: number;
    estimate: string;
    milestone_id: number;
    refs: string;
}
export interface Project {
    announcement: string;
    completed_on: number;
    id: number;
    is_completed: boolean;
    name: string;
    show_announcement: boolean;
    suite_mode: number;
    url: string;
}
export interface Plan {
    assignedto_id: number;
    blocked_count: number;
    completed_on: number;
    created_by: number;
    created_on: number;
    description: string;
    entries: any[];
    failed_count: number;
    id: number;
    is_completed: boolean;
    milestone_id: number;
    name: string;
    passed_count: number;
    project_id: number;
    retest_count: number;
    untested_count: number;
    url: string;
}
export interface PlanEntry {
    id: string;
    name: string;
    runs: Run[];
    suite_id: number;
}
export interface Suite {
    completed_on: number;
    description: string;
    id: number;
    is_baseline: boolean;
    is_completed: boolean;
    is_master: boolean;
    name: string;
    project_id: number;
    url: string;
}
export interface Run {
    assignedto_id: number;
    blocked_count: number;
    completed_on: number;
    config: string;
    config_ids: number[];
    created_by: number;
    created_on: number;
    description: string;
    failed_count: number;
    id: number;
    include_all: boolean;
    is_completed: boolean;
    milestone_id: number;
    plan_id: number;
    name: string;
    passed_count: number;
    project_id: number;
    retest_count: number;
    suite_id: number;
    untested_count: number;
    url: string;
    refs: string;
}
export interface Result {
    assignedto_id: number;
    comment: string;
    created_by: number;
    created_on: number;
    defects: string;
    elapsed: string;
    id: number;
    status_id: number;
    test_id: number;
    version: string;
}
export interface NewResult {
    status_id: TestStatus;
    comment: string;
    version: string;
    elapsed: string;
    defects: string;
    assignedto_id: number;
}
export interface NewResultByCase {
    case_id: number;
    status_id?: TestStatus;
    comment?: string;
    version?: string;
    elapsed?: string;
    defects?: string;
    assignedto_id?: number;
}
export interface Test {
    assignedto_id: number;
    case_id: number;
    estimate: string;
    estimate_forecast: string;
    id: number;
    milestone_id: number;
    priority_id: number;
    refs: string;
    run_id: number;
    status_id: number;
    title: string;
    type_id: number;
}
