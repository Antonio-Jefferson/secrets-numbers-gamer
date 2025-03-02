"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function GamePlay() {
  const params = useParams();
  const router = useRouter();
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  if (!gameId) return null;

  const [game, setGame] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribeGame = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame(snapshot.data());
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user);
        setCurrentUser(user);
      } else {
        router.push("/login");
      }
    });

    return () => {
      unsubscribeGame();
      unsubscribeAuth();
    };
  }, [gameId, router]);

  const resetGame = async () => {
    if (!gameId || !game) return;

    if (game.winner === null) {
      router.push(`/game/${gameId}`);
      return;
    }

    const nextTurn =
      game.currentTurn === game.player1.uid
        ? game.player2.uid
        : game.player1.uid;

    await updateDoc(doc(db, "games", gameId), {
      winner: null,
      revealed1: [],
      revealed2: [],
      numbers1: null,
      numbers2: null,
      currentTurn: nextTurn,
    });

    setFeedback("Jogo reiniciado! Redirecionando...");
    setTimeout(() => {
      router.push(`/game/${gameId}`);
    }, 1000);
  };

  const handleGuess = async () => {
    console.log("Guess", guess);
    if (
      !guess ||
      !game ||
      !currentUser ||
      game.currentTurn.uid !== currentUser.uid
    )
      return;

    console.log("Guess", guess);
    const isPlayer1 = currentUser.uid === game.player1.uid;
    const opponentNumbers = isPlayer1 ? game.numbers2 : game.numbers1;
    const revealed = isPlayer1
      ? [...(game.revealed2 || [])]
      : [...(game.revealed1 || [])];

    const indexToGuess = revealed.length;
    if (indexToGuess >= opponentNumbers.length) return;

    if (parseInt(guess) === opponentNumbers[indexToGuess]) {
      revealed.push(parseInt(guess));
      setFeedback("✅ Acertou! Continue jogando.");

      await updateDoc(doc(db, "games", gameId), {
        [isPlayer1 ? "revealed2" : "revealed1"]: revealed,
      });

      if (revealed.length === opponentNumbers.length) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          wins: (game.scores?.[currentUser.uid] || 0) + 1,
        });
        await updateDoc(doc(db, "games", gameId), {
          winner: currentUser.uid,
          [`scores.${currentUser.uid}`]:
            (game.scores?.[currentUser.uid] || 0) + 1,
        });
        setFeedback(`🏆 ${currentUser.displayName || "Você"} venceu o jogo!`);
      }
    } else {
      setFeedback(
        `❌ Errou! O número correto é ${
          parseInt(guess) < opponentNumbers[indexToGuess] ? "maior" : "menor"
        } que ${guess}.`
      );

      await updateDoc(doc(db, "games", gameId), {
        currentTurn: isPlayer1 ? game.player2 : game.player1,
      });
    }

    setGuess("");
  };

  const handleLogout = () => {
    router.push("/home");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 Gameplay</h1>
      {game && currentUser ? (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-bold">🏆 Placar</h2>
            <p className="text-lg">
              {game.player1.name.split(" ")[0]}:{" "}
              {game.scores?.[game.player1.uid] || 0} vitórias
            </p>
            <p className="text-lg">
              {game.player2.name.split(" ")[0]}:{" "}
              {game.scores?.[game.player2.uid] || 0} vitórias
            </p>
          </div>
          <p className="text-yellow-400 mb-4">
            <strong>Vez de:</strong>{" "}
            {game.currentTurn === game.player1.uid
              ? game.player1.name.split(" ")[0]
              : game.player2.name.split(" ")[0]}
          </p>

          {game.winner ? (
            <p className="text-green-400 text-xl font-bold mt-4">
              🏆{" "}
              {game.winner === game.player1.uid
                ? game.player1.name.split(" ")[0]
                : game.player2.name.split(" ")[0]}{" "}
              venceu o jogo!
            </p>
          ) : (
            <>
              <p className="text-lg mb-2">
                <strong>Seus números:</strong>{" "}
                {currentUser.uid === game.player1.uid
                  ? game.numbers1?.join(", ")
                  : game.numbers2?.join(", ")}
              </p>
              <p className="text-lg mb-4">
                <strong>Números do adversário:</strong>{" "}
                {currentUser.uid === game.player1.uid
                  ? game.revealed2?.length > 0
                    ? game.revealed2.join(" ")
                    : "🔒 🔒 🔒 🔒 🔒 🔒"
                  : game.revealed1?.length > 0
                  ? game.revealed1.join(" ")
                  : "🔒 🔒 🔒 🔒 🔒 🔒"}
              </p>
              <p className="text-lg mb-4">
                <strong>Acertos do adversário:</strong>{" "}
                {currentUser.uid === game.player1.uid
                  ? game.revealed1?.length > 0
                    ? game.revealed1.join(", ")
                    : "Nenhum acerto ainda"
                  : game.revealed2?.length > 0
                  ? game.revealed2.join(", ")
                  : "Nenhum acerto ainda"}
              </p>
              {game.currentTurn.uid === currentUser.uid && (
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

          {(game.winner || !game.numbers1 || !game.numbers2) && (
            <div className="space-x-4">
              <button
                className="bg-red-500 p-2 mt-4 rounded w-40 text-lg font-semibold"
                onClick={resetGame}
              >
                🔄 Reiniciar
              </button>

              <button
                className="bg-red-500 p-2 mt-4 rounded w-40 text-lg font-semibold"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400">Carregando jogo...</p>
      )}
    </div>
  );
}
