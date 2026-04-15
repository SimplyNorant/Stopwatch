import { Link } from "react-router-dom";
import { Auth } from "./components/Pages/Auth";
import StopwatchSystem from "./components/Pages/StopwatchSystem";
import DarkModeToggle from "./assets/darkModeToggle";
import NavBar from "./components/Parts/NavBar";

import { useSharedContext } from "./assets/SharedContent";

function App() {
  const { session } = useSharedContext();

  return (
    <>
      {session ? (
        <>
          <NavBar />
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
