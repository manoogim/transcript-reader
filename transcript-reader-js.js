// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global variables
let extractedText = '';
let utterance = null;
let isPaused = false;

// Get DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const textPreview = document.getElementById('textPreview');
const controls = document.getElementById('controls');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const rateControl = document.getElementById('rateControl');
const pitchControl = document.getElementById('pitchControl');
const rateValue = document.getElementById('rateValue');
const pitchValue = document.getElementById('pitchValue');

// Upload area click handler
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        handleFile(file);
    } else {
        showStatus('Please upload a PDF file', 'error');
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

// Handle PDF file extraction
async function handleFile(file) {
    showStatus('Extracting text from PDF...', 'info');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + ' ';
        }

        extractedText = text.trim();
        
        if (extractedText.length > 0) {
            showStatus(`✓ Successfully extracted ${extractedText.length} characters`, 'success');
            textPreview.textContent = extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '');
            textPreview.classList.add('active');
            controls.classList.add('active');
        } else {
            showStatus('No text found in PDF', 'error');
        }
    } catch (error) {
        showStatus('Error reading PDF: ' + error.message, 'error');
    }
}

// Show status message
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
}

// Speech rate control
rateControl.addEventListener('input', (e) => {
    rateValue.textContent = e.target.value;
});

// Speech pitch control
pitchControl.addEventListener('input', (e) => {
    pitchValue.textContent = e.target.value;
});

// Play button handler
playBtn.addEventListener('click', () => {
    if (isPaused && utterance) {
        speechSynthesis.resume();
        isPaused = false;
    } else {
        startSpeech();
    }
    updateButtons(true);
});

// Pause button handler
pauseBtn.addEventListener('click', () => {
    speechSynthesis.pause();
    isPaused = true;
    updateButtons(false);
});

// Stop button handler
stopBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    isPaused = false;
    updateButtons(false);
    showStatus('Stopped', 'info');
});

// Start text-to-speech
function startSpeech() {
    speechSynthesis.cancel();
    utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = parseFloat(rateControl.value);
    utterance.pitch = parseFloat(pitchControl.value);
    
    utterance.onstart = () => {
        showStatus('🔊 Speaking...', 'info');
    };

    utterance.onend = () => {
        showStatus('✓ Finished reading', 'success');
        updateButtons(false);
        isPaused = false;
    };

    utterance.onerror = (e) => {
        showStatus('Error: ' + e.error, 'error');
        updateButtons(false);
    };

    speechSynthesis.speak(utterance);
}

// Update button states
function updateButtons(playing) {
    playBtn.disabled = playing;
    pauseBtn.disabled = !playing;
    stopBtn.disabled = !playing;
}