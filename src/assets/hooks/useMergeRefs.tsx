import { useCallback } from "react";
import type { Ref } from "react";

type PossibleRef<T> = Ref<T> | undefined;

export function useMergeRefs<T>(...refs: PossibleRef<T>[]) {
  return useCallback(
    (element: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(element);
        } else if (ref && typeof ref === "object") {
          ref.current = element;
        }
      });
    },
    [refs],
  );
}
