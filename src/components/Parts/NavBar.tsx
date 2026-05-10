import { useSharedContext } from "../../assets/SharedContent";

import ProfileButton from "./ProfileButton";

export default function NavBar() {
  const { session, logout } = useSharedContext();

  const userName = session?.user.email || "guest";
  const userImg = session.user.user_metadata;
  console.log(userImg);

  return (
    <>
      <div className="flex justify-end items-center gap-5 m-3">
        {/* TEMPORARY. UNTIL A LOCAL NOTE VERSION */}
        {userName != "guest" && (
          <a href="/notes" className="text-font">
            📝 Notes
          </a>
        )}
        <ProfileButton userName={userName} userImg={""} logout={logout} />
      </div>
    </>
  );
}
