import { useState, useEffect, useRef } from "react";
import "./ChatbotWidget.css";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Connection info
  const userId = "test";
  const chatId = "chat1";
  const token = "test_token";
  const WS_URL = `ws://localhost:8000/${userId}/${chatId}/${token}`;

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect WebSocket
  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen = () => console.log("✅ Chatbot connected");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 From backend:", data);

      if (data.content) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];

          // Append to last assistant message if streaming
          if (lastMsg && lastMsg.role === "assistant") {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + data.content,
            };
          } else {
            updated.push({ role: "assistant", content: data.content });
          }
          return updated;
        });
      }

      setLoading(false);
    };

    ws.current.onclose = () => console.warn("❌ Chatbot disconnected");
    return () => ws.current?.close();
  }, []);

  // Send message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    ws.current.send(JSON.stringify({ type: "input", content: input }));
    setInput("");
    setLoading(true);
  };

  return (
    <div className="chatbot-container">
      {/* Floating Toggle Button */}
      <button className="chatbot-toggle" onClick={() => setIsOpen((prev) => !prev)}>
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? "open" : "closed"}`}>
        <div className="chatbot-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="message assistant">Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chatbot-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
