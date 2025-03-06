"use client";
import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
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
  const [feedback, setFeedback] = useState<ReactNode>("");

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
    if (
      !guess ||
      !game ||
      !currentUser ||
      game.currentTurn.uid !== currentUser.uid
    )
      return;

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
        const opponentRef = doc(
          db,
          "users",
          isPlayer1 ? game.player2.uid : game.player1.uid
        );

        // Buscar os dados atuais antes de atualizar
        const userSnap = await getDoc(userRef);
        const opponentSnap = await getDoc(opponentRef);

        const userWins = userSnap.exists() ? userSnap.data().wins || 0 : 0;
        const opponentLosses = opponentSnap.exists()
          ? opponentSnap.data().losses || 0
          : 0;

        // Atualizar vitórias e derrotas corretamente
        await updateDoc(userRef, {
          wins: userWins + 1,
        });

        await updateDoc(opponentRef, {
          losses: opponentLosses + 1,
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
        <>
          ❌ Errou! O número correto é{" "}
          <strong style={{ color: "red" }}>
            {parseInt(guess) < opponentNumbers[indexToGuess]
              ? "MAIOR"
              : "MENOR"}
          </strong>{" "}
          que {guess}.
        </>
      );

      await updateDoc(doc(db, "games", gameId), {
        currentTurn: isPlayer1 ? game.player2 : game.player1,
      });
    }

    setGuess("");
  };

  const endGame = async () => {
    if (!gameId || !game) return;

    try {
      await deleteDoc(doc(db, "games", gameId));

      setFeedback("Partida finalizada. Redirecionando...");
      await Promise.all([
        router.push("/home"), // Pode ser a página de espera, home ou onde for necessário
      ]);
    } catch (error) {
      console.error("Erro ao finalizar a partida:", error);
      setFeedback("Ocorreu um erro ao finalizar a partida. Tente novamente.");
    }
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
            {game.currentTurn.uid === game.player1.uid
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
                <div className="flex flex-col items-center justify-center">
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
                className="bg-green-800 p-2 mt-4 rounded w-40 text-lg font-semibold"
                onClick={resetGame}
              >
                Revanche
              </button>

              <button
                className="bg-red-500 p-2 mt-4 rounded w-40 text-lg font-semibold"
                onClick={endGame}
              >
                Finalizar partida
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
