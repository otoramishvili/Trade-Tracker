"use client";
import { onAuthStateChanged, type User } from "firebase/auth"; import { createContext,useContext,useEffect,useState } from "react"; import { auth } from "@/lib/firebase/config";
type AuthState={user:User|null;loading:boolean}; const AuthContext=createContext<AuthState>({user:null,loading:true});
export function AuthProvider({children}:{children:React.ReactNode}){const [state,setState]=useState<AuthState>({user:null,loading:true});useEffect(()=>onAuthStateChanged(auth,user=>setState({user,loading:false})),[]);return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
export const useAuth=()=>useContext(AuthContext);
