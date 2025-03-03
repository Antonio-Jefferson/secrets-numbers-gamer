"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { auth } from "../services/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; photoURL: string } | null>(
    null
  );
  const [games, setGames] = useState<any[]>([]);
  const [wins, setWins] = useState<number | null>(null);
  const [losses, setLosses] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser({
        name: currentUser.displayName || "Usuário",
        photoURL: currentUser.photoURL || "",
      });
      await fetchUserStats(currentUser.uid);
      await fetchGames(currentUser.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserStats = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setWins(data.wins || 0);
        setLosses(data.losses || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas do usuário:", error);
    }
  };

  const fetchGames = async (userUid: string) => {
    try {
      const gamesRef = collection(db, "games");
      const q1 = query(gamesRef, where("player1.uid", "==", userUid));
      const snapshot1 = await getDocs(q1);
      const q2 = query(gamesRef, where("player2.uid", "==", userUid));
      const snapshot2 = await getDocs(q2);
      let allGames: any[] = [];
      snapshot1.forEach((doc) => allGames.push({ id: doc.id, ...doc.data() }));
      snapshot2.forEach((doc) => allGames.push({ id: doc.id, ...doc.data() }));
      setGames(allGames);
    } catch (error) {
      console.error("Erro ao buscar jogos do usuário:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="flex flex-col items-center gap-4 mb-4">
        {loading ? (
          <div className="w-36 h-36 rounded-full bg-gray-700 animate-pulse" />
        ) : (
          user?.photoURL && (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-36 h-36 rounded-full border-2 border-gray-500"
            />
          )
        )}
        <h1 className="text-2xl font-bold">
          {loading ? (
            <div className="w-32 h-6 bg-gray-700 animate-pulse" />
          ) : (
            user?.name.split(" ")[1]
          )}
        </h1>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold">🏆 Estatísticas</h2>
        <p className="text-green-400">
          Vitórias:{" "}
          {wins === null ? (
            <span className="bg-gray-700 w-16 h-4 block animate-pulse" />
          ) : (
            wins
          )}
        </p>
        <p className="text-red-400">
          Derrotas:{" "}
          {losses === null ? (
            <span className="bg-gray-700 w-16 h-4 block animate-pulse" />
          ) : (
            losses
          )}
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-lg mt-4">
        <h2 className="text-xl font-bold">🎮 Todos os Jogos</h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-10 bg-gray-700 animate-pulse rounded"
              />
            ))}
          </div>
        ) : games.length > 0 ? (
          <ul>
            {games.map((game) => (
              <li
                key={game.id}
                className="p-2 border-b border-gray-600 flex justify-between items-center"
              >
                <div>
                  <p>
                    <span className="font-semibold">Nome:</span>{" "}
                    {game.name || "Desconhecido"}
                  </p>
                </div>
                <button
                  className="bg-blue-500 px-3 py-1 rounded text-sm font-semibold"
                  onClick={() => router.push(`/game/${game.id}`)}
                >
                  Entrar no jogo
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Nenhum jogo encontrado.</p>
        )}
      </div>

      <button
        className="bg-blue-500 p-2 mt-4 rounded text-lg font-semibold"
        onClick={() => router.push("/")}
      >
        Voltar
      </button>
    </div>
  );
}
