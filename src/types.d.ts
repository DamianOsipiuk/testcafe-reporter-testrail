export interface Config<T = number> {
  enabled: boolean;
  host: string;
  user: string;
  apiKey: string;
  projectId: T;
  suiteId: T;
  runId: T;
  runName: string;
  runDescription?: string;
  reference?: string;
  branchEnv: string;
  buildNoEnv: string;
  dateFormat: string;
  caseMeta: string;
  runCloseAfterDays?: number;
  uploadScreenshots: boolean;
  updateRunTestCases: boolean;
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
  errs: Record<string, unknown>[];
  warnings: string[];
  durationMs: number;
  unstable: boolean;
  screenshotPath: string;
  screenshots: Screenshot[];
  quarantine: { [key: string]: { passed: boolean } };
  skipped: boolean;
}
