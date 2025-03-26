import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [count, setCount] = useState<number>(0);

  // Example of using Chrome API
  useEffect(() => {
    // Access current tab URL (would work when extension has the required permissions)
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
        }
      });
    }

    // Example of using Chrome storage
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["count"], (result) => {
        if (result.count !== undefined) {
          setCount(result.count as number);
        }
      });
    }
  }, []);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);

    // Save to Chrome storage
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ count: newCount });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Chrome Extension</h1>
      </header>

      <main>
        <div className="card">
          <h2>Current Count: {count}</h2>
          <button onClick={handleIncrement}>Increment Count</button>
        </div>

        {currentUrl && (
          <div className="info-card">
            <h3>Current URL:</h3>
            <p className="url">{currentUrl}</p>
          </div>
        )}
      </main>

      <footer>
        <p>Built with React + Vite</p>
      </footer>
    </div>
  );
}

export default App;
