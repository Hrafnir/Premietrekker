/* Version: #4 */
/* === KONFIGURASJON === */
const STORAGE_KEY = 'prizeApp_v1_state';

// DOM Elementer
const els = {
    inputParticipants: document.getElementById('participant-input'),
    inputPrizes: document.getElementById('prize-input'),
    countParticipants: document.getElementById('participant-count'),
    countPrizes: document.getElementById('prize-count'),
    chkAllowRepeat: document.getElementById('allow-repeat-winners'),
    btnSave: document.getElementById('save-data-btn'),
    btnReset: document.getElementById('reset-all-btn'),
    
    // Trekning
    displayCurrentPrize: document.getElementById('current-prize-display'),
    btnDraw: document.getElementById('draw-btn'),
    decisionArea: document.getElementById('decision-area'),
    displayCandidate: document.getElementById('candidate-display'),
    btnConfirm: document.getElementById('confirm-btn'),
    btnSkip: document.getElementById('skip-btn'),
    
    // Historikk
    tableBody: document.getElementById('winners-list')
};

// State (Holder styr på midlertidig kandidat før bekreftelse)
let currentCandidate = null;

/* === INITIALISERING === */
function init() {
    console.log("App starter (Versjon #4)...");
    loadState();
    updateCounts();
    updateCurrentPrizeDisplay(); // Sørg for at visningen er korrekt ved start
    
    // Event Listeners for Inputs (Auto-lagring)
    els.inputParticipants.addEventListener('input', () => {
        updateCounts();
        updateCurrentPrizeDisplay(); // Kan påvirke om knappen er aktiv
        saveState();
    });
    
    els.inputPrizes.addEventListener('input', () => {
        updateCounts();
        updateCurrentPrizeDisplay();
        saveState();
    });
    
    els.chkAllowRepeat.addEventListener('change', saveState);

    // Knapper
    els.btnDraw.addEventListener('click', handleDraw);
    els.btnConfirm.addEventListener('click', handleConfirm);
    els.btnSkip.addEventListener('click', handleSkip);
    els.btnReset.addEventListener('click', handleReset);
    els.btnSave.addEventListener('click', () => {
        saveState();
        alert('Data er lagret manuelt!');
    });
}

/* === HJELPEFUNKSJONER FOR LISTER === */
function getList(textareaElement) {
    // Splitter på linjeskift, trimmer mellomrom, og fjerner tomme linjer
    return textareaElement.value.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
}

function setList(textareaElement, array) {
    textareaElement.value = array.join('\n');
}

function updateCounts() {
    const pList = getList(els.inputParticipants);
    const prList = getList(els.inputPrizes);
    
    els.countParticipants.textContent = pList.length;
    els.countPrizes.textContent = prList.length;
}

function updateCurrentPrizeDisplay() {
    const prizes = getList(els.inputPrizes);
    const participants = getList(els.inputParticipants);
    
    // Logikk:
    // Hvis det er premier i lista, vis den øverste.
    // Hvis lista er tom, vis generisk "Gevinst #X".
    // Knappen deaktiveres KUN hvis det ikke er deltakere igjen.

    let displayText = "";
    let buttonText = "TREKK VINNER";
    let isDisabled = false;

    if (participants.length === 0) {
        displayText = "Ingen deltakere igjen";
        buttonText = "Mangler deltakere";
        isDisabled = true;
    } else if (prizes.length > 0) {
        displayText = prizes[0];
    } else {
        // Generisk modus
        // Antall vinnere hittil er lik antall rader i tabellen
        // Siden vi prepender (legger til øverst), er length korrekt antall
        // Men vi må telle antall <tr> i tbody
        const winnerCount = els.tableBody.querySelectorAll('tr').length;
        displayText = `Gevinst #${winnerCount + 1}`;
    }

    els.displayCurrentPrize.textContent = displayText;
    els.btnDraw.disabled = isDisabled;
    els.btnDraw.textContent = buttonText;
}

/* === LOCAL STORAGE === */
function saveState() {
    const state = {
        participants: els.inputParticipants.value,
        prizes: els.inputPrizes.value,
        allowRepeat: els.chkAllowRepeat.checked,
        history: els.tableBody.innerHTML
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log("State lagret til LocalStorage.");
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const state = JSON.parse(raw);
            els.inputParticipants.value = state.participants || '';
            els.inputPrizes.value = state.prizes || '';
            els.chkAllowRepeat.checked = state.allowRepeat || false;
            els.tableBody.innerHTML = state.history || '';
            console.log("State lastet inn.");
        } catch (e) {
            console.error("Feil ved lasting av state:", e);
        }
    }
}

/* === LOGIKK FOR TREKNING === */

function handleDraw() {
    const participants = getList(els.inputParticipants);
    // Vi sjekker ikke prizes.length her lenger, siden det er valgfritt.

    if (participants.length === 0) {
        alert("Ingen deltakere igjen i listen!");
        return;
    }

    // 1. Velg tilfeldig vinner
    const randomIndex = Math.floor(Math.random() * participants.length);
    currentCandidate = participants[randomIndex];

    console.log(`Trakk indeks ${randomIndex} av ${participants.length}: ${currentCandidate}`);

    // 2. Oppdater UI
    els.displayCandidate.textContent = currentCandidate;
    
    els.decisionArea.classList.remove('hidden');
    els.btnDraw.classList.add('hidden');
    
    els.decisionArea.scrollIntoView({ behavior: 'smooth' });
}

function handleConfirm() {
    if (!currentCandidate) return;

    const prizes = getList(els.inputPrizes);
    let currentPrizeName = "";

    // Sjekk om vi bruker premieliste eller generisk teller
    if (prizes.length > 0) {
        // Hent og fjern premie fra listen
        currentPrizeName = prizes[0];
        prizes.shift();
        setList(els.inputPrizes, prizes);
    } else {
        // Generisk navn
        const winnerCount = els.tableBody.querySelectorAll('tr').length;
        currentPrizeName = `Gevinst #${winnerCount + 1}`;
    }

    console.log(`Godkjenner vinner: ${currentCandidate} for premie: ${currentPrizeName}`);

    // 1. Legg til i historikk
    addToHistory(currentPrizeName, currentCandidate);

    // 2. Oppdater deltakerliste (hvis ikke repetisjon er tillatt)
    if (!els.chkAllowRepeat.checked) {
        const participants = getList(els.inputParticipants);
        const indexToRemove = participants.indexOf(currentCandidate);
        if (indexToRemove > -1) {
            participants.splice(indexToRemove, 1);
            setList(els.inputParticipants, participants);
            console.log("Fjernet vinner fra deltakerlisten.");
        }
    }

    // 3. Reset UI og Lagre
    resetDrawArea();
    updateCounts(); // Oppdaterer tellere for lister
    updateCurrentPrizeDisplay(); // Oppdaterer "Nåværende premie" teksten
    saveState();
}

function handleSkip() {
    console.log(`Hoppet over kandidat: ${currentCandidate}`);
    resetDrawArea();
}

function resetDrawArea() {
    currentCandidate = null;
    els.decisionArea.classList.add('hidden');
    els.btnDraw.classList.remove('hidden');
    els.displayCandidate.textContent = "...";
}

/* === HISTORIKK LOGIKK === */
function addToHistory(prize, winner) {
    const row = document.createElement('tr');
    
    // Vi må telle eksisterende rader for å få riktig # nummer i tabellen
    const currentCount = els.tableBody.querySelectorAll('tr').length;
    const nextNum = currentCount + 1;
    
    const time = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
        <td>${nextNum}</td>
        <td><strong>${prize}</strong></td>
        <td>${winner}</td>
        <td>${time}</td>
    `;
    
    // Prepend legger den øverst
    els.tableBody.prepend(row);
}

function handleReset() {
    if (confirm("Er du sikker på at du vil slette ALL historikk og nullstille feltene? Dette kan ikke angres.")) {
        localStorage.removeItem(STORAGE_KEY);
        els.inputParticipants.value = '';
        els.inputPrizes.value = '';
        els.tableBody.innerHTML = '';
        els.chkAllowRepeat.checked = false;
        
        updateCounts();
        updateCurrentPrizeDisplay();
        resetDrawArea();
        
        console.log("App nullstilt.");
    }
}

// Start appen
init();
/* Version: #4 */
