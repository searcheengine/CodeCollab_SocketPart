import { useEffect, useState } from "react";
import io from "socket.io-client";
import ChatWindow from "../components/ChatWindow";

let socket;

// Function to get a persistent user ID from sessionStorage
function getOrCreateUserId() {
  // Use sessionStorage which is unique per tab
  let id = sessionStorage.getItem("userId");
  if (!id) {
    id = Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("userId", id);
  }
  return id;
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState(null);

  // 1. First, set the user ID from localStorage on component mount.
  useEffect(() => {
    const userId = getOrCreateUserId();
    setMyId(userId);
  }, []);

  // 2. Second, initialize the socket connection ONLY AFTER myId is set.
  useEffect(() => {
    // Do nothing if we don't have an ID yet.
    if (!myId) return;

    // Connect to the server
    socket = io({ path: "/api/socket" });

    socket.on("connect", () => {
      console.log(`Connected with ID: ${myId}`);
    });

    // Listen for new messages
    socket.on("message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup on component unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, [myId]); // This effect runs only when `myId` changes (i.e., once it's set)

  const sendMessage = (text) => {
    // Ensure we have an ID, text, and a connected socket
    if (!myId || !text.trim() || !socket) return;

    const messageData = {
      text,
      senderId: myId, // Use the guaranteed ID from state
      timestamp: new Date().toISOString(),
    };
    socket.emit("message", messageData);
  };

  return (
    <div className="container">
      <ChatWindow messages={messages} onSend={sendMessage} myId={myId} />
      <style jsx global>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111;
        }
      `}</style>
    </div>
  );
}
