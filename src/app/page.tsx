"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { auth, provider, db } from "./services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("playerId", currentUser.uid);
        await checkUserInFirestore(currentUser);
        router.push("/home");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkUserInFirestore = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "Jogador",
        email: user.email,
        wins: 0,
      });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithPopup(auth, provider);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">🔒 JOGO DO CADEADO</h1>
      <h2 className="text-2xl font-bold mb-6">Faça login</h2>
      {loading ? (
        <button
          className="flex items-center justify-center bg-white text-gray-900 font-semibold p-3 rounded-lg w-80 shadow-lg hover:bg-gray-200 transition"
          disabled
        >
          <FcGoogle className="text-2xl mr-3" />
          Carregando...
        </button>
      ) : (
        <button
          className="flex items-center justify-center bg-white text-gray-900 font-semibold p-3 rounded-lg w-80 shadow-lg hover:bg-gray-200 transition"
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="text-2xl mr-3" />
          Entrar com Google
        </button>
      )}
    </div>
  );
}
