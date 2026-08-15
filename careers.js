document.addEventListener('DOMContentLoaded', () => {
    fetchJobs();

    const modal = document.getElementById('applyModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('applyForm');
    const msg = document.getElementById('applyMessage');

    const detailsModal = document.getElementById('jobDetailsModal');
    const closeDetailsBtn = document.getElementById('closeDetailsModal');
    const detailsApplyBtn = document.getElementById('detailsApplyBtn');

    function closeDetailsModal() {
        detailsModal.classList.remove('active');
        setTimeout(() => detailsModal.style.display = 'none', 300);
    }

    if (closeDetailsBtn) closeDetailsBtn.onclick = closeDetailsModal;
    
    let currentJobId = null;
    let currentJobTitle = null;

    if (detailsApplyBtn) {
        detailsApplyBtn.onclick = () => {
            closeDetailsModal();
            openApplyModal(currentJobId, currentJobTitle);
        };
    }

    const statusModal = document.getElementById('statusModal');
    const statusDoneBtn = document.getElementById('statusDoneBtn');
    const statusCloseBtn = document.getElementById('statusCloseBtn');

    function closeApplyModal() {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300); // Wait for transition
    }

    function closeStatusModal() {
        statusModal.classList.remove('active');
        setTimeout(() => {
            statusModal.style.display = 'none';
            document.getElementById('statusLoading').style.display = 'block';
            document.getElementById('statusSuccess').style.display = 'none';
            document.getElementById('statusError').style.display = 'none';
        }, 300);
    }

    closeBtn.onclick = closeApplyModal;
    statusDoneBtn.onclick = closeStatusModal;
    statusCloseBtn.onclick = closeStatusModal;
    
    window.onclick = (e) => { 
        if (e.target == modal) {
            closeApplyModal();
        } else if (e.target == statusModal) {
            closeStatusModal();
        } else if (e.target == detailsModal) {
            closeDetailsModal();
        }
    };

    window.openJobDetailsModal = function(id, title) {
        const jobs = window.allJobs || [];
        const job = jobs.find(j => j._id === id);
        if (!job) return;

        document.getElementById('detailsJobTitle').textContent = job.title;
        document.getElementById('detailsJobDesc').textContent = job.description;
        
        currentJobId = job._id;
        currentJobTitle = job.title;
        
        detailsModal.style.display = 'flex';
        setTimeout(() => detailsModal.classList.add('active'), 10);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Close apply modal and open status modal
        closeApplyModal();
        statusModal.style.display = 'flex';
        setTimeout(() => statusModal.classList.add('active'), 10);
        
        document.getElementById('statusLoading').style.display = 'block';
        document.getElementById('statusSuccess').style.display = 'none';
        document.getElementById('statusError').style.display = 'none';

        const formData = new FormData();
        formData.append('jobId', document.getElementById('jobId').value);
        formData.append('name', document.getElementById('appName').value);
        formData.append('email', document.getElementById('appEmail').value);
        formData.append('answers', document.getElementById('appAnswers').value);
        formData.append('resume', document.getElementById('appResume').files[0]);

        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            document.getElementById('statusLoading').style.display = 'none';

            if (response.ok) {
                document.getElementById('statusSuccess').style.display = 'block';
                form.reset();
            } else {
                document.getElementById('statusError').style.display = 'block';
                document.getElementById('statusErrorMsg').textContent = result.error || 'Failed to submit.';
            }
        } catch (error) {
            document.getElementById('statusLoading').style.display = 'none';
            document.getElementById('statusError').style.display = 'block';
            document.getElementById('statusErrorMsg').textContent = 'Network error. Please try again.';
        }
    });
});

async function fetchJobs() {
    const container = document.getElementById('jobs-container');
    try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();
        window.allJobs = jobs;
        
        container.innerHTML = '';
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No open positions right now.</p>';
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.style.cursor = 'pointer';
            card.onclick = () => window.openJobDetailsModal(job._id, job.title);
            
            card.innerHTML = `
                <h3 class="job-title">${job.title}</h3>
                <div class="job-desc-preview">${job.description}</div>
                <div style="margin-top: 15px; color: var(--red); font-weight: 600; display: flex; align-items: center; gap: 5px;">
                    Read more <span style="font-size: 1.2rem;">&rarr;</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '<p style="text-align:center; color: #f87171;">Failed to load jobs.</p>';
    }
}

function openApplyModal(id, title) {
    document.getElementById('jobId').value = id;
    document.getElementById('modalJobTitle').textContent = title;
    document.getElementById('applyMessage').textContent = '';
    const modal = document.getElementById('applyModal');
    modal.style.display = 'flex';
    // Small delay to allow display block to apply before adding class for opacity transition
    setTimeout(() => modal.classList.add('active'), 10);
}
