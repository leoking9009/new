class NotionTaskManager {
    constructor() {
        this.databases = {
            main: '232c911759c981829e08fd928b282cd7',
            other: '25cc911759c980e7a687d212aa0ee422',
            todo: '274c911759c980939472c626b7602321',
            journal: '274c911759c980bebbdcd3f7d51d822f',
            records: '27bc911759c980a58798d979c097dd19',
            events: '27bc911759c980848045ceabcbbba566'
        };
        this.currentTab = 'main';
        this.currentView = 'card'; // card or table
        this.currentTaskId = null;
        this.allTasks = []; // Store all tasks for dashboard filtering
        this.currentDashboardFilter = 'all';

        this.checkLogin();
        this.initEventListeners();
        this.initTheme();
        this.loadAllTasksForDashboard();
        this.loadTasks('main');

        // Debug: Check if assignee stats content exists
        setTimeout(() => {
            const element = document.getElementById('assignee-stats-content');
            console.log('🔍 Assignee stats element check:', element ? 'Found' : 'NOT FOUND');
            if (element) {
                console.log('✅ Element details:', element);
            }
        }, 1000);
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                console.log('🔍 Tab clicked:', tabName, 'Element:', e.currentTarget);
                this.switchTab(tabName);
            });
        });

        // Fixed button handlers
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadTasks(this.currentTab);
        });

        document.getElementById('addBtn').addEventListener('click', () => {
            this.openTaskModal(this.currentTab);
        });

        // View toggle buttons
        document.getElementById('cardViewBtn').addEventListener('click', () => {
            this.switchView('card');
        });

        document.getElementById('tableViewBtn').addEventListener('click', () => {
            this.switchView('table');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // TODO specific event listeners
        document.getElementById('todoAddBtn').addEventListener('click', () => {
            this.addTodoItem();
        });

        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodoItem();
            }
        });

        // Journal specific event listeners
        document.getElementById('journalCreateBtn').addEventListener('click', () => {
            this.showJournalForm();
        });

        document.getElementById('journalSaveBtn').addEventListener('click', () => {
            this.saveJournalEntry();
        });

        document.getElementById('journalCancelBtn').addEventListener('click', () => {
            this.hideJournalForm();
        });

        document.getElementById('journalEditBtn').addEventListener('click', () => {
            this.editJournalEntry();
        });

        document.getElementById('journalDatePicker').addEventListener('change', (e) => {
            this.loadJournalByDate(e.target.value);
        });

        document.getElementById('journalTodayBtn').addEventListener('click', () => {
            this.loadTodayJournal();
        });

        // Records specific event listeners
        document.getElementById('recordsCreateBtn').addEventListener('click', () => {
            this.showRecordsForm();
        });

        document.getElementById('recordsSaveBtn').addEventListener('click', () => {
            this.saveRecord();
        });

        document.getElementById('recordsCancelBtn').addEventListener('click', () => {
            this.hideRecordsForm();
        });

        // Events specific event listeners
        document.getElementById('eventsCreateBtn').addEventListener('click', () => {
            this.showEventModal();
        });

        document.getElementById('eventSaveBtn').addEventListener('click', () => {
            this.saveEvent();
        });

        document.getElementById('eventCancelBtn').addEventListener('click', () => {
            this.hideEventModal();
        });

        document.getElementById('eventModalClose').addEventListener('click', () => {
            this.hideEventModal();
        });

        document.getElementById('addEventTaskBtn').addEventListener('click', () => {
            this.showEventTaskForm();
        });

        document.getElementById('saveEventTaskBtn').addEventListener('click', () => {
            this.saveEventTask();
        });

        document.getElementById('cancelEventTaskBtn').addEventListener('click', () => {
            this.hideEventTaskForm();
        });

        // Modal controls
        document.getElementById('cancelTask').addEventListener('click', () => {
            this.closeTaskModal();
        });
        document.querySelector('.close').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Close modal when clicking outside
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeTaskModal();
            }
        });

        // Dashboard stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.dataset.filter;
                this.setDashboardFilter(filter);
                this.showDashboardContent();
            });
        });

        // Dashboard view switching
        document.getElementById('dashboardCardViewBtn')?.addEventListener('click', () => {
            this.switchDashboardView('card');
        });
        document.getElementById('dashboardTableViewBtn')?.addEventListener('click', () => {
            this.switchDashboardView('table');
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        // Initialize saved view preference
        const savedView = localStorage.getItem('taskView') || 'card';
        this.currentView = savedView;
        this.switchView(savedView);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }

    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);

        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Update active tab panel
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName);
        });

        this.currentTab = tabName;
        this.hideDashboardContent();

        // Hide all content sections
        const tabContent = document.querySelector('.tab-content');
        const assigneeOverview = document.getElementById('assigneeOverviewContent');
        const assigneeStats = document.getElementById('assignee-stats-content');

        console.log('🔍 Elements check:', {
            tabContent: !!tabContent,
            assigneeOverview: !!assigneeOverview,
            assigneeStats: !!assigneeStats
        });

        if (tabContent) tabContent.style.display = 'none';
        if (assigneeOverview) assigneeOverview.style.display = 'none';
        if (assigneeStats) assigneeStats.style.display = 'none';

        if (tabName === 'main' || tabName === 'other' || tabName === 'todo') {
            console.log(`📋 Loading ${tabName} tasks`);
            if (tabContent) tabContent.style.display = 'block';
            this.loadTasks(tabName);
        } else if (tabName === 'journal') {
            console.log('📖 Loading journal tab');
            if (tabContent) tabContent.style.display = 'block';
            this.loadJournal();
        } else if (tabName === 'records') {
            console.log('📋 Loading records tab');
            if (tabContent) tabContent.style.display = 'block';
            this.loadRecords();
        } else if (tabName === 'events') {
            console.log('🎉 Loading events tab');
            if (tabContent) tabContent.style.display = 'block';
            this.loadEvents();
        } else if (tabName === 'assignee-stats') {
            console.log('📊 Loading assignee stats page');
            if (assigneeStats) {
                assigneeStats.style.display = 'block';
                console.log('✅ Showing assignee stats content');
                this.loadAssigneeStatsPage();
            } else {
                console.error('❌ assignee-stats-content element not found');

                // Check if element exists anywhere
                const allElements = document.querySelectorAll('[id*="assignee"]');
                console.log('🔍 All assignee-related elements:', Array.from(allElements).map(el => el.id));
            }
        }
    }

    switchView(viewType) {
        // Update active view button
        document.querySelectorAll('.view-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.view === viewType);
        });

        this.currentView = viewType;

        // Show/hide appropriate containers
        this.updateViewDisplay();

        // Save view preference
        localStorage.setItem('taskView', viewType);
    }

    updateViewDisplay() {
        const tabs = ['main', 'other'];

        tabs.forEach(tabName => {
            const cardContainer = document.getElementById(`${tabName}Tasks`);
            const tableContainer = document.getElementById(`${tabName}TasksTable`);

            if (this.currentView === 'card') {
                cardContainer.style.display = 'grid';
                tableContainer.style.display = 'none';
            } else {
                cardContainer.style.display = 'none';
                tableContainer.style.display = 'block';
            }
        });
    }

    async loadTasks(tabName) {
        // Special handling for TODO tab
        if (tabName === 'todo') {
            this.loadTodoList();
            return;
        }

        const loadingElement = document.getElementById(`${tabName}Loading`);
        const tasksContainer = document.getElementById(`${tabName}Tasks`);
        const tableContainer = document.getElementById(`${tabName}TasksTable`);
        const tableBody = document.getElementById(`${tabName}TasksTableBody`);

        if (!loadingElement) {
            console.warn(`Loading element not found: ${tabName}Loading`);
            // Continue without loading element
        }

        if (!tasksContainer) {
            console.error(`Tasks container not found: ${tabName}Tasks`);
            return;
        }

        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        tasksContainer.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases[tabName]}/query`);
            const tasks = response.results;

            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            if (tasks.length === 0) {
                const emptyStateHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <h3>업무가 없습니다</h3>
                        <p>새로운 업무를 추가해보세요.</p>
                    </div>
                `;

                tasksContainer.innerHTML = emptyStateHTML;
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 3rem;">${emptyStateHTML}</td></tr>`;
                }
                return;
            }

            // Render both card and table views
            tasks.forEach((task, index) => {
                // Card view with staggered animation
                setTimeout(() => {
                    const taskElement = this.createTaskElement(task, tabName);
                    tasksContainer.appendChild(taskElement);
                }, index * 50);

                // Table view
                if (tableBody) {
                    const tableRow = this.createTaskTableRow(task, tabName);
                    tableBody.appendChild(tableRow);
                }
            });

            // Update display based on current view
            this.updateViewDisplay();

        } catch (error) {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            const errorHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                    업무를 불러오는데 실패했습니다: ${error.message}
                </div>
            `;

            tasksContainer.innerHTML = errorHTML;
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">${errorHTML}</td></tr>`;
            }
        }
    }

    createTaskElement(task, tabName) {
        const taskDiv = document.createElement('div');
        const properties = task.properties;

        // Extract properties safely with multiple property name variants
        const title = this.getPropertyValue(properties, '과제명') ||
                     this.getPropertyValue(properties, 'Name') ||
                     this.getPropertyValue(properties, '이름') ||
                     this.getPropertyValue(properties, 'Title') || '제목 없음';

        const assignee = this.getPropertyValue(properties, '담당자') ||
                        this.getPropertyValue(properties, 'Assignee') || '';

        const dueDate = this.getPropertyValue(properties, '마감일') ||
                       this.getPropertyValue(properties, '마감기한') ||
                       this.getPropertyValue(properties, 'Due Date') || '';

        // Get checkbox value directly
        const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
        const status = (statusProp && statusProp.checkbox === true) ? '완료' : '';

        // Get checkbox value directly for priority
        const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
        const priority = (priorityProp && priorityProp.checkbox === true) ? '긴급' : '';

        const submitTo = this.getPropertyValue(properties, '제출처') ||
                        this.getPropertyValue(properties, 'Submit To') || '';

        // Get created and modified dates
        const createdDate = task.created_time ? this.formatDate(task.created_time) :
                           (this.getPropertyValue(properties, '생성일') ||
                            this.getPropertyValue(properties, 'Created') || '');

        const modifiedDate = task.last_edited_time ? this.formatDate(task.last_edited_time) :
                            (this.getPropertyValue(properties, '수정일') ||
                             this.getPropertyValue(properties, 'Modified') ||
                             this.getPropertyValue(properties, 'Last Modified') || '');

        const description = this.getPropertyValue(properties, '비고') ||
                           this.getPropertyValue(properties, 'Description') ||
                           this.getPropertyValue(properties, '설명') || '';

        const statusClass = status.replace(/\s+/g, '');
        const priorityClass = priority.replace(/\s+/g, '');

        // Determine card priority class
        let cardPriorityClass = 'priority-일반';
        if (priority === '긴급') {
            cardPriorityClass = 'priority-긴급';
        }

        taskDiv.className = `task-card ${cardPriorityClass}`;
        taskDiv.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${title}</div>
                    <div class="task-meta">
                        ${status ? `<span class="task-status ${statusClass}">${status}</span>` : ''}
                        ${priority ? `<span class="task-priority ${priorityClass}">${priority}</span>` : ''}
                        ${dueDate ? `<span class="task-due-date"><i class="fas fa-calendar"></i> ${dueDate}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="task-details">
                ${assignee ? `<div class="task-detail-item"><i class="fas fa-user"></i> <strong>담당자:</strong> ${assignee}</div>` : ''}
                ${submitTo ? `<div class="task-detail-item"><i class="fas fa-building"></i> <strong>제출처:</strong> ${submitTo}</div>` : ''}
                ${createdDate ? `<div class="task-detail-item"><i class="fas fa-plus-circle"></i> <strong>생성일:</strong> ${createdDate}</div>` : ''}
                ${modifiedDate ? `<div class="task-detail-item"><i class="fas fa-edit"></i> <strong>수정일:</strong> ${modifiedDate}</div>` : ''}
            </div>

            ${description ? `<div class="task-description">${description}</div>` : ''}

            <div class="task-actions">
                ${!status ? `<button class="btn btn-success" onclick="taskManager.completeTask('${task.id}', '${tabName}')">
                    <i class="fas fa-check"></i>
                    완료
                </button>` : ''}
                <button class="btn btn-secondary" onclick="taskManager.editTask('${task.id}', '${tabName}')">
                    <i class="fas fa-edit"></i>
                    수정
                </button>
                <button class="btn btn-danger" onclick="taskManager.deleteTask('${task.id}', '${tabName}')">
                    <i class="fas fa-trash"></i>
                    삭제
                </button>
            </div>
        `;

        return taskDiv;
    }

    createTaskTableRow(task, tabName) {
        const tr = document.createElement('tr');
        const properties = task.properties;

        // Extract properties safely with multiple property name variants
        const title = this.getPropertyValue(properties, '과제명') ||
                     this.getPropertyValue(properties, 'Name') ||
                     this.getPropertyValue(properties, '이름') ||
                     this.getPropertyValue(properties, 'Title') || '제목 없음';

        const assignee = this.getPropertyValue(properties, '담당자') ||
                        this.getPropertyValue(properties, 'Assignee') || '';

        const dueDate = this.getPropertyValue(properties, '마감일') ||
                       this.getPropertyValue(properties, '마감기한') ||
                       this.getPropertyValue(properties, 'Due Date') || '';

        // Get checkbox value directly
        const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
        const status = (statusProp && statusProp.checkbox === true) ? '완료' : '';

        // Get checkbox value directly for priority
        const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
        const priority = (priorityProp && priorityProp.checkbox === true) ? '긴급' : '';

        const submitTo = this.getPropertyValue(properties, '제출처') ||
                        this.getPropertyValue(properties, 'Submit To') || '';

        // Get created and modified dates
        const createdDate = task.created_time ? this.formatDate(task.created_time) :
                           (this.getPropertyValue(properties, '생성일') ||
                            this.getPropertyValue(properties, 'Created') || '');

        const modifiedDate = task.last_edited_time ? this.formatDate(task.last_edited_time) :
                            (this.getPropertyValue(properties, '수정일') ||
                             this.getPropertyValue(properties, 'Modified') ||
                             this.getPropertyValue(properties, 'Last Modified') || '');

        const description = this.getPropertyValue(properties, '비고') ||
                           this.getPropertyValue(properties, 'Description') ||
                           this.getPropertyValue(properties, '설명') || '';

        const statusClass = status.replace(/\s+/g, '');
        const priorityClass = priority.replace(/\s+/g, '');

        tr.innerHTML = `
            <td>
                <div class="table-cell-title">${title}</div>
            </td>
            <td>
                ${assignee ? `<div class="table-cell-assignee"><i class="fas fa-user"></i> ${assignee}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${dueDate ? `<div class="table-cell-date">${dueDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${status ? `<span class="table-cell-status ${statusClass}">${status}</span>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${priority ? `<span class="table-cell-priority ${priorityClass}">${priority}</span>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${submitTo ? `<div>${submitTo}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${createdDate ? `<div class="table-cell-date">${createdDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${modifiedDate ? `<div class="table-cell-date">${modifiedDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${description ? `<div class="table-cell-description">${description}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                <div class="table-actions">
                    ${!status ? `<button class="btn btn-success" onclick="taskManager.completeTask('${task.id}', '${tabName}')" title="완료">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    <button class="btn btn-secondary" onclick="taskManager.editTask('${task.id}', '${tabName}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="taskManager.deleteTask('${task.id}', '${tabName}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return tr;
    }

    getPropertyValue(properties, propertyName) {
        const property = properties[propertyName];
        if (!property) return '';

        switch (property.type) {
            case 'title':
                return property.title?.[0]?.plain_text || '';
            case 'rich_text':
                return property.rich_text?.[0]?.plain_text || '';
            case 'select':
                return property.select?.name || '';
            case 'multi_select':
                return property.multi_select?.map(item => item.name).join(', ') || '';
            case 'date':
                return property.date?.start ? new Date(property.date.start).toLocaleDateString('ko-KR') : '';
            case 'people':
                return property.people?.map(person => person.name).join(', ') || '';
            case 'checkbox':
                return property.checkbox ? '완료' : '';
            default:
                return '';
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    openTaskModal(tabName, taskData = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');

        if (taskData) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> 업무 수정';
            this.currentTaskId = taskData.id;
            this.currentTaskCategory = tabName;
            // Fill form with existing data
            document.getElementById('taskTitle').value = taskData.title || '';
            document.getElementById('taskCategory').value = tabName;
            document.getElementById('taskAssignee').value = taskData.assignee || '';

            // Handle date format for input field
            if (taskData.dueDate) {
                // Convert Korean date format to YYYY-MM-DD
                const dateStr = taskData.dueDate;
                if (dateStr.includes('.')) {
                    // Format: 2024. 12. 31.
                    const parts = dateStr.replace(/\./g, '').trim().split(' ').filter(p => p);
                    if (parts.length >= 3) {
                        const year = parts[0];
                        const month = parts[1].padStart(2, '0');
                        const day = parts[2].padStart(2, '0');
                        document.getElementById('taskDueDate').value = `${year}-${month}-${day}`;
                    }
                } else {
                    document.getElementById('taskDueDate').value = taskData.dueDate;
                }
            }

            document.getElementById('taskStatus').checked = (taskData.status === '완료');
            document.getElementById('taskPriority').checked = (taskData.priority === '긴급');
            document.getElementById('taskSubmitTo').value = taskData.submitTo || '';
            document.getElementById('taskDescription').value = taskData.description || '';
        } else {
            modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> 새 업무 추가';
            this.currentTaskId = null;
            this.currentTaskCategory = tabName;
            form.reset();
            // Set default category based on current tab
            document.getElementById('taskCategory').value = tabName;
        }

        modal.style.display = 'block';
        modal.classList.add('show');

        // Focus on title input
        setTimeout(() => {
            document.getElementById('taskTitle').focus();
        }, 100);
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            this.currentTaskId = null;
        }, 300);
    }

    async saveTask() {
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
        submitButton.disabled = true;

        const title = document.getElementById('taskTitle').value;
        const category = document.getElementById('taskCategory').value;
        const assignee = document.getElementById('taskAssignee').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const statusChecked = document.getElementById('taskStatus').checked;
        const priorityChecked = document.getElementById('taskPriority').checked;
        const submitTo = document.getElementById('taskSubmitTo').value;
        const description = document.getElementById('taskDescription').value;

        const properties = {
            '과제명': {
                'rich_text': [
                    {
                        'text': {
                            'content': title
                        }
                    }
                ]
            },
            '완료': {
                'checkbox': statusChecked
            },
            '긴급': {
                'checkbox': priorityChecked
            }
        };

        if (assignee) {
            properties['담당자'] = {
                'title': [
                    {
                        'text': {
                            'content': assignee
                        }
                    }
                ]
            };
        }

        if (dueDate) {
            properties['마감일'] = {
                'date': {
                    'start': dueDate
                }
            };
        }

        if (submitTo) {
            properties['제출처'] = {
                'rich_text': [
                    {
                        'text': {
                            'content': submitTo
                        }
                    }
                ]
            };
        }


        if (description) {
            properties['비고'] = {
                'rich_text': [
                    {
                        'text': {
                            'content': description
                        }
                    }
                ]
            };
        }

        try {
            if (this.currentTaskId) {
                // Update existing task
                await this.makeNotionRequest('PATCH', `/v1/pages/${this.currentTaskId}`, {
                    properties: properties
                });
            } else {
                // Create new task - use selected category instead of current tab
                const targetDatabase = category || this.currentTab;
                await this.makeNotionRequest('POST', '/v1/pages', {
                    parent: {
                        database_id: this.databases[targetDatabase]
                    },
                    properties: properties
                });
            }

            this.closeTaskModal();
            // Refresh both the current tab and dashboard data
            this.loadTasks(this.currentTab);
            this.loadAllTasksForDashboard();
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('업무 저장에 실패했습니다: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #6366f1, #4338ca)';
        }

        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}" style="margin-right: 0.5rem;"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    async editTask(taskId, tabName) {
        try {
            const response = await this.makeNotionRequest('GET', `/v1/pages/${taskId}`);
            const properties = response.properties;

            const taskData = {
                id: taskId,
                title: this.getPropertyValue(properties, '과제명') || this.getPropertyValue(properties, 'Name'),
                assignee: this.getPropertyValue(properties, '담당자') || this.getPropertyValue(properties, 'Assignee'),
                dueDate: this.getPropertyValue(properties, '마감일') || this.getPropertyValue(properties, '마감기한') || this.getPropertyValue(properties, 'Due Date'),
                status: (this.getPropertyValue(properties, '완료') === true) ? '완료' : '미완료',
                priority: (this.getPropertyValue(properties, '긴급') === true) ? '긴급' : '일반',
                submitTo: this.getPropertyValue(properties, '제출처') || this.getPropertyValue(properties, 'Submit To'),
                description: this.getPropertyValue(properties, '비고') || this.getPropertyValue(properties, 'Description')
            };

            this.openTaskModal(tabName, taskData);
        } catch (error) {
            console.error('Edit task error:', error);
            this.showNotification('업무 정보를 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    async completeTask(taskId, tabName) {
        try {
            // Update the task status to completed in Notion database
            await this.makeNotionRequest('PATCH', `/v1/pages/${taskId}`, {
                properties: {
                    '완료': {
                        checkbox: true
                    }
                }
            });

            this.showNotification('업무가 완료되었습니다.', 'success');
            this.loadTasks(tabName);
            this.loadAllTasksForDashboard();
        } catch (error) {
            console.error('Complete task error:', error);
            this.showNotification('업무 완료 처리에 실패했습니다: ' + error.message, 'error');
        }
    }

    async deleteTask(taskId, tabName) {
        // Create custom confirmation dialog
        const confirmed = await this.showConfirmDialog(
            '업무 삭제',
            '정말로 이 업무를 삭제하시겠습니까?',
            '삭제',
            '취소'
        );

        if (!confirmed) return;

        try {
            await this.makeNotionRequest('PATCH', `/v1/pages/${taskId}`, {
                archived: true
            });

            this.showNotification('업무가 삭제되었습니다.', 'success');
            this.loadTasks(tabName);
            this.loadAllTasksForDashboard();
        } catch (error) {
            console.error('Delete task error:', error);
            this.showNotification('업무 삭제에 실패했습니다: ' + error.message, 'error');
        }
    }

    showConfirmDialog(title, message, confirmText = '확인', cancelText = '취소') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'block';
            overlay.style.opacity = '1';

            const dialog = document.createElement('div');
            dialog.className = 'modal';
            dialog.style.maxWidth = '400px';
            dialog.innerHTML = `
                <div class="modal-header">
                    <h2><i class="fas fa-question-circle"></i> ${title}</h2>
                </div>
                <div style="padding: 2rem;">
                    <p style="margin-bottom: 2rem; color: var(--color-text-secondary);">${message}</p>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="btn btn-ghost cancel-btn">${cancelText}</button>
                        <button class="btn btn-danger confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const confirmBtn = dialog.querySelector('.confirm-btn');
            const cancelBtn = dialog.querySelector('.cancel-btn');

            const cleanup = () => {
                document.body.removeChild(overlay);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    async loadAllTasksForDashboard() {
        try {
            console.log('🔄 Loading all tasks for dashboard...');

            // Load tasks from all databases
            const [mainTasks, otherTasks, todoTasks] = await Promise.all([
                this.fetchTasks('main'),
                this.fetchTasks('other'),
                this.fetchTasks('todo')
            ]);

            console.log(`📊 Loaded ${mainTasks.length} main tasks, ${otherTasks.length} other tasks, and ${todoTasks.length} todo tasks`);

            // Add category to tasks
            const mainTasksWithCategory = mainTasks.map(task => ({ ...task, category: '주요' }));
            const otherTasksWithCategory = otherTasks.map(task => ({ ...task, category: '기타' }));
            const todoTasksWithCategory = todoTasks.map(task => ({ ...task, category: 'TODO' }));

            // Combine all tasks
            this.allTasks = [...mainTasksWithCategory, ...otherTasksWithCategory, ...todoTasksWithCategory];

            console.log(`✅ Combined ${this.allTasks.length} total tasks (${mainTasksWithCategory.length} main + ${otherTasksWithCategory.length} other + ${todoTasksWithCategory.length} todo)`);

            // Sort by creation date descending
            this.allTasks.sort((a, b) => {
                const dateA = new Date(a.created_time || 0);
                const dateB = new Date(b.created_time || 0);
                return dateB - dateA;
            });

            this.updateDashboardStats();
            this.displayDashboardTasks();
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    }

    async fetchTasks(tabName) {
        const databaseId = this.databases[tabName];
        console.log(`🔍 Fetching tasks for ${tabName} with database ID: ${databaseId}`);

        try {
            const response = await this.makeNotionRequest('POST', `/v1/databases/${databaseId}/query`, {});
            console.log(`✅ Successfully fetched ${response.results?.length || 0} tasks from ${tabName} database`);

            // Debug: Log full response structure
            console.log(`🔍 Full response for ${tabName}:`, response);

            if (response.results && response.results.length > 0) {
                // Log first task details for verification
                const firstTask = response.results[0];
                console.log(`📝 First task from ${tabName} - full object:`, firstTask);

                const firstTitle = firstTask.properties['과제명']?.title?.[0]?.text?.content ||
                                 firstTask.properties['Name']?.title?.[0]?.text?.content ||
                                 'No title';
                console.log(`📝 First task title from ${tabName}: "${firstTitle}"`);

                // Check properties structure
                console.log(`🔍 Available properties in ${tabName}:`, Object.keys(firstTask.properties || {}));

                // Check for assignee property
                const assigneeName = this.getTaskAssignee(firstTask);
                if (assigneeName) {
                    console.log(`👤 First task assignee from ${tabName}:`, assigneeName);
                } else {
                    console.log(`❌ No assignee found in first task from ${tabName}`);
                }
            } else {
                console.log(`❌ No tasks returned from ${tabName} database`);
            }

            return response.results || [];
        } catch (error) {
            console.error(`❌ Error fetching tasks from ${tabName}:`, error);
            return [];
        }
    }

    updateDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const stats = {
            all: this.allTasks.length,
            inProgress: 0,
            dueToday: 0,
            dueWeek: 0,
            overdue: 0,
            urgent: 0,
            completed: 0,
            assignee: 0
        };

        this.allTasks.forEach(task => {
            const properties = task.properties;

            // Get status and priority
            const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
            const isCompleted = statusProp && statusProp.checkbox === true;

            const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
            const isUrgent = priorityProp && priorityProp.checkbox === true;

            // Get due date
            const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
            let dueDate = null;
            if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                dueDate = new Date(dueDateProp.date.start);
                dueDate.setHours(0, 0, 0, 0);
            }

            // Count stats
            if (isCompleted) {
                stats.completed++;
            } else {
                stats.inProgress++;

                if (dueDate) {
                    if (dueDate.getTime() === today.getTime()) {
                        stats.dueToday++;
                    } else if (dueDate <= nextWeek) {
                        stats.dueWeek++;
                    }

                    if (dueDate < today) {
                        stats.overdue++;
                    }
                }
            }

            if (isUrgent) {
                stats.urgent++;
            }

        });

        // Count unique assignees properly
        const uniqueAssignees = new Set();
        this.allTasks.forEach(task => {
            const assigneeName = this.getTaskAssignee(task).trim();
            if (assigneeName) {
                uniqueAssignees.add(assigneeName);
            }
        });
        stats.assignee = uniqueAssignees.size;

        console.log(`Dashboard Stats - Total tasks: ${stats.all}, Unique assignees: ${stats.assignee}`);

        // Update UI
        document.getElementById('statAll').textContent = stats.all;
        document.getElementById('statInProgress').textContent = stats.inProgress;
        document.getElementById('statDueToday').textContent = stats.dueToday;
        document.getElementById('statDueWeek').textContent = stats.dueWeek;
        document.getElementById('statOverdue').textContent = stats.overdue;
        document.getElementById('statUrgent').textContent = stats.urgent;
        document.getElementById('statCompleted').textContent = stats.completed;
    }

    setDashboardFilter(filter) {
        this.currentDashboardFilter = filter;

        // Update active stat card
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('active');
        });
        const filterElement = document.querySelector(`[data-filter="${filter}"]`);
        if (filterElement) {
            filterElement.classList.add('active');
        }

        // Update title
        const titles = {
            'all': '전체과제',
            'in-progress': '진행중 과제',
            'due-today': '오늘 마감',
            'due-week': '7일내 마감',
            'overdue': '지연과제',
            'urgent': '긴급과제',
            'completed': '완료과제'
        };
        document.getElementById('dashboardTitle').textContent = titles[filter];

        this.displayDashboardTasks();
    }

    filterDashboardTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return this.allTasks.filter(task => {
            const properties = task.properties;

            const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
            const isCompleted = statusProp && statusProp.checkbox === true;

            const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
            const isUrgent = priorityProp && priorityProp.checkbox === true;

            const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
            let dueDate = null;
            if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                dueDate = new Date(dueDateProp.date.start);
                dueDate.setHours(0, 0, 0, 0);
            }

            switch (this.currentDashboardFilter) {
                case 'all':
                    return true;
                case 'in-progress':
                    return !isCompleted;
                case 'due-today':
                    return dueDate && dueDate.getTime() === today.getTime();
                case 'due-week':
                    return dueDate && dueDate <= nextWeek && dueDate >= today;
                case 'overdue':
                    return dueDate && dueDate < today && !isCompleted;
                case 'urgent':
                    return isUrgent;
                case 'completed':
                    return isCompleted;
                case 'assignee':
                    // Show tasks grouped by assignee - for now just show tasks with assignees
                    const assigneeName = this.getTaskAssignee(task).trim();
                    return assigneeName;
                default:
                    return true;
            }
        });
    }

    displayDashboardTasks() {
        const filteredTasks = this.filterDashboardTasks();
        const dashboardTasksContainer = document.getElementById('dashboardTasks');
        const dashboardTasksTableBody = document.getElementById('dashboardTasksTableBody');

        // Clear existing content
        dashboardTasksContainer.innerHTML = '';
        dashboardTasksTableBody.innerHTML = '';

        if (filteredTasks.length === 0) {
            dashboardTasksContainer.innerHTML = '<div class="empty-state">해당하는 과제가 없습니다.</div>';
            return;
        }

        // Display tasks
        filteredTasks.forEach(task => {
            // Card view
            const taskCard = this.createDashboardTaskElement(task);
            dashboardTasksContainer.appendChild(taskCard);

            // Table view
            const taskRow = this.createDashboardTaskTableRow(task);
            dashboardTasksTableBody.appendChild(taskRow);
        });

        this.updateDashboardViewDisplay();
    }

    createDashboardTaskElement(task) {
        const taskDiv = document.createElement('div');
        const properties = task.properties;

        // Extract task data (similar to existing createTaskElement)
        const title = this.getPropertyValue(properties, '과제명') ||
                     this.getPropertyValue(properties, 'Name') ||
                     this.getPropertyValue(properties, '이름') ||
                     this.getPropertyValue(properties, 'Title') || '제목 없음';

        const assignee = this.getPropertyValue(properties, '담당자') ||
                        this.getPropertyValue(properties, 'Assignee') || '';

        const dueDate = this.getPropertyValue(properties, '마감일') ||
                       this.getPropertyValue(properties, '마감기한') ||
                       this.getPropertyValue(properties, 'Due Date') || '';

        // Get checkbox value directly
        const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
        const status = (statusProp && statusProp.checkbox === true) ? '완료' : '';

        // Get checkbox value directly for priority
        const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
        const priority = (priorityProp && priorityProp.checkbox === true) ? '긴급' : '';

        const submitTo = this.getPropertyValue(properties, '제출처') ||
                        this.getPropertyValue(properties, 'Submit To') || '';

        const createdDate = task.created_time ? this.formatDate(task.created_time) :
                           (this.getPropertyValue(properties, '생성일') ||
                            this.getPropertyValue(properties, 'Created') || '');

        const modifiedDate = task.last_edited_time ? this.formatDate(task.last_edited_time) :
                            (this.getPropertyValue(properties, '수정일') ||
                             this.getPropertyValue(properties, 'Modified') ||
                             this.getPropertyValue(properties, 'Last Modified') || '');

        const description = this.getPropertyValue(properties, '비고') ||
                           this.getPropertyValue(properties, 'Description') ||
                           this.getPropertyValue(properties, '설명') || '';

        const statusClass = status.replace(/\s+/g, '');
        const priorityClass = priority.replace(/\s+/g, '');

        // Determine card priority class
        let cardPriorityClass = 'priority-일반';
        if (priority === '긴급') {
            cardPriorityClass = 'priority-긴급';
        }

        taskDiv.className = `task-card ${cardPriorityClass}`;
        taskDiv.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${title}</div>
                    <div class="task-meta">
                        <span class="task-category">${task.category}</span>
                        ${status ? `<span class="task-status ${statusClass}">${status}</span>` : ''}
                        ${priority ? `<span class="task-priority ${priorityClass}">${priority}</span>` : ''}
                        ${dueDate ? `<span class="task-due-date"><i class="fas fa-calendar"></i> ${dueDate}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="task-details">
                ${assignee ? `<div class="task-detail-item"><i class="fas fa-user"></i> <strong>담당자:</strong> ${assignee}</div>` : ''}
                ${submitTo ? `<div class="task-detail-item"><i class="fas fa-building"></i> <strong>제출처:</strong> ${submitTo}</div>` : ''}
                ${createdDate ? `<div class="task-detail-item"><i class="fas fa-plus-circle"></i> <strong>생성일:</strong> ${createdDate}</div>` : ''}
                ${modifiedDate ? `<div class="task-detail-item"><i class="fas fa-edit"></i> <strong>수정일:</strong> ${modifiedDate}</div>` : ''}
            </div>

            ${description ? `<div class="task-description">${description}</div>` : ''}

            <div class="task-actions">
                ${!status ? `<button class="btn btn-success" onclick="taskManager.completeTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')">
                    <i class="fas fa-check"></i>
                    완료
                </button>` : ''}
                <button class="btn btn-secondary" onclick="taskManager.editTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')">
                    <i class="fas fa-edit"></i>
                    수정
                </button>
                <button class="btn btn-danger" onclick="taskManager.deleteTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')">
                    <i class="fas fa-trash"></i>
                    삭제
                </button>
            </div>
        `;

        return taskDiv;
    }

    createDashboardTaskTableRow(task) {
        const tr = document.createElement('tr');
        const properties = task.properties;

        // Extract task data (similar to existing createTaskTableRow)
        const title = this.getPropertyValue(properties, '과제명') ||
                     this.getPropertyValue(properties, 'Name') ||
                     this.getPropertyValue(properties, '이름') ||
                     this.getPropertyValue(properties, 'Title') || '제목 없음';

        const assignee = this.getPropertyValue(properties, '담당자') ||
                        this.getPropertyValue(properties, 'Assignee') || '';

        const dueDate = this.getPropertyValue(properties, '마감일') ||
                       this.getPropertyValue(properties, '마감기한') ||
                       this.getPropertyValue(properties, 'Due Date') || '';

        // Get checkbox value directly
        const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
        const status = (statusProp && statusProp.checkbox === true) ? '완료' : '';

        // Get checkbox value directly for priority
        const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
        const priority = (priorityProp && priorityProp.checkbox === true) ? '긴급' : '';

        const submitTo = this.getPropertyValue(properties, '제출처') ||
                        this.getPropertyValue(properties, 'Submit To') || '';

        const createdDate = task.created_time ? this.formatDate(task.created_time) :
                           (this.getPropertyValue(properties, '생성일') ||
                            this.getPropertyValue(properties, 'Created') || '');

        const modifiedDate = task.last_edited_time ? this.formatDate(task.last_edited_time) :
                            (this.getPropertyValue(properties, '수정일') ||
                             this.getPropertyValue(properties, 'Modified') ||
                             this.getPropertyValue(properties, 'Last Modified') || '');

        const description = this.getPropertyValue(properties, '비고') ||
                           this.getPropertyValue(properties, 'Description') ||
                           this.getPropertyValue(properties, '설명') || '';

        const statusClass = status.replace(/\s+/g, '');
        const priorityClass = priority.replace(/\s+/g, '');

        tr.innerHTML = `
            <td>
                <span class="task-category-badge ${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}">${task.category}</span>
            </td>
            <td>
                <div class="table-cell-title">${title}</div>
            </td>
            <td>
                ${assignee ? `<div class="table-cell-assignee"><i class="fas fa-user"></i> ${assignee}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${dueDate ? `<div class="table-cell-date">${dueDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${status ? `<span class="table-cell-status ${statusClass}">${status}</span>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${priority ? `<span class="table-cell-priority ${priorityClass}">${priority}</span>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${submitTo ? `<div>${submitTo}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${createdDate ? `<div class="table-cell-date">${createdDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${modifiedDate ? `<div class="table-cell-date">${modifiedDate}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                ${description ? `<div class="table-cell-description">${description}</div>` : '<span class="table-empty-cell">-</span>'}
            </td>
            <td>
                <div class="table-actions">
                    ${!status ? `<button class="btn btn-success" onclick="taskManager.completeTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')" title="완료">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    <button class="btn btn-secondary" onclick="taskManager.editTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="taskManager.deleteTask('${task.id}', '${task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo'}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return tr;
    }

    switchDashboardView(view) {
        // Update active view button
        document.querySelectorAll('#dashboard .view-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (view === 'card') {
            document.getElementById('dashboardCardViewBtn').classList.add('active');
        } else {
            document.getElementById('dashboardTableViewBtn').classList.add('active');
        }

        this.currentView = view;
        this.updateDashboardViewDisplay();
    }

    updateDashboardViewDisplay() {
        const dashboardTasksContainer = document.getElementById('dashboardTasks');
        const dashboardTasksTableContainer = document.getElementById('dashboardTasksTable');

        if (this.currentView === 'card') {
            dashboardTasksContainer.style.display = 'grid';
            dashboardTasksTableContainer.style.display = 'none';
        } else {
            dashboardTasksContainer.style.display = 'none';
            dashboardTasksTableContainer.style.display = 'block';
        }
    }

    showDashboardContent() {
        // Hide tab content
        document.querySelector('.tab-content').style.display = 'none';
        // Show dashboard content
        document.getElementById('dashboardContent').style.display = 'block';
    }

    hideDashboardContent() {
        // Show tab content
        document.querySelector('.tab-content').style.display = 'block';
        // Hide dashboard content
        document.getElementById('dashboardContent').style.display = 'none';
    }

    async makeNotionRequest(method, endpoint, body = null) {
        // Convert Notion API endpoints to local proxy endpoints
        let url;
        if (endpoint.startsWith('/v1/databases/')) {
            const databaseId = endpoint.split('/')[3];
            if (endpoint.endsWith('/query')) {
                url = `/api/notion/databases/${databaseId}/query`;
            }
        } else if (endpoint.startsWith('/v1/pages/')) {
            const pageId = endpoint.split('/')[3];
            if (pageId) {
                url = `/api/notion/pages/${pageId}`;
            } else {
                url = '/api/notion/pages';
            }
        } else if (endpoint === '/v1/pages') {
            url = '/api/notion/pages';
        }

        if (!url) {
            throw new Error(`Unsupported endpoint: ${endpoint}`);
        }

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        console.log('Making request to:', url);
        console.log('Method:', method);
        console.log('Body:', body);

        try {
            const response = await fetch(url, options);
            console.log(`📡 ${method} ${url} - Status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error response:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Special logging for database queries
            if (url.includes('/databases/') && url.includes('/query')) {
                const dbId = url.match(/databases\/([^\/]+)\/query/)?.[1];
                const resultCount = result.results?.length || 0;
                console.log(`📊 Database ${dbId} returned ${resultCount} results`);

                if (resultCount > 0) {
                    const firstTask = result.results[0];
                    const title = firstTask.properties['과제명']?.title?.[0]?.text?.content ||
                                firstTask.properties['Name']?.title?.[0]?.text?.content ||
                                'No title';
                    console.log(`📝 Sample task: "${title}"`);
                }
            }

            return result;
        } catch (error) {
            console.error('❌ Fetch error:', error);
            throw error;
        }
    }

    // Assignee Overview Methods
    showAssigneeOverview() {
        // Hide main content and show assignee overview
        document.getElementById('dashboardContent').style.display = 'none';
        document.querySelector('.tab-content').style.display = 'none';
        document.getElementById('assigneeOverviewContent').style.display = 'block';

        // Always show stats table first and load data
        this.loadAssigneeStats();
    }

    hideAssigneeOverview() {
        // Show main content and hide assignee overview
        document.getElementById('assigneeOverviewContent').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'none';
        document.querySelector('.tab-content').style.display = 'block';

        // Reset stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('active');
        });
    }

    loadAssigneeStats() {
        // Show stats table, hide other sections
        document.getElementById('assigneeStatsTable').style.display = 'block';
        document.getElementById('assigneeList').style.display = 'none';
        document.getElementById('assigneeDetail').style.display = 'none';

        // Ensure all tasks are loaded before generating stats
        if (!this.allTasks || this.allTasks.length === 0) {
            console.log('Loading all tasks for assignee stats...');
            this.loadAllTasksForDashboard().then(() => {
                this.generateAssigneeStatsTable();
            });
        } else {
            console.log(`Using existing allTasks with ${this.allTasks.length} tasks`);
            this.generateAssigneeStatsTable();
        }
    }

    loadAssigneeStatsPage() {
        // Always reload tasks to ensure fresh data
        console.log('Loading all tasks for assignee stats page...');
        this.loadAllTasksForDashboard().then(() => {
            console.log(`📈 Stats page: Loaded ${this.allTasks.length} total tasks`);

            // Verify category distribution
            const categoryCount = { main: 0, other: 0, undefined: 0 };
            this.allTasks.forEach(task => {
                if (task.category === '주요') categoryCount.main++;
                else if (task.category === '기타') categoryCount.other++;
                else categoryCount.undefined++;
            });
            console.log('📊 Category distribution for stats:', categoryCount);

            this.generateAssigneeStatsPageTable();
        }).catch(error => {
            console.error('Error loading tasks for stats page:', error);
        });
    }

    getTaskTitle(task) {
        const properties = task.properties;

        // Both databases now use rich_text for task name
        const taskNameProp = properties['과제명'] || properties['Name'] || properties['이름'] || properties['Title'];
        if (taskNameProp) {
            if (taskNameProp.rich_text && taskNameProp.rich_text.length > 0) {
                return taskNameProp.rich_text[0].plain_text || taskNameProp.rich_text[0].text?.content || '';
            }
        }

        return 'No title';
    }

    getTaskAssignee(task) {
        const properties = task.properties;
        const assigneeProp = properties['담당자'] || properties['Assignee'];

        if (assigneeProp) {
            // Both databases now use title type for assignee
            if (assigneeProp.title && assigneeProp.title.length > 0) {
                return assigneeProp.title[0].plain_text || assigneeProp.title[0].text?.content || '';
            }
        }

        return '';
    }

    generateAssigneeStatsPageTable() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        console.log(`generateAssigneeStatsPageTable: Processing ${this.allTasks.length} total tasks`);

        // Get all unique assignees and their task statistics
        const assigneeStats = {};

        this.allTasks.forEach((task) => {
            const assigneeName = this.getTaskAssignee(task).trim();

            if (assigneeName) {
                if (!assigneeStats[assigneeName]) {
                    assigneeStats[assigneeName] = {
                        all: 0,
                        inProgress: 0,
                        dueToday: 0,
                        dueWeek: 0,
                        overdue: 0,
                        urgent: 0,
                        completed: 0,
                        mainTasks: 0,
                        otherTasks: 0
                    };
                }

                const stats = assigneeStats[assigneeName];
                stats.all++;

                // Track category
                if (task.category === '주요') {
                    stats.mainTasks++;
                    if (stats.mainTasks <= 3) {
                        console.log(`✅ Main task for ${assigneeName}: "${this.getTaskTitle(task)}"`);
                    }
                } else if (task.category === '기타') {
                    stats.otherTasks++;
                    if (stats.otherTasks <= 3) {
                        console.log(`✅ Other task for ${assigneeName}: "${this.getTaskTitle(task)}"`);
                    }
                } else {
                    stats.otherTasks++;
                    console.log(`⚠️ Task without category for ${assigneeName}: "${this.getTaskTitle(task)}", category: '${task.category}'`);
                }

                // Calculate individual stats
                const properties = task.properties;
                const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
                const isCompleted = statusProp && statusProp.checkbox === true;

                const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
                const isUrgent = priorityProp && priorityProp.checkbox === true;

                const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
                let dueDate = null;
                if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                    dueDate = new Date(dueDateProp.date.start);
                    dueDate.setHours(0, 0, 0, 0);
                }

                if (isCompleted) {
                    stats.completed++;
                } else {
                    stats.inProgress++;
                }

                if (isUrgent) {
                    stats.urgent++;
                }

                if (dueDate) {
                    if (dueDate.getTime() === today.getTime()) {
                        stats.dueToday++;
                    } else if (dueDate <= nextWeek && dueDate >= today) {
                        stats.dueWeek++;
                    } else if (dueDate < today && !isCompleted) {
                        stats.overdue++;
                    }
                }
            }
        });

        // Log final stats for verification
        console.log('📊 Final Assignee Stats for Page:', assigneeStats);
        Object.entries(assigneeStats).forEach(([name, stats]) => {
            console.log(`👤 ${name}: 전체 ${stats.all}개 (주요 ${stats.mainTasks}개 + 기타 ${stats.otherTasks}개)`);
        });

        // Generate table rows
        const tableBody = document.getElementById('assigneeStatsPageTableBody');
        tableBody.innerHTML = '';

        if (Object.keys(assigneeStats).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="8" class="empty-state">담당자가 할당된 업무가 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }

        // Sort assignees by total task count
        const sortedAssignees = Object.entries(assigneeStats)
            .sort(([, a], [, b]) => b.all - a.all);

        sortedAssignees.forEach(([assigneeName, stats]) => {
            const row = document.createElement('tr');
            row.className = 'assignee-stats-row';

            // Show breakdown in the assignee name cell
            const breakdown = `(주요:${stats.mainTasks} + 기타:${stats.otherTasks})`;

            row.innerHTML = `
                <td class="assignee-name" title="${breakdown}">
                    ${assigneeName}
                    <br><small style="color: #666; font-size: 0.8em;">${breakdown}</small>
                </td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="all">${stats.all}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="in-progress">${stats.inProgress}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="due-today">${stats.dueToday}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="due-week">${stats.dueWeek}</td>
                <td class="stat-cell clickable overdue" data-assignee="${assigneeName}" data-stat="overdue">${stats.overdue}</td>
                <td class="stat-cell clickable urgent" data-assignee="${assigneeName}" data-stat="urgent">${stats.urgent}</td>
                <td class="stat-cell clickable completed" data-assignee="${assigneeName}" data-stat="completed">${stats.completed}</td>
            `;

            // Add click events to individual cells
            row.querySelectorAll('.stat-cell').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const assignee = cell.getAttribute('data-assignee');
                    const stat = cell.getAttribute('data-stat');
                    this.showAssigneeTasksDetail(assignee, stat);
                });
            });

            tableBody.appendChild(row);
        });
    }

    showAssigneeTasksDetail(assigneeName, statType) {
        // Filter tasks based on assignee and stat type
        const filteredTasks = this.allTasks.filter(task => {
            const properties = task.properties;
            const taskAssignee = this.getTaskAssignee(task).trim();

            if (taskAssignee !== assigneeName) {
                return false;
            }

            // Apply stat filter
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
            const isCompleted = statusProp && statusProp.checkbox === true;

            const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
            const isUrgent = priorityProp && priorityProp.checkbox === true;

            const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
            let dueDate = null;
            if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                dueDate = new Date(dueDateProp.date.start);
                dueDate.setHours(0, 0, 0, 0);
            }

            switch (statType) {
                case 'all':
                    return true;
                case 'in-progress':
                    return !isCompleted;
                case 'due-today':
                    return dueDate && dueDate.getTime() === today.getTime();
                case 'due-week':
                    return dueDate && dueDate <= nextWeek && dueDate >= today;
                case 'overdue':
                    return dueDate && dueDate < today && !isCompleted;
                case 'urgent':
                    return isUrgent;
                case 'completed':
                    return isCompleted;
                default:
                    return true;
            }
        });

        // Show detail modal
        const detailModal = document.getElementById('assigneeTaskDetail');
        const title = document.getElementById('taskDetailTitle');
        const grid = document.getElementById('taskDetailGrid');

        const statLabels = {
            'all': '전체과제',
            'in-progress': '진행중 과제',
            'due-today': '오늘 마감',
            'due-week': '7일내 마감',
            'overdue': '지연과제',
            'urgent': '긴급과제',
            'completed': '완료과제'
        };

        title.textContent = `${assigneeName} - ${statLabels[statType]} (${filteredTasks.length}개)`;

        // Clear and populate grid
        grid.innerHTML = '';

        if (filteredTasks.length === 0) {
            grid.innerHTML = '<div class="empty-state">해당하는 업무가 없습니다.</div>';
        } else {
            filteredTasks.forEach(task => {
                const taskCard = this.createTaskElement(task, task.category === '주요' ? 'main' : task.category === '기타' ? 'other' : 'todo');
                grid.appendChild(taskCard);
            });
        }

        detailModal.style.display = 'block';

        // Add close event if not already added
        const closeBtn = document.getElementById('closeTaskDetailBtn');
        closeBtn.onclick = () => {
            detailModal.style.display = 'none';
        };
    }

    generateAssigneeStatsTable() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        console.log(`generateAssigneeStatsTable: Processing ${this.allTasks.length} total tasks`);

        // Debug: Check task categories breakdown
        const categoryBreakdown = { '주요': 0, '기타': 0, undefined: 0 };
        this.allTasks.forEach(task => {
            if (task.category === '주요') categoryBreakdown['주요']++;
            else if (task.category === '기타') categoryBreakdown['기타']++;
            else categoryBreakdown.undefined++;
        });
        console.log('Task category breakdown:', categoryBreakdown);

        // Get all unique assignees and their task statistics
        const assigneeStats = {};

        this.allTasks.forEach((task, index) => {
            const properties = task.properties;
            const assigneeName = this.getTaskAssignee(task).trim();

            if (assigneeName) {
                if (!assigneeStats[assigneeName]) {
                    assigneeStats[assigneeName] = {
                        all: 0,
                        inProgress: 0,
                        dueToday: 0,
                        dueWeek: 0,
                        overdue: 0,
                        urgent: 0,
                        completed: 0,
                        mainTasks: 0,
                        otherTasks: 0
                    };
                    console.log(`👤 Initialized stats for ${assigneeName}`);
                }

                const stats = assigneeStats[assigneeName];
                stats.all++;

                // Get task title for debugging
                const taskTitle = this.getTaskTitle(task);

                // Debug: Track which category this task belongs to
                if (task.category === '주요') {
                    stats.mainTasks++;
                    console.log(`✅ Main task for ${assigneeName}: "${taskTitle}"`);
                } else if (task.category === '기타') {
                    stats.otherTasks++;
                    console.log(`✅ Other task for ${assigneeName}: "${taskTitle}"`);
                } else {
                    stats.otherTasks++; // 카테고리가 없는 경우 기타로 분류
                    console.log(`⚠️ Task without category for ${assigneeName}: "${taskTitle}", category: '${task.category}' - counted as other`);
                }

                // Calculate individual stats
                const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
                const isCompleted = statusProp && statusProp.checkbox === true;

                const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
                const isUrgent = priorityProp && priorityProp.checkbox === true;

                const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
                let dueDate = null;
                if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                    dueDate = new Date(dueDateProp.date.start);
                    dueDate.setHours(0, 0, 0, 0);
                }

                if (isCompleted) {
                    stats.completed++;
                } else {
                    stats.inProgress++;
                }

                if (isUrgent) {
                    stats.urgent++;
                }

                if (dueDate) {
                    if (dueDate.getTime() === today.getTime()) {
                        stats.dueToday++;
                    } else if (dueDate <= nextWeek && dueDate >= today) {
                        stats.dueWeek++;
                    } else if (dueDate < today && !isCompleted) {
                        stats.overdue++;
                    }
                }
            }
        });

        // Store for later use
        this.assigneeStatsData = assigneeStats;

        // Generate table rows
        const tableBody = document.getElementById('assigneeStatsTableBody');
        tableBody.innerHTML = '';

        if (Object.keys(assigneeStats).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="8" class="empty-state">담당자가 할당된 업무가 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }

        // Sort assignees by total task count
        const sortedAssignees = Object.entries(assigneeStats)
            .sort(([, a], [, b]) => b.all - a.all);

        // Debug log
        console.log('Final Assignee Stats:', assigneeStats);

        // Log summary for verification
        Object.entries(assigneeStats).forEach(([name, stats]) => {
            console.log(`${name}: 전체 ${stats.all}개 (주요 ${stats.mainTasks}개 + 기타 ${stats.otherTasks}개)`);

            // Verify calculations
            const totalCheck = stats.mainTasks + stats.otherTasks;
            if (totalCheck !== stats.all) {
                console.error(`❌ ${name}: 계산 오류! 주요(${stats.mainTasks}) + 기타(${stats.otherTasks}) = ${totalCheck} ≠ 전체(${stats.all})`);
            }

            const statusCheck = stats.inProgress + stats.completed;
            if (statusCheck !== stats.all) {
                console.error(`❌ ${name}: 상태 계산 오류! 진행중(${stats.inProgress}) + 완료(${stats.completed}) = ${statusCheck} ≠ 전체(${stats.all})`);
            }
        });

        sortedAssignees.forEach(([assigneeName, stats]) => {
            const row = document.createElement('tr');
            row.className = 'assignee-stats-row';

            // Show breakdown in the assignee name cell
            const breakdown = `(주요:${stats.mainTasks} + 기타:${stats.otherTasks} = ${stats.all})`;

            row.innerHTML = `
                <td class="assignee-name" title="${breakdown}">${assigneeName}<br><small style="color: #666; font-size: 0.8em;">${breakdown}</small></td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="all">${stats.all}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="in-progress">${stats.inProgress}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="due-today">${stats.dueToday}</td>
                <td class="stat-cell clickable" data-assignee="${assigneeName}" data-stat="due-week">${stats.dueWeek}</td>
                <td class="stat-cell clickable overdue" data-assignee="${assigneeName}" data-stat="overdue">${stats.overdue}</td>
                <td class="stat-cell clickable urgent" data-assignee="${assigneeName}" data-stat="urgent">${stats.urgent}</td>
                <td class="stat-cell clickable completed" data-assignee="${assigneeName}" data-stat="completed">${stats.completed}</td>
            `;

            // Add click events to individual cells
            row.querySelectorAll('.stat-cell').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const assignee = cell.getAttribute('data-assignee');
                    const stat = cell.getAttribute('data-stat');
                    this.showAssigneeTasksForStat(assignee, stat);
                });
            });

            tableBody.appendChild(row);
        });
    }

    showAssigneeTasksForStat(assigneeName, statType) {
        // Show assignee detail page with specific filter
        this.showAssigneeDetail(assigneeName);

        // Set the appropriate filter
        const filterMap = {
            'all': 'all',
            'in-progress': 'in-progress',
            'due-today': 'due-today',
            'due-week': 'due-week',
            'overdue': 'overdue',
            'urgent': 'urgent',
            'completed': 'completed'
        };

        this.setAssigneeFilter(filterMap[statType]);
    }

    calculateAssigneeOverviewStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        // Get all unique assignees and their tasks
        const assigneeStats = {};

        this.allTasks.forEach(task => {
            const properties = task.properties;
            const assigneeName = this.getTaskAssignee(task).trim();

            if (assigneeName) {
                    if (!assigneeStats[assigneeName]) {
                        assigneeStats[assigneeName] = {
                            all: 0,
                            inProgress: 0,
                            dueToday: 0,
                            dueWeek: 0,
                            overdue: 0,
                            urgent: 0,
                            completed: 0
                        };
                    }

                    const stats = assigneeStats[assigneeName];
                    stats.all++;

                    // Calculate individual stats
                    const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
                    const isCompleted = statusProp && statusProp.checkbox === true;

                    const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
                    const isUrgent = priorityProp && priorityProp.checkbox === true;

                    const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
                    let dueDate = null;
                    if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                        dueDate = new Date(dueDateProp.date.start);
                        dueDate.setHours(0, 0, 0, 0);
                    }

                    if (isCompleted) {
                        stats.completed++;
                    } else {
                        stats.inProgress++;
                    }

                    if (isUrgent) {
                        stats.urgent++;
                    }

                    if (dueDate) {
                        if (dueDate.getTime() === today.getTime()) {
                            stats.dueToday++;
                        } else if (dueDate <= nextWeek && dueDate >= today) {
                            stats.dueWeek++;
                        } else if (dueDate < today && !isCompleted) {
                            stats.overdue++;
                        }
                    }
                }
        });

        // Store for later use
        this.assigneeStatsData = assigneeStats;

        // Calculate totals across all assignees
        const totals = {
            all: 0,
            inProgress: 0,
            dueToday: 0,
            dueWeek: 0,
            overdue: 0,
            urgent: 0,
            completed: 0
        };

        Object.values(assigneeStats).forEach(stats => {
            totals.all += stats.all;
            totals.inProgress += stats.inProgress;
            totals.dueToday += stats.dueToday;
            totals.dueWeek += stats.dueWeek;
            totals.overdue += stats.overdue;
            totals.urgent += stats.urgent;
            totals.completed += stats.completed;
        });

        // Update UI
        document.getElementById('assigneeOverviewStatAll').textContent = totals.all;
        document.getElementById('assigneeOverviewStatInProgress').textContent = totals.inProgress;
        document.getElementById('assigneeOverviewStatDueToday').textContent = totals.dueToday;
        document.getElementById('assigneeOverviewStatDueWeek').textContent = totals.dueWeek;
        document.getElementById('assigneeOverviewStatOverdue').textContent = totals.overdue;
        document.getElementById('assigneeOverviewStatUrgent').textContent = totals.urgent;
        document.getElementById('assigneeOverviewStatCompleted').textContent = totals.completed;
    }

    showAssigneeBreakdown(statType) {
        // Hide stats grid, show breakdown
        document.getElementById('assigneeStatsGrid').style.display = 'none';
        document.getElementById('assigneeBreakdown').style.display = 'block';

        const titles = {
            'all': '전체과제',
            'in-progress': '진행중 과제',
            'due-today': '오늘 마감',
            'due-week': '7일내 마감',
            'overdue': '지연과제',
            'urgent': '긴급과제',
            'completed': '완료과제'
        };

        document.getElementById('selectedStatTitle').textContent = titles[statType];

        const breakdownList = document.getElementById('assigneeBreakdownList');
        breakdownList.innerHTML = '';

        if (!this.assigneeStatsData) return;

        // Convert to array and sort by the selected stat
        const sortedAssignees = Object.entries(this.assigneeStatsData)
            .map(([name, stats]) => ({ name, ...stats }))
            .filter(assignee => {
                const key = statType === 'in-progress' ? 'inProgress' :
                           statType === 'due-today' ? 'dueToday' :
                           statType === 'due-week' ? 'dueWeek' : statType;
                return assignee[key] > 0;
            })
            .sort((a, b) => {
                const key = statType === 'in-progress' ? 'inProgress' :
                           statType === 'due-today' ? 'dueToday' :
                           statType === 'due-week' ? 'dueWeek' : statType;
                return b[key] - a[key];
            });

        if (sortedAssignees.length === 0) {
            breakdownList.innerHTML = '<div class="empty-state">해당하는 담당자가 없습니다.</div>';
            return;
        }

        sortedAssignees.forEach(assignee => {
            const key = statType === 'in-progress' ? 'inProgress' :
                       statType === 'due-today' ? 'dueToday' :
                       statType === 'due-week' ? 'dueWeek' : statType;

            const assigneeCard = document.createElement('div');
            assigneeCard.className = 'assignee-breakdown-card';
            assigneeCard.innerHTML = `
                <div class="assignee-breakdown-info">
                    <h5>${assignee.name}</h5>
                    <div class="assignee-breakdown-count">${assignee[key]}개</div>
                </div>
                <div class="assignee-breakdown-details">
                    <div class="detail-item">전체: ${assignee.all}</div>
                    <div class="detail-item">진행중: ${assignee.inProgress}</div>
                    <div class="detail-item">완료: ${assignee.completed}</div>
                </div>
            `;

            assigneeCard.addEventListener('click', () => {
                this.showAssigneeDetailFromBreakdown(assignee.name, statType);
            });

            breakdownList.appendChild(assigneeCard);
        });
    }

    showAssigneeDetailFromBreakdown(assigneeName, statType) {
        // Store the context for back navigation
        this.currentBreakdownStat = statType;

        // Show assignee detail
        this.showAssigneeDetail(assigneeName);

        // Set the appropriate filter
        const filterMap = {
            'all': 'all',
            'in-progress': 'in-progress',
            'due-today': 'due-today',
            'due-week': 'due-week',
            'overdue': 'overdue',
            'urgent': 'urgent',
            'completed': 'completed'
        };

        this.setAssigneeFilter(filterMap[statType]);
    }

    loadAssigneeList() {
        const assigneeList = document.getElementById('assigneeList');
        const assigneeDetail = document.getElementById('assigneeDetail');

        // Show list, hide detail
        assigneeList.style.display = 'block';
        assigneeDetail.style.display = 'none';

        // Get unique assignees with their task counts
        const assigneeStats = {};

        this.allTasks.forEach(task => {
            const properties = task.properties;
            const assigneeName = this.getTaskAssignee(task).trim();

            if (assigneeName) {
                if (!assigneeStats[assigneeName]) {
                    assigneeStats[assigneeName] = {
                        name: assigneeName,
                            all: 0,
                            inProgress: 0,
                            dueToday: 0,
                            dueWeek: 0,
                            overdue: 0,
                            urgent: 0,
                            completed: 0
                        };
                    }

                    const stats = assigneeStats[assigneeName];
                    stats.all++;

                    // Calculate individual stats
                    const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
                    const isCompleted = statusProp && statusProp.checkbox === true;

                    const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
                    const isUrgent = priorityProp && priorityProp.checkbox === true;

                    const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
                    let dueDate = null;
                    if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                        dueDate = new Date(dueDateProp.date.start);
                        dueDate.setHours(0, 0, 0, 0);
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);

                    if (isCompleted) {
                        stats.completed++;
                    } else {
                        stats.inProgress++;
                    }

                    if (isUrgent) {
                        stats.urgent++;
                    }

                    if (dueDate) {
                        if (dueDate.getTime() === today.getTime()) {
                            stats.dueToday++;
                        } else if (dueDate <= nextWeek && dueDate >= today) {
                            stats.dueWeek++;
                        } else if (dueDate < today && !isCompleted) {
                            stats.overdue++;
                        }
                    }
                }
        });

        // Clear and populate assignee list
        assigneeList.innerHTML = '';

        if (Object.keys(assigneeStats).length === 0) {
            assigneeList.innerHTML = '<div class="empty-state">담당자가 할당된 업무가 없습니다.</div>';
            return;
        }

        // Sort assignees by total task count
        const sortedAssignees = Object.values(assigneeStats).sort((a, b) => b.all - a.all);

        sortedAssignees.forEach(assignee => {
            const assigneeCard = document.createElement('div');
            assigneeCard.className = 'assignee-card';
            assigneeCard.innerHTML = `
                <div class="assignee-card-header">
                    <h4>${assignee.name}</h4>
                    <div class="assignee-card-total">총 ${assignee.all}개</div>
                </div>
                <div class="assignee-card-stats">
                    <div class="stat-item">
                        <span class="stat-label">진행중</span>
                        <span class="stat-value">${assignee.inProgress}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">완료</span>
                        <span class="stat-value">${assignee.completed}</span>
                    </div>
                    <div class="stat-item urgent">
                        <span class="stat-label">긴급</span>
                        <span class="stat-value">${assignee.urgent}</span>
                    </div>
                    <div class="stat-item overdue">
                        <span class="stat-label">지연</span>
                        <span class="stat-value">${assignee.overdue}</span>
                    </div>
                </div>
            `;

            assigneeCard.addEventListener('click', () => {
                this.showAssigneeDetail(assignee.name);
            });

            assigneeList.appendChild(assigneeCard);
        });
    }

    showAssigneeDetail(assigneeName) {
        const assigneeList = document.getElementById('assigneeList');
        const assigneeDetail = document.getElementById('assigneeDetail');

        // Hide list, show detail
        assigneeList.style.display = 'none';
        assigneeDetail.style.display = 'block';

        // Set assignee name
        document.getElementById('selectedAssigneeName').textContent = assigneeName;

        // Store current assignee
        this.currentAssignee = assigneeName;
        this.currentAssigneeFilter = 'all';

        // Load assignee stats and tasks
        this.updateAssigneeStats();
        this.displayAssigneeTasks();
    }

    updateAssigneeStats() {
        if (!this.currentAssignee) return;

        const assigneeTasks = this.getAssigneeTasks(this.currentAssignee);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const stats = {
            all: assigneeTasks.length,
            inProgress: 0,
            dueToday: 0,
            dueWeek: 0,
            overdue: 0,
            urgent: 0,
            completed: 0
        };

        assigneeTasks.forEach(task => {
            const properties = task.properties;

            const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
            const isCompleted = statusProp && statusProp.checkbox === true;

            const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
            const isUrgent = priorityProp && priorityProp.checkbox === true;

            const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
            let dueDate = null;
            if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                dueDate = new Date(dueDateProp.date.start);
                dueDate.setHours(0, 0, 0, 0);
            }

            if (isCompleted) {
                stats.completed++;
            } else {
                stats.inProgress++;
            }

            if (isUrgent) {
                stats.urgent++;
            }

            if (dueDate) {
                if (dueDate.getTime() === today.getTime()) {
                    stats.dueToday++;
                } else if (dueDate <= nextWeek && dueDate >= today) {
                    stats.dueWeek++;
                } else if (dueDate < today && !isCompleted) {
                    stats.overdue++;
                }
            }
        });

        // Update UI
        document.getElementById('assigneeStatAll').textContent = stats.all;
        document.getElementById('assigneeStatInProgress').textContent = stats.inProgress;
        document.getElementById('assigneeStatDueToday').textContent = stats.dueToday;
        document.getElementById('assigneeStatDueWeek').textContent = stats.dueWeek;
        document.getElementById('assigneeStatOverdue').textContent = stats.overdue;
        document.getElementById('assigneeStatUrgent').textContent = stats.urgent;
        document.getElementById('assigneeStatCompleted').textContent = stats.completed;
    }

    getAssigneeTasks(assigneeName) {
        return this.allTasks.filter(task => {
            const taskAssigneeName = this.getTaskAssignee(task).trim();
            return taskAssigneeName === assigneeName;
        });
    }

    setAssigneeFilter(filter) {
        this.currentAssigneeFilter = filter;

        // Update active stat card
        document.querySelectorAll('[data-assignee-filter]').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-assignee-filter="${filter}"]`).classList.add('active');

        // Update title
        const titles = {
            'all': '전체과제',
            'in-progress': '진행중 과제',
            'due-today': '오늘 마감',
            'due-week': '7일내 마감',
            'overdue': '지연과제',
            'urgent': '긴급과제',
            'completed': '완료과제'
        };
        document.getElementById('assigneeTasksTitle').textContent = titles[filter];

        this.displayAssigneeTasks();
    }

    filterAssigneeTasks() {
        if (!this.currentAssignee) return [];

        const assigneeTasks = this.getAssigneeTasks(this.currentAssignee);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return assigneeTasks.filter(task => {
            const properties = task.properties;

            const statusProp = properties['완료'] || properties['완료여부'] || properties['Status'] || properties['상태'];
            const isCompleted = statusProp && statusProp.checkbox === true;

            const priorityProp = properties['긴급'] || properties['긴급여부'] || properties['Priority'] || properties['우선순위'];
            const isUrgent = priorityProp && priorityProp.checkbox === true;

            const dueDateProp = properties['마감일'] || properties['마감기한'] || properties['Due Date'];
            let dueDate = null;
            if (dueDateProp && dueDateProp.date && dueDateProp.date.start) {
                dueDate = new Date(dueDateProp.date.start);
                dueDate.setHours(0, 0, 0, 0);
            }

            switch (this.currentAssigneeFilter) {
                case 'all':
                    return true;
                case 'in-progress':
                    return !isCompleted;
                case 'due-today':
                    return dueDate && dueDate.getTime() === today.getTime();
                case 'due-week':
                    return dueDate && dueDate <= nextWeek && dueDate >= today;
                case 'overdue':
                    return dueDate && dueDate < today && !isCompleted;
                case 'urgent':
                    return isUrgent;
                case 'completed':
                    return isCompleted;
                default:
                    return true;
            }
        });
    }

    displayAssigneeTasks() {
        const filteredTasks = this.filterAssigneeTasks();
        const assigneeTasksContainer = document.getElementById('assigneeTasks');
        const assigneeTasksTableBody = document.getElementById('assigneeTasksTableBody');

        // Clear existing content
        assigneeTasksContainer.innerHTML = '';
        assigneeTasksTableBody.innerHTML = '';

        if (filteredTasks.length === 0) {
            assigneeTasksContainer.innerHTML = '<div class="empty-state">해당하는 과제가 없습니다.</div>';
            return;
        }

        // Display tasks
        filteredTasks.forEach(task => {
            // Card view
            const taskCard = this.createDashboardTaskElement(task);
            assigneeTasksContainer.appendChild(taskCard);

            // Table view
            const taskRow = this.createDashboardTaskTableRow(task);
            assigneeTasksTableBody.appendChild(taskRow);
        });

        this.updateAssigneeViewDisplay();
    }

    updateAssigneeViewDisplay() {
        const cardViewBtn = document.getElementById('assigneeCardViewBtn');
        const tableViewBtn = document.getElementById('assigneeTableViewBtn');
        const tasksGrid = document.getElementById('assigneeTasks');
        const tasksTable = document.getElementById('assigneeTasksTable');

        if (cardViewBtn && cardViewBtn.classList.contains('active')) {
            tasksGrid.style.display = 'grid';
            tasksTable.style.display = 'none';
        } else {
            tasksGrid.style.display = 'none';
            tasksTable.style.display = 'block';
        }
    }

    // TODO specific methods
    async loadTodoList() {
        const loadingElement = document.getElementById('todoLoading');
        const todoList = document.getElementById('todoList');

        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }

        try {
            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.todo}/query`);
            const todos = response.results;

            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            todoList.innerHTML = '';

            if (todos.length === 0) {
                todoList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <h3>할일이 없습니다</h3>
                        <p>새로운 할일을 추가해보세요.</p>
                    </div>
                `;
                return;
            }

            todos.forEach(todo => {
                const todoItem = this.createTodoItem(todo);
                todoList.appendChild(todoItem);
            });

        } catch (error) {
            console.error('Error loading todos:', error);
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--color-danger);"></i>
                    <p>할일을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }

    createTodoItem(todo) {
        const properties = todo.properties;
        const title = this.getTodoTitle(todo);
        const completed = properties['완료여부']?.checkbox || false;
        const priority = properties['우선순위']?.select?.name || '보통';
        const dueDate = properties['마감일']?.date?.start || null;
        const memo = properties['메모']?.rich_text?.[0]?.plain_text || '';

        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${completed ? 'completed' : ''}`;
        todoItem.dataset.todoId = todo.id;

        const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('ko-KR') : '';

        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''}
                   onchange="taskManager.toggleTodoComplete('${todo.id}', this.checked)">
            <div class="todo-content">
                <div class="todo-title ${completed ? 'completed' : ''}">${title}</div>
                <div class="todo-meta">
                    <span class="todo-priority-badge ${priority}">${priority}</span>
                    ${dueDateStr ? `<span><i class="fas fa-calendar"></i> ${dueDateStr}</span>` : ''}
                    ${memo ? `<span><i class="fas fa-sticky-note"></i> ${memo}</span>` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-secondary" onclick="taskManager.editTodo('${todo.id}')" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="taskManager.deleteTodo('${todo.id}')" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return todoItem;
    }

    getTodoTitle(todo) {
        const properties = todo.properties;
        const titleProp = properties['할일'] || properties['Title'] || properties['할일'];

        if (titleProp && titleProp.title && titleProp.title.length > 0) {
            return titleProp.title[0].plain_text || titleProp.title[0].text?.content || '';
        }
        return 'Untitled';
    }

    async addTodoItem() {
        const todoInput = document.getElementById('todoInput');
        const todoPriority = document.getElementById('todoPriority');
        const todoDueDate = document.getElementById('todoDueDate');

        const title = todoInput.value.trim();
        if (!title) {
            this.showNotification('할일을 입력해주세요.', 'warning');
            todoInput.focus();
            return;
        }

        const priority = todoPriority.value;
        const dueDate = todoDueDate.value;

        try {
            const properties = {
                '할일': {
                    'title': [
                        {
                            'text': {
                                'content': title
                            }
                        }
                    ]
                },
                '완료여부': {
                    'checkbox': false
                },
                '우선순위': {
                    'select': {
                        'name': priority
                    }
                }
            };

            if (dueDate) {
                properties['마감일'] = {
                    'date': {
                        'start': dueDate
                    }
                };
            }

            const requestBody = {
                parent: { database_id: this.databases.todo },
                properties: properties
            };

            await this.makeNotionRequest('POST', '/v1/pages', requestBody);

            // Clear form
            todoInput.value = '';
            todoPriority.value = '보통';
            todoDueDate.value = '';

            // Reload todo list
            this.loadTodoList();
            this.loadAllTasksForDashboard();

            this.showNotification('할일이 추가되었습니다.', 'success');

        } catch (error) {
            console.error('Error adding todo:', error);
            this.showNotification('할일 추가에 실패했습니다: ' + error.message, 'error');
        }
    }

    async toggleTodoComplete(todoId, completed) {
        try {
            const requestBody = {
                properties: {
                    '완료여부': {
                        'checkbox': completed
                    }
                }
            };

            await this.makeNotionRequest('PATCH', `/v1/pages/${todoId}`, requestBody);

            // Reload todo list and dashboard
            this.loadTodoList();
            this.loadAllTasksForDashboard();

            this.showNotification(completed ? '할일을 완료했습니다.' : '할일을 미완료로 변경했습니다.', 'success');

        } catch (error) {
            console.error('Error toggling todo:', error);
            this.showNotification('상태 변경에 실패했습니다: ' + error.message, 'error');
        }
    }

    async deleteTodo(todoId) {
        const confirmed = await this.showConfirmDialog(
            '할일 삭제',
            '정말로 이 할일을 삭제하시겠습니까?',
            '삭제',
            '취소'
        );

        if (!confirmed) return;

        try {
            // Notion API doesn't support deleting pages, so we mark as archived
            const requestBody = {
                archived: true
            };

            await this.makeNotionRequest('PATCH', `/v1/pages/${todoId}`, requestBody);

            this.loadTodoList();
            this.loadAllTasksForDashboard();
            this.showNotification('할일이 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('할일 삭제에 실패했습니다: ' + error.message, 'error');
        }
    }

    // Journal Methods
    async loadJournal() {
        console.log('📖 Loading journal...');

        // Set today's date in date picker
        const today = new Date().toISOString().split('T')[0];
        const datePicker = document.getElementById('journalDatePicker');
        if (datePicker) {
            datePicker.value = today;
        }

        // Load today's journal and history
        await this.loadJournalByDate(today);
        await this.loadJournalHistory();
    }

    async loadJournalByDate(date) {
        console.log('📖 Loading journal for date:', date);
        const loading = document.getElementById('journalLoading');
        const journalEntry = document.getElementById('journalEntry');
        const journalForm = document.getElementById('journalForm');

        if (loading) loading.style.display = 'block';
        if (journalEntry) journalEntry.style.display = 'none';
        if (journalForm) journalForm.style.display = 'none';

        try {
            // Query for specific date's journal entry
            const requestBody = {
                filter: {
                    property: "날짜",
                    date: {
                        equals: date
                    }
                },
                page_size: 1
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.journal}/query`, requestBody);

            if (loading) loading.style.display = 'none';

            if (response.results && response.results.length > 0) {
                // Show existing entry
                this.displayJournalEntry(response.results[0]);
            } else {
                // Show create button
                this.showEmptyJournal();
            }

            // Update active item in history
            this.updateJournalHistorySelection(date);

        } catch (error) {
            console.error('Error loading journal:', error);
            if (loading) loading.style.display = 'none';
            this.showNotification('일지를 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    loadTodayJournal() {
        const today = new Date().toISOString().split('T')[0];
        const datePicker = document.getElementById('journalDatePicker');
        if (datePicker) {
            datePicker.value = today;
        }
        this.loadJournalByDate(today);
    }

    displayJournalEntry(entry) {
        const journalEntry = document.getElementById('journalEntry');
        const exerciseStatus = document.getElementById('exerciseStatus');
        const emotionContent = document.getElementById('emotionContent');
        const growthContent = document.getElementById('growthContent');

        if (journalEntry) journalEntry.style.display = 'block';

        const exercise = entry.properties['실내자전거 달성여부']?.checkbox || false;
        const emotion = entry.properties['감정일지']?.rich_text?.[0]?.text?.content || '내용이 없습니다.';
        const growth = entry.properties['성장일지']?.rich_text?.[0]?.text?.content || '내용이 없습니다.';

        if (exerciseStatus) {
            exerciseStatus.textContent = exercise ? '완료' : '미완료';
            exerciseStatus.className = `journal-status ${exercise ? 'completed' : ''}`;
        }
        if (emotionContent) emotionContent.textContent = emotion;
        if (growthContent) growthContent.textContent = growth;

        // Store current entry ID for editing
        this.currentJournalId = entry.id;
    }

    showEmptyJournal() {
        const journalEntry = document.getElementById('journalEntry');
        if (journalEntry) journalEntry.style.display = 'block';

        // Reset to default values
        const exerciseStatus = document.getElementById('exerciseStatus');
        const emotionContent = document.getElementById('emotionContent');
        const growthContent = document.getElementById('growthContent');

        if (exerciseStatus) {
            exerciseStatus.textContent = '미완료';
            exerciseStatus.className = 'journal-status';
        }
        if (emotionContent) emotionContent.textContent = '내용이 없습니다.';
        if (growthContent) growthContent.textContent = '내용이 없습니다.';

        this.currentJournalId = null;
    }

    showJournalForm() {
        const journalForm = document.getElementById('journalForm');
        if (journalForm) journalForm.style.display = 'block';

        // If editing existing entry, populate form
        if (this.currentJournalId) {
            this.populateJournalForm();
        }
    }

    hideJournalForm() {
        const journalForm = document.getElementById('journalForm');
        if (journalForm) journalForm.style.display = 'none';

        // Clear form
        const exerciseInput = document.getElementById('journalExercise');
        const emotionInput = document.getElementById('journalEmotion');
        const growthInput = document.getElementById('journalGrowth');

        if (exerciseInput) exerciseInput.checked = false;
        if (emotionInput) emotionInput.value = '';
        if (growthInput) growthInput.value = '';
    }

    populateJournalForm() {
        // Get current displayed values
        const exerciseStatus = document.getElementById('exerciseStatus');
        const emotionContent = document.getElementById('emotionContent');
        const growthContent = document.getElementById('growthContent');

        const exerciseInput = document.getElementById('journalExercise');
        const emotionInput = document.getElementById('journalEmotion');
        const growthInput = document.getElementById('journalGrowth');

        if (exerciseInput && exerciseStatus) {
            exerciseInput.checked = exerciseStatus.textContent === '완료';
        }
        if (emotionInput && emotionContent) {
            emotionInput.value = emotionContent.textContent !== '내용이 없습니다.' ? emotionContent.textContent : '';
        }
        if (growthInput && growthContent) {
            growthInput.value = growthContent.textContent !== '내용이 없습니다.' ? growthContent.textContent : '';
        }
    }

    async saveJournalEntry() {
        const exerciseInput = document.getElementById('journalExercise');
        const emotionInput = document.getElementById('journalEmotion');
        const growthInput = document.getElementById('journalGrowth');

        const exerciseValue = exerciseInput?.checked || false;
        const emotionValue = emotionInput?.value?.trim() || '';
        const growthValue = growthInput?.value?.trim() || '';

        try {
            if (this.currentJournalId) {
                // Update existing entry
                const requestBody = {
                    properties: {
                        '실내자전거 달성여부': { checkbox: exerciseValue },
                        '감정일지': {
                            rich_text: [{ text: { content: emotionValue || '내용이 없습니다.' } }]
                        },
                        '성장일지': {
                            rich_text: [{ text: { content: growthValue || '내용이 없습니다.' } }]
                        }
                    }
                };

                await this.makeNotionRequest('PATCH', `/v1/pages/${this.currentJournalId}`, requestBody);
                this.showNotification('일지가 수정되었습니다.', 'success');
            } else {
                // Create new entry
                const today = new Date().toISOString().split('T')[0];
                const requestBody = {
                    parent: { database_id: this.databases.journal },
                    properties: {
                        '날짜': { date: { start: today } },
                        '실내자전거 달성여부': { checkbox: exerciseValue },
                        '감정일지': {
                            rich_text: [{ text: { content: emotionValue || '내용이 없습니다.' } }]
                        },
                        '성장일지': {
                            rich_text: [{ text: { content: growthValue || '내용이 없습니다.' } }]
                        }
                    }
                };

                await this.makeNotionRequest('POST', '/v1/pages', requestBody);
                this.showNotification('일지가 생성되었습니다.', 'success');
            }

            this.hideJournalForm();
            const currentDate = document.getElementById('journalDatePicker')?.value || new Date().toISOString().split('T')[0];
            await this.loadJournalByDate(currentDate);
            await this.loadJournalHistory();

        } catch (error) {
            console.error('Error saving journal:', error);
            this.showNotification('일지 저장에 실패했습니다: ' + error.message, 'error');
        }
    }

    async loadJournalHistory() {
        console.log('📚 Loading journal history...');
        try {
            // Get all journal entries, sorted by date descending
            const requestBody = {
                sorts: [
                    {
                        property: "날짜",
                        direction: "descending"
                    }
                ],
                page_size: 50
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.journal}/query`, requestBody);

            if (response.results) {
                this.renderJournalHistory(response.results);
            }

        } catch (error) {
            console.error('Error loading journal history:', error);
            this.showNotification('일지 목록을 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    renderJournalHistory(entries) {
        const historyList = document.getElementById('journalHistoryList');
        const journalCount = document.getElementById('journalCount');

        if (!historyList) return;

        if (entries.length === 0) {
            historyList.innerHTML = '<div class="journal-history-empty">작성된 일지가 없습니다.</div>';
            if (journalCount) journalCount.textContent = '0개';
            return;
        }

        if (journalCount) journalCount.textContent = `${entries.length}개`;

        historyList.innerHTML = entries.map(entry => {
            const date = entry.properties['날짜']?.date?.start || '날짜 없음';
            const exercise = entry.properties['실내자전거 달성여부']?.checkbox || false;
            const emotion = entry.properties['감정일지']?.rich_text?.[0]?.text?.content || '';
            const growth = entry.properties['성장일지']?.rich_text?.[0]?.text?.content || '';

            const preview = [emotion, growth].filter(text => text && text !== '내용이 없습니다.').join(' | ') || '내용 없음';
            const formattedDate = this.formatDateKorean(date);

            return `
                <div class="journal-history-item" data-date="${date}" onclick="taskManager.loadJournalFromHistory('${date}')">
                    <div class="journal-history-date">${formattedDate}</div>
                    <div class="journal-history-preview">${preview}</div>
                    <div class="journal-history-status ${exercise ? '' : 'incomplete'}">
                        <i class="fas fa-bicycle"></i>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDateKorean(dateString) {
        try {
            const date = new Date(dateString);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const weekday = weekdays[date.getDay()];
            return `${month}월 ${day}일 (${weekday})`;
        } catch (error) {
            return dateString;
        }
    }

    loadJournalFromHistory(date) {
        const datePicker = document.getElementById('journalDatePicker');
        if (datePicker) {
            datePicker.value = date;
        }
        this.loadJournalByDate(date);
    }

    updateJournalHistorySelection(selectedDate) {
        const historyItems = document.querySelectorAll('.journal-history-item');
        historyItems.forEach(item => {
            if (item.dataset.date === selectedDate) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    editJournalEntry() {
        this.showJournalForm();
    }

    editTodo(todoId) {
        // For now, show a simple prompt for editing
        // This could be expanded to a full modal later
        this.showNotification('할일 수정 기능은 곧 추가될 예정입니다.', 'info');
    }

    // Records Methods
    async loadRecords() {
        console.log('📋 Loading records...');
        const loading = document.getElementById('recordsLoading');
        const recordsList = document.getElementById('recordsList');
        const recordsForm = document.getElementById('recordsForm');

        if (loading) loading.style.display = 'block';
        if (recordsList) recordsList.style.display = 'none';
        if (recordsForm) recordsForm.style.display = 'none';

        try {
            // Get all records, sorted by date descending
            const requestBody = {
                sorts: [
                    {
                        property: "작성일",
                        direction: "descending"
                    }
                ],
                page_size: 100
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.records}/query`, requestBody);

            if (loading) loading.style.display = 'none';
            if (recordsList) recordsList.style.display = 'block';

            if (response.results) {
                this.renderRecords(response.results);
            }

        } catch (error) {
            console.error('Error loading records:', error);
            if (loading) loading.style.display = 'none';
            this.showNotification('기록을 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    renderRecords(records) {
        const recordsList = document.getElementById('recordsList');
        if (!recordsList) return;

        if (records.length === 0) {
            recordsList.innerHTML = '<div class="records-empty">작성된 기록이 없습니다.</div>';
            return;
        }

        recordsList.innerHTML = records.map(record => {
            const id = record.id;
            const subject = record.properties['주제']?.title?.[0]?.text?.content || '제목 없음';
            const date = record.properties['작성일']?.date?.start || '날짜 없음';
            const core = record.properties['핵심']?.rich_text?.[0]?.text?.content || '내용 없음';

            const formattedDate = this.formatDateKorean(date);

            return `
                <div class="records-item" data-id="${id}">
                    <div class="records-item-header">
                        <h3 class="records-item-title">${subject}</h3>
                        <span class="records-item-date">${formattedDate}</span>
                    </div>
                    <div class="records-item-core">${core}</div>
                    <div class="records-item-actions">
                        <button class="btn btn-outline" onclick="taskManager.editRecord('${id}')">
                            <i class="fas fa-edit"></i>
                            수정
                        </button>
                        <button class="btn btn-danger" onclick="taskManager.deleteRecord('${id}')">
                            <i class="fas fa-trash"></i>
                            삭제
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showRecordsForm() {
        const recordsForm = document.getElementById('recordsForm');
        if (recordsForm) recordsForm.style.display = 'block';

        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('recordsDate');
        if (dateInput) {
            dateInput.value = today;
        }

        // Clear form if creating new record
        if (!this.currentRecordId) {
            this.clearRecordsForm();
        }
    }

    hideRecordsForm() {
        const recordsForm = document.getElementById('recordsForm');
        if (recordsForm) recordsForm.style.display = 'none';
        this.clearRecordsForm();
        this.currentRecordId = null;
    }

    clearRecordsForm() {
        const subjectInput = document.getElementById('recordsSubject');
        const dateInput = document.getElementById('recordsDate');
        const coreInput = document.getElementById('recordsCore');

        if (subjectInput) subjectInput.value = '';
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (coreInput) coreInput.value = '';
    }

    async saveRecord() {
        const subjectInput = document.getElementById('recordsSubject');
        const dateInput = document.getElementById('recordsDate');
        const coreInput = document.getElementById('recordsCore');

        const subject = subjectInput?.value?.trim() || '';
        const date = dateInput?.value || '';
        const core = coreInput?.value?.trim() || '';

        if (!subject) {
            this.showNotification('주제를 입력해주세요.', 'error');
            return;
        }

        if (!date) {
            this.showNotification('작성일을 선택해주세요.', 'error');
            return;
        }

        try {
            if (this.currentRecordId) {
                // Update existing record
                const requestBody = {
                    properties: {
                        '주제': { title: [{ text: { content: subject } }] },
                        '작성일': { date: { start: date } },
                        '핵심': { rich_text: [{ text: { content: core || '내용 없음' } }] }
                    }
                };

                await this.makeNotionRequest('PATCH', `/v1/pages/${this.currentRecordId}`, requestBody);
                this.showNotification('기록이 수정되었습니다.', 'success');
            } else {
                // Create new record
                const requestBody = {
                    parent: { database_id: this.databases.records },
                    properties: {
                        '주제': { title: [{ text: { content: subject } }] },
                        '작성일': { date: { start: date } },
                        '핵심': { rich_text: [{ text: { content: core || '내용 없음' } }] }
                    }
                };

                await this.makeNotionRequest('POST', '/v1/pages', requestBody);
                this.showNotification('기록이 생성되었습니다.', 'success');
            }

            this.hideRecordsForm();
            this.loadRecords();

        } catch (error) {
            console.error('Error saving record:', error);
            this.showNotification('기록 저장에 실패했습니다: ' + error.message, 'error');
        }
    }

    async editRecord(recordId) {
        try {
            const response = await this.makeNotionRequest('GET', `/v1/pages/${recordId}`);

            const subject = response.properties['주제']?.title?.[0]?.text?.content || '';
            const date = response.properties['작성일']?.date?.start || '';
            const core = response.properties['핵심']?.rich_text?.[0]?.text?.content || '';

            // Populate form
            const subjectInput = document.getElementById('recordsSubject');
            const dateInput = document.getElementById('recordsDate');
            const coreInput = document.getElementById('recordsCore');

            if (subjectInput) subjectInput.value = subject;
            if (dateInput) dateInput.value = date;
            if (coreInput) coreInput.value = core !== '내용 없음' ? core : '';

            this.currentRecordId = recordId;
            this.showRecordsForm();

        } catch (error) {
            console.error('Error loading record for edit:', error);
            this.showNotification('기록을 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    async deleteRecord(recordId) {
        const confirmed = await this.showConfirmDialog(
            '기록 삭제',
            '정말로 이 기록을 삭제하시겠습니까?',
            '삭제',
            '취소'
        );

        if (!confirmed) return;

        try {
            // Notion API doesn't support deleting pages, so we mark as archived
            const requestBody = {
                archived: true
            };

            await this.makeNotionRequest('PATCH', `/v1/pages/${recordId}`, requestBody);

            this.loadRecords();
            this.showNotification('기록이 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('Error deleting record:', error);
            this.showNotification('기록 삭제에 실패했습니다: ' + error.message, 'error');
        }
    }

    // Events Methods
    async loadEvents() {
        console.log('🎉 Loading events...');
        const loading = document.getElementById('eventsLoading');
        const eventsList = document.getElementById('eventsList');

        if (loading) loading.style.display = 'block';
        if (eventsList) eventsList.style.display = 'none';

        try {
            // Get all events, sorted by date descending
            const requestBody = {
                sorts: [
                    {
                        property: "날짜",
                        direction: "descending"
                    }
                ],
                page_size: 100
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.events}/query`, requestBody);

            if (loading) loading.style.display = 'none';
            if (eventsList) eventsList.style.display = 'grid';

            if (response.results) {
                await this.renderEvents(response.results);
            }

        } catch (error) {
            console.error('Error loading events:', error);
            if (loading) loading.style.display = 'none';
            this.showNotification('행사를 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    async renderEvents(events) {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        if (events.length === 0) {
            eventsList.innerHTML = '<div class="events-empty">등록된 행사가 없습니다.</div>';
            return;
        }

        // Group events by event name and get task counts
        const eventGroups = {};
        for (const event of events) {
            const titleText = event.properties['행사명']?.title?.[0]?.text?.content || '제목 없음';

            // Extract event name from title (format: "EventName|||TaskContent" or just "EventName")
            let eventName = titleText;
            if (titleText.includes('|||')) {
                eventName = titleText.split('|||')[0].trim();
            }

            if (!eventGroups[eventName]) {
                eventGroups[eventName] = {
                    name: eventName,
                    date: event.properties['날짜']?.date?.start || '날짜 없음',
                    tasks: []
                };
            }

            // Only count tasks that have content (contain |||) for task counting
            if (titleText.includes('|||')) {
                eventGroups[eventName].tasks.push(event);
            }
        }

        eventsList.innerHTML = Object.values(eventGroups).map(eventGroup => {
            const totalTasks = eventGroup.tasks.length;
            const completedTasks = eventGroup.tasks.filter(task =>
                task.properties['체크리스트']?.checkbox || false
            ).length;

            const formattedDate = this.formatDateKorean(eventGroup.date);

            return `
                <div class="event-card" onclick="taskManager.openEventDetail('${eventGroup.name}')">
                    <div class="event-card-header">
                        <h3 class="event-card-title">${eventGroup.name}</h3>
                        <span class="event-card-date">${formattedDate}</span>
                    </div>
                    <div class="event-card-stats">
                        <div class="event-card-stat">
                            <i class="fas fa-tasks"></i>
                            <span>${completedTasks}/${totalTasks} 완료</span>
                        </div>
                        <div class="event-card-stat">
                            <i class="fas fa-percentage"></i>
                            <span>${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                        </div>
                    </div>
                    <div class="event-card-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-outline btn-sm" onclick="taskManager.editEvent('${eventGroup.name}')">
                            <i class="fas fa-edit"></i>
                            수정
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="taskManager.deleteEvent('${eventGroup.name}')">
                            <i class="fas fa-trash"></i>
                            삭제
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showEventModal(eventName = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('eventModalTitle');
        const eventForm = document.getElementById('eventForm');
        const tasksSection = document.getElementById('eventTasksSection');

        if (modal) modal.style.display = 'flex';

        if (eventName) {
            // Editing existing event
            if (modalTitle) modalTitle.textContent = `행사 수정: ${eventName}`;
            if (eventForm) eventForm.style.display = 'none';
            if (tasksSection) tasksSection.style.display = 'block';
            this.currentEventName = eventName;
            this.loadEventTasks(eventName);
        } else {
            // Creating new event
            if (modalTitle) modalTitle.textContent = '새 행사 추가';
            if (eventForm) eventForm.style.display = 'block';
            if (tasksSection) tasksSection.style.display = 'none';
            this.currentEventName = null;
            this.clearEventForm();
        }
    }

    hideEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) modal.style.display = 'none';
        this.clearEventForm();
        this.hideEventTaskForm();
        this.currentEventName = null;
    }

    clearEventForm() {
        const nameInput = document.getElementById('eventName');
        const dateInput = document.getElementById('eventDate');

        if (nameInput) nameInput.value = '';
        if (dateInput) dateInput.value = '';
    }

    async saveEvent() {
        const nameInput = document.getElementById('eventName');
        const dateInput = document.getElementById('eventDate');

        const eventName = nameInput?.value?.trim() || '';
        const eventDate = dateInput?.value || '';

        if (!eventName) {
            this.showNotification('행사명을 입력해주세요.', 'error');
            return;
        }

        if (!eventDate) {
            this.showNotification('행사 날짜를 선택해주세요.', 'error');
            return;
        }

        try {
            // Create initial event entry
            const requestBody = {
                parent: { database_id: this.databases.events },
                properties: {
                    '행사명': { title: [{ text: { content: eventName } }] },
                    '날짜': { date: { start: eventDate } },
                    '체크리스트': { checkbox: false }
                }
            };

            await this.makeNotionRequest('POST', '/v1/pages', requestBody);
            this.showNotification('행사가 생성되었습니다.', 'success');

            this.hideEventModal();
            this.loadEvents();

        } catch (error) {
            console.error('Error saving event:', error);
            this.showNotification('행사 저장에 실패했습니다: ' + error.message, 'error');
        }
    }

    openEventDetail(eventName) {
        this.showEventModal(eventName);
    }

    editEvent(eventName) {
        this.showEventModal(eventName);
    }

    async deleteEvent(eventName) {
        const confirmed = await this.showConfirmDialog(
            '행사 삭제',
            `정말로 "${eventName}" 행사와 관련된 모든 준비사항을 삭제하시겠습니까?`,
            '삭제',
            '취소'
        );

        if (!confirmed) return;

        try {
            // Get all tasks for this event
            const requestBody = {
                filter: {
                    property: "행사명",
                    title: {
                        equals: eventName
                    }
                }
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.events}/query`, requestBody);

            // Archive all tasks for this event
            for (const task of response.results) {
                await this.makeNotionRequest('PATCH', `/v1/pages/${task.id}`, {
                    archived: true
                });
            }

            this.loadEvents();
            this.showNotification('행사가 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('Error deleting event:', error);
            this.showNotification('행사 삭제에 실패했습니다: ' + error.message, 'error');
        }
    }

    async loadEventTasks(eventName) {
        try {
            const requestBody = {
                filter: {
                    property: "행사명",
                    title: {
                        starts_with: eventName + "|||"
                    }
                },
                sorts: [
                    {
                        property: "날짜",
                        direction: "ascending"
                    }
                ]
            };

            const response = await this.makeNotionRequest('POST', `/v1/databases/${this.databases.events}/query`, requestBody);
            this.renderEventTasks(response.results);

        } catch (error) {
            console.error('Error loading event tasks:', error);
            this.showNotification('준비사항을 불러오는데 실패했습니다: ' + error.message, 'error');
        }
    }

    renderEventTasks(tasks) {
        const tasksList = document.getElementById('eventTasksList');
        if (!tasksList) return;

        if (tasks.length === 0) {
            tasksList.innerHTML = '<div class="event-tasks-empty">준비사항이 없습니다.</div>';
            return;
        }

        tasksList.innerHTML = tasks.map(task => {
            const id = task.id;
            const date = task.properties['날짜']?.date?.start || '';
            const completed = task.properties['체크리스트']?.checkbox || false;

            // Extract content from the title field (format: "EventName|||TaskContent")
            const titleText = task.properties['행사명']?.title?.[0]?.text?.content || '';
            let content = '내용 없음';

            if (titleText.includes('|||')) {
                const parts = titleText.split('|||');
                if (parts.length > 1) {
                    content = parts[1].trim();
                }
            } else if (titleText !== this.currentEventName) {
                // If it's not in the new format and not just the event name, show the title
                content = titleText;
            }

            const formattedDate = this.formatDateKorean(date);

            return `
                <div class="event-task-item" data-id="${id}">
                    <input type="checkbox" class="event-task-checkbox" ${completed ? 'checked' : ''}
                           onchange="taskManager.toggleEventTask('${id}', this.checked)">
                    <span class="event-task-date-display">${formattedDate}</span>
                    <span class="event-task-content-display ${completed ? 'completed' : ''}">${content}</span>
                    <div class="event-task-actions">
                        <button class="btn btn-danger btn-sm" onclick="taskManager.deleteEventTask('${id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showEventTaskForm() {
        const taskForm = document.getElementById('eventTaskForm');
        if (taskForm) taskForm.style.display = 'block';

        // Set today as default date
        const dateInput = document.getElementById('eventTaskDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    hideEventTaskForm() {
        const taskForm = document.getElementById('eventTaskForm');
        if (taskForm) taskForm.style.display = 'none';

        // Clear inputs
        const dateInput = document.getElementById('eventTaskDate');
        const contentInput = document.getElementById('eventTaskContent');
        if (dateInput) dateInput.value = '';
        if (contentInput) contentInput.value = '';
    }

    async saveEventTask() {
        const dateInput = document.getElementById('eventTaskDate');
        const contentInput = document.getElementById('eventTaskContent');

        const date = dateInput?.value || '';
        const content = contentInput?.value?.trim() || '';

        if (!date) {
            this.showNotification('날짜를 선택해주세요.', 'error');
            return;
        }

        if (!content) {
            this.showNotification('준비할 내용을 입력해주세요.', 'error');
            return;
        }

        try {
            // Store the content in the title field with a special format: "EventName|||TaskContent"
            const titleContent = `${this.currentEventName}|||${content}`;

            const requestBody = {
                parent: { database_id: this.databases.events },
                properties: {
                    '행사명': { title: [{ text: { content: titleContent } }] },
                    '날짜': { date: { start: date } },
                    '체크리스트': { checkbox: false }
                }
            };

            await this.makeNotionRequest('POST', '/v1/pages', requestBody);
            this.showNotification('준비사항이 추가되었습니다.', 'success');

            this.hideEventTaskForm();
            this.loadEventTasks(this.currentEventName);

        } catch (error) {
            console.error('Error saving event task:', error);
            this.showNotification('준비사항 저장에 실패했습니다: ' + error.message, 'error');
        }
    }

    async toggleEventTask(taskId, completed) {
        try {
            const requestBody = {
                properties: {
                    '체크리스트': { checkbox: completed }
                }
            };

            await this.makeNotionRequest('PATCH', `/v1/pages/${taskId}`, requestBody);

            // Refresh the event list to update completion stats
            this.loadEvents();

        } catch (error) {
            console.error('Error toggling event task:', error);
            this.showNotification('체크리스트 업데이트에 실패했습니다: ' + error.message, 'error');
        }
    }

    async deleteEventTask(taskId) {
        const confirmed = await this.showConfirmDialog(
            '준비사항 삭제',
            '정말로 이 준비사항을 삭제하시겠습니까?',
            '삭제',
            '취소'
        );

        if (!confirmed) return;

        try {
            await this.makeNotionRequest('PATCH', `/v1/pages/${taskId}`, {
                archived: true
            });

            this.loadEventTasks(this.currentEventName);
            this.loadEvents(); // Refresh the main events list
            this.showNotification('준비사항이 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('Error deleting event task:', error);
            this.showNotification('준비사항 삭제에 실패했습니다: ' + error.message, 'error');
        }
    }

    // 로그인 확인 및 관리
    checkLogin() {
        const user = localStorage.getItem('user');
        if (!user) {
            // 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
            window.location.href = '/login.html';
            return;
        }

        try {
            const userData = JSON.parse(user);
            this.updateUserInfo(userData);
        } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    }

    updateUserInfo(userData) {
        const userInfo = document.getElementById('userInfo');
        const username = document.getElementById('username');

        if (userInfo && username) {
            username.textContent = userData.name || userData.email;
            userInfo.style.display = 'flex';
        }

        // 로그아웃 버튼 이벤트 리스너 추가
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    logout() {
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

// Initialize the task manager when the page loads
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new NotionTaskManager();

    // Assignee overview event listeners
    document.getElementById('backToMainBtn')?.addEventListener('click', () => {
        taskManager.hideAssigneeOverview();
    });

    document.getElementById('backToStatsBtn')?.addEventListener('click', () => {
        taskManager.loadAssigneeStats();
    });

    document.getElementById('backToAssigneeListBtn')?.addEventListener('click', () => {
        if (taskManager.currentBreakdownStat) {
            taskManager.showAssigneeBreakdown(taskManager.currentBreakdownStat);
        } else {
            taskManager.loadAssigneeList();
        }
    });

    // Table header click handlers for column-wise filtering (optional future feature)
    document.querySelectorAll('.stat-header.clickable').forEach(header => {
        header.addEventListener('click', () => {
            const statType = header.getAttribute('data-stat');
            console.log(`Clicked on ${statType} column - could implement column sorting/filtering here`);
        });
    });

    // Assignee detail stat card listeners
    document.querySelectorAll('[data-assignee-filter]').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.getAttribute('data-assignee-filter');
            taskManager.setAssigneeFilter(filter);
        });
    });

    // Assignee view toggle listeners
    document.getElementById('assigneeCardViewBtn')?.addEventListener('click', () => {
        document.querySelectorAll('#assigneeDetail .view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('assigneeCardViewBtn').classList.add('active');
        taskManager.updateAssigneeViewDisplay();
    });

    document.getElementById('assigneeTableViewBtn')?.addEventListener('click', () => {
        document.querySelectorAll('#assigneeDetail .view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('assigneeTableViewBtn').classList.add('active');
        taskManager.updateAssigneeViewDisplay();
    });
});