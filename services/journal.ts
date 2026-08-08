import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Account, PaperPosition, Trade, UserProfile } from "@/types";
const mapDocs=<T extends object>(snapshot:QuerySnapshot<DocumentData>)=>snapshot.docs.map(item=>({id:item.id,...item.data()} as T));
export async function getAccounts(uid:string){return mapDocs<Account>(await getDocs(query(collection(db,"accounts"),where("userId","==",uid))))}
export async function createAccount(uid:string,data:Omit<Account,"id"|"createdAt">){const current=await getAccounts(uid);if(current.length>=1)throw new Error("You can only create one trading account.");await addDoc(collection(db,"accounts"),{...data,userId:uid,createdAt:new Date().toISOString()})}
export async function updateAccount(id:string,data:Pick<Account,"name"|"balance">){await updateDoc(doc(db,"accounts",id),data)}
export async function deleteAccount(id:string){await deleteDoc(doc(db,"accounts",id))}
export async function getTrades(uid:string){const rows=mapDocs<Trade>(await getDocs(query(collection(db,"trades"),where("userId","==",uid))));return rows.sort((a,b)=>b.date.localeCompare(a.date))}
export async function createTrade(uid:string,data:Omit<Trade,"id"|"createdAt"|"updatedAt">){const now=new Date().toISOString();await addDoc(collection(db,"trades"),{...data,userId:uid,createdAt:now,updatedAt:now})}
export async function updateTrade(id:string,data:Partial<Trade>){await updateDoc(doc(db,"trades",id),{...data,updatedAt:new Date().toISOString()})}
export async function deleteTrade(id:string){await deleteDoc(doc(db,"trades",id))}
export async function getProfile(uid:string){const snapshot=await getDoc(doc(db,"users",uid));return snapshot.exists()?({id:snapshot.id,...snapshot.data()} as UserProfile):null}
export async function saveOnboarding(uid:string,data:Pick<UserProfile,"traderStyles"|"markets"|"instruments"|"experience"|"baseCurrency"|"goal"|"emailDigest"|"emailFrequency">&{name?:string;email?:string}){const now=new Date().toISOString();await setDoc(doc(db,"users",uid),{...data,onboardingComplete:true,createdAt:now,updatedAt:now},{merge:true})}
export async function getPaperPositions(uid:string){const rows=mapDocs<PaperPosition>(await getDocs(query(collection(db,"paperPositions"),where("userId","==",uid))));return rows.sort((a,b)=>b.openedAt.localeCompare(a.openedAt))}
export async function createPaperPosition(uid:string,data:Omit<PaperPosition,"id"|"createdAt"|"updatedAt">){const now=new Date().toISOString();await addDoc(collection(db,"paperPositions"),{...data,userId:uid,createdAt:now,updatedAt:now})}
export async function updatePaperPosition(id:string,data:Partial<PaperPosition>){await updateDoc(doc(db,"paperPositions",id),{...data,updatedAt:new Date().toISOString()})}
export async function deletePaperPosition(id:string){await deleteDoc(doc(db,"paperPositions",id))}
