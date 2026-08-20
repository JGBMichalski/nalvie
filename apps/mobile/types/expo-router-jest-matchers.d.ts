// expo-router/testing-library registers custom jest matchers
export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(expected: string): R;
      toHavePathnameWithParams(expected: string): R;
      toHaveSegments(expected: string[]): R;
      toHaveSearchParams(expected: Record<string, unknown>): R;
      toHaveRouterState(expected: unknown): R;
    }
  }
}
