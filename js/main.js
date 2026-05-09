import { initGL } from './glProcessor.js';

// DOM elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const redGain = document.getElementById("redGain");
const greenGain = document.getElementById("greenGain");
const blueGain = document.getElementById("blueGain");
const contrast = document.getElementById("contrast");
const brightness = document.getElementById("brightness");
const brilliance = document.getElementById("brilliance");
const textCanvas = document.getElementById("textCanvas");
const textOutput = document.getElementById("textOutput");
const videoUpload = document.getElementById("videoUpload");
const replayBtn = document.getElementById("replayBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
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
const playbackRateValue = document.getElementById('playbackRateValue');
const scrubber = document.getElementById('scrubber');
const scrubberValue = document.getElementById('scrubberValue');
let scrubberDragging = false;



let glContext = null;
let lsbOutput = {
  red: "",
  green: "",
  blue: "",
  all: ""
};
// Base name of the uploaded file (without extension)
let currentVideoName = 'video';

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

// Video upload handler
videoUpload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  console.log("File uploaded:", file.name, file.size, file.type);
  
  // remember original filename for per-frame output files
  currentVideoName = (file.name || 'video').replace(/\.[^/.]+$/, '');
  
  const url = URL.createObjectURL(file);
  
  // Cleanup old URL if exists
  if (video.src) {
    URL.revokeObjectURL(video.src);
  }

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

  // Attach listener before setting src
  video.onloadedmetadata = onLoadedMetadata;
  video.src = url;
  video.load();

  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => {
    if (ctrl) ctrl.disabled = true;
  });
});

// URL upload handler
const videoUrlInput = document.getElementById("videoUrl");
const loadUrlBtn = document.getElementById("loadUrlBtn");

if (loadUrlBtn) {
  loadUrlBtn.addEventListener("click", () => {
    const url = videoUrlInput.value.trim();
    if (!url) return alert("Please enter a valid video URL.");
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return alert("YouTube links cannot be analyzed directly due to CORS security restrictions. These services prevent external tools from accessing their raw pixel data. Please download the video using a local tool and upload the file instead.");
    }

    console.log("Loading remote video:", url);
    currentVideoName = url.split('/').pop().split('?')[0] || 'remote_video';
    
    // Set crossOrigin to anonymous to attempt CORS loading for pixel access
    video.crossOrigin = "anonymous";
    
    const onLoadedMetadata = () => {
      console.log("Remote metadata loaded:", video.videoWidth, "x", video.videoHeight);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (!glContext) {
        glContext = initGL(canvas);
      }
      video.pause();
      
      // Force initial render
      setTimeout(() => {
        const gain = [parseFloat(redGain.value || 1), parseFloat(greenGain.value || 1), parseFloat(blueGain.value || 1)];
        if (glContext) glContext.renderFrame(video, gain, 1, 0, 0, 1);
      }, 500);

      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber, lsbChannel].forEach(ctrl => {
        if (ctrl) ctrl.disabled = false;
      });
      if (scrubber) {
        scrubber.max = video.duration || 1;
        scrubber.value = 0;
      }
    };

    video.onloadedmetadata = onLoadedMetadata;
    video.src = url;
    video.load();
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

// Replay button handler (optional)
if (replayBtn) {
  replayBtn.addEventListener("click", async () => {
    video.currentTime = 0;
    video.pause();
    textOutput.textContent = "";
    await processVideoFrames();
  });
}

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
video.addEventListener('timeupdate', () => {
  if (!scrubberDragging && scrubber) {
    scrubber.value = video.currentTime;
    if (scrubberValue) scrubberValue.textContent = `${video.currentTime.toFixed(2)}s`;
  }
  if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
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
    video.play();
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
  for (let i = 0; i < data.data.length; i += 4) {
    let bit = 0;
    if (channel === "all") {
      bit = ((data.data[i] & 1) | (data.data[i + 1] & 1) | (data.data[i + 2] & 1));
    } else {
      bit = data.data[i + offset] & 1;
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
  for (let i = 0; i < data.data.length; i += 4) {
    idata.data[i] = data.data[i] ^ 128;
    idata.data[i + 1] = data.data[i + 1] ^ 128;
    idata.data[i + 2] = data.data[i + 2] ^ 128;
    idata.data[i + 3] = 255;
  }
  ctx.putImageData(idata, 0, 0);
}

function renderEntropyMap(data, channel) {
  const ctx = signalCanvas.getContext("2d");
  const idata = ctx.createImageData(data.width, data.height);
  for (let y = 1; y < data.height - 1; y++) {
    for (let x = 1; x < data.width - 1; x++) {
      let idx = (y * data.width + x) * 4;
      let diff = Math.abs(data.data[idx] - data.data[idx - 4]) + Math.abs(data.data[idx] - data.data[idx - data.width * 4]);
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
  
  // Start Audio Analysis automatically if not already running
  if (!audioCtx) {
    startAudioAnalysis();
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');

  textOutput.textContent = "";
  let framesToProcess = [];
  const totalSteps = Math.floor(video.duration / step);
  let currentStep = 0;

  for (let t = 0; t < video.duration; t += step) {
    currentStep++;
    if (analysisAborted) {
      if (loadingText) loadingText.textContent = "Analysis stopped.";
      break;
    }

    await seekTo(t);

    const gain = [
      parseFloat(redGain.value),
      parseFloat(greenGain.value),
      parseFloat(blueGain.value)
    ];
    const contrastVal = parseFloat(contrast.value);
    const brightnessVal = parseFloat(brightness ? brightness.value : 0);
    const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
    const saturationVal = parseFloat(saturation ? saturation.value : 1);

    if (playbackRate) video.playbackRate = parseFloat(playbackRate.value);
    glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
    
    // Sync Visual Payload Analysis
    runSignalAnalysis();

    if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;

    const imageData = glContext.extractImageData();
    tempCtx.putImageData(imageData, 0, 0);

    let text = "";
    try {
      // Faster OCR config for real-time feedback
      const ocrResult = await Tesseract.recognize(tempCanvas, 'eng', { logger: m => { } });
      text = ocrResult.data.text.trim();
    } catch (err) {
      text = "[OCR error]";
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

    const worker = new Worker('js/lsb-worker.js');
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
      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = false);
      startAnalysisBtn.textContent = "Start Analysis";
    };

    worker.onerror = function (err) {
      console.error("Worker error:", err);
      if (loadingDiv) loadingDiv.style.display = 'none';
      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = false);
      startAnalysisBtn.textContent = "Start Analysis";
    };
  } else {
    if (loadingDiv) loadingDiv.style.display = 'none';
    [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = false);
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
  if (playbackRateValue) playbackRateValue.textContent = `${parseFloat(playbackRate.value).toFixed(2)}x`;
  // Render preview when paused so slider adjustments are visible immediately
  renderPreviewIfAvailable();
}

// Render the current video frame to the GL canvas with current slider values
function renderPreviewIfAvailable() {
  if (!glContext || !video) return;
  if (video.readyState < 2) return; // need data
  if (!video.paused) return; // playback already renders

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
    glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
    if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
  } catch (err) {
    // ignore render errors during UI update
  }
}

// attach input listeners
if (redGain) redGain.addEventListener('input', updateSliderDisplays);
if (greenGain) greenGain.addEventListener('input', updateSliderDisplays);
if (blueGain) blueGain.addEventListener('input', updateSliderDisplays);
if (contrast) contrast.addEventListener('input', updateSliderDisplays);
if (brightness) brightness.addEventListener('input', updateSliderDisplays);
if (brilliance) brilliance.addEventListener('input', updateSliderDisplays);
if (saturation) saturation.addEventListener('input', updateSliderDisplays);
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
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioSource = audioCtx.createMediaElementSource(video);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      audioSource.connect(analyser);
      // We keep the analyzer disconnected from the destination (speakers) 
      // so analysis remains silent as per user preference.
      // analyser.connect(audioCtx.destination); 
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
