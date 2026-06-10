import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../config";

export default function VideoUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, uploading, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(10);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/videos/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video to server.");
      }

      const data = await response.json();
      setVideoId(data.id);
      setStatus("processing");
      setProgress(50);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "An error occurred during upload.");
    }
  };

  // Poll video status in background when in 'processing' state
  useEffect(() => {
    if (status !== "processing" || !videoId) return;

    let pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/videos/${videoId}`);
        if (!res.ok) return;

        const data = await res.json();
        
        if (data.status === "completed") {
          setStatus("completed");
          setProgress(100);
          clearInterval(pollInterval);
          if (onUploadComplete) onUploadComplete(data);
        } else if (data.status === "failed") {
          setStatus("error");
          setErrorMessage("Video analytics model execution failed.");
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Status polling error", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [status, videoId]);

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-2">Ingest New Video Stream</h3>
      <p className="text-xs text-gray-400 mb-6">
        Upload a surveillance, dashboard, or traffic video feed. The local AI model extracts frames and calculates velocities completely locally.
      </p>

      {/* File Dropzone */}
      {status === "idle" && (
        <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative group bg-slate-950/20">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="mx-auto text-gray-500 group-hover:text-indigo-400 transition-colors mb-3" size={36} />
          {file ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white truncate px-4">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-300 font-medium">Drag and drop video file, or click to browse</span>
              <span className="text-xs text-gray-500">Supports MP4, MKV, AVI, etc.</span>
            </div>
          )}
        </div>
      )}

      {/* Upload & Progress Indicators */}
      {status !== "idle" && (
        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm font-semibold">
            {status === "uploading" && (
              <span className="text-indigo-400 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
                Uploading video payload...
              </span>
            )}
            {status === "processing" && (
              <span className="text-amber-400 flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Extracting keyframes & tracking objects...
              </span>
            )}
            {status === "completed" && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} />
                Ingestion Completed
              </span>
            )}
            {status === "error" && (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={16} />
                Ingestion Failed
              </span>
            )}
            <span className="text-xs font-mono text-gray-500">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status === "error"
                  ? "bg-rose-500"
                  : status === "completed"
                  ? "bg-emerald-500"
                  : "bg-indigo-500 animate-pulse"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {status === "error" && (
            <p className="text-xs text-rose-400/90 leading-relaxed bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              {errorMessage}
            </p>
          )}

          {status === "completed" && (
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-xs font-semibold text-indigo-400 hover:text-white hover:underline self-start"
            >
              Upload another video
            </button>
          )}
        </div>
      )}

      {/* Action triggers */}
      {status === "idle" && file && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setFile(null)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-102"
          >
            Start Ingestion
          </button>
        </div>
      )}
    </div>
  );
}
