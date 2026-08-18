import re

with open('admin.js', 'r') as f:
    content = f.read()

# 1. Add Favorites Filter
old_filter = """                        <div style="margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
                            <div>
                                <label style="color:var(--text-secondary); margin-right:10px;">Filter by Job:</label>
                                <select id="appJobFilter" style="padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; width:250px;">
                                    <option value="all">All Jobs</option>
                                </select>
                            </div>
                            <div>
                                <label style="color:var(--text-secondary); margin-right:10px;">AI Score Filter:</label>
                                <select id="appScoreFilter" style="padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; width:250px;">"""

new_filter = """                        <div style="margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
                            <div>
                                <label style="color:var(--text-secondary); margin-right:10px;">Filter by Job:</label>
                                <select id="appJobFilter" style="padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; width:200px;">
                                    <option value="all">All Jobs</option>
                                </select>
                            </div>
                            <div>
                                <label style="color:var(--text-secondary); margin-right:10px;">AI Score Filter:</label>
                                <select id="appScoreFilter" style="padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; width:200px;">"""

content = content.replace(old_filter, new_filter)

old_filter_end = """                                    <option value="sort-asc">Sort: Lowest to Highest</option>
                                </select>
                            </div>
                        </div>"""

new_filter_end = """                                    <option value="sort-asc">Sort: Lowest to Highest</option>
                                </select>
                            </div>
                            <div>
                                <label style="color:var(--text-secondary); margin-right:10px;">Favorites:</label>
                                <select id="appStarredFilter" style="padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; width:150px;">
                                    <option value="all">All</option>
                                    <option value="starred">Starred Only</option>
                                </select>
                            </div>
                        </div>"""

content = content.replace(old_filter_end, new_filter_end)

# 2. Add event listener
old_listeners = """        const scoreFilter = document.getElementById('appScoreFilter');
        if(scoreFilter) {
            scoreFilter.addEventListener('change', () => {
                renderAdminApplications();
            });
        }"""

new_listeners = """        const scoreFilter = document.getElementById('appScoreFilter');
        if(scoreFilter) {
            scoreFilter.addEventListener('change', () => {
                renderAdminApplications();
            });
        }

        const starredFilter = document.getElementById('appStarredFilter');
        if(starredFilter) {
            starredFilter.addEventListener('change', () => {
                renderAdminApplications();
            });
        }"""
content = content.replace(old_listeners, new_listeners)

# 3. Add filtering logic
old_logic = """        const selectedJobId = filterSelect ? filterSelect.value : 'all';
        const selectedScoreFilter = scoreFilterSelect ? scoreFilterSelect.value : 'all';
        
        let appsToRender = currentApplications;
        
        // 1. Filter by Job"""

new_logic = """        const starredFilterSelect = document.getElementById('appStarredFilter');
        
        const selectedJobId = filterSelect ? filterSelect.value : 'all';
        const selectedScoreFilter = scoreFilterSelect ? scoreFilterSelect.value : 'all';
        const selectedStarredFilter = starredFilterSelect ? starredFilterSelect.value : 'all';
        
        const starredApps = JSON.parse(localStorage.getItem('3h_starred_apps') || '[]');

        let appsToRender = currentApplications;
        
        if (selectedStarredFilter === 'starred') {
            appsToRender = appsToRender.filter(app => starredApps.includes(app._id));
        }
        
        // 1. Filter by Job"""
content = content.replace(old_logic, new_logic)

# 4. Modify UI
old_ui = """        const listHtml = appsToRender.map((app, index) => `
            <div style="background:var(--bg-primary); padding:20px; border-radius:12px; border:1px solid #333; display: flex; gap: 15px;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <input type="checkbox" class="app-checkbox" value="${app._id}" style="margin-top: 5px; transform: scale(1.5); cursor: pointer;" />
                    <span style="margin-top: 15px; color: var(--text-secondary); font-weight: bold; font-size: 0.9rem;" title="Serial Number">#${index + 1}</span>
                </div>
                <div style="flex: 1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="color:var(--primary-color); margin-bottom:5px;">${app.name}</h3>
                            <p style="color:sandybrown; font-size:0.9rem; margin-bottom:10px;">${app.email} | Applied for: <strong>${app.jobId ? app.jobId.title : 'Deleted Job'}</strong></p>"""

new_ui = """        const listHtml = appsToRender.map((app, index) => {
            const isStarred = starredApps.includes(app._id);
            return `
            <div style="background:var(--bg-primary); padding:20px; border-radius:12px; border:1px solid #333; display: flex; gap: 15px;">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <input type="checkbox" class="app-checkbox" value="${app._id}" style="margin-top: 5px; transform: scale(1.5); cursor: pointer;" />
                    <span style="margin-top: 15px; color: var(--text-secondary); font-weight: bold; font-size: 0.9rem;" title="Serial Number">#${index + 1}</span>
                </div>
                <div style="flex: 1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="display:flex; align-items:center; gap: 10px; margin-bottom:5px;">
                                <h3 style="color:var(--primary-color); margin:0;">${app.name}</h3>
                                <a href="mailto:${app.email}" class="btn" style="background:transparent; color:#3b82f6; border:1px solid #3b82f6; padding:2px 8px; border-radius:4px; font-size:0.8rem; text-decoration:none; display:inline-block;" title="Mail ${app.name}">📧 Mail</a>
                                <button class="star-btn" data-id="${app._id}" style="background:transparent; border:none; cursor:pointer; font-size:1.4rem; padding:0; color:${isStarred ? '#fbbf24' : '#4b5563'}; line-height: 1;" title="${isStarred ? 'Remove from favorites' : 'Mark as favorite'}">${isStarred ? '★' : '☆'}</button>
                            </div>
                            <p style="color:sandybrown; font-size:0.9rem; margin-bottom:10px;">${app.email} | Applied for: <strong>${app.jobId ? app.jobId.title : 'Deleted Job'}</strong></p>"""

content = content.replace(old_ui, new_ui)

# 5. End mapping and star handlers
old_end = """                    <div style="margin-top: 15px; background:var(--bg-tertiary); padding:15px; border-radius:8px;">
                        <h4 style="color:white; margin-bottom:10px; font-size:0.9rem;">Custom Answers</h4>
                        <p style="color:sandybrown; line-height:1.5; white-space:pre-wrap;">${app.answers}</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = summaryHtml + listHtml;

        // Attach event listeners for Retry buttons
        container.querySelectorAll('.retry-ai-btn').forEach(btn => {"""

new_end = """                    <div style="margin-top: 15px; background:var(--bg-tertiary); padding:15px; border-radius:8px;">
                        <h4 style="color:white; margin-bottom:10px; font-size:0.9rem;">Custom Answers</h4>
                        <p style="color:sandybrown; line-height:1.5; white-space:pre-wrap;">${app.answers}</p>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = summaryHtml + listHtml;

        // Attach event listeners for Star buttons
        container.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.currentTarget.dataset.id;
                let starred = JSON.parse(localStorage.getItem('3h_starred_apps') || '[]');
                if (starred.includes(appId)) {
                    starred = starred.filter(id => id !== appId);
                } else {
                    starred.push(appId);
                }
                localStorage.setItem('3h_starred_apps', JSON.stringify(starred));
                renderAdminApplications();
            });
        });

        // Attach event listeners for Retry buttons
        container.querySelectorAll('.retry-ai-btn').forEach(btn => {"""
content = content.replace(old_end, new_end)

with open('admin.js', 'w') as f:
    f.write(content)
