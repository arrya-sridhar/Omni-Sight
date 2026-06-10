import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, AlertTriangle, Shield } from "lucide-react";

export default function VideoPlayer({ videoUrl, tracks = [], speedThreshold = 100 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [alerts, setAlerts] = useState([]);

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Compile unique alerts for objects exceeding the speed threshold
  useEffect(() => {
    const activeAlerts = tracks.filter(t => t.peak_velocity > speedThreshold);
    setAlerts(activeAlerts);
  }, [tracks, speedThreshold]);

  // Update canvas bounds and redraw bounding boxes when time updates
  const drawOverlays = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas display sizes to actual video rendering sizes
    canvas.width = video.videoWidth || video.clientWidth || 640;
    canvas.height = video.videoHeight || video.clientHeight || 360;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = video.currentTime;

    // Draw active bounding boxes for the current playback time
    tracks.forEach((track) => {
      // Find the trajectory point closest to current time (within 0.3s)
      const closestPoint = track.trajectory?.reduce((prev, curr) => {
        return Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time) ? curr : prev;
      }, track.trajectory[0]);

      if (closestPoint && Math.abs(closestPoint.timestamp - time) < 0.3) {
        const [x, y, w, h] = closestPoint.bbox;
        const velocity = closestPoint.velocity;
        const isSpeeding = velocity > speedThreshold;

        // Bounding box styling
        ctx.strokeStyle = isSpeeding ? "#ef4444" : "#4f46e5"; // Red if speeding, Indigo if safe
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Label box styling
        ctx.fillStyle = isSpeeding ? "rgba(239, 68, 68, 0.85)" : "rgba(79, 70, 229, 0.85)";
        ctx.font = "bold 12px sans-serif";
        const labelText = `ID: ${track.track_id} | ${track.label} (${Math.round(velocity)} px/s)`;
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillRect(x - 1, y - 20, textWidth + 10, 20);
        
        ctx.fillStyle = "#ffffff";
        ctx.fillText(labelText, x + 4, y - 6);

        // Optional alert icon indicator drawn above box if speeding
        if (isSpeeding) {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(x + textWidth + 20, y - 10, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        drawOverlays();
      };
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        drawOverlays();
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [tracks, speedThreshold]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-slate-950 flex items-center justify-center">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
              onClick={togglePlay}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </>
        ) : (
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <FilmIcon className="animate-pulse" size={40} />
            <span className="text-sm">No active video stream. Ingest a video to start.</span>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!videoUrl}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-colors"
          >
            {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
          </button>
          
          <div className="text-sm text-gray-400 font-mono">
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </div>
        </div>

        {/* Speed warnings summary */}
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold animate-bounce">
            <AlertTriangle size={14} />
            <span>Speed Alerts: {alerts.length} objects flagged</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FilmIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" />
      <path d="M17 3v18" />
      <path d="M3 7.5h4" />
      <path d="M3 12h4" />
      <path d="M3 16.5h4" />
      <path d="M17 7.5h4" />
      <path d="M17 12h4" />
      <path d="M17 16.5h4" />
    </svg>
  );
}
