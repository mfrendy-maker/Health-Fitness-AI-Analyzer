(function (globalScope, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope) {
    globalScope.HealthFitnessAIAnalyzerCamera = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  async function listCameraDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  let faceDetectorPromise = null;
  let faceLandmarkerPromise = null;

  async function initFaceDetector() {
    if (typeof window === 'undefined' || !window.vision) {
      return null;
    }

    if (!faceDetectorPromise) {
      faceDetectorPromise = (async () => {
        const { FaceDetector, FilesetResolver } = window.vision;
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        return FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.45,
          minSuppressionThreshold: 0.3
        });
      })();
    }

    return faceDetectorPromise;
  }

  async function initFaceLandmarker() {
    if (typeof window === 'undefined' || !window.vision) {
      return null;
    }

    if (!faceLandmarkerPromise) {
      faceLandmarkerPromise = (async () => {
        const { FaceLandmarker, FilesetResolver } = window.vision;
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
        return FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      })();
    }

    return faceLandmarkerPromise;
  }

  function estimatePresenceFromPixels(imageData, width, height) {
    if (!imageData || !imageData.data) {
      return 0;
    }

    const sourceWidth = Number(width ?? imageData.width ?? 0);
    const sourceHeight = Number(height ?? imageData.height ?? 0);
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return 0;
    }

    const { data } = imageData;
    const centerX = sourceWidth / 2;
    const centerY = sourceHeight / 2;
    let skinPixels = 0;
    let totalPixels = 0;
    let darkPixels = 0;
    let fillPixels = 0;

    for (let y = 0; y < sourceHeight; y += 1) {
      for (let x = 0; x < sourceWidth; x += 1) {
        const dx = (x - centerX) / sourceWidth;
        const dy = (y - centerY) / sourceHeight;
        const distFromCenter = Math.hypot(dx, dy * 1.4);
        const inFaceBand = distFromCenter < 0.42;
        if (!inFaceBand) {
          continue;
        }

        const index = (y * sourceWidth + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;

        totalPixels += 1;

        if (brightness < 28) {
          darkPixels += 1;
        }

        const redGreenGap = r - g;
        const redBlueGap = r - b;
        const blueGreenGap = Math.abs(b - g);
        const isSkinTone = r > 80 && r < 220 && g > 35 && g < 170 && b > 20 && b < 170 && r > g && r > b && redGreenGap >= 10 && redGreenGap <= 80 && redBlueGap >= 10 && redBlueGap <= 90 && blueGreenGap < 80;
        if (isSkinTone) {
          skinPixels += 1;
        }

        const withinFaceShape = Math.abs(x - centerX) < sourceWidth * 0.22 && Math.abs(y - centerY) < sourceHeight * 0.32;
        if (withinFaceShape) {
          fillPixels += 1;
        }
      }
    }

    if (totalPixels === 0) {
      return 0;
    }

    const skinRatio = skinPixels / totalPixels;
    const fillRatio = fillPixels / totalPixels;
    const brightnessFactor = 1 - darkPixels / totalPixels;
    const compactFaceLike = skinRatio > 0.12 && fillRatio > 0.25;
    const presence = compactFaceLike ? clamp((skinRatio * 2.2) + (brightnessFactor * 0.2), 0, 1) : 0;
    return Number(presence.toFixed(3));
  }

  async function detectFacePresence(videoElement) {
    if (!videoElement || typeof window === 'undefined') {
      return { personPresence: 0, hasPerson: false, confidence: 0 };
    }

    let detectorScore = 0;
    const detector = await initFaceDetector();
    if (detector && videoElement.videoWidth && videoElement.videoHeight) {
      const result = await detector.detectForVideo(videoElement, performance.now());
      const detections = Array.isArray(result?.detections) ? result.detections : [];
      detectorScore = detections.reduce((max, detection) => {
        const score = Number(detection.categories?.[0]?.score ?? 0);
        return score > max ? score : max;
      }, 0);
    }

    let heuristicScore = 0;
    if (videoElement.videoWidth && videoElement.videoHeight && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        heuristicScore = estimatePresenceFromPixels(imageData, canvas.width, canvas.height);
      }
    }

    const personPresence = clamp(Math.max(detectorScore, heuristicScore), 0, 1);
    const hasPerson = personPresence >= 0.5;
    return {
      personPresence: Number(personPresence.toFixed(2)),
      hasPerson,
      confidence: Math.round(personPresence * 100)
    };
  }

  function getFaceRoi(width, height, landmarkBounds = null) {
    const centerX = width / 2;
    const centerY = height / 2;

    if (landmarkBounds && Number.isFinite(landmarkBounds.x) && Number.isFinite(landmarkBounds.y) && Number.isFinite(landmarkBounds.width) && Number.isFinite(landmarkBounds.height)) {
      return {
        x: Math.max(0, Math.floor(landmarkBounds.x * width)),
        y: Math.max(0, Math.floor(landmarkBounds.y * height)),
        width: Math.max(20, Math.ceil((landmarkBounds.width || 0.35) * width)),
        height: Math.max(20, Math.ceil((landmarkBounds.height || 0.35) * height))
      };
    }

    return {
      x: Math.max(0, Math.floor(centerX - width * 0.22)),
      y: Math.max(0, Math.floor(centerY - height * 0.28)),
      width: Math.max(40, Math.floor(width * 0.44)),
      height: Math.max(40, Math.floor(height * 0.56))
    };
  }

  function extractFaceSignalFromImage(imageData, width, height, roi = null) {
    if (!imageData || !imageData.data) {
      return [];
    }

    const region = roi || getFaceRoi(width, height);
    const xStart = Math.max(0, Math.min(width - 1, region.x));
    const yStart = Math.max(0, Math.min(height - 1, region.y));
    const xEnd = Math.max(xStart + 10, Math.min(width, xStart + region.width));
    const yEnd = Math.max(yStart + 10, Math.min(height, yStart + region.height));
    const samples = [];

    for (let y = yStart; y < yEnd; y += 2) {
      for (let x = xStart; x < xEnd; x += 2) {
        const index = (y * width + x) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];

        const redGreenGap = r - g;
        const redBlueGap = r - b;
        const blueGreenGap = Math.abs(b - g);
        const isSkinLike = r > 80 && r < 220 && g > 35 && g < 170 && b > 20 && b < 170 && redGreenGap >= 10 && redGreenGap <= 80 && redBlueGap >= 10 && redBlueGap <= 90 && blueGreenGap < 80;

        if (!isSkinLike) {
          continue;
        }

        const green = (g * 0.7) + (r * 0.2) + (b * 0.1);
        samples.push(green);
      }
    }

    return samples;
  }

  function computeFacePresenceFromImageData(imageData, width, height) {
    if (!imageData || !imageData.data) {
      return 0;
    }

    const fallbackPresence = estimatePresenceFromPixels(imageData, width, height);
    return clamp(fallbackPresence, 0, 1);
  }

  async function estimateHeartRateFromSkinPixels(videoElement, sampleWindow = 90, sampleRate = 30) {
    if (!videoElement || typeof document === 'undefined') {
      return 0;
    }

    const width = Math.max(80, videoElement.videoWidth || 640);
    const height = Math.max(80, videoElement.videoHeight || 480);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return 0;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(videoElement, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);

    const presenceScore = computeFacePresenceFromImageData(imageData, width, height);
    if (presenceScore < 0.35) {
      return 0;
    }

    let landmarkBounds = null;
    try {
      const landmarker = await initFaceLandmarker();
      if (landmarker && typeof performance !== 'undefined') {
        const result = await landmarker.detectForVideo(videoElement, performance.now());
        const landmarks = result && Array.isArray(result.faceLandmarks) && result.faceLandmarks.length > 0 ? result.faceLandmarks[0] : null;
        if (landmarks && landmarks.length) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          for (const point of landmarks) {
            if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
              continue;
            }
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          }

          if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
            landmarkBounds = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
          }
        }
      }
    } catch (err) {
      landmarkBounds = null;
    }

    const roi = getFaceRoi(width, height, landmarkBounds);
    const samples = extractFaceSignalFromImage(imageData, width, height, roi);
    if (samples.length < 12) {
      return 0;
    }

    const windowSize = Math.min(sampleWindow, samples.length);
    const slidingWindow = samples.slice(-windowSize);

    if (typeof globalThis.HealthFitnessAIAnalyzer !== 'undefined' && typeof globalThis.HealthFitnessAIAnalyzer.estimateHeartRateFromSkin === 'function') {
      const bpm = globalThis.HealthFitnessAIAnalyzer.estimateHeartRateFromSkin(slidingWindow, sampleRate);
      return bpm >= 45 && bpm <= 150 ? bpm : 0;
    }

    return 0;
  }

  function estimateFrameMetrics(videoElement) {
    const base = {
      posture: 68,
      symmetry: 72,
      mobility: 64,
      movement: 70,
      gait: 74,
      quality: 76,
      motion: 0.4,
      confidence: 78,
      cameraReady: Boolean(videoElement && videoElement.readyState >= 2),
      personPresence: 0,
      hasPerson: false,
      heartRate: 0
    };

    if (!videoElement || typeof document === 'undefined') {
      return base;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return base;
    }

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(videoElement, 0, 0, width, height);

    const image = context.getImageData(0, 0, width, height).data;
    let brightness = 0;
    let leftIntensity = 0;
    let rightIntensity = 0;
    let darkPixels = 0;
    const luminanceValues = [];

    for (let i = 0; i < image.length; i += 4) {
      const r = image[i];
      const g = image[i + 1];
      const b = image[i + 2];
      const luminance = (r + g + b) / 3;
      brightness += luminance;
      luminanceValues.push(luminance);

      const x = (i / 4) % width;
      if (x < width / 2) {
        leftIntensity += luminance;
      } else {
        rightIntensity += luminance;
      }

      if (luminance < 30) {
        darkPixels += 1;
      }
    }

    const pixelCount = Math.max(1, image.length / 4);
    const meanBrightness = brightness / pixelCount;
    const meanLuminance = luminanceValues.reduce((sum, value) => sum + value, 0) / pixelCount;
    const variance = luminanceValues.reduce((sum, value) => sum + (value - meanLuminance) ** 2, 0) / pixelCount;
    const leftRightBalance = clamp(((leftIntensity - rightIntensity) / (leftIntensity + rightIntensity + 1)) * 100 + 50, 0, 100);
    const motion = clamp((1 - darkPixels / pixelCount) * 0.85 + 0.15, 0, 1);
    const detailScore = clamp(variance / 4500, 0, 1);
    const fallbackPresence = clamp(motion * 0.7 + detailScore * 0.3, 0, 1);

    const posture = clamp(52 + (meanBrightness / 255) * 32 + ((width / height) - 1.3) * 25, 0, 100);
    const symmetry = clamp(leftRightBalance, 0, 100);
    const mobility = clamp(52 + motion * 48, 0, 100);
    const movement = clamp(45 + motion * 50, 0, 100);
    const gait = clamp(40 + symmetry * 0.45, 0, 100);
    const quality = clamp((posture + symmetry + mobility + movement + gait) / 5, 0, 100);

    return {
      posture: Math.round(posture),
      symmetry: Math.round(symmetry),
      mobility: Math.round(mobility),
      movement: Math.round(movement),
      gait: Math.round(gait),
      quality: Math.round(quality),
      motion: Number(motion.toFixed(2)),
      personPresence: Number(fallbackPresence.toFixed(2)),
      confidence: Math.round(quality),
      cameraReady: true,
      hasPerson: fallbackPresence >= 0.35,
      heartRate: 0
    };
  }

  async function startCameraStream({ videoElement, constraints = {}, onFrame } = {}) {
    if (!videoElement) {
      throw new Error('A video element is required to start the camera stream.');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('This browser does not support webcam access.');
    }

    const settings = {
      video: {
        facingMode: constraints.facingMode || 'user',
        width: { ideal: constraints.width || 1280 },
        height: { ideal: constraints.height || 720 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(settings);
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true;

    await videoElement.play();

    const tick = () => {
      const metrics = estimateFrameMetrics(videoElement);
      if (typeof onFrame === 'function') {
        onFrame(metrics);
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return {
      stream,
      stop() {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }

  return {
    clamp,
    listCameraDevices,
    initFaceDetector,
    initFaceLandmarker,
    estimatePresenceFromPixels,
    detectFacePresence,
    estimateHeartRateFromSkinPixels,
    estimateFrameMetrics,
    startCameraStream
  };
});
