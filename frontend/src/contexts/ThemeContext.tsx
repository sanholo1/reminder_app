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
    
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme && ['light', 'dark'].includes(savedTheme) ? savedTheme : 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    updateCSSVariables(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const updateCSSVariables = (currentTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${currentTheme}-theme`);
    
    if (currentTheme === 'light') {
      
      root.style.setProperty('--dark-base', '#fefefe');       
      root.style.setProperty('--dark-medium', '#f5f5f5');    
      root.style.setProperty('--dark-light', '#e8e8e8');     
      root.style.setProperty('--dark-accent', '#6b7280');    
      root.style.setProperty('--light-accent', '#4b5563');   
      root.style.setProperty('--light-accent-hover', '#6b7280');     
      root.style.setProperty('--light-accent-dark', '#374151');      
      root.style.setProperty('--light-accent-fresh', '#6366f1');     
      root.style.setProperty('--text-primary', '#374151');          
      root.style.setProperty('--text-secondary', '#ffffff');          
      root.style.setProperty('--background', '#fefefe');          
      root.style.setProperty('--overlay', 'rgba(254, 254, 254, 0.95)'); 
    } else {
      
      root.style.setProperty('--dark-base', '#0f1419');      
      root.style.setProperty('--dark-medium', '#1a2332');    
      root.style.setProperty('--dark-light', '#2a3441');     
      root.style.setProperty('--dark-accent', '#4a90e2');    
      root.style.setProperty('--light-accent', '#00d4aa');  
      root.style.setProperty('--light-accent-hover', '#26e6c7');     
      root.style.setProperty('--light-accent-dark', '#00a085');     
      root.style.setProperty('--light-accent-fresh', '#00ffcc');     
      root.style.setProperty('--text-primary', '#e8f4f8');          
      root.style.setProperty('--text-secondary', '#ffffff');          
      root.style.setProperty('--background', '#0f1419');          
      root.style.setProperty('--overlay', 'rgba(15, 20, 25, 0.8)'); 
    }
  };

  
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
