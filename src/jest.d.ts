/// <reference types="@types/jest" />

import type { jest as jestType } from '@jest/globals';

declare global {
  const jest: typeof jestType;
  const describe: jestType.Describe;
  const it: jestType.It;
  const test: jestType.It;
  const expect: jestType.Expect;
  const beforeEach: jestType.Lifecycle;
  const afterEach: jestType.Lifecycle;
  const beforeAll: jestType.Lifecycle;
  const afterAll: jestType.Lifecycle;

  namespace jest {
    type MockedFunction<T extends (...args: unknown[]) => unknown> = jestType.MockedFunction<T>;
  }
}
