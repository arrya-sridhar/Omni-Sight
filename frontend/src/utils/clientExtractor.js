/**
 * Client-side Keyframe Extractor
 * Extracts keyframes directly in the browser using Canvas API.
 * Detects scene changes by comparing pixel differences between frames.
 */

/**
 * Extract keyframes from a video file in the browser.
 * @param {File} videoFile - The video file to process
 * @param {Function} onProgress - Callback (progress: 0-100)
 * @param {Object} options - Configuration options
 * @returns {Promise<{keyframes: Blob[], metadata: Object}>}
 */
export async function extractKeyframes(videoFile, onProgress = () => {}, options = {}) {
  const {
    sampleInterval = 1.0,    // Sample one frame per second
    diffThreshold = 0.08,    // Pixel difference threshold for scene change (0-1)
    maxKeyframes = 30,       // Cap keyframes to keep upload small
    jpegQuality = 0.85,      // JPEG quality for exported keyframes
    thumbnailWidth = 640,    // Resize frames to this width for processing
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video file in browser."));
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not determine video duration."));
        return;
      }

      // Set canvas size (scale down for speed)
      const scale = Math.min(1, thumbnailWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const metadata = {
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        filename: videoFile.name,
      };

      const timestamps = [];
      for (let t = 0; t < duration; t += sampleInterval) {
        timestamps.push(t);
      }

      const keyframes = [];
      const keyframeTimestamps = [];
      let prevImageData = null;
      let currentIndex = 0;

      // Always include the first frame
      let isFirstFrame = true;

      const processNextFrame = () => {
        if (currentIndex >= timestamps.length || keyframes.length >= maxKeyframes) {
          URL.revokeObjectURL(url);
          onProgress(100);
          resolve({ keyframes, keyframeTimestamps, metadata });
          return;
        }

        const t = timestamps[currentIndex];
        video.currentTime = t;
      };

      video.onseeked = async () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let isKeyframe = false;

        if (isFirstFrame) {
          isKeyframe = true;
          isFirstFrame = false;
        } else if (prevImageData) {
          const diff = computeFrameDiff(prevImageData.data, currentImageData.data);
          if (diff > diffThreshold) {
            isKeyframe = true;
          }
        }

        if (isKeyframe) {
          const exportCanvas = document.createElement("canvas");
          exportCanvas.width = video.videoWidth;
          exportCanvas.height = video.videoHeight;
          const exportCtx = exportCanvas.getContext("2d");
          exportCtx.drawImage(video, 0, 0);

          await new Promise((resolveBlob) => {
            exportCanvas.toBlob(
              async (blob) => {
                if (blob) {
                  try {
                    const { getImageEmbedding } = await import("./embeddings.js");
                    const embedding = await getImageEmbedding(blob);
                    
                    keyframes.push(blob);
                    keyframeTimestamps.push(timestamps[currentIndex]);
                    
                    if (!metadata.embeddings) metadata.embeddings = [];
                    metadata.embeddings.push(embedding);
                  } catch (e) {
                    console.error("Failed to extract embedding for keyframe", e);
                  }
                }
                resolveBlob();
              },
              "image/jpeg",
              jpegQuality
            );
          });
        }

        prevImageData = currentImageData;
        currentIndex++;
        onProgress(Math.floor((currentIndex / timestamps.length) * 100));
        
        // Use a tiny timeout to avoid completely freezing the main UI thread
        setTimeout(processNextFrame, 1);
      };

      processNextFrame();
    };
  });
}

/**
 * Compute the mean absolute pixel difference between two RGBA image data arrays.
 * Returns a value between 0 (identical) and 1 (completely different).
 */
function computeFrameDiff(data1, data2) {
  let totalDiff = 0;
  const pixelCount = data1.length / 4; // RGBA = 4 channels per pixel

  // Sample every 4th pixel for speed
  const step = 4;
  let sampledCount = 0;

  for (let i = 0; i < data1.length; i += 4 * step) {
    const r = Math.abs(data1[i] - data2[i]);
    const g = Math.abs(data1[i + 1] - data2[i + 1]);
    const b = Math.abs(data1[i + 2] - data2[i + 2]);
    totalDiff += (r + g + b) / (3 * 255);
    sampledCount++;
  }

  return totalDiff / sampledCount;
}
