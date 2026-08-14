import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { setUser, setFirebaseUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setFirebaseUser, setLoading]);

  const signOutUser = async () => {
    await signOut(auth);
    logout();
  };

  return { signOutUser };
}
