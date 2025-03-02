"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Ranking() {
  const [players, setPlayers] = useState<{ name: string; wins: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("wins", "desc"));
      const snapshot = await getDocs(q);

      const rankingData = snapshot.docs.map((doc) => ({
        name: doc.data().name || doc.id, // Usa doc.id caso o campo "name" não exista
        wins: doc.data().wins || 0,
      }));

      setPlayers(rankingData);
      setLoading(false);
    };

    fetchRanking();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 w-full">
      <h1 className="text-2xl font-bold mb-4 text-center">
        🏆 Ranking de Jogadores
      </h1>

      {loading ? (
        <p className="text-center text-gray-400">Carregando ranking...</p>
      ) : players.length === 0 ? (
        <p className="text-center text-gray-400">
          Nenhum jogador no ranking ainda. Jogue uma partida para aparecer aqui!
        </p>
      ) : (
        <ul className="w-full max-w-2xl text-lg space-y-2">
          {players.map((player, index) => (
            <li
              key={index}
              className="bg-gray-800 p-2 rounded flex justify-between items-center text-center md:text-left"
            >
              <span className="flex-1">
                {index + 1}. {player.name}
              </span>
              <span className="flex-1">{player.wins} vitórias</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
