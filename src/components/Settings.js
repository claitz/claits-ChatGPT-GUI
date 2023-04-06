const Settings = ({ model, apiKey, onModelChange, onApiKeyChange }) => {

    return (
        <div className="settings">

            <h4>Model:</h4>
            <select value={model} onChange={(e) => onModelChange(e.target.value)}>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="gpt-4">gpt-4-8k</option>
                <option value="gpt-4-32k">gpt-4-32k</option>
            </select>

            <h4>API Key:</h4>
            <input type="text" size={50} value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} />

        </div>
    );
};

export default Settings;
