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
const modeSelect = document.getElementById("modeSelect");
const channelSelect = document.getElementById("channelSelect");
const roiInput = document.getElementById("roiInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const signalCanvas = document.getElementById("signalCanvas");
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
  // remember original filename for per-frame output files
  currentVideoName = (file.name || 'video').replace(/\.[^/.]+$/, '');
  const url = URL.createObjectURL(file);
  video.src = url;
  video.load();
  video.onloadeddata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    glContext = initGL(canvas);
    video.pause();

    // --- Render the first frame to the canvas for preview ---
    // Seek to the first frame and render after seeked
    function handler() {
      video.removeEventListener('seeked', handler);
      const gain = [
        parseFloat(redGain.value),
        parseFloat(greenGain.value),
        parseFloat(blueGain.value)
      ];
      const contrastVal = parseFloat(contrast.value);
      const brightnessVal = parseFloat(brightness ? brightness.value : 0);
      const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
      const saturationVal = parseFloat(saturation ? saturation.value : 1);
      glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
      if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;

      [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber, lsbChannel].forEach(ctrl => ctrl.disabled = false);
      if (scrubber) {
        scrubber.max = video.duration;
        scrubber.step = Math.max(0.01, video.duration / 1000);
        scrubber.value = 0;
        if (scrubberValue) scrubberValue.textContent = `0.00s`;
      }
        // preview window removed — no preview button to enable
      const startBtn = document.getElementById("startAnalysisBtn");
      if (startBtn) startBtn.disabled = false;
    }

    video.addEventListener('seeked', handler);
    video.currentTime = 0;
  };

  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => {
    if (ctrl) ctrl.disabled = true;
  });
});

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
        if (playPauseBtn) { playPauseBtn.textContent = '⏸'; playPauseBtn.setAttribute('aria-label','Pause'); }
      }).catch(err => console.error('play error', err));
    } else {
      video.pause();
      isPlaying = false;
      if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label','Play'); }
    }
  });
}

// Reset all UI and outputs
function resetAll() {
  try {
    if (video) {
      video.pause();
      isPlaying = false;
      if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label','Play'); }
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
          try { glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal); } catch (e) {}
        }
        if (outputTime) outputTime.textContent = `${(video.currentTime||0).toFixed(2)}s`;
      }
      video.addEventListener('seeked', handler);
      try { video.currentTime = 0; } catch (e) { handler(); }
    } else {
      const ctx2d = canvas.getContext && canvas.getContext('2d');
      if (ctx2d) ctx2d.clearRect(0,0,canvas.width, canvas.height);
    }
  } catch (err) {
    console.error('resetAll error', err);
  }
}

if (resetBtn) resetBtn.addEventListener('click', resetAll);

video.addEventListener('play', () => {
  startRenderLoop();
  if (playPauseBtn) { playPauseBtn.textContent = '⏸'; playPauseBtn.setAttribute('aria-label','Pause'); }
});
video.addEventListener('pause', () => {
  isPlaying = false;
  if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label','Play'); }
  // render current frame so slider changes are visible while paused
  renderPreviewIfAvailable();
});
video.addEventListener('ended', () => { isPlaying = false; if (playPauseBtn) { playPauseBtn.textContent = '▶'; playPauseBtn.setAttribute('aria-label','Play'); } });
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
      redBits   += (data[i]   & 1);
      greenBits += (data[i+1] & 1);
      blueBits  += (data[i+2] & 1);
      if (((i / 4 + 1) % width) === 0) {
        redBits   += "\n";
        greenBits += "\n";
        blueBits  += "\n";
      }
    }
    result += "Red LSB:\n"   + redBits + "\n";
    result += "Green LSB:\n" + greenBits + "\n";
    result += "Blue LSB:\n"  + blueBits + "\n";
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
if (analyzeBtn) analyzeBtn.addEventListener("click", () => {
  const mode = modeSelect.value;
  const channel = channelSelect.value;
  const roi = roiInput.value.split(',').map(v => parseInt(v.trim()));
  if (roi.length !== 4) return alert("Invalid ROI format");

  const imageData = glContext.extractImageData();
  const roiData = extractROI(imageData, roi);

  switch (mode) {
    case "bitplane": renderBitPlane(roiData, channel); break;
    case "entropy": renderEntropyMap(roiData, channel); break;
    case "hilbert": renderHilbertCurve(roiData, channel); break;
    case "xor":     renderXORFrame(roiData, channel); break;
  }
});

function extractROI(imageData, [x, y, w, h]) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, -x, -y);
  return ctx.getImageData(0, 0, w, h);
}

//function renderBitPlane(data, channel) { /* TODO */ }
//function renderEntropyMap(data, channel) { /* TODO */ }
//function renderHilbertCurve(data, channel) { /* TODO */ }
//function renderXORFrame(data, channel) { /* TODO */ }

// Main frame processing
async function processVideoFrames() {
  if (loadingDiv) loadingDiv.style.display = 'block';
  if (loadingText) loadingText.textContent = "Starting analysis...";
  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = true);
  // preview window removed — no preview button to disable

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');

  textOutput.textContent = "";
  lsbOutput = { red: "", green: "", blue: "", all: "" };

  for (let t = 0; t < video.duration; t += step) {
    // Check if analysis was aborted
    if (analysisAborted) {
      if (loadingText) loadingText.textContent = "Analysis stopped.";
      break;
    }
    
    await seekTo(t);

    // frame index for filenames
    const frameIdx = Math.round((t / step));

    const gain = [
      parseFloat(redGain.value),
      parseFloat(greenGain.value),
      parseFloat(blueGain.value)
    ];
    const contrastVal = parseFloat(contrast.value);
    const brightnessVal = parseFloat(brightness ? brightness.value : 0);
    const brillianceVal = parseFloat(brilliance ? brilliance.value : 0);
    const saturationVal = parseFloat(saturation ? saturation.value : 1);

      // set playbackRate for preview but avoid affecting analysis timing
      if (playbackRate) video.playbackRate = parseFloat(playbackRate.value);
      glContext.renderFrame(video, gain, contrastVal, brightnessVal, brillianceVal, saturationVal);
    if (outputTime) outputTime.textContent = `${video.currentTime.toFixed(2)}s`;
    const imageData = glContext.extractImageData();
    tempCtx.putImageData(imageData, 0, 0);

    let text = "";
    try {
      const ocrResult = await Tesseract.recognize(tempCanvas, 'eng', { logger: m => {} });
      text = ocrResult.data.text.trim();
    } catch (err) {
      text = "[OCR error]";
    }

    textOutput.textContent += `Frame @ ${t.toFixed(2)}s:\n${text}\n\n`;

    const channel = lsbChannel.value;
    const timestamp = `Frame @ ${t.toFixed(2)}s:\n`;

    if (channel === "all") {
      const redBits = getLSBBits(imageData, "red");
      const greenBits = getLSBBits(imageData, "green");
      const blueBits = getLSBBits(imageData, "blue");
      const allBits = getLSBBits(imageData, "all");
      lsbOutput.red   += timestamp + redBits + "\n";
      lsbOutput.green += timestamp + greenBits + "\n";
      lsbOutput.blue  += timestamp + blueBits + "\n";
      lsbOutput.all   += timestamp + allBits + "\n";
    } else {
      const bits = getLSBBits(imageData, channel);
      lsbOutput[channel] += timestamp + bits + "\n";
    }

    if (loadingText) loadingText.textContent = `Processing frame at ${t.toFixed(1)}s...`;
  }

  const selected = lsbChannel ? lsbChannel.value : 'all';
  if (lsbOutputDisplay) {
    lsbOutputDisplay.textContent = lsbOutput[selected] || "";
    lsbOutputDisplay.scrollTop = lsbOutputDisplay.scrollHeight;
  }

  if (loadingDiv) loadingDiv.style.display = 'none';
  [redGain, greenGain, blueGain, contrast, brightness, brilliance, saturation, playbackRate, scrubber].forEach(ctrl => ctrl.disabled = false);
  // preview window removed — no preview button to enable
}

// Frame timing control
let step = 1; // default

const slider = document.getElementById('frameStep');
const display = document.getElementById('frameStepValue');

if (slider && display) {
  slider.addEventListener('input', function () {
    step = parseFloat(this.value);
    display.textContent = `${step.toFixed(2)}s`;
    // Trigger re-analysis or update timers
    console.log(`Frame interval updated to ${step} seconds`);
  });
}

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

// Register listener ONCE
document.getElementById('frameStep').addEventListener('change', function () {
  step = parseFloat(this.value);
  console.log(`Frame interval updated to ${step} seconds`);
});

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
  const selected = lsbChannel.value;
  if (lsbOutputDisplay) {
    lsbOutputDisplay.textContent = lsbOutput[selected] || "";
    lsbOutputDisplay.scrollTop = lsbOutputDisplay.scrollHeight;
  }
});
