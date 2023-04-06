import React from 'react';

const Settings = ({ model, apiKey, onModelChange, onApiKeyChange }) => (
    <div className="settings">
        <label>
            Model:
            <select value={model} onChange={(e) => onModelChange(e.target.value)}>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="gpt-4">gpt-4-8k</option>
                <option value="gpt-4-32k">gpt-4-32k</option>
            </select>
        </label>
        <label>
            API Key:
            <input type="password" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} />
        </label>
    </div>
);

export default Settings;
