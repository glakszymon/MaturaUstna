const { createApp, ref, reactive, onMounted, watch } = Vue;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbe8-tcrJ4h2z5QNLEe5m8kjD2WQvH9OoZknZ7TIp0VSvM94nhNvshfiTK1E7xTwJJ/exec';

const app = createApp({
    template: `
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
        
        const formData = reactive({
            wstep: '',
            teza: '',
            arg1_tytul: '',
            arg1_rozwiniecie: '',
            arg1_przyklad: '',
            arg1_wniosek: '',
            arg2_tytul: '',
            arg2_rozwiniecie: '',
            arg2_przyklad: '',
            arg2_wniosek: '',
            kontekst: '',
            podsumowanie: ''
        });

        const saveAnswer = async () => {
            if (!selectedQuestionId.value) {
                errorMessage.value = 'Wybierz pytanie!';
                setTimeout(() => { errorMessage.value = ''; }, 3000);
                return;
            }

            const payload = {
                type: 'ADD_ANSWER',
                user: sessionStorage.getItem('username') || 'editor',
                id: selectedQuestionId.value,
                data: formData
            };

            try {
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                
                if (!text) {
                    throw new Error('Pusta odpowiedź z serwera');
                }

                const responseData = JSON.parse(text);
                if (responseData.success) {
                    successMessage.value = '✅ Odpowiedź zapisana pomyślnie!';
                    setTimeout(() => { successMessage.value = ''; }, 3000);
                    // Odśwież bazę danych
                    await reloadAnswerDatabase();
                } else {
                    errorMessage.value = responseData.message || 'Błąd przy zapisywaniu';
                    setTimeout(() => { errorMessage.value = ''; }, 3000);
                }
            } catch (error) {
                errorMessage.value = 'Błąd połączenia: ' + error.message;
                console.error('Błąd zapisywania:', error);
                setTimeout(() => { errorMessage.value = ''; }, 3000);
            }
        };

        const reloadAnswerDatabase = async () => {
            try {
                const response = await fetch(GOOGLE_SCRIPT_URL);
                const text = await response.text();
                const data = JSON.parse(text);
                answerDatabase.value = data.answers || [];
            } catch (error) {
                console.error('Błąd odświeżania bazy odpowiedzi:', error);
            }
        };

        const resetForm = () => {
            Object.assign(formData, {
                wstep: '',
                teza: '',
                arg1_tytul: '',
                arg1_rozwiniecie: '',
                arg1_przyklad: '',
                arg1_wniosek: '',
                arg2_tytul: '',
                arg2_rozwiniecie: '',
                arg2_przyklad: '',
                arg2_wniosek: '',
                kontekst: '',
                podsumowanie: ''
            });
            selectedQuestionId.value = '';
        };

        // Watcher - automatycznie uzupełnia formularz quando pytanie jest wybrane
        watch(selectedQuestionId, (newId) => {
            if (!newId || newId === '') {
                resetForm();
                return;
            }

            // Szukamy odpowiedzi dla wybranego pytania po ID
            // Dane z GAS mają strukturę: { id: "1", wstep: "...", ... } bo są parsowane z nagłówkami
            const existingAnswer = answerDatabase.value.find(answer => {
                if (!answer) return false;
                const answerId = answer.id || answer.ID;
                return answerId && answerId.toString().trim() === newId.toString().trim();
            });

            if (existingAnswer) {
                // Uzupełniamy formularz danymi z bazy
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
                successMessage.value = '✏️ Dane załadowane z bazy - edytuj odpowiedź';
                setTimeout(() => { successMessage.value = ''; }, 2000);
            } else {
                // Jeśli odpowiedź nie istnieje, czyszczmy formularz
                resetForm();
                selectedQuestionId.value = newId;
            }
        });

        onMounted(async () => {
            try {
                const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbe8-tcrJ4h2z5QNLEe5m8kjD2WQvH9OoZknZ7TIp0VSvM94nhNvshfiTK1E7xTwJJ/exec';
                const response = await fetch(GOOGLE_SCRIPT_URL);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                
                if (!text) {
                    throw new Error('Pusta odpowiedź z serwera');
                }
                
                const data = JSON.parse(text);
                questionList.value = data.questions || [];
                answerDatabase.value = data.answers || [];
            } catch (error) {
                console.error('Błąd ładowania danych:', error);
                errorMessage.value = 'Błąd ładowania danych: ' + error.message;
                setTimeout(() => { errorMessage.value = ''; }, 5000);
            }
        });

        return {
            questionList,
            selectedQuestionId,
            formData,
            successMessage,
            errorMessage,
            saveAnswer,
            resetForm,
            reloadAnswerDatabase
        };
    }
});

app.mount('.container');