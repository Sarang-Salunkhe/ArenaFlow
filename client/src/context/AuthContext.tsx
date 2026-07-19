import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  auth,
  db,
  signInWithGoogle,
  signOut,
  isFirebaseConfigured
} from '../services/firebase';


export type UserRole = 'FAN' | 'VOLUNTEER' | 'OPERATIONS';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isFirebaseEnabled: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsSpectator: (role?: UserRole) => Promise<void>;
  updateUserRole: (role: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'arenaflow_user_role';
const GUEST_SESSION_KEY = 'arenaflow_guest_user';


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const determineRole = (): UserRole => {
    return "FAN";
  };

  const getOrCreateUser = async (firebaseUser: any): Promise<UserRole> => {
    if (!db) {
      return determineRole();
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        role: "FAN",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      return "FAN";
    }

    const data = userSnap.data();

    await setDoc(
      userRef,
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    return (data.role as UserRole) || "FAN";
  };

  // Sync auth state
  useEffect(() => {
    // Handle Guest Session restoration first
    const savedGuest = localStorage.getItem(GUEST_SESSION_KEY);
    if (savedGuest) {
      try {
        const guestData = JSON.parse(savedGuest) as AuthUser;
        setUser(guestData);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(GUEST_SESSION_KEY);
      }
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Real Firebase listener
    const unsubscribe = onAuthStateChanged(
      auth, 
      async (firebaseUser) => {
        if (firebaseUser) {
          const role = await getOrCreateUser(firebaseUser);
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role,
            isAnonymous: false,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error: any) => {
        console.error('❌ [AuthContext: onAuthStateChanged error callback triggered]');
        console.error(`- Exact Firebase error code: ${error?.code || 'NO_FIREBASE_CODE'}`);
        console.error(`- Complete error object:`, error);
        console.error(`- Stack trace:\n${error?.stack || 'No stack trace available'}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const role = await getOrCreateUser(fbUser);
      
      const authUser: AuthUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        role,
        isAnonymous: false,
      };
      
      setUser(authUser);
    } catch (err) {
      console.error('Sign-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsSpectator = async (preferredRole: UserRole = 'FAN') => {
    setLoading(true);
    try {
      const guestId = 'spectator-' + Math.random().toString(36).substring(2, 9);
      const guestUser: AuthUser = {
        uid: guestId,
        displayName: 'Spectator Pass Holder',
        email: 'spectator@arenaflow.fifa.com',
        photoURL: null,
        role: preferredRole,
        isAnonymous: true,
      };

      // Persist the specific mock/guest role selected
      localStorage.setItem(`${ROLE_STORAGE_KEY}_${guestId}`, preferredRole);
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = (newRole: UserRole) => {
    if (!user) return;
    
    // Save to local persistence to simulate backend storage updates
    localStorage.setItem(`${ROLE_STORAGE_KEY}_${user.uid}`, newRole);
    
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    
    if (user.isAnonymous) {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedUser));
    }
    console.log(`🛡️ ArenaFlow Privilege Escalation: Role updated to ${newRole}`);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (user && !user.isAnonymous) {
        await signOut();
      }
      localStorage.removeItem(GUEST_SESSION_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseEnabled: isFirebaseConfigured,
        loginWithGoogle: handleLoginWithGoogle,
        loginAsSpectator: handleLoginAsSpectator,
        updateUserRole: handleUpdateUserRole,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
