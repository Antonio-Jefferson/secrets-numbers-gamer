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

  // Recupera o nome do jogador salvo no localStorage
  const playerName = localStorage.getItem("playerName");

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data();
        setGame(gameData);
        setLoading(false);

        // Verifica se o jogador já tem números salvos e evita que sejam sobrescritos
        if (playerName) {
          if (gameData.player1 === playerName && gameData.numbers1) {
            setSelectedNumbers(gameData.numbers1);
          } else if (gameData.player2 === playerName && gameData.numbers2) {
            setSelectedNumbers(gameData.numbers2);
          }
        }

        // Se ambos os jogadores já escolheram os números, iniciar o jogo
        if (
          gameData.numbers1?.length === 6 &&
          gameData.numbers2?.length === 6
        ) {
          router.push(`/start-game/${gameId}`);
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

    // Verifica se o jogador atual é player1 ou player2
    if (game.player1 === playerName) {
      field = "numbers1";
    } else if (game.player2 === playerName) {
      field = "numbers2";
    } else {
      return alert("Você não está neste jogo!");
    }

    // Permite que o jogador escolha novamente apenas se ainda não há vencedor
    if (game.winner === null || !game.winner) {
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
        {[...Array(9).keys()].map((num) => (
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
