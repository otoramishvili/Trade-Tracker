import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./config"; import type { Trade,TradeDraft } from "@/types/trade";
const cleanValue=(value:unknown):unknown=>{if(Array.isArray(value))return value.map(cleanValue);if(value&&typeof value==="object")return cleanObject(value as Record<string,unknown>);return value;};
const cleanObject=(value:Record<string,unknown>):Record<string,unknown>=>Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined&&v!=="").map(([k,v])=>[k,cleanValue(v)]));
export async function createTrade(uid:string,draft:TradeDraft){const ref=await addDoc(collection(db,"users",uid,"trades"),cleanObject({...draft,symbol:draft.symbol.trim().toUpperCase(),createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));return ref.id;}
export async function getTrades(uid:string){const snap=await getDocs(query(collection(db,"users",uid,"trades"),orderBy("date","desc")));return snap.docs.map(d=>({id:d.id,...d.data()} as Trade)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt?.toMillis()??0)-(a.createdAt?.toMillis()??0));}
export async function getTrade(uid:string,id:string){const snap=await getDoc(doc(db,"users",uid,"trades",id));return snap.exists()?({id:snap.id,...snap.data()} as Trade):null;}
export async function updateTrade(uid:string,id:string,draft:TradeDraft){await updateDoc(doc(db,"users",uid,"trades",id),cleanObject({...draft,symbol:draft.symbol.trim().toUpperCase(),updatedAt:serverTimestamp()}));}
export async function deleteTrade(uid:string,id:string){await deleteDoc(doc(db,"users",uid,"trades",id));}
