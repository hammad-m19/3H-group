import re

# Update api/index.js
with open('api/index.js', 'r') as f:
    api_content = f.read()

custom_email_api = """
// Admin: Send Custom Email
app.post('/api/send-custom-email', async (req, res) => {
    try {
        const { email, subject, body } = req.body;
        if (!email || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Email configuration is missing on server' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"3H Group HR" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            text: body
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error("Custom Email API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;"""

if '/api/send-custom-email' not in api_content:
    api_content = api_content.replace('module.exports = app;', custom_email_api)

    with open('api/index.js', 'w') as f:
        f.write(api_content)


# Update admin.js
with open('admin.js', 'r') as f:
    admin_content = f.read()

old_overlay = """            <div id="emailModalOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999;"></div>

        `;"""

new_overlay = """            <div id="emailModalOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999;"></div>

            <!-- Custom Mail Modal -->
            <div id="customMailModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#1a1a2e; border:1px solid #444; padding:20px; border-radius:12px; z-index:100000; width:500px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
                <h3 style="color:white; margin-top:0;">Send Custom Mail</h3>
                <input type="hidden" id="customMailToEmail" />
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-secondary); display:block; margin-bottom:5px;">To:</label>
                    <input type="text" id="customMailToDisplay" disabled style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.05); color:white; border:1px solid #444;" />
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-secondary); display:block; margin-bottom:5px;">Templates:</label>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="btn template-btn" data-template="where" style="background:#4b5563; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Where do you live?</button>
                        <button class="btn template-btn" data-template="missing" style="background:#4b5563; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Missing Documents</button>
                        <button class="btn template-btn" data-template="experience" style="background:#4b5563; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Experience Details</button>
                    </div>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-secondary); display:block; margin-bottom:5px;">Subject</label>
                    <input type="text" id="customMailSubject" placeholder="e.g. Question regarding your application" style="width:100%; padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444;" />
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-secondary); display:block; margin-bottom:5px;">Message</label>
                    <textarea id="customMailBody" rows="6" placeholder="Type your message here..." style="width:100%; padding:8px; border-radius:6px; background:var(--bg-tertiary); color:white; border:1px solid #444; font-family:inherit; resize:vertical;"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button id="cancelCustomMailBtn" style="background:#444; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer;">Cancel</button>
                    <button id="sendCustomMailConfirmBtn" style="background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer;">Send Mail</button>
                </div>
            </div>

        `;"""

if 'id="customMailModal"' not in admin_content:
    admin_content = admin_content.replace(old_overlay, new_overlay)

old_js = """            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

        document.getElementById('appJobFilter').addEventListener('change', () => {"""

new_js = """            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

        // Custom Email Modal Handlers
        const customMailModal = document.getElementById('customMailModal');
        
        document.getElementById('cancelCustomMailBtn').addEventListener('click', () => {
            customMailModal.style.display = 'none';
            emailModalOverlay.style.display = 'none';
        });

        document.getElementById('sendCustomMailConfirmBtn').addEventListener('click', async () => {
            const email = document.getElementById('customMailToEmail').value;
            const subject = document.getElementById('customMailSubject').value.trim();
            const body = document.getElementById('customMailBody').value.trim();

            if (!email || !subject || !body) {
                return showToast('Please fill out all fields.', true);
            }

            const btn = document.getElementById('sendCustomMailConfirmBtn');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/send-custom-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, subject, body })
                });

                if (res.ok) {
                    showToast('Custom mail sent successfully!');
                    customMailModal.style.display = 'none';
                    emailModalOverlay.style.display = 'none';
                } else {
                    const err = await res.json();
                    showToast(err.error || 'Failed to send email', true);
                }
            } catch(e) {
                showToast('Error sending email', true);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tmpl = e.target.dataset.template;
                const subjectInput = document.getElementById('customMailSubject');
                const bodyInput = document.getElementById('customMailBody');
                
                if (tmpl === 'where') {
                    subjectInput.value = 'Clarification: Current Location';
                    bodyInput.value = 'Dear Candidate,\\n\\nThank you for your application to 3H Group.\\n\\nCould you please clarify your current city of residence, as it was not fully detailed in your application?\\n\\nBest regards,\\n3H Group HR';
                } else if (tmpl === 'missing') {
                    subjectInput.value = 'Action Required: Missing Documents';
                    bodyInput.value = 'Dear Candidate,\\n\\nWe are reviewing your application and noticed some documents are missing.\\n\\nPlease reply to this email with your updated CV and any relevant certificates.\\n\\nBest regards,\\n3H Group HR';
                } else if (tmpl === 'experience') {
                    subjectInput.value = 'Clarification: Past Experience';
                    bodyInput.value = 'Dear Candidate,\\n\\nThank you for applying.\\n\\nCould you please provide more details regarding your past experience and the specific projects you worked on?\\n\\nBest regards,\\n3H Group HR';
                }
            });
        });

        document.getElementById('appJobFilter').addEventListener('change', () => {"""

if "document.getElementById('cancelCustomMailBtn').addEventListener" not in admin_content:
    admin_content = admin_content.replace(old_js, new_js)

old_btn = """<a href="mailto:${app.email}" class="btn" style="background:transparent; color:#3b82f6; border:1px solid #3b82f6; padding:2px 8px; border-radius:4px; font-size:0.8rem; text-decoration:none; display:inline-block;" title="Mail ${app.name}">📧 Mail</a>"""
new_btn = """<button class="btn custom-mail-btn" data-email="${app.email}" data-name="${app.name}" style="background:transparent; color:#3b82f6; border:1px solid #3b82f6; padding:2px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;" title="Mail ${app.name}">📧 Mail</button>"""

if 'custom-mail-btn' not in admin_content:
    admin_content = admin_content.replace(old_btn, new_btn)

old_listeners_attach = """        // Attach event listeners for Star buttons"""

new_listeners_attach = """        // Attach event listeners for Custom Mail buttons
        container.querySelectorAll('.custom-mail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.currentTarget.dataset.email;
                const name = e.currentTarget.dataset.name;
                document.getElementById('customMailToEmail').value = email;
                document.getElementById('customMailToDisplay').value = `${name} (${email})`;
                document.getElementById('customMailSubject').value = '';
                document.getElementById('customMailBody').value = '';
                document.getElementById('customMailModal').style.display = 'block';
                document.getElementById('emailModalOverlay').style.display = 'block';
            });
        });

        // Attach event listeners for Star buttons"""

if 'container.querySelectorAll(\'.custom-mail-btn\').forEach' not in admin_content:
    admin_content = admin_content.replace(old_listeners_attach, new_listeners_attach)

with open('admin.js', 'w') as f:
    f.write(admin_content)
