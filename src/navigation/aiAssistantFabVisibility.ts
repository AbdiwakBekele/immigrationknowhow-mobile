import { useSyncExternalStore } from 'react';

let suppressCount = 0;

const store = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  emit() {
    this.listeners.forEach((l) => l());
  },
};

export function setAiAssistantFabSuppressed(suppressed: boolean): void {
  if (suppressed) {
    suppressCount += 1;
  } else {
    suppressCount = Math.max(0, suppressCount - 1);
  }
  store.emit();
}

export function isAiAssistantFabSuppressed(): boolean {
  return suppressCount > 0;
}

/** True while {@link AiAssistantScreen} is focused. */
export function useAiAssistantFabSuppressed(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => store.subscribe(onStoreChange),
    isAiAssistantFabSuppressed,
    () => false,
  );
}
