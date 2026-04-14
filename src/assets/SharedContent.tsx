import { createContext, useContext, useState, useEffect } from "react";

import type { Session } from "@supabase/supabase-js";
import supabase from "../supabase-client";

interface SharedContextType {
  session: Session;
  logout: Function;
}

const SharedContext = createContext<SharedContextType | undefined>(undefined);

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "TIMER_RESET") {
        window.dispatchEvent(
          new CustomEvent("timer-reset", {
            detail: { taskId: event.data.taskId },
          }),
        );
      } else if (event.data?.type === "TIMER_RESTART") {
        window.dispatchEvent(
          new CustomEvent("timer-restart", {
            detail: { taskId: event.data.taskId },
          }),
        );
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return null;
  }

  return (
    <SharedContext.Provider value={{ session, logout }}>
      {children}
    </SharedContext.Provider>
  );
}

export function useSharedContext() {
  const ctx = useContext(SharedContext);
  if (!ctx)
    throw new Error("useSharedContext must be used inside SharedProvider");
  return ctx;
}
