import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Account, Trade } from "@/types";
const mapDocs=<T extends object>(snapshot:QuerySnapshot<DocumentData>)=>snapshot.docs.map(item=>({id:item.id,...item.data()} as T));
export async function getAccounts(uid:string){return mapDocs<Account>(await getDocs(query(collection(db,"accounts"),where("userId","==",uid))))}
export async function createAccount(uid:string,data:Omit<Account,"id"|"createdAt">){const current=await getAccounts(uid);if(current.length>=1)throw new Error("You can only create one trading account.");await addDoc(collection(db,"accounts"),{...data,userId:uid,createdAt:new Date().toISOString()})}
export async function updateAccount(id:string,data:Pick<Account,"name"|"balance">){await updateDoc(doc(db,"accounts",id),data)}
export async function deleteAccount(id:string){await deleteDoc(doc(db,"accounts",id))}
export async function getTrades(uid:string){const rows=mapDocs<Trade>(await getDocs(query(collection(db,"trades"),where("userId","==",uid))));return rows.sort((a,b)=>b.date.localeCompare(a.date))}
export async function createTrade(uid:string,data:Omit<Trade,"id"|"createdAt"|"updatedAt">){const now=new Date().toISOString();await addDoc(collection(db,"trades"),{...data,userId:uid,createdAt:now,updatedAt:now})}
export async function updateTrade(id:string,data:Partial<Trade>){await updateDoc(doc(db,"trades",id),{...data,updatedAt:new Date().toISOString()})}
export async function deleteTrade(id:string){await deleteDoc(doc(db,"trades",id))}
