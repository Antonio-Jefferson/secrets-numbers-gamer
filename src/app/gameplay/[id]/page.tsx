"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function GamePlay() {
  const params = useParams();
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  if (!gameId) return;
  const [game, setGame] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame(snapshot.data());
      }
    });

    const storedUser = localStorage.getItem("playerName");
    setCurrentUser(storedUser || "");

    return () => unsubscribe();
  }, [gameId]);

  const handleGuess = async () => {
    if (!guess || !game || game.currentTurn !== currentUser) return;

    const opponentNumbers =
      currentUser === game.player1 ? game.numbers2 : game.numbers1;
    const revealed =
      currentUser === game.player1
        ? [...(game.revealed2 || [])]
        : [...(game.revealed1 || [])];

    const indexToGuess = revealed.length;
    if (indexToGuess >= opponentNumbers.length) return;

    if (parseInt(guess) === opponentNumbers[indexToGuess]) {
      revealed.push(parseInt(guess));
      setFeedback("✅ Acertou! Continue jogando.");

      await updateDoc(doc(db, "games", gameId), {
        [currentUser === game.player1 ? "revealed2" : "revealed1"]: revealed,
      });

      // Verifica se o jogador acertou todos os números
      if (revealed.length === opponentNumbers.length) {
        await updateDoc(doc(db, "games", gameId), {
          winner: currentUser,
        });
        setFeedback(`🏆 ${currentUser} venceu o jogo!`);
      }
    } else {
      setFeedback(
        `❌ Errou! O número correto é ${
          parseInt(guess) < opponentNumbers[indexToGuess] ? "maior" : "menor"
        }.`
      );

      await updateDoc(doc(db, "games", gameId), {
        currentTurn:
          game.currentTurn === game.player1 ? game.player2 : game.player1,
      });
    }

    setGuess("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 Gameplay</h1>
      <p className="text-lg mb-2">
        <strong>Jogador 1:</strong> {game?.player1}
      </p>
      <p className="text-lg mb-2">
        <strong>Jogador 2:</strong> {game?.player2}
      </p>
      <p className="text-yellow-400 mb-4">
        <strong>Vez de:</strong> {game?.currentTurn}
      </p>

      {game?.winner ? (
        <p className="text-green-400 text-xl font-bold mt-4">
          🏆 {game.winner} venceu o jogo!
        </p>
      ) : (
        <>
          <p className="text-lg mb-2">
            <strong>Seus números:</strong>{" "}
            {currentUser === game?.player1
              ? game?.numbers1?.join(", ")
              : game?.numbers2?.join(", ")}
          </p>
          <p className="text-lg mb-4">
            <strong>Números do adversário:</strong>{" "}
            {currentUser === game?.player1
              ? game?.revealed2 && game?.revealed2.length > 0
                ? game.revealed2
                    .map((n: number | undefined, i: number) =>
                      n !== undefined ? n : "🔒"
                    )
                    .join(" ")
                : "🔒 🔒 🔒 🔒 🔒 🔒"
              : game?.revealed1 && game?.revealed1.length > 0
              ? game.revealed1
                  .map((n: number | undefined, i: number) =>
                    n !== undefined ? n : "🔒"
                  )
                  .join(" ")
              : "🔒 🔒 🔒 🔒 🔒 🔒"}
          </p>

          {game?.currentTurn === currentUser && (
            <div className="flex flex-col items-center">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="text-black p-2 rounded mb-2"
              />
              <button
                className="bg-green-500 p-2 rounded w-40 text-lg font-semibold"
                onClick={handleGuess}
              >
                Enviar Palpite
              </button>
            </div>
          )}

          <p className="mt-4 text-lg">{feedback}</p>
        </>
      )}
    </div>
  );
}
