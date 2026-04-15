import { useSharedContext } from "../../assets/SharedContent";

import ProfileButton from "./ProfileButton";

export default function NavBar() {
  const { session, logout } = useSharedContext();

  const userName = session?.user.email || "guest";

  return (
    <>
      <div className="flex justify-end items-center gap-5 m-3">
        <a href="/notes" className="text-font">
          📝 Notes
        </a>
        <ProfileButton userName={userName} logout={logout} />
      </div>
    </>
  );
}
