"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./services/firebase";

export default function Lobby() {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [games, setGames] = useState<{ id: string }[]>([]);
  const router = useRouter();

  // Criar um novo jogo
  const createGame = async () => {
    if (!name) return alert("Digite seu nome!");

    localStorage.setItem("playerName", name); // Armazena o nome do jogador no localStorage

    const docRef = await addDoc(collection(db, "games"), {
      player1: name,
      player2: null,
      numbers1: [],
      numbers2: [],
      turn: name, // Define quem começa
      status: "waiting",
    });

    router.push(`/game/${docRef.id}`);
  };

  // Entrar em um jogo existente
  const joinGame = async () => {
    if (!name || !gameId) return alert("Preencha seu nome e o ID do jogo!");
    localStorage.setItem("playerName", name);

    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) return alert("Jogo não encontrado!");

    const gameData = gameSnap.data();

    // Se o jogador já estiver na partida, apenas redireciona
    if (gameData.player1 === name || gameData.player2 === name) {
      router.push(`/game/${gameId}`);
      return;
    }

    // Se o slot de player2 estiver livre, adiciona o jogador
    if (!gameData.player2) {
      await updateDoc(gameRef, { player2: name, status: "in-progress" });
      router.push(`/game/${gameId}`);
      return;
    }

    // Se já houver dois jogadores diferentes, bloqueia a entrada
    alert("O jogo já está cheio!");
  };

  // Buscar jogos disponíveis
  const fetchGames = async () => {
    const querySnapshot = await getDocs(collection(db, "games"));
    setGames(querySnapshot.docs.map((doc) => ({ id: doc.id })));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Adivinhe os Números</h1>

      <input
        className="p-2 text-blue-100 w-80 mb-2"
        placeholder="Seu nome..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        className="bg-green-500 p-2 rounded w-80 mb-2"
        onClick={createGame}
      >
        Criar Novo Jogo
      </button>

      <input
        className="p-2 text-blue-100 w-80 mb-2"
        placeholder="ID do jogo..."
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <button className="bg-blue-500 p-2 rounded w-80" onClick={joinGame}>
        Entrar no Jogo
      </button>

      <button
        className="bg-yellow-500 p-2 rounded w-80 mt-4"
        onClick={fetchGames}
      >
        Ver Jogos Disponíveis
      </button>

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
