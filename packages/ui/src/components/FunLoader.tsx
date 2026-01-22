import React, { useState, useEffect } from 'react';
import './FunLoader.css';

const MESSAGES = [
    "Getting things ready...",
    "Beep boop...",
    "Calculating meaning of life...",
    "Whoa! This is taking really long...",
    "Loading more!?",
    "Please let this be checked out with a developer",
    ""
];

export const FunLoader = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fun-loader-container">
            {/* Bouncing Bot Animation */}
            {/* Bot Animation Removed */}

            {/* Typing Text Effect */}
            <div className="fun-loader-text">
                <p key={messageIndex}>
                    {MESSAGES[messageIndex]}
                </p>
            </div>

            {/* Loading Bar */}
            <div className="fun-loading-bar-container">
                <div className="fun-loading-bar-fill"></div>
            </div>
        </div>
    );
};
