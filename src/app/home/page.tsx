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
import Link from "next/link";
import Instructions from "../components/Instructions";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("read", "==", false)
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

      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
      <div className="w-full max-w-md flex justify-between space-x-1 items-center">
        <div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => setShowInstructions(true)}
          >
            Como jogar?
          </button>

          {showInstructions && (
            <div className="fixed inset-0 flex z-20 items-center justify-center bg-black bg-opacity-50">
              <div className="bg-gray-900 p-6 rounded-xl shadow-lg relative max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <button
                  className="absolute top-2 right-2 text-white text-xl"
                  onClick={() => setShowInstructions(false)}
                >
                  ✖
                </button>
                <Instructions />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-1 items-center">
          {user && (
            <div className="relative">
              <button
                className="relative p-2"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <BellIcon className="w-6 h-6 text-white" />
                {notifications.some((notif) => !notif.read) && (
                  <span className="absolute top-0 right-0 bg-red-500 text-xs px-2 py-1 rounded-full">
                    {notifications.filter((notif) => !notif.read).length}
                  </span>
                )}
              </button>

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

          {user && (
            <div className="relative">
              <button onClick={() => setShowProfileMenu((prev) => !prev)}>
                <img
                  src={
                    user.photoURL ||
                    "https://filestore.community.support.microsoft.com/api/images/6061bd47-2818-4f2b-b04a-5a9ddb6f6467?upload=true"
                  }
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
              </button>

              {/* Menu do Usuário */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 z-10">
                  <Link href="/profile">
                    <button className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded">
                      Ver Perfil
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 rounded"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <h1 className="text-3xl font-bold mt-6">🔒 JOGO DO CADEADO</h1>

      {/* Botões de Ação */}
      <div className="w-full max-w-md space-y-4 mt-6">
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

      {/* Ranking */}
      <div className="w-full max-w-lg mt-6">
        <Ranking />
      </div>
    </div>
  );
}
