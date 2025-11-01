/**
 * Theme management utilities
 * Handles dark mode state and persistence
 */

/**
 * Get the initial theme preference
 * Checks localStorage first, then falls back to system preference
 */
export function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return savedTheme === 'dark' || (!savedTheme && prefersDark);
}

/**
 * Apply theme to the document
 * Updates both the DOM and localStorage
 */
export function setTheme(isDark: boolean): void {
  if (typeof window === 'undefined') return;

  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

/**
 * Toggle between light and dark theme
 * Returns the new theme state
 */
export function toggleTheme(currentIsDark: boolean): boolean {
  const newIsDark = !currentIsDark;
  setTheme(newIsDark);
  return newIsDark;
}
