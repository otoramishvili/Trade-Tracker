"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/firebase/config";

type AuthValue={user:User|null;loading:boolean;ready:boolean;login:(email:string,password:string)=>Promise<void>;register:(email:string,password:string,name:string)=>Promise<void>;logout:()=>Promise<void>};
const AuthContext=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(firebaseReady);
 useEffect(()=>firebaseReady?onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)}):undefined,[]);
 const login=async(email:string,password:string)=>{await signInWithEmailAndPassword(auth,email,password)};
 const register=async(email:string,password:string,name:string)=>{const c=await createUserWithEmailAndPassword(auth,email,password);await setDoc(doc(db,"users",c.user.uid),{email,name,createdAt:new Date().toISOString()})};
 const logout=()=>signOut(auth);
 return <AuthContext.Provider value={{user,loading,ready:firebaseReady,login,register,logout}}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}
