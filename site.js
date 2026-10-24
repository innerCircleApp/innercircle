(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Navigation: glass on scroll, mobile menu
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");

  const onScroll = () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    links?.classList.toggle("is-open", !open);
  });

  links?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.setAttribute("aria-expanded", "false");
      links.classList.remove("is-open");
    });
  });

  // Reveal on scroll
  const revealables = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealables.forEach((el) => revealer.observe(el));
  }

  // Cursor glow follows the pointer with easing
  if (finePointer && !reduceMotion) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let x = targetX;
    let y = targetY;
    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });
    const glide = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      requestAnimationFrame(glide);
    };
    requestAnimationFrame(glide);
  }

  // Hero phone: cycle screens and tilt toward the pointer
  const screens = document.querySelectorAll(".phone-screen img");
  if (screens.length > 1 && !reduceMotion) {
    let current = 0;
    setInterval(() => {
      screens[current].classList.remove("is-active");
      current = (current + 1) % screens.length;
      screens[current].classList.add("is-active");
    }, 3600);
  }

  const heroVisual = document.querySelector("[data-parallax]");
  if (heroVisual && finePointer && !reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      const dx = event.clientX / window.innerWidth - 0.5;
      const dy = event.clientY / window.innerHeight - 0.5;
      heroVisual.style.setProperty("--ry", `${dx * 10}deg`);
      heroVisual.style.setProperty("--rx", `${dy * -8}deg`);
    }, { passive: true });
  }

  // Feature cards: spotlight + tilt
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        card.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
        card.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  // Seamless marquee
  document.querySelectorAll(".marquee-track").forEach((track) => {
    Array.from(track.children).forEach((child) => {
      const clone = child.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
      track.appendChild(clone);
    });
  });

  // Scroll-linked effects
  const statement = document.querySelector("[data-words]");
  let words = [];
  if (statement) {
    const golden = new Set((statement.dataset.gold || "").split(",").map((w) => w.trim().toLowerCase()));
    const text = statement.textContent.trim().split(/\s+/);
    statement.textContent = "";
    words = text.map((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      if (golden.has(word.replace(/[^\p{L}+]/gu, "").toLowerCase())) span.classList.add("gold");
      span.textContent = word;
      statement.appendChild(span);
      if (index < text.length - 1) statement.appendChild(document.createTextNode(" "));
      return span;
    });
    if (reduceMotion) words.forEach((w) => w.classList.add("is-lit"));
  }

  const steps = document.querySelector("[data-progress]");
  const stepItems = steps ? Array.from(steps.querySelectorAll(".step")) : [];
  const readBar = document.querySelector(".read-progress");

  const progressThrough = (el, startRatio, endRatio) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * startRatio;
    const end = vh * endRatio;
    return Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height)));
  };

  let ticking = false;
  const onFrame = () => {
    ticking = false;
    if (words.length && !reduceMotion) {
      const p = progressThrough(statement, 0.85, 0.35);
      const lit = Math.round(p * words.length * 1.15);
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    }
    if (steps) {
      const p = reduceMotion ? 1 : progressThrough(steps, 0.8, 0.45);
      steps.style.setProperty("--progress", p.toFixed(3));
      stepItems.forEach((step, i) => {
        step.classList.toggle("is-reached", p >= i / Math.max(1, stepItems.length - 1) - 0.02);
      });
    }
    if (readBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      readBar.style.setProperty("--read", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    }
  };
  const requestFrame = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  };
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);
  onFrame();

  // FAQ: animated open and close
  document.querySelectorAll(".faq-list details").forEach((details) => {
    const summary = details.querySelector("summary");
    const answer = details.querySelector(".faq-answer");
    if (!summary || !answer || reduceMotion) return;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (details.open) {
        const animation = answer.animate(
          [{ height: `${answer.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        animation.onfinish = () => { details.open = false; };
      } else {
        details.open = true;
        const height = answer.offsetHeight;
        answer.animate(
          [{ height: "0px", opacity: 0 }, { height: `${height}px`, opacity: 1 }],
          { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
    });
  });

  // Legal pages: highlight the section being read
  const tocLinks = Array.from(document.querySelectorAll(".toc a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(tocLinks.map((link) => [link.getAttribute("href").slice(1), link]));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((link) => link.classList.remove("is-active"));
            byId.get(entry.target.id)?.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    document.querySelectorAll(".legal-body section[id]").forEach((section) => spy.observe(section));
  }

  // Support: copy email
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        const label = button.textContent;
        button.textContent = "Copied";
        button.classList.add("is-copied");
        setTimeout(() => {
          button.textContent = label;
          button.classList.remove("is-copied");
        }, 1800);
      } catch {
        window.location.href = `mailto:${button.dataset.copy}`;
      }
    });
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
