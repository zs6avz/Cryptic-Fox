/**
 * Lovelace Music — Bernoulli Number Music Generation
 * 
 * Realizes Ada Lovelace's vision of algorithmic composition by transforming
 * Bernoulli numbers into musical structures using WebAudio API.
 * 
 * Features:
 * - Bernoulli number calculation
 * - Multiple musical mapping modes (melodic, rhythmic, harmonic, timbral)
 * - Real-time synthesis and playback
 * - Waveform visualization
 * - Lovelace Etudes (pre-composed sequences)
 */

class LovelaceMusic {
    constructor() {
        this.audioContext = null;
        this.currentSequence = [];
        this.musicalNotes = [];
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.scheduledNotes = [];
        this.animationFrame = null;
        this.isPreset = false;
        this.currentPresetName = null;
        
        // Historic preset compositions
        this.PRESET_COMPOSITIONS = {
            'daisyBell': {
                name: 'Daisy Bell',
                description: 'First song performed by a computer (1961)',
                year: 1961,
                notes: [
                    // Complete Daisy Bell melody (50 notes)
                    // MIDI notes and durations from authentic 1961 arrangement
                    { midi: 74, duration: 0.75, type: 'note' },  // D5
                    { midi: 71, duration: 0.75, type: 'note' },  // B4
                    { midi: 67, duration: 0.75, type: 'note' },  // G4
                    { midi: 62, duration: 0.75, type: 'note' },  // D4
                    { midi: 64, duration: 0.25, type: 'note' },  // E4
                    { midi: 66, duration: 0.25, type: 'note' },  // F#4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 64, duration: 0.5, type: 'note' },   // E4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 62, duration: 1.5, type: 'note' },   // D4
                    { midi: 69, duration: 0.75, type: 'note' },  // A4
                    { midi: 74, duration: 0.75, type: 'note' },  // D5
                    { midi: 71, duration: 0.75, type: 'note' },  // B4
                    { midi: 67, duration: 0.75, type: 'note' },  // G4
                    { midi: 64, duration: 0.25, type: 'note' },  // E4
                    { midi: 66, duration: 0.25, type: 'note' },  // F#4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 69, duration: 0.5, type: 'note' },   // A4
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 69, duration: 1.5, type: 'note' },   // A4
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 72, duration: 0.25, type: 'note' },  // C5
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 69, duration: 0.25, type: 'note' },  // A4
                    { midi: 74, duration: 0.5, type: 'note' },   // D5
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 69, duration: 0.25, type: 'note' },  // A4
                    { midi: 67, duration: 1.0, type: 'note' },   // G4
                    { midi: 69, duration: 0.25, type: 'note' },  // A4
                    { midi: 71, duration: 0.5, type: 'note' },   // B4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 64, duration: 0.5, type: 'note' },   // E4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 64, duration: 0.25, type: 'note' },  // E4
                    { midi: 62, duration: 1.25, type: 'note' },  // D4
                    { midi: 62, duration: 0.25, type: 'note' },  // D4
                    { midi: 67, duration: 0.5, type: 'note' },   // G4
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 69, duration: 0.5, type: 'note' },   // A4
                    { midi: 67, duration: 0.5, type: 'note' },   // G4
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 69, duration: 0.25, type: 'note' },  // A4
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 72, duration: 0.25, type: 'note' },  // C5
                    { midi: 74, duration: 0.25, type: 'note' },  // D5
                    { midi: 71, duration: 0.25, type: 'note' },  // B4
                    { midi: 67, duration: 0.25, type: 'note' },  // G4
                    { midi: 69, duration: 0.5, type: 'note' },   // A4
                    { midi: 62, duration: 0.25, type: 'note' },  // D4
                    { midi: 67, duration: 1.25, type: 'note' }   // G4
                ]
            }
        };
        
        // Scale definitions (intervals from root)
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            phrygian: [0, 1, 3, 5, 7, 8, 10],
            lydian: [0, 2, 4, 6, 7, 9, 11],
            mixolydian: [0, 2, 4, 5, 7, 9, 10],
            pentatonic: [0, 2, 4, 7, 9],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.generateEtudes();
        this.updateParamDisplays();
    }
    
    setupEventListeners() {
        // Parameter controls
        document.getElementById('tempo').addEventListener('input', (e) => {
            document.getElementById('tempoValue').textContent = e.target.value;
        });
        
        document.getElementById('volume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = parseFloat(e.target.value).toFixed(2);
        });
        
        document.getElementById('noteLength').addEventListener('input', (e) => {
            document.getElementById('noteLengthValue').textContent = parseFloat(e.target.value).toFixed(1);
        });
        
        // Main controls
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadMIDI());
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('waveformCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas resolution
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        this.drawIdleVisualization();
    }
    
    updateParamDisplays() {
        document.getElementById('tempoValue').textContent = document.getElementById('tempo').value;
        document.getElementById('volumeValue').textContent = parseFloat(document.getElementById('volume').value).toFixed(2);
        document.getElementById('noteLengthValue').textContent = parseFloat(document.getElementById('noteLength').value).toFixed(1);
    }
    
    /**
     * Calculate Bernoulli numbers using the explicit formula
     * B_n using recursive method with memoization
     */
    calculateBernoulliNumbers(n) {
        const B = [1]; // B_0 = 1
        
        for (let m = 1; m <= n; m++) {
            // B_1 = -1/2 (special case)
            if (m === 1) {
                B[1] = -0.5;
                continue;
            }
            
            // B_m for odd m > 1 equals 0
            if (m > 1 && m % 2 === 1) {
                B[m] = 0;
                continue;
            }
            
            // Calculate B_m using the recursive formula
            let sum = 0;
            for (let k = 0; k < m; k++) {
                sum += this.binomial(m + 1, k) * B[k];
            }
            B[m] = -sum / (m + 1);
        }
        
        return B;
    }
    
    /**
     * Calculate binomial coefficient C(n, k)
     */
    binomial(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result *= (n - i + 1) / i;
        }
        return result;
    }
    
    /**
     * Map Bernoulli numbers to MIDI notes based on selected mode
     */
    mapToNotes(bernoulliNumbers, mode) {
        const root = parseInt(document.getElementById('rootNote').value);
        const scaleType = document.getElementById('scaleSelect').value;
        const scale = this.scales[scaleType];
        const noteLength = parseFloat(document.getElementById('noteLength').value);
        
        const notes = [];
        
        switch (mode) {
            case 'melodic':
                // Sign determines direction, magnitude determines interval
                notes.push({ midi: root, duration: noteLength, type: 'rest' }); // Start with root
                
                for (let i = 1; i < bernoulliNumbers.length; i++) {
                    const B = bernoulliNumbers[i];
                    if (B === 0) {
                        // Zero = rest
                        notes.push({ midi: 0, duration: noteLength, type: 'rest' });
                    } else {
                        // Map magnitude to scale degree
                        const magnitude = Math.abs(B);
                        const scaleDegree = Math.floor(magnitude * 10) % scale.length;
                        const octaveShift = Math.floor((magnitude * 10) / scale.length) * 12;
                        
                        const direction = B > 0 ? 1 : -1;
                        const midi = root + (scale[scaleDegree] * direction) + (octaveShift * direction);
                        
                        notes.push({ 
                            midi: Math.max(24, Math.min(108, midi)), 
                            duration: noteLength,
                            type: 'note',
                            bernoulli: B
                        });
                    }
                }
                break;
                
            case 'rhythmic':
                // Magnitude determines duration
                for (let i = 0; i < bernoulliNumbers.length; i++) {
                    const B = bernoulliNumbers[i];
                    if (B === 0) {
                        notes.push({ midi: 0, duration: noteLength, type: 'rest' });
                    } else {
                        const magnitude = Math.abs(B);
                        const duration = noteLength * (1 + magnitude * 2); // Scale duration
                        const scaleDegree = i % scale.length;
                        const midi = root + scale[scaleDegree];
                        
                        notes.push({ 
                            midi: midi, 
                            duration: duration,
                            type: 'note',
                            bernoulli: B
                        });
                    }
                }
                break;
                
            case 'harmonic':
                // Create chords from Bernoulli number relationships
                for (let i = 0; i < bernoulliNumbers.length; i++) {
                    const B = bernoulliNumbers[i];
                    if (B === 0) {
                        notes.push({ midi: [root], duration: noteLength * 2, type: 'chord' });
                    } else {
                        // Build triad based on magnitude
                        const magnitude = Math.abs(B);
                        const chordType = magnitude > 0.1 ? [0, 4, 7] : [0, 3, 7]; // Major or minor
                        const chord = chordType.map(interval => root + interval);
                        
                        notes.push({ 
                            midi: chord, 
                            duration: noteLength * 2,
                            type: 'chord',
                            bernoulli: B
                        });
                    }
                }
                break;
                
            case 'timbral':
                // Use Bernoulli numbers to modulate filter frequency
                for (let i = 0; i < bernoulliNumbers.length; i++) {
                    const B = bernoulliNumbers[i];
                    const scaleDegree = i % scale.length;
                    const midi = root + scale[scaleDegree];
                    const filterFreq = 200 + (Math.abs(B) * 2000); // 200Hz to 2200Hz
                    
                    notes.push({ 
                        midi: B === 0 ? 0 : midi, 
                        duration: noteLength,
                        type: B === 0 ? 'rest' : 'note',
                        filterFreq: filterFreq,
                        bernoulli: B
                    });
                }
                break;
        }
        
        return notes;
    }
    
    /**
     * Load a preset composition
     */
    loadPresetComposition(presetKey) {
        const preset = this.PRESET_COMPOSITIONS[presetKey];
        if (!preset) {
            console.error('Preset not found:', presetKey);
            return;
        }
        
        this.isPreset = true;
        this.currentPresetName = preset.name;
        this.musicalNotes = preset.notes;
        
        // Convert preset notes to sequence for waveform visualization
        // Map MIDI notes to normalized values similar to Bernoulli numbers
        const midiValues = preset.notes
            .filter(n => n.type === 'note')
            .map(n => n.midi);
        const minMidi = Math.min(...midiValues);
        const maxMidi = Math.max(...midiValues);
        const midiRange = maxMidi - minMidi || 12;
        
        this.currentSequence = preset.notes.map(note => {
            if (note.type === 'rest') return 0;
            // Normalize to range similar to Bernoulli numbers (-0.5 to 0.5)
            return ((note.midi - minMidi) / midiRange - 0.5);
        });
        
        // Display results
        this.displayPresetInfo(preset);
        this.displayMusicalMapping();
        this.visualizeBernoulliWaveform();
        
        // Enable play button
        document.getElementById('playBtn').disabled = false;
        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('sequenceInfo').style.display = 'block';
    }
    
    /**
     * Generate Bernoulli sequence and map to music
     */
    generate() {
        const n = parseInt(document.getElementById('nValue').value);
        const mode = document.getElementById('mappingMode').value;
        
        // Reset preset flag
        this.isPreset = false;
        this.currentPresetName = null;
        
        // Calculate Bernoulli numbers
        this.currentSequence = this.calculateBernoulliNumbers(n);
        
        // Map to musical notes
        this.musicalNotes = this.mapToNotes(this.currentSequence, mode);
        
        // Display results
        this.displaySequence(n);
        this.displayMusicalMapping();
        this.visualizeBernoulliWaveform();
        
        // Enable play button
        document.getElementById('playBtn').disabled = false;
        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('sequenceInfo').style.display = 'block';
    }
    
    /**
     * Display preset composition info
     */
    displayPresetInfo(preset) {
        const display = document.getElementById('bernoulliDisplay');
        const titleElement = document.getElementById('sequenceInfo').querySelector('h3');
        
        titleElement.innerHTML = `🎵 Historic Preset: ${preset.name} (${preset.year})`;
        
        let html = `${preset.description}\n\n`;
        html += `Composition Length: ${preset.notes.length} notes\n`;
        html += `Total Duration: ${preset.notes.reduce((sum, n) => sum + n.duration, 0).toFixed(2)}s\n\n`;
        html += `This melody represents the first song ever performed by a computer,\n`;
        html += `programmed on the IBM 704 at Bell Labs in 1961 by John Kelly,\n`;
        html += `Carol Lockbaum, and Max Mathews using vocoder synthesis.\n\n`;
        html += `Later famously sung by HAL 9000 in "2001: A Space Odyssey" (1968).`;
        
        display.textContent = html;
    }
    
    /**
     * Display Bernoulli sequence
     */
    displaySequence(n) {
        const display = document.getElementById('bernoulliDisplay');
        const titleElement = document.getElementById('sequenceInfo').querySelector('h3');
        
        titleElement.innerHTML = `Bernoulli Sequence (B<sub>0</sub> to B<sub id="maxN">${n}</sub>)`;
        document.getElementById('maxN').textContent = n;
        
        let html = '';
        this.currentSequence.forEach((B, i) => {
            html += `B${i} = ${B.toFixed(10)}\n`;
        });
        
        display.textContent = html;
    }
    
    /**
     * Display musical mapping
     */
    displayMusicalMapping() {
        const mapping = document.getElementById('musicalMapping');
        mapping.innerHTML = '';
        
        this.musicalNotes.forEach((note, i) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            
            if (note.type === 'rest') {
                div.innerHTML = `
                    <div class="note-name">REST</div>
                    <div class="note-duration">${note.duration.toFixed(2)}s</div>
                `;
            } else if (note.type === 'chord') {
                const noteNames = note.midi.map(m => this.midiToNoteName(m)).join('+');
                div.innerHTML = `
                    <div class="note-name">${noteNames}</div>
                    <div class="note-duration">${note.duration.toFixed(2)}s</div>
                `;
            } else {
                div.innerHTML = `
                    <div class="note-name">${this.midiToNoteName(note.midi)}</div>
                    <div class="note-duration">${note.duration.toFixed(2)}s</div>
                `;
            }
            
            mapping.appendChild(div);
        });
    }
    
    /**
     * Convert MIDI number to note name
     */
    midiToNoteName(midi) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = notes[midi % 12];
        return `${note}${octave}`;
    }
    
    /**
     * Convert MIDI number to frequency
     */
    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }
    
    /**
     * Visualize preset composition as note bars
     */
    visualizePresetWaveform() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, width, height);
        
        if (!this.musicalNotes.length) return;
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(68, 125, 155, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Find MIDI range
        const midiValues = this.musicalNotes
            .filter(n => n.type === 'note')
            .map(n => n.midi);
        const minMidi = Math.min(...midiValues);
        const maxMidi = Math.max(...midiValues);
        const midiRange = maxMidi - minMidi || 12;
        
        // Draw notes as bars
        const barWidth = width / this.musicalNotes.length;
        
        this.musicalNotes.forEach((note, i) => {
            const x = i * barWidth;
            
            if (note.type === 'rest') {
                // Draw rest indicator
                this.ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
                this.ctx.fillRect(x, height / 2 - 5, barWidth * 0.8, 10);
            } else {
                // Draw note bar
                const normalized = (note.midi - minMidi) / midiRange;
                const barHeight = normalized * height * 0.6 + height * 0.1;
                const y = height - barHeight;
                
                const hue = (normalized * 120 + 180) % 360; // Blue to green gradient
                this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
                this.ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
                
                // Duration indicator (opacity)
                this.ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${note.duration / 2})`;
                this.ctx.fillRect(x + 2, y, barWidth - 4, 3);
            }
        });
        
        // Labels
        this.ctx.fillStyle = '#b0b0b0';
        this.ctx.font = '12px Space Grotesk, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${this.currentPresetName} — ${this.musicalNotes.length} notes`, 10, 20);
    }
    
    /**
     * Visualize Bernoulli numbers as waveform
     */
    visualizeBernoulliWaveform() {
        if (!this.currentSequence.length) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(68, 125, 155, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Center line
        this.ctx.strokeStyle = 'rgba(254, 119, 67, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
        
        // Draw Bernoulli sequence as waveform
        const maxMagnitude = Math.max(...this.currentSequence.map(Math.abs));
        const step = width / (this.currentSequence.length - 1);
        
        this.ctx.strokeStyle = '#4ade80';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        this.currentSequence.forEach((B, i) => {
            const x = i * step;
            const normalized = B / (maxMagnitude || 1);
            const y = height / 2 - (normalized * height * 0.4);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Draw points
        this.ctx.fillStyle = '#FE7743';
        this.currentSequence.forEach((B, i) => {
            const x = i * step;
            const normalized = B / (maxMagnitude || 1);
            const y = height / 2 - (normalized * height * 0.4);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Labels
        this.ctx.fillStyle = '#b0b0b0';
        this.ctx.font = '12px Space Grotesk, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Bernoulli Sequence (n=${this.currentSequence.length - 1})`, 10, 20);
    }
    
    /**
     * Draw idle visualization (grid pattern)
     */
    drawIdleVisualization() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.strokeStyle = 'rgba(68, 125, 155, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Draw grid
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Center text
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Space Grotesk, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Generate a sequence to visualize', width / 2, height / 2);
    }
    
    /**
     * Play the musical sequence
     */
    async play() {
        if (this.isPlaying) return;
        if (!this.musicalNotes.length) return;
        
        // Initialize AudioContext (must be done on user gesture)
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentNoteIndex = 0;
        
        document.getElementById('playBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('statusIndicator').classList.add('playing');
        
        this.playSequence();
    }
    
    /**
     * Play sequence recursively
     */
    playSequence() {
        if (!this.isPlaying || this.currentNoteIndex >= this.musicalNotes.length) {
            this.stop();
            return;
        }
        
        const note = this.musicalNotes[this.currentNoteIndex];
        const tempo = parseInt(document.getElementById('tempo').value);
        const beatDuration = 60 / tempo;
        
        if (note.type !== 'rest') {
            this.playNote(note);
        }
        
        // Highlight current note in visualization
        this.highlightNote(this.currentNoteIndex);
        
        this.currentNoteIndex++;
        
        // Schedule next note
        const nextDelay = note.duration * 1000;
        setTimeout(() => {
            if (this.isPlaying) {
                this.playSequence();
            }
        }, nextDelay);
    }
    
    /**
     * Play a single note or chord
     */
    playNote(note) {
        const volume = parseFloat(document.getElementById('volume').value);
        const waveform = document.getElementById('waveform').value;
        const now = this.audioContext.currentTime;
        
        const midiNotes = Array.isArray(note.midi) ? note.midi : [note.midi];
        
        midiNotes.forEach(midi => {
            const freq = this.midiToFreq(midi);
            
            // Create oscillator
            const osc = this.audioContext.createOscillator();
            osc.type = waveform;
            osc.frequency.value = freq;
            
            // Create gain node for envelope
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01); // Attack
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.2, now + note.duration * 0.7); // Sustain
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.duration); // Release
            
            // Optional filter for timbral mode
            if (note.filterFreq) {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = note.filterFreq;
                filter.Q.value = 5;
                
                osc.connect(filter);
                filter.connect(gainNode);
            } else {
                osc.connect(gainNode);
            }
            
            gainNode.connect(this.audioContext.destination);
            
            osc.start(now);
            osc.stop(now + note.duration);
        });
    }
    
    /**
     * Highlight current note in visualization
     */
    highlightNote(index) {
        // Redraw waveform with highlighted point
        this.visualizeBernoulliWaveform();
        
        if (index >= this.currentSequence.length) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const maxMagnitude = Math.max(...this.currentSequence.map(Math.abs));
        const step = width / (this.currentSequence.length - 1);
        
        const B = this.currentSequence[index];
        const x = index * step;
        const normalized = B / (maxMagnitude || 1);
        const y = height / 2 - (normalized * height * 0.4);
        
        // Draw highlight circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(254, 119, 67, 0.5)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#FE7743';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        
        document.getElementById('playBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('statusIndicator').classList.remove('playing');
        
        this.visualizeBernoulliWaveform();
    }
    
    /**
     * Generate Lovelace Etudes selector
     */
    generateEtudes() {
        const selector = document.getElementById('etudeSelector');
        const etudes = [4, 6, 8, 10, 12, 14, 16, 18, 20];
        
        // Add Daisy Bell historic preset button first
        const presetContainer = document.createElement('div');
        presetContainer.style.gridColumn = '1 / -1';
        presetContainer.style.marginBottom = '15px';
        
        const daisyBtn = document.createElement('button');
        daisyBtn.className = 'etude-btn preset-btn';
        daisyBtn.innerHTML = '★ Daisy Bell (1961)';
        daisyBtn.title = 'First song performed by a computer (IBM 704, Bell Labs, 1961) — Hover over section title for more info';
        
        daisyBtn.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.etude-btn').forEach(b => b.classList.remove('active'));
            daisyBtn.classList.add('active');
            
            // Load preset
            this.loadPresetComposition('daisyBell');
        });
        
        presetContainer.appendChild(daisyBtn);
        selector.appendChild(presetContainer);
        
        // Add regular Bernoulli etudes
        etudes.forEach(n => {
            const btn = document.createElement('button');
            btn.className = 'etude-btn';
            btn.textContent = `Etude ${n}`;
            btn.title = `Bernoulli sequence up to B${n}`;
            
            btn.addEventListener('click', () => {
                // Set parameters
                document.getElementById('nValue').value = n;
                
                // Remove active class from all
                document.querySelectorAll('.etude-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Generate
                this.generate();
            });
            
            selector.appendChild(btn);
        });
    }
    
    /**
     * Download as MIDI file (simplified implementation)
     */
    downloadMIDI() {
        alert('MIDI export functionality would be implemented here using a library like MIDIWriter or Tone.js. For now, this is a placeholder for future enhancement.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.lovelaceMusic = new LovelaceMusic();
});
