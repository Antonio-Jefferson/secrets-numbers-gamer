"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function Game() {
  const params = useParams();
  const gameId = params.id;
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const router = useRouter();

  console.log("Game ID recebido:", gameId);

  useEffect(() => {
    if (!gameId) {
      console.log("Nenhum gameId encontrado!");
      return;
    }

    console.log("Buscando jogo no Firestore...");
    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        console.log("Snapshot recebido:", snapshot.exists());
        if (snapshot.exists()) {
          console.log("Dados do jogo:", snapshot.data());
          setGame(snapshot.data());
          setLoading(false);
        } else {
          console.log("Jogo não encontrado.");
          setLoading(false);
          alert("Jogo não encontrado!");
          router.push("/");
        }
      },
      (error) => {
        console.error("Erro ao buscar jogo:", error);
        setLoading(false);
        alert("Erro ao carregar jogo.");
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  const saveNumbers = async () => {
    if (!game) return alert("Carregando jogo...");
    if (selectedNumbers.length !== 6)
      return alert("Escolha exatamente 6 números!");

    const isPlayer1Turn = !game.numbers1?.length;
    const field = isPlayer1Turn ? "numbers1" : "numbers2";

    if (game[field]?.length > 0) {
      return alert("Você já escolheu seus números!");
    }

    try {
      await updateDoc(doc(db, "games", gameId), {
        [field]: selectedNumbers,
      });

      // Aguarda a atualização no Firestore antes de redirecionar
      const unsubscribe = onSnapshot(doc(db, "games", gameId), (snapshot) => {
        const updatedGame = snapshot.data();
        if (updatedGame && updatedGame[field]?.length > 0) {
          unsubscribe(); // Para evitar chamadas desnecessárias
          router.push(`/start-game/${gameId}`);
        }
      });
    } catch (error) {
      console.error("Erro ao salvar números:", error);
      alert("Erro ao salvar números. Tente novamente.");
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
      <h2 className="text-xl mb-2">
        Escolha seus números (
        {!game?.numbers1?.length ? "Jogador 1" : "Jogador 2"})
      </h2>

      <div className="grid grid-cols-5 gap-2">
        {[...Array(20).keys()].map((num) => (
          <button
            key={num}
            className={`p-2 border rounded w-12 h-12 text-lg font-bold ${
              selectedNumbers.includes(num) ? "bg-green-500" : "bg-gray-700"
            }`}
            onClick={() => {
              if (selectedNumbers.length >= 6 && !selectedNumbers.includes(num))
                return;

              setSelectedNumbers((prev) =>
                prev.includes(num)
                  ? prev.filter((n) => n !== num)
                  : [...prev, num]
              );
            }}
          >
            {num}
          </button>
        ))}
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
