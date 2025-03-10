"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../services/firebase";

export default function StartGame() {
  const auth = getAuth();
  const params = useParams();
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  if (!gameId) return;

  const [game, setGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    name: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  useEffect(() => {
    // Pegando o usuário autenticado pelo Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || "Jogador",
        });
      } else {
        setCurrentUser(null);
        router.push("/login"); // Redireciona para login se não estiver autenticado
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    if (game?.numbers1?.length && game?.numbers2?.length) {
      startGame();
    }
  }, [game]);

  const startGame = async () => {
    if (!game?.numbers1?.length || !game?.numbers2?.length) return;

    setIsLoading(true);

    try {
      await updateDoc(doc(db, "games", gameId), {
        currentTurn: game.player1, // Jogador 1 começa
      });

      router.push(`/gameplay/${gameId}`);
    } catch (error) {
      console.error("Erro ao iniciar o jogo:", error);
      alert("Erro ao iniciar o jogo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verificando se o jogador atual é player1 ou player2
  const isPlayer1 =
    currentUser?.name.toLowerCase() === game?.player1?.name.toLowerCase();
  const isPlayer2 =
    currentUser?.name.toLowerCase() === game?.player2?.name.toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Jogo ID: {gameId}</h1>

      <div className="text-lg mb-4">
        <p>
          <strong>Jogador 1:</strong>{" "}
          {currentUser?.name.split(" ")[0] || "Aguardando..."}
        </p>
        <p>
          <strong>Jogador 2:</strong> {isPlayer2 || "Aguardando jogador..."}
        </p>
      </div>

      <div className="text-lg mb-4">
        <p>
          <strong>Seus Números:</strong>{" "}
          {isPlayer1
            ? game?.numbers1?.join(", ") || "Aguardando..."
            : isPlayer2
            ? game?.numbers2?.join(", ") || "Aguardando..."
            : "Aguardando..."}
        </p>
        <p>
          <strong>Números do adversário:</strong>{" "}
          {isPlayer1
            ? game?.numbers2?.length
              ? "Escolhidos (ocultos)"
              : "Aguardando..."
            : isPlayer2
            ? game?.numbers1?.length
              ? "Escolhidos (ocultos)"
              : "Aguardando..."
            : "Aguardando..."}
        </p>
      </div>

      {!game?.numbers1?.length || !game?.numbers2?.length ? (
        <p className="text-yellow-400">
          Aguardando o jogador escolher os números...
        </p>
      ) : (
        <button
          className="bg-green-500 p-2 rounded mt-4 w-40 text-lg font-semibold disabled:opacity-50"
          onClick={startGame}
          disabled={isLoading}
        >
          {isLoading ? "Iniciando..." : "Iniciar Jogo"}
        </button>
      )}
    </div>
  );
}
