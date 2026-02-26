import { APP_STORAGE_PREFIX } from "@/lib/brand";

export const PROFILE_STORAGE_KEY = `${APP_STORAGE_PREFIX}-profile`;

export interface UserProfile {
  fullName: string;
  dateOfBirth: string;
  lunarDateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  gender?: string;
}

export function getStoredProfile(): UserProfile | null {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserProfile;
  } catch (error) {
    console.error("Failed to parse stored profile:", error);
    return null;
  }
}

export function setStoredProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
