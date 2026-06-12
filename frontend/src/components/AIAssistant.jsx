import React, { useState } from "react";
import { MessageSquare, Send, Bot, Server, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";

export default function AIAssistant() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [useOnline, setUseOnline] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      if (!useOnline) {
        // Direct Local Ollama Fetch
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3",
            prompt: `You are OmniSight AI Video Assistant. User asks: ${userMessage.text}`,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error("Local Ollama service unavailable. Is it running with OLLAMA_ORIGINS=\"*\"?");
        }

        const data = await response.json();
        setMessages((prev) => [...prev, { role: "ai", text: data.response }]);
      } else {
        // Online BYOK Backend Fetch
        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: userMessage.text,
            use_online: useOnline,
            api_key: apiKey
          })
        });

        if (!response.ok) {
          throw new Error("Online AI service unavailable.");
        }

        const data = await response.json();
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "error", text: err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl hover:scale-110 transition-transform z-50 flex items-center gap-2"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="text-indigo-400" size={20} />
              <h3 className="font-bold text-white">{t("ai_assistant")}</h3>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded flex items-center gap-1 ${useOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"}`}>
                <Server size={12} />
                {useOnline ? t("online") : "Local"}
              </span>
            </div>
          </div>

          {/* Settings / BYOK Toggle */}
          <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t("use_local_ai")}</span>
              <button 
                onClick={() => setUseOnline(false)}
                className={`px-3 py-1 rounded-full ${!useOnline ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-400'}`}
              >
                Ollama
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t("use_online_ai")}</span>
              <button 
                onClick={() => setUseOnline(true)}
                className={`px-3 py-1 rounded-full ${useOnline ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-400'}`}
              >
                BYOK
              </button>
            </div>
            {useOnline && (
              <input
                type="password"
                placeholder={t("api_key_placeholder")}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 text-sm my-auto">
                {t("ask_ai_placeholder")}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-sm" 
                    : m.role === "error"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-tl-sm"
                    : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-sm text-sm flex gap-2 items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("ask_ai_placeholder")}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !query.trim()}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
