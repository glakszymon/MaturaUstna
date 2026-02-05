const { createApp, ref, computed, onMounted } = Vue;

// Reusable header component
const HeaderComponent = {
    props: ['username', 'isLoggedIn'],
    emits: ['go-home', 'draw-random', 'logout', 'edit-pattern'],
    template: `
    <header v-if="isLoggedIn" style="
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
            <button @click="$emit('go-home')" style="
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

            <button @click="$emit('draw-random')" style="
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

            <button @click="$emit('edit-pattern')" style="
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
                ">{{ username }}</span>
            </div>
            
            <button @click="$emit('logout')" style="
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
    `
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGyupicyj0vjiKjRprtPgpAzmEWEVTi6t4o3i7Sc_2gm5Mx5lB_0OWvH3SEEj6CN9S/exec';

const app = createApp({ components: { 'app-header': HeaderComponent },
    setup() {
        // --- DATA ---
        const question_list = ref([]);
        const answer_database = ref([]);
        const authorized_users = ref([]);
        const all_progress_data = ref({});
        
        const isLoading = ref(true);
        const loginError = ref('');
        const usernameInput = ref('');
        const username = ref('');
        const isLoggedIn = ref(false);
        const userProgress = ref({});

        // Dla egzaminu i wzorca
        const currentQuestion = ref(null);
        const currentPattern = ref(null);
        const checkMode = ref(false);

        // Formularz egzaminu
        const form = ref({
            intro: '', thesis: '',
            arg1: '', arg1_dev: '', arg1_ex: '', arg1_sum: '',
            arg2: '', arg2_dev: '', arg2_ex: '', arg2_sum: '',
            context: '', summary: ''
        });

        const gradeScale = [
            { val: 0, label: 'Źle', class: 'lvl-0' },
            { val: 1, label: 'Średnio', class: 'lvl-1' },
            { val: 2, label: 'Dobrze', class: 'lvl-2' },
            { val: 3, label: 'Bdb', class: 'lvl-3' }
        ];
        const grades = ref({ intro:0, thesis:0, arg1:0, arg1_dev:0, arg1_ex:0, arg1_sum:0, arg2:0, arg2_dev:0, arg2_ex:0, arg2_sum:0, context:0, summary:0 });

        // Struktura porównania (User <-> Pattern)
        // ZMIANA: Dodano 'Wniosek' do patternFields w sekcji 2 i 3
        const comparisonStructure = {
            section1: {
                title: '1. Wstęp i Teza',
                fields: [
                    { key: 'intro', label: 'Wstęp' },
                    { key: 'thesis', label: 'Teza' }
                ],
                patternFields: [
                    { key: 'wstep', label: 'Wstęp' },
                    { key: 'teza', label: 'Teza' }
                ]
            },
            section2: {
                title: '2. Argument I',
                fields: [
                    { key: 'arg1', label: 'Tytuł' },
                    { key: 'arg1_dev', label: 'Rozwinięcie' },
                    { key: 'arg1_ex', label: 'Przykład' },
                    { key: 'arg1_sum', label: 'Wniosek' }
                ],
                patternFields: [
                    { key: 'arg1_tytul', label: 'Tytuł' },
                    { key: 'arg1_rozwiniecie', label: 'Rozwinięcie' },
                    { key: 'arg1_przyklad', label: 'Przykład' },
                    { key: 'arg1_wniosek', label: 'Wniosek' } // Dodano tutaj
                ]
            },
            section3: {
                title: '3. Argument II',
                fields: [
                    { key: 'arg2', label: 'Tytuł' },
                    { key: 'arg2_dev', label: 'Rozwinięcie' },
                    { key: 'arg2_ex', label: 'Przykład' },
                    { key: 'arg2_sum', label: 'Wniosek' }
                ],
                patternFields: [
                    { key: 'arg2_tytul', label: 'Tytuł' },
                    { key: 'arg2_rozwiniecie', label: 'Rozwinięcie' },
                    { key: 'arg2_przyklad', label: 'Przykład' },
                    { key: 'arg2_wniosek', label: 'Wniosek' } // Dodano tutaj
                ]
            },
            section4: {
                title: '4. Zakończenie',
                fields: [
                    { key: 'context', label: 'Kontekst' },
                    { key: 'summary', label: 'Podsumowanie' }
                ],
                patternFields: [
                    { key: 'kontekst', label: 'Kontekst' },
                    { key: 'podsumowanie', label: 'Podsumowanie' }
                ]
            }
        };

        // --- FETCHING & INIT ---
        const fetchData = async () => {
            isLoading.value = true;
            try {
                const response = await fetch(GOOGLE_SCRIPT_URL);
                const data = await response.json();
                question_list.value = data.questions || [];
                answer_database.value = data.answers || [];
                authorized_users.value = data.users || [];
                all_progress_data.value = data.progress || {};

                const savedUser = localStorage.getItem('matura_last_user');
                if (savedUser) {
                    usernameInput.value = savedUser;
                    login();
                }

                handlePageContext();
            } catch (e) {
                console.error("Błąd pobierania danych", e);
            } finally {
                isLoading.value = false;
            }
        };

        const handlePageContext = () => {
            const path = window.location.pathname;
            if (path.includes('egzamin.html')) {
                const qId = localStorage.getItem('current_exam_id');
                if (qId === 'random') {
                    drawRandomQuestion();
                } else if (qId) {
                    currentQuestion.value = question_list.value.find(q => q.id == qId);
                }
                if (currentQuestion.value) {
                     currentPattern.value = answer_database.value.find(a => Number(a.id) === Number(currentQuestion.value.id));
                }
            }
            if (path.includes('wzorzec.html')) {
                const qId = localStorage.getItem('current_pattern_id');
                if (qId) {
                    currentPattern.value = answer_database.value.find(a => Number(a.id) === Number(qId));
                }
            }
        };

        // --- AUTH & NAV ---
        const login = () => {
            loginError.value = '';
            const input = usernameInput.value.trim();
            if (!input) { loginError.value = "Podaj nazwę."; return; }
            const userExists = authorized_users.value.some(u => u.nazwa.toLowerCase() === input.toLowerCase());
            if (!userExists) { loginError.value = "Brak użytkownika w bazie."; return; }
            const dbUser = authorized_users.value.find(u => u.nazwa.toLowerCase() === input.toLowerCase());
            username.value = dbUser.nazwa;
            userProgress.value = all_progress_data.value[username.value] || {};
            isLoggedIn.value = true;
            localStorage.setItem('matura_last_user', username.value);
        };

        const logout = () => {
            localStorage.removeItem('matura_last_user');
            window.location.href = 'index.html';
        };

        const goHome = () => { window.location.href = 'index.html'; };
        const goToExam = (id) => { localStorage.setItem('current_exam_id', id); window.location.href = 'egzamin.html'; };
        const goToExamRandom = () => { localStorage.setItem('current_exam_id', 'random'); window.location.href = 'egzamin.html'; };
        const goToPattern = (id) => { localStorage.setItem('current_pattern_id', id); window.location.href = 'wzorzec.html'; };
        const goToEditor = () => { window.location.href = 'editor.html'; };

        const drawRandomQuestion = () => {
            if (question_list.value.length === 0) return;
            const idx = Math.floor(Math.random() * question_list.value.length);
            currentQuestion.value = question_list.value[idx];
            localStorage.setItem('current_exam_id', currentQuestion.value.id);
            currentPattern.value = answer_database.value.find(a => Number(a.id) === Number(currentQuestion.value.id));
        };

        const getStatus = (id) => (userProgress.value[id] !== undefined ? Number(userProgress.value[id]) : 0);
        
        const hasAnswer = (id) => {
            const answerRecord = answer_database.value.find(a => Number(a.id) === Number(id));
            if (!answerRecord) return false;
            
            // Sprawdzamy czy przynajmniej jedno pole odpowiedzi ma wartość
            const answerFields = [
                'wstep', 'teza', 'arg1_tytul', 'arg1_rozwiniecie', 'arg1_przyklad', 'arg1_wniosek',
                'arg2_tytul', 'arg2_rozwiniecie', 'arg2_przyklad', 'arg2_wniosek', 'kontekst', 'podsumowanie'
            ];
            
            return answerFields.some(field => answerRecord[field] && String(answerRecord[field]).trim() !== '');
        };
        
        const updateStatus = async (id, status) => {
            userProgress.value[id] = status;
            try {
                // Wysyłamy jako text/plain, aby uniknąć zapytania OPTIONS (CORS preflight)
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Google i tak przekierowuje, więc no-cors jest tu bezpieczniejszy przy POST
                    headers: { 
                        'Content-Type': 'text/plain' 
                    },
                    body: JSON.stringify({ 
                        user: username.value, 
                        id: id, 
                        status: status 
                    })
                });
            } catch (e) { 
                console.error("Błąd podczas aktualizacji statusu:", e); 
            }
        };

        const progressCount = computed(() => {
            let count = 0;
            Object.values(userProgress.value).forEach(v => { if (Number(v) === 3) count++; });
            return count;
        });

        // --- EXAM LOGIC ---
        const enableCheckMode = () => { 
            checkMode.value = true; 
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); 
        };
        const setGrade = (field, val) => { grades.value[field] = val; };
        
        const totalScore = computed(() => {
            const fields = Object.keys(grades.value);
            if (fields.length === 0) return 0;
            let sum = 0;
            fields.forEach(f => sum += grades.value[f]);
            return Math.round((sum / (fields.length * 3)) * 100);
        });

        onMounted(fetchData);
        // ... istniejące refy (question_list, itp.)

        const groupedQuestions = computed(() => {
            const groups = {};
            question_list.value.forEach(q => {
                // Jeśli pole 'rozdzial' jest puste, przypisz do "Inne"
                const chapterName = q.rozdzial || 'Pozostałe';
                if (!groups[chapterName]) {
                    groups[chapterName] = [];
                }
                groups[chapterName].push(q);
            });
            
            // Zwracamy tablicę obiektów, aby łatwo iterować w HTML
            return Object.keys(groups).map(name => ({
                name: name,
                questions: groups[name]
            }));
        });

        // Pamiętaj, aby dodać 'groupedQuestions' do zwracanego obiektu na końcu setup():
        return {
            groupedQuestions,
            question_list, answer_database, isLoggedIn, username, usernameInput, loginError,
            login, logout, goHome, goToExam, goToExamRandom, goToPattern, goToEditor, drawRandomQuestion,
            getStatus, hasAnswer, updateStatus, progressCount, isLoading,
            currentQuestion, currentPattern, form, checkMode,
            enableCheckMode, gradeScale, grades, setGrade, totalScore,
            comparisonStructure
        };
    }
});

app.mount('#app');