import React, { useState } from 'react';

const Settings = ({ settings, onSettingChange }) => {
    const [activeTab, setActiveTab] = useState('application');

    const renderTabs = () => (
        <div className="settings-tabs">
            <button
                className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
                onClick={() => setActiveTab('api')}
            >
                API Settings
            </button>
            <button
                className={`tab-btn ${activeTab === 'application' ? 'active' : ''}`}
                onClick={() => setActiveTab('application')}
            >
                Application Settings
            </button>

        </div>
    );

    const renderApplicationSettings = () => (
        <div className="settings-section">
            <h4>Backend URL:</h4>
            <input
                type="text"
                size={50}
                value={settings.backendUrl}
                onChange={(e) =>
                    onSettingChange({ ...settings, backendUrl: e.target.value })
                }
            />

            <h4>Image Command:</h4>
            <input
                type="text"
                size={50}
                value={settings.imageCommand}
                onChange={(e) =>
                    onSettingChange({ ...settings, imageCommand: e.target.value })
                }
            />

            <h4>Timeout Interval:</h4>
            <input
                type="number"
                size={50}
                value={settings.timeoutInterval}
                onChange={(e) =>
                    onSettingChange({ ...settings, timeoutInterval: e.target.value })
                }
            />
        </div>
    );

    const renderAPISettings = () => (
        <div className="settings-section">
            <h4>Model:</h4>
            <div className="select-wrapper">
                <select
                    value={settings.model}
                    onChange={(e) => onSettingChange({ ...settings, model: e.target.value })}
                >
                    <option value="gpt-3.5-turbo-0301">gpt-3.5-turbo-0301</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="gpt-4">gpt-4-8k</option>
                    <option value="gpt-4-32k">gpt-4-32k</option>
                </select>
            </div>

            <h4>API Key:</h4>
            <input
                type="text"
                size={50}
                value={settings.apiKey}
                onChange={(e) => onSettingChange({ ...settings, apiKey: e.target.value })}
            />
        </div>
    );

    return (
        <div className="settings">
            {renderTabs()}
            {activeTab === 'application' && renderApplicationSettings()}
            {activeTab === 'api' && renderAPISettings()}
        </div>
    );
};

export default Settings;
