// Chemistry Translator Application
class ChemistryTranslator {
    constructor() {
        this.database = null;
        this.allTerms = [];
        this.translationHistory = [];
        this.init();
    }

    async init() {
        await this.loadDatabase();
        this.setupEventListeners();
        this.loadHistory();
    }

    async loadDatabase() {
        try {
            const response = await fetch('chemistry-database.json');
            this.database = await response.json();
            this.extractAllTerms();
        } catch (error) {
            console.error('خطأ في تحميل قاعدة البيانات:', error);
        }
    }

    extractAllTerms() {
        this.allTerms = [];
        if (this.database.chemistryBooks) {
            this.database.chemistryBooks.forEach(book => {
                this.allTerms.push(...book.terms);
            });
        }
        if (this.database.commonTerms) {
            if (this.database.commonTerms.reactions) {
                this.allTerms.push(...this.database.commonTerms.reactions);
            }
            if (this.database.commonTerms.units) {
                this.allTerms.push(...this.database.commonTerms.units);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('sourceText').addEventListener('input', (e) => {
            this.updateWordCount();
        });

        document.getElementById('autoDetectBtn').addEventListener('click', () => this.detectTerms());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('swapBtn').addEventListener('click', () => this.swapTexts());
        document.getElementById('copySourceBtn').addEventListener('click', () => this.copyText('sourceText'));
        document.getElementById('copyTargetBtn').addEventListener('click', () => this.copyText('targetText'));
        document.getElementById('saveTranslationBtn').addEventListener('click', () => this.saveTranslation());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadTranslation());
        document.getElementById('printTransBtn').addEventListener('click', () => window.print());
    }

    updateWordCount() {
        const sourceText = document.getElementById('sourceText').value;
        const words = sourceText.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = sourceText.length;

        document.getElementById('sourceWordCount').textContent = words;
        document.getElementById('sourceCharCount').textContent = chars;
    }

    detectTerms() {
        const sourceText = document.getElementById('sourceText').value;
        
        if (!sourceText.trim()) {
            alert('الرجاء إدخال نص للترجمة');
            return;
        }

        const detectedTerms = [];
        const usedTerms = new Set();

        this.allTerms.forEach(term => {
            const regex = new RegExp(`\\b${term.en}\\b`, 'gi');
            if (regex.test(sourceText) && !usedTerms.has(term.en)) {
                detectedTerms.push(term);
                usedTerms.add(term.en);
            }
        });

        this.displayDetectedTerms(detectedTerms);
        this.translateText(sourceText, detectedTerms);
    }

    displayDetectedTerms(terms) {
        const container = document.getElementById('detectedTerms');

        if (terms.length === 0) {
            container.innerHTML = '<p class="empty-state">لم يتم اكتشاف مصطلحات معروفة</p>';
            return;
        }

        container.innerHTML = terms.map(term => `
            <div class="term-badge">
                <div class="term-en">${term.en}</div>
                <div class="term-ar">${term.ar}</div>
                <div class="term-desc">${term.definition}</div>
            </div>
        `).join('');
    }

    translateText(sourceText, terms) {
        let translated = sourceText;

        // إنشا معجم للترجمة
        const dictionary = {};
        terms.forEach(term => {
            dictionary[term.en] = term.ar;
            dictionary[term.en.toLowerCase()] = term.ar;
            dictionary[term.en.toUpperCase()] = term.ar;
        });

        // استبدال المصطلحات في النص
        Object.keys(dictionary).forEach(en => {
            const regex = new RegExp(`\\b${en}\\b`, 'g');
            translated = translated.replace(regex, dictionary[en]);
        });

        // عرض الترجمة
        document.getElementById('targetText').value = translated;

        // تحديث عدد الكلمات
        const words = translated.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = translated.length;
        document.getElementById('targetWordCount').textContent = words;
        document.getElementById('targetCharCount').textContent = chars;
    }

    swapTexts() {
        const sourceText = document.getElementById('sourceText').value;
        const targetText = document.getElementById('targetText').value;

        document.getElementById('sourceText').value = targetText;
        document.getElementById('targetText').value = sourceText;

        this.updateWordCount();
    }

    clearAll() {
        document.getElementById('sourceText').value = '';
        document.getElementById('targetText').value = '';
        document.getElementById('detectedTerms').innerHTML = '<p class="empty-state">لم يتم اكتشاف أي مصطلحات بعد</p>';
        document.getElementById('sourceWordCount').textContent = '0';
        document.getElementById('sourceCharCount').textContent = '0';
        document.getElementById('targetWordCount').textContent = '0';
        document.getElementById('targetCharCount').textContent = '0';
    }

    copyText(elementId) {
        const text = document.getElementById(elementId).value;
        navigator.clipboard.writeText(text).then(() => {
            alert('تم نسخ النص بنجاح!');
        }).catch(err => {
            console.error('خطأ في النسخ:', err);
        });
    }

    saveTranslation() {
        const source = document.getElementById('sourceText').value;
        const target = document.getElementById('targetText').value;

        if (!source || !target) {
            alert('الرجاء إدخال نص وترجمته');
            return;
        }

        const translation = {
            id: Date.now(),
            source: source,
            target: target,
            date: new Date().toLocaleString('ar-SA')
        };

        this.translationHistory.unshift(translation);
        localStorage.setItem('translationHistory', JSON.stringify(this.translationHistory));
        this.displayHistory();
        alert('تم حفظ الترجمة بنجاح!');
    }

    loadHistory() {
        const stored = localStorage.getItem('translationHistory');
        this.translationHistory = stored ? JSON.parse(stored) : [];
        this.displayHistory();
    }

    displayHistory() {
        const container = document.getElementById('translationHistory');

        if (this.translationHistory.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد ترجمات محفوظة</p>';
            return;
        }

        container.innerHTML = this.translationHistory.map((item, index) => `
            <div class="history-item" onclick="translator.loadFromHistory(${index})">
                <div class="history-date">📅 ${item.date}</div>
                <div class="history-preview">
                    <strong>المصدر:</strong> ${item.source.substring(0, 50)}...
                    <br>
                    <strong>الترجمة:</strong> ${item.target.substring(0, 50)}...
                </div>
            </div>
        `).join('');
    }

    loadFromHistory(index) {
        const item = this.translationHistory[index];
        document.getElementById('sourceText').value = item.source;
        document.getElementById('targetText').value = item.target;
        this.updateWordCount();
    }

    downloadTranslation() {
        const source = document.getElementById('sourceText').value;
        const target = document.getElementById('targetText').value;

        if (!source || !target) {
            alert('الرجاء إدخال نص وترجمته');
            return;
        }

        const data = {
            sourceText: source,
            translatedText: target,
            downloadDate: new Date().toLocaleString('ar-SA')
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `translation-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize the translator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new ChemistryTranslator();
});