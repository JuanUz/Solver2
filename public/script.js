document.addEventListener('DOMContentLoaded', () => {
    // Service Worker setup (mantenido)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error', err));
        });
    }

    const btnSolve = document.getElementById('btn-solve');
    const resultsSection = document.getElementById('results-section');
    const stepsContainer = document.getElementById('steps-container');
    const solutionOutput = document.getElementById('solution-output');
    
    // Elementos del chat
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    let chatMessages = [];

    btnSolve.addEventListener('click', async () => {
        const mEq = document.getElementById('m-eq').value.trim();
        const nEq = document.getElementById('n-eq').value.trim();
        const method = document.getElementById('solve-method').value;

        if (!mEq || !nEq) {
            alert("⛔ Error: Debes ingresar funciones válidas para M(x,y) y N(x,y).");
            return;
        }

        // --- SIMULACIÓN DE CONEXIÓN AL BACKEND ---
        // Aquí es donde harías un fetch() a tu API en Python con SymPy.
        // Para que pruebes la UI, simularemos la respuesta analítica del clásico problema Exacto.
        
        let stepsHtml = '';
        let finalSolution = '';
        let tipoEcuacion = 'Exacta'; // Simulado

        stepsHtml += `<div class="result-box" style="margin-bottom: 25px;">
            <h3 style="margin-bottom: 15px; color: var(--primary);">Paso 1: Criterio de Exactitud</h3>
            <ul style="list-style-type: none; padding-left: 0; font-family: monospace; font-size: 0.95rem;">
                <li style="margin-bottom: 8px; background: #0a0b0d; padding: 10px; border-radius: 6px; border: 1px solid #333;">
                    <span style="color: var(--text-main);">Derivada parcial de M respecto a y:</span> <br>
                    <span style="color: #4ceabf;">&part;M/&part;y = &part;(${mEq})/&part;y = 2x</span>
                </li>
                <li style="margin-bottom: 8px; background: #0a0b0d; padding: 10px; border-radius: 6px; border: 1px solid #333;">
                    <span style="color: var(--text-main);">Derivada parcial de N respecto a x:</span> <br>
                    <span style="color: #4ceabf;">&part;N/&part;x = &part;(${nEq})/&part;x = 2x</span>
                </li>
            </ul>
            <p style="color: #4ceabf; margin-top: 15px; font-weight: 600;">✅ Como &part;M/&part;y = &part;N/&part;x, la ecuación es EXACTA.</p>
        </div>`;

        stepsHtml += `<div class="result-box" style="margin-bottom: 25px;">
            <h3 style="margin-bottom: 15px; color: var(--primary);">Paso 2: Integración de M(x,y)</h3>
            <ul style="list-style-type: none; padding-left: 0; font-family: monospace; font-size: 1rem;">
                <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                    f(x,y) = &int; M(x,y) dx + g(y)<br>
                    f(x,y) = &int; (${mEq}) dx + g(y)<br>
                    <strong style="color: var(--text-main);">f(x,y) = x²y + g(y)</strong>
                </li>
            </ul>
        </div>`;

        stepsHtml += `<div class="result-box" style="margin-bottom: 25px;">
            <h3 style="margin-bottom: 15px; color: var(--primary);">Paso 3: Derivación e Igualación con N(x,y)</h3>
            <ul style="list-style-type: none; padding-left: 0; font-family: monospace; font-size: 1rem;">
                <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                    &part;f/&part;y = x² + g'(y)<br>
                    <span style="color: var(--text-muted);">Igualando a N(x,y):</span><br>
                    x² + g'(y) = ${nEq}<br>
                    g'(y) = -1
                </li>
                <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                    <span style="color: var(--text-muted);">Integrando g'(y):</span><br>
                    g(y) = &int; -1 dy = -y
                </li>
            </ul>
        </div>`;

        finalSolution = `x²y - y = C`;

        // Renderizar resultados en pantalla
        stepsContainer.innerHTML = stepsHtml;
        
        solutionOutput.innerHTML = `<div class="result-box" style="border-left: 4px solid #ff007f;">
            <p><strong>Solución General Final:</strong></p>
            <div style="background: #0a0b0d; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                <strong style="color: var(--primary); font-size: 1.5rem;">${finalSolution}</strong>
            </div>
        </div>`;

        resultsSection.classList.remove('hidden');

        // Configurar el prompt del sistema para Gemini adaptado a EDOs
        const systemPrompt = `Eres "HamsterSolver", un tutor experto en Ciencias Básicas y Ecuaciones Diferenciales. 
        El usuario acaba de resolver la ecuación ${mEq} dx + ${nEq} dy = 0.
        Se determinó que es una Ecuación ${tipoEcuacion} y la solución general obtenida es ${finalSolution}.
        Responde dudas teóricas sobre cálculo integral, derivadas parciales o reglas de homogeneidad asociadas a este problema.`;

        chatMessages = [{ role: "system", content: systemPrompt }];
        chatHistory.innerHTML = '<div class="chat-msg msg-bot">¡Procedimiento analítico completado! ¿Tienes dudas sobre cómo se resolvió la integral o las derivadas parciales? 🐹</div>';
    });

    // Lógica del Chat (Mantenida intacta)
    async function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        chatHistory.innerHTML += `<div class="chat-msg msg-user">${text}</div>`;
        chatInput.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight;
        chatMessages.push({ role: "user", content: text });

        const loadingId = "loading-" + Date.now();
        chatHistory.innerHTML += `<div id="${loadingId}" class="chat-msg msg-bot">Analizando ecuaciones... 🐹💭</div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatMessages })
            });
            const data = await response.json();
            document.getElementById(loadingId).remove();

            const botReply = data.reply || `Error del servidor: ${data.error}`;
            chatHistory.innerHTML += `<div class="chat-msg msg-bot">${botReply}</div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;
            chatMessages.push({ role: "assistant", content: botReply });
        } catch(err) {
            document.getElementById(loadingId).remove();
            chatHistory.innerHTML += `<div class="chat-msg msg-bot" style="color: red;">Error al conectar con la API Serverless.</div>`;
        }
    }

    btnSendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});
