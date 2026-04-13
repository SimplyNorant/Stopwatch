import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Auth } from "./components/Pages/Auth";
import StopwatchSystem from "./components/Pages/StopwatchSystem";
import supabase from "./supabase-client";
import DarkModeToggle from "./assets/darkModeToggle";
import NavBar from "./components/Parts/NavBar";

function App() {
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
    <>
      {session ? (
        <>
          <NavBar userName={session?.user.email} logout={logout} />
          <StopwatchSystem session={session} />
        </>
      ) : (
        <>
          <div className="flex justify-end m-1">
            <DarkModeToggle />
          </div>
          <div className="mt-[10vh]">
            <Auth />
          </div>
        </>
      )}
      <div className="text-center text-font mt-[60vh] mb-5 hover:text-gray-400 transition">
        <Link to={"/PrivacyPolicy"}>Privacy Policy</Link>
      </div>
    </>
  );
}

export default App;
