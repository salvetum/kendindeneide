const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
    <title>Sayfa Başlığı</title>
    <style>
        body { 
            font-family: sans-serif;
            background-color: #f0f8ff; 
            color: #333;
            margin: 0;
            padding: 1rem;
            text-align: center;
        }
        h1 {
            color: #2c3e50;
            margin-top: 0;
        }
        button {
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #2980b9;
        }
    </style>
</head>
<body>

    <h1>Merhaba Dünya!</h1>
    <p>Bu Bir Paragraf!</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.</p>
    <p id="demo">JavaScript sonucu burada görünecek.</p>
    <button onclick="myFunction()">Bana Tıkla</button>

    <script>
        function myFunction() {
            document.getElementById("demo").innerHTML = "Harika, JavaScript çalıştı!";
        }
    <\/script>
</body>
</html>`;


document.addEventListener('DOMContentLoaded', () => {
    const requiredLibs = [
        'CodeMirror', 'JSHINT', 'CSSLint', 'HTMLHint',
        () => window.prettier,
        () => window.prettierPlugins?.html,
        () => window.prettierPlugins?.postcss,
        () => window.prettierPlugins?.babel
    ];

    const libsLoaded = requiredLibs.every(lib => {
        try {
            const libObject = typeof lib === 'function' ? lib() : window[lib];
            return typeof libObject !== 'undefined' && libObject !== null;
        } catch (e) {
            return false;
        }
    });

    if (!libsLoaded) {
        document.getElementById('error-overlay').style.display = 'flex';
        console.error("Gerekli kütüphanelerden biri veya birkaçı yüklenemedi.");
        return;
    }

    // --- STATE ---
    let codeEditor, htmlEditor, cssEditor, jsEditor;
    let autoRunTimeout;
    let isViewSeparated = false;
    let selectedLibraries = [];

    // --- DOM ELEMENTS CACHE ---
    const dom = {
        header: document.querySelector('.header'),
        editorContainer: document.getElementById('editor-container'),
        resultContainer: document.getElementById('result-container'),
        resizer: document.getElementById('resizer'),
        resultFrame: document.getElementById('result-frame'),
        combinedView: document.getElementById('combined-view'),
        separatedView: document.getElementById('separated-view'),
        separateBtnText: document.getElementById('separate-btn-text'),
        editorTabsContainer: document.querySelector('.editor-tabs'),
        confirmModal: document.getElementById('confirm-modal'),
        settingsModal: document.getElementById('settings-modal'),
        settingsGrid: document.getElementById('settings-grid'),
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastMessage: document.getElementById('toast-message'),
        themeBtn: document.getElementById('theme-btn'),
    };

    // --- CONSTANTS ---
    const LIBRARIES = {
        jQuery: { js: 'https://code.jquery.com/jquery-3.7.1.min.js', name: 'jQuery' },
        bootstrap: { css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js', name: 'Bootstrap 5' },
        react: { js: ['https://unpkg.com/react@18/umd/react.development.js', 'https://unpkg.com/react-dom@18/umd/react-dom.development.js'], name: 'React' },
        vue: { js: 'https://unpkg.com/vue@3/dist/vue.global.js', name: 'Vue.js' }
    };
    const ICONS = {
        light: `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        dark: `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        success: `<svg class="toast-icon" style="color: var(--green);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        info: `<svg class="toast-icon" style="color: var(--blue);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        warning: `<svg class="toast-icon" style="color: var(--orange);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    };

    // --- GENERAL FUNCTIONS ---
    function createEditor(textareaId, mode) {
        const lintOptions = { "esversion": 2021, "globals": { "document": true, "window": true, "console": true, ...Object.fromEntries(Object.keys(LIBRARIES).map(k => [k, false])) } };
        const editor = CodeMirror.fromTextArea(document.getElementById(textareaId), {
            mode: mode, theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dracula' : 'eclipse',
            lineNumbers: true, autoCloseTags: true, autoCloseBrackets: true, lineWrapping: true,
            highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers"],
            lint: mode === 'javascript' ? { options: lintOptions } : true
        });
        const debouncedLint = debounce(() => editor.performLint(), 300);
        editor.on('change', () => {
            const autoRunCheckbox = document.querySelector('.setting-item[data-key="autoRunEnabled"]');
            const saveCheckbox = document.querySelector('.setting-item[data-key="saveCodeEnabled"]');
            if (saveCheckbox && saveCheckbox.classList.contains('active')) saveCode();
            if (autoRunCheckbox && autoRunCheckbox.classList.contains('active')) {
                clearTimeout(autoRunTimeout);
                autoRunTimeout = setTimeout(() => runCode(true), 500);
            }
            debouncedLint();
        });
        return editor;
    }

    function getFullCode() {
        let htmlCode, cssCode, jsCode;
        if (isViewSeparated) {
            htmlCode = htmlEditor.getValue(); cssCode = cssEditor.getValue(); jsCode = jsEditor.getValue();
        } else {
            const parsed = parseFullCode(codeEditor.getValue());
            htmlCode = parsed.htmlCode; cssCode = parsed.cssCode; jsCode = parsed.jsCode;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlCode, "text/html");
            doc.head.querySelectorAll('style').forEach(el => el.remove());
            doc.body.querySelectorAll('script:not([src])').forEach(el => el.remove());

            let headContent = '', bodyContent = '';
            selectedLibraries.forEach(libKey => {
                const lib = LIBRARIES[libKey];
                if (lib.css) headContent += `<link rel="stylesheet" href="${lib.css}">\n`;
                if (lib.js) {
                    const scripts = Array.isArray(lib.js) ? lib.js : [lib.js];
                    scripts.forEach(url => bodyContent += `<script src="${url}"><\/script>\n`);
                }
            });

            headContent += `<style>${cssCode}</style>`;
            bodyContent += `<script>${jsCode}<\/script>`;

            doc.head.innerHTML += headContent;
            doc.body.innerHTML += bodyContent;

            return `<!DOCTYPE html>\n` + doc.documentElement.outerHTML;
        } catch (e) { console.error("Tam kod oluşturulurken hata oluştu:", e); return ``; }
    }

    function saveCode() {
        try { localStorage.setItem('liveCodeEditorContent', getFullCode()); }
        catch (e) { console.error("Kod kaydedilemedi:", e); showToast("Kod kaydedilemedi, depolama dolu olabilir.", "warning"); }
    }

    function runCode(isSilent = false) {
        dom.resultFrame.srcdoc = getFullCode();
        if (!isSilent) showToast('Kod çalıştırıldı', 'success');
    }

    function format(code, parserName) {
        try {
            return prettier.format(code, { parser: parserName, plugins: prettierPlugins, printWidth: 100 });
        } catch (e) {
            console.error(`${parserName} için Prettier biçimlendirme başarısız oldu:`, e);
            showToast(`${parserName.toUpperCase()} biçimlendirilemedi.`, 'warning');
            return code;
        }
    }

    function formatCode() {
        if (isViewSeparated) {
            htmlEditor.setValue(format(htmlEditor.getValue(), "html"));
            cssEditor.setValue(format(cssEditor.getValue(), "css"));
            jsEditor.setValue(format(jsEditor.getValue(), "babel"));
        } else {
            codeEditor.setValue(format(codeEditor.getValue(), "html"));
        }
        showToast('Kod biçimlendirildi', 'success');
    }

    function revertCode() {
        showConfirmationModal('Tüm değişiklikleri geri almak istediğinizden emin misiniz?', () => {
            if (isViewSeparated) {
                const { htmlCode, cssCode, jsCode } = parseFullCode(DEFAULT_CODE);
                htmlEditor.setValue(htmlCode); cssEditor.setValue(cssCode); jsEditor.setValue(jsCode);
            } else {
                codeEditor.setValue(DEFAULT_CODE);
            }
            runCode(true);
            showToast('Değişiklikler geri alındı', 'info');
        });
    }

    function parseFullCode(fullCode) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullCode, "text/html");
        const cssCode = Array.from(doc.head.querySelectorAll('style')).map(s => s.textContent).join('\n');
        const jsCode = Array.from(doc.body.querySelectorAll('script:not([src])')).map(s => s.textContent).join('\n');
        doc.head.querySelectorAll('style').forEach(s => s.remove());
        doc.body.querySelectorAll('script:not([src])').forEach(s => s.remove());
        const doctype = fullCode.toLowerCase().startsWith('<!doctype html>') ? '<!DOCTYPE html>\n' : '';
        const htmlCode = doctype + doc.documentElement.outerHTML;
        return { htmlCode, cssCode, jsCode };
    }

    function toggleSeparateView() {
        isViewSeparated = !isViewSeparated;
        if (isViewSeparated) {
            const { htmlCode, cssCode, jsCode } = parseFullCode(codeEditor.getValue());
            if (!htmlEditor) htmlEditor = createEditor('html-editor', 'text/html');
            if (!cssEditor) cssEditor = createEditor('css-editor', 'css');
            if (!jsEditor) jsEditor = createEditor('js-editor', 'javascript');

            htmlEditor.setValue(format(htmlCode, "html"));
            cssEditor.setValue(format(cssCode, "css"));
            jsEditor.setValue(format(jsCode, "babel"));

            dom.combinedView.style.display = 'none'; dom.separatedView.style.display = 'flex';
            dom.separateBtnText.textContent = 'Birleştir';
            setActiveTab('html');
        } else {
            codeEditor.setValue(format(getFullCode(), "html"));
            dom.separatedView.style.display = 'none'; dom.combinedView.style.display = 'flex';
            dom.separateBtnText.textContent = 'Dilleri Ayır';
            setTimeout(() => codeEditor.refresh(), 1);
        }
    }

    function setActiveTab(editorName) {
        dom.editorTabsContainer.querySelector('.tab-button.active')?.classList.remove('active');
        document.querySelector('.editor-pane.active')?.classList.remove('active');

        dom.editorTabsContainer.querySelector(`[data-editor="${editorName}"]`).classList.add('active');
        document.getElementById(`${editorName}-pane`).classList.add('active');

        const editors = { html: htmlEditor, css: cssEditor, js: jsEditor };
        setTimeout(() => { editors[editorName]?.refresh(); editors[editorName]?.performLint(); }, 1);
    }

    function addEventListeners() {
        dom.header.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            switch (button.id) {
                case 'run-btn': runCode(false); break;
                case 'format-btn': formatCode(); break;
                case 'separate-btn': toggleSeparateView(); break;
                case 'save-btn': saveFile(); break;
                case 'revert-btn': revertCode(); break;
                case 'clear-btn': dom.resultFrame.srcdoc = 'about:blank'; showToast('Sonuç temizlendi', 'info'); break;
                case 'settings-btn': openModal(dom.settingsModal); break;
                case 'theme-btn': toggleTheme(); break;
            }
        });

        dom.settingsGrid.addEventListener('click', e => {
            const item = e.target.closest('.setting-item');
            if (!item) return;

            item.classList.toggle('active');
            const isActive = item.classList.contains('active');
            const key = item.dataset.key;

            if (item.dataset.type === 'app') {
                localStorage.setItem(key, isActive);
                const label = item.textContent.trim();
                showToast(`${label} ${isActive ? 'açıldı' : 'kapatıldı'}.`, isActive ? 'success' : 'info');
                if (key === 'saveCodeEnabled' && !isActive) {
                    localStorage.removeItem('liveCodeEditorContent');
                    localStorage.removeItem('selectedLibraries');
                    selectedLibraries = [];
                    initSettings(); // Refresh settings UI
                }
            } else {
                selectedLibraries = [...dom.settingsGrid.querySelectorAll('.setting-item[data-type="library"].active')].map(el => el.dataset.key);
                localStorage.setItem('selectedLibraries', JSON.stringify(selectedLibraries));
                const autoRunActive = document.querySelector('.setting-item[data-key="autoRunEnabled"]')?.classList.contains('active');
                if (autoRunActive) runCode(true);
            }
        });

        dom.editorTabsContainer.addEventListener('click', (e) => {
            const editorName = e.target.closest('.tab-button')?.dataset.editor;
            if (editorName) setActiveTab(editorName);
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                if (e.key.toLowerCase() === 'r' && !e.altKey) { e.preventDefault(); runCode(false); }
                if (e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); formatCode(); }
                if (e.altKey && e.key.toLowerCase() === 'r') { e.preventDefault(); revertCode(); }
            }
        });

        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.modal-close-btn')) {
                    closeModal(modal);
                }
            });
        });
    }

    function saveFile() {
        const blob = new Blob([getFullCode()], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'index.html';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('Dosya başarıyla indirildi', 'success');
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeUI(savedTheme);
    }

    function toggleTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI(newTheme);
    }

    function updateThemeUI(theme) {
        dom.themeBtn.innerHTML = theme === 'dark' ? ICONS.light : ICONS.dark;
        const themeName = theme === 'dark' ? 'dracula' : 'eclipse';
        [codeEditor, htmlEditor, cssEditor, jsEditor].forEach(editor => {
            if (editor) editor.setOption('theme', themeName);
        });
    }

    function initResizer() {
        let isDragging = false;

        dom.resizer.addEventListener('mousedown', (e) => {
            isDragging = true;
            dom.resultFrame.style.pointerEvents = 'none';
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const containerRect = dom.editorContainer.parentElement.getBoundingClientRect();
                let newEditorWidth = moveEvent.clientX - containerRect.left;

                newEditorWidth = Math.max(150, Math.min(newEditorWidth, containerRect.width - 150));
                dom.editorContainer.style.flex = `0 0 ${newEditorWidth}px`;
                dom.resultContainer.style.flex = '1 1 auto';
            };

            const onMouseUp = () => {
                isDragging = false;
                dom.resultFrame.style.pointerEvents = 'auto';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                [codeEditor, htmlEditor, cssEditor, jsEditor].forEach(ed => ed?.refresh());
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        dom.resizer.addEventListener('dblclick', () => {
            dom.editorContainer.style.flex = '';
            dom.resultContainer.style.flex = '';
            setTimeout(() => [codeEditor, htmlEditor, cssEditor, jsEditor].forEach(ed => ed?.refresh()), 1);
        });
    }

    function initSettings() {
        dom.settingsGrid.innerHTML = '';

        const appSettingsTitle = document.createElement('h4');
        appSettingsTitle.className = 'settings-subtitle';
        appSettingsTitle.textContent = 'Uygulama Ayarları';
        dom.settingsGrid.appendChild(appSettingsTitle);

        const appSettings = [
            { id: 'save-toggle-checkbox', label: 'Kodu Sakla', key: 'saveCodeEnabled' },
            { id: 'autorun-checkbox', label: 'Oto-Çalıştır', key: 'autoRunEnabled' },
        ];

        appSettings.forEach(setting => {
            const isChecked = localStorage.getItem(setting.key) === 'true';
            const item = document.createElement('div');
            item.className = `setting-item ${isChecked ? 'active' : ''}`;
            item.id = setting.id;
            item.dataset.key = setting.key;
            item.dataset.type = 'app';
            item.textContent = setting.label;
            dom.settingsGrid.appendChild(item);
        });

        dom.settingsGrid.appendChild(document.createElement('hr')).className = 'settings-divider';

        const libTitle = document.createElement('h4');
        libTitle.className = 'settings-subtitle';
        libTitle.textContent = 'Kütüphaneler';
        dom.settingsGrid.appendChild(libTitle);

        const useSavedLibs = localStorage.getItem('saveCodeEnabled') === 'true';
        selectedLibraries = useSavedLibs ? (JSON.parse(localStorage.getItem('selectedLibraries')) || []) : [];

        Object.entries(LIBRARIES).forEach(([key, lib]) => {
            const isChecked = selectedLibraries.includes(key);
            const item = document.createElement('div');
            item.className = `setting-item ${isChecked ? 'active' : ''}`;
            item.id = `lib-${key}`;
            item.dataset.key = key;
            item.dataset.type = 'library';
            item.textContent = lib.name;
            dom.settingsGrid.appendChild(item);
        });
    }

    function showToast(message, type = 'info') {
        if (dom.toast.classList.contains('show')) return;
        dom.toastMessage.textContent = message;
        dom.toastIcon.innerHTML = ICONS[type] || ICONS.info;
        dom.toast.classList.add("show");
        setTimeout(() => dom.toast.classList.remove("show"), 3000);
    }

    function openModal(modal) {
        modal.classList.add('show');
    }

    function closeModal(modal) {
        modal.classList.remove('show');
    }

    function showConfirmationModal(message, onConfirm) {
        const modal = dom.confirmModal;
        modal.querySelector('#modal-message').textContent = message;
        openModal(modal);

        const confirmBtn = modal.querySelector('#modal-confirm-btn');
        const cancelBtn = modal.querySelector('#modal-cancel-btn');

        const cleanup = () => {
            closeModal(modal);
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
        };
        const confirmHandler = () => { cleanup(); onConfirm(); };
        const cancelHandler = () => cleanup();

        confirmBtn.addEventListener('click', confirmHandler, { once: true });
        cancelBtn.addEventListener('click', cancelHandler, { once: true });
    }

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    function init() {
        initSettings();

        codeEditor = createEditor('code-editor', 'htmlmixed');
        const useSavedCode = localStorage.getItem('saveCodeEnabled') === 'true';
        const savedCode = localStorage.getItem('liveCodeEditorContent');
        codeEditor.setValue((useSavedCode && savedCode) ? savedCode : DEFAULT_CODE);

        initTheme();
        initResizer();
        addEventListeners();
        runCode(true);
    }

    requestAnimationFrame(init);
});