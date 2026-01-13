import { useState, useEffect } from "react";
import { Auth } from "./Auth";
import StopwatchSystem from "./StopwatchSystem";
import supabase from "./supabase-client";
import DarkModeToggle from "./assets/darkModeToggle";

function App() {
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    console.log(currentSession);
    console.log(currentSession.data.session?.user.email);
    setSession(currentSession.data.session);
  };

  useEffect(() => {
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

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
    </>
  );
}

export default App;
