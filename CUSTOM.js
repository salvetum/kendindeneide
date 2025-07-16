// DEFAULT_CODE sabitini kaldırdık, bunun yerine getTranslatedDefaultCode() fonksiyonunu kullanacağız.
// const DEFAULT_CODE = `...`; 

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
        document.getElementById('error-refresh-btn').addEventListener('click', () => {
            location.reload();
        });
        
        return;
    }
    
    // --- STATE ---
    let codeEditor, htmlEditor, cssEditor, jsEditor;
    let autoRunTimeout;
    let isViewSeparated = false;
    let selectedLibraries = [];
    let currentLang = 'tr'; // Varsayılan dil

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
        infoModal: document.getElementById('info-modal'), // YENİ
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
    // DİL ÇEVİRİLERİ
    const STRINGS = {
        tr: {
            title: "Dene ve Öğren!",
            logoText: "Dene ve Öğren!",
            run: "Çalıştır",
            format: "Biçimlendir",
            separate: "Dilleri Ayır",
            combine: "Birleştir",
            save: "Kaydet",
            revert: "Geri Al",
            clear: "Temizle",
            runTooltip: "Kodu Çalıştır (Ctrl+R)",
            formatTooltip: "Kodu Biçimlendir (Ctrl+Shift+F)",
            separateTooltip: "Kodları Ayır",
            saveTooltip: "Dosyayı Kaydet (Ctrl+S)",
            revertTooltip: "Değişiklikleri Geri Al (Ctrl+Alt+R)",
            clearTooltip: "Sonucu Temizle",
            infoTooltip: "Bilgi",
            settingsTooltip: "Ayarlar",
            themeTooltip: "Temayı Değiştir",
            editor: "Editör",
            result: "Sonuç",
            settings: "Ayarlar",
            appSettings: "Uygulama Ayarları",
            saveCode: "Kodu Sakla",
            autoRun: "Oto-Çalıştır",
            libraries: "Kütüphaneler",
            language: "Dil",
            close: "Kapat",
            confirmAction: "Eylemi Onayla",
            confirm: "Onayla",
            cancel: "İptal",
            revertConfirm: "Tüm değişiklikleri ve kütüphane seçimlerini geri almak istediğinizden emin misiniz?",
            toastRun: "Kod çalıştırıldı",
            toastFormat: "Kod biçimlendirildi",
            toastClear: "Sonuç temizlendi",
            toastRevert: "Değişiklikler ve kütüphaneler sıfırlandı",
            toastSave: "Dosya başarıyla indirildi",
            toastSaveError: "Kod kaydedilemedi, depolama dolu olabilir.",
            toastFormatError: (parser) => `${parser.toUpperCase()} biçimlendirilemedi.`,
            toastSettingToggle: (label, state) => `${label} ${state ? 'açıldı' : 'kapatıldı'}.`,
            loadErrorTitle: "Yükleme Hatası",
            loadErrorMsg: "Gerekli editör kütüphaneleri yüklenemedi.<br>Lütfen internet bağlantınızı kontrol edip reklam engelleyicileri (ad-blockers) devre dışı bıraktıktan sonra tekrar deneyin.",
            refreshPage: "Sayfayı Yenile",
            infoModalTitle: "Bilgi",
            infoModalP1: "Bu web sitesi, HTML, CSS ve JavaScript kodlarını gerçek zamanlı olarak yazmanıza, test etmenize ve sonucunu anında görmenize olanak tanıyan bir online kod editörüdür.",
            infoModalP2: "<strong>Özellikler:</strong> Kod renklendirme, otomatik tamamlama, kod biçimlendirme, popüler kütüphaneleri (jQuery, Bootstrap vb.) ekleyebilme ve projeyi kaydetme.",
            infoModalP3: "<strong>Gizlilik:</strong> Kodlarınız tamamen sizin kontrolünüzdedir. Yazdığınız hiçbir kod veya kişisel veri sunucularımızda saklanmaz. 'Kodu Sakla' özelliğini kullandığınızda, kodunuz yalnızca sizin tarayıcınızın yerel depolama alanına kaydedilir."
        },
        en: {
            title: "Try and Learn!",
            logoText: "Try and Learn!",
            run: "Run",
            format: "Format",
            separate: "Separate",
            combine: "Combine",
            save: "Save",
            revert: "Revert",
            clear: "Clear",
            runTooltip: "Run Code (Ctrl+R)",
            formatTooltip: "Format Code (Ctrl+Shift+F)",
            separateTooltip: "Separate Languages",
            saveTooltip: "Save File (Ctrl+S)",
            revertTooltip: "Revert Changes (Ctrl+Alt+R)",
            clearTooltip: "Clear Result",
            infoTooltip: "Info",
            settingsTooltip: "Settings",
            themeTooltip: "Toggle Theme",
            editor: "Editor",
            result: "Result",
            settings: "Settings",
            appSettings: "Application Settings",
            saveCode: "Save Code",
            autoRun: "Auto-Run",
            libraries: "Libraries",
            language: "Language",
            close: "Close",
            confirmAction: "Confirm Action",
            confirm: "Confirm",
            cancel: "Cancel",
            revertConfirm: "Are you sure you want to revert all changes and library selections?",
            toastRun: "Code executed",
            toastFormat: "Code formatted",
            toastClear: "Result cleared",
            toastRevert: "Changes and libraries have been reset",
            toastSave: "File downloaded successfully",
            toastSaveError: "Could not save code, storage may be full.",
            toastFormatError: (parser) => `Could not format ${parser.toUpperCase()}.`,
            toastSettingToggle: (label, state) => `${label} has been ${state ? 'enabled' : 'disabled'}.`,
            loadErrorTitle: "Loading Error",
            loadErrorMsg: "Failed to load required editor libraries.<br>Please check your internet connection, disable ad-blockers, and try again.",
            refreshPage: "Refresh Page",
            infoModalTitle: "About",
            infoModalP1: "This website is an online code editor that allows you to write, test, and see the results of HTML, CSS, and JavaScript code in real-time.",
            infoModalP2: "<strong>Features:</strong> Syntax highlighting, auto-completion, code formatting, ability to add popular libraries (jQuery, Bootstrap, etc.), and project saving.",
            infoModalP3: "<strong>Privacy:</strong> Your code is entirely under your control. None of the code you write or any personal data is stored on our servers. When you use the 'Save Code' feature, your code is saved only to your browser's local storage."
        }
    };
    
    // Dile göre varsayılan kod döndüren fonksiyon
    function getTranslatedDefaultCode() {
        if (currentLang === 'en') {
            return `<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
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

    <h1>Hello World!</h1>
    <p>This is a paragraph!</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.</p>
    <p id="demo">JavaScript result will appear here.</p>
    <button onclick="myFunction()">Click Me</button>

    <script>
        function myFunction() {
            document.getElementById("demo").innerHTML = "Great, JavaScript is working!";
        }
    <\/script> 
</body>
</html>`;// Note: A backslash (\) has been added before the "script" tag; otherwise, the code won’t work.
        }
        // Türkçe (varsayılan)
        return `<!DOCTYPE html>
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
    }
// Not : "Script" tagının başına \ eklenmiştir, aksi halde kod çalışmaz.
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

    function getFullCode(options = {}) {
        const { includeLibraries = true } = options;
        let htmlContent, cssContent, jsContent;

        if (isViewSeparated) {
            htmlContent = htmlEditor.getValue();
            cssContent = cssEditor.getValue();
            jsContent = jsEditor.getValue();
        } else {
            const parsed = parseFullCode(codeEditor.getValue());
            htmlContent = parsed.htmlCode;
            cssContent = parsed.cssCode;
            jsContent = parsed.jsCode;
        }

        let headInjections = '';
        let bodyInjections = '';

        if (includeLibraries) {
            selectedLibraries.forEach(libKey => {
                const lib = LIBRARIES[libKey];
                if (lib.css) {
                    headInjections += `<link rel="stylesheet" href="${lib.css}">\n`;
                }
                if (lib.js) {
                    const scripts = Array.isArray(lib.js) ? lib.js : [lib.js];
                    scripts.forEach(url => bodyInjections += `<script src="${url}"><\/script>\n`);
                }
            });
        }
        
        headInjections += `<style>${cssContent}</style>\n`;
        bodyInjections += `<script>${jsContent}<\/script>\n`;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        const headElement = doc.head || doc.createElement('head');
        const bodyElement = doc.body || doc.createElement('body');
        
        if (!doc.head) doc.documentElement.prepend(headElement);
        if (!doc.body) doc.documentElement.appendChild(bodyElement);
        
        headElement.innerHTML += headInjections;
        bodyElement.innerHTML += bodyInjections;
        
        return `<!DOCTYPE html>\n` + doc.documentElement.outerHTML;
    }
    
    function saveCode() {
        try {
            if (localStorage.getItem('saveCodeEnabled') !== 'true') return;
            const formattedFullCode = format(getFullCode({ includeLibraries: false }), "html");
            localStorage.setItem('liveCodeEditorContent', formattedFullCode);
        } catch (e) {
            console.error("Kod kaydedilemedi:", e);
            showToast(STRINGS[currentLang].toastSaveError, "warning");
        }
    }
    
    function runCode(isSilent = false) {
        dom.resultFrame.srcdoc = getFullCode({ includeLibraries: true });
        if (!isSilent) showToast(STRINGS[currentLang].toastRun, 'success');
    }
    
    function format(code, parserName) {
        try {
            let formattedCode = prettier.format(code, {
                parser: parserName,
                plugins: prettierPlugins,
                printWidth: 100,
                embeddedLanguageFormatting: "auto"
            });
            if (parserName === 'html') {
                formattedCode = formattedCode.replace(/(\n\s*\n)(\s*<style)/g, '\n$2');
            }
            return formattedCode;
        } catch (e) {
            console.error(`${parserName} için Prettier biçimlendirme başarısız oldu:`, e);
            showToast(STRINGS[currentLang].toastFormatError(parserName), 'warning');
            return code;
        }
    }
    
    function formatCode() {
        if (isViewSeparated) {
            htmlEditor.setValue(format(htmlEditor.getValue(), "html"));
            cssEditor.setValue(format(cssEditor.getValue(), "css"));
            jsEditor.setValue(format(jsEditor.getValue(), "babel"));
        } else {
            const fullCodeContent = codeEditor.getValue();
            try {
                const formattedCombinedCode = prettier.format(fullCodeContent, {
                    parser: "html",
                    plugins: prettierPlugins,
                    printWidth: 100,
                    tabWidth: 4,
                    useTabs: false,
                    embeddedLanguageFormatting: "auto"
                });
                codeEditor.setValue(formattedCombinedCode);
            } catch (e) {
                console.error("Birleşik kod biçimlendirme başarısız oldu:", e);
                showToast(STRINGS[currentLang].toastFormatError('HTML'), 'warning');
            }
        }
        showToast(STRINGS[currentLang].toastFormat, 'success');
    }
    
    function revertCode() {
        showConfirmationModal(STRINGS[currentLang].revertConfirm, () => {
            selectedLibraries = [];
            localStorage.setItem('selectedLibraries', JSON.stringify([]));
            initSettings();
            
            const defaultCode = getTranslatedDefaultCode();
            if (isViewSeparated) {
                const { htmlCode, cssCode, jsCode } = parseFullCode(defaultCode);
                htmlEditor.setValue(format(htmlCode, "html"));
                cssEditor.setValue(format(cssCode, "css"));
                jsEditor.setValue(format(jsCode, "babel"));
            } else {
                codeEditor.setValue(format(defaultCode, "html"));
            }
            
            runCode(true);
            showToast(STRINGS[currentLang].toastRevert, 'info');
        });
    }

    function parseFullCode(fullCode) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullCode, "text/html");
        const cssCode = Array.from(doc.head.querySelectorAll('style')).map(s => s.textContent).join('\n');
        const jsCode = Array.from(doc.body.querySelectorAll('script:not([src])')).map(s => s.textContent).join('\n');
        
        doc.head.querySelectorAll('style').forEach(s => s.remove());
        doc.body.querySelectorAll('script:not([src])').forEach(s => s.remove());
        doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
        doc.body.querySelectorAll('script[src]').forEach(s => s.remove());
        
        const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name.toUpperCase()}>\n` : '<!DOCTYPE html>\n';
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
            
            dom.combinedView.style.display = 'none';
            dom.separatedView.style.display = 'flex';
            dom.separateBtnText.textContent = STRINGS[currentLang].combine;
            setActiveTab('html');
        } else {
            codeEditor.setValue(format(getFullCode({ includeLibraries: false }), "html"));
            dom.separatedView.style.display = 'none';
            dom.combinedView.style.display = 'flex';
            dom.separateBtnText.textContent = STRINGS[currentLang].separate;
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
                case 'clear-btn': dom.resultFrame.srcdoc = 'about:blank'; showToast(STRINGS[currentLang].toastClear, 'info'); break;
                case 'settings-btn': openModal(dom.settingsModal); break;
                case 'info-btn': openModal(dom.infoModal); break; // YENİ
                case 'theme-btn': toggleTheme(); break;
            }
        });

        dom.settingsGrid.addEventListener('click', e => {
            const item = e.target.closest('.setting-item');
            if (!item) return;

            const key = item.dataset.key;
            
            if (item.dataset.type === 'language') {
                updateLanguage(key);
                return;
            }

            item.classList.toggle('active');
            const isActive = item.classList.contains('active');
            
            if (item.dataset.type === 'app') {
                localStorage.setItem(key, isActive);
                const label = STRINGS[currentLang][key === 'saveCodeEnabled' ? 'saveCode' : 'autoRun'];
                showToast(STRINGS[currentLang].toastSettingToggle(label, isActive), isActive ? 'success' : 'info');

                if (key === 'saveCodeEnabled' && !isActive) {
                    localStorage.removeItem('liveCodeEditorContent');
                    localStorage.removeItem('selectedLibraries');
                    selectedLibraries = [];
                    initSettings();
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
        const formattedCodeForSave = format(getFullCode({ includeLibraries: true }), "html");
        const blob = new Blob([formattedCodeForSave], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(STRINGS[currentLang].toastSave, 'success');
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
    
    // YENİ: DİL GÜNCELLEME FONKSİYONU
    function updateLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('language', lang);
        
        document.documentElement.lang = lang;
        
        const translations = STRINGS[lang];
        
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if(translations[key]) {
                el.innerHTML = translations[key];
            }
        });
        
        document.querySelectorAll('[data-lang-title]').forEach(el => {
            const key = el.dataset.langTitle;
            if(translations[key]) {
                el.title = translations[key];
            }
        });

        // "Dilleri Ayır/Birleştir" butonu özel durumu
        const sepBtn = document.getElementById('separate-btn-text');
        if (sepBtn) {
            sepBtn.textContent = isViewSeparated ? translations.combine : translations.separate;
        }

        // Ayarlar modalını yeniden oluşturarak dili güncelle
        initSettings();
    }
    
    function initLanguage() {
        const savedLang = localStorage.getItem('language') || 'tr';
        updateLanguage(savedLang);
    }
    
    function initSettings() {
        dom.settingsGrid.innerHTML = '';
        const translations = STRINGS[currentLang];

        // Dil Ayarları
        const langTitle = document.createElement('h4');
        langTitle.className = 'settings-subtitle';
        langTitle.textContent = translations.language;
        dom.settingsGrid.appendChild(langTitle);

        const langContainer = document.createElement('div');
        langContainer.style.display = 'flex';
        langContainer.style.gap = '10px';

        ['tr', 'en'].forEach(langCode => {
            const item = document.createElement('div');
            item.className = `setting-item ${currentLang === langCode ? 'active' : ''}`;
            item.dataset.key = langCode;
            item.dataset.type = 'language';
            item.textContent = langCode.toUpperCase();
            langContainer.appendChild(item);
        });
        dom.settingsGrid.appendChild(langContainer);
        
        dom.settingsGrid.appendChild(document.createElement('hr')).className = 'settings-divider';

        // Uygulama Ayarları
        const appSettingsTitle = document.createElement('h4');
        appSettingsTitle.className = 'settings-subtitle';
        appSettingsTitle.textContent = translations.appSettings;
        dom.settingsGrid.appendChild(appSettingsTitle);
        
        const appSettings = [
            { id: 'save-toggle-checkbox', label: translations.saveCode, key: 'saveCodeEnabled' },
            { id: 'autorun-checkbox', label: translations.autoRun, key: 'autoRunEnabled' },
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

        // Kütüphaneler
        const libTitle = document.createElement('h4');
        libTitle.className = 'settings-subtitle';
        libTitle.textContent = translations.libraries;
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
        initLanguage(); // Önce dil yüklenmeli
        initSettings();

        codeEditor = createEditor('code-editor', 'htmlmixed');
        const useSavedCode = localStorage.getItem('saveCodeEnabled') === 'true';
        const savedCode = localStorage.getItem('liveCodeEditorContent');
        codeEditor.setValue((useSavedCode && savedCode) ? savedCode : getTranslatedDefaultCode());

        initTheme();
        initResizer();
        addEventListeners();
        runCode(true);
    }

    requestAnimationFrame(init);
});