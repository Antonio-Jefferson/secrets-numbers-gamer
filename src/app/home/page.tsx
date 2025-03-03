"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  updateDoc,
  doc,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "../services/firebase";
import Ranking from "../components/Ranking";
import { BellIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const router = useRouter();
  const [ranking, setRanking] = useState<{ name: string; wins: number }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      const playersRef = collection(db, "players");
      const q = query(playersRef, orderBy("wins", "desc"));
      const querySnapshot = await getDocs(q);

      const players = querySnapshot.docs.map((doc) => ({
        name: doc.id,
        wins: doc.data().wins || 0,
      }));

      setRanking(players);
    };

    fetchRanking();
  }, []);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("read", "==", false) // Apenas notificações não lidas
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const notifs = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          if (data.likeUserId) {
            const userRef = collection(db, "users");
            const userQuery = query(
              userRef,
              where("uid", "==", data.likeUserId),
              limit(1)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              console.log({ userData });
              return {
                id: doc.id,
                ...data,
                likerName: userData.displayName?.split(" ")[0] || "Usuário",
                likerPhoto:
                  userData.profile_image || "https://via.placeholder.com/40",
              };
            }
          }
          return { id: doc.id, ...data };
        })
      );

      console.log({ notifs });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      if (prev) {
        markNotificationsAsRead(); // Só marca como lida ao fechar
      }
      return !prev;
    });
  };

  const markNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));

    notifications.forEach(async (notif) => {
      if (!notif.read) {
        const notifRef = doc(db, "notifications", notif.id);
        await updateDoc(notifRef, { read: true });
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
      {/* Header com Notificações */}
      <div className="w-full max-w-md flex justify-end">
        {user && (
          <div className="relative">
            <button className="relative p-2" onClick={toggleNotifications}>
              <BellIcon className="w-6 h-6 text-white" />
              {notifications.some((notif) => !notif.read) && (
                <span className="absolute top-0 right-0 bg-red-500 text-xs px-2 py-1 rounded-full">
                  {notifications.filter((notif) => !notif.read).length}
                </span>
              )}
            </button>

            {/* Modal de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-10">
                <h3 className="text-lg font-semibold">Notificações</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-400 mt-2">Nenhuma notificação.</p>
                ) : (
                  <ul className="mt-2">
                    {notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className={`p-2 border-b border-gray-700 last:border-0 text-sm ${
                          notif.read
                            ? "text-gray-400"
                            : "text-gray-300 font-bold"
                        }`}
                      >
                        {notif.likerPhoto && (
                          <img
                            src={notif.likerPhoto}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full inline-block mr-2"
                          />
                        )}
                        <span>
                          {notif.likerName}: {notif.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Perfil do Usuário */}
      {user && (
        <div className="flex flex-col items-center mb-6">
          <img
            src={
              user.photoURL ||
              "https://filestore.community.support.microsoft.com/api/images/6061bd47-2818-4f2b-b04a-5a9ddb6f6467?upload=true"
            }
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-white"
          />
          <p className="mt-2 text-lg font-semibold">
            {user.displayName || "Jogador"}
          </p>
          <button
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">🔒 JOGO DO CADEADO</h1>

      <div className="w-full max-w-md space-y-4">
        <button
          className="bg-green-500 text-white text-xl font-semibold p-4 rounded w-full cursor-pointer"
          onClick={() => router.push("/create-game")}
        >
          Criar Novo Jogo
        </button>
        <button
          className="bg-blue-500 text-white text-xl font-semibold p-4 rounded w-full cursor-pointer"
          onClick={() => router.push("/join-game")}
        >
          Entrar em uma Partida
        </button>
        <button
          className="bg-purple-500 text-white text-xl font-semibold p-4 rounded w-full cursor-pointer"
          onClick={() => router.push("/forum")}
        >
          Ir para o Fórum
        </button>
      </div>

      <div className="w-full max-w-lg mt-6">
        <Ranking />
      </div>
    </div>
  );
}
