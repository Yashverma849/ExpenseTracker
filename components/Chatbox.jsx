import React, { useState } from "react";
import { Card, CardHeader, TextField, Button, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { supabase } from "@/lib/supabaseClient";

const Chatbox = ({ onExpenseAdded, setRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setInput("");

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user) {
        console.error("User not authenticated", authError?.message);
        return;
      }

      const user = userData.user;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, user_id: user.id }), // Include user_id
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.success ? "✅ Expense Added Successfully!" : "⚠️ Error saving expense." },
      ]);

      if (data.success && onExpenseAdded) {
        onExpenseAdded();
        if (typeof setRefresh === "function") {
          setRefresh((prev) => !prev);
        }
      }
    } catch (error) {
      console.error("Chat Error:", error.message);
      setMessages((prev) => [...prev, { role: "ai", content: `⚠️ Oops! Something went wrong. ${error.message}` }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="contained"
        color="primary"
        sx={{ borderRadius: "50%", p: 2, boxShadow: 3 }}
      >
        💬
      </Button>

      {isOpen && (
        <Card
          sx={{
            width: 400,
            height: 600,
            position: "fixed",
            bottom: 80,
            right: 20,
            zIndex: 50,
            borderRadius: 3,
            boxShadow: 5,
            animation: "fadeIn 0.3s",
          }}
        >
          <CardHeader
            title="💬 AI Chat Assistant"
            sx={{ backgroundColor: "#1976d2", color: "white", textAlign: "center", fontWeight: "bold" }}
            action={
              <IconButton onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            }
          />
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              borderRadius: "8px",
              background: "#f5f5f5",
              maxHeight: "450px",
              animation: "fadeIn 0.3s",
            }}
          >
            {messages.map((msg, idx) => (
              <Typography
                key={idx}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: "75%",
                  fontSize: "14px",
                  display: "inline-block",
                  wordBreak: "break-word",
                  backgroundColor: msg.role === "user" ? "#1976d2" : "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                  color: msg.role === "user" ? "white" : "black",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  textAlign: msg.role === "user" ? "right" : "left",
                  marginBottom: "8px",
                  animation: "fadeIn 0.3s",
                }}
              >
                {msg.content}
              </Typography>
            ))}

            {/* Subscription Message */}
            {!isSubscribed && messages.filter((msg) => msg.role === "user").length >= 5 && (
              <div style={{ textAlign: "center", padding: "10px", background: "#ffeb3b", borderRadius: "8px" }}>
                <Typography sx={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                  🚀 Unlock Unlimited Access!
                </Typography>
                <Typography sx={{ fontSize: "14px", marginBottom: "10px" }}>
                  Subscribe to continue chatting with AI.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setIsSubscribed(true)}
                  sx={{ borderRadius: "20px", fontWeight: "bold" }}
                >
                  {isSubscribed ? "✅ Subscribed" : "Subscribe Now"}
                </Button>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              background: "#fff",
              borderTop: "1px solid #ddd",
            }}
          >
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  background: "white",
                  "& fieldset": { border: "none" },
                },
              }}
              disabled={!isSubscribed && messages.filter((msg) => msg.role === "user").length >= 5}
            />
            <Button
              onClick={() => sendMessage(input)}
              variant="contained"
              color="primary"
              sx={{
                borderRadius: "50%",
                minWidth: "48px",
                height: "48px",
                boxShadow: 3,
              }}
              disabled={!isSubscribed && messages.filter((msg) => msg.role === "user").length >= 5}
            >
              <SendIcon />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Chatbox;