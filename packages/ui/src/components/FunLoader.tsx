import React, { useState, useEffect } from 'react';
import './FunLoader.css';

const MESSAGES = [
    "Beeping and booping...",
    "Brewing digital coffee...",
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
            <div className="bot-container">
                <div className="bot-shadow"></div>
                <div className="bot-antenna-stem"></div>
                <div className="bot-antenna-bulb"></div>

                <div className="bot-body">
                    <div className="bot-face">
                        <div className="bot-eye"></div>
                        <div className="bot-eye"></div>
                        <div className="bot-mouth"></div>
                    </div>
                </div>
            </div>

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
