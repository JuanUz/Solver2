# 🐹 HamsterSolver | Ecuaciones Diferenciales Exactas

**HamsterSolver** es una aplicación web progresiva (PWA) diseñada para resolver analíticamente Ecuaciones Diferenciales Ordinarias (EDOs) Exactas paso a paso. Cuenta con un motor matemático en Python y un asistente de Inteligencia Artificial (Gemini) integrado para resolver dudas teóricas en tiempo real.

Ideal para proyectos de Ciencias Básicas y estudiantes de ingeniería. Hecho con 💙 en TecNM.

---

## 🏗️ Arquitectura del Proyecto

El proyecto utiliza una arquitectura *Serverless* (Sin servidor dedicado) alojada en Vercel. 
* **Frontend:** HTML5, CSS3 (Estilo Neón/Cyberpunk) y Vanilla JavaScript.
* **Backend Matemático:** Python 3 + Flask + SymPy (Motor de álgebra computacional).
* **IA:** Conexión a la API de Google Gemini.

### 📂 Estructura de Archivos
```text
HamsterSolver/
 ├── api/
 │    ├── solve.py         <-- Backend: Motor matemático (Python)
 │    └── chat.py/js       <-- Backend: Conexión con la IA de Gemini
 │
 ├── index.html            <-- Frontend: Estructura de la página y PWA
 ├── style.css             <-- Frontend: Diseño visual y paleta de colores
 ├── script.js             <-- Frontend: Lógica de la interfaz y peticiones HTTP
 ├── requirements.txt      <-- Dependencias de Python para Vercel
 └── apple-touch-icon.png  <-- Logo para la instalación en iOS/Safari
