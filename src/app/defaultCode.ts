import type { Lang } from './types';

/**
 * Varsayılan başlangıç kodu.
 *
 * Preview bir Blob URL üzerinden yüklendiği için `</script>` dizisini
 * kaçırmaya gerek yok: kaynak dosya bir TypeScript modülü, tarayıcı tarafında
 * HTML olarak ayrıştırılmıyor.
 */
const TEMPLATES: Readonly<Record<Lang, string>> = {
  tr: `<!DOCTYPE html>
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
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.</p>
    <p id="demo">JavaScript sonucu burada görünecek.</p>
    <button onclick="myFunction()">Bana Tıkla</button>

    <script>
        function myFunction() {
            document.getElementById("demo").innerHTML = "Harika, JavaScript çalıştı!";
        }
    </script>
</body>
</html>`,
  en: `<!DOCTYPE html>
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
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.</p>
    <p id="demo">JavaScript result will appear here.</p>
    <button onclick="myFunction()">Click Me</button>

    <script>
        function myFunction() {
            document.getElementById("demo").innerHTML = "Great, JavaScript is working!";
        }
    </script>
</body>
</html>`,
};

export function getDefaultCode(lang: Lang): string {
  return TEMPLATES[lang];
}
