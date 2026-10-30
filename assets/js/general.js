
(function () {
    const DEFAULT_LANG = 'EN';
    const SUPPORTED = ['EN', 'NL'];
    const translate_PATH = 'assets/lang/';  
    const cache = {};

    const lang  = document.getElementById('lang');
    const btn   = document.getElementById('lang-btn');
    const menu  = document.getElementById('lang-menu');
    const flag  = document.getElementById('lang-flag');
    const label = document.getElementById('lang-label');
    const items = menu.querySelectorAll('li');

    let requestId = 0;

    function setOpen(open) {
        lang.classList.toggle('is-open', open);
    }
 
    async function loadDict(code) {
        if (cache[code]) return cache[code];
        const res = await fetch(translate_PATH + code.toLowerCase() + '.json');
        if (!res.ok) throw new Error('Cannot load ' + code + ' translations: ' + res.status);
        cache[code] = await res.json();
        return cache[code];
    }

    function applyTranslations(dict) {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (dict[key] !== undefined) el.textContent = dict[key];
        });


        document.querySelectorAll('[data-translate-attr]').forEach(el => {
            el.dataset.translateAttr.split(';').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
            });
        });

        if (dict['page.title']) document.title = dict['page.title'];
    }

    async function setLang(code) {
        if (!SUPPORTED.includes(code)) code = DEFAULT_LANG;
        const id = ++requestId;


        items.forEach(li => {
            const active = li.dataset.lang === code;
            if (active) {
                flag.src = li.querySelector('img').src;
                label.textContent = code;
            }
        });
        document.documentElement.lang = code.toLowerCase();
        try { localStorage.setItem('lang', code); } catch (e) {}

        try {
            const dict = await loadDict(code);
            if (id !== requestId) return;
            applyTranslations(dict);
        } catch (err) {
            console.error(err);                
        }
    }

    btn.addEventListener('click', () => setOpen(!lang.classList.contains('is-open')));

    items.forEach(li => {
        li.addEventListener('click', () => {
            setLang(li.dataset.lang);
            setOpen(false);
        });
    });

    document.addEventListener('click', e => {
        if (!lang.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    });


    let initial = DEFAULT_LANG;
    try {
        const saved = localStorage.getItem('lang');
        if (saved && SUPPORTED.includes(saved)) {
            initial = saved;
        } else if ((navigator.language || '').toLowerCase().startsWith('nl')) {
            initial = 'NL';
        }
    } catch (e) {}
    setLang(initial);
})();
