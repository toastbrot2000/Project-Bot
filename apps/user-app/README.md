# User App (Remote)

The **User App** is a specialized Micro-Frontend designed for conducting user assessments via a chat-like interface.

## Features
- **Interactive Chat**: Guided question flows using `questions.xml` logic.
- **Dynamic Styling**: Styled answers bubbles and smooth animations.
- **State Management**: Tracks user history and answers locally.

## Integration
This app exposes a `./Main` component which is consumed by the Host application.
It runs standalone on port `5001`.
