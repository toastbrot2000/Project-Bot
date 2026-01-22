# Admin App (Remote)

The **Admin App** is a powerful visual editor for managing the logic of the bot.

## Features
- **Flow Modeler**: A node-based editor using **React Flow**.
- **Visual Editing**: Create questions, options, and dependencies visually.
- **XML Export**: Generates the `questions.xml` file used by the User App.

## Integration
This app exposes a `./Dashboard` component which is consumed by the Host application.
It runs standalone on port `5002`.
