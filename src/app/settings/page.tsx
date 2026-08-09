"use client";

import { FormEvent, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { changeUserPassword, updateUserDisplayName } from "@/lib/firebase/auth";

export default function Settings(){return <AuthGuard><SettingsContent/></AuthGuard>}

function SettingsContent(){
  const {user}=useAuth();
  const [name,setName]=useState(user?.displayName??"");
  const [profileBusy,setProfileBusy]=useState(false);
  const [profileMessage,setProfileMessage]=useState("");
  const [profileError,setProfileError]=useState("");
  const [passwords,setPasswords]=useState({current:"",next:"",confirm:""});
  const [passwordBusy,setPasswordBusy]=useState(false);
  const [passwordMessage,setPasswordMessage]=useState("");
  const [passwordError,setPasswordError]=useState("");

  async function saveProfile(event:FormEvent){event.preventDefault();const clean=name.trim();if(!clean){setProfileError("Display name cannot be empty.");return}setProfileBusy(true);setProfileError("");setProfileMessage("");try{await updateUserDisplayName(clean);setProfileMessage("Profile updated successfully.")}catch(error){console.error(error);setProfileError("Your profile could not be updated. Please try again.")}finally{setProfileBusy(false)}}
  async function savePassword(event:FormEvent){event.preventDefault();setPasswordError("");setPasswordMessage("");if(passwords.next.length<6){setPasswordError("Your new password must contain at least 6 characters.");return}if(passwords.next!==passwords.confirm){setPasswordError("New passwords do not match.");return}if(passwords.current===passwords.next){setPasswordError("Choose a new password that differs from your current password.");return}setPasswordBusy(true);try{await changeUserPassword(passwords.current,passwords.next);setPasswords({current:"",next:"",confirm:""});setPasswordMessage("Password changed successfully.")}catch(error){console.error(error);const code=typeof error==="object"&&error&&"code" in error?String(error.code):"";setPasswordError(code.includes("invalid-credential")||code.includes("wrong-password")?"Your current password is incorrect.":code.includes("too-many-requests")?"Too many attempts. Please wait and try again.":"Your password could not be changed. Please try again.")}finally{setPasswordBusy(false)}}

  return <main className="app-page settings-page">
    <div className="page-heading"><div><p className="eyebrow"><i/>Account settings</p><h1>Profile & security</h1><p className="page-subtitle">Manage your identity, sign-in details and account security.</p></div></div>
    <section className="profile-hero"><div className="profile-avatar">{(user?.displayName||user?.email||"U").slice(0,1).toUpperCase()}</div><div><span>Your profile</span><h2>{user?.displayName||"Trader"}</h2><p>{user?.email}</p></div><div className="account-status"><i/>Email account</div></section>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections"><a href="#profile" className="active">Profile details</a><a href="#security">Password & security</a><span>Account</span><p>Your journal data stays linked to this Firebase account.</p></nav>
      <div className="settings-content">
        <section className="settings-section" id="profile"><div className="settings-section-heading"><div><h2>Profile details</h2><p>Update the name displayed throughout your journal.</p></div><span>01</span></div><form onSubmit={saveProfile} className="settings-form">{profileError&&<p className="alert" role="alert">{profileError}</p>}{profileMessage&&<p className="success-message" role="status">✓ {profileMessage}</p>}<div className="settings-fields"><label>Display name<input value={name} maxLength={60} autoComplete="name" onChange={event=>setName(event.target.value)}/><small>This is visible only inside your journal.</small></label><label>Email address<input value={user?.email??""} disabled/><small>Your email is managed by Firebase Authentication.</small></label></div><div className="settings-actions"><button className="button" disabled={profileBusy||name.trim()===user?.displayName}>{profileBusy?"Saving profile…":"Save profile"}</button></div></form></section>
        <section className="settings-section" id="security"><div className="settings-section-heading"><div><h2>Change password</h2><p>Confirm your current password before choosing a new one.</p></div><span>02</span></div><form onSubmit={savePassword} className="settings-form">{passwordError&&<p className="alert" role="alert">{passwordError}</p>}{passwordMessage&&<p className="success-message" role="status">✓ {passwordMessage}</p>}<label>Current password<input type="password" required autoComplete="current-password" value={passwords.current} onChange={event=>setPasswords({...passwords,current:event.target.value})}/></label><div className="settings-fields"><label>New password<input type="password" required minLength={6} autoComplete="new-password" value={passwords.next} onChange={event=>setPasswords({...passwords,next:event.target.value})}/><small>Use at least 6 characters.</small></label><label>Confirm new password<input type="password" required minLength={6} autoComplete="new-password" value={passwords.confirm} onChange={event=>setPasswords({...passwords,confirm:event.target.value})}/></label></div><div className="security-tip"><span>◆</span><p><b>Keep your account secure.</b> Use a password you do not reuse on another service.</p></div><div className="settings-actions"><button className="button" disabled={passwordBusy}>{passwordBusy?"Changing password…":"Change password"}</button></div></form></section>
      </div>
    </div>
  </main>
}
