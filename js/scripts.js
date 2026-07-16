/*!
* Start Bootstrap - Resume v7.0.5 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateToggleIcon(next);
    });

    function updateToggleIcon(theme) {
        themeToggle.innerHTML = theme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }

    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Projects: category groups — counts, quick-nav, scroll reveal, spotlight
    const projectsSection = document.getElementById('projects');
    if (projectsSection && projectsSection.querySelector('.proj-group')) {
        const groups = Array.from(projectsSection.querySelectorAll('.proj-group'));
        const navLinks = Array.from(projectsSection.querySelectorAll('.proj-nav-link'));
        const cards = Array.from(projectsSection.querySelectorAll('.proj-card'));

        // Scroll reveal — the js-anim class is added here so cards stay
        // visible when JS is unavailable
        projectsSection.querySelectorAll('.projects-grid')
            .forEach(grid => grid.classList.add('js-anim'));
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach((entry, i) => {
                if (!entry.isIntersecting) return;
                entry.target.style.setProperty('--d', `${i * 60}ms`);
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        cards.forEach(card => revealObserver.observe(card));

        // Per-group project counts (group header + quick-nav chip)
        groups.forEach(group => {
            const count = group.querySelectorAll('.proj-card').length;
            const headCount = group.querySelector('.proj-group-count');
            if (headCount) headCount.textContent = count;
            const navCount = projectsSection.querySelector(
                `.proj-nav-link[href="#${group.id}"] .proj-count`
            );
            if (navCount) navCount.textContent = count;
        });

        // Quick-nav: smooth scroll to the category group
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        navLinks.forEach(link => {
            link.addEventListener('click', e => {
                const target = document.querySelector(link.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
            });
        });

        // Highlight the chip of the group currently in view
        const spyObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(link => link.classList.toggle(
                    'is-active',
                    link.getAttribute('href') === `#${entry.target.id}`
                ));
            });
        }, { rootMargin: '-25% 0px -65% 0px' });
        groups.forEach(group => spyObserver.observe(group));

        // Spotlight follows the cursor inside each card (pointer devices only)
        if (window.matchMedia('(hover: hover)').matches) {
            projectsSection.addEventListener('mousemove', e => {
                const card = e.target.closest('.proj-card');
                if (!card) return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                card.style.setProperty('--my', `${e.clientY - rect.top}px`);
            });
        }
    }

});
