import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";
export async function registerUser(displayName:string,email:string,password:string){const credential=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(credential.user,{displayName});await setDoc(doc(db,"users",credential.user.uid),{uid:credential.user.uid,displayName,email,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return credential.user;}
export const loginUser=(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password);
export const logoutUser=()=>signOut(auth);
export function friendlyAuthError(error:unknown){const code=typeof error==="object"&&error&&"code" in error?String(error.code):"";if(code.includes("invalid-credential"))return "Email or password is incorrect.";if(code.includes("email-already-in-use"))return "An account already uses this email.";if(code.includes("weak-password"))return "Use a stronger password (at least 6 characters).";return "Authentication failed. Please try again.";}
