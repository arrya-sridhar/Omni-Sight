import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../config";

export default function VideoUpload({ onUploadComplete }) {
  const { t } = useTranslation();
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

  // Detect if we're running against a cloud backend or localhost
  const isCloud = !API_BASE_URL.includes("localhost") && !API_BASE_URL.includes("127.0.0.1");

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(5);
    setErrorMessage("");

    try {
      if (isCloud) {
        // ========== CLOUD FAST PATH ==========
        // Extract keyframes in the browser, upload only tiny JPEGs

        // Step 1: Extract keyframes client-side
        const { extractKeyframes } = await import("../utils/clientExtractor.js");
        
        const { keyframes, keyframeTimestamps, metadata } = await extractKeyframes(
          file,
          (p) => setProgress(5 + Math.floor(p * 0.4)) // 5% → 45% during extraction
        );

        if (keyframes.length === 0) {
          throw new Error("No keyframes could be extracted from this video.");
        }

        setProgress(50);

        // Step 2: Upload keyframes to server
        const formData = new FormData();
        formData.append("filename", file.name);
        formData.append("duration", metadata.duration);
        formData.append("width", metadata.width);
        formData.append("height", metadata.height);
        formData.append("timestamps", JSON.stringify(keyframeTimestamps));
        
        keyframes.forEach((blob, i) => {
          formData.append("files", blob, `keyframe_${i}.jpg`);
        });

        const res = await fetch(`${API_BASE_URL}/api/videos/upload/keyframes`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload keyframes to server.");
        const data = await res.json();

        setVideoId(data.id);
        setStatus("processing");
        setProgress(60);

      } else {
        // ========== LOCAL FULL PATH ==========
        // Upload full video for YOLO tracking + CLIP embedding

        // 1. Initialize Upload
        const initRes = await fetch(`${API_BASE_URL}/api/videos/upload/init`, {
          method: "POST"
        });
        if (!initRes.ok) throw new Error("Failed to initialize upload.");
        const { upload_id } = await initRes.json();

        // 2. Upload Chunks in parallel (4MB chunks, 3 concurrent streams)
        const chunkSize = 4 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const concurrency = 3;
        let completedChunks = 0;

        const uploadChunk = async (i) => {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const chunkData = new FormData();
          chunkData.append("upload_id", upload_id);
          chunkData.append("chunk_index", i);
          chunkData.append("file", chunk, file.name);

          const chunkRes = await fetch(`${API_BASE_URL}/api/videos/upload/chunk`, {
            method: "POST",
            body: chunkData,
          });

          if (!chunkRes.ok) throw new Error(`Failed to upload chunk ${i+1}/${totalChunks}`);
          completedChunks++;
          setProgress(5 + Math.floor((completedChunks / totalChunks) * 40));
        };

        for (let i = 0; i < totalChunks; i += concurrency) {
          const batch = [];
          for (let j = i; j < Math.min(i + concurrency, totalChunks); j++) {
            batch.push(uploadChunk(j));
          }
          await Promise.all(batch);
        }

        // 3. Finalize Upload
        const finalizeData = new FormData();
        finalizeData.append("upload_id", upload_id);
        finalizeData.append("filename", file.name);
        
        const finalizeRes = await fetch(`${API_BASE_URL}/api/videos/upload/finalize`, {
          method: "POST",
          body: finalizeData,
        });
        
        if (!finalizeRes.ok) throw new Error("Failed to finalize upload.");
        const data = await finalizeRes.json();
        
        setVideoId(data.id);
        setStatus("processing");
        setProgress(50);
      }
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
          setErrorMessage(data.error_message || "Video analytics model execution failed.");
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
      <h3 className="text-lg font-bold text-white mb-2">{t("ingest_new")}</h3>
      <p className="text-xs text-gray-400 mb-6">
        {t("ingest_desc")}
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
              <span className="text-sm text-gray-300 font-medium">{t("drag_drop")}</span>
              <span className="text-xs text-gray-500">{t("supports")}</span>
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
                {t("uploading")}
              </span>
            )}
            {status === "processing" && (
              <span className="text-amber-400 flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                {t("extracting")}
              </span>
            )}
            {status === "completed" && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} />
                {t("ingestion_completed")}
              </span>
            )}
            {status === "error" && (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={16} />
                {t("ingestion_failed")}
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
              {t("upload_another")}
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
            {t("cancel")}
          </button>
          <button
            onClick={handleUpload}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-102"
          >
            {t("start_ingestion")}
          </button>
        </div>
      )}
    </div>
  );
}
