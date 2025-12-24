/* ========= Helpers ========= */
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ========= Theme ========= */
(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);

    $("#themeToggle").addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "light" ? "" : "light";
        if (next) root.setAttribute("data-theme", next);
        else root.removeAttribute("data-theme");
        localStorage.setItem("theme", next || "");
    });
})();

/* ========= Year ========= */
$("#year").textContent = new Date().getFullYear();

/* ========= Smooth scroll ========= */
$$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", id);
    });
});

/* ========= Scroll progress ========= */
(() => {
    const bar = $(".progress__bar");
    const onScroll = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
        bar.style.width = `${p}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
})();

/* ========= Cursor glow + blob parallax ========= */
(() => {
    const cursor = $(".cursor");
    const blobs = $$(".blob");
    let mx = innerWidth * 0.5,
        my = innerHeight * 0.35;
    let tx = mx,
        ty = my;

    window.addEventListener("pointermove", (e) => {
        tx = e.clientX;
        ty = e.clientY;
    }, { passive: true });

    function raf() {
        mx += (tx - mx) * 0.08;
        my += (ty - my) * 0.08;
        cursor.style.left = `${mx}px`;
        cursor.style.top = `${my}px`;

        // parallax blobs
        const px = (mx / innerWidth - 0.5);
        const py = (my / innerHeight - 0.5);
        blobs.forEach((b, i) => {
            const s = (i + 1) * 18;
            b.style.transform = `translate3d(${px * s}px, ${py * s}px, 0)`;
        });

        requestAnimationFrame(raf);
    }
    raf();
})();

/* ========= Reveal on scroll ========= */
(() => {
    const items = $$(".reveal");
    const io = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
            if (ent.isIntersecting) {
                ent.target.classList.add("is-in");
                io.unobserve(ent.target);
            }
        });
    }, { threshold: 0.12 });

    items.forEach((el, idx) => {
        // stagger via transition delay
        el.style.transitionDelay = `${Math.min(idx * 70, 420)}ms`;
        io.observe(el);
    });
})();

/* ========= Active nav highlighting ========= */
(() => {
    const links = $$(".nav__link");
    const sections = links
        .map(a => document.querySelector(a.getAttribute("href")))
        .filter(Boolean);

    const setActive = (id) => {
        links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === id));
    };

    const io = new IntersectionObserver((entries) => {
        // pick the most visible section
        const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0.12, 0.2, 0.35] });

    sections.forEach(s => io.observe(s));
})();

/* ========= Typing effect ========= */
(() => {
    const el = $(".type");
    if (!el) return;
    const words = JSON.parse(el.getAttribute("data-type") || "[]");
    let wi = 0,
        ci = 0,
        del = false;

    const tick = () => {
        const w = words[wi % words.length] || "";
        if (!del) {
            ci++;
            el.textContent = w.slice(0, ci);
            if (ci >= w.length) {
                del = true;
                setTimeout(tick, 950);
                return;
            }
        } else {
            ci--;
            el.textContent = w.slice(0, ci);
            if (ci <= 0) {
                del = false;
                wi++;
            }
        }
        const speed = del ? 42 : 58;
        setTimeout(tick, speed + Math.random() * 35);
    };
    tick();
})();

/* ========= Count-up stats ========= */
(() => {
    const nums = $$(".stat__num");
    const io = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
            if (!ent.isIntersecting) return;
            const el = ent.target;
            io.unobserve(el);
            const target = Number(el.dataset.count || 0);
            const start = performance.now();
            const dur = 900;

            const anim = (t) => {
                const p = clamp((t - start) / dur, 0, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased);
                if (p < 1) requestAnimationFrame(anim);
            };
            requestAnimationFrame(anim);
        });
    }, { threshold: 0.6 });

    nums.forEach(n => io.observe(n));
})();

/* ========= Magnetic buttons ========= */
(() => {
    const magnets = $$(".magnetic");
    magnets.forEach((btn) => {
        btn.style.transform = "translate3d(0,0,0)";
        btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2);
            const y = e.clientY - (r.top + r.height / 2);
            const strength = btn.classList.contains("btn") ? 0.18 : 0.12;
            btn.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
        });
        btn.addEventListener("pointerleave", () => {
            btn.style.transform = "translate3d(0,0,0)";
        });
    });
})();

/* ========= 3D tilt cards + shine ========= */
(() => {
    const cards = $$(".card3d");
    cards.forEach(card => {
        card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            const rx = (py - 0.5) * -10; // rotateX
            const ry = (px - 0.5) * 12; // rotateY
            card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-1px)`;
            card.style.setProperty("--mx", `${px * 100}%`);
            card.style.setProperty("--my", `${py * 100}%`);
        });
        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
})();

/* ========= Skills popover ========= */
(() => {
    const pop = $("#popover");
    const title = $("#popTitle");
    const body = $("#popBody");

    const open = (t, b) => {
        title.textContent = t;
        body.textContent = b;
        pop.classList.add("is-open");
        pop.setAttribute("aria-hidden", "false");
    };

    $$(".chipbtn").forEach(btn => {
        btn.addEventListener("click", () => {
            open(btn.textContent.trim(), btn.dataset.pop || "Add details here.");
        });
    });

    document.addEventListener("click", (e) => {
        if (!pop.classList.contains("is-open")) return;
        if (pop.contains(e.target) || e.target.classList.contains("chipbtn")) return;
        pop.classList.remove("is-open");
        pop.setAttribute("aria-hidden", "true");
    });
})();

/* ========= Contact form (Real Submission) ========= */
(() => {
    const form = $("#contactForm");
    const statusMsg = $("#formStatus");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Honeypot check (bot trap)
        const honey = form.querySelector('input[name="_gotcha"]');
        if (honey && honey.value) {
            console.log("Bot detected.");
            return; // silent fail
        }

        const btn = form.querySelector("button[type='submit']");
        const txt = btn.querySelector(".btn__text");
        const ico = btn.querySelector(".btn__icon");
        const originalText = txt.textContent;

        // UI: Sending state
        btn.disabled = true;
        txt.textContent = "Sending...";

        // 2. Obfuscate ID: "mwvezkyp"
        const p1 = "mwv";
        const p2 = "ezk";
        const p3 = "yp";
        const endpoint = `https://formspree.io/f/${p1}${p2}${p3}`;

        // 3. Collect Data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                // Success Animation
                txt.textContent = "Sent!";
                ico.textContent = "✓";
                btn.style.transform = "translateY(-1px) scale(1.02)";
                btn.style.borderColor = "rgba(0,255,178,.35)";

                if (statusMsg) {
                    statusMsg.textContent = "Thanks! Message sent.";
                    statusMsg.style.color = "var(--color-accent)";
                }

                form.reset();

                // Reset button after delay
                setTimeout(() => {
                    btn.disabled = false;
                    txt.textContent = originalText;
                    ico.textContent = "✉";
                    btn.style.transform = "";
                    btn.style.borderColor = "";
                    if (statusMsg) statusMsg.textContent = "";
                }, 3000);
            } else {
                const json = await res.json();
                if (statusMsg) {
                    statusMsg.textContent = (json.errors && json.errors.map(err => err.message).join(", ")) || "Oops! Submission failed.";
                    statusMsg.style.color = "#ff4d4d";
                }
                btn.disabled = false;
                txt.textContent = originalText;
            }
        } catch (err) {
            if (statusMsg) {
                statusMsg.textContent = "Error: Could not send message.";
                statusMsg.style.color = "#ff4d4d";
            }
            btn.disabled = false;
            txt.textContent = originalText;
        }
    });
})();

/* ========= Contact Privacy ========= */
(() => {
    const emailLink = document.getElementById('emailLink');
    const emailText = document.getElementById('emailText');
    const phoneLink = document.getElementById('phoneLink');
    const phoneText = document.getElementById('phoneText');

    if (emailLink) {
        emailLink.addEventListener('click', (e) => {
            e.preventDefault();
            const user = 'ahmadwajahat312';
            const domain = 'gmail.com';
            const email = `${user}@${domain}`;
            emailLink.href = `mailto:${email}`;
            emailText.textContent = email;
            emailText.classList.remove('muted');
        });
    }

    if (phoneLink) {
        phoneLink.addEventListener('click', (e) => {
            e.preventDefault();
            const p = '+32 465 335173'; // Wajahat's phone
            phoneLink.href = `tel:${p.replace(/\s/g, '')}`;
            phoneText.textContent = p;
            phoneText.classList.remove('muted');
        });
    }
})();

/* ========= Resume link placeholder ========= */
(() => {
    // Put your resume file URL here when you have it:
    // e.g. "assets/YourName-Resume.pdf"
    const resumeUrl = "https://www.linkedin.com/in/wajahati-ahmad/overlay/1760459369925/single-media-viewer/?profileId=ACoAADJB3P0BxeeH4qM5MNv_HHy7Tk_fhh8mK5k";
    const a = $("#resumeLink");
    if (!a) return;
    if (!resumeUrl) {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Add your resume URL in assets/js/script.js (resumeUrl).");
        });
    } else {
        a.href = resumeUrl;
    }
})();

/* ========= Particles canvas ========= */
(() => {
    const canvas = $("#particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w, h, dpr;
    const resize = () => {
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        w = canvas.width = Math.floor(innerWidth * dpr);
        h = canvas.height = Math.floor(innerHeight * dpr);
        canvas.style.width = innerWidth + "px";
        canvas.style.height = innerHeight + "px";
    };
    window.addEventListener("resize", resize, { passive: true });
    resize();

    const N = Math.floor(Math.min(140, Math.max(70, innerWidth / 12)));
    const pts = Array.from({ length: N }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22 * dpr,
        vy: (Math.random() - 0.5) * 0.22 * dpr,
        r: (Math.random() * 1.6 + 0.6) * dpr
    }));

    let mx = w * 0.5,
        my = h * 0.35;
    window.addEventListener("pointermove", (e) => {
        mx = e.clientX * dpr;
        my = e.clientY * dpr;
    }, { passive: true });

    function step() {
        ctx.clearRect(0, 0, w, h);

        // Draw links
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            a.x += a.vx;
            a.y += a.vy;
            if (a.x < -20) a.x = w + 20;
            if (a.x > w + 20) a.x = -20;
            if (a.y < -20) a.y = h + 20;
            if (a.y > h + 20) a.y = -20;

            // mild attraction to cursor
            const dx = mx - a.x,
                dy = my - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 220 * dpr) {
                a.vx += (dx / (dist + 1)) * 0.0022 * dpr;
                a.vy += (dy / (dist + 1)) * 0.0022 * dpr;
            }

            // draw point
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "rgba(255,255,255,.9)";
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fill();

            // connect to nearby points
            for (let j = i + 1; j < pts.length; j++) {
                const b = pts[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                const maxD = 140 * dpr;
                if (d < maxD) {
                    const alpha = (1 - d / maxD) * 0.28;
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = "rgba(124,92,255,1)";
                    ctx.lineWidth = 1 * dpr;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(step);
    }
    step();
})();