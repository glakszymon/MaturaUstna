const { createApp, ref, reactive, onMounted } = Vue;

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
                        <option v-for="(question, idx) in questionList" :key="idx" :value="idx">
                            {{ question }}
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
                const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjqMbyYLpYjPA2Kzy_SgDKqOVd4GTiYqPazsHjSOtV-Bl4CU8eO1FCFVz_n93VVQ-d/exec';
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

                const data = JSON.parse(text);
                if (data.success) {
                    successMessage.value = 'Odpowiedź została zapisana! ✓';
                    resetForm();
                    setTimeout(() => { successMessage.value = ''; }, 3000);
                } else {
                    errorMessage.value = data.message || 'Błąd przy zapisywaniu';
                    setTimeout(() => { errorMessage.value = ''; }, 3000);
                }
            } catch (error) {
                errorMessage.value = 'Błąd połączenia: ' + error.message;
                console.error('Błąd zapisywania:', error);
                setTimeout(() => { errorMessage.value = ''; }, 3000);
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

        onMounted(async () => {
            try {
                const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjqMbyYLpYjPA2Kzy_SgDKqOVd4GTiYqPazsHjSOtV-Bl4CU8eO1FCFVz_n93VVQ-d/exec';
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
            } catch (error) {
                console.error('Błąd ładowania pytań:', error);
                errorMessage.value = 'Błąd ładowania listy pytań: ' + error.message;
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
            resetForm
        };
    }
});

app.mount('.container');