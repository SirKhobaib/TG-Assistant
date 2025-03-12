// Check for Telegram WebApp and handle gracefully
const isTelegramWebApp = window.Telegram && window.Telegram.WebApp;
if (isTelegramWebApp) {
    window.Telegram.WebApp.ready();
    const mainButton = window.Telegram.WebApp.MainButton;
    mainButton.setText('Home');
    mainButton.setParams({ color: '#007bff', text_color: '#fff' });
    mainButton.onClick(() => window.location.reload());
    mainButton.show();
} else {
    console.warn("Telegram WebApp is not available. Running in non-Telegram environment.");
}

// Define default tools with icon classes
const defaultSearchableTools = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'fas fa-search' },
    { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: 'fas fa-play' },
    { name: 'Weather', url: 'https://www.accuweather.com/en/search-locations?query=', icon: 'fas fa-cloud' },
    { name: 'Add', url: '', icon: 'fas fa-plus' }
];

const defaultLinkedTools = [
    { name: 'Calculator', url: 'https://www.online-calculator.com/full-screen-calculator/', icon: 'https://www.calculator.net/favicon.ico' },
    { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'https://chat.openai.com/favicon.ico' },
    { name: 'Notes', url: 'https://keep.google.com', icon: 'https://ssl.gstatic.com/keep/keep_2023q4.ico' },
    { name: 'Maps', url: 'https://maps.google.com', icon: 'https://www.google.com/images/branding/product/ico/maps15_bnuw3a_32dp.ico' },
    { name: 'Translate', url: 'https://translate.google.com', icon: 'https://translate.google.com/favicon.ico' }
];

// Track changes for notification
let changeCount = 0;

function showResetNotification() {
    if (changeCount < 3) {
        changeCount++;
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 200;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        notification.textContent = 'You can reset changes in Settings!';
        document.body.appendChild(notification);

        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
}

// Load tools from local storage
function loadTools() {
    let savedSearchableTools;
    let savedLinkedTools;
    try {
        savedSearchableTools = JSON.parse(localStorage.getItem('tgSearchableTools'));
        savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools'));
    } catch (e) {
        console.error('Failed to load tools:', e);
        savedSearchableTools = null;
        savedLinkedTools = null;
    }

    const searchableTools = (savedSearchableTools && savedSearchableTools.length > 0) ? savedSearchableTools : defaultSearchableTools;
    const linkedTools = (savedLinkedTools && savedLinkedTools.length > 0) ? savedLinkedTools : defaultLinkedTools;
    localStorage.setItem('tgSearchableTools', JSON.stringify(searchableTools));
    localStorage.setItem('tgLinkedTools', JSON.stringify(linkedTools));

    const searchableContainer = document.getElementById('searchable-tools');
    searchableContainer.innerHTML = '';
    searchableTools.forEach(tool => {
        const button = createSearchableButton(tool.name, tool.url, tool.icon);
        searchableContainer.appendChild(button);
    });

    const linkedContainer = document.getElementById('linked-cards');
    const linkedFragment = document.createDocumentFragment();
    linkedTools.forEach(tool => {
        const card = createLinkedCard(tool.name, tool.url, tool.icon);
        linkedFragment.appendChild(card);
    });
    linkedContainer.innerHTML = '';
    linkedContainer.appendChild(linkedFragment);
    addAddButton();

    // Add long-press event listeners to cards
    document.querySelectorAll('.card').forEach(card => {
        let pressTimer;
        const menu = card.querySelector('.menu');

        card.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                e.preventDefault();
                toggleMenu(card, menu);
            }, 500);
        });

        card.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        card.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });

        // Fallback for mouse devices
        card.addEventListener('mousedown', (e) => {
            pressTimer = setTimeout(() => {
                e.preventDefault();
                toggleMenu(card, menu);
            }, 500);
        });

        card.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
        });

        card.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
        });
    });

    loadSettings();
}

function toggleMenu(card, menu) {
    // Close all other menus
    document.querySelectorAll('.menu').forEach(m => {
        if (m !== menu) {
            m.classList.remove('active');
            m.style.display = 'none';
        }
    });
    // Toggle the current menu
    menu.classList.toggle('active');
    menu.style.display = menu.classList.contains('active') ? 'flex' : 'none';
    // Prevent default card click action when menu is open
    if (menu.classList.contains('active')) {
        card.onclick = (e) => e.stopPropagation();
    } else {
        card.onclick = (e) => {
            if (!e.target.closest('.menu')) openLink(card.dataset.url);
        };
    }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    document.querySelectorAll('.menu').forEach(menu => {
        if (!menu.contains(e.target) && !menu.closest('.card').contains(e.target)) {
            menu.classList.remove('active');
            menu.style.display = 'none';
        }
    });
});

function createSearchableButton(name, url, iconClass) {
    const button = document.createElement('div');
    button.className = 'searchable-button';
    button.dataset.name = name;
    button.dataset.url = url;
    button.innerHTML = `<i class="${iconClass}"></i>`;
    button.onclick = () => {
        if (name === 'Add') {
            showAddToolPopup('searchable');
        } else {
            selectTool(name, url, iconClass);
        }
    };
    return button;
}

function createLinkedCard(name, url, icon) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.name = name;
    card.dataset.url = url;
    card.dataset.icon = typeof icon === 'object' ? JSON.stringify(icon) : icon;
    switch (name) {
        case 'Calculator': card.id = 'iph_calculator'; break;
        case 'ChatGPT': card.id = 'iph_chatgpt'; break;
        case 'Notes': card.id = 'iph_notes'; break;
        case 'Maps': card.id = 'iph_maps'; break;
        case 'Translate': card.id = 'iph_translate'; break;
        default: card.id = '';
    }

    let iconHtml;
    if (typeof icon === 'object' && icon.type === 'text') {
        iconHtml = `<div class="card-icon text-icon" style="background-color: ${icon.color}">${icon.value}</div>`;
    } else {
        const iconSrc = icon || 'https://via.placeholder.com/48';
        iconHtml = `<img src="${iconSrc}" alt="${name}" class="card-icon">`;
    }

    card.innerHTML = `
        ${iconHtml}
        <span class="tool-name">${name}</span>
        <div class="menu" style="display: none;">
            <button onclick="editToolName(this)"><i class="fas fa-pencil-alt"></i> Edit Name</button>
            <button onclick="editToolUrl(this)"><i class="fas fa-link"></i> Edit URL</button>
            <button onclick="editToolIcon(this)"><i class="fas fa-image"></i> Edit Icon URL</button>
            <button onclick="removeTool(this)"><i class="fas fa-trash"></i> Remove</button>
        </div>
    `;
    card.onclick = (e) => {
        if (!e.target.closest('.menu')) {
            openLink(url);
        }
    };
    return card;
}

function addAddButton() {
    const container = document.getElementById('linked-cards');
    const addCard = document.createElement('div');
    addCard.className = 'card add-card';
    addCard.innerHTML = `
        <i class="fas fa-plus card-icon"></i>
        <span class="tool-name"></span>
    `;
    addCard.onclick = () => showAddToolPopup('linked');
    container.appendChild(addCard);
}

function openLink(url) {
    if (isTelegramWebApp && url) {
        window.Telegram.WebApp.openLink(url, { try_instant_view: true });
    } else if (url) {
        window.open(url, '_blank'); // Fallback to open in new tab
    } else {
        console.warn("No valid URL provided to open.");
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    const selectedTool = document.getElementById('selected-tool');
    const url = selectedTool.dataset.url;
    const searchUrl = `${url}${encodeURIComponent(query)}`;
    if (isTelegramWebApp) {
        window.Telegram.WebApp.openLink(searchUrl);
    } else {
        window.open(searchUrl, '_blank'); // Fallback for non-Telegram
    }
}

function selectTool(name, url, iconClass) {
    const selectedTool = document.getElementById('selected-tool');
    selectedTool.innerHTML = `<i class="${iconClass}"></i>`;
    selectedTool.dataset.name = name;
    selectedTool.dataset.url = url;
    selectedTool.classList.add('active');
    setTimeout(() => selectedTool.classList.remove('active'), 200);

    const input = document.getElementById('search-input');
    if (name === 'Weather') {
        input.placeholder = 'Enter city name...';
    } else {
        input.placeholder = `Search ${name}...`;
    }
}

function showAddToolPopup(type) {
    const popup = document.createElement('div');
    popup.className = 'add-tool-popup';
    popup.dataset.type = type;
    popup.innerHTML = `
        <div class="popup-content">
            <h2>Add New Tool</h2>
            <i class="fas fa-times close-icon" onclick="this.parentElement.parentElement.remove()"></i>
            <div class="input-group">
                <label for="tool-name">Name</label>
                <input type="text" id="tool-name" placeholder="Enter tool name">
            </div>
            <div class="input-group">
                <label for="tool-url">URL</label>
                <input type="text" id="tool-url" placeholder="Enter tool URL (e.g., https://example.com)">
            </div>
            <div class="input-group">
                <label for="tool-icon">Icon ${type === 'searchable' ? 'Class (e.g., fas fa-star)' : 'URL (optional)'} </label>
                <input type="text" id="tool-icon" placeholder="${type === 'searchable' ? 'Enter FontAwesome class' : 'Enter icon URL'}">
            </div>
            <button class="save-btn" onclick="saveToolFromPopup()">Save</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function saveToolFromPopup() {
    const popup = document.querySelector('.add-tool-popup');
    const type = popup.dataset.type;
    const name = document.getElementById('tool-name').value.trim();
    const url = document.getElementById('tool-url').value.trim();
    let icon = document.getElementById('tool-icon').value.trim();

    if (!name || !url || !url.match(/^https?:\/\/[^\s]+$/)) {
        alert('Please enter a valid name and URL starting with http:// or https://');
        return;
    }

    function generateTextIcon(name) {
        const words = name.split(/\s+/);
        const firstLetter = words[0][0].toUpperCase();
        const lastLetter = words.length > 1 ? words[words.length - 1][0].toUpperCase() : '';
        const color = generateColorFromName(name);
        return { type: 'text', value: firstLetter + lastLetter, color: color };
    }

    function generateColorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 50%)`;
    }

    if (type === 'searchable') {
        let savedSearchableTools = JSON.parse(localStorage.getItem('tgSearchableTools')) || defaultSearchableTools;
        savedSearchableTools = savedSearchableTools.filter(t => t.name !== 'Add');
        savedSearchableTools.push({ name, url, icon: icon || 'fas fa-star' });
        savedSearchableTools.push({ name: 'Add', url: '', icon: 'fas fa-plus' });
        localStorage.setItem('tgSearchableTools', JSON.stringify(savedSearchableTools));
        addSearchableToolToDOM(name, url, icon || 'fas fa-star');
    } else {
        if (icon) {
            const img = new Image();
            img.onload = () => saveLinkedTool(name, url, icon);
            img.onerror = () => saveLinkedTool(name, url, generateTextIcon(name));
            img.src = icon;
        } else {
            saveLinkedTool(name, url, generateTextIcon(name));
        }
    }

    function saveLinkedTool(name, url, icon) {
        let savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools')) || defaultLinkedTools;
        savedLinkedTools.push({ name, url, icon });
        localStorage.setItem('tgLinkedTools', JSON.stringify(savedLinkedTools));
        addLinkedToolToDOM(name, url, icon);
        showResetNotification();
        popup.remove();
    }
}

function addSearchableToolToDOM(name, url, icon) {
    const container = document.getElementById('searchable-tools');
    const button = createSearchableButton(name, url, icon);
    container.insertBefore(button, container.lastElementChild);
}

function addLinkedToolToDOM(name, url, icon) {
    const container = document.getElementById('linked-cards');
    const card = createLinkedCard(name, url, icon);
    container.insertBefore(card, container.lastElementChild);
    let pressTimer;
    const menu = card.querySelector('.menu');
    card.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            e.preventDefault();
            toggleMenu(card, menu);
        }, 500);
    });
    card.addEventListener('touchend', () => clearTimeout(pressTimer));
    card.addEventListener('touchmove', () => clearTimeout(pressTimer));
    card.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
            e.preventDefault();
            toggleMenu(card, menu);
        }, 500);
    });
    card.addEventListener('mouseup', () => clearTimeout(pressTimer));
    card.addEventListener('mouseleave', () => clearTimeout(pressTimer));
}

function editToolName(btn) {
    const card = btn.closest('.card');
    const oldName = card.dataset.name;
    const newName = prompt('Enter new name:', oldName);
    if (!newName) return;

    card.dataset.name = newName;
    card.querySelector('.tool-name').textContent = newName;

    let savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools')) || defaultLinkedTools;
    const toolIndex = savedLinkedTools.findIndex(t => t.name === oldName);
    if (toolIndex !== -1) {
        savedLinkedTools[toolIndex].name = newName;
        localStorage.setItem('tgLinkedTools', JSON.stringify(savedLinkedTools));
    }
    showResetNotification();
}

function editToolUrl(btn) {
    const card = btn.closest('.card');
    const oldUrl = card.dataset.url;
    const newUrl = prompt('Enter new URL:', oldUrl);
    if (!newUrl || !newUrl.match(/^https?:\/\/[^\s]+$/)) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }

    card.dataset.url = newUrl;

    let savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools')) || defaultLinkedTools;
    const toolIndex = savedLinkedTools.findIndex(t => t.name === card.dataset.name);
    if (toolIndex !== -1) {
        savedLinkedTools[toolIndex].url = newUrl;
        localStorage.setItem('tgLinkedTools', JSON.stringify(savedLinkedTools));
    }
    showResetNotification();
}

function editToolIcon(btn) {
    const card = btn.closest('.card');
    const oldIcon = JSON.parse(card.dataset.icon || '{}') || card.dataset.icon;
    const newIconInput = prompt('Enter new icon URL (optional, leave blank for text-based icon):', typeof oldIcon === 'string' ? oldIcon : '');
    let newIcon;

    if (newIconInput) {
        const img = new Image();
        img.onload = () => updateIcon(newIconInput);
        img.onerror = () => updateIcon(generateTextIcon(card.dataset.name));
        img.src = newIconInput;
    } else {
        newIcon = generateTextIcon(card.dataset.name);
        updateIcon(newIcon);
    }

    function generateTextIcon(name) {
        const words = name.split(/\s+/);
        const firstLetter = words[0][0].toUpperCase();
        const lastLetter = words.length > 1 ? words[words.length - 1][0].toUpperCase() : '';
        const color = generateColorFromName(name);
        return { type: 'text', value: firstLetter + lastLetter, color: color };
    }

    function generateColorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 70%, 50%)`;
    }

    function updateIcon(icon) {
        card.dataset.icon = typeof icon === 'object' ? JSON.stringify(icon) : icon;
        const iconElement = card.querySelector('.card-icon');
        if (typeof icon === 'object' && icon.type === 'text') {
            iconElement.outerHTML = `<div class="card-icon text-icon" style="background-color: ${icon.color}">${icon.value}</div>`;
        } else {
            iconElement.outerHTML = `<img src="${icon}" alt="${card.dataset.name}" class="card-icon">`;
        }

        let savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools')) || defaultLinkedTools;
        const toolIndex = savedLinkedTools.findIndex(t => t.name === card.dataset.name);
        if (toolIndex !== -1) {
            savedLinkedTools[toolIndex].icon = icon;
            localStorage.setItem('tgLinkedTools', JSON.stringify(savedLinkedTools));
        }
        showResetNotification();
    }
}

function removeTool(btn) {
    const card = btn.closest('.card');
    const name = card.dataset.name;

    let savedLinkedTools = JSON.parse(localStorage.getItem('tgLinkedTools')) || defaultLinkedTools;
    savedLinkedTools = savedLinkedTools.filter(t => t.name !== name);
    localStorage.setItem('tgLinkedTools', JSON.stringify(savedLinkedTools));
    card.remove();
    showResetNotification();
}

// Settings Functions
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const container = document.querySelector('.container');
    const settingsIcon = document.querySelector('.settings-icon');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        container.style.filter = 'none';
        settingsIcon.classList.remove('active');
    } else {
        modal.style.display = 'flex';
        container.style.filter = 'blur(5px)';
        settingsIcon.classList.add('active');
    }
}

function changeTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme();
}

function applyTheme() {
    const theme = localStorage.getItem('theme') || 'system';
    const body = document.body;
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else if (theme === 'light') {
        body.classList.remove('dark-theme');
    } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }
}

function resetChanges() {
    localStorage.removeItem('tgSearchableTools');
    localStorage.removeItem('tgLinkedTools');
    loadTools();
}

function toggleAnimations(state) {
    localStorage.setItem('animations', state);
    applyAnimations();
}

function applyAnimations() {
    const state = localStorage.getItem('animations') || 'on';
    const container = document.querySelector('.container');
    if (state === 'off') {
        container.style.animation = 'none';
        document.querySelectorAll('.card, .searchable-button, .selected-tool').forEach(el => {
            el.style.transition = 'none';
        });
    } else {
        container.style.animation = 'fadeIn 0.6s ease-out';
        document.querySelectorAll('.card, .searchable-button, .selected-tool').forEach(el => {
            el.style.transition = '';
        });
    }
}

function clearSearchHistory() {
    alert('Search history cleared (placeholder functionality)');
}

function loadSettings() {
    applyTheme();
    applyAnimations();
    const themeSelect = document.getElementById('theme-select');
    const animationsSelect = document.getElementById('animations-select');
    themeSelect.value = localStorage.getItem('theme') || 'system';
    animationsSelect.value = localStorage.getItem('animations') || 'on';
}

// Initial load and event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadTools();
});
