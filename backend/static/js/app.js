/**
 * Extended IPA Symbols Application Frontend
 * This script handles the frontend functionality and API connectivity
 */

document.addEventListener('DOMContentLoaded', function() {
    // Base URL for API requests
    const API_BASE_URL = '/api';
    
    // Global state
    let currentLanguage = window.appConfig?.currentLanguage || 'english';
    let proposals = [];
    let notifications = [];
    
    // Initialize the application
    initApp();
    
    /**
     * Initialize the application
     */
    function initApp() {
        // Set up tab switching functionality
        initTabSwitching();
        
        // Set up audio playback for clickable texts
        initAudioPlayback();
        
        // Initialize admin mode detection
        initAdminMode();
        
        // Initialize proposals system
        initProposalSystem();
        
        // Initialize discussion forum
        initDiscussionForum();
        
        // Initialize notifications
        initNotifications();
        
        // Set up search functionality
        initSearchFunctionality();
    }
    
    /**
     * Initialize tab switching functionality
     */
    function initTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Show the corresponding tab content
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    /**
     * Initialize audio playback for clickable texts
     */
    function initAudioPlayback() {
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('clickable-text')) {
                const audioUrl = event.target.getAttribute('data-audio-url');
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    audio.play().catch(err => {
                        console.error('Error playing audio:', err);
                        alert('Audio file not found or not supported by your browser.');
                    });
                }
            }
        });
    }
    
    /**
     * Initialize admin mode detection and controls
     */
    function initAdminMode() {
        // Check for admin mode in URL hash
        if (window.location.hash === "#adminMode") {
            const adminControls = document.getElementById('admin-controls');
            if (adminControls) {
                adminControls.style.display = 'block';
            }
            
            // Show admin buttons on proposals
            document.querySelectorAll('.proposal-item').forEach(item => {
                const proposalId = item.getAttribute('data-id');
                const statusBadge = item.querySelector('.status-badge');
                
                if (statusBadge && statusBadge.classList.contains('status-pending')) {
                    // Add admin control buttons if not already present
                    if (!item.querySelector('.admin-controls')) {
                        const proposalVotes = item.querySelector('.proposal-votes');
                        const adminControls = document.createElement('div');
                        adminControls.className = 'admin-controls';
                        adminControls.innerHTML = `
                            <button class="approve-btn" data-id="${proposalId}">Approve</button>
                            <button class="reject-btn" data-id="${proposalId}">Reject</button>
                        `;
                        proposalVotes.insertAdjacentElement('afterend', adminControls);
                        
                        // Add event listeners
                        adminControls.querySelector('.approve-btn').addEventListener('click', function() {
                            updateProposalStatus(proposalId, 'approved');
                        });
                        
                        adminControls.querySelector('.reject-btn').addEventListener('click', function() {
                            updateProposalStatus(proposalId, 'rejected');
                        });
                    }
                }
            });
        }
        
        // Exit admin mode button
        const adminLogout = document.getElementById('admin-logout');
        if (adminLogout) {
            adminLogout.addEventListener('click', function() {
                window.location.hash = '';
                
                // Hide admin controls
                const adminControls = document.getElementById('admin-controls');
                if (adminControls) {
                    adminControls.style.display = 'none';
                }
                
                // Remove admin buttons from proposals
                document.querySelectorAll('.admin-controls').forEach(control => {
                    control.remove();
                });
            });
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', function() {
            if (window.location.hash === "#adminMode") {
                const adminControls = document.getElementById('admin-controls');
                if (adminControls) {
                    adminControls.style.display = 'block';
                }
                
                // Refresh proposals to show admin controls
                loadProposals();
            } else {
                const adminControls = document.getElementById('admin-controls');
                if (adminControls) {
                    adminControls.style.display = 'none';
                }
                
                // Remove admin buttons
                document.querySelectorAll('.admin-controls').forEach(control => {
                    control.remove();
                });
            }
        });
    }
    
    /**
     * Initialize the proposal system
     */
    function initProposalSystem() {
        // Load existing proposals if not pre-loaded from template
        if (!document.querySelector('.proposal-item')) {
            loadProposals();
        } else {
            // Get proposals from DOM
            collectProposalsFromDOM();
            
            // Add event listeners to existing proposal items
            addProposalEventListeners();
        }
        
        // Set up proposal form submission
        const submitProposalBtn = document.getElementById('submit-proposal');
        if (submitProposalBtn) {
            submitProposalBtn.addEventListener('click', submitProposal);
        }
        
        // Set up filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                displayProposals(filter);
            });
        });
    }
    
    /**
     * Collect proposal data from DOM elements
     */
    function collectProposalsFromDOM() {
        proposals = [];
        document.querySelectorAll('.proposal-item').forEach(item => {
            const proposalId = item.getAttribute('data-id');
            const symbol = item.querySelector('.proposal-symbol').textContent;
            const dateElement = item.querySelector('.proposal-date');
            const date = dateElement.textContent.split('<')[0].trim(); // Remove status badge from text
            
            let status = 'pending';
            const statusBadge = item.querySelector('.status-badge');
            if (statusBadge) {
                if (statusBadge.classList.contains('status-approved')) {
                    status = 'approved';
                } else if (statusBadge.classList.contains('status-rejected')) {
                    status = 'rejected';
                }
            }
            
            const soundName = item.querySelector('.proposal-details p:nth-child(1)').textContent.replace('Sound Name:', '').trim();
            const category = item.querySelector('.proposal-details p:nth-child(2)').textContent.replace('Category:', '').trim().toLowerCase();
            const rationale = item.querySelector('.proposal-details p:nth-child(3)').textContent.replace('Rationale:', '').trim();
            
            let exampleLanguage = '';
            const exampleElement = item.querySelector('.proposal-details p:nth-child(4)');
            if (exampleElement) {
                exampleLanguage = exampleElement.textContent.replace('Example Languages:', '').trim();
            }
            
            const votes = parseInt(item.querySelector('.vote-count').textContent) || 0;
            
            proposals.push({
                id: proposalId,
                symbol: symbol,
                submitted_date: date,
                status: status,
                sound_name: soundName,
                category: category,
                rationale: rationale,
                example_language: exampleLanguage,
                votes: votes
            });
        });
    }
    
    /**
     * Add event listeners to proposal elements
     */
    function addProposalEventListeners() {
        // Vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const proposalId = this.getAttribute('data-id');
                const voteValue = parseInt(this.getAttribute('data-vote'));
                voteOnProposal(proposalId, voteValue);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-proposal').forEach(btn => {
            btn.addEventListener('click', function() {
                const proposalId = this.getAttribute('data-id');
                deleteProposal(proposalId);
            });
        });
    }
    
    /**
     * Load existing proposals from the API
     */
    async function loadProposals() {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals`);
            if (!response.ok) throw new Error('Failed to fetch proposals');
            
            proposals = await response.json();
            displayProposals('all');
        } catch (error) {
            console.error('Error loading proposals:', error);
            
            // If we already have proposals from DOM, use those
            if (proposals.length === 0) {
                collectProposalsFromDOM();
            }
            
            displayProposals('all');
        }
    }
    
    /**
     * Display proposals with optional filtering
     */
    function displayProposals(filter = 'all') {
        const proposalsList = document.getElementById('proposals-list');
        if (!proposalsList) return;
        
        proposalsList.innerHTML = '';
        
        // Filter proposals if needed
        const filteredProposals = filter === 'all'
            ? proposals
            : proposals.filter(proposal => proposal.category === filter);
        
        if (filteredProposals.length === 0) {
            proposalsList.innerHTML = '<div class="no-proposals">No proposals found for this category. Be the first to propose a new symbol!</div>';
            return;
        }
        
        // Count pending proposals
        const pendingCount = proposals.filter(p => p.status === 'pending').length;
        const pendingCountElement = document.getElementById('pending-count');
        if (pendingCountElement) {
            pendingCountElement.textContent = pendingCount.toString();
        }
        
        // Create and append proposal items
        filteredProposals.forEach((proposal) => {
            const proposalItem = createProposalElement(proposal);
            proposalsList.appendChild(proposalItem);
        });
        
        // Add event listeners to new elements
        addProposalEventListeners();
    }
    
    /**
     * Create a proposal element for display
     */
    function createProposalElement(proposal) {
        const proposalItem = document.createElement('div');
        proposalItem.className = 'proposal-item';
        proposalItem.setAttribute('data-id', proposal.id);
        proposalItem.style.position = 'relative';
        
        // Create status badge
        let statusBadge = '';
        if (proposal.status === 'approved') {
            statusBadge = '<span class="status-badge status-approved">Approved</span>';
        } else if (proposal.status === 'rejected') {
            statusBadge = '<span class="status-badge status-rejected">Rejected</span>';
        } else {
            statusBadge = '<span class="status-badge status-pending">Pending</span>';
        }
        
        // Add admin controls if user is in admin mode
        let adminControls = '';
        if (isAdmin() && proposal.status === 'pending') {
            adminControls = `
                <div class="admin-controls">
                    <button class="approve-btn" data-id="${proposal.id}">Approve</button>
                    <button class="reject-btn" data-id="${proposal.id}">Reject</button>
                </div>
            `;
        }
        
        // Format date
        const date = proposal.submitted_date 
            ? (typeof proposal.submitted_date === 'string' && proposal.submitted_date.includes('T') 
               ? new Date(proposal.submitted_date).toLocaleDateString()
               : proposal.submitted_date)
            : 'Unknown date';
        
        // Build HTML
        proposalItem.innerHTML = `
            <div class="proposal-header">
                <div class="proposal-symbol">${proposal.symbol}</div>
                <div class="proposal-date">${date}${statusBadge}</div>
            </div>
            <div class="proposal-details">
                <p><strong>Sound Name:</strong> ${proposal.sound_name}</p>
                <p><strong>Category:</strong> ${proposal.category.charAt(0).toUpperCase() + proposal.category.slice(1)}</p>
                <p><strong>Rationale:</strong> ${proposal.rationale}</p>
                ${proposal.example_language ? `<p><strong>Example Languages:</strong> ${proposal.example_language}</p>` : ''}
            </div>
            <div class="proposal-votes">
                <button class="vote-btn upvote" data-id="${proposal.id}" data-vote="1">👍 Upvote</button>
                <button class="vote-btn downvote" data-id="${proposal.id}" data-vote="-1">👎 Downvote</button>
                <span class="vote-count">${proposal.votes || 0}</span>
            </div>
            ${adminControls}
            <button class="delete-proposal" data-id="${proposal.id}">×</button>
        `;
        
        return proposalItem;
    }
    
    /**
     * Vote on a proposal
     */
    async function voteOnProposal(proposalId, voteValue) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/vote`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote: voteValue })
            });
            
            if (!response.ok) throw new Error('Failed to vote on proposal');
            
            // Update proposal in memory
            const updatedProposal = await response.json();
            const index = proposals.findIndex(p => p.id === proposalId);
            if (index !== -1) proposals[index] = updatedProposal;
            
            // Update display
            displayProposals(getCurrentFilter());
        } catch (error) {
            console.error('Error voting on proposal:', error);
            alert('Error voting on proposal. Please try again.');
            
            // Update locally as fallback
            const index = proposals.findIndex(p => p.id === proposalId);
            if (index !== -1) {
                proposals[index].votes = (proposals[index].votes || 0) + voteValue;
                displayProposals(getCurrentFilter());
            }
        }
    }
    
    /**
     * Update proposal status (admin function)
     */
    async function updateProposalStatus(proposalId, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status })
            });
            
            if (!response.ok) throw new Error(`Failed to ${status} proposal`);
            
            // Update proposal in memory
            const updatedProposal = await response.json();
            const index = proposals.findIndex(p => p.id === proposalId);
            if (index !== -1) proposals[index] = updatedProposal;
            
            // Update display
            displayProposals(getCurrentFilter());
        } catch (error) {
            console.error(`Error ${status} proposal:`, error);
            alert(`Error ${status} proposal. Please try again.`);
            
            // Update locally as fallback
            const index = proposals.findIndex(p => p.id === proposalId);
            if (index !== -1) {
                proposals[index].status = status;
                displayProposals(getCurrentFilter());
            }
        }
    }
    
    /**
     * Delete a proposal
     */
    async function deleteProposal(proposalId) {
        if (!confirm('Are you sure you want to delete this proposal?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete proposal');
            
            // Remove from memory
            proposals = proposals.filter(p => p.id !== proposalId);
            
            // Update display
            displayProposals(getCurrentFilter());
        } catch (error) {
            console.error('Error deleting proposal:', error);
            alert('Error deleting proposal. Please try again.');
            
            // Remove locally as fallback
            proposals = proposals.filter(p => p.id !== proposalId);
            displayProposals(getCurrentFilter());
        }
    }
    
    /**
     * Submit a new proposal
     */
    async function submitProposal(event) {
        event.preventDefault();
        
        // Get form data
        const form = new FormData();
        form.append('symbol', document.getElementById('symbol').value);
        form.append('sound_name', document.getElementById('sound-name').value);
        form.append('category', document.getElementById('category').value);
        form.append('rationale', document.getElementById('rationale').value);
        
        const exampleLanguage = document.getElementById('example-language').value;
        if (exampleLanguage) form.append('example_language', exampleLanguage);
        
        // Add files if provided
        const audioInput = document.getElementById('audio-sample');
        if (audioInput && audioInput.files[0]) {
            form.append('audio_file', audioInput.files[0]);
        }
        
        const imageInput = document.getElementById('symbol-image');
        if (imageInput && imageInput.files[0]) {
            form.append('image_file', imageInput.files[0]);
        }
        
        // Basic validation
        if (!form.get('symbol') || !form.get('sound_name') || !form.get('category') || !form.get('rationale')) {
            alert('Please fill in all required fields (Symbol, Sound Name, Category, and Rationale)');
            return;
        }
        
        try {
            // Submit to API
            const response = await fetch(`${API_BASE_URL}/proposals`, {
                method: 'POST',
                body: form
            });
            
            if (!response.ok) throw new Error('Failed to submit proposal');
            
            const newProposal = await response.json();
            
            // Add to memory
            proposals.unshift(newProposal);
            
            // Update display
            displayProposals(getCurrentFilter());
            
            // Clear form
            document.getElementById('symbol').value = '';
            document.getElementById('sound-name').value = '';
            document.getElementById('rationale').value = '';
            document.getElementById('example-language').value = '';
            document.getElementById('audio-sample').value = '';
            document.getElementById('symbol-image').value = '';
            
            alert('Your proposal has been submitted successfully!');
        } catch (error) {
            console.error('Error submitting proposal:', error);
            alert('Error submitting proposal. Please try again.');
        }
    }
    
    /**
     * Initialize discussion forum functionality
     */
    function initDiscussionForum() {
        // Set up topic form submission
        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', submitDiscussionTopic);
        }
        
        // Set up event delegation for reply forms
        document.addEventListener('submit', function(e) {
            if (e.target.classList.contains('topic-reply-form')) {
                e.preventDefault();
                submitReply(e.target);
            }
        });
    }
    
    /**
     * Submit a new discussion topic
     */
    async function submitDiscussionTopic(event) {
        event.preventDefault();
        
        // Get form data
        const topicData = {
            title: document.getElementById('topic-title').value,
            content: document.getElementById('feedback-text').value,
            author_name: document.getElementById('name').value || 'Anonymous',
            author_email: document.getElementById('email')?.value || null
        };
        
        // Basic validation
        if (!topicData.title || !topicData.content) {
            alert('Please provide both a title and content for your topic');
            return;
        }
        
        try {
            // Submit to API
            const response = await fetch(`${API_BASE_URL}/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(topicData)
            });
            
            if (!response.ok) throw new Error('Failed to submit discussion topic');
            
            const newTopic = await response.json();
            
            // Show thanks message
            const feedbackThanks = document.getElementById('feedback-thanks');
            if (feedbackThanks) {
                feedbackThanks.classList.remove('hidden');
                
                // Hide thanks message after 3 seconds
                setTimeout(() => {
                    feedbackThanks.classList.add('hidden');
                }, 3000);
            }
            
            // Reset form
            document.getElementById('feedback-form').reset();
            
            // Add new topic to the page
            const topicsContainer = document.getElementById('topics-container');
            const headerElement = topicsContainer.querySelector('h3');
            
            // Create the new topic element
            const topicElement = createTopicElement(newTopic);
            
            // Insert after heading
            if (headerElement && headerElement.nextElementSibling) {
                topicsContainer.insertBefore(topicElement, headerElement.nextElementSibling);
            } else {
                topicsContainer.appendChild(topicElement);
            }
        } catch (error) {
            console.error('Error submitting discussion topic:', error);
            alert('Error submitting discussion topic. Please try again.');
        }
    }
    
    /**
     * Create a topic element for display
     */
    function createTopicElement(topic) {
        const topicElement = document.createElement('div');
        topicElement.className = 'topic';
        topicElement.dataset.id = topic.id;
        
        // Format date
        const date = topic.created_date 
            ? new Date(topic.created_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
        
        // Create topic content
        topicElement.innerHTML = `
            <div class="topic-header">
                <h4 class="topic-title">${topic.title}</h4>
                <span class="topic-meta">Posted by ${topic.author_name || 'Anonymous'} on ${date}</span>
            </div>
            <div class="topic-content">
                <p>${topic.content}</p>
            </div>
            <div class="replies">
                ${createRepliesHTML(topic.replies || [])}
            </div>
            <div class="topic-actions">
                <button class="btn reply-btn" onclick="toggleReplyForm(this)">Reply</button>
            </div>
            <div class="reply-form">
                <form class="topic-reply-form">
                    <input type="hidden" name="topic-id" value="${topic.id}">
                    <div class="form-group">
                        <label for="reply-name-${topic.id}">Your Name (optional):</label>
                        <input type="text" class="reply-name form-control" id="reply-name-${topic.id}">
                    </div>
                    <div class="form-group">
                        <label for="reply-text-${topic.id}">Your Reply:</label>
                        <textarea class="reply-text form-control" rows="3" required id="reply-text-${topic.id}"></textarea>
                    </div>
                    <button type="submit" class="btn">Post Reply</button>
                </form>
            </div>
        `;
        
        return topicElement;
    }
    
    /**
     * Create HTML for topic replies
     */
    function createRepliesHTML(replies) {
        if (!replies || replies.length === 0) return '';
        
        return replies.map(reply => {
            // Format date
            const date = reply.created_date 
                ? new Date(reply.created_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
            
            return `
                <div class="reply" data-id="${reply.id}">
                    <div class="reply-meta">${reply.author_name || 'Anonymous'} on ${date}</div>
                    <p>${reply.content}</p>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Submit a reply to a topic
     */
    async function submitReply(form) {
        // Get form data
        const topicId = form.querySelector('[name="topic-id"]').value;
        const replyData = {
            content: form.querySelector('.reply-text').value,
            author_name: form.querySelector('.reply-name').value || 'Anonymous'
        };
        
        // Basic validation
        if (!replyData.content) {
            alert('Please provide content for your reply');
            return;
        }
        
        try {
            // Submit to API
            const response = await fetch(`${API_BASE_URL}/discussions/${topicId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(replyData)
            });
            
            if (!response.ok) throw new Error('Failed to submit reply');
            
            const newReply = await response.json();
            
            // Reset form and hide it
            form.reset();
            form.parentElement.style.display = 'none';
            
            // Add the new reply to the UI
            const topic = form.closest('.topic');
            const repliesContainer = topic.querySelector('.replies');
            
            const replyElement = document.createElement('div');
            replyElement.className = 'reply';
            replyElement.dataset.id = newReply.id;
            
            // Format date
            const date = newReply.created_date 
                ? new Date(newReply.created_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
            
            replyElement.innerHTML = `
                <div class="reply-meta">${newReply.author_name || 'Anonymous'} on ${date}</div>
                <p>${newReply.content}</p>
            `;
            
            repliesContainer.appendChild(replyElement);
        } catch (error) {
            console.error('Error submitting reply:', error);
            alert('Error submitting reply. Please try again.');
        }
    }
    
    /**
     * Initialize notifications functionality
     */
    function initNotifications() {
        // Set up notification bell
        const notificationBell = document.getElementById('notificationBell');
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        
        if (notificationBell && notificationsDropdown) {
            // Toggle dropdown when bell is clicked
            notificationBell.addEventListener('click', function() {
                notificationsDropdown.classList.toggle('show');
                if (notificationsDropdown.classList.contains('show')) {
                    loadNotifications();
                }
            });
            
            // Close dropdown when clicking outside of it
            document.addEventListener('click', function(event) {
                if (!notificationBell.contains(event.target) && !notificationsDropdown.contains(event.target)) {
                    notificationsDropdown.classList.remove('show');
                }
            });
            
            // Refresh button functionality
            const refreshButton = document.getElementById('refreshNotifications');
            if (refreshButton) {
                refreshButton.addEventListener('click', loadNotifications);
            }
        }
    }
    
    /**
     * Load notifications from the API
     */
    async function loadNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;
        
        // Clear current notifications
        notificationsList.innerHTML = '';
        
        // Add loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        notificationsList.appendChild(loadingSpinner);
        
        try {
            // Fetch notifications from API
            const response = await fetch(`${API_BASE_URL}/notifications`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            notifications = await response.json();
            
            // Remove loading spinner
            notificationsList.removeChild(loadingSpinner);
            
            // Display notifications
            if (notifications.length === 0) {
                // If no notifications
                const emptyNote = document.createElement('div');
                emptyNote.className = 'empty-notifications';
                emptyNote.textContent = 'No notifications at this time.';
                notificationsList.appendChild(emptyNote);
            } else {
                // Add each notification to the list
                notifications.forEach(notification => {
                    const item = createNotificationElement(notification);
                    notificationsList.appendChild(item);
                });
                
                // Update the badge count
                const notificationBadge = document.getElementById('notificationBadge');
                if (notificationBadge) {
                    const unreadCount = notifications.filter(n => !n.is_read).length;
                    notificationBadge.textContent = unreadCount.toString();
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            
            // Remove loading spinner
            if (loadingSpinner.parentNode === notificationsList) {
                notificationsList.removeChild(loadingSpinner);
            }
            
            // Show error message
            const errorNote = document.createElement('div');
            errorNote.className = 'empty-notifications';
            errorNote.textContent = 'Error loading notifications. Please try again.';
            notificationsList.appendChild(errorNote);
            
            // Use placeholder notifications
            usePlaceholderNotifications();
        }
    }
    
    /**
     * Create a notification element for display
     */
    function createNotificationElement(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.is_read ? '' : 'unread'}`;
        item.dataset.id = notification.id;
        
        // Format time
        let timeStr = 'Unknown time';
        if (notification.created_date) {
            const now = new Date();
            const created = new Date(notification.created_date);
            const diffMs = now - created;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays < 1) {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                if (diffHours < 1) {
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    timeStr = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                } else {
                    timeStr = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                }
            } else {
                timeStr = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            }
        }
        
        item.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${timeStr}</div>
            </div>
            <button class="dismiss-button" data-id="${notification.id}">×</button>
        `;
        
        // Add click handler to mark as read
        item.addEventListener('click', function(event) {
            if (!event.target.classList.contains('dismiss-button')) {
                markNotificationRead(notification.id);
            }
        });
        
        // Add click handler for dismiss button
        const dismissButton = item.querySelector('.dismiss-button');
        if (dismissButton) {
            dismissButton.addEventListener('click', function(event) {
                event.stopPropagation();
                deleteNotification(notification.id);
            });
        }
        
        return item;
    }
    
    /**
     * Mark a notification as read
     */
    async function markNotificationRead(notificationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            
            if (!response.ok) throw new Error('Failed to mark notification as read');
            
            // Update notification in memory
            const index = notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                notifications[index].is_read = true;
            }
            
            // Update UI
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.remove('unread');
            }
            
            // Update badge count
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                notificationBadge.textContent = unreadCount.toString();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    
    /**
     * Delete a notification
     */
    async function deleteNotification(notificationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete notification');
            
            // Remove from memory
            notifications = notifications.filter(n => n.id !== notificationId);
            
            // Remove from UI
            const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.remove();
            }
            
            // Update badge count
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                notificationBadge.textContent = unreadCount.toString();
            }
            
            // Show empty message if no notifications left
            if (notifications.length === 0) {
                const notificationsList = document.getElementById('notificationsList');
                if (notificationsList) {
                    const emptyNote = document.createElement('div');
                    emptyNote.className = 'empty-notifications';
                    emptyNote.textContent = 'No notifications at this time.';
                    notificationsList.appendChild(emptyNote);
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }
    
    /**
     * Use placeholder notifications when API fails
     */
    function usePlaceholderNotifications() {
        // Create some placeholder notifications
        notifications = [
            {
                id: '1',
                title: 'New IPA Symbol Proposed',
                message: 'A new vowel symbol has been proposed for review.',
                created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                is_read: false
            },
            {
                id: '2',
                title: 'Your feedback received',
                message: 'Thank you for your feedback on the bilabial click symbol.',
                created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                is_read: true
            },
            {
                id: '3',
                title: 'Welcome!',
                message: 'Welcome to the Additional IPA Symbols tool.',
                created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                is_read: true
            }
        ];
        
        // Update the notification list
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            notificationsList.innerHTML = '';
            
            notifications.forEach(notification => {
                const item = createNotificationElement(notification);
                notificationsList.appendChild(item);
            });
            
            // Update the badge count
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                notificationBadge.textContent = unreadCount.toString();
            }
        }
    }
    
    /**
     * Initialize search functionality
     */
    function initSearchFunctionality() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const clearButton = document.getElementById('clearButton');
        
        if (searchInput && searchButton) {
            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', clearSearch);
        }
    }
    
    /**
     * Perform search on the page
     */
    function performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }
        
        let foundAny = false;
        
        // Search in table cells
        const tableCells = document.querySelectorAll('td');
        tableCells.forEach(cell => {
            const originalHTML = cell.innerHTML;
            const cellText = cell.textContent;
            
            if (cellText.trim().toLowerCase().includes(searchTerm)) {
                // Wrap the matching part in a highlight span
                const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                cell.innerHTML = cellText.replace(regex, '<span style="background-color: #ffff99;">$1</span>');
                foundAny = true;
            } else {
                // Reset to original content
                cell.innerHTML = originalHTML;
            }
        });
        
        // Search in infoboxes
        const infoboxes = document.querySelectorAll('.infobox');
        infoboxes.forEach(infobox => {
            const symbolElement = infobox.querySelector('.IPA');
            const titleElement = infobox.querySelector('.infobox-above');
            
            let matches = false;
            
            // Check symbol text
            if (symbolElement) {
                const originalSymbolHTML = symbolElement.innerHTML;
                const symbolText = symbolElement.textContent;
                
                if (symbolText.toLowerCase().includes(searchTerm)) {
                    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                    symbolElement.innerHTML = symbolText.replace(regex, '<span style="background-color: #ffff99;">$1</span>');
                    matches = true;
                    foundAny = true;
                } else {
                    symbolElement.innerHTML = originalSymbolHTML;
                }
            }
            
            // Check title/description
            if (titleElement) {
                const originalTitleHTML = titleElement.innerHTML;
                const titleText = titleElement.textContent;
                
                if (titleText.toLowerCase().includes(searchTerm)) {
                    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                    titleElement.innerHTML = titleText.replace(regex, '<span style="background-color: #ffff99;">$1</span>');
                    matches = true;
                    foundAny = true;
                } else {
                    titleElement.innerHTML = originalTitleHTML;
                }
            }
            
            // Add a subtle indicator to the whole infobox if any part matches
            infobox.style.boxShadow = matches ? '0 0 8px #4285f4' : '';
        });
        
        // Show a message if no results were found
        if (!foundAny) {
            alert(`No matches found for: ${searchTerm}`);
        }
    }
    
    /**
     * Clear search highlights
     */
    function clearSearch() {
        // Reset all table cells to their original state
        document.querySelectorAll('td').forEach(cell => {
            // Remove highlight spans if any
            cell.innerHTML = cell.innerHTML.replace(/<span style="background-color: #ffff99;">(.*?)<\/span>/g, '$1');
        });
        
        // Reset all infobox elements
        document.querySelectorAll('.infobox').forEach(infobox => {
            infobox.style.boxShadow = '';
            
            // Reset IPA span
            const symbolElement = infobox.querySelector('.IPA');
            if (symbolElement) {
                symbolElement.innerHTML = symbolElement.innerHTML.replace(/<span style="background-color: #ffff99;">(.*?)<\/span>/g, '$1');
            }
            
            // Reset title element
            const titleElement = infobox.querySelector('.infobox-above');
            if (titleElement) {
                titleElement.innerHTML = titleElement.innerHTML.replace(/<span style="background-color: #ffff99;">(.*?)<\/span>/g, '$1');
            }
        });
        
        // Clear the search input
        document.getElementById('searchInput').value = '';
    }
    
    /**
     * Helper function to escape special characters in regex
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Get the current filter value from active filter button
     */
    function getCurrentFilter() {
        const activeFilter = document.querySelector('.filter-btn.active');
        return activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    }
    
    /**
     * Check if the user is in admin mode
     */
    function isAdmin() {
        return window.location.hash === "#adminMode";
    }
    
    // Make some functions globally available for HTML event handlers
    window.toggleReplyForm = function(button) {
        const topic = button.closest('.topic');
        const replyForm = topic.querySelector('.reply-form');
        
        if (replyForm.style.display === 'block') {
            replyForm.style.display = 'none';
        } else {
            replyForm.style.display = 'block';
        }
    };
});
