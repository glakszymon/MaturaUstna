// Reusable header component
const { createApp, ref, computed, onMounted } = Vue;

// Reusable header component z obsługą BURGERA
const HeaderComponent = {
    props: ['username', 'isLoggedIn'],
    emits: ['go-home', 'draw-random', 'logout', 'edit-pattern'],
    setup(props, { emit }) {
        const isMenuOpen = ref(false);
        const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };
        const closeMenu = (action) => {
            isMenuOpen.value = false;
            emit(action);
        };
        return { isMenuOpen, toggleMenu, closeMenu };
    },
    // Fragment template w Twoim HeaderComponent
    template: `
    <header v-if="isLoggedIn" class="main-header">
        <div class="header-container">
            <div class="brand-logo" @click="$emit('go-home')">
                <span class="brand-text">Matura<b>2026</b></span>
            </div>

            <button class="burger-btn" :class="{ 'is-open': isMenuOpen }" @click="toggleMenu">
                <span></span><span></span><span></span>
            </button>

            <div class="nav-menu" :class="{ 'is-active': isMenuOpen }">
                <div class="nav-links">
                    <button @click="closeMenu('go-home')" class="nav-btn">Lista Tematów</button>
                    <button @click="closeMenu('draw-random')" class="nav-btn">Start Egzamin</button>
                    <button @click="closeMenu('edit-pattern')" class="nav-btn">Dodaj Odpowiedź</button>
                </div>
                
                <div class="user-section">
                    <span class="user-name">{{ username }}</span>
                    <button @click="closeMenu('logout')" class="logout-btn">WYLOGUJ</button>
                </div>
            </div>
        </div>
    </header>
    `
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGyupicyj0vjiKjRprtPgpAzmEWEVTi6t4o3i7Sc_2gm5Mx5lB_0OWvH3SEEj6CN9S/exec';

const app = createApp({ components: { 'app-header': HeaderComponent },
    setup() {
        const isMenuOpen = ref(false);
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

        // --- WORKFLOW LOGIC ---
        // Przechowuje stan workflow dla każdego pytania (klucz ID -> wartość 0, 1 lub 2)
        const userWorkflow = ref({}); 

        // Definicje stanów
        const workflowStates = [
            { val: 0, label: 'Do napisania', class: 'wf-status-0' },
            { val: 1, label: 'Czeka na spr.', class: 'wf-status-1' },
            { val: 2, label: 'Sprawdzone', class: 'wf-status-2' }
        ];

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
                // Pobierz aktualny stan (domyślnie 0)
        const getWorkflowStatus = (id) => {
            return userWorkflow.value[id] !== undefined ? userWorkflow.value[id] : 0;
        };

        // Pobierz obiekt definicji dla obecnego stanu (żeby wiedzieć jaki tekst i klasę wyświetlić)
        const getWorkflowDef = (id) => {
            const status = getWorkflowStatus(id);
            return workflowStates.find(s => s.val === status) || workflowStates[0];
        };

        // Zmień stan po kliknięciu (cykl: 0 -> 1 -> 2 -> 0)
        const cycleWorkflowStatus = (id) => {
            const current = getWorkflowStatus(id);
            const next = (current + 1) % 3; // Modulo 3 zapewnia pętlę 0,1,2
            
            userWorkflow.value[id] = next;
            
            // Zapisujemy lokalnie
            localStorage.setItem('matura_workflow_status', JSON.stringify(userWorkflow.value));
            
            // Opcjonalnie: Tutaj możesz dodać wysyłanie do Google Script, jeśli rozbudujesz backend
            // sendWorkflowToBackend(id, next); 
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
                
                const savedWorkflow = localStorage.getItem('matura_workflow_status');
                if (savedWorkflow) {
                    userWorkflow.value = JSON.parse(savedWorkflow);
                }

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

        const statsPerLevel = computed(() => {
            const stats = {
                notUnderstand: 0,  // "Nie umiem" (0)
                weak: 0,           // "Słabo" (1)
                medium: 0,         // "Średnio" (2)
                understand: 0      // "Umiem" (3)
            };
            
            question_list.value.forEach(q => {
                const status = getStatus(q.id);
                switch(status) {
                    case 0: stats.notUnderstand++; break;
                    case 1: stats.weak++; break;
                    case 2: stats.medium++; break;
                    case 3: stats.understand++; break;
                }
            });
            
            return stats;
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
            getStatus, hasAnswer, updateStatus, progressCount, statsPerLevel, isLoading,
            currentQuestion, currentPattern, form, checkMode,
            enableCheckMode, gradeScale, grades, setGrade, totalScore,
            comparisonStructure, isMenuOpen,  getWorkflowDef, cycleWorkflowStatus
        };
    }
});

app.mount('#app');