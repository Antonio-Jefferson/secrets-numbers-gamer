"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import Ranking from "../components/Ranking";

export default function Home() {
  const router = useRouter();
  const [ranking, setRanking] = useState<{ name: string; wins: number }[]>([]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
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
