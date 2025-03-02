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
} from "firebase/firestore";
import { db } from "../services/firebase";

export default function JoinGame() {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [games, setGames] = useState<{ id: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const querySnapshot = await getDocs(collection(db, "games"));
    setGames(querySnapshot.docs.map((doc) => ({ id: doc.id })));
  };

  const joinGame = async () => {
    if (!name || !gameId) return alert("Preencha seu nome e o ID do jogo!");
    localStorage.setItem("playerName", name);
    const userRef = doc(db, "users", name); // Criando referência ao usuário
    await setDoc(userRef, { wins: 0 }, { merge: true }); // Criando usuário caso não exista

    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) return alert("Jogo não encontrado!");

    const gameData = gameSnap.data();

    if (gameData.player1 === name || gameData.player2 === name) {
      router.push(`/game/${gameId}`);
      return;
    }

    if (!gameData.player2) {
      await updateDoc(gameRef, { player2: name, status: "in-progress" });
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
        placeholder="Seu nome..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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
