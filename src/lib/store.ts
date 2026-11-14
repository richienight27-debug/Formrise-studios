"use client";

import { useSyncExternalStore } from "react";

type State = {
  /** 0..1 progress of the critical frame set */
  progress: number;
  /** preloader finished and curtain lifted */
  revealed: boolean;
  /** id of the section currently in view */
  section: string;
};

const initial: State = { progress: 0, revealed: false, section: "home" };
let state: State = initial;
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch };
    if (Object.keys(patch).every((k) => next[k as keyof State] === state[k as keyof State])) return;
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(initial),
  );
}
