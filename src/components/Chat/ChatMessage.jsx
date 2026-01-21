import { useState } from 'react';

export function ChatMessage({ message, onShowTooltip }) {
    const isBot = message.type === 'bot';
    const text = typeof message.text === 'object'
        ? (message.text.text || JSON.stringify(message.text)) // Attempt to get .text if it's the wrapped object issue
        : message.text;

    if (isBot) {
        return (
            <div className={`chat-message fade-in ${message.tooltip ? 'has-tooltip' : ''}`}>
                {message.tooltip && (
                    <span
                        className="tooltip-icon"
                        onClick={(e) => { e.stopPropagation(); onShowTooltip(message.tooltip, e.target); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') onShowTooltip(message.tooltip, e.target); }}
                    >
                        <i className="fas fa-question-circle"></i>
                    </span>
                )}
                <span>{text}</span>
            </div>
        );
    }

    // User Message
    return (
        <div className="answer-container">
            <div className="answer-bubble selected fade-in">
                {text}
            </div>
        </div>
    );
}
