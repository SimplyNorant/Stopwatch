import { useState, useEffect } from "react";
import { Auth } from "./Auth";
import StopwatchSystem from "./StopwatchSystem";
import supabase from "./supabase-client";

function App() {
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    console.log(currentSession);
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
          {" "}
          <button
            onClick={logout}
            className="sm:absolute top-2 right-2 p-2 w-full sm:w-20 bg-gray-300 hover:bg-gray-400 transition rounded shadow-xl/5"
          >
            {" "}
            Log Out
          </button>
          <StopwatchSystem session={session} />{" "}
        </>
      ) : (
        <>
          <Auth />
        </>
      )}
    </>
  );
}

export default App;
