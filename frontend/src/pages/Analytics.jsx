import React, { useState, useEffect } from "react";
import { Gauge, AlertCircle, Eye, RefreshCw, Layers } from "lucide-react";
import VideoPlayer from "../components/VideoPlayer";
import { API_BASE_URL } from "../config";

export default function Analytics() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [speedThreshold, setSpeedThreshold] = useState(150);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load videos on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos`);
      const data = await res.json();
      setVideos(data || []);
      if (data && data.length > 0 && !selectedVideo) {
        handleSelectVideo(data[0]);
      }
    } catch (err) {
      console.error("Failed to load videos list", err);
    }
  };

  const handleSelectVideo = async (video) => {
    setSelectedVideo(video);
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos/${video.id}/tracks`);
      const data = await res.json();
      setTracks(data || []);
    } catch (err) {
      setError("Failed to fetch object tracking data for this video.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
      {/* Left Column: Video Player & Controls */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Layers className="text-indigo-400" size={24} />
              Spatial Velocity Tracking
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Tracks bounding boxes, calculates speeds in pixels/second, and reports speeding events.
            </p>
          </div>

          {/* Threshold Adjuster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Alert Threshold</span>
              <span className="text-sm font-mono text-rose-400 font-bold">{speedThreshold} px/s</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={speedThreshold}
              onChange={(e) => setSpeedThreshold(parseInt(e.target.value))}
              className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Video Player */}
        <VideoPlayer
          videoUrl={selectedVideo ? `${API_BASE_URL}/api/videos/${selectedVideo.id}/source` : ""}
          tracks={tracks}
          speedThreshold={speedThreshold}
        />
      </div>

      {/* Right Column: Ingested Video Selector & Track Details */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        {/* Ingested Videos list */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
            <span>Ingested Videos</span>
            <button onClick={fetchVideos} className="text-indigo-400 hover:text-white transition-colors">
              <RefreshCw size={14} />
            </button>
          </h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {videos.length === 0 ? (
              <span className="text-gray-500 text-sm">No videos ingested yet.</span>
            ) : (
              videos.map((vid) => (
                <button
                  key={vid.id}
                  onClick={() => handleSelectVideo(vid)}
                  className={`w-full text-left p-3 rounded-xl border text-sm font-semibold flex justify-between items-center transition-all ${
                    selectedVideo?.id === vid.id
                      ? "bg-indigo-600/10 border-indigo-500/80 text-white"
                      : "bg-slate-950/40 border-slate-900 text-gray-400 hover:text-white hover:border-slate-800"
                  }`}
                >
                  <span className="truncate pr-2">{vid.filename}</span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-gray-400 flex-shrink-0 font-mono">
                    {vid.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Object log list */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md flex-grow flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Object Tracking Log ({tracks.length})
          </h3>

          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
            </div>
          ) : error ? (
            <div className="flex-grow text-center text-xs text-rose-400 py-6">{error}</div>
          ) : tracks.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 py-10">
              <Gauge size={32} className="mb-2 text-slate-700" />
              <span className="text-sm">No tracked objects found.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
              {tracks.map((track) => {
                const isSpeeding = track.peak_velocity > speedThreshold;
                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                      isSpeeding
                        ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                        : "bg-slate-950/30 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">
                        ID #{track.track_id} - {track.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Active: {track.start_timestamp.toFixed(1)}s - {track.end_timestamp.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold font-mono text-white">
                          {Math.round(track.peak_velocity)} px/s
                        </span>
                        <span className="text-[9px] text-gray-500 font-semibold">Peak Speed</span>
                      </div>
                      
                      {isSpeeding && (
                        <AlertCircle className="text-rose-500 animate-pulse flex-shrink-0" size={16} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
