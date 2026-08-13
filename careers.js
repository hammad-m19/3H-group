document.addEventListener('DOMContentLoaded', () => {
    fetchJobs();

    const modal = document.getElementById('applyModal');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('applyForm');
    const msg = document.getElementById('applyMessage');

    closeBtn.onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300); // Wait for transition
    };
    window.onclick = (e) => { 
        if (e.target == modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.textContent = 'Submitting... Please wait.';
        msg.style.color = 'var(--text-secondary)';

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

            if (response.ok) {
                msg.textContent = 'Application submitted successfully!';
                msg.style.color = '#4ade80';
                form.reset();
                setTimeout(() => {
                    modal.classList.remove('active');
                    setTimeout(() => modal.style.display = 'none', 300);
                }, 3000);
            } else {
                msg.textContent = result.error || 'Failed to submit.';
                msg.style.color = '#f87171';
            }
        } catch (error) {
            msg.textContent = 'Network error.';
            msg.style.color = '#f87171';
        }
    });
});

async function fetchJobs() {
    const container = document.getElementById('jobs-container');
    try {
        const res = await fetch('/api/jobs');
        const jobs = await res.json();
        
        container.innerHTML = '';
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No open positions right now.</p>';
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';
            card.innerHTML = `
                <h3 class="job-title">${job.title}</h3>
                <div class="job-desc">${job.description}</div>
                <button class="btn btn-primary apply-btn" onclick="openApplyModal('${job._id}', '${job.title}')">Apply Now</button>
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
