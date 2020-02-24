import { TestRail } from "./testrail";
import { Reporter, Options, Meta, TestRunInfo, TaskResult, TestResult } from "./interfaces";
export declare class TestrailReporter extends Reporter {
    noColors: boolean;
    options: Options;
    testrailAPI: TestRail;
    startTime?: number;
    userAgents?: string[];
    testCount?: number;
    testResults: TestResult[];
    constructor(config: Options);
    renderErrors(errs: object[]): void;
    reportTaskStart(startTime: number, userAgents: string[], testCount: number): Promise<void>;
    reportFixtureStart(name: string, path: string, meta: Meta): void;
    reportTestDone(name: string, testRunInfo: TestRunInfo, meta: Meta): void;
    reportTaskDone(endTime: number, passed: number, warnings: string[], result: TaskResult): Promise<void>;
}
