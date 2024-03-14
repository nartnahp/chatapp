import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export let checkThemeMode: string | undefined;

if (browser) {
    checkThemeMode = localStorage.currentTheme
}

export const currentTheme = writable<string | undefined>(checkThemeMode);

if (browser) {
    currentTheme.subscribe((value) => localStorage.currentTheme = value)
}