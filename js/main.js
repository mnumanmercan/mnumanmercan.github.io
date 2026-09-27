/* ==========================================================================
   Portfolio interactions — vanilla JS, no dependencies.
   Every feature degrades gracefully: without JS the page is fully readable.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.platform || "");

  const EMAIL = "numan.mercan24@gmail.com";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  // Icons live in the inline <svg class="sprite"> at the end of <body>
  const icon = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

  /* --- Toast ------------------------------------------------------------- */
  const toastEl = $("#toast");
  let toastTimer = 0;

  function toast(message, iconName = "circle-check") {
    if (!toastEl) return;
    toastEl.innerHTML = `${icon(iconName)}<span></span>`;
    toastEl.querySelector("span").textContent = message;
    toastEl.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-shown"), 2400);
  }

  async function copyEmail(button) {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast("Email copied to clipboard");
      if (button) {
        const label = $(".copy-btn-label", button);
        button.classList.add("is-copied");
        if (label) label.textContent = "Copied";
        setTimeout(() => {
          button.classList.remove("is-copied");
          if (label) label.textContent = "Copy email";
        }, 2000);
      }
    } catch {
      toast(EMAIL, "mail");
    }
  }

  /* --- Theme --------------------------------------------------------------- */
  const themeMeta = $('meta[name="theme-color"]');
  const themeButton = $("#themeToggle");

  function syncThemeUI() {
    const dark = root.dataset.theme === "dark";
    themeButton?.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    themeMeta?.setAttribute("content", dark ? "#09090c" : "#fafaf8");
  }

  function setTheme(theme, persist = true) {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        /* storage unavailable — theme still applies for this visit */
      }
    }
    syncThemeUI();
  }

  const themeQuips = {
    dark: ["Welcome back to the dark side.", "moon"],
    light: ["Light mode — a bold choice.", "sun"],
  };

  // Circular reveal from the toggle (View Transitions API), instant fallback.
  function toggleTheme(origin) {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    toast(...themeQuips[next]);
    if (!document.startViewTransition || reducedMotion.matches) {
      setTheme(next);
      return;
    }
    const rect = origin?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => setTheme(next));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {});
    transition.finished.finally(() => root.classList.remove("theme-switching"));
  }

  function initTheme() {
    syncThemeUI();
    themeButton?.addEventListener("click", () => toggleTheme(themeButton));

    // Follow the OS setting until the visitor picks a theme themselves
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
      let stored = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {
        /* ignore */
      }
      if (!stored) setTheme(event.matches ? "light" : "dark", false);
    });
  }

  /* --- Mobile menu ------------------------------------------------------------ */
  function initMenu() {
    const header = $("#siteHeader");
    const button = $("#menuToggle");
    const menu = $("#mobileMenu");
    if (!header || !button || !menu) return;

    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      header.classList.toggle("menu-open", open);
      root.classList.toggle("no-scroll", open);
      menu.hidden = !open;
    };

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        setOpen(false);
        button.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* --- Scroll-linked: progress bar, header state, timeline ------------------------ */
  function initScrollEffects() {
    const header = $("#siteHeader");
    const bar = $(".progress-bar");
    const timeline = $("#timeline");
    const items = timeline ? $$(".tl-item", timeline) : [];
    let queued = false;

    const update = () => {
      queued = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar?.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
      header?.classList.toggle("is-scrolled", y > 8);

      if (timeline) {
        const anchor = window.innerHeight * 0.55;
        const rect = timeline.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
        timeline.style.setProperty("--progress", progress.toFixed(4));
        items.forEach((item) => {
          const node = $(".tl-node", item).getBoundingClientRect();
          item.classList.toggle("is-reached", node.top + node.height / 2 <= anchor);
        });
      }
    };

    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  /* --- Scroll spy + sliding nav indicator --------------------------------------------- */
  function initScrollSpy() {
    const nav = $(".nav");
    const links = $$(".nav-link");
    const mobileLinks = $$(".mobile-nav a");
    const indicator = $(".nav-indicator");
    const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
    if (!sections.length) return;

    let activeId = null;
    const linkFor = (id) => links.find((link) => link.getAttribute("href") === `#${id}`);

    const moveIndicator = (link) => {
      if (!indicator) return;
      if (!link || !link.offsetWidth) {
        indicator.style.setProperty("--o", "0");
        return;
      }
      indicator.style.setProperty("--x", `${link.offsetLeft}px`);
      indicator.style.setProperty("--w", `${link.offsetWidth}px`);
      indicator.style.setProperty("--o", "1");
    };

    const setActive = (id) => {
      if (id === activeId) return;
      activeId = id;
      [...links, ...mobileLinks].forEach((link) => {
        const on = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      moveIndicator(linkFor(id));
    };

    // A thin band across the middle of the viewport decides the active section
    const intersecting = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersecting.add(entry.target);
          else intersecting.delete(entry.target);
        });
        const current = sections.find((section) => intersecting.has(section));
        setActive(current ? current.id : null);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => observer.observe(section));

    // The pill previews the hovered link, then settles back on the active one
    links.forEach((link) => link.addEventListener("pointerenter", () => moveIndicator(link)));
    nav?.addEventListener("pointerleave", () => moveIndicator(linkFor(activeId)));
    window.addEventListener("resize", () => moveIndicator(linkFor(activeId)));
    document.fonts?.ready.then(() => moveIndicator(linkFor(activeId)));
  }

  /* --- Reveal on scroll ------------------------------------------------------------------ */
  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            let index = 0;
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.style.setProperty("--i", String(index++));
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        )
      : null;

  function initReveal() {
    $$(".code .line").forEach((line, index) => line.style.setProperty("--l", String(index)));
    const targets = $$("[data-reveal]");
    if (!revealObserver) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    targets.forEach((el) => revealObserver.observe(el));
  }

  // Replays the reveal animation (used when filtering projects)
  function replayReveal(el, index) {
    revealObserver?.unobserve(el);
    el.classList.remove("is-visible");
    void el.offsetWidth;
    el.style.setProperty("--i", String(index));
    el.classList.add("is-visible");
  }

  /* --- Counters ----------------------------------------------------------------------------- */
  function initCounters() {
    const counters = $$("[data-count]");
    counters.forEach((el) => {
      if (el.dataset.countSource) {
        const total = $$(el.dataset.countSource).length;
        if (total) el.dataset.count = String(total);
      }
      el.textContent = Number(el.dataset.count).toFixed(Number(el.dataset.decimals || 0));
    });
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const animate = (el) => {
      const target = Number(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          animate(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => {
      el.textContent = (0).toFixed(Number(el.dataset.decimals || 0));
      observer.observe(el);
    });
  }

  /* --- Typed role -------------------------------------------------------------------------------- */
  function initTyped() {
    const el = $("[data-typed]");
    if (!el || reducedMotion.matches) return;
    let words;
    try {
      words = JSON.parse(el.dataset.typed);
    } catch {
      return;
    }
    if (!Array.isArray(words) || words.length < 2) return;

    let wordIndex = 0;
    let charIndex = words[0].length;
    let deleting = false;

    const tick = () => {
      const word = words[wordIndex];
      if (!deleting && charIndex === word.length) {
        deleting = true;
        setTimeout(tick, 2200);
        return;
      }
      if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(tick, 320);
        return;
      }
      charIndex += deleting ? -1 : 1;
      el.textContent = words[wordIndex].slice(0, charIndex);
      setTimeout(tick, deleting ? 32 : 65 + Math.random() * 55);
    };
    setTimeout(tick, 1400);
  }

  /* --- Pointer effects: card spotlight, hero glow, code-window tilt -------------------------------- */
  function initPointerEffects() {
    if (!finePointer.matches) return;
    const hero = $(".hero");
    const visual = $(".hero-visual");
    const codeWindow = $(".code-window");
    let frame = 0;
    let last = null;

    const apply = () => {
      frame = 0;
      const event = last;
      const card = event.target.closest?.("[data-spotlight]");
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (event.clientY <= rect.bottom) {
          hero.style.setProperty("--hx", `${event.clientX - rect.left}px`);
          hero.style.setProperty("--hy", `${event.clientY - rect.top}px`);
        }
      }
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        last = event;
        if (!frame) frame = requestAnimationFrame(apply);
      },
      { passive: true }
    );

    if (visual && codeWindow && !reducedMotion.matches) {
      visual.addEventListener("pointermove", (event) => {
        const rect = visual.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        codeWindow.style.setProperty("--ry", `${(px * 10).toFixed(2)}deg`);
        codeWindow.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
      });
      visual.addEventListener("pointerleave", () => {
        codeWindow.style.removeProperty("--ry");
        codeWindow.style.removeProperty("--rx");
      });
    }
  }

  /* --- Tabs (WAI-ARIA tabs pattern) ------------------------------------------------------------------ */
  function initTabs() {
    $$('[role="tablist"]').forEach((list) => {
      const tabs = $$('[role="tab"]', list);
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

      const select = (index, { focus = false, animate = true } = {}) => {
        tabs.forEach((tab, i) => {
          const on = i === index;
          tab.setAttribute("aria-selected", String(on));
          tab.tabIndex = on ? 0 : -1;
          const panel = panels[i];
          if (!panel) return;
          panel.hidden = !on;
          if (on && animate) {
            panel.classList.remove("is-entering");
            void panel.offsetWidth;
            panel.classList.add("is-entering");
          }
        });
        if (focus) tabs[index].focus();
      };

      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(i));
        tab.addEventListener("keydown", (event) => {
          const keys = { ArrowRight: 1, ArrowLeft: -1 };
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            select(event.key === "Home" ? 0 : tabs.length - 1, { focus: true });
          } else if (keys[event.key]) {
            event.preventDefault();
            select((i + keys[event.key] + tabs.length) % tabs.length, { focus: true });
          }
        });
      });

      const initial = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
      select(Math.max(0, initial), { animate: false });
    });
  }

  /* --- Project archive: filters + "show all" ------------------------------------------------------------ */
  function initProjectFilter() {
    const grid = $("#archive");
    if (!grid) return;
    const cards = $$(".p-card", grid);
    const buttons = $$("[data-filter]");
    const more = $("#archiveMore");
    const status = $("#archiveStatus");
    const LIMIT = 6;
    let filter = "all";
    let expanded = false;

    const matches = (card, value) => value === "all" || card.dataset.cats.split(" ").includes(value);

    buttons.forEach((button) => {
      const total = cards.filter((card) => matches(card, button.dataset.filter)).length;
      const count = $(".filter-count", button);
      if (count) count.textContent = String(total);
      if (!total) button.hidden = true;
    });

    const render = ({ animate = false, onlyNew = false } = {}) => {
      let shown = 0;
      let order = 0;
      const total = cards.filter((card) => matches(card, filter)).length;
      cards.forEach((card) => {
        const wasHidden = card.hidden;
        const visible = matches(card, filter) && (filter !== "all" || expanded || shown < LIMIT);
        card.hidden = !visible;
        if (!visible) return;
        shown += 1;
        if (animate && !reducedMotion.matches && (!onlyNew || wasHidden)) replayReveal(card, order++);
      });

      if (more) {
        more.hidden = !(filter === "all" && !expanded && total > LIMIT);
        const moreCount = $("[data-more-count]", more);
        if (moreCount) moreCount.textContent = String(total);
      }
      if (status) {
        const label = buttons.find((b) => b.dataset.filter === filter)?.firstChild.textContent.trim();
        status.textContent = `Showing ${shown} of ${total} ${filter === "all" ? "" : `${label} `}projects`;
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.filter === filter) return;
        filter = button.dataset.filter;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        render({ animate: true });
      });
    });

    more?.addEventListener("click", () => {
      expanded = true;
      render({ animate: true, onlyNew: true });
      cards.find((card) => !card.hidden && card.matches(":nth-child(n + 7)"))
        ?.querySelector("a")
        ?.focus({ preventScroll: true });
    });

    render();
  }

  /* --- Copy buttons ---------------------------------------------------------------------------------------- */
  function initCopy() {
    $$("[data-copy]").forEach((button) => button.addEventListener("click", () => copyEmail(button)));
  }

  /* --- Command palette (⌘K / Ctrl+K / "/") ------------------------------------------------------------------- */
  function initCommandPalette() {
    const dialog = $("#cmdk");
    const input = $("#cmdkInput");
    const list = $("#cmdkList");
    if (!dialog || !input || !list || typeof dialog.showModal !== "function") return;

    $$("[data-mod-key]").forEach((kbd) => {
      kbd.textContent = isMac ? "⌘K" : "Ctrl K";
    });

    const hrefOf = (name) => $(`[data-link="${name}"]`)?.href;
    const openUrl = (url) => url && window.open(url, "_blank", "noopener");
    const goTo = (hash) => {
      const target = $(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: scrollBehavior() });
      history.replaceState(null, "", hash === "#top" ? location.pathname : hash);
    };

    const sectionIcons = {
      about: "user",
      experience: "briefcase",
      projects: "layers",
      skills: "code",
      education: "graduation",
      contact: "send",
    };

    const commands = [
      ...$$(".nav-link").map((link) => {
        const id = link.getAttribute("href").slice(1);
        return {
          group: "Navigate",
          label: link.textContent.trim(),
          icon: sectionIcons[id] || "arrow-right",
          hint: `#${id}`,
          run: () => goTo(`#${id}`),
        };
      }),
      { group: "Navigate", label: "Back to top", icon: "arrow-up", run: () => goTo("#top") },
      { group: "Actions", label: "Copy email address", icon: "copy", keywords: "mail contact clipboard", run: () => copyEmail() },
      { group: "Actions", label: "Send an email", icon: "mail", keywords: "contact mailto", run: () => { location.href = `mailto:${EMAIL}`; } },
      {
        group: "Actions",
        label: "Toggle light / dark theme",
        icon: "moon",
        keywords: "theme mode appearance",
        run: () => toggleTheme(themeButton),
      },
      { group: "Actions", label: "Open resume", icon: "file", keywords: "cv pdf download", run: () => openUrl(hrefOf("resume")) },
      { group: "Links", label: "GitHub", icon: "github", hint: "@mnumanmercan", keywords: "code repos", run: () => openUrl(hrefOf("github")) },
      { group: "Links", label: "LinkedIn", icon: "linkedin", keywords: "profile", run: () => openUrl(hrefOf("linkedin")) },
      { group: "Links", label: "LeetCode", icon: "leetcode", keywords: "algorithms problems", run: () => openUrl(hrefOf("leetcode")) },
      { group: "Links", label: "X / Twitter", icon: "x", keywords: "twitter social", run: () => openUrl(hrefOf("x")) },
      { group: "Just for fun", label: "Brew coffee", icon: "coffee", keywords: "tea caffeine", run: () => toast("418 — I'm a teapot.", "coffee") },
      {
        group: "Just for fun",
        label: "Tabs or spaces?",
        icon: "keyboard",
        keywords: "indent format holy war",
        run: () => {
          const answers = ["Spaces. Two of them.", "Tabs — and I'll die on this hill.", "Whatever Prettier says."];
          toast(answers[Math.floor(Math.random() * answers.length)], "keyboard");
        },
      },
      {
        group: "Just for fun",
        label: "sudo hire numan",
        icon: "terminal",
        keywords: "job recruit role offer",
        run: () => {
          toast("Permission granted. Opening your mail client…", "terminal");
          setTimeout(() => {
            location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("sudo hire numan")}`;
          }, 900);
        },
      },
      { group: "Just for fun", label: "Toggle retro terminal mode", icon: "gamepad", keywords: "konami cheat green crt", run: () => toggleRetro() },
    ];

    let results = [];
    let active = 0;

    const setActive = (index, scroll = true) => {
      if (!results.length) return;
      active = (index + results.length) % results.length;
      $$(".cmdk-item", list).forEach((item, i) => item.setAttribute("aria-selected", String(i === active)));
      const current = $(`#cmdk-item-${active}`);
      input.setAttribute("aria-activedescendant", current ? current.id : "");
      if (scroll) current?.scrollIntoView({ block: "nearest" });
    };

    const render = () => {
      const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      results = commands.filter((command) => {
        const haystack = `${command.label} ${command.group} ${command.keywords || ""} ${command.hint || ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });

      if (!results.length) {
        list.innerHTML =
          '<li class="cmdk-empty" role="presentation">No results — even Stack Overflow couldn’t find that one.<br />Try “projects” or “email”.</li>';
        input.removeAttribute("aria-activedescendant");
        return;
      }

      let html = "";
      let group = "";
      results.forEach((command, i) => {
        if (command.group !== group) {
          group = command.group;
          html += `<li class="cmdk-group" role="presentation">${group}</li>`;
        }
        html +=
          `<li class="cmdk-item" id="cmdk-item-${i}" role="option" aria-selected="false" data-index="${i}">` +
          `<span class="cmdk-item-icon">${icon(command.icon)}</span>` +
          `<span class="cmdk-item-label"></span>` +
          (command.hint ? `<span class="cmdk-item-hint"></span>` : "") +
          "</li>";
      });
      list.innerHTML = html;
      $$(".cmdk-item", list).forEach((item) => {
        const command = results[Number(item.dataset.index)];
        $(".cmdk-item-label", item).textContent = command.label;
        const hint = $(".cmdk-item-hint", item);
        if (hint) hint.textContent = command.hint;
      });
      setActive(0, false);
    };

    const open = () => {
      if (dialog.open) return;
      input.value = "";
      render();
      dialog.showModal();
      input.focus();
    };

    const close = () => dialog.open && dialog.close();

    const run = (index) => {
      const command = results[index];
      if (!command) return;
      close();
      // Let the dialog close (and restore focus) before running the command
      requestAnimationFrame(() => command.run());
    };

    input.addEventListener("input", render);
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(active + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(active - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        run(active);
      }
    });

    list.addEventListener("pointermove", (event) => {
      const item = event.target.closest(".cmdk-item");
      if (item && Number(item.dataset.index) !== active) setActive(Number(item.dataset.index), false);
    });
    list.addEventListener("click", (event) => {
      const item = event.target.closest(".cmdk-item");
      if (item) run(Number(item.dataset.index));
    });

    // Click on the dimmed area (the dialog itself, outside the panel) closes it
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });

    $$("[data-cmdk-open]").forEach((button) => button.addEventListener("click", open));

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.open) close();
        else open();
        return;
      }
      const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
      if (event.key === "/" && !typing && !dialog.open) {
        event.preventDefault();
        open();
      }
    });
  }

  /* --- Marquee: duplicate the list once for a seamless loop ----------------------------------------------------- */
  function initMarquee() {
    $$(".marquee-track").forEach((track) => {
      const list = $(".marquee-list", track);
      if (!list) return;
      const clone = list.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
      track.classList.add("is-looping");
    });
  }

  /* --- Section eyebrows: "$ command" typed out when the section appears ------------------------------------------ */
  function initTerminalCommands() {
    $$(".eyebrow-cmd-text").forEach((el) => el.style.setProperty("--n", String(el.textContent.length)));
  }

  /* --- Small jokes ------------------------------------------------------------------------------------------------- */
  function toggleRetro() {
    const on = root.classList.toggle("retro");
    toast(on ? "Cheat code accepted — retro terminal mode on." : "Back to the future. Retro mode off.", "gamepad");
  }

  // "Catch Me If You Can": the card's icon dodges the pointer, like the original game — three times, then gives up
  function initDodge() {
    if (!finePointer.matches || reducedMotion.matches) return;
    $$("[data-dodge]").forEach((el) => {
      const card = el.closest(".p-card");
      let dodges = 0;
      el.addEventListener("pointerenter", () => {
        if (dodges >= 3) {
          el.dataset.tip = "Fine — you caught me.";
          el.classList.add("is-caught");
          return;
        }
        dodges += 1;
        const x = 36 + Math.random() * 110;
        const y = (Math.random() - 0.5) * 14;
        el.style.translate = `${x.toFixed(0)}px ${y.toFixed(0)}px`;
      });
      card?.addEventListener("pointerleave", () => {
        dodges = 0;
        el.style.translate = "";
        el.classList.remove("is-caught");
        delete el.dataset.tip;
      });
    });
  }

  // Konami code (↑ ↑ ↓ ↓ ← → ← → B A) toggles retro terminal mode
  function initKonami() {
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let position = 0;
    document.addEventListener("keydown", (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === sequence[position]) position += 1;
      else position = key === sequence[0] ? 1 : 0;
      if (position === sequence.length) {
        position = 0;
        toggleRetro();
      }
    });
  }

  // A hello for whoever opens DevTools
  function greetDevelopers() {
    console.log("%c👋 Hey, fellow developer!", "font: 600 15px system-ui, sans-serif; color: #ff7a4d;");
    console.log(
      "%cNo framework, no build step — just HTML, CSS and vanilla JS.\n" +
        "Source → https://github.com/mnumanmercan/mnumanmercan.github.io\n" +
        `Hiring? → ${EMAIL}\n\n` +
        "P.S. ↑ ↑ ↓ ↓ ← → ← → B A",
      "font: 12px ui-monospace, Menlo, monospace; color: #9a9aa6; line-height: 1.6;"
    );
  }

  /* --- Misc ----------------------------------------------------------------------------------------------------- */
  function initYear() {
    $$("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  initTheme();
  initMenu();
  initScrollEffects();
  initScrollSpy();
  initMarquee();
  initTabs();
  initProjectFilter();
  initReveal();
  initCounters();
  initTyped();
  initPointerEffects();
  initCopy();
  initCommandPalette();
  initTerminalCommands();
  initDodge();
  initKonami();
  initYear();
  greetDevelopers();
})();
