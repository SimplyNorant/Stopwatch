import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Auth } from "./components/Auth";
import StopwatchSystem from "./components/StopwatchSystem";
import supabase from "./supabase-client";
import DarkModeToggle from "./assets/darkModeToggle";

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // const fetchSession = async () => {
  //   const currentSession = await supabase.auth.getSession();
  //   console.log(currentSession);
  //   console.log(currentSession.data.session?.user.email);
  //   setSession(currentSession.data.session);
  // };
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
          <div className="flex justify-end items-center gap-2 m-1">
            <DarkModeToggle />
            <div className="p-2 bg-foreground rounded text-font">
              {session?.user.email}
            </div>

            <button
              onClick={logout}
              className="p-2 w sm:w-20 bg-gray-300 hover:bg-gray-400 transition rounded shadow-xl/5"
            >
              Log Out
            </button>
          </div>
          <StopwatchSystem session={session} />
        </>
      ) : (
        <>
          <div className="flex justify-end m-1">
            <DarkModeToggle />
          </div>
          <Auth />
        </>
      )}
      <div className="text-center text-font mt-[50%] mb-5 hover:text-gray-400 transition">
        <Link to={"/PrivacyPolicy"}>Privacy Policy</Link>
      </div>
    </>
  );
}

export default App;
