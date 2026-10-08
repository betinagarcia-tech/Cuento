// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const bookContainer = document.getElementById('flip-book');
const interactiveContainer = document.getElementById('interactive-container');
const loading = document.getElementById('loading');
const pageNumDisplay = document.getElementById('page-num-display');

// Botones
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnRead = document.getElementById('btn-read');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');

let pageFlip = null;
let pdfDoc = null;
let zoomLevel = 1;
const DEFAULT_PDF_URL = 'cuento.pdf'; // Archivo en la raíz del repositorio

// Cargar el cuento automáticamente al abrir la página
window.addEventListener('DOMContentLoaded', () => {
    autoLoadPDF(DEFAULT_PDF_URL);
});

async function autoLoadPDF(url) {
    loading.style.display = 'block';
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        await buildFlipBook();
    } catch (error) {
        console.error('Error al cargar cuento.pdf:', error);
        loading.innerText = 'No se encontró el cuento en el repositorio (cuento.pdf).';
    }
}

async function buildFlipBook() {
    const totalPages = pdfDoc.numPages;
    bookContainer.innerHTML = '';

    const firstPage = await pdfDoc.getPage(1);
    const viewportInfo = firstPage.getViewport({ scale: 1.5 });
    const pageWidth = viewportInfo.width;
    const pageHeight = viewportInfo.height;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.appendChild(canvas);

        bookContainer.appendChild(pageDiv);
    }

    bookContainer.style.display = 'block';

    pageFlip = new St.PageFlip(bookContainer, {
        width: pageWidth,
        height: pageHeight,
        size: "stretch",
        minWidth: 300,
        maxWidth: pageWidth,
        minHeight: 400,
        maxHeight: pageHeight,
        showCover: true,
        maxShadowOpacity: 0.5,
        usePortrait: true
    });

    const pages = document.querySelectorAll('.page');
    pageFlip.loadFromHTML(pages);

    loading.style.display = 'none';
    updatePageNumber();

    // Evento al pasar de página
    pageFlip.on('flip', (e) => {
        updatePageNumber();
        playPageSound();
        createFairyDust();
        // Detener la lectura si estaba leyendo al cambiar de página
        window.speechSynthesis.cancel();
    });
}

function updatePageNumber() {
    if (pageFlip) {
        const current = pageFlip.getCurrentPageIndex() + 1;
        const total = pageFlip.getPageCount();
        pageNumDisplay.innerText = `Página ${current} de ${total}`;
    }
}

// Controls de Navegación
btnPrev.addEventListener('click', () => {
    if (pageFlip) pageFlip.flipPrev();
});

btnNext.addEventListener('click', () => {
    if (pageFlip) pageFlip.flipNext();
});

// Agrandar / Achicar visor
btnZoomIn.addEventListener('click', () => {
    if (zoomLevel < 1.6) {
        zoomLevel += 0.15;
        interactiveContainer.style.transform = `scale(${zoomLevel})`;
    }
});

btnZoomOut.addEventListener('click', () => {
    if (zoomLevel > 0.7) {
        zoomLevel -= 0.15;
        interactiveContainer.style.transform = `scale(${zoomLevel})`;
    }
});

// Lectura en voz alta (Texto a Voz)
btnRead.addEventListener('click', async () => {
    if (!pdfDoc || !pageFlip) return;

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
    }

    const pageIdx = pageFlip.getCurrentPageIndex() + 1;
    const page = await pdfDoc.getPage(pageIdx);
    const textContent = await page.getTextContent();
    const textText = textContent.items.map(item => item.str).join(' ');

    if (!textText.trim()) {
        speakText("Esta página no contiene texto reconocible para leer.");
        return;
    }

    speakText(textText);
});

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Velocidad ligeramente más pausada para niños
    window.speechSynthesis.speak(utterance);
}

// Efecto de Sonido Sintetizado
function playPageSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
        // Soporte de audio deshabilitado o no interactuado
    }
}

// Efecto Mágico: Polvo de Hadas / Estrellitas
function createFairyDust() {
    const stars = ['✨', '⭐', '🌟', '💫'];
    const container = interactiveContainer;
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < 20; i++) {
        const star = document.createElement('span');
        star.className = 'sparkle';
        star.innerText = stars[Math.floor(Math.random() * stars.length)];

        // Posición inicial (centro del libro)
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;

        // Desplazamiento aleatorio hacia afuera
        const xDir = (Math.random() - 0.5) * 400;
        const yDir = (Math.random() - 0.5) * 400;

        star.style.setProperty('--x', `${xDir}px`);
        star.style.setProperty('--y', `${yDir}px`);

        document.body.appendChild(star);

        setTimeout(() => {
            star.remove();
        }, 1200);
    }
}