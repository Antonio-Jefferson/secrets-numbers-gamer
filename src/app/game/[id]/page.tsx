"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Game() {
  const auth = getAuth();
  const router = useRouter();
  const params = useParams();
  const gameId: string | undefined = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  if (!gameId) return;

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [alreadyChosen, setAlreadyChosen] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
      } else {
        alert("Você precisa estar logado!");
        router.push("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [auth, router]);

  useEffect(() => {
    if (!gameId || !userUid) return;

    const gameRef = doc(db, "games", gameId);

    const unsubscribeGame = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.data();
        setGame(gameData);
        setLoading(false);

        let numbers = [];
        if (gameData.player1 === userUid && gameData.numbers1) {
          numbers = gameData.numbers1;
        } else if (gameData.player2 === userUid && gameData.numbers2) {
          numbers = gameData.numbers2;
        }
        setSelectedNumbers(numbers);
        setAlreadyChosen(numbers.length === 5); // Bloqueia edição após confirmar
      } else {
        setLoading(false);
        alert("Jogo não encontrado!");
        router.push("/");
      }
    });

    return () => unsubscribeGame();
  }, [gameId, router, userUid]);

  const handleNumberClick = (num: number) => {
    if (alreadyChosen) return alert("Você já confirmou seus números!");
    if (selectedNumbers.length >= 5)
      return alert("Você só pode escolher 5 números!");

    setSelectedNumbers((prev) => [...prev, num]); // Permite números repetidos
  };

  const saveNumbers = async () => {
    if (!game) return alert("Carregando jogo...");
    if (!userUid) return alert("Usuário não autenticado!");
    if (selectedNumbers.length !== 5)
      return alert("Escolha exatamente 5 números!");

    let field = "";
    console.log(userUid);

    if (game.player1.uid === userUid) {
      field = "numbers1";
    } else if (game.player2.uid === userUid) {
      field = "numbers2";
    } else {
      return alert("Você não está neste jogo!");
    }

    if (!game.winner) {
      try {
        await updateDoc(doc(db, "games", gameId), {
          [field]: selectedNumbers,
        });

        setAlreadyChosen(true); // Impede alterações depois de salvar
        router.push(`/start-game/${gameId}`);
      } catch (error) {
        console.error("Erro ao salvar números:", error);
        alert("Erro ao salvar números. Tente novamente.");
      }
    } else {
      alert("Este jogo já foi finalizado!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🎲 Jogo {gameId}</h1>
      <h2 className="text-xl mb-2">Escolha seus números</h2>

      <div className="grid grid-cols-5 gap-2">
        {[...Array(10).keys()].map((num) => {
          const count = selectedNumbers.filter((n) => n === num).length;
          return (
            <button
              key={num}
              className={`relative p-2 border rounded w-12 h-12 text-lg font-bold ${
                count > 0 ? "bg-green-500" : "bg-gray-700"
              }`}
              onClick={() => handleNumberClick(num)}
              disabled={alreadyChosen}
            >
              {num}
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="bg-blue-500 p-2 rounded mt-4 w-40 text-lg font-semibold disabled:opacity-50"
        onClick={saveNumbers}
        disabled={selectedNumbers.length !== 5 || alreadyChosen}
      >
        Confirmar
      </button>
    </div>
  );
}
