document.addEventListener('DOMContentLoaded', () => {

    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.all-projects-grid .project-card');

    if (filterButtons.length === 0 || projectCards.length === 0) {
        console.error('Filter buttons or project cards not found');
        return;
    }

    projectCards.forEach(card => {
        card.classList.remove('hidden');
        card.style.display = 'block';
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {

            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            let visibleIndex = 0;

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                    card.style.display = 'block';

                    setTimeout(() => {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.9)';
                        card.offsetHeight;
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 10);
                    }, visibleIndex * 50);

                    visibleIndex++;
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';

                    setTimeout(() => {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // =============================
    // Intersection Observer
    // =============================
    const projectObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'scale(1)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    projectCards.forEach(card => {
        if (!card.classList.contains('hidden')) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            projectObserver.observe(card);
        }
    });

    // =============================
    // Mobile Menu Toggle
    // =============================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // =============================
    // Navbar Scroll Effect
    // =============================
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.pageYOffset > 100);
        });
    }

});
