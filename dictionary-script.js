// Dictionary Application
class ChemistryDictionary {
    constructor() {
        this.database = null;
        this.currentFilter = 'all';
        this.selectedBook = null;
        this.init();
    }

    async init() {
        await this.loadDatabase();
        this.setupEventListeners();
        this.displayBooks();
    }

    async loadDatabase() {
        try {
            const response = await fetch('chemistry-database.json');
            this.database = await response.json();
        } catch (error) {
            console.error('خطأ في تحميل قاعدة البيانات:', error);
            document.getElementById('termsList').innerHTML = 
                '<p class="empty-state">خطأ في تحميل قاعدة البيانات</p>';
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

    displayBooks() {
        const booksList = document.getElementById('booksList');
        booksList.innerHTML = '';

        this.database.chemistryBooks.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.innerHTML = `
                <h3>${book.titleAr}</h3>
                <p>${book.author}</p>
            `;
            bookCard.addEventListener('click', () => this.selectBook(book));
            booksList.appendChild(bookCard);
        });
    }

    selectBook(book) {
        this.selectedBook = book;
        this.displayTerms();
        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
        event.target.closest('.book-card').classList.add('active');
        document.getElementById('backBtn').style.display = 'block';
    }

    displayTerms() {
        const termsList = document.getElementById('termsList');

        if (!this.selectedBook) {
            termsList.innerHTML = '<p class="empty-state">اختر كتاباً لعرض المصطلحات</p>';
            return;
        }

        let terms = this.selectedBook.terms;

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
                <p class="term-definition">${term.definition}</p>
                <button class="copy-btn" onclick="dict.copyToClipboard('${term.en} - ${term.ar}')">
                    📋 نسخ
                </button>
            </div>
        `).join('');
    }

    search(query) {
        if (!this.selectedBook || !query.trim()) {
            this.displayTerms();
            return;
        }

        const searchLower = query.toLowerCase();
        const filtered = this.selectedBook.terms.filter(term =>
            term.en.toLowerCase().includes(searchLower) ||
            term.ar.includes(query) ||
            term.definition.toLowerCase().includes(searchLower)
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
                <p class="term-definition">${term.definition}</p>
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
        if (!this.selectedBook) {
            alert('الرجاء اختيار كتاب أولاً');
            return;
        }

        const data = {
            bookTitle: this.selectedBook.titleAr,
            bookTitleEn: this.selectedBook.titleEn,
            author: this.selectedBook.author,
            terms: this.selectedBook.terms,
            exportDate: new Date().toLocaleString('ar-SA')
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chemistry-${this.selectedBook.titleAr}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    goBack() {
        this.selectedBook = null;
        this.displayBooks();
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('termsList').innerHTML = '<p class="empty-state">اختر كتاباً لعرض المصطلحات</p>';
        document.querySelectorAll('.book-card').forEach(card => card.classList.remove('active'));
    }
}

// Initialize the dictionary when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dict = new ChemistryDictionary();
});