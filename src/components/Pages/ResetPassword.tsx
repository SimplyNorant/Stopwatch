import { useEffect, useState } from "react";
import supabase from "../../supabase-client";
import { z } from "zod";

import { RiEyeCloseLine } from "react-icons/ri";
import { RiEyeLine } from "react-icons/ri";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const [errors, setErrors] = useState<any>(false);
  const signUpSchema = z.object({
    password: z.string().min(6, { error: "At least 6 symbols are required!" }),
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    const validation = signUpSchema.safeParse({ password });
    if (!validation.success) {
      const CurrErrors = validation.error.flatten().fieldErrors;
      setErrors(CurrErrors);
      return;
    } else {
      setErrors(false);
    }

    await supabase.auth.updateUser({ password });
    setDone(true);
  };

  if (!ready)
    return <p className="text-center mt-[10vh]">Validating reset link…</p>;

  if (done)
    return (
      <p className="text-center mt-[10vh]">
        Password updated. You may now sign in.
      </p>
    );

  return (
    <div className="max-w-100 mx-auto p-4 mt-[10vh] text-2xl  text-center text-font bg-foreground border border-black rounded-2xl **:border-black shadow-xl/5">
      <form action={handleSubmit} className="space-y-2">
        <h2 className="text-3xl">Reset password</h2>
        <div className="flex border-2 rounded p-2 focus-within:border-gray-300">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full p-2 outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="ml-2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <RiEyeLine /> : <RiEyeCloseLine />}
          </button>
        </div>
        {errors && (
          <div className="justify-self-start text-start text-red-600">
            {errors.password?.[0]}
            {errors.credentials}
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 mr-2 bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-700 transition rounded shadow-xl/5"
        >
          Set new password
        </button>
      </form>
    </div>
  );
}
