/* ============================================================
   まちハロ - 町田ハロウィンフェス
   ============================================================ */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --------------------------------------------------------
       オープニング
       -------------------------------------------------------- */
    (function opening() {
        var el = document.getElementById('opening');
        var ja = document.getElementById('opening-ja');
        var en = document.getElementById('opening-en');
        if (!el) return;

        function finish() {
            el.classList.add('is-done');
            document.body.classList.remove('is-loading');
        }

        if (reduceMotion) { finish(); return; }

        // 日本語 → 英字の順に現れる。時差は CSS の transition-delay 側で持たせる。
        requestAnimationFrame(function () {
            if (ja) ja.classList.add('is-active');
            if (en) en.classList.add('is-active');
        });
        setTimeout(finish, 2600);
    })();

    /* --------------------------------------------------------
       カウントダウン（開催日までの日数）
       -------------------------------------------------------- */
    (function countdown() {
        var out = document.getElementById('cd-days');
        if (!out) return;

        var EVENT_MONTH = 9;   // 0-indexed: 9 = 10月
        var EVENT_DATE = 25;

        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var target = new Date(now.getFullYear(), EVENT_MONTH, EVENT_DATE);
        if (target < today) target = new Date(now.getFullYear() + 1, EVENT_MONTH, EVENT_DATE);

        var days = Math.round((target - today) / 86400000);

        if (reduceMotion || days === 0) { out.textContent = String(days); return; }

        // 0 から数え上げる
        var shown = 0;
        var step = Math.max(1, Math.round(days / 40));
        var timer = setInterval(function () {
            shown += step;
            if (shown >= days) { shown = days; clearInterval(timer); }
            out.textContent = String(shown);
        }, 32);
    })();

    /* --------------------------------------------------------
       ヘッダー（スクロール状態）
       -------------------------------------------------------- */
    (function header() {
        var el = document.getElementById('header');
        if (!el) return;
        var ticking = false;
        function update() {
            el.classList.toggle('is-scrolled', window.scrollY > 60);
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    })();

    /* --------------------------------------------------------
       ハンバーガー / ドロワー
       -------------------------------------------------------- */
    (function drawer() {
        var btn = document.getElementById('hamburger');
        var nav = document.getElementById('header-nav');
        if (!btn || !nav) return;

        function setOpen(open) {
            btn.classList.toggle('is-open', open);
            nav.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
        }

        btn.addEventListener('click', function () {
            setOpen(!nav.classList.contains('is-open'));
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                setOpen(false);
                btn.focus();
            }
        });
    })();

    /* --------------------------------------------------------
       スクロールに合わせて要素が現れる
       -------------------------------------------------------- */
    (function reveal() {
        var items = document.querySelectorAll('.reveal');
        if (!items.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px' });

        items.forEach(function (el) { io.observe(el); });
    })();

    /* --------------------------------------------------------
       暖色のにじみ（マウス追従。光らせない）
       -------------------------------------------------------- */
    (function bleed() {
        var el = document.getElementById('bleed');
        if (!el || reduceMotion) return;
        if (!window.matchMedia('(hover: hover)').matches) return;

        var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
        var x = tx, y = ty;

        window.addEventListener('mousemove', function (e) {
            tx = e.clientX; ty = e.clientY;
        }, { passive: true });

        (function loop() {
            x += (tx - x) * 0.06;
            y += (ty - y) * 0.06;
            el.style.transform = 'translate(' + (x - 170) + 'px,' + (y - 170) + 'px)';
            requestAnimationFrame(loop);
        })();
    })();

    /* --------------------------------------------------------
       手描きモチーフが舞う（落ち葉・星・小鳥・コウモリ）
       絵文字ではなくパスで描くので、色をパレットに揃えられる。
       -------------------------------------------------------- */
    (function drift() {
        var canvas = document.getElementById('drift');
        if (!canvas || reduceMotion) return;

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = 0, H = 0;
        var items = [];

        var SHAPES = [
            { kind: 'leaf', colors: ['#F8B838', '#EE9046', '#98A878'] },
            { kind: 'leaf', colors: ['#F8B838', '#C2603A', '#486848'] },
            { kind: 'star', colors: ['#F8B838', '#F8A888', '#88B8B8'] },
            { kind: 'bird', colors: ['#88B8B8'] },
            { kind: 'bat',  colors: ['#485838'] }
        ];

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.floor(W * dpr);
            canvas.height = Math.floor(H * dpr);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function make(seedTop) {
            var s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            return {
                kind: s.kind,
                color: s.colors[Math.floor(Math.random() * s.colors.length)],
                x: Math.random() * W,
                y: seedTop ? -30 - Math.random() * H : Math.random() * H,
                size: 8 + Math.random() * 10,
                vy: 0.14 + Math.random() * 0.30,
                drift: 0.25 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.012,
                rot: Math.random() * Math.PI * 2,
                alpha: 0.16 + Math.random() * 0.18
            };
        }

        function drawLeaf(c, s) {
            c.beginPath();
            c.moveTo(0, -s);
            c.bezierCurveTo(s * 0.85, -s * 0.35, s * 0.85, s * 0.5, 0, s);
            c.bezierCurveTo(-s * 0.85, s * 0.5, -s * 0.85, -s * 0.35, 0, -s);
            c.fill();
        }
        function drawStar(c, s) {
            c.beginPath();
            c.moveTo(0, -s);
            c.bezierCurveTo(s * 0.14, -s * 0.28, s * 0.28, -s * 0.14, s, 0);
            c.bezierCurveTo(s * 0.28, s * 0.14, s * 0.14, s * 0.28, 0, s);
            c.bezierCurveTo(-s * 0.14, s * 0.28, -s * 0.28, s * 0.14, -s, 0);
            c.bezierCurveTo(-s * 0.28, -s * 0.14, -s * 0.14, -s * 0.28, 0, -s);
            c.fill();
        }
        function drawBird(c, s) {
            c.lineWidth = Math.max(1, s * 0.14);
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(-s, 0);
            c.quadraticCurveTo(-s * 0.5, -s * 0.62, 0, 0);
            c.quadraticCurveTo(s * 0.5, -s * 0.62, s, 0);
            c.stroke();
        }
        function drawBat(c, s) {
            c.beginPath();
            c.moveTo(0, -s * 0.2);
            c.lineTo(s * 0.22, -s * 0.55); c.lineTo(s * 0.3, -s * 0.1);
            c.lineTo(s * 0.62, -s * 0.45); c.lineTo(s * 0.55, s * 0.05);
            c.lineTo(s, -s * 0.05); c.lineTo(s * 0.45, s * 0.42);
            c.lineTo(0, s * 0.16);
            c.lineTo(-s * 0.45, s * 0.42); c.lineTo(-s, -s * 0.05);
            c.lineTo(-s * 0.55, s * 0.05); c.lineTo(-s * 0.62, -s * 0.45);
            c.lineTo(-s * 0.3, -s * 0.1); c.lineTo(-s * 0.22, -s * 0.55);
            c.closePath();
            c.fill();
        }

        function frame() {
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < items.length; i++) {
                var p = items[i];
                p.y += p.vy;
                p.phase += 0.006;
                p.rot += p.spin;
                var x = p.x + Math.sin(p.phase) * p.drift * 26;

                if (p.y - p.size > H) { items[i] = make(true); continue; }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.translate(x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.strokeStyle = p.color;
                if (p.kind === 'leaf') drawLeaf(ctx, p.size);
                else if (p.kind === 'star') drawStar(ctx, p.size);
                else if (p.kind === 'bird') drawBird(ctx, p.size);
                else drawBat(ctx, p.size);
                ctx.restore();
            }
            requestAnimationFrame(frame);
        }

        function seed() {
            var count = Math.min(Math.round(W / 110), 12);
            items = [];
            for (var i = 0; i < count; i++) items.push(make(false));
        }

        resize();
        seed();
        frame();

        var t;
        window.addEventListener('resize', function () {
            clearTimeout(t);
            t = setTimeout(function () { resize(); seed(); }, 200);
        });
    })();

    /* --------------------------------------------------------
       フライヤー ライトボックス
       -------------------------------------------------------- */
    (function flyerLightbox() {
        var flyerCard = document.getElementById('flyer-front-card');
        if (!flyerCard) return;

        var overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = '<div class="lightbox-inner"><img src="" alt="フライヤー拡大"><button class="lightbox-close" aria-label="閉じる">&times;</button></div>';
        document.body.appendChild(overlay);

        var img = overlay.querySelector('img');
        var closeBtn = overlay.querySelector('.lightbox-close');

        function open() {
            var src = flyerCard.querySelector('img');
            if (!src) return;
            img.src = src.src;
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        flyerCard.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });
    })();

})();
