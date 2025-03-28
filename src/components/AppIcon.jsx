import React from 'react';

export const AppIcon = ({ app }) => (
    <div className="app-icon">
        <div className="app-icon-image">
            <img src={chrome.runtime.getURL(app.icon)} alt={app.name} />
        </div>
        <div className="app-icon-name">{app.name}</div>
    </div>
); 