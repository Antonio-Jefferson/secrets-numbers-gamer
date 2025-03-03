"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function CreateGamePage() {
  const [gameName, setGameName] = useState("");
  const [user, setUser] = useState<{ uid: string; name: string } | null>(null);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Buscar dados do usuário no Firestore
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({
            uid: authUser.uid,
            name: userSnap.data().name || "Jogador",
          });
        }
      } else {
        router.push("/login"); // Redireciona para login se não estiver autenticado
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const createGame = async () => {
    if (!gameName) return alert("Digite o nome da partida!");
    if (!user) return alert("Você precisa estar logado.");

    const docRef = await addDoc(collection(db, "games"), {
      name: gameName,
      player1: { uid: user.uid, name: user.name }, // Salvando nome e UID do jogador
      player2: null,
      status: "waiting",
    });

    router.push(`/game/${docRef.id}`);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Novo Jogo</h1>

      <input
        className="p-2 text-blue-100 bg-gray-700 rounded w-80 mb-2"
        placeholder="Nome da Partida (ex: X1 )"
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
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
