import { useEffect, useState } from "react";
import supabase from "../supabase-client";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const updatePassword = async () => {
    await supabase.auth.updateUser({ password });
    setDone(true);
  };

  if (!ready) return <p>Validating reset link…</p>;

  if (done) return <p>Password updated. You may now sign in.</p>;

  return (
    <div>
      <h1>Reset password</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
      />
      <button onClick={updatePassword}>Set new password</button>
    </div>
  );
}
