document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Set default active tab
    document.getElementById('consonants').classList.add('active');
    document.getElementById('consonants-tab').classList.add('active');
    
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
    
    // Set up clickable text functionality
    const clickableTexts = document.querySelectorAll('.clickable-text');
    clickableTexts.forEach(text => {
        text.addEventListener('click', function() {
            const audioUrl = this.getAttribute('data-audio-url');
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.play();
            }
        });
    });
    
    // Proposals functionality
    const submitProposalBtn = document.getElementById('submit-proposal');
    const proposalsList = document.getElementById('proposals-list');
    let proposals = JSON.parse(localStorage.getItem('ipaProposals')) || [];
    
    // Define admin hash - change this to something unique and complex
    const ADMIN_HASH = "yourSecretAdminHash123";
    
    // Check for admin mode in URL hash
    function checkAdminMode() {
        return window.location.hash === "#" + ADMIN_HASH;
    }
    
    // Function to check if user is in admin mode
    function isAdmin() {
        return checkAdminMode();
    }
    
    // Function to clear admin hash from URL (for logging out)
    function clearAdminHash() {
        // Replace current URL without the hash
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    
    // Function to save proposals to localStorage
    function saveProposals() {
        localStorage.setItem('ipaProposals', JSON.stringify(proposals));
        // After saving, refresh the proposals list
        proposals = JSON.parse(localStorage.getItem('ipaProposals')) || [];
    }
    
    // Function to get current filter selection
    function getCurrentFilter() {
        const activeFilter = document.querySelector('.filter-btn.active');
        return activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    }
    
    // Function to add approved symbol to the appropriate table
    function addApprovedSymbolToTable(proposal) {
        console.log(`Symbol ${proposal.symbol} approved and should be added to the ${proposal.category} table`);
        // You would implement logic here to add the symbol to the appropriate table
    }
    
    // Function to display proposals
    function displayProposals(filter = 'all') {
        if (!proposalsList) return; // Safety check
        
        proposalsList.innerHTML = '';
        
        // Make sure we have the latest proposals
        proposals = JSON.parse(localStorage.getItem('ipaProposals')) || [];
        
        let pendingCount = 0;
        
        const filteredProposals = filter === 'all'
            ? proposals
            : proposals.filter(proposal => proposal.category === filter);
        
        if (filteredProposals.length === 0) {
            proposalsList.innerHTML = '<div class="no-proposals">No proposals found for this category. Be the first to propose a new symbol!</div>';
            const pendingCountElement = document.getElementById('pending-count');
            if (pendingCountElement) {
                pendingCountElement.textContent = '0';
            }
            return;
        }
        
        filteredProposals.forEach((proposal, index) => {
            if (proposal.status === 'pending') {
                pendingCount++;
            }
            
            const proposalItem = document.createElement('div');
            proposalItem.className = 'proposal-item';
            proposalItem.setAttribute('data-id', index);
            // Make sure proposal items have relative positioning for absolute delete button
            proposalItem.style.position = 'relative';
            
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
                        <button class="approve-btn" data-id="${index}">Approve</button>
                        <button class="reject-btn" data-id="${index}">Reject</button>
                    </div>
                `;
            }
            
            // Add delete button (available to all users)
            let deleteButton = `<button class="delete-proposal" data-id="${index}">×</button>`;
            
            proposalItem.innerHTML = `
                <div class="proposal-header">
                    <div class="proposal-symbol">${proposal.symbol}</div>
                    <div class="proposal-date">${proposal.date}${statusBadge}</div>
                </div>
                <div class="proposal-details">
                    <p><strong>Sound Name:</strong> ${proposal.soundName}</p>
                    <p><strong>Category:</strong> ${proposal.category.charAt(0).toUpperCase() + proposal.category.slice(1)}</p>
                    <p><strong>Rationale:</strong> ${proposal.rationale}</p>
                    ${proposal.exampleLanguage ? `<p><strong>Example Languages:</strong> ${proposal.exampleLanguage}</p>` : ''}
                </div>
                <div class="proposal-votes">
                    <button class="vote-btn upvote" data-id="${index}">👍 Upvote</button>
                    <button class="vote-btn downvote" data-id="${index}">👎 Downvote</button>
                    <span class="vote-count">${proposal.votes || 0}</span>
                </div>
                ${adminControls}
                ${deleteButton}
            `;
            
            proposalsList.appendChild(proposalItem);
        });
        
        // Update pending count in admin panel
        const pendingCountElement = document.getElementById('pending-count');
        if (pendingCountElement) {
            pendingCountElement.textContent = pendingCount;
        }
        
        // Add event listeners for votes
        document.querySelectorAll('.upvote').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                proposals[id].votes = (proposals[id].votes || 0) + 1;
                saveProposals();
                displayProposals(getCurrentFilter());
            });
        });
        
        document.querySelectorAll('.downvote').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                proposals[id].votes = (proposals[id].votes || 0) - 1;
                saveProposals();
                displayProposals(getCurrentFilter());
            });
        });
        
        // Admin action event listeners
        if (isAdmin()) {
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    proposals[id].status = 'approved';
                    proposals[id].approvedDate = new Date().toLocaleDateString();
                    saveProposals();
                    // Optionally add the approved symbol to the appropriate table
                    addApprovedSymbolToTable(proposals[id]);
                    displayProposals(getCurrentFilter());
                });
            });
            
            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    proposals[id].status = 'rejected';
                    proposals[id].rejectedDate = new Date().toLocaleDateString();
                    saveProposals();
                    displayProposals(getCurrentFilter());
                });
            });
        }
        
        // Delete proposal event listeners - available to all users
        document.querySelectorAll('.delete-proposal').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this proposal?')) {
                    // Get the actual index in the main proposals array
                    const filter = getCurrentFilter();
                    if (filter === 'all') {
                        // Direct deletion if no filtering
                        proposals.splice(id, 1);
                    } else {
                        // Find the actual index in the main array when filtered
                        const filteredProposals = proposals.filter(proposal => proposal.category === filter);
                        const proposalToDelete = filteredProposals[id];
                        const mainIndex = proposals.findIndex(p =>
                            p.symbol === proposalToDelete.symbol &&
                            p.date === proposalToDelete.date &&
                            p.soundName === proposalToDelete.soundName
                        );
                        if (mainIndex !== -1) {
                            proposals.splice(mainIndex, 1);
                        }
                    }
                    saveProposals();
                    displayProposals(getCurrentFilter());
                }
            });
        });
    }
    
    // Make our display function available to other scripts
    window.displayProposals = displayProposals;
    
    // Handle form submission
    if (submitProposalBtn) {
        // Store original handler if it exists
        window.originalSubmitHandler = submitProposalBtn.onclick;
        
        submitProposalBtn.addEventListener('click', function() {
            const symbol = document.getElementById('symbol').value;
            const soundName = document.getElementById('sound-name').value;
            const category = document.getElementById('category').value;
            const rationale = document.getElementById('rationale').value;
            const exampleLanguage = document.getElementById('example-language').value;
            
            // Basic validation
            if (!symbol || !soundName || !category || !rationale) {
                alert('Please fill in all required fields (Symbol, Sound Name, Category, and Rationale)');
                return;
            }
            
            // Create proposal object
            const newProposal = {
                symbol: symbol,
                soundName: soundName,
                category: category,
                rationale: rationale,
                exampleLanguage: exampleLanguage,
                date: new Date().toLocaleDateString(),
                status: 'pending',
                votes: 0
            };
            
            // Add to proposals array
            proposals.push(newProposal);
            saveProposals();
            
            // Clear form
            document.getElementById('symbol').value = '';
            document.getElementById('sound-name').value = '';
            document.getElementById('rationale').value = '';
            document.getElementById('example-language').value = '';
            document.getElementById('audio-sample').value = '';
            document.getElementById('symbol-image').value = '';
            
            // Display updated proposals
            displayProposals(getCurrentFilter());
            
            alert('Your proposal has been submitted successfully!');
        });
    }
    
    // Add admin control section to the proposals tab
    const proposalsTab = document.getElementById('proposals');
    if (proposalsTab) {
        const adminControlsSection = document.createElement('div');
        adminControlsSection.id = 'admin-controls';
        adminControlsSection.className = 'admin-panel';
        adminControlsSection.style.display = isAdmin() ? 'block' : 'none';
        adminControlsSection.innerHTML = `
            <div class="admin-header">
                <h3>Admin Controls</h3>
                <p>You are currently in admin mode. You can approve or reject proposals.</p>
                <button id="admin-logout">Exit Admin Mode</button>
            </div>
            <div class="admin-stats">
                <p>Pending proposals: <span id="pending-count">0</span></p>
            </div>
        `;
        
        // Insert admin controls at the beginning of the proposals tab
        proposalsTab.insertBefore(adminControlsSection, proposalsTab.firstChild);
        
        // Add logout functionality
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                clearAdminHash();
                adminControlsSection.style.display = 'none';
                // Refresh the proposals display without admin controls
                displayProposals(getCurrentFilter());
            });
        }
    }
    
    // Check URL hash when it changes
    window.addEventListener('hashchange', function() {
        const adminControlsSection = document.getElementById('admin-controls');
        if (adminControlsSection) {
            if (isAdmin()) {
                adminControlsSection.style.display = 'block';
            } else {
                adminControlsSection.style.display = 'none';
            }
        }
        displayProposals(getCurrentFilter());
    });
    
    // Handle filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            displayProposals(filter);
        });
    });
    
    // Audio functionality for clickable phonetic symbols
    document.querySelectorAll('.clickable-text').forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', function() {
            const audioUrl = this.getAttribute('data-audio-url');
            if (audioUrl) {
                const audio = new Audio(audioUrl);
                audio.play().catch(e => {
                    console.error('Error playing audio:', e);
                    alert('Unable to play audio sample. The audio file may be missing or your browser may not support this feature.');
                });
            }
        });
    });
    
    // Make the symbol cells clickable to add them to the form
    document.querySelectorAll('td:not(.label-cell)').forEach(cell => {
        if (cell.textContent.trim()) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', function() {
                const symbol = this.textContent.trim();
                document.getElementById('symbol').value = symbol;
            });
        }
    });
    
    // Handle file uploads (preview functionality)
    const symbolImageInput = document.getElementById('symbol-image');
    if (symbolImageInput) {
        symbolImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('Image file selected:', file.name);
            }
        });
    }
    
    const audioSampleInput = document.getElementById('audio-sample');
    if (audioSampleInput) {
        audioSampleInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('Audio file selected:', file.name);
            }
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    function performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            let foundAny = false;
            
            // Search in simple table cells
            const tableCells = document.querySelectorAll('td');
            
            tableCells.forEach(cell => {
                const originalHTML = cell.innerHTML;
                const cellText = cell.textContent;
                
                // If cell only contains a single symbol or character
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
        } else {
            clearSearch();
            alert('Please enter a search term');
        }
    }

    // Helper function to escape special characters in regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Clear search function
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

    // Add a clear button to the search container
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clearButton';
        clearButton.textContent = 'Clear';
        clearButton.style.padding = '10px 15px';
        clearButton.style.backgroundColor = '#f44336';
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '4px';
        clearButton.style.marginLeft = '10px';
        clearButton.style.cursor = 'pointer';
        clearButton.addEventListener('click', clearSearch);

        // Add the clear button to the search container
        searchContainer.appendChild(clearButton);
    }
    
    // Discussion forum functionality
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackThanks = document.getElementById('feedback-thanks');
    const topicsContainer = document.getElementById('topics-container');
    
    if (feedbackForm) {
        // Handle new topic submission
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value || 'Anonymous';
            const topicTitle = document.getElementById('topic-title').value;
            const feedbackText = document.getElementById('feedback-text').value;
            
            // Create new topic
            const newTopic = createNewTopic(name, topicTitle, feedbackText);
            
            // Add to container at the top
            topicsContainer.insertBefore(newTopic, topicsContainer.children[1]);
            
            // Show thanks message
            feedbackThanks.classList.remove('hidden');
            
            // Reset form
            feedbackForm.reset();
            
            // Hide thanks message after 3 seconds
            setTimeout(function() {
                feedbackThanks.classList.add('hidden');
            }, 3000);
        });
    }
    
    // Handle reply form submissions
    document.addEventListener('submit', function(e) {
        if (e.target.classList.contains('topic-reply-form')) {
            e.preventDefault();
            
            const replyForm = e.target;
            const topic = replyForm.closest('.topic');
            const repliesContainer = topic.querySelector('.replies');
            
            // Get form values
            const name = replyForm.querySelector('.reply-name').value || 'Anonymous';
            const text = replyForm.querySelector('.reply-text').value;
            
            // Create new reply
            const newReply = document.createElement('div');
            newReply.className = 'reply';
            
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            newReply.innerHTML = `
                <div class="reply-meta">${name} on ${dateStr}</div>
                <p>${text}</p>
            `;
            
            // Add to container
            repliesContainer.appendChild(newReply);
            
            // Reset form and hide it
            replyForm.reset();
            replyForm.parentElement.style.display = 'none';
        }
    });
    
    // Initialize notifications
    const notificationBell = document.getElementById('notificationBell');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const notificationsList = document.getElementById('notificationsList');
    const refreshNotifications = document.getElementById('refreshNotifications');
    
    // Toggle dropdown when bell is clicked
    if (notificationBell && notificationsDropdown) {
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
        if (refreshNotifications) {
            refreshNotifications.addEventListener('click', loadNotifications);
        }
    }
    
    // Function to load notifications
    function loadNotifications() {
        if (!notificationsList) return;
        
        // First clear any existing notifications
        while (notificationsList.firstChild) {
            notificationsList.removeChild(notificationsList.firstChild);
        }
        
        // Add loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        notificationsList.appendChild(loadingSpinner);
        
        // Simulate loading delay
        setTimeout(() => {
            // Remove loading spinner
            notificationsList.removeChild(loadingSpinner);
            
            // Check if we have notifications data
            // In a real application, you would fetch this from an API or localStorage
            const notifications = [
                {
                    title: 'New IPA Symbol Proposed',
                    message: 'A new vowel symbol has been proposed for review.',
                    time: '2 hours ago'
                },
                {
                    title: 'Your feedback received',
                    message: 'Thank you for your feedback on the bilabial click symbol.',
                    time: '1 day ago'
                },
                {
                    title: 'Welcome!',
                    message: 'Welcome to the Additional IPA Symbols tool.',
                    time: '3 days ago'
                }
            ];
            
            if (notifications.length === 0) {
                // If no notifications
                const emptyNote = document.createElement('div');
                emptyNote.className = 'empty-notifications';
                emptyNote.textContent = 'No notifications at this time.';
                notificationsList.appendChild(emptyNote);
            } else {
                // Add each notification to the list
                notifications.forEach(notification => {
                    const item = document.createElement('div');
                    item.className = 'notification-item';
                    
                    item.innerHTML = `
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${notification.time}</div>
                        </div>
                    `;
                    
                    notificationsList.appendChild(item);
                });
                
                // Update the badge count
                const notificationBadge = document.getElementById('notificationBadge');
                if (notificationBadge) {
                    notificationBadge.textContent = notifications.length;
                }
            }
        }, 800); // Simulate network delay
    }
    
    // Initial call to display proposals
    displayProposals();
    
    // Add admin styling
    const style = document.createElement('style');
    style.textContent = `
        .admin-panel {
            background-color: #e6f7ff;
            border: 1px solid #91d5ff;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .admin-header {
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
        }
        .admin-header h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #0050b3;
        }
        #admin-logout {
            background-color: #ff4d4f;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            align-self: flex-start;
        }
        .admin-stats {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .admin-controls {
            margin-top: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .approve-btn, .reject-btn {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .approve-btn {
            background-color: #28a745;
            color: white;
        }
        .reject-btn {
            background-color: #dc3545;
            color: white;
        }
    `;
    document.head.appendChild(style);
});

// Create a new topic element
function createNewTopic(name, title, content) {
    const topic = document.createElement('div');
    topic.className = 'topic';
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    topic.innerHTML = `
        <div class="topic-header">
            <h4 class="topic-title">${title}</h4>
            <span class="topic-meta">Posted by ${name} on ${dateStr}</span>
        </div>
        <div class="topic-content">
            <p>${content}</p>
        </div>
        <div class="replies">
            <!-- Replies will go here -->
        </div>
        <div class="topic-actions">
            <button class="btn reply-btn" onclick="toggleReplyForm(this)">Reply</button>
        </div>
        <div class="reply-form">
            <form class="topic-reply-form">
                <div class="form-group">
                    <label for="reply-name">Your Name (optional):</label>
                    <input type="text" class="reply-name form-control">
                </div>
                <div class="form-group">
                    <label for="reply-text">Your Reply:</label>
                    <textarea class="reply-text form-control" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn">Post Reply</button>
            </form>
        </div>
    `;
    
    return topic;
}

// Toggle reply form visibility - making it a global function for onclick attribute
function toggleReplyForm(button) {
    const topic = button.closest('.topic');
    const replyForm = topic.querySelector('.reply-form');
    
    if (replyForm.style.display === 'block') {
        replyForm.style.display = 'none';
    } else {
        replyForm.style.display = 'block';
    }
}

// Make toggleReplyForm available globally
window.toggleReplyForm = toggleReplyForm;
