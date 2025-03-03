"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Ranking() {
  const [players, setPlayers] = useState<{ name: string; wins: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const rankingData = usersSnapshot.docs.map((userDoc) => {
          const userData = userDoc.data();
          console.log(userData);
          return {
            name: userData.name ? userData.name.split(" ")[0] : "Desconhecido",
            wins: userData.wins || 0, // Pega a quantidade de vitórias
          };
        });

        rankingData.sort((a, b) => b.wins - a.wins);
        setPlayers(rankingData);
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setLoading(false);
      }
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
