"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, type User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/firebase/config";

type AuthValue={user:User|null;loading:boolean;ready:boolean;login:(email:string,password:string)=>Promise<void>;register:(email:string,password:string,name:string)=>Promise<void>;logout:()=>Promise<void>};
const AuthContext=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(firebaseReady);
 useEffect(()=>firebaseReady?onAuthStateChanged(auth,u=>{setUser(u);setLoading(false)}):undefined,[]);
 const login=async(email:string,password:string)=>{const credential=await signInWithEmailAndPassword(auth,email,password);setUser(credential.user)};
 const register=async(email:string,password:string,name:string)=>{
  const credential=await createUserWithEmailAndPassword(auth,email,password);
  await updateProfile(credential.user,{displayName:name});
  setUser(credential.user);
  const now=new Date().toISOString();
  try{
   await setDoc(doc(db,"users",credential.user.uid),{email,name,onboardingComplete:false,createdAt:now,updatedAt:now});
  }catch(error){
   console.warn("Account created, but the initial Firestore profile could not be saved. Onboarding will retry it.",error);
  }
 };
 const logout=()=>signOut(auth);
 return <AuthContext.Provider value={{user,loading,ready:firebaseReady,login,register,logout}}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}
