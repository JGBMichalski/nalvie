// Shared fake for RN's AppState, used by any test exercising leave-detection.
export function makeFakeAppState() {
  const handlers: ((status: string) => void)[] = [];
  return {
    addEventListener: (_type: 'change', handler: (status: string) => void) => {
      handlers.push(handler);
      return {
        remove: () => {
          const index = handlers.indexOf(handler);
          if (index !== -1) handlers.splice(index, 1);
        },
      };
    },
    emit(status: 'active' | 'background' | 'inactive') {
      for (const handler of handlers) handler(status);
    },
  };
}
