// ============================================
// SECRET ADMIN PANEL
// ============================================

(function () {
    'use strict';

    const DEFAULT_PASSWORD = '3hgroup2024';
    const STORAGE_KEYS = {
        PASSWORD_HASH: '3h_admin_pw',
        HERO_TITLE: '3h_hero_title',
        HERO_SUBTITLE: '3h_hero_subtitle',
        SERVICES: '3h_services',
        ABOUT_P1: '3h_about_p1',
        ABOUT_P2: '3h_about_p2',
        STATS: '3h_stats',
        CONTACT_ADDRESS: '3h_contact_address',
        CONTACT_PHONE: '3h_contact_phone',
        CONTACT_EMAIL: '3h_contact_email',
        // Home page projects (3 featured)
        HOME_CUSTOM_PROJECTS: '3h_home_custom_projects',
        HOME_DELETED_PROJECTS: '3h_home_deleted_projects',
        HOME_EDITED_PROJECTS: '3h_home_edited_projects',
        // Projects page (all projects)
        ALL_CUSTOM_PROJECTS: '3h_all_custom_projects',
        ALL_DELETED_PROJECTS: '3h_all_deleted_projects',
        ALL_EDITED_PROJECTS: '3h_all_edited_projects',
    };

    // ============================================
    // UTILITY: SHA-256 HASH
    // ============================================
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function getStoredHash() {
        let hash = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
        if (!hash) {
            hash = await hashPassword(DEFAULT_PASSWORD);
            localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);
        }
        return hash;
    }

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    function showToast(message, isError = false) {
        let toast = document.querySelector('.admin-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'admin-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.toggle('error', isError);
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ============================================
    // DETECT CURRENT PAGE
    // ============================================
    function isProjectsPage() {
        return window.location.pathname.includes('projects');
    }

    // ============================================
    // APPLY SAVED CHANGES ON PAGE LOAD
    // ============================================
    function applySavedChanges() {
        // Hero section (index only)
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroTitle && localStorage.getItem(STORAGE_KEYS.HERO_TITLE)) {
            heroTitle.textContent = localStorage.getItem(STORAGE_KEYS.HERO_TITLE);
        }
        if (heroSubtitle && localStorage.getItem(STORAGE_KEYS.HERO_SUBTITLE)) {
            heroSubtitle.textContent = localStorage.getItem(STORAGE_KEYS.HERO_SUBTITLE);
        }

        // Services (index only)
        const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
        if (savedServices) {
            const services = JSON.parse(savedServices);
            const cards = document.querySelectorAll('.service-card');
            services.forEach((svc, i) => {
                if (cards[i]) {
                    const h3 = cards[i].querySelector('h3');
                    const p = cards[i].querySelector('p');
                    if (h3) h3.textContent = svc.title;
                    if (p) p.textContent = svc.desc;
                }
            });
        }

        // About section (index only)
        const aboutPs = document.querySelectorAll('.about-text > p');
        if (aboutPs.length >= 2) {
            if (localStorage.getItem(STORAGE_KEYS.ABOUT_P1)) aboutPs[0].textContent = localStorage.getItem(STORAGE_KEYS.ABOUT_P1);
            if (localStorage.getItem(STORAGE_KEYS.ABOUT_P2)) aboutPs[1].textContent = localStorage.getItem(STORAGE_KEYS.ABOUT_P2);
        }

        // Stats
        const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            const statItems = document.querySelectorAll('.stat-item');
            stats.forEach((s, i) => {
                if (statItems[i]) {
                    const num = statItems[i].querySelector('.stat-number');
                    const label = statItems[i].querySelector('.stat-label');
                    if (num) num.setAttribute('data-target', s.value);
                    if (label) label.textContent = s.label;
                }
            });
        }

        // Contact info (index only)
        const contactItems = document.querySelectorAll('.contact-item');
        if (contactItems.length >= 3) {
            if (localStorage.getItem(STORAGE_KEYS.CONTACT_ADDRESS)) {
                contactItems[0].querySelector('p').textContent = localStorage.getItem(STORAGE_KEYS.CONTACT_ADDRESS);
            }
            if (localStorage.getItem(STORAGE_KEYS.CONTACT_PHONE)) {
                contactItems[1].querySelector('p').textContent = localStorage.getItem(STORAGE_KEYS.CONTACT_PHONE);
            }
            if (localStorage.getItem(STORAGE_KEYS.CONTACT_EMAIL)) {
                contactItems[2].querySelector('p').textContent = localStorage.getItem(STORAGE_KEYS.CONTACT_EMAIL);
            }
        }

        // Apply project changes based on current page
        if (isProjectsPage()) {
            applyProjectChanges('.all-projects-grid', STORAGE_KEYS.ALL_DELETED_PROJECTS, STORAGE_KEYS.ALL_EDITED_PROJECTS, STORAGE_KEYS.ALL_CUSTOM_PROJECTS);
        } else {
            applyProjectChanges('.projects-grid', STORAGE_KEYS.HOME_DELETED_PROJECTS, STORAGE_KEYS.HOME_EDITED_PROJECTS, STORAGE_KEYS.HOME_CUSTOM_PROJECTS);
        }
    }

    function applyProjectChanges(gridSelector, deletedKey, editedKey, customKey) {
        const deletedProjects = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        const editedProjects = JSON.parse(localStorage.getItem(editedKey) || '{}');
        const projectCards = document.querySelectorAll(gridSelector + ' .project-card');

        projectCards.forEach((card, i) => {
            if (deletedProjects.includes(i)) {
                card.style.display = 'none';
            }
            if (editedProjects[i]) {
                const overlay = card.querySelector('.project-overlay');
                if (overlay) {
                    const h3 = overlay.querySelector('h3');
                    const p = overlay.querySelector('p');
                    if (h3 && editedProjects[i].title) h3.textContent = editedProjects[i].title;
                    if (p && editedProjects[i].desc) p.textContent = editedProjects[i].desc;
                }
                if (editedProjects[i].category) {
                    card.setAttribute('data-category', editedProjects[i].category);
                    const catSpan = card.querySelector('.project-category');
                    if (catSpan) catSpan.textContent = editedProjects[i].category;
                }
            }
        });

        // Add custom projects
        const customProjects = JSON.parse(localStorage.getItem(customKey) || '[]');
        const grid = document.querySelector(gridSelector);
        if (grid && customProjects.length > 0) {
            customProjects.forEach(proj => {
                const card = document.createElement('div');
                card.className = 'project-card visible';
                if (proj.category) card.setAttribute('data-category', proj.category);
                card.innerHTML = `
                    <div class="project-image" style="background-image: url('${proj.image}'); background-size: cover; background-position: center;">
                        <div class="project-overlay">
                            <h3>${proj.title}</h3>
                            <p>${proj.desc}</p>
                            ${proj.category ? `<span class="project-category">${proj.category}</span>` : ''}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    }

    // ============================================
    // BUILD PASSWORD MODAL
    // ============================================
    function createPasswordModal() {
        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'passwordModal';
        overlay.innerHTML = `
            <div class="password-modal">
                <h2>🔒 Admin Access</h2>
                <p class="modal-subtitle">Enter password to continue</p>
                <input type="password" id="adminPasswordInput" placeholder="Enter password..." autocomplete="off">
                <div class="modal-error" id="modalError"></div>
                <div class="modal-actions">
                    <button class="btn-modal-cancel" id="modalCancel">Cancel</button>
                    <button class="btn-modal-submit" id="modalSubmit">Unlock</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('modalCancel').addEventListener('click', () => {
            overlay.classList.remove('active');
            document.getElementById('adminPasswordInput').value = '';
            document.getElementById('modalError').textContent = '';
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.getElementById('adminPasswordInput').value = '';
                document.getElementById('modalError').textContent = '';
            }
        });

        document.getElementById('modalSubmit').addEventListener('click', handlePasswordSubmit);
        document.getElementById('adminPasswordInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handlePasswordSubmit();
        });
    }

    async function handlePasswordSubmit() {
        const input = document.getElementById('adminPasswordInput');
        const error = document.getElementById('modalError');
        const password = input.value.trim();

        if (!password) {
            error.textContent = 'Please enter a password';
            return;
        }

        const hash = await hashPassword(password);
        const storedHash = await getStoredHash();

        if (hash === storedHash) {
            document.getElementById('passwordModal').classList.remove('active');
            input.value = '';
            error.textContent = '';
            openAdminPanel();
        } else {
            error.textContent = 'Incorrect password';
            input.value = '';
            input.focus();
        }
    }

    // ============================================
    // BUILD ADMIN PANEL
    // ============================================
    function createAdminPanel() {
        const overlay = document.createElement('div');
        overlay.className = 'admin-panel-overlay';
        overlay.id = 'adminPanel';
        overlay.innerHTML = `
            <div class="admin-header">
                <h1>Admin Panel</h1>
                <div class="admin-header-actions">
                    <button class="btn-admin btn-admin-save" id="adminSave">💾 Save All</button>
                    <button class="btn-admin btn-admin-close" id="adminClose">✕ Close</button>
                </div>
            </div>
            <div class="admin-body">
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="text">📝 Edit Text</button>
                    <button class="admin-tab" data-tab="home-projects">🏠 Home Projects</button>
                    <button class="admin-tab" data-tab="all-projects">📋 All Projects</button>
                    <button class="admin-tab" data-tab="settings">⚙️ Settings</button>
                </div>

                <!-- TEXT EDITING TAB -->
                <div class="admin-tab-content active" id="tab-text">
                    <div class="admin-section">
                        <h3>Hero Section</h3>
                        <div class="admin-field">
                            <label>Title</label>
                            <input type="text" id="admin-hero-title">
                        </div>
                        <div class="admin-field">
                            <label>Subtitle</label>
                            <input type="text" id="admin-hero-subtitle">
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Services</h3>
                        <div id="admin-services-container"></div>
                    </div>

                    <div class="admin-section">
                        <h3>About Section</h3>
                        <div class="admin-field">
                            <label>Paragraph 1</label>
                            <textarea id="admin-about-p1" rows="3"></textarea>
                        </div>
                        <div class="admin-field">
                            <label>Paragraph 2</label>
                            <textarea id="admin-about-p2" rows="3"></textarea>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Stats</h3>
                        <div id="admin-stats-container"></div>
                    </div>

                    <div class="admin-section">
                        <h3>Contact Info</h3>
                        <div class="admin-field">
                            <label>Address</label>
                            <input type="text" id="admin-contact-address">
                        </div>
                        <div class="admin-field">
                            <label>Phone</label>
                            <input type="tel" id="admin-contact-phone">
                        </div>
                        <div class="admin-field">
                            <label>Email</label>
                            <input type="email" id="admin-contact-email">
                        </div>
                    </div>
                </div>

                <!-- HOME PAGE PROJECTS TAB -->
                <div class="admin-tab-content" id="tab-home-projects">
                    <div class="admin-section" style="border-left: 3px solid #E63946; padding-left: 1.2rem;">
                        <h3>🏠 Home Page — Featured Projects</h3>
                        <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-bottom:1rem;">These are the 3 featured projects shown on the main page</p>
                    </div>

                    <div class="add-project-form">
                        <h3>➕ Add Project to Home Page</h3>
                        <div class="file-upload-area" id="homeFileUploadArea">
                            <div class="upload-icon">📤</div>
                            <p>Click to upload project image</p>
                            <input type="file" id="homeProjectImageInput" accept="image/*" style="display:none">
                        </div>
                        <div class="admin-field">
                            <label>Project Title</label>
                            <input type="text" id="homeNewProjectTitle" placeholder="e.g. Modern Villa Complex">
                        </div>
                        <div class="admin-field">
                            <label>Description</label>
                            <input type="text" id="homeNewProjectDesc" placeholder="e.g. Luxury residential development">
                        </div>
                        <button class="btn-add-project" id="homeAddProjectBtn">Add to Home Page</button>
                    </div>

                    <div class="admin-section">
                        <h3>Existing Home Projects</h3>
                        <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-bottom:1rem;">Hover to edit ✏️ or delete ✕</p>
                        <div class="admin-projects-grid" id="homeProjectsGrid"></div>
                    </div>
                </div>

                <!-- ALL PROJECTS PAGE TAB -->
                <div class="admin-tab-content" id="tab-all-projects">
                    <div class="admin-section" style="border-left: 3px solid #2563EB; padding-left: 1.2rem;">
                        <h3>📋 Projects Page — All Projects</h3>
                        <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-bottom:1rem;">These are all projects shown on the dedicated Projects page</p>
                    </div>

                    <div class="add-project-form">
                        <h3>➕ Add Project to Projects Page</h3>
                        <div class="file-upload-area" id="allFileUploadArea">
                            <div class="upload-icon">📤</div>
                            <p>Click to upload project image</p>
                            <input type="file" id="allProjectImageInput" accept="image/*" style="display:none">
                        </div>
                        <div class="admin-field">
                            <label>Project Title</label>
                            <input type="text" id="allNewProjectTitle" placeholder="e.g. Modern Villa Complex">
                        </div>
                        <div class="admin-field">
                            <label>Description</label>
                            <input type="text" id="allNewProjectDesc" placeholder="e.g. Luxury residential development">
                        </div>
                        <div class="admin-field">
                            <label>Category</label>
                            <select id="allNewProjectCategory" style="width:100%; padding:0.75rem 1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.95rem; font-family:'Inter',sans-serif;">
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="development">Development</option>
                            </select>
                        </div>
                        <button class="btn-add-project" id="allAddProjectBtn">Add to Projects Page</button>
                    </div>

                    <div class="admin-section">
                        <h3>Existing Projects</h3>
                        <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-bottom:1rem;">Hover to edit ✏️ or delete ✕</p>
                        <div class="admin-projects-grid" id="allProjectsGrid"></div>
                    </div>
                </div>

                <!-- SETTINGS TAB -->
                <div class="admin-tab-content" id="tab-settings">
                    <div class="admin-section">
                        <h3>Change Admin Password</h3>
                        <div class="admin-field">
                            <label>New Password</label>
                            <input type="password" id="newAdminPassword" placeholder="Enter new password">
                        </div>
                        <div class="admin-field">
                            <label>Confirm Password</label>
                            <input type="password" id="confirmAdminPassword" placeholder="Confirm new password">
                        </div>
                        <button class="btn-add-project" id="changePasswordBtn">Update Password</button>
                    </div>

                    <div class="admin-section">
                        <h3>Reset All Changes</h3>
                        <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-bottom:1rem;">This will remove all custom edits and restore the website to its original state.</p>
                        <button class="btn-add-project" id="resetAllBtn" style="background:#ff6b6b;">🗑️ Reset Everything</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Tab switching
        overlay.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                overlay.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            });
        });

        // Close
        document.getElementById('adminClose').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        // Save
        document.getElementById('adminSave').addEventListener('click', saveAllChanges);

        // Home page file upload
        const homeUpload = document.getElementById('homeFileUploadArea');
        const homeInput = document.getElementById('homeProjectImageInput');
        homeUpload.addEventListener('click', () => homeInput.click());
        homeInput.addEventListener('change', (e) => handleImageUpload(e, 'home'));

        // All projects file upload
        const allUpload = document.getElementById('allFileUploadArea');
        const allInput = document.getElementById('allProjectImageInput');
        allUpload.addEventListener('click', () => allInput.click());
        allInput.addEventListener('change', (e) => handleImageUpload(e, 'all'));

        // Add project buttons
        document.getElementById('homeAddProjectBtn').addEventListener('click', () => addNewProject('home'));
        document.getElementById('allAddProjectBtn').addEventListener('click', () => addNewProject('all'));

        // Change password
        document.getElementById('changePasswordBtn').addEventListener('click', changePassword);

        // Reset all
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            if (confirm('Are you sure? This will delete ALL your customizations.')) {
                Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                showToast('All changes reset. Reloading...');
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    // ============================================
    // OPEN ADMIN PANEL — POPULATE FIELDS
    // ============================================
    function openAdminPanel() {
        const panel = document.getElementById('adminPanel');
        panel.classList.add('active');

        // Hero
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        document.getElementById('admin-hero-title').value = heroTitle ? heroTitle.textContent : (localStorage.getItem(STORAGE_KEYS.HERO_TITLE) || '');
        document.getElementById('admin-hero-subtitle').value = heroSubtitle ? heroSubtitle.textContent : (localStorage.getItem(STORAGE_KEYS.HERO_SUBTITLE) || '');

        // Services
        const servicesContainer = document.getElementById('admin-services-container');
        servicesContainer.innerHTML = '';
        const serviceCards = document.querySelectorAll('.service-card');
        const savedServices = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || 'null');
        if (serviceCards.length > 0) {
            serviceCards.forEach((card, i) => {
                const h3 = card.querySelector('h3');
                const p = card.querySelector('p');
                servicesContainer.innerHTML += buildFieldRow(`Service ${i + 1} Title`, 'svc-title', h3 ? h3.textContent : '', 'Description', 'svc-desc', p ? p.textContent : '');
            });
        } else if (savedServices) {
            savedServices.forEach((svc, i) => {
                servicesContainer.innerHTML += buildFieldRow(`Service ${i + 1} Title`, 'svc-title', svc.title, 'Description', 'svc-desc', svc.desc);
            });
        }

        // About
        const aboutPs = document.querySelectorAll('.about-text > p');
        document.getElementById('admin-about-p1').value = aboutPs[0] ? aboutPs[0].textContent : (localStorage.getItem(STORAGE_KEYS.ABOUT_P1) || '');
        document.getElementById('admin-about-p2').value = aboutPs[1] ? aboutPs[1].textContent : (localStorage.getItem(STORAGE_KEYS.ABOUT_P2) || '');

        // Stats
        const statsContainer = document.getElementById('admin-stats-container');
        statsContainer.innerHTML = '';
        const statItems = document.querySelectorAll('.stat-item');
        const savedStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || 'null');
        if (statItems.length > 0) {
            statItems.forEach((item, i) => {
                const num = item.querySelector('.stat-number');
                const label = item.querySelector('.stat-label');
                statsContainer.innerHTML += buildFieldRow(`Stat ${i + 1} Value`, 'stat-value', num ? num.getAttribute('data-target') : '', 'Label', 'stat-label-input', label ? label.textContent : '', 'number');
            });
        } else if (savedStats) {
            savedStats.forEach((s, i) => {
                statsContainer.innerHTML += buildFieldRow(`Stat ${i + 1} Value`, 'stat-value', s.value, 'Label', 'stat-label-input', s.label, 'number');
            });
        }

        // Contact
        const contactItems = document.querySelectorAll('.contact-item');
        document.getElementById('admin-contact-address').value = contactItems[0] ? contactItems[0].querySelector('p').textContent : (localStorage.getItem(STORAGE_KEYS.CONTACT_ADDRESS) || '');
        document.getElementById('admin-contact-phone').value = contactItems[1] ? contactItems[1].querySelector('p').textContent : (localStorage.getItem(STORAGE_KEYS.CONTACT_PHONE) || '');
        document.getElementById('admin-contact-email').value = contactItems[2] ? contactItems[2].querySelector('p').textContent : (localStorage.getItem(STORAGE_KEYS.CONTACT_EMAIL) || '');

        // Populate both project grids
        populateProjectsGrid('home');
        populateProjectsGrid('all');
    }

    function buildFieldRow(label1, class1, value1, label2, class2, value2, type1 = 'text') {
        return `
            <div style="display:grid; grid-template-columns:1fr 2fr; gap:0.8rem; margin-bottom:0.8rem;">
                <div class="admin-field" style="margin:0">
                    <label>${label1}</label>
                    <input type="${type1}" class="${class1}" value="${(value1 || '').replace(/"/g, '&quot;')}">
                </div>
                <div class="admin-field" style="margin:0">
                    <label>${label2}</label>
                    <input type="text" class="${class2}" value="${(value2 || '').replace(/"/g, '&quot;')}">
                </div>
            </div>
        `;
    }

    // ============================================
    // POPULATE PROJECTS GRID IN ADMIN
    // ============================================
    function populateProjectsGrid(section) {
        // section = 'home' or 'all'
        const gridId = section === 'home' ? 'homeProjectsGrid' : 'allProjectsGrid';
        const deletedKey = section === 'home' ? STORAGE_KEYS.HOME_DELETED_PROJECTS : STORAGE_KEYS.ALL_DELETED_PROJECTS;
        const editedKey = section === 'home' ? STORAGE_KEYS.HOME_EDITED_PROJECTS : STORAGE_KEYS.ALL_EDITED_PROJECTS;
        const customKey = section === 'home' ? STORAGE_KEYS.HOME_CUSTOM_PROJECTS : STORAGE_KEYS.ALL_CUSTOM_PROJECTS;
        const gridSelector = section === 'home' ? '.projects-grid' : '.all-projects-grid';

        const grid = document.getElementById(gridId);
        grid.innerHTML = '';
        const deletedProjects = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        const editedProjects = JSON.parse(localStorage.getItem(editedKey) || '{}');
        const customProjects = JSON.parse(localStorage.getItem(customKey) || '[]');

        // Get original project cards from the page (if on that page)
        const pageCards = document.querySelectorAll(gridSelector + ' .project-card');
        const originalCount = pageCards.length - customProjects.length;

        // If we're on the right page, read projects from DOM
        if (pageCards.length > 0) {
            let idx = 0;
            pageCards.forEach((card) => {
                if (idx >= originalCount) return;
                const overlay = card.querySelector('.project-overlay');
                const title = overlay ? overlay.querySelector('h3').textContent : 'Project';
                const desc = overlay ? overlay.querySelector('p').textContent : '';
                const bgImage = card.querySelector('.project-image');
                const bgStyle = bgImage ? bgImage.style.backgroundImage : '';
                const imgUrl = bgStyle.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');
                const isDeleted = deletedProjects.includes(idx);

                appendProjectCard(grid, imgUrl, title, desc, isDeleted, 'default', idx, section);
                idx++;
            });
        } else {
            // We're on the other page — show a message but still allow managing via localStorage
            // We can show the edited/deleted state info
            const editedKeys = Object.keys(editedProjects);
            if (editedKeys.length > 0 || deletedProjects.length > 0) {
                const infoDiv = document.createElement('p');
                infoDiv.style.cssText = 'color:rgba(255,255,255,0.4); font-size:0.85rem; font-style:italic;';
                infoDiv.textContent = `${section === 'home' ? 'Open the home page' : 'Open the projects page'} to see and manage the default projects here.`;
                grid.appendChild(infoDiv);
            } else {
                const infoDiv = document.createElement('p');
                infoDiv.style.cssText = 'color:rgba(255,255,255,0.4); font-size:0.85rem; font-style:italic;';
                infoDiv.textContent = `${section === 'home' ? 'Open the home page' : 'Open the projects page'} to see and manage the default projects here.`;
                grid.appendChild(infoDiv);
            }
        }

        // Show custom projects (always accessible via localStorage)
        customProjects.forEach((proj, i) => {
            appendProjectCard(grid, proj.image, proj.title, proj.desc, false, 'custom', i, section);
        });

        // Bind all buttons
        bindProjectButtons(grid, section);
    }

    function appendProjectCard(grid, imgUrl, title, desc, isDeleted, type, index, section) {
        const card = document.createElement('div');
        card.className = 'admin-project-card';
        if (isDeleted) card.style.opacity = '0.3';
        const fallbackImg = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22140%22><rect fill=%22%231E3A8A%22 width=%22200%22 height=%22140%22/><text fill=%22white%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>";
        card.innerHTML = `
            <img src="${imgUrl || fallbackImg}" alt="${title}">
            <div class="card-info">
                <h4>${title}</h4>
                <p>${desc}</p>
            </div>
            <button class="edit-btn" data-type="${type}" data-index="${index}" data-section="${section}" title="Edit">✏️</button>
            <button class="delete-btn" data-type="${type}" data-index="${index}" data-section="${section}" title="${isDeleted ? 'Restore' : 'Delete'}">${isDeleted ? '↩' : '✕'}</button>
        `;
        grid.appendChild(card);
    }

    function bindProjectButtons(grid, section) {
        const deletedKey = section === 'home' ? STORAGE_KEYS.HOME_DELETED_PROJECTS : STORAGE_KEYS.ALL_DELETED_PROJECTS;
        const customKey = section === 'home' ? STORAGE_KEYS.HOME_CUSTOM_PROJECTS : STORAGE_KEYS.ALL_CUSTOM_PROJECTS;

        grid.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openEditProjectModal(btn.dataset.type, parseInt(btn.dataset.index), btn.dataset.section);
            });
        });

        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                if (type === 'default') {
                    let deleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
                    if (deleted.includes(index)) {
                        deleted = deleted.filter(d => d !== index);
                        showToast('Project restored');
                    } else {
                        deleted.push(index);
                        showToast('Project hidden');
                    }
                    localStorage.setItem(deletedKey, JSON.stringify(deleted));
                } else {
                    let customs = JSON.parse(localStorage.getItem(customKey) || '[]');
                    customs.splice(index, 1);
                    localStorage.setItem(customKey, JSON.stringify(customs));
                    showToast('Custom project deleted');
                }
                populateProjectsGrid(section);
            });
        });
    }

    // ============================================
    // EDIT PROJECT MODAL
    // ============================================
    function openEditProjectModal(type, index, section) {
        const editedKey = section === 'home' ? STORAGE_KEYS.HOME_EDITED_PROJECTS : STORAGE_KEYS.ALL_EDITED_PROJECTS;
        const customKey = section === 'home' ? STORAGE_KEYS.HOME_CUSTOM_PROJECTS : STORAGE_KEYS.ALL_CUSTOM_PROJECTS;
        const gridSelector = section === 'home' ? '.projects-grid' : '.all-projects-grid';

        let title = '', desc = '', category = '';

        if (type === 'default') {
            const editedProjects = JSON.parse(localStorage.getItem(editedKey) || '{}');
            const projectCards = document.querySelectorAll(gridSelector + ' .project-card');
            const card = projectCards[index];
            if (card) {
                const overlay = card.querySelector('.project-overlay');
                title = overlay ? overlay.querySelector('h3').textContent : '';
                desc = overlay ? overlay.querySelector('p').textContent : '';
                const catEl = card.querySelector('.project-category');
                category = catEl ? catEl.textContent.toLowerCase() : '';
            }
            if (editedProjects[index]) {
                title = editedProjects[index].title || title;
                desc = editedProjects[index].desc || desc;
                category = editedProjects[index].category || category;
            }
        } else {
            const customs = JSON.parse(localStorage.getItem(customKey) || '[]');
            if (customs[index]) {
                title = customs[index].title;
                desc = customs[index].desc;
                category = customs[index].category || '';
            }
        }

        // Remove existing edit modal
        const existing = document.getElementById('editProjectModal');
        if (existing) existing.remove();

        const showCategory = section === 'all';
        const modal = document.createElement('div');
        modal.className = 'admin-modal-overlay active';
        modal.id = 'editProjectModal';
        modal.style.zIndex = '10002';
        modal.innerHTML = `
            <div class="password-modal" style="max-width:500px;">
                <h2>✏️ Edit Project</h2>
                <p class="modal-subtitle">Update project details (${section === 'home' ? 'Home Page' : 'Projects Page'})</p>
                <div class="admin-field">
                    <label style="color:rgba(255,255,255,0.6)">Title</label>
                    <input type="text" id="editProjTitle" value="${title.replace(/"/g, '&quot;')}" style="width:100%; padding:0.75rem 1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.95rem; font-family:'Inter',sans-serif;">
                </div>
                <div class="admin-field">
                    <label style="color:rgba(255,255,255,0.6)">Description</label>
                    <input type="text" id="editProjDesc" value="${desc.replace(/"/g, '&quot;')}" style="width:100%; padding:0.75rem 1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.95rem; font-family:'Inter',sans-serif;">
                </div>
                ${showCategory ? `
                <div class="admin-field">
                    <label style="color:rgba(255,255,255,0.6)">Category</label>
                    <select id="editProjCategory" style="width:100%; padding:0.75rem 1rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.05); color:#fff; font-size:0.95rem; font-family:'Inter',sans-serif;">
                        <option value="residential" ${category === 'residential' ? 'selected' : ''}>Residential</option>
                        <option value="commercial" ${category === 'commercial' ? 'selected' : ''}>Commercial</option>
                        <option value="development" ${category === 'development' ? 'selected' : ''}>Development</option>
                    </select>
                </div>` : ''}
                <div class="modal-actions">
                    <button class="btn-modal-cancel" id="editProjCancel">Cancel</button>
                    <button class="btn-modal-submit" id="editProjSave">Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('editProjCancel').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('editProjSave').addEventListener('click', () => {
            const newTitle = document.getElementById('editProjTitle').value.trim();
            const newDesc = document.getElementById('editProjDesc').value.trim();
            const catSelect = document.getElementById('editProjCategory');
            const newCategory = catSelect ? catSelect.value : category;

            if (!newTitle) { showToast('Title cannot be empty', true); return; }

            if (type === 'default') {
                const edited = JSON.parse(localStorage.getItem(editedKey) || '{}');
                edited[index] = { title: newTitle, desc: newDesc, category: newCategory };
                localStorage.setItem(editedKey, JSON.stringify(edited));
            } else {
                const customs = JSON.parse(localStorage.getItem(customKey) || '[]');
                if (customs[index]) {
                    customs[index].title = newTitle;
                    customs[index].desc = newDesc;
                    customs[index].category = newCategory;
                    localStorage.setItem(customKey, JSON.stringify(customs));
                }
            }

            modal.remove();
            showToast('Project updated! Reload to see changes.');
            populateProjectsGrid(section);
        });
    }

    // ============================================
    // IMAGE UPLOAD HANDLER
    // ============================================
    let uploadedHomeImage = null;
    let uploadedAllImage = null;

    function handleImageUpload(e, section) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image too large. Max 2MB.', true);
            return;
        }

        const reader = new FileReader();
        reader.onload = function (ev) {
            const data = ev.target.result;
            if (section === 'home') {
                uploadedHomeImage = data;
                const area = document.getElementById('homeFileUploadArea');
                area.innerHTML = `<img src="${data}" alt="Preview"><p style="color:rgba(255,255,255,0.5); margin-top:0.5rem; font-size:0.8rem;">Click to change image</p>`;
            } else {
                uploadedAllImage = data;
                const area = document.getElementById('allFileUploadArea');
                area.innerHTML = `<img src="${data}" alt="Preview"><p style="color:rgba(255,255,255,0.5); margin-top:0.5rem; font-size:0.8rem;">Click to change image</p>`;
            }
        };
        reader.readAsDataURL(file);
    }

    // ============================================
    // ADD NEW PROJECT
    // ============================================
    function addNewProject(section) {
        const prefix = section === 'home' ? 'home' : 'all';
        const customKey = section === 'home' ? STORAGE_KEYS.HOME_CUSTOM_PROJECTS : STORAGE_KEYS.ALL_CUSTOM_PROJECTS;
        const uploadedImage = section === 'home' ? uploadedHomeImage : uploadedAllImage;

        const title = document.getElementById(prefix + 'NewProjectTitle').value.trim();
        const desc = document.getElementById(prefix + 'NewProjectDesc').value.trim();
        const catSelect = document.getElementById(prefix + 'NewProjectCategory');
        const category = catSelect ? catSelect.value : '';

        if (!title) { showToast('Please enter a project title', true); return; }
        if (!uploadedImage) { showToast('Please upload an image', true); return; }

        const customs = JSON.parse(localStorage.getItem(customKey) || '[]');
        customs.push({ title, desc, category, image: uploadedImage });

        try {
            localStorage.setItem(customKey, JSON.stringify(customs));
        } catch (e) {
            showToast('Storage full! Try a smaller image.', true);
            customs.pop();
            return;
        }

        // Reset form
        document.getElementById(prefix + 'NewProjectTitle').value = '';
        document.getElementById(prefix + 'NewProjectDesc').value = '';

        if (section === 'home') {
            uploadedHomeImage = null;
            resetUploadArea('homeFileUploadArea', 'homeProjectImageInput', 'home');
        } else {
            uploadedAllImage = null;
            resetUploadArea('allFileUploadArea', 'allProjectImageInput', 'all');
        }

        showToast('Project added!');
        populateProjectsGrid(section);
    }

    function resetUploadArea(areaId, inputId, section) {
        const area = document.getElementById(areaId);
        area.innerHTML = `<div class="upload-icon">📤</div><p>Click to upload project image</p><input type="file" id="${inputId}" accept="image/*" style="display:none">`;
        const newInput = document.getElementById(inputId);
        area.addEventListener('click', () => newInput.click());
        newInput.addEventListener('change', (e) => handleImageUpload(e, section));
    }

    // ============================================
    // SAVE ALL TEXT CHANGES
    // ============================================
    function saveAllChanges() {
        // Hero
        localStorage.setItem(STORAGE_KEYS.HERO_TITLE, document.getElementById('admin-hero-title').value);
        localStorage.setItem(STORAGE_KEYS.HERO_SUBTITLE, document.getElementById('admin-hero-subtitle').value);

        // Services
        const svcTitles = document.querySelectorAll('.svc-title');
        const svcDescs = document.querySelectorAll('.svc-desc');
        const services = [];
        svcTitles.forEach((t, i) => {
            services.push({ title: t.value, desc: svcDescs[i] ? svcDescs[i].value : '' });
        });
        if (services.length > 0) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));

        // About
        localStorage.setItem(STORAGE_KEYS.ABOUT_P1, document.getElementById('admin-about-p1').value);
        localStorage.setItem(STORAGE_KEYS.ABOUT_P2, document.getElementById('admin-about-p2').value);

        // Stats
        const statValues = document.querySelectorAll('.stat-value');
        const statLabels = document.querySelectorAll('.stat-label-input');
        const stats = [];
        statValues.forEach((v, i) => {
            stats.push({ value: v.value, label: statLabels[i] ? statLabels[i].value : '' });
        });
        if (stats.length > 0) localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));

        // Contact
        localStorage.setItem(STORAGE_KEYS.CONTACT_ADDRESS, document.getElementById('admin-contact-address').value);
        localStorage.setItem(STORAGE_KEYS.CONTACT_PHONE, document.getElementById('admin-contact-phone').value);
        localStorage.setItem(STORAGE_KEYS.CONTACT_EMAIL, document.getElementById('admin-contact-email').value);

        showToast('All changes saved! Reload to see updates.');
    }

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    async function changePassword() {
        const newPw = document.getElementById('newAdminPassword').value;
        const confirmPw = document.getElementById('confirmAdminPassword').value;

        if (!newPw) { showToast('Enter a new password', true); return; }
        if (newPw !== confirmPw) { showToast('Passwords do not match', true); return; }
        if (newPw.length < 4) { showToast('Password too short (min 4 chars)', true); return; }

        const hash = await hashPassword(newPw);
        localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);
        document.getElementById('newAdminPassword').value = '';
        document.getElementById('confirmAdminPassword').value = '';
        showToast('Password updated!');
    }

    // ============================================
    // SETUP SECRET TRIGGER
    // ============================================
    function setupSecretTrigger() {
        const trigger = document.getElementById('secret-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('passwordModal');
            modal.classList.add('active');
            setTimeout(() => {
                document.getElementById('adminPasswordInput').focus();
            }, 100);
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================
    function init() {
        applySavedChanges();
        createPasswordModal();
        createAdminPanel();
        setupSecretTrigger();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
