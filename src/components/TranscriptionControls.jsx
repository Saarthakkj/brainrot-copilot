import React from 'react';

const TranscriptionControls = ({
    isListening,
    startListening,
    stopListening,
    error
}) => {
    return (
        <div className="w-full flex flex-col items-center mb-4">
            {error && (
                <div className="bg-red-800 text-white p-2 rounded-md mb-4 w-full text-center">
                    Error: {error}
                </div>
            )}

            <div className="flex flex-col items-center justify-center w-full">
                {isListening && (
                    <div className="flex items-center mb-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-green-500 text-sm">Transcription active</span>
                    </div>
                )}
                <button
                    onClick={stopListening}
                    className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-medium text-lg"
                >
                    Stop Transcription
                </button>
            </div>
        </div>
    );
};

export default TranscriptionControls; 