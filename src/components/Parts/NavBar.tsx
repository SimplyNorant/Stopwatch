import { useSharedContext } from "../../assets/SharedContent";

import ProfileButton from "./ProfileButton";

export default function NavBar() {
  const { session, logout } = useSharedContext();

  const userName = session?.user.email || "guest";

  const adminAccess: boolean =
    userName === "mishanauki@gmail.com" || userName === "dobbyplay@outlook.com"
      ? true
      : false;

  return (
    <>
      <div className="flex justify-end items-center gap-5 m-3">
        {adminAccess && <a href="/notes">📝 Notes</a>}
        <ProfileButton userName={userName} logout={logout} />
      </div>
    </>
  );
}
