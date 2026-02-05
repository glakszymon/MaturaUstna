const { createApp, ref, reactive, onMounted, watch } = Vue;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGyupicyj0vjiKjRprtPgpAzmEWEVTi6t4o3i7Sc_2gm5Mx5lB_0OWvH3SEEj6CN9S/exec';

const app = createApp({
    template: `
        <div>
            <header style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: 1rem 2rem; 
                background: #fff; 
                border-bottom: 1px solid #e2e8f0;
                position: sticky;
                top: 0;
                z-index: 1000;
                font-family: sans-serif;
                margin-bottom: 20px;
            ">
                <div style="display: flex; gap: 12px;">
                    <button @click="goHome" style="
                        background: transparent; 
                        border: 1px solid var(--primary); 
                        color: var(--primary); 
                        padding: 10px 18px; 
                        border-radius: 8px; 
                        font-weight: 700; 
                        font-size: 0.85rem; 
                        cursor: pointer;
                        text-transform: uppercase;
                    ">Lista Tematów</button>

                    <button @click="goToExamRandom" style="
                        background: transparent; 
                        border: 1px solid var(--primary); 
                        color: var(--primary); 
                        padding: 10px 18px; 
                        border-radius: 8px; 
                        font-weight: 700; 
                        font-size: 0.85rem; 
                        cursor: pointer;
                        text-transform: uppercase;
                    ">Start Egzamin</button>

                    <button @click="$event => {}" style="
                        background: transparent; 
                        border: 1px solid var(--primary); 
                        color: var(--primary); 
                        padding: 10px 18px; 
                        border-radius: 8px; 
                        font-weight: 700; 
                        font-size: 0.85rem; 
                        cursor: pointer;
                        text-transform: uppercase;
                    ">Dodaj Odpowiedź</button>
                </div>

                <div style="display: flex; align-items: center; gap: 25px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.8rem;">👤</span>
                        <span style="
                            font-size: 1.5rem; 
                            font-weight: 900; 
                            color: var(--bg-dark); 
                            letter-spacing: -1px;
                        ">Użytkownik</span>
                    </div>
                    
                    <button @click="logout" style="
                        background: #fff1f2; 
                        color: #e11d48; 
                        border: 1px solid #fecdd3; 
                        padding: 6px 12px; 
                        border-radius: 6px; 
                        font-size: 0.75rem; 
                        font-weight: 800; 
                        cursor: pointer;
                    ">WYLOGUJ</button>
                </div>
            </header>

            <div class="editor-container">
            <div class="editor-header">
                <h1>✏️ Dodaj Odpowiedź</h1>
                <p class="subtitle">Uzupełnij bazę wzorców odpowiedzi</p>
            </div>

            <form class="editor-form" @submit.prevent="saveAnswer">
                <div class="form-group">
                    <label for="questionSelect">📌 Wybierz pytanie:</label>
                    <select id="questionSelect" v-model="selectedQuestionId" class="glass-input" required>
                        <option value="">-- Wybierz pytanie --</option>
                        <option v-for="(question, idx) in questionList" :key="idx" :value="question.id || idx">
                            {{ question.pytanie || question }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="wstep">Wstęp</label>
                    <textarea id="wstep" v-model="formData.wstep" placeholder="Wstęp do odpowiedzi..." class="glass-input"></textarea>
                </div>

                <div class="form-group">
                    <label for="teza">Teza główna</label>
                    <textarea id="teza" v-model="formData.teza" placeholder="Główna teza odpowiedzi..." class="glass-input"></textarea>
                </div>

                <div class="form-section">
                    <h3>📍 Argument 1</h3>
                    <div class="form-group">
                        <label for="arg1_tytul">Tytuł</label>
                        <input id="arg1_tytul" type="text" v-model="formData.arg1_tytul" placeholder="Tytuł argumentu 1" class="glass-input" />
                    </div>
                    <div class="form-group">
                        <label for="arg1_rozwiniecie">Rozwinięcie</label>
                        <textarea id="arg1_rozwiniecie" v-model="formData.arg1_rozwiniecie" placeholder="Rozwinięcie argumentu 1..." class="glass-input"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="arg1_przyklad">Przykład</label>
                        <textarea id="arg1_przyklad" v-model="formData.arg1_przyklad" placeholder="Przykład do argumentu 1..." class="glass-input"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="arg1_wniosek">Wniosek</label>
                        <textarea id="arg1_wniosek" v-model="formData.arg1_wniosek" placeholder="Wniosek z argumentu 1..." class="glass-input"></textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📍 Argument 2</h3>
                    <div class="form-group">
                        <label for="arg2_tytul">Tytuł</label>
                        <input id="arg2_tytul" type="text" v-model="formData.arg2_tytul" placeholder="Tytuł argumentu 2" class="glass-input" />
                    </div>
                    <div class="form-group">
                        <label for="arg2_rozwiniecie">Rozwinięcie</label>
                        <textarea id="arg2_rozwiniecie" v-model="formData.arg2_rozwiniecie" placeholder="Rozwinięcie argumentu 2..." class="glass-input"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="arg2_przyklad">Przykład</label>
                        <textarea id="arg2_przyklad" v-model="formData.arg2_przyklad" placeholder="Przykład do argumentu 2..." class="glass-input"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="arg2_wniosek">Wniosek</label>
                        <textarea id="arg2_wniosek" v-model="formData.arg2_wniosek" placeholder="Wniosek z argumentu 2..." class="glass-input"></textarea>
                    </div>
                </div>

                <div class="form-group">
                    <label for="kontekst">Kontekst historyczny/społeczny</label>
                    <textarea id="kontekst" v-model="formData.kontekst" placeholder="Kontekst odpowiedzi..." class="glass-input"></textarea>
                </div>

                <div class="form-group">
                    <label for="podsumowanie">Podsumowanie</label>
                    <textarea id="podsumowanie" v-model="formData.podsumowanie" placeholder="Podsumowanie odpowiedzi..." class="glass-input"></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-save">💾 Zapisz wzorzec</button>
                    <button type="button" @click="resetForm" class="btn-reset">🔄 Wyczyść</button>
                </div>
            </form>

            <div v-if="successMessage" class="success-message glass-panel">
                ✅ {{ successMessage }}
            </div>
            <div v-if="errorMessage" class="error-message glass-panel">
                ❌ {{ errorMessage }}
            </div>
        </div>
    `,
    setup() {
        const questionList = ref([]);
        const answerDatabase = ref([]);
        const selectedQuestionId = ref('');
        const successMessage = ref('');
        const errorMessage = ref('');
        
        // Nawigacja
        const goHome = () => { window.location.href = 'index.html'; };
        const goToExamRandom = () => { localStorage.setItem('current_exam_id', 'random'); window.location.href = 'egzamin.html'; };
        const logout = () => { window.location.href = 'index.html'; };
        
        const formData = reactive({
            wstep: '', teza: '', arg1_tytul: '', arg1_rozwiniecie: '', 
            arg1_przyklad: '', arg1_wniosek: '', arg2_tytul: '', 
            arg2_rozwiniecie: '', arg2_przyklad: '', arg2_wniosek: '', 
            kontekst: '', podsumowanie: ''
        });

        // 1. Uniwersalna funkcja pobierania danych
        const loadData = async () => {
            try {
                const response = await fetch(GOOGLE_SCRIPT_URL); // GET jest domyślny, brak nagłówków = brak problemów
                const data = await response.json();
                questionList.value = data.questions || [];
                answerDatabase.value = data.answers || [];
            } catch (error) {
                console.error('Błąd ładowania:', error);
                errorMessage.value = 'Błąd połączenia z bazą.';
            }
        };

        // 2. Poprawiony zapis (Ominięcie preflight OPTIONS)
        const saveAnswer = async () => {
            if (!selectedQuestionId.value) return;

            const payload = {
                type: 'ADD_ANSWER',
                user: sessionStorage.getItem('username') || 'editor',
                id: selectedQuestionId.value,
                data: { ...formData }
            };

            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Ważne przy GAS, jeśli nie potrzebujesz czytać odpowiedzi JSON
                    // LUB (lepiej):
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain' }, // Omija OPTIONS preflight
                    body: JSON.stringify(payload)
                });

                // Uwaga: Przy mode: 'no-cors' nie odczytasz response.ok. 
                // Jeśli używasz text/plain + cors, możesz:
                const result = await response.json();
                if (result.status === "success" || result.success) {
                    successMessage.value = '✅ Zapisano pomyślnie!';
                    await loadData(); // Odśwież bazę
                }
            } catch (error) {
                errorMessage.value = 'Błąd zapisu: ' + error.message;
            }
        };

        // 3. Funkcja czyszcząca same pola (bez ID)
        const clearFields = () => {
            Object.keys(formData).forEach(key => formData[key] = '');
        };

        const resetForm = () => {
            clearFields();
            selectedQuestionId.value = '';
        };

        // 4. Poprawiony Watcher
        watch(selectedQuestionId, (newId) => {
            if (!newId) {
                clearFields();
                return;
            }

            const existingAnswer = answerDatabase.value.find(a => 
                (a.id || a.ID || "").toString() === newId.toString()
            );

            if (existingAnswer) {
                Object.assign(formData, {
                    wstep: existingAnswer.wstep || '',
                    teza: existingAnswer.teza || '',
                    arg1_tytul: existingAnswer.arg1_tytul || '',
                    arg1_rozwiniecie: existingAnswer.arg1_rozwiniecie || '',
                    arg1_przyklad: existingAnswer.arg1_przyklad || '',
                    arg1_wniosek: existingAnswer.arg1_wniosek || '',
                    arg2_tytul: existingAnswer.arg2_tytul || '',
                    arg2_rozwiniecie: existingAnswer.arg2_rozwiniecie || '',
                    arg2_przyklad: existingAnswer.arg2_przyklad || '',
                    arg2_wniosek: existingAnswer.arg2_wniosek || '',
                    kontekst: existingAnswer.kontekst || '',
                    podsumowanie: existingAnswer.podsumowanie || ''
                });
            } else {
                clearFields(); // Czyścimy pola tekstowe, ale zostawiamy wybrane ID!
            }
        });

        onMounted(loadData);

        return { questionList, selectedQuestionId, formData, successMessage, errorMessage, saveAnswer, resetForm, goHome, goToExamRandom, logout };
    }
});

app.mount('#app');