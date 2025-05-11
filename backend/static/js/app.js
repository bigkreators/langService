/**
 * Extended IPA Symbols Application Frontend
 * This script handles the frontend functionality and API connectivity
 */

document.addEventListener('DOMContentLoaded', function() {
    // Base URL for API requests
    const API_BASE_URL = '/api';
    
    // Global state
    let currentLanguage = 'english';
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
        
        // Load phoneme data
        loadLanguages()
            .then(() => loadPhonemeData(currentLanguage))
            .catch(err => console.error('Error initializing app:', err));
        
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
                    audio.play().catch(err => console.error('Error playing audio:', err));
                }
            }
        });
    }
    
    /**
     * Load available languages from the API
     */
    async function loadLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/languages`);
            if (!response.ok) throw new Error('Failed to fetch languages');
            
            const languages = await response.json();
            
            // Populate language selector if it exists
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.innerHTML = ''; // Clear existing options
                
                languages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang.code;
                    option.textContent = lang.name;
                    languageSelect.appendChild(option);
                });
                
                // Set up change event handler
                languageSelect.addEventListener('change', function() {
                    currentLanguage = this.value;
                    loadPhonemeData(currentLanguage);
                });
            }
            
            return languages;
        } catch (error) {
            console.error('Error loading languages:', error);
            throw error;
        }
    }
    
    /**
     * Load phoneme data for a specific language from the API
     */
    async function loadPhonemeData(languageCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/languages/${languageCode}/phonemic`);
            if (!response.ok) throw new Error(`Failed to fetch phoneme data for ${languageCode}`);
            
            const phonemeData = await response.json();
            
            // Update the UI with phoneme data
            updatePhonemeGrid(phonemeData);
            
            return phonemeData;
        } catch (error) {
            console.error(`Error loading phoneme data for ${languageCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Update the phoneme grid in the UI
     */
    function updatePhonemeGrid(phonemeData) {
        // Implementation depends on your specific UI structure
        // This is a placeholder for your actual implementation
        console.log('Updating phoneme grid with data:', phonemeData);
        
        // For now, we're assuming the HTML is pre-rendered
        // In a fully dynamic implementation, you would create the table cells here
    }
    
    /**
     * Initialize the proposal system
     */
    function initProposalSystem() {
        // Load existing proposals
        loadProposals();
        
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
        
        // Set up event delegation for proposal actions
        const proposalsList = document.getElementById('proposals-list');
        if (proposalsList) {
            proposalsList.addEventListener('click', handleProposalAction);
        }
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
            
            // Fallback to local storage if API fails
            proposals = JSON.parse(localStorage.getItem('ipaProposals')) || [];
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
        filteredProposals.forEach((proposal, index) => {
            const proposalItem = createProposalElement(proposal, index);
            proposalsList.appendChild(proposalItem);
        });
    }
    
    /**
     * Create a proposal element for display
     */
    function createProposalElement(proposal, index) {
        const proposalItem = document.createElement('div');
        proposalItem.className = 'proposal-item';
        proposalItem.setAttribute('data-id', proposal.id || index);
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
            ? new Date(proposal.submitted_date).toLocaleDateString()
            : proposal.date || 'Unknown date';
        
        // Build HTML
        proposalItem.innerHTML = `
            <div class="proposal-header">
                <div class="proposal-symbol">${proposal.symbol}</div>
                <div class="proposal-date">${date}${statusBadge}</div>
            </div>
            <div class="proposal-details">
                <p><strong>Sound Name:</strong> ${proposal.sound_name || proposal.soundName}</p>
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
     * Handle proposal actions (voting, approving, rejecting, deleting)
     */
    async function handleProposalAction(event) {
        const target = event.target;
        const proposalId = target.getAttribute('data-id');
        
        if (!proposalId) return;
        
        try {
            if (target.classList.contains('upvote') || target.classList.contains('downvote')) {
                // Handle voting
                const vote = parseInt(target.getAttribute('data-vote'));
                
                const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/vote`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vote })
                });
                
                if (!response.ok) throw new Error('Failed to vote on proposal');
                
                // Update proposal in memory
                const updatedProposal = await response.json();
                const index = proposals.findIndex(p => p.id === proposalId);
                if (index !== -1) proposals[index] = updatedProposal;
                
                // Update display
                displayProposals(getCurrentFilter());
            } else if (target.classList.contains('approve-btn')) {
                // Handle approval
                const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' })
                });
                
                if (!response.ok) throw new Error('Failed to approve proposal');
                
                // Update proposal in memory
                const updatedProposal = await response.json();
                const index = proposals.findIndex(p => p.id === proposalId);
                if (index !== -1) proposals[index] = updatedProposal;
                
                // Update display
                displayProposals(getCurrentFilter());
            } else if (target.classList.contains('reject-btn')) {
                // Handle rejection
                const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected' })
                });
                
                if (!response.ok) throw new Error('Failed to reject proposal');
                
                // Update proposal in memory
                const updatedProposal = await response.json();
                const index = proposals.findIndex(p => p.id === proposalId);
                if (index !== -1) proposals[index] = updatedProposal;
                
                // Update display
                displayProposals(getCurrentFilter());
            } else if (target.classList.contains('delete-proposal')) {
                // Handle deletion
                if (confirm('Are you sure you want to delete this proposal?')) {
                    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete proposal');
                    
                    // Remove from memory
                    proposals = proposals.filter(p => p.id !== proposalId);
                    
                    // Update display
                    displayProposals(getCurrentFilter());
                }
            }
        } catch (error) {
            console.error('Error handling proposal action:', error);
            alert('An error occurred. Please try again.');
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
            
            // Fallback to local storage if API fails
            const newProposal = {
                id: Date.now().toString(),
                symbol: document.getElementById('symbol').value,
                soundName: document.getElementById('sound-name').value,
                category: document.getElementById('category').value,
                rationale: document.getElementById('rationale').value,
                exampleLanguage: document.getElementById('example-language').value,
                date: new Date().toLocaleDateString(),
                status: 'pending',
                votes: 0
            };
            
            proposals.unshift(newProposal);
            localStorage.setItem('ipaProposals', JSON.stringify(proposals));
            
            // Clear form
            document.getElementById('symbol').value = '';
            document.getElementById('sound-name').value = '';
            document.getElementById('rationale').value = '';
            document.getElementById('example-language').value = '';
            document.getElementById('audio-sample').value = '';
            document.getElementById('symbol-image').value = '';
            
            // Update display
            displayProposals(getCurrentFilter());
            
            alert('Your proposal has been saved locally. Note that it will not be synchronized with the server.');
        }
    }
    
    /**
     * Initialize discussion forum functionality
     */
    function initDiscussionForum() {
        // Load existing topics
        loadDiscussionTopics();
        
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
     * Load discussion topics from the API
     */
    async function loadDiscussionTopics() {
        try {
            const response = await fetch(`${API_BASE_URL}/discussions`);
            if (!response.ok) throw new Error('Failed to fetch discussion topics');
            
            const topics = await response.json();
            
            // Update UI with topics
            displayDiscussionTopics(topics);
        } catch (error) {
            console.error('Error loading discussion topics:', error);
            // No fallback for discussions - they require the API
        }
    }
    
    /**
     * Display discussion topics in the UI
     */
    function displayDiscussionTopics(topics) {
        const topicsContainer = document.getElementById('topics-container');
        if (!topicsContainer) return;
        
        // Keep the heading
        const heading = topicsContainer.querySelector('h3');
        topicsContainer.innerHTML = '';
        if (heading) topicsContainer.appendChild(heading);
        
        // Add each topic
        topics.forEach(topic => {
            const topicElement = createTopicElement(topic);
            topicsContainer.appendChild(topicElement);
        });
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
            : 'Unknown date';
        
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
                : 'Unknown date';
            
            return `
                <div class="reply" data-id="${reply.id}">
                    <div class="reply-meta">${reply.author_name || 'Anonymous'} on ${date}</div>
                    <p>${reply.content}</p>
                </div>
            `;
        }).join('');
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
            
            // Reload topics to include the new one
            loadDiscussionTopics();
        } catch (error) {
            console.error('Error submitting discussion topic:', error);
            alert('An error occurred. Please try again.');
        }
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
            alert('An error occurred. Please try again.');
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
        
        // Initial load
        loadNotifications();
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
            
            // Use placeholder notifications for demo
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
     * Use placeholder notifications for demo
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
        
        if (searchInput && searchButton) {
            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
            
            // Add clear button if not already present
            const clearButton = document.getElementById('clearButton');
            if (!clearButton) {
                const searchContainer = document.querySelector('.search-container');
                if (searchContainer) {
                    const clearBtn = document.createElement('button');
                    clearBtn.id = 'clearButton';
                    clearBtn.textContent = 'Clear';
                    clearBtn.style.padding = '10px 15px';
                    clearBtn.style.backgroundColor = '#f44336';
                    clearBtn.style.color = 'white';
                    clearBtn.style.border = 'none';
                    clearBtn.style.borderRadius = '4px';
                    clearBtn.style.marginLeft = '10px';
                    clearBtn.style.cursor = 'pointer';
                    clearBtn.addEventListener('click', clearSearch);
                    
                    searchContainer.appendChild(clearBtn);
                }
            }
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
