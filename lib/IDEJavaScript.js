let combinedEditor;
let overlayDiv;
let autoRunDelay;
let autoRunEnabled = true;

window.onload = function () {
    initCodeMirror();
    setupEditorEvents();
    runCode();
    updateThemeUI();
    setupResponsiveHandling();
    createOverlay();
};

function createOverlay() {
    overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'absolute';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.zIndex = '5';
    overlayDiv.style.display = 'none';
    document.body.appendChild(overlayDiv);
}

function initCodeMirror() {
    combinedEditor = CodeMirror.fromTextArea(document.getElementById('combined-editor'), {
        mode: 'htmlmixed',
        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dracula' : 'eclipse',
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Tab": function (cm) {
                cm.replaceSelection("    ");
            }
        }
    });
}

function runCode() {
    let htmlCode = combinedEditor.getValue();
    document.getElementById('status-message').textContent = "Kod çalıştırıldı.";
    document.getElementById('result-status').textContent = "Yükleniyor...";
    let resultFrame = document.getElementById('result-frame');
    resultFrame.srcdoc = '';
    setTimeout(() => {
        let frameContent = resultFrame.contentWindow.document;
        frameContent.open();
        const scrollbarStyle = `
                <style>
                    ::-webkit-scrollbar { width: 10px; height: 10px; }
                    ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                    ::-webkit-scrollbar-thumb { background: #04AA6D; border-radius: 10px; transition: background 0.3s ease; }
                    ::-webkit-scrollbar-thumb:hover { background: #038857; }
                    * { scrollbar-width: thin; scrollbar-color: #04AA6D #f1f1f1; }
                </style>`;
        const headEndPos = htmlCode.indexOf('</head>');
        if (headEndPos !== -1) {
            htmlCode = htmlCode.substring(0, headEndPos) + scrollbarStyle + htmlCode.substring(headEndPos);
        } else {
            const htmlStartPos = htmlCode.indexOf('<html');
            if (htmlStartPos !== -1) {
                const htmlEndPos = htmlCode.indexOf('>', htmlStartPos) + 1;
                htmlCode = htmlCode.substring(0, htmlEndPos) + '\n<head>' + scrollbarStyle + '</head>' + htmlCode.substring(htmlEndPos);
            } else {
                htmlCode = '<html><head>' + scrollbarStyle + '</head>' + htmlCode + '</html>';
            }
        }
        frameContent.write(htmlCode);
        frameContent.close();
        resultFrame.onload = function () {
            document.getElementById('result-status').textContent = "";
            resultFrame.contentWindow.onerror = function (msg, url, line) {
                console.error(`Error in result: ${msg} at line ${line}`);
                document.getElementById('result-status').textContent = "Hata: " + msg;
            };
        };
    }, 50);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const newCodeMirrorTheme = newTheme === 'dark' ? 'dracula' : 'eclipse';
    document.getElementById('status-message').textContent = newTheme === 'dark' ? "Karanlık mod etkinleştirildi." : "Aydınlık mod etkinleştirildi.";
    html.setAttribute('data-theme', newTheme);
    combinedEditor.setOption('theme', newCodeMirrorTheme);
    updateThemeUI();
}

function updateThemeUI() {
    const c = document.documentElement.getAttribute('data-theme');
    const t = document.getElementById('theme-text');
    const i = document.getElementById('theme-icon');
    if (c === 'dark') {
        t.textContent = 'Aydınlık Mod';
        i.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
        t.textContent = 'Karanlık Mod';
        i.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    }
}

const resizer = document.getElementById('resizer');
const editorContainer = document.getElementById('editor-container');
const resultContainer = document.getElementById('result-container');
const container = document.querySelector('.container');
const resultFrame = document.getElementById('result-frame');
let isDragging = false;
let startX;
let startEditorWidth;

function setupResizer() {
    updateResizerPosition();
    resizer.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    resizer.addEventListener('touchstart', startDragTouch, { passive: true });
    document.addEventListener('touchmove', doDragTouch, { passive: false });
    document.addEventListener('touchend', stopDrag);
    resizer.addEventListener('dblclick', resetResizer);
}

function updateResizerPosition() {
    const containerWidth = container.offsetWidth;
    const editorWidth = editorContainer.offsetWidth;
    const percentage = (editorWidth / containerWidth) * 100;
    resizer.style.left = `${percentage}%`;
}

function startDrag(e) {
    isDragging = true;
    startX = e.clientX;
    startEditorWidth = editorContainer.offsetWidth;
    document.body.style.cursor = 'col-resize';
    resizer.classList.add('active');
    document.body.style.userSelect = 'none';
    resultFrame.style.pointerEvents = 'none';
    overlayDiv.style.display = 'block';
    e.preventDefault();
    resizer.style.transition = 'background-color 0.2s ease';
}

function startDragTouch(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startEditorWidth = editorContainer.offsetWidth;
        resizer.classList.add('active');
        document.body.style.userSelect = 'none';
        resultFrame.style.pointerEvents = 'none';
        overlayDiv.style.display = 'block';
    }
}

function doDrag(e) {
    if (!isDragging) return;
    const containerWidth = container.offsetWidth;
    const dx = e.clientX - startX;
    const newWidth = startEditorWidth + dx;
    let percentage = (newWidth / containerWidth) * 100;
    percentage = Math.max(20, Math.min(80, percentage));
    editorContainer.style.width = `${percentage}%`;
    resultContainer.style.width = `${100 - percentage}%`;
    resizer.style.left = `${percentage}%`;
    const dragPercent = Math.round(percentage);
    document.getElementById('status-message').textContent = `Bölücü: ${dragPercent}%`;
    e.preventDefault();
}

function doDragTouch(e) {
    if (!isDragging || e.touches.length !== 1) return;
    const containerWidth = container.offsetWidth;
    const dx = e.touches[0].clientX - startX;
    const newWidth = startEditorWidth + dx;
    let percentage = (newWidth / containerWidth) * 100;
    percentage = Math.max(20, Math.min(80, percentage));
    editorContainer.style.width = `${percentage}%`;
    resultContainer.style.width = `${100 - percentage}%`;
    resizer.style.left = `${percentage}%`;
    const dragPercent = Math.round(percentage);
    document.getElementById('status-message').textContent = `Bölücü: ${dragPercent}%`;
    e.preventDefault();
}

function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = '';
    resizer.classList.remove('active');
    document.body.style.userSelect = '';
    resultFrame.style.pointerEvents = 'auto';
    overlayDiv.style.display = 'none';
    refreshEditor();
    setTimeout(() => {
        resizer.style.transition = '';
    }, 200);
}

function refreshEditor() {
    combinedEditor.refresh();
}

function resetResizer() {
    editorContainer.style.transition = 'width 0.3s ease-in-out';
    resultContainer.style.transition = 'width 0.3s ease-in-out';
    resizer.style.transition = 'left 0.3s ease-in-out';
    editorContainer.style.width = '50%';
    resultContainer.style.width = '50%';
    resizer.style.left = '50%';
    document.getElementById('status-message').textContent = "Bölücü sıfırlandı.";
    resizer.style.backgroundColor = 'rgba(79, 70, 229, 1)';
    setTimeout(() => {
        resizer.style.backgroundColor = '';
        setTimeout(() => {
            editorContainer.style.transition = '';
            resultContainer.style.transition = '';
            resizer.style.transition = '';
        }, 300);
    }, 300);
    refreshEditor();
}

function setupResponsiveHandling() {
    setupResizer();
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 768) {
            editorContainer.style.width = '';
            resultContainer.style.width = '';
            resizer.style.display = 'none';
        } else {
            resizer.style.display = 'block';
            if (!editorContainer.style.width) {
                resetResizer();
            } else {
                updateResizerPosition();
            }
        }
        refreshEditor();
        setTimeout(runCode, 300);
    });
    if (window.innerWidth <= 768) {
        editorContainer.style.width = '';
        resultContainer.style.width = '';
        resizer.style.display = 'none';
    }
}

function setupEditorEvents() {
    combinedEditor.on('keydown', function (cm, event) {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveCodeToFile();
        }
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            runCode();
        }
    });
}

function saveCodeToFile() {
    const code = combinedEditor.getValue();
    const codeBlob = new Blob([code], { type: 'text/plain' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(codeBlob);
    downloadLink.download = 'code.html';
    downloadLink.click();
    document.getElementById('status-message').textContent = "Kod kaydedildi.";
    document.getElementById('result-status').textContent = "Dosya indirildi";
    setTimeout(() => {
        document.getElementById('result-status').textContent = "";
    }, 2000);
}