import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Sprawdź zapisany motyw w localStorage lub domyślnie ciemny
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme && ['light', 'dark'].includes(savedTheme) ? savedTheme : 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    // Aktualizuj CSS custom properties
    updateCSSVariables(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const updateCSSVariables = (currentTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Update body class for theme-specific styles
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${currentTheme}-theme`);
    
    if (currentTheme === 'light') {
      // Light theme colors - Softer, more subtle contrasts
      root.style.setProperty('--cuba-cola-dark', '#fefefe');      // Almost white base
      root.style.setProperty('--cuba-cola-medium', '#f5f5f5');    // Very light gray
      root.style.setProperty('--cuba-cola-light', '#e8e8e8');     // Light gray
      root.style.setProperty('--cuba-cola-golden', '#6b7280');    // Muted gray accent
      root.style.setProperty('--cuba-lime', '#4b5563');           // Muted dark gray
      root.style.setProperty('--cuba-lime-light', '#6b7280');     // Medium gray
      root.style.setProperty('--cuba-lime-dark', '#374151');      // Darker gray
      root.style.setProperty('--cuba-lime-fresh', '#6366f1');     // Subtle blue accent
      root.style.setProperty('--cuba-cream', '#374151');          // Soft dark text
      root.style.setProperty('--cuba-white', '#ffffff');          // Pure white
      root.style.setProperty('--cuba-black', '#fefefe');          // Almost white background
      root.style.setProperty('--cuba-transparent', 'rgba(254, 254, 254, 0.95)'); // Almost white transparent
    } else {
      // Dark theme colors - Dark Navy palette
      root.style.setProperty('--cuba-cola-dark', '#0f1419');      // Dark navy base
      root.style.setProperty('--cuba-cola-medium', '#1a2332');    // Medium navy
      root.style.setProperty('--cuba-cola-light', '#2a3441');     // Light navy
      root.style.setProperty('--cuba-cola-golden', '#4a90e2');    // Blue accent
      root.style.setProperty('--cuba-lime', '#00d4aa');           // Teal accent
      root.style.setProperty('--cuba-lime-light', '#26e6c7');     // Light teal
      root.style.setProperty('--cuba-lime-dark', '#00a085');      // Dark teal
      root.style.setProperty('--cuba-lime-fresh', '#00ffcc');     // Bright teal
      root.style.setProperty('--cuba-cream', '#e8f4f8');          // Light text
      root.style.setProperty('--cuba-white', '#ffffff');          // Pure white
      root.style.setProperty('--cuba-black', '#0f1419');          // Dark navy background
      root.style.setProperty('--cuba-transparent', 'rgba(15, 20, 25, 0.8)'); // Navy transparent
    }
  };

  // Inicjalizuj CSS variables przy pierwszym renderze
  useEffect(() => {
    updateCSSVariables(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
