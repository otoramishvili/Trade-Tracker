"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import type { z } from "zod";
import { authSchema, registerSchema } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";

type Values = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const { login, register: signUp, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(isRegister ? registerSchema : authSchema) });

  const submit = async (values: Values) => {
    if (!ready) { setError("Add your Firebase keys to .env.local to enable authentication."); return; }
    try {
      setError("");
      if (isRegister) await signUp(values.email, values.password, values.name);
      else await login(values.email, values.password);
      router.push(isRegister ? "/onboarding" : "/dashboard");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Authentication failed"); }
  };

  return <div className="auth-page"><Link href="/" className="brand"><span>TT</span> Trade Tracker</Link><div className="auth-card"><div className="auth-copy"><small>{isRegister ? "START YOUR JOURNAL" : "WELCOME BACK"}</small><h1>{isRegister ? "Build your trading edge." : "Log in to your journal."}</h1><p>{isRegister ? "Track the process. Understand the patterns. Trade with clarity." : "Review your performance and prepare for what’s next."}</p></div><form onSubmit={handleSubmit(submit)}>{isRegister && <label>Full name<input placeholder="Alex Morgan" {...register("name")} />{errors.name && <em>{errors.name.message}</em>}</label>}<label>Email address<input type="email" placeholder="you@example.com" {...register("email")} />{errors.email && <em>{errors.email.message}</em>}</label><label>Password<div className="password"><input type={show ? "text" : "password"} placeholder="At least 6 characters" {...register("password")} /><button type="button" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff /> : <Eye />}</button></div>{errors.password && <em>{errors.password.message}</em>}</label>{error && <div className="form-error">{error}</div>}<button className="button full" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}<ArrowRight /></button></form><p className="auth-switch">{isRegister ? "Already have an account?" : "New to Trade Tracker?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create account"}</Link></p></div></div>;
}
