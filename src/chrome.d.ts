/// <reference types="chrome"/>

// Type definitions for Chrome extension APIs
// This is a simplified version - for complete definitions, use @types/chrome

interface Chrome {
  tabs: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: { url?: string }[]) => void
    ) => void;
    onUpdated: {
      addListener: (
        callback: (
          tabId: number,
          changeInfo: { status?: string },
          tab: { url?: string }
        ) => void
      ) => void;
    };
  };
  storage: {
    local: {
      get: <T>(
        keys: string[],
        callback: (result: { [key: string]: T }) => void
      ) => void;
      set: (items: { [key: string]: unknown }) => void;
    };
  };
  runtime: {
    onInstalled: {
      addListener: (callback: () => void) => void;
    };
    onConnect: {
      addListener: (
        callback: (port: {
          onDisconnect: { addListener: (callback: () => void) => void };
        }) => void
      ) => void;
    };
    getURL: (path: string) => string;
  };
}

// Add Chrome to the global namespace
declare const chrome: Chrome;

declare namespace chrome {
  const runtime: {
    getURL: (path: string) => string;
  };
}

// Extend Element interface to include style property
interface Element {
  style: CSSStyleDeclaration;
}

// Extend Node interface to include style property
interface Node {
  style?: CSSStyleDeclaration;
}
