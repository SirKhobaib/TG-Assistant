// Ensure Telegram WebApp is available
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    const mainButton = window.Telegram.WebApp.MainButton;
    mainButton.setText('Back to Home');
    mainButton.setParams({ color: '#007bff', text_color: '#fff' });
    mainButton.onClick(() => window.location.reload());
    mainButton.show();
} else {
    console.error("Telegram WebApp is not available");
}

// Define tools with icon classes
const searchableTools = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'fas fa-search' },
    { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: 'fas fa-play' },
    { name: 'Weather', url: 'https://www.accuweather.com/en/search-locations?query=', icon: 'fas fa-cloud' }
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
    let savedLinkedTools;
    try {
        savedLinkedTools = JSON.parse(localStorage.getItem('tgTools'));
    } catch (e) {
        console.error('Failed to load linked tools:', e);
        savedLinkedTools = null;
    }

    const linkedTools = (savedLinkedTools && savedLinkedTools.length > 0) ? savedLinkedTools : defaultLinkedTools;
    localStorage.setItem('tgTools', JSON.stringify(linkedTools));

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

    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.removeEventListener('click', toggleMenuHandler);
        btn.addEventListener('click', toggleMenuHandler);
    });

    loadSettings();
}

function toggleMenuHandler(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = btn.nextElementSibling;
    document.querySelectorAll('.menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function createSearchableButton(name, url, iconClass) {
    const button = document.createElement('div');
    button.className = 'searchable-button';
    button.dataset.name = name;
    button.dataset.url = url;
    button.innerHTML = `<i class="${iconClass}"></i>`;
    button.onclick = () => selectTool(name, url, iconClass);
    return button;
}

function createLinkedCard(name, url, icon) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.name = name;
    card.dataset.url = url;
    card.dataset.icon = icon;
    switch (name) {
        case 'Calculator': card.id = 'iph_calculator'; break;
        case 'ChatGPT': card.id = 'iph_chatgpt'; break;
        case 'Notes': card.id = 'iph_notes'; break;
        case 'Maps': card.id = 'iph_maps'; break;
        case 'Translate': card.id = 'iph_translate'; break;
        default: card.id = '';
    }
    const iconSrc = icon || 'https://via.placeholder.com/48';
    card.innerHTML = `
        <img src="${iconSrc}" alt="${name}" class="card-icon">
        <span class="tool-name">${name}</span>
        <button class="open-btn" onclick="openLink('${url}')">Open</button>
        <button class="menu-btn">⋮</button>
        <div class="menu" style="display: none;">
            <button onclick="editToolName(this)"><i class="fas fa-pencil-alt"></i> Edit Name</button>
            <button onclick="editToolUrl(this)"><i class="fas fa-link"></i> Edit URL</button>
            <button onclick="editToolIcon(this)"><i class="fas fa-image"></i> Edit Icon URL</button>
            <button onclick="removeTool(this)"><i class="fas fa-trash"></i> Remove</button>
        </div>
    `;
    return card;
}

function addAddButton() {
    const container = document.getElementById('linked-cards');
    const addCard = document.createElement('div');
    addCard.className = 'card add-card';
    addCard.innerHTML = `
        <div class="icon-placeholder"></div>
        <span class="tool-name">Add+</span>
        <button class="open-btn" onclick="addTool()">Add</button>
    `;
    container.appendChild(addCard);
}

function openLink(url) {
    if (window.Telegram && window.Telegram.WebApp && url) {
        window.Telegram.WebApp.openLink(url);
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    const selectedTool = document.getElementById('selected-tool');
    const url = selectedTool.dataset.url;
    const searchUrl = `${url}${encodeURIComponent(query)}`;
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(searchUrl);
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
        input.placeholder = 'Enter Your city...'; // Custom placeholder for Weather
    } else {
        input.placeholder = `Search ${name}...`; // Default for other tools
    }
}

function addTool() {
    const name = prompt('Enter tool name:');
    const url = prompt('Enter tool URL (e.g., https://example.com):');
    const icon = prompt('Enter icon URL (optional, e.g., https://example.com/icon.png):') || 'https://via.placeholder.com/48';
    if (!name || !url || !url.match(/^https?:\/\/[^\s]+$/)) {
        alert('Please enter a valid name and URL starting with http:// or https://');
        return;
    }

    let savedTools = JSON.parse(localStorage.getItem('tgTools')) || defaultLinkedTools;
    savedTools.push({ name, url, icon });
    localStorage.setItem('tgTools', JSON.stringify(savedTools));
    addToolToDOM(name, url, icon);
    showResetNotification();
}

function addToolToDOM(name, url, icon) {
    const container = document.getElementById('linked-cards');
    const card = createLinkedCard(name, url, icon);
    container.insertBefore(card, container.lastElementChild);
    card.querySelector('.menu-btn')?.addEventListener('click', toggleMenuHandler);
}

function editToolName(btn) {
    const card = btn.closest('.card');
    const oldName = card.dataset.name;
    const newName = prompt('Enter new name:', oldName);
    if (!newName) return;

    card.dataset.name = newName;
    card.querySelector('.tool-name').textContent = newName;

    let savedTools = JSON.parse(localStorage.getItem('tgTools')) || defaultLinkedTools;
    const toolIndex = savedTools.findIndex(t => t.name === oldName);
    if (toolIndex !== -1) {
        savedTools[toolIndex].name = newName;
        localStorage.setItem('tgTools', JSON.stringify(savedTools));
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
    card.querySelector('.open-btn').setAttribute('onclick', `openLink('${newUrl}')`);

    let savedTools = JSON.parse(localStorage.getItem('tgTools')) || defaultLinkedTools;
    const toolIndex = savedTools.findIndex(t => t.name === card.dataset.name);
    if (toolIndex !== -1) {
        savedTools[toolIndex].url = newUrl;
        localStorage.setItem('tgTools', JSON.stringify(savedTools));
    }
    showResetNotification();
}

function editToolIcon(btn) {
    const card = btn.closest('.card');
    const oldIcon = card.dataset.icon;
    const newIcon = prompt('Enter new icon URL (optional):', oldIcon) || 'https://via.placeholder.com/48';
    card.dataset.icon = newIcon;
    card.querySelector('.card-icon').src = newIcon;

    let savedTools = JSON.parse(localStorage.getItem('tgTools')) || defaultLinkedTools;
    const toolIndex = savedTools.findIndex(t => t.name === card.dataset.name);
    if (toolIndex !== -1) {
        savedTools[toolIndex].icon = newIcon;
        localStorage.setItem('tgTools', JSON.stringify(savedTools));
    }
    showResetNotification();
}

function removeTool(btn) {
    const card = btn.closest('.card');
    const name = card.dataset.name;

    let savedTools = JSON.parse(localStorage.getItem('tgTools')) || defaultLinkedTools;
    savedTools = savedTools.filter(t => t.name !== name);
    localStorage.setItem('tgTools', JSON.stringify(savedTools));
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
    localStorage.removeItem('tgTools');
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
        document.querySelectorAll('.card, .searchable-button, .open-btn, .selected-tool').forEach(el => {
            el.style.transition = 'none';
        });
    } else {
        container.style.animation = 'fadeIn 0.6s ease-out';
        document.querySelectorAll('.card, .searchable-button, .open-btn, .selected-tool').forEach(el => {
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

document.addEventListener('click', (e) => {
    document.querySelectorAll('.menu').forEach(menu => {
        const menuBtn = menu.previousElementSibling;
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.style.display = 'none';
        }
    });
});
