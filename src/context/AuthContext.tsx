import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Roles } from '@/constants/roles';
import { AccountStatus } from '@/constants/accountStatus';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const checkUserAdminStatus = useCallback(async (firebaseUser: User): Promise<{ hasAdminAccess: boolean; hasSuperAdminAccess: boolean }> => {
    try {
      // 1. Check Custom Claims first (using cached token by default for fast resolution)
      const tokenResult = await firebaseUser.getIdTokenResult();
      const claims = tokenResult.claims;
      
      let hasAdminClaim = !!claims.admin;
      let hasSuperAdminClaim = !!claims.superadmin;

      // 2. Check Firestore user profile for accountStatus
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.accountStatus === AccountStatus.DISABLED || userData.accountStatus === AccountStatus.AUTH_DELETED) {
          return { hasAdminAccess: false, hasSuperAdminAccess: false };
        }
      }

      // 3. Backward compatibility check against admins/{uid} collection
      const adminDocRef = doc(db, 'admins', firebaseUser.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        hasAdminClaim = true;
        if (adminData.role === Roles.SUPERADMIN) {
          hasSuperAdminClaim = true;
        }
      }

      return {
        hasAdminAccess: hasAdminClaim,
        hasSuperAdminAccess: hasSuperAdminClaim
      };
    } catch (error) {
      console.error("Error checking user admin status:", error);
      return { hasAdminAccess: false, hasSuperAdminAccess: false };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const { hasAdminAccess, hasSuperAdminAccess } = await checkUserAdminStatus(firebaseUser);

          if (hasAdminAccess) {
            setUser(firebaseUser);
            setIsAdmin(true);
            setIsSuperAdmin(hasSuperAdminAccess);
          } else {
            await firebaseSignOut(auth);
            setUser(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
            navigateRef.current('/unauthorized');
          }
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [checkUserAdminStatus]);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const { hasAdminAccess, hasSuperAdminAccess } = await checkUserAdminStatus(firebaseUser);

      if (hasAdminAccess) {
        setUser(firebaseUser);
        setIsAdmin(true);
        setIsSuperAdmin(hasSuperAdminAccess);
        setLoading(false);
        navigateRef.current('/dashboard');
      } else {
        await firebaseSignOut(auth);
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        navigateRef.current('/unauthorized');
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      navigateRef.current('/login');
    } catch (error) {
      console.error("Signout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSuperAdmin, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
