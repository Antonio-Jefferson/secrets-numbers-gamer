"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Adicione useRouter
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function GamePlay() {
  const params = useParams();
  const router = useRouter(); // Para redirecionar
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  if (!gameId) return null; // Retorna null se não houver gameId
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

  const resetGame = async () => {
    if (!gameId || !game) return;

    if (game.winner === null) {
      // Apenas redireciona se o jogo já estiver sem vencedor
      router.push(`/game/${gameId}`);
      return;
    }

    // Define quem será o próximo a jogar
    const nextTurn =
      game.currentTurn === game.player1 ? game.player2 : game.player1;

    // Reseta o jogo no Firestore e alterna quem começa
    await updateDoc(doc(db, "games", gameId), {
      winner: null, // Remove o vencedor
      revealed1: [], // Zera os números revelados
      revealed2: [],
      numbers1: null, // Remove os números do Jogador 1
      numbers2: null, // Remove os números do Jogador 2
      currentTurn: nextTurn, // Alterna quem joga primeiro
    });

    setFeedback(
      "Jogo reiniciado! Redirecionando para escolher novos números..."
    );

    // Pequeno atraso para mostrar o feedback antes do redirecionamento
    setTimeout(() => {
      router.push(`/game/${gameId}`);
    }, 1000);
  };

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

      if (revealed.length === opponentNumbers.length) {
        await updateDoc(doc(db, "games", gameId), {
          winner: currentUser,
          [`scores.${currentUser}`]: (game.scores?.[currentUser] || 0) + 1, // Incrementa a pontuação
        });
        setFeedback(`🏆 ${currentUser} venceu o jogo!`);
      }
    } else {
      setFeedback(
        `❌ Errou! O número correto é ${
          parseInt(guess) < opponentNumbers[indexToGuess] ? "maior" : "menor"
        } que ${guess}.`
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
      <div className="mb-4">
        <h2 className="text-xl font-bold">🏆 Placar</h2>
        <p className="text-lg">
          {game?.player1}: {game?.scores?.[game.player1] || 0} vitórias
        </p>
        <p className="text-lg">
          {game?.player2}: {game?.scores?.[game.player2] || 0} vitórias
        </p>
      </div>
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
              ? game?.revealed2 && game.revealed2.length > 0
                ? game.revealed2
                    .map((n: number | undefined) =>
                      n !== undefined ? n : "🔒"
                    )
                    .join(" ")
                : "🔒 🔒 🔒 🔒 🔒 🔒"
              : game?.revealed1 && game.revealed1.length > 0
              ? game.revealed1
                  .map((n: number | undefined) => (n !== undefined ? n : "🔒"))
                  .join(" ")
              : "🔒 🔒 🔒 🔒 🔒 🔒"}
          </p>
          <p className="text-lg mb-4">
            <strong>Acertos do adversário:</strong>{" "}
            {currentUser === game?.player1
              ? game?.revealed1 && game.revealed1.length > 0
                ? game.revealed1.join(", ")
                : "Nenhum acerto ainda"
              : game?.revealed2 && game.revealed2.length > 0
              ? game.revealed2.join(", ")
              : "Nenhum acerto ainda"}
          </p>
          {game?.currentTurn === currentUser && (
            <div className="flex flex-col items-center">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="text-blue-100 p-3 text-lg w-32 border-2 border-blue-500 bg-gray-800 focus:outline-none focus:border-blue-400"
              />
              <button
                className="bg-green-500 p-2 mt-2 rounded w-40 text-lg font-semibold"
                onClick={handleGuess}
              >
                Enviar Palpite
              </button>
            </div>
          )}

          <p className="mt-4 text-lg">{feedback}</p>
        </>
      )}

      {(game?.winner || !game?.numbers1 || !game?.numbers2) && (
        <button
          className="bg-red-500 p-2 mt-4 rounded w-40 text-lg font-semibold"
          onClick={resetGame}
        >
          🔄 Reiniciar Jogo
        </button>
      )}
    </div>
  );
}
