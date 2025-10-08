import type { Signal } from "@preact/signals-react";
import { produce, type Draft } from "immer";

export const mutateSignal = <T>(signal: Signal, updater: (draft: Draft<T>) => void) => {
  signal.value = produce(signal.value, updater);
};