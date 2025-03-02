"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function Game() {
  const params = useParams();
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  if (!gameId) return;

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const router = useRouter();

  const playerName = localStorage.getItem("playerName");

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data();
        setGame(gameData);
        setLoading(false);

        if (playerName) {
          if (gameData.player1 === playerName && gameData.numbers1) {
            setSelectedNumbers(gameData.numbers1);
          } else if (gameData.player2 === playerName && gameData.numbers2) {
            setSelectedNumbers(gameData.numbers2);
          }
        }
      } else {
        setLoading(false);
        alert("Jogo não encontrado!");
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [gameId, router, playerName]);

  const saveNumbers = async () => {
    if (!game) return alert("Carregando jogo...");
    if (!playerName) return alert("Seu nome não foi encontrado!");
    if (selectedNumbers.length !== 6)
      return alert("Escolha exatamente 6 números!");

    let field = "";

    if (game.player1 === playerName) {
      field = "numbers1";
    } else if (game.player2 === playerName) {
      field = "numbers2";
    } else {
      return alert("Você não está neste jogo!");
    }

    if (!game.winner) {
      try {
        await updateDoc(doc(db, "games", gameId), {
          [field]: selectedNumbers,
        });

        router.push(`/start-game/${gameId}`);
      } catch (error) {
        console.error("Erro ao salvar números:", error);
        alert("Erro ao salvar números. Tente novamente.");
      }
    } else {
      alert("Este jogo já foi finalizado!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Jogo {gameId}</h1>
      <h2 className="text-xl mb-2">Escolha seus números ({playerName})</h2>

      <div className="grid grid-cols-5 gap-2">
        {[...Array(10).keys()].map((num) => {
          const count = selectedNumbers.filter((n) => n === num).length;
          return (
            <button
              key={num}
              className={`relative p-2 border rounded w-12 h-12 text-lg font-bold ${
                count > 0 ? "bg-green-500" : "bg-gray-700"
              }`}
              onClick={() => {
                if (selectedNumbers.length >= 6) return;
                setSelectedNumbers((prev) => [...prev, num]);
              }}
            >
              {num}
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="bg-blue-500 p-2 rounded mt-4 w-40 text-lg font-semibold disabled:opacity-50"
        onClick={saveNumbers}
        disabled={selectedNumbers.length !== 6}
      >
        Confirmar
      </button>
    </div>
  );
}
