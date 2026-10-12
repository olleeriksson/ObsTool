import { useSyncExternalStore } from "react";

export const labelVisibilityStorageKey = "obstool.labelVisibility";
export interface LabelVisibilityState {
    enabled: boolean;
    // Area IDs are constellation abbreviations or INTERSTELLARUM-<number>; choices remain independent.
    hiddenByConstellation: Record<string, string[]>;
}
const listeners = new Set<() => void>();

// Load browser-wide preferences without preventing the app from running when storage is unavailable.
function readState(): LabelVisibilityState {
    try {
        const value = JSON.parse(localStorage.getItem(labelVisibilityStorageKey) || "null");
        if (typeof value?.enabled === "boolean" && value.hiddenByConstellation && typeof value.hiddenByConstellation === "object") {
            const hiddenByConstellation = Object.fromEntries(Object.entries(value.hiddenByConstellation)
                .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every(key => typeof key === "string")));
            return { enabled: value.enabled, hiddenByConstellation };
        }
    } catch { /* Use defaults when storage is blocked or contains invalid JSON. */ }
    return { enabled: true, hiddenByConstellation: {} };
}
let state = readState();

// Return the stable snapshot required by React's external-store subscription.
export function getLabelVisibilityState() { return state; }

// Subscribe class components and hooks to preference changes anywhere in the app.
export function subscribeLabelVisibility(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

// Persist and publish the complete preference snapshot while retaining in-memory operation on storage failure.
function updateState(next: LabelVisibilityState) {
    state = next;
    try { localStorage.setItem(labelVisibilityStorageKey, JSON.stringify(state)); }
    catch { /* The current tab can still use the filter if browser storage is unavailable. */ }
    listeners.forEach(listener => listener());
}

// Enable or bypass all constellation filters without discarding individual hidden labels.
export function setLabelVisibilityEnabled(enabled: boolean) { updateState({ ...state, enabled }); }

// Toggle one catalog identity through the same operation used by the bulk-label button.
export function toggleHiddenLabel(constellation: string, key: string) {
    toggleHiddenLabels(constellation, [key]);
}

// Hide every selected label unless they are all hidden, in which case restore them; retain all other choices.
export function toggleHiddenLabels(constellation: string, keys: string[]) {
    if (!state.enabled || keys.length === 0) { return; }
    const id = constellation.toUpperCase();
    const hidden = new Set(state.hiddenByConstellation[id] || []);
    const selected = new Set(keys);
    const showAll = [...selected].every(key => hidden.has(key));
    for (const key of selected) {
        if (showAll) { hidden.delete(key); }
        else { hidden.add(key); }
    }
    updateState({ ...state, hiddenByConstellation: { ...state.hiddenByConstellation, [id]: [...hidden] } });
}

// Reset the current sky area only, retaining choices in every other constellation and chart.
export function resetHiddenLabels(constellation: string) {
    const hiddenByConstellation = { ...state.hiddenByConstellation };
    delete hiddenByConstellation[constellation.toUpperCase()];
    updateState({ ...state, hiddenByConstellation });
}

// Share the same live preference snapshot between the dialog and constellation statistics.
export function useLabelVisibility() {
    return useSyncExternalStore(subscribeLabelVisibility, getLabelVisibilityState);
}

// Reflect changes from another browser tab without writing them back and creating a storage-event loop.
window.addEventListener("storage", event => {
    if (event.key === labelVisibilityStorageKey || event.key === null) {
        state = readState();
        listeners.forEach(listener => listener());
    }
});
