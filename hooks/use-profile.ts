"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/services/journal";
import type { UserProfile } from "@/types";

export function useProfile(){
 const{user}=useAuth();const[profile,setProfile]=useState<UserProfile|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const refresh=useCallback(async()=>{if(!user){setLoading(false);return}try{setLoading(true);setError("");setProfile(await getProfile(user.uid))}catch(caught){setProfile(null);setError(caught instanceof Error?caught.message:"Could not load your profile")}finally{setLoading(false)}},[user]);
 useEffect(()=>{void refresh()},[refresh]);return{profile,loading,error,refresh};
}
