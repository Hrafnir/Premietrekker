/* Version: #3 */
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
    console.log("App starter...");
    loadState();
    updateCounts();
    updateCurrentPrizeDisplay();
    
    // Event Listeners for Inputs (Auto-lagring)
    els.inputParticipants.addEventListener('input', () => {
        updateCounts();
        saveState();
    });
    
    els.inputPrizes.addEventListener('input', () => {
        updateCounts();
        updateCurrentPrizeDisplay(); // Oppdater visning hvis premie endres manuelt
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
    if (prizes.length > 0) {
        els.displayCurrentPrize.textContent = prizes[0]; // Viser øverste premie
        els.btnDraw.disabled = false;
        els.btnDraw.textContent = "TREKK VINNER";
    } else {
        els.displayCurrentPrize.textContent = "Ingen flere premier!";
        els.btnDraw.disabled = true;
        els.btnDraw.textContent = "FERDIG";
    }
}

/* === LOCAL STORAGE === */
function saveState() {
    const state = {
        participants: els.inputParticipants.value,
        prizes: els.inputPrizes.value,
        allowRepeat: els.chkAllowRepeat.checked,
        history: els.tableBody.innerHTML // Lagrer hele HTML-en for tabellen for enkelhetens skyld
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
    const prizes = getList(els.inputPrizes);

    // Validering
    if (prizes.length === 0) {
        alert("Ingen premier igjen å trekke!");
        return;
    }
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
    
    // Vis beslutningsområdet, skjul trekk-knappen midlertidig
    els.decisionArea.classList.remove('hidden');
    els.btnDraw.classList.add('hidden');
    
    // Scroll til resultatet
    els.decisionArea.scrollIntoView({ behavior: 'smooth' });
}

function handleConfirm() {
    if (!currentCandidate) return;

    const prizes = getList(els.inputPrizes);
    const currentPrize = prizes[0]; // Henter premien vi nettopp trakk for

    console.log(`Godkjenner vinner: ${currentCandidate} for premie: ${currentPrize}`);

    // 1. Legg til i historikk
    addToHistory(currentPrize, currentCandidate);

    // 2. Oppdater premieliste (Fjern den øverste)
    prizes.shift(); 
    setList(els.inputPrizes, prizes);

    // 3. Oppdater deltakerliste (hvis ikke repetisjon er tillatt)
    if (!els.chkAllowRepeat.checked) {
        const participants = getList(els.inputParticipants);
        // Finn index til kandidaten og fjern kun den ene forekomsten
        // (Hvis det er duplikater i input, fjerner vi bare en av dem for å være trygg)
        const indexToRemove = participants.indexOf(currentCandidate);
        if (indexToRemove > -1) {
            participants.splice(indexToRemove, 1);
            setList(els.inputParticipants, participants);
            console.log("Fjernet vinner fra deltakerlisten.");
        }
    }

    // 4. Reset UI og Lagre
    resetDrawArea();
    updateCounts();
    updateCurrentPrizeDisplay();
    saveState();
}

function handleSkip() {
    console.log(`Hoppet over kandidat: ${currentCandidate}`);
    // Vi gjør ingenting med listene, bare resetter visningen slik at man kan trekke på nytt
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
    const count = els.tableBody.children.length + 1;
    const time = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
        <td>${count}</td>
        <td><strong>${prize}</strong></td>
        <td>${winner}</td>
        <td>${time}</td>
    `;
    
    // Legg til øverst i listen for synlighet, eller nederst? Vanligvis nederst.
    // Men for speaker er det ofte greit å se den siste øverst.
    // La oss legge den øverst (prepend) slik at den nyeste alltid er synlig uten å scrolle ned.
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
/* Version: #3 */
