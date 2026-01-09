import { useState } from "react";
import supabase from "./supabase-client";
import { z } from "zod";
import { Modal } from "./assets/dialog";

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const signUpSchema = z.object({
    email: z.email({ error: "Incorrect email!" }),
    password: z.string().min(6, { error: "At least 6 symbols are required!" }),
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const validation = signUpSchema.safeParse({ email, password });
    if (!validation.success) {
      const CurrErrors = validation.error.flatten().fieldErrors;
      console.error(CurrErrors);
      setErrors(CurrErrors);
      return;
    } else {
      console.log(validation.data);
      setErrors(false);
    }
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        console.error("Error signing up:", signUpError.message);
        return;
      }
      // HERE
      setIsDialogOpen(true);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        console.error("Error signing up:", signInError.message);
        setErrors({ credentials: "Incorrect email/password" });
        return;
      }
    }
  };

  const signWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div className="max-w-100 mx-auto my-0 p-4 text-2xl space-y-2 text-center">
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      <h2 className="text-3xl">{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border-2 border-black rounded"
            required
          />
          {errors && (
            <div className="justify-self-start text-start text-red-600">
              {errors.email?.[0]}
            </div>
          )}
        </div>
        <div className="mb-2">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border-2 rounded"
            required
          />
          {errors && (
            <div className="justify-self-start text-start text-red-600">
              {errors.password?.[0]}
              {errors.credentials}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="py-2 px-4 mr-2 bg-gray-300 hover:bg-gray-400 transition rounded shadow-xl/5"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>
      <button
        onClick={signWithGoogle}
        className="py-2 px-4 bg-orange-300 hover:bg-orange-400 transition rounded shadow-xl/5"
      >
        With Google
      </button>
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
        }}
        className="py-2 px-4 bg-gray-300 hover:bg-gray-400 transition rounded shadow-xl/5"
      >
        {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
      </button>
    </div>
  );
};
