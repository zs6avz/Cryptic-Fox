document.addEventListener('DOMContentLoaded', () => {

// DOM elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const redGain = document.getElementById("redGain");
const greenGain = document.getElementById("greenGain");
const blueGain = document.getElementById("blueGain");
const contrast = document.getElementById("contrast");
const brightness = document.getElementById("brightness");
const brilliance = document.getElementById("brilliance");
const textOutput = document.getElementById("textOutput");
const decodeOutput = document.getElementById("decodeOutput");
const mediaUpload = document.getElementById("mediaUpload");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevFrameBtn = document.getElementById("prevFrameBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");
const resetBtn = document.getElementById("resetBtn");
const loadingDiv = document.getElementById("loadingDiv");
const loadingText = document.getElementById("loadingText");
const lsbChannel = document.getElementById("lsbChannel");
const lsbOutputDisplay = document.getElementById("lsbOutputDisplay");
const downloadBinaryBtn = document.getElementById("downloadBinaryBtn");
const magicNumberOutput = document.getElementById("magicNumberOutput");
const magicNumberList = document.getElementById("magicNumberList");
const modeSelect = document.getElementById("modeSelect");
const channelSelect = document.getElementById("channelSelect");
const roiInput = document.getElementById("roiInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const signalCanvas = document.getElementById("signalCanvas");
const startAudioAnalysisBtn = document.getElementById("startAudioAnalysisBtn");
const stopAudioAnalysisBtn = document.getElementById("stopAudioAnalysisBtn");
const masterAnalysisBtn = document.getElementById("masterAnalysisBtn");
const audioCanvas = document.getElementById("audioCanvas");
const signalCtx = signalCanvas ? signalCanvas.getContext("2d") : null;
const bitPlaneSelect = document.getElementById("bitPlaneSelect");
const ocrToggle = document.getElementById("ocrToggle");
const dropZone = document.getElementById("dropZone");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const fileType = document.getElementById("fileType");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const errorDismiss = document.getElementById("errorDismiss");
const savePreviewBtn = document.getElementById("savePreviewBtn");
const saveSignalBtn = document.getElementById("saveSignalBtn");
const saveAudioBtn = document.getElementById("saveAudioBtn");
const histogramCanvas = document.getElementById("histogramCanvas");
const statsOutput = document.getElementById("statsOutput");
const runStatsBtn = document.getElementById("runStatsBtn");
const exportReportBtn = document.getElementById("exportReportBtn");
const videoControls = document.getElementById("videoControls");
const videoScrubber = document.getElementById("videoScrubber");
const frameTimingSection = document.getElementById("frameTimingSection");
const audioSection = document.getElementById("audioSection");

// slider value displays
const redGainValue = document.getElementById('redGainValue');
const greenGainValue = document.getElementById('greenGainValue');
const blueGainValue = document.getElementById('blueGainValue');
const contrastValue = document.getElementById('contrastValue');
const brightnessValue = document.getElementById('brightnessValue');
const brillianceValue = document.getElementById('brillianceValue');
const saturation = document.getElementById('saturation');
const saturationValue = document.getElementById('saturationValue');
const outputTime = document.getElementById('outputTime');
const playbackRate = document.getElementById('playbackRate');
const scrubber = document.getElementById('scrubber');
const scrubberValue = document.getElementById('scrubberValue');
let scrubberDragging = false;

let glContext = null;
let isImageMode = false;
let currentWorker = null;
let lsbOutput = {
  red: "",
  green: "",
  blue: "",
  all: ""
};
// Base name of the uploaded file (without extension)
let currentMediaName = 'media';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// Helper to trigger a text file download in-browser
function triggerDownload(filename, text) {
  try {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Download failed', err);
  }
}

// File upload handler (supports both image and video)
function handleFileUpload(file) {
  if (!file) return;
  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    showError(`File too large (${formatBytes(file.size)}). Maximum size is 500MB.`);
    return;
  }
  console.log("File uploaded:", file.name, file.size, file.type);
  currentMediaName = (file.name || 'media').replace(/\.[^/.]+$/, '');

  // Show file info
  if (fileInfo) fileInfo.style.display = 'block';
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = formatBytes(file.size);
  if (fileType) {
    const isImage = file.type.startsWith('image/');
    fileType.textContent = isImage ? 'IMAGE' : 'VIDEO';
    fileType.className = 'red-file-badge ' + (isImage ? 'image-badge' : 'video-badge');
  }

  if (file.type.startsWith('image/')) {
    loadImageFile(file);
  } else {
    loadVideoFile(file);
  }
}

if (mediaUpload) mediaUpload.addEventListener('change', e => handleFileUpload(e.target.files[0]));

// Image file handler
function loadImageFile(file) {
  isImageMode = true;
  // Hide video-only controls
  if (videoControls) videoControls.style.display = 'none';
  if (videoScrubber) videoScrubber.style.display = 'none';
  if (frameTimingSection) frameTimingSection.style.display = 'none';
  if (audioSection) audioSection.style.display = 'none';
  if (outputTime) outputTime.style.display = 'none';

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    if (!glContext) glContext = initGL(canvas);
    // Draw image to a temp video-like source via canvas
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = img.naturalWidth;
    tmpCanvas.height = img.naturalHeight;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(img, 0, 0);
    // Store the image source for rendering
    window._imageSource = tmpCanvas;
    // Render with current slider values
    if (glContext) {
      const gain = [parseFloat(redGain.value), parseFloat(greenGain.value), parseFloat(blueGain.value)];
      glContext.renderFrame(tmpCanvas, gain, parseFloat(contrast.value), parseFloat(brightness.value), parseFloat(brilliance.value), parseFloat(saturation.value));
    }
    // Enable controls
    const startBtn = document.getElementById('startAnalysisBtn');
    if (startBtn) startBtn.disabled = false;
    if (masterAnalysisBtn) masterAnalysisBtn.disabled = false;
    if (runStatsBtn) runStatsBtn.disabled = false;
    [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, lsbChannel].forEach(c => { if (c) c.disabled = false; });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// Video file handler
function loadVideoFile(file) {
  isImageMode = false;
  // Show video-only controls
  if (videoControls) videoControls.style.display = '';
  if (videoScrubber) videoScrubber.style.display = '';
  if (frameTimingSection) frameTimingSection.style.display = '';
  if (audioSection) audioSection.style.display = '';
  if (outputTime) outputTime.style.display = '';

  // Define the metadata handler
  const onLoadedMetadata = () => {
    console.log("Metadata loaded:", video.videoWidth, "x", video.videoHeight, "Duration:", video.duration);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video dimensions are 0. Retrying in 500ms...");
      setTimeout(onLoadedMetadata, 500);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (!glContext) {
      glContext = initGL(canvas);
    }
    
    video.pause();

    function renderFirstFrame() {
      console.log("Rendering first frame...");
      const gain = [
        parseFloat(redGain.value || 1),
        parseFloat(greenGain.value || 1),
        parseFloat(blueGain.value || 1)
      ];
      const contrastVal = parseFloat(contrast.value || 1);
      const brightnessVal = parseFloat(brightness ? brightness.value : 0);
      const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
      const saturationVal = parseFloat(saturation ? saturation.value : 1);
      
      if (glContext) {
        try {
          glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
        } catch (err) {
          console.error("Initial render failed:", err);
        }
      }
      
      if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;

      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber, lsbChannel].forEach(ctrl => {
        if (ctrl) ctrl.disabled = false;
      });
      
      if (scrubber) {
        scrubber.max = video.duration || 1;
        scrubber.step = Math.max(0.01, (video.duration || 1) / 1000);
        scrubber.value = video.currentTime;
        if (scrubberValue) scrubberValue.textContent = `${video.currentTime.toFixed(2)}s`;
      }
      
      const startBtn = document.getElementById("startAnalysisBtn");
      if (startBtn) startBtn.disabled = false;
    }

    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      renderFirstFrame();
    };
    video.addEventListener('seeked', onSeeked);
    
    // Some browsers need a slight nudge to render the first frame
    if (video.currentTime === 0) {
      video.currentTime = 0.01; 
    } else {
      video.currentTime = 0;
    }
    
    // Fallback if seeked doesn't fire
    setTimeout(() => {
      if (scrubber && scrubber.disabled) {
        console.log("Seeked fallback triggered");
        renderFirstFrame();
      }
    }, 2000);
  };

  // Cleanup old URL if exists
  if (video.src && video.src.startsWith('blob:')) {
    URL.revokeObjectURL(video.src);
  }

  const url = URL.createObjectURL(file);
  
  // Attach listener before setting src
  video.onloadedmetadata = onLoadedMetadata;
  video.src = url;
  video.load();

  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => {
    if (ctrl) ctrl.disabled = true;
    if (masterAnalysisBtn) masterAnalysisBtn.disabled = false;
    if (runStatsBtn) runStatsBtn.disabled = false;
  });
}

// Frame timing control — must be declared before processVideoFrames
let step = 1; // default

const slider = document.getElementById('frameStep');
const display = document.getElementById('frameStepValue');

if (slider && display) {
  slider.addEventListener('input', function () {
    step = parseFloat(this.value);
    display.textContent = `${step.toFixed(2)}s`;
    console.log(`Frame interval updated to ${step} seconds`);
  });
  // also capture 'change' for when user releases the slider
  slider.addEventListener('change', function () {
    step = parseFloat(this.value);
    console.log(`Frame interval updated to ${step} seconds`);
  });
}

// Start Analysis button handler
const startAnalysisBtn = document.getElementById("startAnalysisBtn");
let analysisAborted = false;
startAnalysisBtn.addEventListener("click", async () => {
  if (startAnalysisBtn.textContent.includes("Stop")) {
    // Stop current analysis
    analysisAborted = true;
    startAnalysisBtn.textContent = "Start Analysis";
    if (loadingDiv) loadingDiv.style.display = 'none';
    [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = false);
    return;
  }

  // Start new analysis
  analysisAborted = false;
  startAnalysisBtn.textContent = "Stop Analysis";
  await processVideoFrames();
  if (!analysisAborted) {
    startAnalysisBtn.textContent = "Start Analysis";
  }
});

// (replayBtn removed — functionality merged into reset)

// Playback controls: play/pause + render loop
let isPlaying = false;
function startRenderLoop() {
  if (isPlaying) return;
  isPlaying = true;

  function loop() {
    if (!glContext || video.paused || video.ended) {
      isPlaying = false;
      return;
    }
    const gain = [
      parseFloat(redGain.value),
      parseFloat(greenGain.value),
      parseFloat(blueGain.value)
    ];
    const contrastVal = parseFloat(contrast.value);
    const brightnessVal = parseFloat(brightness ? brightness.value : 0);
    const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
    const saturationVal = parseFloat(saturation ? saturation.value : 1);
    try {
      // ensure playbackRate is applied during playback
      if (playbackRate) video.playbackRate = parseFloat(playbackRate.value);
      glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
      if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
    } catch (err) {
      console.error('renderFrame error', err);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (playPauseBtn) {
  playPauseBtn.addEventListener('click', () => {
    if (!video) return;
    if (video.paused) {
      video.play().then(() => {
        startRenderLoop();
        if (playPauseBtn) { playPauseBtn.textContent = '⏸'; playPauseBtn.setAttribute('aria-label', 'Pause'); }
      }).catch(err => console.error('play error', err));
    } else {
      video.pause();
      isPlaying = false;
      if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label', 'Play'); }
    }
  });
}

// Reset all UI and outputs
function resetAll() {
  try {
    if (video) {
      video.pause();
      isPlaying = false;
      if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label', 'Play'); }
      // preview mirroring removed
    }

    // Reset sliders to defaults
    if (redGain) redGain.value = 1;
    if (greenGain) greenGain.value = 1;
    if (blueGain) blueGain.value = 1;
    if (contrast) contrast.value = 1;
    if (brightness) brightness.value = 0;
    if (brilliance) brilliance.value = 0;
    if (saturation) saturation.value = 1;
    if (playbackRate) playbackRate.value = 1;
    const frameSlider = document.getElementById('frameStep');
    if (frameSlider) frameSlider.value = 1.00;
    if (scrubber) scrubber.value = 0;
    updateSliderDisplays();

    // Clear outputs
    if (textOutput) textOutput.textContent = '';
    lsbOutput = { red: '', green: '', blue: '', all: '' };
    if (lsbOutputDisplay) lsbOutputDisplay.textContent = '';

    // Clear canvas or render first frame at t=0 if video loaded
    if (video && video.src) {
      function handler() {
        video.removeEventListener('seeked', handler);
        const gain = [parseFloat(redGain.value), parseFloat(greenGain.value), parseFloat(blueGain.value)];
        const contrastVal = parseFloat(contrast.value);
        const brightnessVal = parseFloat(brightness ? brightness.value : 0);
        const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
        const saturationVal = parseFloat(saturation ? saturation.value : 1);
        if (glContext) {
          try { glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal); } catch (e) { }
        }
        if (outputTime) outputTime.textContent = `${(video.currentTime || 0).toFixed(2)}s`;
      }
      video.addEventListener('seeked', handler);
      try { video.currentTime = 0; } catch (e) { handler(); }
    } else {
      const ctx2d = canvas.getContext && canvas.getContext('2d');
      if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch (err) {
    console.error('resetAll error', err);
  }
}

if (resetBtn) resetBtn.addEventListener('click', resetAll);

if (playPauseBtn) {
  playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(err => {
        console.error("Play failed:", err);
        showError("Playback failed. Please ensure the file is a valid video.");
      });
    } else {
      video.pause();
    }
  });
}

video.addEventListener('play', () => {
  startRenderLoop();
  if (playPauseBtn) { playPauseBtn.textContent = '⏸'; playPauseBtn.setAttribute('aria-label', 'Pause'); }
});
video.addEventListener('pause', () => {
  isPlaying = false;
  if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label', 'Play'); }
  // render current frame so slider changes are visible while paused
  renderPreviewIfAvailable();
});
video.addEventListener('ended', () => { isPlaying = false; if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label', 'Play'); } });
  if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
});

// Scrubber interaction
if (scrubber) {
  scrubber.addEventListener('input', () => {
    scrubberDragging = true;
    if (video) video.currentTime = parseFloat(scrubber.value);
    if (scrubberValue) scrubberValue.textContent = `${parseFloat(scrubber.value).toFixed(2)}s`;
  });
  scrubber.addEventListener('change', () => {
    scrubberDragging = false;
    renderPreviewIfAvailable();
  });
}

// Visual Payload controls
[modeSelect, channelSelect, bitPlaneSelect].forEach(ctrl => {
  if (ctrl) {
    ctrl.addEventListener('change', () => {
      runSignalAnalysis();
    });
  }
});

// Seek helper
function seekTo(time) {
  return new Promise(resolve => {
    function handler() {
      video.removeEventListener('seeked', handler);
      setTimeout(resolve, 100);
    }
    video.addEventListener('seeked', handler);
    video.currentTime = time;
  });
}

// LSB extraction
function getLSBBits(imageData, channel) {
  const data = imageData.data;
  const width = imageData.width;
  let result = "";

  if (channel === "all") {
    let redBits = "", greenBits = "", blueBits = "";
    for (let i = 0; i < data.length; i += 4) {
      redBits += (data[i] & 1);
      greenBits += (data[i + 1] & 1);
      blueBits += (data[i + 2] & 1);
      if (((i / 4 + 1) % width) === 0) {
        redBits += "\n";
        greenBits += "\n";
        blueBits += "\n";
      }
    }
    result += "Red LSB:\n" + redBits + "\n";
    result += "Green LSB:\n" + greenBits + "\n";
    result += "Blue LSB:\n" + blueBits + "\n";
  } else {
    let bits = "";
    let offset = channel === "red" ? 0 : channel === "green" ? 1 : 2;
    for (let i = 0; i < data.length; i += 4) {
      bits += (data[i + offset] & 1);
      if (((i / 4 + 1) % width) === 0) bits += "\n";
    }
    result = `${channel.charAt(0).toUpperCase() + channel.slice(1)} LSB:\n${bits}\n`;
  }
  return result;
}

/* Signal panel wiring*/
function runSignalAnalysis() {
  if (!glContext || !canvas) return;
  const mode = modeSelect.value;
  const channel = channelSelect.value;
  let roi = [0, 0, canvas.width, canvas.height];
  if (roiInput.value) {
    let parsed = roiInput.value.split(',').map(v => parseInt(v.trim()));
    if (parsed.length === 4 && !parsed.some(isNaN)) roi = parsed;
  }

  const imageData = glContext.extractImageData();
  const roiData = extractROI(imageData, roi);

  if (signalCanvas) {
    signalCanvas.width = roi[2];
    signalCanvas.height = roi[3];

    switch (mode) {
      case "bitplane": renderBitPlane(roiData, channel); break;
      case "xor": renderXORFrame(roiData, channel); break;
      case "entropy": renderEntropyMap(roiData, channel); break;
    }
  }
}

if (analyzeBtn) analyzeBtn.addEventListener("click", runSignalAnalysis);

function extractROI(imageData, [x, y, w, h]) {
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = imageData.width;
  tmpCanvas.height = imageData.height;
  const ctx = tmpCanvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  const destCanvas = document.createElement("canvas");
  destCanvas.width = w; destCanvas.height = h;
  const destCtx = destCanvas.getContext("2d");
  destCtx.drawImage(tmpCanvas, x, y, w, h, 0, 0, w, h);
  return destCtx.getImageData(0, 0, w, h);
}

function renderBitPlane(data, channel) {
  const ctx = signalCanvas.getContext("2d");
  const idata = ctx.createImageData(data.width, data.height);
  const offset = channel === "red" ? 0 : channel === "green" ? 1 : channel === "blue" ? 2 : 0;
  const bitIndex = bitPlaneSelect ? parseInt(bitPlaneSelect.value) : 0;
  const mask = 1 << bitIndex;
  for (let i = 0; i < data.data.length; i += 4) {
    let bit = 0;
    if (channel === "all") {
      bit = ((data.data[i] & mask) | (data.data[i + 1] & mask) | (data.data[i + 2] & mask)) ? 1 : 0;
    } else {
      bit = (data.data[i + offset] & mask) ? 1 : 0;
    }
    const color = bit ? 255 : 0;
    idata.data[i] = idata.data[i + 1] = idata.data[i + 2] = color;
    idata.data[i + 3] = 255;
  }
  ctx.putImageData(idata, 0, 0);
}

function renderXORFrame(data, channel) {
  const ctx = signalCanvas.getContext("2d");
  const idata = ctx.createImageData(data.width, data.height);
  const offset = channel === "red" ? 0 : channel === "green" ? 1 : channel === "blue" ? 2 : -1;
  for (let i = 0; i < data.data.length; i += 4) {
    if (offset === -1 || channel === "all") {
      idata.data[i] = data.data[i] ^ 128;
      idata.data[i + 1] = data.data[i + 1] ^ 128;
      idata.data[i + 2] = data.data[i + 2] ^ 128;
    } else {
      const val = data.data[i + offset] ^ 128;
      idata.data[i] = idata.data[i + 1] = idata.data[i + 2] = val;
    }
    idata.data[i + 3] = 255;
  }
  ctx.putImageData(idata, 0, 0);
}

function renderEntropyMap(data, channel) {
  const ctx = signalCanvas.getContext("2d");
  const idata = ctx.createImageData(data.width, data.height);
  const offset = channel === "red" ? 0 : channel === "green" ? 1 : channel === "blue" ? 2 : -1;
  for (let y = 1; y < data.height - 1; y++) {
    for (let x = 1; x < data.width - 1; x++) {
      let idx = (y * data.width + x) * 4;
      let diff;
      if (offset === -1 || channel === "all") {
        let d0 = Math.abs(data.data[idx] - data.data[idx - 4]) + Math.abs(data.data[idx] - data.data[idx - data.width * 4]);
        let d1 = Math.abs(data.data[idx+1] - data.data[idx - 3]) + Math.abs(data.data[idx+1] - data.data[idx - data.width * 4 + 1]);
        let d2 = Math.abs(data.data[idx+2] - data.data[idx - 2]) + Math.abs(data.data[idx+2] - data.data[idx - data.width * 4 + 2]);
        diff = (d0 + d1 + d2) / 3;
      } else {
        diff = Math.abs(data.data[idx + offset] - data.data[idx - 4 + offset]) + Math.abs(data.data[idx + offset] - data.data[idx - data.width * 4 + offset]);
      }
      let c = Math.min(255, diff * 2);
      idata.data[idx] = idata.data[idx + 1] = idata.data[idx + 2] = c;
      idata.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(idata, 0, 0);
}

// Main frame processing
async function processVideoFrames() {
  if (loadingDiv) loadingDiv.style.display = 'block';
  if (loadingText) loadingText.textContent = "Initializing multi-channel analysis...";
  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = true);
  
  // Start Audio Analysis automatically if not already running (video only)
  if (!isImageMode && !audioCtx) {
    startAudioAnalysis();
  }

  const source = isImageMode ? window._imageSource : video;
  const sourceWidth = isImageMode ? source.width : video.videoWidth;
  const sourceHeight = isImageMode ? source.height : video.videoHeight;
  const sourceDuration = isImageMode ? 1 : video.duration;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceWidth;
  tempCanvas.height = sourceHeight;
  const tempCtx = tempCanvas.getContext('2d');

  textOutput.textContent = "";
  let framesToProcess = [];
  const totalSteps = isImageMode ? 1 : Math.floor(sourceDuration / step);
  let currentStep = 0;

  // Single iteration for images, loop for videos
  const times = isImageMode ? [0] : [];
  if (!isImageMode) {
    for (let t = 0; t < sourceDuration; t += step) times.push(t);
  }

  for (let t of times) {
    currentStep++;
    if (analysisAborted) {
      if (loadingText) loadingText.textContent = "Analysis stopped.";
      break;
    }

    if (!isImageMode) await seekTo(t);

    const gain = [
      parseFloat(redGain.value),
      parseFloat(greenGain.value),
      parseFloat(blueGain.value)
    ];
    const contrastVal = parseFloat(contrast.value);
    const brightnessVal = parseFloat(brightness ? brightness.value : 0);
    const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
    const saturationVal = parseFloat(saturation ? saturation.value : 1);

    if (!isImageMode && playbackRate) video.playbackRate = parseFloat(playbackRate.value);
    glContext.renderFrame(source, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
    
    // Sync Visual Payload Analysis
    runSignalAnalysis();

    if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;

    const imageData = glContext.extractImageData();
    tempCtx.putImageData(imageData, 0, 0);

    let text = "";
    if (ocrToggle && ocrToggle.checked) {
      try {
        const ocrResult = await Tesseract.recognize(tempCanvas, 'eng', { logger: m => { } });
        text = ocrResult.data.text.trim();
      } catch (err) {
        text = "[OCR error]";
      }
    }

    if (text) {
      textOutput.textContent += `Frame @ ${t.toFixed(2)}s:\n${text}\n\n`;
    }

    // Queue frame for worker
    framesToProcess.push({
      timestamp: t.toFixed(2),
      width: imageData.width,
      height: imageData.height,
      data: new Uint8Array(imageData.data) // send clone
    });

    if (loadingText) {
      const progress = Math.round((currentStep / totalSteps) * 100);
      loadingText.textContent = `Analyzing: ${progress}% (${currentStep}/${totalSteps} frames processed)`;
      if (progressContainer) progressContainer.style.display = 'flex';
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${progress}%`;
    }
  }

  // Once frames are gathered, send to Worker
  if (!analysisAborted && framesToProcess.length > 0) {
    if (loadingText) loadingText.textContent = `Processing bits in Web Worker...`;

    const channel = lsbChannel ? lsbChannel.value : "all";
    let selectedBits = [];
    document.querySelectorAll('#bitSelectors input:checked').forEach(cb => {
      selectedBits.push(parseInt(cb.value));
    });
    if (selectedBits.length === 0) selectedBits = [0]; // default to LSB

    // Terminate previous worker if any
    if (currentWorker) { try { currentWorker.terminate(); } catch(e) {} }
    const worker = new Worker('js/lsb-worker.js');
    currentWorker = worker;
    worker.postMessage({
      framesData: framesToProcess,
      channel: channel,
      selectedBits: selectedBits
    });

    worker.onmessage = function (e) {
      const { textOutput, binaryData, signatures } = e.data;
      if (lsbOutputDisplay) lsbOutputDisplay.textContent = textOutput;

      // Setup Download
      if (downloadBinaryBtn) {
        downloadBinaryBtn.onclick = () => {
          const blob = new Blob([binaryData], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `stego_output_${Date.now()}.bin`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        };
      }

      // Display signatures
      if (magicNumberOutput && magicNumberList) {
        if (signatures && signatures.length > 0) {
          magicNumberOutput.style.display = 'block';
          magicNumberList.innerHTML = signatures.map(s => `<li>${s}</li>`).join('');
        } else {
          magicNumberOutput.style.display = 'none';
        }
      }

      if (loadingDiv) loadingDiv.style.display = 'none';
      if (progressContainer) progressContainer.style.display = 'none';
      // Wire up decodeOutput with summary
      if (decodeOutput) {
        let summary = `Analysis complete.\nFrames: ${framesToProcess.length}\n`;
        if (signatures && signatures.length > 0) summary += `Signatures: ${signatures.join(', ')}\n`;
        if (textOutput && textOutput.textContent) summary += `\nOCR Text:\n${textOutput.textContent}`;
        decodeOutput.textContent = summary;
        decodeOutput.style.fontStyle = 'normal';
        decodeOutput.style.color = '';
      }
      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => { if (ctrl) ctrl.disabled = false; });
      startAnalysisBtn.textContent = "Start Analysis";
    };

    worker.onerror = function (err) {
      console.error("Worker error:", err);
      if (loadingDiv) loadingDiv.style.display = 'none';
      if (progressContainer) progressContainer.style.display = 'none';
      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => { if (ctrl) ctrl.disabled = false; });
      startAnalysisBtn.textContent = "Start Analysis";
    };
  } else {
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
    [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => { if (ctrl) ctrl.disabled = false; });
  }
}

// (Frame timing control moved above processVideoFrames)

// Live update displays for sliders
function updateSliderDisplays() {
  if (redGainValue) redGainValue.textContent = parseFloat(redGain.value).toFixed(2);
  if (greenGainValue) greenGainValue.textContent = parseFloat(greenGain.value).toFixed(2);
  if (blueGainValue) blueGainValue.textContent = parseFloat(blueGain.value).toFixed(2);
  if (contrastValue) contrastValue.textContent = parseFloat(contrast.value).toFixed(2);
  if (brightnessValue) brightnessValue.textContent = parseFloat(brightness.value).toFixed(2);
  if (brillianceValue) brillianceValue.textContent = parseFloat(brilliance.value).toFixed(2);
  if (saturationValue) saturationValue.textContent = parseFloat(saturation.value).toFixed(2);
  // Render preview when paused so slider adjustments are visible immediately
  renderPreviewIfAvailable();
}

// Button wiring for remaining actions
if (copyLSBBtn) {
  copyLSBBtn.addEventListener('click', () => {
    if (lsbOutputDisplay) {
      navigator.clipboard.writeText(lsbOutputDisplay.textContent)
        .then(() => {
          const originalText = copyLSBBtn.textContent;
          copyLSBBtn.textContent = "Copied!";
          setTimeout(() => copyLSBBtn.textContent = originalText, 2000);
        });
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    [redGain, greenGain, blueGain, contrast, saturation].forEach(s => { if(s) s.value = 1; });
    [brightness, brilliance].forEach(s => { if(s) s.value = 0; });
    if (lsbChannel) lsbChannel.value = "all";
    if (modeSelect) modeSelect.value = "bitplane";
    if (channelSelect) channelSelect.value = "red";
    if (bitPlaneSelect) bitPlaneSelect.value = "0";
    if (roiInput) roiInput.value = "";
    if (ocrToggle) ocrToggle.checked = false;
    updateSliderDisplays();
  });
}

if (masterAnalysisBtn) {
  masterAnalysisBtn.addEventListener('click', async () => {
    // 1. Run full frame/bit analysis
    await processVideoFrames();
    // 2. Run statistical analysis
    await runStatisticalAnalysis();
    // 3. Audio analysis is handled within processVideoFrames for video
  });
}

async function exportReport() {
  if (!JSZip) {
    showError("JSZip library not loaded.");
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder("redfox_report");
  
  // 1. Metadata
  let reportText = `RED FOX FORENSIC REPORT\n`;
  reportText += `Date: ${new Date().toLocaleString()}\n`;
  reportText += `File: ${currentMediaName}\n`;
  reportText += `\n--- LSB ANALYSIS ---\n`;
  reportText += lsbOutputDisplay ? lsbOutputDisplay.textContent : "No data";
  reportText += `\n\n--- OCR TEXT ---\n`;
  reportText += textOutput ? textOutput.textContent : "No data";
  
  folder.file("report.txt", reportText);
  
  // 2. Captures
  const previewData = canvas.toDataURL("image/png").split(',')[1];
  folder.file("preview_capture.png", previewData, {base64: true});
  
  if (signalCanvas) {
    const signalData = signalCanvas.toDataURL("image/png").split(',')[1];
    folder.file("signal_map.png", signalData, {base64: true});
  }
  
  if (!isImageMode && audioCanvas) {
    const audioData = audioCanvas.toDataURL("image/png").split(',')[1];
    folder.file("spectrogram.png", audioData, {base64: true});
  }

  const content = await zip.generateAsync({type:"blob"});
  const link = document.createElement('a');
  link.download = `RedFox_Report_${currentMediaName}_${Date.now()}.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
}

if (exportReportBtn) exportReportBtn.addEventListener('click', exportReport);


// Render the current source (video or image) to the GL canvas with current slider values
function renderPreviewIfAvailable() {
  if (!glContext) return;
  
  let source = null;
  if (isImageMode) {
    source = window._imageSource;
  } else if (video && video.readyState >= 2) {
    source = video;
  }
  
  if (!source) return;
  if (!isImageMode && !video.paused) return; // playback loop handles active video

  const gain = [
    parseFloat(redGain.value),
    parseFloat(greenGain.value),
    parseFloat(blueGain.value)
  ];
  const contrastVal = parseFloat(contrast.value);
  const brightnessVal = parseFloat(brightness ? brightness.value : 0);
  const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
  const saturationVal = parseFloat(saturation ? saturation.value : 1);
  try {
    glContext.renderFrame(source, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
    if (!isImageMode && outputTime) {
      outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
    }
  } catch (err) {
    // ignore render errors during UI update
  }
}

// Utility: Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Utility: Show error banner
function showError(msg) {
  if (!errorBanner || !errorText) return;
  errorText.textContent = msg;
  errorBanner.style.display = 'flex';
  setTimeout(() => {
    errorBanner.style.opacity = '1';
  }, 10);
}

// Dismiss error banner
if (errorDismiss) {
  errorDismiss.addEventListener('click', () => {
    errorBanner.style.display = 'none';
  });
}

// Helper: Save canvas as PNG
function saveCanvasAsPNG(canvasId, defaultName) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const link = document.createElement('a');
  link.download = `${currentMediaName}_${defaultName}_${Date.now()}.png`;
  link.href = c.toDataURL("image/png");
  link.click();
}

if (savePreviewBtn) savePreviewBtn.addEventListener('click', () => saveCanvasAsPNG('canvas', 'preview'));
if (saveSignalBtn) saveSignalBtn.addEventListener('click', () => saveCanvasAsPNG('signalCanvas', 'signal'));
if (saveAudioBtn) saveAudioBtn.addEventListener('click', () => saveCanvasAsPNG('audioCanvas', 'spectrogram'));

// Statistical Analysis Implementation
async function runStatisticalAnalysis() {
  if (!glContext) return;
  
  // Get raw pixels from current preview
  const imageData = glContext.extractImageData();
  const data = imageData.data;
  
  // 1. Calculate Histograms (specifically for LSBs)
  const histR = new Array(2).fill(0);
  const histG = new Array(2).fill(0);
  const histB = new Array(2).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    histR[data[i] % 2]++;
    histG[data[i+1] % 2]++;
    histB[data[i+2] % 2]++;
  }
  
  // Draw Histogram
  if (histogramCanvas) {
    const ctx = histogramCanvas.getContext('2d');
    ctx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);
    
    const maxVal = Math.max(...histR, ...histG, ...histB, 1);
    const barWidth = 40;
    const spacing = 20;
    const startX = (histogramCanvas.width - (barWidth * 6 + spacing * 5)) / 2;
    const chartHeight = histogramCanvas.height - 40;
    
    const drawBar = (val, x, color, label) => {
      const h = (val / maxVal) * chartHeight;
      ctx.fillStyle = color;
      ctx.fillRect(x, histogramCanvas.height - 20 - h, barWidth, h);
      ctx.fillStyle = "#888";
      ctx.font = "10px Arial";
      ctx.fillText(label, x, histogramCanvas.height - 5);
    };
    
    drawBar(histR[0], startX, "#800", "R0");
    drawBar(histR[1], startX + barWidth + spacing, "#f44", "R1");
    drawBar(histG[0], startX + (barWidth + spacing) * 2, "#080", "G0");
    drawBar(histG[1], startX + (barWidth + spacing) * 3, "#4f4", "G1");
    drawBar(histB[0], startX + (barWidth + spacing) * 4, "#008", "B0");
    drawBar(histB[1], startX + (barWidth + spacing) * 5, "#44f", "B1");
  }
  
  // 2. Chi-Square Test (Simplified)
  // If LSBs are random (hidden data), 0 and 1 should be roughly equal (50/50)
  const calcChi = (hist) => {
    const total = hist[0] + hist[1];
    if (total === 0) return 0;
    const expected = total / 2;
    const chi = (Math.pow(hist[0] - expected, 2) / expected) + (Math.pow(hist[1] - expected, 2) / expected);
    return chi;
  };
  
  const chiR = calcChi(histR);
  const chiG = calcChi(histG);
  const chiB = calcChi(histB);
  
  // A low Chi-square value means the distribution is close to expected (e.g. random data hidden)
  // A high value means it's likely natural (biased towards 0 or 1)
  const isSuspicious = (chi) => chi < 5.0; // Threshold for "too random to be natural"
  
  if (statsOutput) {
    const row = (label, val, status) => `
      <div class="stat-row">
        <span class="stat-label">${label}:</span>
        <span class="stat-value ${status}">${val}</span>
      </div>`;
    
    statsOutput.innerHTML = `
      ${row("Red Chi-Square", chiR.toFixed(4), isSuspicious(chiR) ? "stat-fail" : "stat-pass")}
      ${row("Green Chi-Square", chiG.toFixed(4), isSuspicious(chiG) ? "stat-fail" : "stat-pass")}
      ${row("Blue Chi-Square", chiB.toFixed(4), isSuspicious(chiB) ? "stat-fail" : "stat-pass")}
      <div style="margin-top:10px; font-size:0.8em; color:var(--color-text-muted);">
        * Low Chi-Square (<5.0) suggests high entropy / potential hidden payload.
      </div>
    `;
  }
}

if (runStatsBtn) runStatsBtn.addEventListener('click', runStatisticalAnalysis);

// Drop Zone Specific Listeners
if (dropZone) {

  // Visual feedback only for zone
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, () => dropZone.classList.add('drag-over'), false);
  });
  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, () => dropZone.classList.remove('drag-over'), false);
  });
  
  dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });
  
  // Make the entire zone clickable to trigger the hidden file input
  dropZone.addEventListener('click', () => {
    if (mediaUpload) mediaUpload.click();
  });
}


// Keyboard Shortcuts
window.addEventListener('keydown', e => {
  // Ignore shortcuts if user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  switch(e.code) {
    case 'Space':
      e.preventDefault();
      if (!isImageMode && playPauseBtn) playPauseBtn.click();
      break;
    case 'ArrowLeft':
      if (!isImageMode && prevFrameBtn) prevFrameBtn.click();
      break;
    case 'ArrowRight':
      if (!isImageMode && nextFrameBtn) nextFrameBtn.click();
      break;
    case 'KeyR':
      if (resetBtn) resetBtn.click();
      break;
    case 'Enter':
      if (startAnalysisBtn && !startAnalysisBtn.disabled) startAnalysisBtn.click();
      break;
    case 'Escape':
      // Stop/Abort analysis logic if implemented
      break;
  }
});

// Frame stepping
if (prevFrameBtn) prevFrameBtn.addEventListener('click', () => {
  if (video) video.currentTime = Math.max(0, video.currentTime - (1/30)); // approx 1 frame at 30fps
});
if (nextFrameBtn) nextFrameBtn.addEventListener('click', () => {
  if (video) video.currentTime = Math.min(video.duration, video.currentTime + (1/30));
});


// attach input listeners
if (redGain) redGain.addEventListener('input', updateSliderDisplays);
if (greenGain) greenGain.addEventListener('input', updateSliderDisplays);
if (blueGain) blueGain.addEventListener('input', updateSliderDisplays);
if (contrast) contrast.addEventListener('input', updateSliderDisplays);
if (brightness) brightness.addEventListener('input', updateSliderDisplays);
if (brilliance) brilliance.addEventListener('input', updateSliderDisplays);
if (saturation) saturation.addEventListener('input', updateSliderDisplays);
if (lsbChannel) lsbChannel.addEventListener('change', () => { if(!isImageMode) renderPreviewIfAvailable(); });

// Audio Buttons
if (startAudioAnalysisBtn) startAudioAnalysisBtn.addEventListener('click', startAudioAnalysis);
if (stopAudioAnalysisBtn) stopAudioAnalysisBtn.addEventListener('click', stopAudioAnalysis);

// Download Binary
if (downloadBinaryBtn) {
  downloadBinaryBtn.addEventListener('click', () => {
    if (window._currentBinaryData) {
      const blob = new Blob([window._currentBinaryData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMediaName}_extracted_${Date.now()}.bin`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      showError("No binary data to download. Run analysis first.");
    }
  });
}
if (playbackRate) {
  const updatePlaybackRate = () => {
    if (playbackRateValue) playbackRateValue.textContent = `${parseFloat(playbackRate.value).toFixed(2)}x`;
    if (video) video.playbackRate = parseFloat(playbackRate.value);
  };
  playbackRate.addEventListener('change', updatePlaybackRate);
  playbackRate.addEventListener('input', updatePlaybackRate);
}
if (scrubber) {
  scrubber.addEventListener('input', (e) => {
    scrubberDragging = true;
    const v = parseFloat(e.target.value);
    if (scrubberValue) scrubberValue.textContent = `${v.toFixed(2)}s`;
  });
  scrubber.addEventListener('change', async (e) => {
    const v = parseFloat(e.target.value);
    scrubberDragging = false;
    try {
      await new Promise(resolve => {
        function handler() {
          video.removeEventListener('seeked', handler);
          video.pause();
          resolve();
        }
        video.addEventListener('seeked', handler);
        video.currentTime = v;
      });
      const gain = [
        parseFloat(redGain.value),
        parseFloat(greenGain.value),
        parseFloat(blueGain.value)
      ];
      const contrastVal = parseFloat(contrast.value);
      const brightnessVal = parseFloat(brightness ? brightness.value : 0);
      const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
      const saturationVal = parseFloat(saturation ? saturation.value : 1);
      if (glContext) glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
      if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
    } catch (err) {
      console.error('scrub seek error', err);
    }
  });
}
// preview window support removed; no click listener to register

// initialize display values
updateSliderDisplays();

// (frameStep listener registered above, near step declaration)

// Copy LSB output button
const copyLSBBtn = document.getElementById("copyLSBBtn");
if (copyLSBBtn) {
  copyLSBBtn.addEventListener("click", async () => {
    const text = lsbOutputDisplay ? lsbOutputDisplay.textContent : '';
    try {
      await navigator.clipboard.writeText(text);
      copyLSBBtn.textContent = "Copied!";
      setTimeout(() => copyLSBBtn.textContent = "Copy All", 1500);
    } catch (err) {
      // Fallback for older browsers
      try {
        const range = document.createRange();
        range.selectNodeContents(lsbOutputDisplay);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        copyLSBBtn.textContent = "Copied!";
        setTimeout(() => copyLSBBtn.textContent = "Copy All", 1500);
      } catch (fallbackErr) {
        alert("Copy failed. Try manually selecting the text.");
      }
    }
  });
}

// Update displayed LSB output when the channel selector changes
if (lsbChannel) lsbChannel.addEventListener("change", () => {
  // worker now handles output parsing. Live updates currently wait for new analysis.
});

// Audio Spectrogram Logic
let audioCtx, audioSource, analyser, audioAnimId;

function startAudioAnalysis() {
  if (!video || !video.src) return;
  // Unmute video so audio data flows to the analyser
  video.muted = false;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioSource = audioCtx.createMediaElementSource(video);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      audioSource.connect(analyser);
      // Connect through a gain node at zero volume for silent analysis
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      analyser.connect(silentGain);
      silentGain.connect(audioCtx.destination);
    } catch (e) {
      console.error("Audio Context Init Failed:", e);
      return;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  drawSpectrogram();
}

if (startAudioAnalysisBtn) {
  startAudioAnalysisBtn.addEventListener("click", () => {
    if (!video || !video.src) return alert("Upload a video first.");
    startAudioAnalysis();
    video.play();
  });
}
if (stopAudioAnalysisBtn) {
  stopAudioAnalysisBtn.addEventListener("click", () => {
    if (video) video.pause();
    if (audioAnimId) cancelAnimationFrame(audioAnimId);
  });
}

if (masterAnalysisBtn) {
  masterAnalysisBtn.addEventListener("click", () => {
    // Scroll to the preview so the user can see the analysis
    window.scrollTo({ top: 0, behavior: 'smooth' });
    processVideoFrames();
  });
}

function drawSpectrogram() {
  if (!audioCanvas || !analyser || !audioCtx) return;
  const ctx = audioCanvas.getContext("2d", { alpha: false });
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const width = audioCanvas.width;
  const height = audioCanvas.height;

  // 1. Shift existing image left
  const imgData = ctx.getImageData(1, 0, width - 1, height);
  ctx.putImageData(imgData, 0, 0);

  // 2. Capture new frequency data
  analyser.getByteFrequencyData(dataArray);

  // 3. Determine frequency range and scaling
  const focusMode = document.getElementById("freqFocus")?.value || "full";
  const useLog = document.getElementById("logScale")?.checked || false;
  const sampleRate = audioCtx.sampleRate;
  const nyquist = sampleRate / 2;

  let fMin = 0;
  let fMax = nyquist;

  if (focusMode === "low") fMax = 2000;
  if (focusMode === "high") fMin = 15000;

  // 4. Draw new column (pixel by pixel for accurate mapping)
  for (let y = 0; y < height; y++) {
    const percent = y / height;
    let freq;

    if (useLog) {
      const actualMin = Math.max(20, fMin);
      const actualMax = fMax;
      freq = actualMin * Math.pow(actualMax / actualMin, percent);
    } else {
      freq = fMin + percent * (fMax - fMin);
    }

    const binIndex = Math.round((freq / nyquist) * bufferLength);
    const value = dataArray[Math.min(binIndex, bufferLength - 1)] || 0;

    const r = Math.min(255, value * 1.5);
    const g = Math.min(255, value * 0.5);
    const b = Math.min(255, 255 - value + (value > 128 ? value : 0));
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(width - 1, height - y - 1, 1, 1);
  }

  audioAnimId = requestAnimationFrame(drawSpectrogram);
}

}); // End DOMContentLoaded
