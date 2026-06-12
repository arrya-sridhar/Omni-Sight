import React, { useState } from "react";
import { Shield, Eye, Database, Info, RefreshCw, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import SearchBar from "./components/SearchBar";
import Gallery from "./components/Gallery";
import Analytics from "./pages/Analytics";
import VideoUpload from "./components/VideoUpload";
import AIAssistant from "./components/AIAssistant";
import { API_BASE_URL } from "./config";

export default function App() {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("search");

  const isCloud = !API_BASE_URL.includes("localhost") && !API_BASE_URL.includes("127.0.0.1");

  const handleSearch = async ({ query, threshold, limit }) => {
    setIsLoading(true);
    setError("");
    try {
      let response;
      
      if (isCloud) {
        // CLOUD FAST PATH: Compute text embedding in the browser
        const { getTextEmbedding } = await import("./utils/embeddings.js");
        const embedding = await getTextEmbedding(query);
        
        response = await fetch(`${API_BASE_URL}/api/search/vector`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embedding,
            video_ids: [],
            threshold,
            limit,
          }),
        });
      } else {
        // LOCAL FULL PATH: Send text to backend for PyTorch embedding
        response = await fetch(`${API_BASE_URL}/api/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            video_ids: [],
            threshold,
            limit,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to communicate with OmniSight API server.");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-700/5 blur-[120px] pointer-events-none z-0"></div>
      
      {/* Header bar */}
      <header className="relative z-10 w-full border-b border-white/5 bg-slate-950/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <Eye className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t("app_title")}
              </h1>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                {t("app_subtitle")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full px-2 py-1 mr-2">
              <Globe size={14} className="text-gray-400 mr-2" />
              <select 
                className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-1 rounded-full shadow-inner shadow-emerald-500/5">
              <Shield size={12} />
              Local Privacy Secured
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-800 text-slate-400 font-semibold px-2.5 py-1 rounded-full">
              <Database size={12} />
              SQLite DB Active
            </span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        {/* Navigation tabs */}
        <div className="flex border-b border-slate-800 mb-8 max-w-sm">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              activeTab === "search"
                ? "border-indigo-500 text-white"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            Zero-Shot Search
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all ${
              activeTab === "tracking"
                ? "border-indigo-500 text-white"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            Velocity Tracking
          </button>
        </div>

        {activeTab === "search" ? (
          <div>
            {/* Introductory context */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Zero-Shot Natural Language Search
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Query keyframe visual representation indexes using natural language text queries locally. Underpinned by a self-contained multi-modal vector space model.
              </p>
            </div>

            {/* Video Ingest section */}
            <div className="mb-12">
              <VideoUpload onUploadComplete={() => {}} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="max-w-4xl mx-auto mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                <Info size={16} className="flex-shrink-0" />
                <div className="flex-grow">{error}</div>
                <button 
                  onClick={() => setError("")} 
                  className="hover:bg-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Search Bar */}
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            {/* Gallery */}
            <Gallery results={results} />
          </div>
        ) : (
          <Analytics />
        )}
        
        {/* Floating AI Assistant */}
        <AIAssistant />
      </main>

      {/* Footer bar */}
      <footer className="relative z-10 w-full border-t border-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© 2026 {t("app_title")}. All processing done locally.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">System Logs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
