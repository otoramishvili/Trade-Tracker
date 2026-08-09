"use client";
import { useRouter } from "next/navigation"; import { useEffect } from "react"; import { useAuth } from "./AuthProvider";
export function AuthGuard({children}:{children:React.ReactNode}){const {user,loading}=useAuth(),router=useRouter();useEffect(()=>{if(!loading&&!user)router.replace("/login")},[loading,user,router]);if(loading||!user)return <main className="center-state">Checking your session…</main>;return <>{children}</>}
