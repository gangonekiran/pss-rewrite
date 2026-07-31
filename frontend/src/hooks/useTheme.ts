import { useLocalStorage } from './useLocalStorage';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return {
    theme,
    setTheme,
    toggleTheme: () =>
      setTheme(theme === 'light' ? 'dark' : 'light'),
  };
}
