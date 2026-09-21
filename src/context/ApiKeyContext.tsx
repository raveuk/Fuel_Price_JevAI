import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasServerKey: boolean;
  isSavedLocal: boolean;
  effectiveKeyPresent: boolean;
}

const STORAGE_KEY = 'jev_api_key';

const ApiKeyContext = createContext<ApiKeyContextType>({
  apiKey: '',
  setApiKey: () => {},
  clearApiKey: () => {},
  hasServerKey: false,
  isSavedLocal: false,
  effectiveKeyPresent: false,
});

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [isSavedLocal, setIsSavedLocal] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });

  // Check backend /api/health to see if TYPESAFE_API_KEY is configured in the environment
  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && typeof data.hasEnvKey === 'boolean') {
          setHasServerKey(data.hasEnvKey);
        }
      })
      .catch(() => {
        // Silently fallback if health endpoint unreachable
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const setApiKey = (newKey: string) => {
    const trimmed = newKey.trim();
    setApiKeyState(newKey);
    try {
      if (trimmed.length > 0) {
        localStorage.setItem(STORAGE_KEY, trimmed);
        setIsSavedLocal(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setIsSavedLocal(false);
      }
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  };

  const clearApiKey = () => {
    setApiKeyState('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not remove from localStorage:', e);
    }
    setIsSavedLocal(false);
  };

  const effectiveKeyPresent = hasServerKey || apiKey.trim().length > 0;

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        hasServerKey,
        isSavedLocal,
        effectiveKeyPresent,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => useContext(ApiKeyContext);
