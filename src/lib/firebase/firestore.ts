import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "./config"; import type { Trade,TradeDraft } from "@/types/trade";
import { timestampMillis } from "@/utils/timestamps";
// Trade drafts are flat scalar objects. Only clean their top-level optional
// fields so Firebase FieldValue sentinels (such as serverTimestamp) stay intact.
export const cleanTradeData=(value:Record<string,unknown>):Record<string,unknown>=>Object.fromEntries(Object.entries(value).filter(([,field])=>field!==undefined&&field!==""));
function assertOwner(uid:string){if(!auth.currentUser||auth.currentUser.uid!==uid)throw new Error("Authenticated user does not own this path.");}
export async function createTrade(uid:string,draft:TradeDraft){assertOwner(uid);const ref=await addDoc(collection(db,"users",uid,"trades"),cleanTradeData({...draft,symbol:draft.symbol.trim().toUpperCase(),createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));return ref.id;}
export async function getTrades(uid:string){assertOwner(uid);const snap=await getDocs(query(collection(db,"users",uid,"trades"),orderBy("date","desc")));return snap.docs.map(d=>({id:d.id,...d.data()} as Trade)).sort((a,b)=>b.date.localeCompare(a.date)||timestampMillis(b.createdAt)-timestampMillis(a.createdAt));}
export async function getTrade(uid:string,id:string){assertOwner(uid);const snap=await getDoc(doc(db,"users",uid,"trades",id));return snap.exists()?({id:snap.id,...snap.data()} as Trade):null;}
export async function updateTrade(uid:string,id:string,draft:TradeDraft){assertOwner(uid);await updateDoc(doc(db,"users",uid,"trades",id),cleanTradeData({...draft,symbol:draft.symbol.trim().toUpperCase(),updatedAt:serverTimestamp()}));}
export async function deleteTrade(uid:string,id:string){assertOwner(uid);await deleteDoc(doc(db,"users",uid,"trades",id));}
