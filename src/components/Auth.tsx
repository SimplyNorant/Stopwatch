import { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabase-client";
import { z } from "zod";
import { Modal } from "../assets/dialog";

import { RiEyeCloseLine } from "react-icons/ri";
import { RiEyeLine } from "react-icons/ri";

export const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const signUpSchema = z.object({
    email: z.email({ error: "Incorrect email!" }),
    password: z.string().min(6, { error: "At least 6 symbols are required!" }),
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const validation = signUpSchema.safeParse({ email, password });
    if (!validation.success) {
      const CurrErrors = validation.error.flatten().fieldErrors;
      setErrors(CurrErrors);
      return;
    } else {
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

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: ["Enter your email first"] });
      return;
    }

    setResetLoading(true);
    setErrors(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);
    setResetSent(true);

    if (error) {
      console.error("Password reset error:", error.message);
    }
  };

  const signWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const signWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  return (
    <div className="max-w-100 mx-auto p-4 text-2xl space-y-2 text-center text-font bg-foreground border border-black rounded-2xl **:border-black shadow-xl/5">
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      <div className="flex justify-center items-center gap-2">
        <img src="images/clock.png" alt="Pixelized Clock" className="w-10" />
        <h1 className="text-4xl">Stopwatches</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="">
          <h2 className="text-3xl">{isSignUp ? "Register" : "Sign in"}</h2>
          <div className="flex justify-center items-center">
            <p>{isSignUp ? "Have account?" : "No account?"}</p>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
              }}
              type="button"
              className="py-2 px-4 mr-2 underline hover:text-gray-400 transition"
            >
              {isSignUp ? "Sign in" : "Register"}
            </button>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={signWithGoogle}
            type="button"
            className="py-2 px-4 mb-2 bg-gray-200 dark:bg-gray-600 transition rounded shadow-xl/5"
          >
            <img
              src="images/google_icon.png"
              alt="google icon"
              className="w-8 inline mr-2"
            />
            Google
          </button>
          <button
            onClick={signWithGitHub}
            type="button"
            className="py-2 px-4 mb-2 bg-gray-200 dark:bg-gray-600 transition rounded shadow-xl/5"
          >
            <img
              src="images/github_icon.png"
              alt="google icon"
              className="w-8 inline mr-2"
            />
            GitHub
          </button>
        </div>
        <div className="mb-2 focus-within:border-red-300">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border-2 rounded focus:border-gray-300 outline-none"
            required
          />
          {errors && (
            <div className="justify-self-start text-start text-red-600">
              {errors.email?.[0]}
            </div>
          )}
        </div>
        <div className="mb-2">
          <div className="flex border-2 rounded p-2 focus-within:border-gray-300">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full outline-none"
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
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 mr-2 bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-700 transition rounded shadow-xl/5"
        >
          {isSignUp ? "Create account" : "Sign In"}
        </button>
        {isSignUp ? (
          ""
        ) : (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-sm underline hover:text-gray-400 transition"
          >
            {resetLoading ? "Sending..." : "Forgot password?"}
          </button>
        )}
        {isSignUp ? (
          <div className="flex text-start text-sm mt-2 items-center">
            <input type="checkbox" className="mr-2 size-4" required />
            <p className="mr-1">By signing up you agree to our</p>
            <Link
              to={"/PrivacyPolicy"}
              className="underline hover:text-gray-400 transition"
            >
              Privacy Policy
            </Link>
          </div>
        ) : (
          ""
        )}
        {resetSent && (
          <div className="text-sm text-green-600 mt-2">
            If an account exists for this email, a password reset link has been
            sent.
          </div>
        )}
      </form>
    </div>
  );
};
