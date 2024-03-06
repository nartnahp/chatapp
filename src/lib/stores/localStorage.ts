import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export let checkThemeMode: string | undefined;

if (browser) {
    checkThemeMode = localStorage.themeMode
}

export const themeMode = writable<string | undefined>(checkThemeMode);

if (browser) {
    themeMode.subscribe((value) => localStorage.themeMode = value)
}