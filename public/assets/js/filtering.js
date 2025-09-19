const FILTER_OPTIONS = {
    projects: ['All', 'Mobile', 'ML', 'Web', 'Data', 'Tools'],
    experience: ['All', 'AI/ML', 'Software', 'IT Support'],
};
const QUERY_KEYS = {
    projects: 'p',
    experience: 'e',
};
const STORAGE_KEYS = {
    projects: 'filters:projects',
    experience: 'filters:experience',
};
const interactiveSelector = 'a[href], button, input, textarea, select, summary, details, [tabindex]';
const warnOnce = (() => {
    const messages = new Set();
    return (message) => {
        if (messages.has(message))
            return;
        messages.add(message);
        // eslint-disable-next-line no-console
        console.warn(message);
    };
})();
const supportsInert = typeof window !== 'undefined' && typeof document !== 'undefined' && 'inert' in document.createElement('div');
const allowedValues = {
    projects: new Set(FILTER_OPTIONS.projects.filter(value => value !== 'All')),
    experience: new Set(FILTER_OPTIONS.experience.filter(value => value !== 'All')),
};
const tagCache = new WeakMap();
const state = {
    projects: { selected: new Set(), total: 0 },
    experience: { selected: new Set(), total: 0 },
};
const sections = new Map();
let initialised = false;
let domReadyHooked = false;
const splitValues = (value) => {
    if (!value)
        return [];
    return value
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);
};
const readLocalStorage = (id) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEYS[id]);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    catch (error) {
        warnOnce(`Failed to parse saved filters for ${id}: ${error.message}`);
        return [];
    }
};
const writeLocalStorage = (id, values) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(STORAGE_KEYS[id], JSON.stringify(values));
    }
    catch (error) {
        warnOnce(`Unable to persist filters for ${id}: ${error.message}`);
    }
};
const normaliseSelection = (id, values) => {
    const allowed = allowedValues[id];
    return values.filter(value => {
        if (!allowed.has(value)) {
            if (value !== 'All') {
                warnOnce(`Ignoring unsupported filter "${value}" for ${id}.`);
            }
            return false;
        }
        return true;
    });
};
const parseDatasetTags = (element) => {
    const cached = tagCache.get(element);
    if (cached)
        return cached;
    const raw = element.dataset.tags || '';
    const values = splitValues(raw).map(token => token.trim());
    tagCache.set(element, values);
    return values;
};
const matchers = {
    projects: (item, selected) => {
        if (selected.size === 0)
            return true;
        const tags = parseDatasetTags(item);
        if (!tags.length)
            return false;
        return Array.from(selected).some(tag => tags.includes(tag));
    },
    experience: (item, selected) => {
        if (selected.size === 0)
            return true;
        const category = (item.dataset.category || '').trim();
        if (!category) {
            warnOnce('Experience item missing category attribute.');
            return selected.size === 0;
        }
        return selected.has(category);
    },
};
const disableInteractiveDescendants = (element) => {
    if (supportsInert) {
        element.inert = true;
    }
    const descendants = element.querySelectorAll(interactiveSelector);
    descendants.forEach(descendant => {
        if (descendant.dataset.filterPrevTabindex !== undefined)
            return;
        const previous = descendant.getAttribute('tabindex');
        descendant.dataset.filterPrevTabindex = previous === null ? '' : previous;
        descendant.setAttribute('tabindex', '-1');
    });
};
const restoreInteractiveDescendants = (element) => {
    if (supportsInert) {
        element.inert = false;
    }
    const descendants = element.querySelectorAll('[data-filter-prev-tabindex]');
    descendants.forEach(descendant => {
        const previous = descendant.dataset.filterPrevTabindex;
        if (previous === undefined)
            return;
        delete descendant.dataset.filterPrevTabindex;
        if (previous === '') {
            descendant.removeAttribute('tabindex');
        }
        else {
            descendant.setAttribute('tabindex', previous);
        }
    });
};
const hideItem = (element) => {
    element.setAttribute('hidden', '');
    element.setAttribute('aria-hidden', 'true');
    element.classList.add('is-hidden');
    if (element.dataset.filterPrevRootTabindex === undefined) {
        const previous = element.getAttribute('tabindex');
        element.dataset.filterPrevRootTabindex = previous === null ? '' : previous;
    }
    element.setAttribute('tabindex', '-1');
    if (element.dataset.filterPrevDisplay === undefined) {
        element.dataset.filterPrevDisplay = element.style.display || '';
    }
    element.style.display = 'none';
    disableInteractiveDescendants(element);
};
const showItem = (element) => {
    element.removeAttribute('hidden');
    element.removeAttribute('aria-hidden');
    element.classList.remove('is-hidden');
    const previousTabindex = element.dataset.filterPrevRootTabindex;
    if (previousTabindex !== undefined) {
        delete element.dataset.filterPrevRootTabindex;
        if (previousTabindex === '') {
            element.removeAttribute('tabindex');
        }
        else {
            element.setAttribute('tabindex', previousTabindex);
        }
    }
    else {
        element.removeAttribute('tabindex');
    }
    if (element.dataset.filterPrevDisplay !== undefined) {
        const previousDisplay = element.dataset.filterPrevDisplay;
        delete element.dataset.filterPrevDisplay;
        element.style.display = previousDisplay;
    }
    else {
        element.style.removeProperty('display');
    }
    restoreInteractiveDescendants(element);
};
const setButtonPressedState = (button, pressed) => {
    button.setAttribute('aria-pressed', String(pressed));
    if (pressed) {
        button.classList.add('is-active');
    }
    else {
        button.classList.remove('is-active');
    }
};
const updateToolbarButtons = (dom, selected) => {
    dom.buttons.forEach(button => {
        const value = button.dataset.filterValue;
        if (!value)
            return;
        if (value === 'All') {
            setButtonPressedState(button, selected.size === 0);
        }
        else {
            setButtonPressedState(button, selected.has(value));
        }
    });
};
const setToolbarFocus = (dom) => {
    const focusableIndex = dom.buttons.findIndex(btn => btn.getAttribute('tabindex') === '0');
    const defaultIndex = focusableIndex >= 0 ? focusableIndex : dom.buttons.findIndex(btn => btn.dataset.filterValue === 'All');
    const targetIndex = defaultIndex >= 0 ? defaultIndex : 0;
    dom.buttons.forEach((button, index) => {
        button.tabIndex = index === targetIndex ? 0 : -1;
    });
};
const moveToolbarFocus = (dom, direction) => {
    const currentIndex = dom.buttons.findIndex(button => button.tabIndex === 0);
    if (currentIndex === -1)
        return;
    const total = dom.buttons.length;
    let nextIndex = (currentIndex + direction + total) % total;
    dom.buttons.forEach((button, index) => {
        button.tabIndex = index === nextIndex ? 0 : -1;
    });
    dom.buttons[nextIndex]?.focus();
};
const buildChip = (value) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'filter-chip';
    chip.dataset.filterRemove = value;
    chip.setAttribute('aria-label', `Remove filter ${value}`);
    chip.textContent = value;
    return chip;
};
const updateChips = (dom, selected) => {
    if (!dom.chipsWrapper)
        return;
    const wrapper = dom.chipsWrapper;
    const clearButton = wrapper.querySelector('[data-filter-clear]');
    wrapper.querySelectorAll('[data-filter-remove]').forEach(node => node.remove());
    if (selected.size === 0) {
        wrapper.setAttribute('hidden', '');
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.classList.add('is-hidden');
        return;
    }
    Array.from(selected).forEach(value => {
        const chip = buildChip(value);
        if (clearButton) {
            wrapper.insertBefore(chip, clearButton);
        }
        else {
            wrapper.appendChild(chip);
        }
    });
    wrapper.removeAttribute('hidden');
    wrapper.removeAttribute('aria-hidden');
    wrapper.classList.remove('is-hidden');
};
const updateCount = (dom, visible) => {
    if (!dom.countLabel)
        return;
    const id = dom.id;
    const total = state[id].total;
    dom.countLabel.textContent = `Showing ${visible} of ${total}`;
};
const setContainerVisibility = (element, visible) => {
    if (!element)
        return;
    if (visible) {
        element.removeAttribute('hidden');
        element.removeAttribute('aria-hidden');
        element.classList.remove('is-hidden');
    }
    else {
        element.setAttribute('hidden', '');
        element.setAttribute('aria-hidden', 'true');
        element.classList.add('is-hidden');
    }
};
const toggleEmptyState = (dom, visible) => {
    const hasResults = visible > 0;
    setContainerVisibility(dom.listContainer, hasResults);
    setContainerVisibility(dom.emptyState, !hasResults);
};
const applyFilters = (dom) => {
    const selected = state[dom.id].selected;
    const matcher = matchers[dom.id];
    let visibleCount = 0;
    dom.items.forEach(item => {
        const matches = matcher(item, selected);
        if (matches) {
            showItem(item);
            visibleCount += 1;
        }
        else {
            hideItem(item);
        }
    });
    updateCount(dom, visibleCount);
    updateToolbarButtons(dom, selected);
    updateChips(dom, selected);
    toggleEmptyState(dom, visibleCount);
};
const persistState = () => {
    Object.keys(state).forEach(id => {
        const values = Array.from(state[id].selected);
        writeLocalStorage(id, values);
    });
};
let urlUpdateTimer;
const scheduleUrlUpdate = () => {
    if (typeof window === 'undefined')
        return;
    if (urlUpdateTimer) {
        window.clearTimeout(urlUpdateTimer);
    }
    urlUpdateTimer = window.setTimeout(() => {
        const url = new URL(window.location.href);
        Object.keys(state).forEach(id => {
            const key = QUERY_KEYS[id];
            const values = Array.from(state[id].selected);
            if (values.length) {
                url.searchParams.set(key, values.join(','));
            }
            else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }, 150);
};
const handleSelectionChange = (dom) => {
    applyFilters(dom);
    persistState();
    scheduleUrlUpdate();
};
const clearSelection = (dom) => {
    const selected = state[dom.id].selected;
    if (selected.size === 0)
        return;
    selected.clear();
    handleSelectionChange(dom);
};
const toggleValue = (dom, value) => {
    const selected = state[dom.id].selected;
    if (value === 'All') {
        clearSelection(dom);
        return;
    }
    if (selected.has(value)) {
        selected.delete(value);
    }
    else {
        selected.add(value);
    }
    handleSelectionChange(dom);
};
const bindToolbarEvents = (dom) => {
    dom.toolbar.addEventListener('click', event => {
        const target = event.target.closest('button[data-filter-value]');
        if (!target)
            return;
        const value = target.dataset.filterValue;
        if (!value)
            return;
        toggleValue(dom, value);
    });
    dom.toolbar.addEventListener('keydown', event => {
        const key = event.key;
        if (key === 'ArrowRight') {
            event.preventDefault();
            moveToolbarFocus(dom, 1);
        }
        else if (key === 'ArrowLeft') {
            event.preventDefault();
            moveToolbarFocus(dom, -1);
        }
    });
    dom.toolbar.addEventListener('focusin', event => {
        const target = event.target;
        if (!target.matches('button[data-filter-value]'))
            return;
        dom.buttons.forEach(button => {
            button.tabIndex = button === target ? 0 : -1;
        });
    });
};
const bindChips = (dom) => {
    if (!dom.summary)
        return;
    dom.summary.addEventListener('click', event => {
        const target = event.target;
        const removeButton = target.closest('button[data-filter-remove]');
        if (removeButton) {
            const value = removeButton.dataset.filterRemove;
            if (!value)
                return;
            state[dom.id].selected.delete(value);
            handleSelectionChange(dom);
            return;
        }
        const clearButton = target.closest('button[data-filter-clear]');
        if (clearButton) {
            clearSelection(dom);
        }
    });
};
const bindClearButtons = (dom) => {
    dom.clearButtons.forEach(button => {
        button.addEventListener('click', () => clearSelection(dom));
    });
};
const initialiseSection = (element) => {
    const idAttr = element.dataset.filterSection;
    if (!idAttr || !(idAttr in FILTER_OPTIONS))
        return;
    const toolbar = element.querySelector('[data-filter-toolbar]');
    const listContainer = element.querySelector('[data-filter-list]');
    const buttons = toolbar
        ? Array.from(toolbar.querySelectorAll('button[data-filter-value]'))
        : [];
    if (!toolbar || !buttons.length || !listContainer) {
        return;
    }
    const sectionDom = {
        id: idAttr,
        toolbar,
        buttons,
        summary: element.querySelector('[data-filter-summary]'),
        countLabel: element.querySelector('[data-filter-count]'),
        chipsWrapper: element.querySelector('[data-filter-chips]'),
        clearButtons: Array.from(element.querySelectorAll('button[data-filter-clear]')),
        listContainer,
        items: Array.from(listContainer.querySelectorAll('[data-filter-item]')),
        emptyState: element.querySelector('[data-filter-empty]'),
    };
    sectionDom.items.forEach((item, index) => {
        if (!item.dataset.index) {
            item.dataset.index = String(index);
        }
    });
    sections.set(idAttr, sectionDom);
    state[idAttr].total = sectionDom.items.length;
    bindToolbarEvents(sectionDom);
    bindChips(sectionDom);
    bindClearButtons(sectionDom);
    setToolbarFocus(sectionDom);
    applyFilters(sectionDom);
};
const readInitialState = () => {
    if (typeof window === 'undefined')
        return;
    const params = new URLSearchParams(window.location.search);
    Object.keys(state).forEach(id => {
        const fromQuery = normaliseSelection(id, splitValues(params.get(QUERY_KEYS[id])));
        const initial = fromQuery.length ? fromQuery : normaliseSelection(id, readLocalStorage(id));
        const selected = state[id].selected;
        selected.clear();
        initial.forEach(value => selected.add(value));
    });
};
const refreshAll = () => {
    sections.forEach(dom => applyFilters(dom));
};
const runInitialisation = () => {
    if (initialised)
        return;
    initialised = true;
    readInitialState();
    const sectionElements = document.querySelectorAll('[data-filter-section]');
    sectionElements.forEach(initialiseSection);
    refreshAll();
};
export const initFiltering = () => {
    if (typeof window === 'undefined')
        return;
    if (initialised)
        return;
    if (document.readyState === 'loading') {
        if (!domReadyHooked) {
            window.addEventListener('DOMContentLoaded', runInitialisation, { once: true });
            domReadyHooked = true;
        }
        return;
    }
    runInitialisation();
};
if (typeof window !== 'undefined') {
    initFiltering();
}
