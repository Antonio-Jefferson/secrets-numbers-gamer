"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "../services/firebase";
import Ranking from "../components/Ranking";

export default function Home() {
  const router = useRouter();
  const [ranking, setRanking] = useState<{ name: string; wins: number }[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Observar mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      const playersRef = collection(db, "players");
      const q = query(playersRef, orderBy("wins", "desc"));
      const querySnapshot = await getDocs(q);

      const players = querySnapshot.docs.map((doc) => ({
        name: doc.id,
        wins: doc.data().wins || 0,
      }));

      setRanking(players);
    };

    fetchRanking();
  }, []);
  console.log(user);
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
      {/* Perfil do Usuário */}
      {user && (
        <div className="flex flex-col items-center mb-6">
          <img
            src={
              user.photoURL ||
              "https://filestore.community.support.microsoft.com/api/images/6061bd47-2818-4f2b-b04a-5a9ddb6f6467?upload=true"
            }
            onError={(e) =>
              (e.currentTarget.src =
                "https://filestore.community.support.microsoft.com/api/images/6061bd47-2818-4f2b-b04a-5a9ddb6f6467?upload=true")
            }
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-white"
          />
          <p className="mt-2 text-lg font-semibold">
            {user.displayName || "Jogador"}
          </p>
          <button
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">🔒 JOGO DO CADEADO</h1>

      <div className="w-full max-w-md space-y-4">
        <button
          className="bg-green-500 text-white text-xl font-semibold p-4 rounded w-full cursor-pointer"
          onClick={() => router.push("/create-game")}
        >
          Criar Novo Jogo
        </button>

        <button
          className="bg-blue-500 text-white text-xl font-semibold p-4 rounded w-full cursor-pointer"
          onClick={() => router.push("/join-game")}
        >
          Entrar em uma Partida
        </button>
      </div>

      <div className="w-full max-w-lg mt-6">
        <Ranking />
      </div>
    </div>
  );
}
