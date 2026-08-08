"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/services/journal";
import type { UserProfile } from "@/types";

type ProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setError("");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      setProfile(await getProfile(user.uid));
    } catch (caught) {
      setProfile(null);
      setError(caught instanceof Error ? caught.message : "Could not load your profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  return createElement(ProfileContext.Provider, { value: { profile, loading, error, refresh } }, children);
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}
