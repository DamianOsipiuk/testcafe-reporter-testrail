import { TestStatus } from "./interfaces";
export declare function loadJSON(file: string): any;
export declare const Status: {
    Passed: {
        value: TestStatus;
        text: string;
        color: string;
    };
    Blocked: {
        value: TestStatus;
        text: string;
        color: string;
    };
    Failed: {
        value: TestStatus;
        text: string;
        color: string;
    };
};
export declare const separator = "------------------------------";
