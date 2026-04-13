import ProfileButton from "./ProfileButton";

type Arguments = {
  userName: string;
  logout: Function;
};

export default function NavBar({ userName, logout }: Arguments) {
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
