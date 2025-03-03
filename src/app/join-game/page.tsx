"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function JoinGame() {
  const [gameId, setGameId] = useState("");
  const [games, setGames] = useState<{ id: string }[]>([]);
  const [user, setUser] = useState<{ uid: string; name: string } | null>(null);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({
            uid: authUser.uid,
            name: userSnap.data().name || "Jogador",
          });
          fetchGames();
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchGames = async () => {
    const querySnapshot = await getDocs(
      query(collection(db, "games"), where("status", "==", "waiting"))
    );
    setGames(querySnapshot.docs.map((doc) => ({ id: doc.id })));
  };

  const joinGame = async () => {
    if (!user || !gameId)
      return alert("Você precisa estar logado e informar o ID do jogo!");

    // 🔎 Verificar se o usuário já está em um jogo ativo
    const activeGamesQuery = query(
      collection(db, "games"),
      where("status", "in", ["waiting", "in-progress"]),
      where("player1", "==", user.uid) // Verifica se é player1
    );

    const activeGamesSnapshot = await getDocs(activeGamesQuery);

    if (!activeGamesSnapshot.empty) {
      return alert(
        "Você já está em um jogo ativo. Termine antes de entrar em outro."
      );
    }

    // 📌 Se passou na verificação, tentar entrar no jogo
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) return alert("Jogo não encontrado!");

    const gameData = gameSnap.data();

    // Se já estiver no jogo, apenas redireciona
    if (
      gameData.player1?.uid === user.uid ||
      gameData.player2?.uid === user.uid
    ) {
      router.push(`/game/${gameId}`);
      return;
    }

    // Se ainda houver vaga, entra no jogo
    if (!gameData.player2) {
      await updateDoc(gameRef, {
        player2: { uid: user.uid, name: user.name },
        status: "in-progress",
      });
      router.push(`/game/${gameId}`);
      return;
    }

    alert("O jogo já está cheio!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Entrar em uma Partida</h1>

      <input
        className="p-2 text-blue-100 w-80 mb-2"
        placeholder="ID do jogo..."
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />

      <button className="bg-blue-500 p-2 rounded w-80" onClick={joinGame}>
        Entrar no Jogo
      </button>

      <h2 className="text-xl font-bold mt-6">Jogos Disponíveis</h2>
      <ul className="mt-4">
        {games.map((game) => (
          <li key={game.id} className="mt-2 bg-gray-700 p-2 rounded">
            ID: {game.id}{" "}
            <button
              className="bg-blue-500 p-1 ml-2 rounded"
              onClick={() => setGameId(game.id)}
            >
              Copiar ID
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
