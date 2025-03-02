"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function CreateGame() {
  const [name, setName] = useState("");
  const router = useRouter();

  const createGame = async () => {
    if (!name) return alert("Digite seu nome!");

    localStorage.setItem("playerName", name);

    const userRef = doc(db, "users", name); // Criando referência ao usuário
    await setDoc(userRef, { wins: 0 }, { merge: true }); // Criando usuário caso não exista

    // Criar o jogo na coleção 'games'
    const docRef = await addDoc(collection(db, "games"), {
      player1: name,
      player2: null,
      numbers1: [],
      numbers2: [],
      turn: name,
      status: "waiting",
    });

    router.push(`/game/${docRef.id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Novo Jogo</h1>

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
        Criar Jogo
      </button>
    </div>
  );
}
