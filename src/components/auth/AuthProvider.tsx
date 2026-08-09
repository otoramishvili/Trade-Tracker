"use client";
import { onAuthStateChanged, type User } from "firebase/auth"; import { createContext,useContext,useEffect,useState } from "react"; import { auth, firebaseConfigured } from "@/lib/firebase/config";
type AuthState={user:User|null;loading:boolean;refreshUser:()=>void}; const AuthContext=createContext<AuthState>({user:null,loading:true,refreshUser:()=>undefined});
export function AuthProvider({children}:{children:React.ReactNode}){const [state,setState]=useState<Omit<AuthState,"refreshUser">>({user:null,loading:firebaseConfigured});useEffect(()=>{if(!firebaseConfigured)return;return onAuthStateChanged(auth,user=>setState({user,loading:false}))},[]);const refreshUser=()=>setState({user:auth.currentUser,loading:false});return <AuthContext.Provider value={{...state,refreshUser}}>{children}</AuthContext.Provider>}
export const useAuth=()=>useContext(AuthContext);
