import { Link } from "react-router-dom";
import StopwatchSystem from "./components/Pages/StopwatchSystem";
import NavBar from "./components/Parts/NavBar";

import { useSharedContext } from "./assets/SharedContent";
import StopwatchSystemLocal from "./components/Pages/StopwatchSystemLocal";

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
          <NavBar />
          <StopwatchSystemLocal />
        </>
      )}
      <div className="text-center text-font mb-5 hover:text-gray-400 transition">
        <Link to={"/PrivacyPolicy"}>Privacy Policy</Link>
      </div>
    </>
  );
}

export default App;
