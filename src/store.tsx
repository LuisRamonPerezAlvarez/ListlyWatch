import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ListRecord, ThemeMode } from './types';
import {
  WATCH_DEMO_LISTS,
  loadWatchLists,
  loadWatchTheme,
  saveWatchLists,
  saveWatchTheme,
} from './storage';
import { WatchThemeContext, watchPalettes } from './theme';

interface WatchListContextValue {
  lists: ListRecord[];
  isLoading: boolean;
  hasError: boolean;
  lastToggledItem: { name: string; completed: boolean } | null;
  clearLastFeedback: () => void;
  toggleItem: (listId: string, itemId: string) => void;
  reloadDemo: () => void;
  clearAllLists: () => void;
  triggerSimulatedError: () => void;
  retryLoad: () => void;
}

const WatchListContext = createContext<WatchListContextValue | null>(null);

export function WatchProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<ListRecord[]>(WATCH_DEMO_LISTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [lastToggledItem, setLastToggledItem] = useState<{
    name: string;
    completed: boolean;
  } | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [storedLists, storedTheme] = await Promise.all([
          loadWatchLists(),
          loadWatchTheme(),
        ]);
        if (mounted) {
          setLists(storedLists);
          setThemeMode(storedTheme);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const changeTheme = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    saveWatchTheme(newMode);
  };

  const updateListsAndSave = (updater: (prev: ListRecord[]) => ListRecord[]) => {
    setLists(prev => {
      const next = updater(prev);
      saveWatchLists(next);
      return next;
    });
  };

  const toggleItem = (listId: string, itemId: string) => {
    let itemToggled: { name: string; completed: boolean } | null = null;
    const now = new Date().toISOString();

    updateListsAndSave(prev =>
      prev.map(list => {
        if (list.id !== listId) return list;
        return {
          ...list,
          items: list.items.map(item => {
            if (item.id !== itemId) return item;
            const nextCompleted = !item.completed;
            itemToggled = { name: item.name, completed: nextCompleted };
            return {
              ...item,
              completed: nextCompleted,
              completedAt: nextCompleted ? now : null,
            };
          }),
        };
      })
    );

    if (itemToggled) {
      setLastToggledItem(itemToggled);
    }
  };

  const clearLastFeedback = () => setLastToggledItem(null);

  const reloadDemo = () => {
    setHasError(false);
    updateListsAndSave(() => WATCH_DEMO_LISTS);
  };

  const clearAllLists = () => {
    updateListsAndSave(() => []);
  };

  const triggerSimulatedError = () => {
    setHasError(true);
  };

  const retryLoad = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      loadWatchLists().then(res => {
        setLists(res);
        setIsLoading(false);
      });
    }, 400);
  };

  const colors = themeMode === 'light' ? watchPalettes.light : watchPalettes.dark;

  const listValue = useMemo<WatchListContextValue>(
    () => ({
      lists,
      isLoading,
      hasError,
      lastToggledItem,
      clearLastFeedback,
      toggleItem,
      reloadDemo,
      clearAllLists,
      triggerSimulatedError,
      retryLoad,
    }),
    [lists, isLoading, hasError, lastToggledItem]
  );

  const themeValue = useMemo(
    () => ({
      mode: themeMode,
      setMode: changeTheme,
      colors,
    }),
    [themeMode, colors]
  );

  return (
    <WatchThemeContext.Provider value={themeValue}>
      <WatchListContext.Provider value={listValue}>
        {children}
      </WatchListContext.Provider>
    </WatchThemeContext.Provider>
  );
}

export function useWatchLists(): WatchListContextValue {
  const context = useContext(WatchListContext);
  if (!context) {
    throw new Error('useWatchLists debe usarse dentro de WatchProvider');
  }
  return context;
}
