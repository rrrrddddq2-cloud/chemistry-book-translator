// Advanced Chemistry Dictionary
class ChemistryDictionary {
    constructor() {
        this.database = null;
        this.allTerms = [];
        this.currentFilter = 'all';
        this.selectedCategory = null;
        this.init();
    }

    async init() {
        await this.loadDatabase();
        this.setupEventListeners();
        this.displayCategories();
    }

    async loadDatabase() {
        try {
            const response = await fetch('comprehensive-chemistry-dict.json');
            this.database = await response.json();
            this.extractAllTerms();
        } catch (error) {
            console.error('خطأ في تحميل قاعدة البيانات:', error);
            document.getElementById('termsList').innerHTML = 
                '<p class="empty-state">خطأ في تحميل قاعدة البيانات</p>';
        }
    }

    extractAllTerms() {
        this.allTerms = [];
        if (this.database && this.database.chemistryTerms) {
            Object.values(this.database.chemistryTerms).forEach(category => {
                if (Array.isArray(category)) {
                    this.allTerms.push(...category);
                }
            });
        }
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        document.querySelectorAll('.search-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.search-filters .filter-btn').forEach(b => 
                    b.classList.remove('active')
                );
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.lang;
                this.displayTerms();
            });
        });

        document.getElementById('exportDictBtn').addEventListener('click', () => this.exportDictionary());
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
    }

    displayCategories() {
        const booksList = document.getElementById('booksList');
        booksList.innerHTML = '';

        if (this.database && this.database.chemistryTerms) {
            Object.keys(this.database.chemistryTerms).forEach(category => {
                const terms = this.database.chemistryTerms[category];
                const categoryNames = {
                    'general': '📋 عام',
                    'atoms_structure': '⚛️ بنية ذرية',
                    'bonds': '🔗 روابط',
                    'organic': '🧪 عضوية',
                    'reactions': '⚡ تفاعلات',
                    'thermodynamics': '🔥 ديناميكا',
                    'kinetics': '⏱️ حركية',
                    'equilibrium': '⚖️ توازن',
                    'acids_bases': '🧫 أحماض',
                    'analytical': '🔬 تحليلية',
                    'inorganic': '🪨 غير عضوية',
                    'electrochemistry': '⚡ كهرو',
                    'biochemistry': '🧬 حيوية',
                    'materials': '🏭 مواد',
                    'environmental': '🌍 بيئية',
                    'laboratory': '🧬 مختبر',
                    'units': '📏 وحدات'
                };

                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <h3>${categoryNames[category] || category}</h3>
                    <p>${terms.length} مصطلح</p>
                `;
                bookCard.addEventListener('click', () => this.selectCategory(category));
                booksList.appendChild(bookCard);
            });
        }
    }

    selectCategory(category) {
        this.selectedCategory = category;
        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
        event.target.closest('.book-card').classList.add('active');
        document.getElementById('backBtn').style.display = 'block';
        this.displayTerms();
    }

    displayTerms() {
        const termsList = document.getElementById('termsList');

        if (!this.selectedCategory) {
            termsList.innerHTML = '<p class="empty-state">اختر فئة لعرض المصطلحات</p>';
            return;
        }

        let terms = this.database.chemistryTerms[this.selectedCategory] || [];

        if (this.currentFilter === 'ar') {
            terms = terms.filter(t => t.ar);
        } else if (this.currentFilter === 'en') {
            terms = terms.filter(t => t.en);
        }

        if (terms.length === 0) {
            termsList.innerHTML = '<p class="empty-state">لا توجد مصطلحات بهذه اللغة</p>';
            return;
        }

        termsList.innerHTML = terms.map(term => `
            <div class="term-card">
                <div class="term-header">
                    <div>
                        <div class="term-en">${term.en}</div>
                        <div class="term-ar">${term.ar}</div>
                    </div>
                </div>
                <button class="copy-btn" onclick="dict.copyToClipboard('${term.en} - ${term.ar}')">
                    📋 نسخ
                </button>
            </div>
        `).join('');
    }

    search(query) {
        if (!this.selectedCategory || !query.trim()) {
            this.displayTerms();
            return;
        }

        const searchLower = query.toLowerCase();
        const categoryTerms = this.database.chemistryTerms[this.selectedCategory] || [];
        const filtered = categoryTerms.filter(term =>
            term.en.toLowerCase().includes(searchLower) ||
            term.ar.includes(query)
        );

        const termsList = document.getElementById('termsList');
        if (filtered.length === 0) {
            termsList.innerHTML = '<p class="empty-state">لم يتم العثور على نتائج</p>';
            return;
        }

        termsList.innerHTML = filtered.map(term => `
            <div class="term-card">
                <div class="term-header">
                    <div>
                        <div class="term-en">${term.en}</div>
                        <div class="term-ar">${term.ar}</div>
                    </div>
                </div>
                <button class="copy-btn" onclick="dict.copyToClipboard('${term.en} - ${term.ar}')">
                    📋 نسخ
                </button>
            </div>
        `).join('');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('تم نسخ: ' + text);
        }).catch(err => {
            console.error('خطأ في النسخ:', err);
        });
    }

    exportDictionary() {
        if (!this.selectedCategory) {
            alert('الرجاء اختيار فئة أولاً');
            return;
        }

        const data = {
            category: this.selectedCategory,
            terms: this.database.chemistryTerms[this.selectedCategory],
            exportDate: new Date().toLocaleString('ar-SA')
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chemistry-${this.selectedCategory}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    goBack() {
        this.selectedCategory = null;
        this.displayCategories();
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('termsList').innerHTML = '<p class="empty-state">اختر فئة لعرض المصطلحات</p>';
        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
    }
}

// Initialize the dictionary when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dict = new ChemistryDictionary();
});
