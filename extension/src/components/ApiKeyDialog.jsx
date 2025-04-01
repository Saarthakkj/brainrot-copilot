import React, { useState } from 'react';

const ApiKeyDialog = ({ onSave, onCancel }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            setError('API key is required');
            return;
        }

        // Validate the API key by trying to fetch a JWT token
        try {
            const response = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    ttl: 60, // Short TTL just for validation
                }),
            });

            if (!response.ok) {
                setError('Invalid API key. Please check and try again.');
                return;
            }

            // API key is valid, save it
            onSave(apiKey);
        } catch (err) {
            setError('Network error: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[1000000] backdrop-blur-sm flex items-center justify-center pointer-events-auto">
            <div className="bg-black/40 text-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-white/20 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-2">API Key Required</h2>
                <p className="mb-4 text-gray-300">Please enter your Speechmatics API key to enable captions.</p>
                <p className="text-sm text-gray-400 mb-4">
                    New to Speechmatics? <a href="https://portal.speechmatics.com/manage-access/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Get an API key</a>
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoComplete="off"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="py-2 px-4 rounded-lg bg-black/40 text-white border border-white/20 hover:bg-black/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 rounded-lg bg-blue-600/80 text-white hover:bg-blue-500 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyDialog; 