document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuración del Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error', err));
        });
    }

    // 2. Referencias al DOM
    const btnSolve = document.getElementById('btn-solve');
    const resultsSection = document.getElementById('results-section');
    const stepsContainer = document.getElementById('steps-container');
    const solutionOutput = document.getElementById('solution-output');
    
    // Referencias al chat
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    let chatMessages = [];

    // 3. Lógica Principal: Enviar ecuación a Vercel/Python
    btnSolve.addEventListener('click', async () => {
        const mEq = document.getElementById('m-eq').value.trim();
        const nEq = document.getElementById('n-eq').value.trim();
        const method = document.getElementById('solve-method').value;

        if (!mEq || !nEq) {
            alert("⛔ Error: Debes ingresar funciones válidas para M(x,y) y N(x,y).");
            return;
        }

        // Bloquear botón y mostrar estado de carga
        btnSolve.textContent = "Calculando...";
        btnSolve.disabled = true;

        try {
            // Petición POST al Serverless Function (api/solve.py)
            const response = await fetch('/api/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ m: mEq, n: nEq, method: method })
            });
            
            // Si el servidor falla antes de devolver JSON, lanzará el error al catch
            if (!response.ok) {
                const textError = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${textError}`);
            }

            const data = await response.json();

            // Manejo de Errores de Sintaxis Matemáticas devueltos por Python
            if (data.status === "error") {
                alert("⛔ Error Matemático: " + data.mensaje + "\nRevisa la sintaxis de las funciones.");
                btnSolve.textContent = "Resolver Ecuación";
                btnSolve.disabled = false;
                return;
            }

            // Fallback si la ecuación no pasa la prueba de exactitud
            if (data.status === "not_exact") {
                alert(`⚠️ La ecuación NO es exacta (∂M/∂y = ${data.dM_dy} ≠ ∂N/∂x = ${data.dN_dx}).\n${data.mensaje}`);
                btnSolve.textContent = "Resolver Ecuación";
                btnSolve.disabled = false;
                return;
            }

            // 4. Renderizado Dinámico de los pasos devueltos por SymPy
            let stepsHtml = '';
            
            stepsHtml += `<div class="result-box" style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 15px; color: var(--primary);">Paso 1: Criterio de Exactitud</h3>
                <ul style="list-style-type: none; padding-left: 0; font-family: monospace; font-size: 0.95rem;">
                    <li style="margin-bottom: 8px; background: #0a0b0d; padding: 10px; border-radius: 6px; border: 1px solid #333;">
                        <span style="color: var(--text-main);">∂M/∂y = </span> <span style="color: var(--primary);">${data.dM_dy}</span>
                    </li>
                    <li style="margin-bottom: 8px; background: #0a0b0d; padding: 10px; border-radius: 6px; border: 1px solid #333;">
                        <span style="color: var(--text-main);">∂N/∂x = </span> <span style="color: var(--primary);">${data.dN_dx}</span>
                    </li>
                </ul>
                <p style="color: var(--primary); margin-top: 15px; font-weight: 600;">✅ Coinciden. La ecuación es EXACTA.</p>
            </div>`;

            stepsHtml += `<div class="result-box" style="margin-bottom: 25px;">
                <h3 style="margin-bottom: 15px; color: var(--primary);">Paso 2 y 3: Integración y Despeje</h3>
                <ul style="list-style-type: none; padding-left: 0; font-family: monospace; font-size: 1rem;">
                    <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                        1. Integrando M: f(x,y) = <strong style="color: white;">${data.f_partial} + g(y)</strong>
                    </li>
                    <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                        2. Igualando y despejando g'(y): g'(y) = <strong style="color: white;">${data.g_prime}</strong>
                    </li>
                    <li style="margin-bottom: 8px; background: #0a0b0d; padding: 12px; border-radius: 6px; border: 1px solid #333;">
                        3. Integrando g'(y): g(y) = <strong style="color: white;">${data.g_y}</strong>
                    </li>
                </ul>
            </div>`;

            // Advertencia visual si es un resultado aproximado o integral no resuelta
            if (data.is_approximate) {
                stepsHtml += `<div class="result-box" style="margin-bottom: 25px; border-left: 4px solid #ffa500; background: #2a1f0a;">
                    <h3 style="margin-bottom: 10px; color: #ffa500;">⚠️ Aviso de Aproximación</h3>
                    <p style="font-size: 0.95rem; color: #ffdd99;">El motor matemático no encontró una antiderivada elemental estándar para g'(y). El resultado mostrado contiene una integral no resuelta o una aproximación numérica implícita.</p>
                </div>`;
            }

            stepsContainer.innerHTML = stepsHtml;
            
            // Solución Final
            solutionOutput.innerHTML = `<div class="result-box" style="border-left: 4px solid var(--primary);">
                <p><strong>Solución General Final:</strong></p>
                <div style="background: #0a0b0d; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #333;">
                    <strong style="color: var(--primary); font-size: 1.5rem;">${data.solucion}</strong>
                </div>
            </div>`;

            resultsSection.classList.remove('hidden');

            // 5. Actualizar el Chat de Gemini con el contexto del nuevo resultado
            const systemPrompt = `Eres "HamsterSolver", tutor de Ciencias Básicas. El usuario resolvió la EDO Exacta con M=${mEq} y N=${nEq}. El resultado calculado es ${data.solucion}. Responde dudas teóricas breves.`;
            chatMessages = [{ role: "system", content: systemPrompt }];
            chatHistory.innerHTML = '<div class="chat-msg msg-bot">¡Ecuación procesada por el servidor! ¿Tienes dudas sobre el resultado o el proceso? 🐹</div>';

        } catch (error) {
            alert(`⛔ Fallo en la conexión o cálculo:\n\n${error.message}\n\nRevisa la pestaña "Logs" en tu panel de Vercel para ver el detalle del backend.`);
            console.error("Error detallado:", error);
        } finally {
            btnSolve.textContent = "Resolver Ecuación";
            btnSolve.disabled = false;
        }
    });

    // 6. Lógica del Chat de IA con captura de errores detallada
    async function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        chatHistory.innerHTML += `<div class="chat-msg msg-user">${text}</div>`;
        chatInput.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight;
        chatMessages.push({ role: "user", content: text });

        const loadingId = "loading-" + Date.now();
        chatHistory.innerHTML += `<div id="${loadingId}" class="chat-msg msg-bot">Analizando dudas... 🐹💭</div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatMessages })
            });
            
            if (!response.ok) {
                const textError = await response.text();
                throw new Error(`HTTP ${response.status}: ${textError}`);
            }
            
            const data = await response.json();
            document.getElementById(loadingId).remove();

            const botReply = data.reply || `Error del servidor: ${data.error}`;
            chatHistory.innerHTML += `<div class="chat-msg msg-bot">${botReply}</div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;
            chatMessages.push({ role: "assistant", content: botReply });
            
        } catch(err) {
            // Aquí atrapamos el error real y lo mostramos en pantalla
            document.getElementById(loadingId).remove();
            console.error("Error detallado del chat:", err);
            chatHistory.innerHTML += `<div class="chat-msg msg-bot" style="color: #ff4d4d; border-color: #ff4d4d;">⛔ Error al conectar con Gemini: ${err.message}. Verifica tu backend (api/chat).</div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    btnSendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});