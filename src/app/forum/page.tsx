"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  where,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  photoURL: string;
  timestamp: any;
  replyingTo?: {
    id: string;
    text: string;
    userName: string;
    userId: string;
  } | null;
  likes: number;
}

interface Notification {
  userId: string;
  profile_image: string;
  type: "reply" | "mention";
  message: string;
  timestamp: any;
  read: boolean;
}

export default function Forum() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message))
      );
    });
    setLoading(false);
    return () => unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      const newMessage: Omit<Message, "id"> = {
        text: message,
        userId: user.uid,
        userName: user.displayName || "User",
        photoURL: user.photoURL || "/default-avatar.png",
        timestamp: serverTimestamp(),
        replyingTo: replyingTo
          ? {
              id: replyingTo.id,
              text: replyingTo.text,
              userName: replyingTo.userName,
              userId: replyingTo.userId,
            }
          : null,
        likes: 0,
      };

      const docRef = await addDoc(collection(db, "messages"), newMessage);

      if (replyingTo && replyingTo.userId !== user.uid) {
        const notification: Notification = {
          userId: replyingTo.userId,
          profile_image: replyingTo.photoURL,
          type: "reply",
          message: `${user.displayName} respondeu sua mensagem.`,
          timestamp: serverTimestamp(),
          read: false,
        };
        await addDoc(collection(db, "notifications"), notification);
      }

      const mentions = message.match(/@(\w+)/g);
      if (mentions) {
        const mentionedUsernames = mentions.map((mention) =>
          mention.substring(1)
        );
        const usersQuery = query(
          collection(db, "users"),
          where("username", "in", mentionedUsernames)
        );
        const usersSnapshot = await getDocs(usersQuery);

        usersSnapshot.forEach(async (userDoc) => {
          if (userDoc.exists() && userDoc.id !== user.uid) {
            const mentionNotification: Notification = {
              userId: userDoc.id,
              profile_image: replyingTo?.photoURL || "",
              type: "mention",
              message: `${user.displayName} mencionou você em uma mensagem.`,
              timestamp: serverTimestamp(),
              read: false,
            };
            await addDoc(collection(db, "notifications"), mentionNotification);
          }
        });
      }

      setMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const likeMessage = async (msgId: string, currentLikes: number) => {
    try {
      const messageRef = doc(db, "messages", msgId);
      await updateDoc(messageRef, { likes: currentLikes + 1 });
    } catch (error) {
      console.error("Erro ao curtir mensagem:", error);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!user) return;

    try {
      const messageRef = doc(db, "messages", msgId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">💬 Fórum de Discussão</h1>

      {user ? (
        <div className="w-full max-w-md">
          {replyingTo && (
            <div className="bg-gray-800 p-2 mb-2 rounded-lg text-sm">
              <p>
                Respondendo a:{" "}
                <span className="text-blue-400">{replyingTo.userName}</span>
              </p>
              <p className="text-gray-400">{replyingTo.text}</p>
              <button
                className="text-red-400 text-xs"
                onClick={() => setReplyingTo(null)}
              >
                Cancelar
              </button>
            </div>
          )}
          <form
            onSubmit={sendMessage}
            className="flex w-full space-x-2 relative"
          >
            <input
              type="text"
              className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="bg-blue-500 px-4 py-2 rounded">
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Faça login para participar do fórum.
        </p>
      )}

      <div className="w-full max-w-md mt-6 space-y-4">
        {loading ? (
          <div className="w-full max-w-md space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg flex items-start space-x-3 bg-gray-800 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="w-full h-3 bg-gray-700 rounded mb-1"></div>
                  <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-lg flex items-start space-x-3 bg-gray-800"
              >
                <img
                  src={msg.photoURL}
                  className="w-10 h-10 rounded-full border-2 border-white"
                  alt="Avatar"
                />
                <div>
                  <p className="text-sm font-semibold">{msg.userName}</p>
                  {msg.replyingTo && (
                    <div className="text-xs bg-gray-700 p-1 rounded">
                      <p className="text-blue-400">
                        {msg.replyingTo.userName}:
                      </p>
                      <p className="text-gray-300">{msg.replyingTo.text}</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-300">{msg.text}</p>
                  <div className="flex space-x-2 mt-1">
                    <button
                      className="text-blue-400 text-xs  cursor-pointer"
                      onClick={() => setReplyingTo(msg)}
                    >
                      Responder
                    </button>
                    <button
                      className="text-green-400 text-xs  cursor-pointer"
                      onClick={() => likeMessage(msg.id, msg.likes)}
                    >
                      👍 {msg.likes}
                    </button>
                    {msg.userId === user?.uid && (
                      <button
                        className="text-red-400 text-xs cursor-pointer"
                        onClick={() => deleteMessage(msg.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
