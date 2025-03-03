import { useState } from "react";
import { BellIcon } from "@heroicons/react/24/solid";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  likerName?: string;
  likerPhoto?: string;
}

interface NotificationsProps {
  notifications: Notification[];
  markNotificationsAsRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  markNotificationsAsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleClose = () => {
    setShowNotifications(false);
    markNotificationsAsRead();
  };

  return (
    <div className="relative">
      <button
        className="relative p-2"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <BellIcon className="w-6 h-6 text-white" />
        {notifications.some((notif) => !notif.read) && (
          <span className="absolute top-0 right-0 bg-red-500 text-xs px-2 py-1 rounded-full">
            {notifications.filter((notif) => !notif.read).length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-10"
          tabIndex={0}
          onBlur={handleClose}
        >
          <h3 className="text-lg font-semibold">Notificações</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-400 mt-2">Nenhuma notificação.</p>
          ) : (
            <ul className="mt-2">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`p-2 border-b border-gray-700 last:border-0 text-sm ${
                    notif.read ? "text-gray-400" : "text-gray-300 font-bold"
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
  );
};

export default Notifications;
