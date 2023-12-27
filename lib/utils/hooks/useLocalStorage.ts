import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function useLocalStorage(key: string): [string | undefined, Dispatch<SetStateAction<string | undefined>>];
export function useLocalStorage(
  key: string,
  defaultValue: string,
): [string, Dispatch<SetStateAction<string | undefined>>];
export function useLocalStorage(
  key: string,
  defaultValue?: string | undefined,
): [string | undefined, Dispatch<SetStateAction<string>> | Dispatch<SetStateAction<string | undefined>>] {
  const [state, setState] = useState<string | undefined>(defaultValue);

  useEffect(() => {
    const item = localStorage.getItem(key);
    item && setState(item);
  }, [key, setState]);

  const setLocalState: Dispatch<SetStateAction<string | undefined>> = (newState) => {
    if (newState === undefined) {
      setState(defaultValue);
      localStorage.removeItem(key);
    } else if (typeof newState === "string") {
      setState(newState);
      localStorage.setItem(key, newState);
    } else {
      const tempState = newState(state);
      setLocalState(tempState);
    }
  };
  return [state, setLocalState];
}
