import React from 'react';

export function AnswerOptions({ options, onSelect }) {
    if (!options || options.length === 0) return null;

    return (
        <div className="answer-container fade-in">
            {options.map((opt, index) => (
                <div
                    key={opt.id}
                    className="answer-bubble"
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    onClick={() => onSelect(opt.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelect(opt.id); }}
                >
                    {typeof opt.text === 'object' ? JSON.stringify(opt.text) : opt.text}
                </div>
            ))}
        </div>
    );
}
