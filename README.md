# Project Bot

A conversational chatbot application built with React and Vite. This project allows users to interact with a bot whose conversation flow is defined via XML configuration files. It also includes an Admin Panel for visualizing and managing the conversation flow.

## 🚀 Features

- **Interactive Chat Interface**: A clean, responsive UI for user-bot interaction.
- **Data-Driven Flow**: Conversation logic, questions, and answers are defined in `public/questions.xml`.
- **Admin Dashboard**: Visual graph representation of the conversation flow using [React Flow](https://reactflow.dev/).
- **Content Management**: Integration with Strapi for managing rich text tooltips and additional content.
- **Session Persistence**: Saves user progress locally so they can resume conversations.

## 📂 Project Structure

This repository contains two main applications:

1.  **Chat Client** (Root directory): The main customer-facing application.
2.  **Admin Panel** (`/admin-panel`): A tool for administrators to visualize the question flow.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [NPM](https://www.npmjs.com/)

### Setting up the Chat Client

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

### Setting up the Admin Panel

The admin panel is a separate React application nested in the `admin-panel` directory.

1.  **Navigate to the admin folder**:
    ```bash
    cd admin-panel
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the admin server**:
    ```bash
    npm run dev
    ```
    The admin panel usually starts on `http://localhost:5174` (if 5173 is busy).

## ⚙️ Configuration

### Conversation Flow (`questions.xml`)

The core logic of the chat is defined in XML format.
- **Location**: `public/questions.xml` (for the Client) and `admin-panel/public/questions.xml` (for the Admin Panel).
- **Structure**: Defines `<question>` nodes with unique IDs, text, options, and next-question logic.

### Environment Variables

If your setup requires connection to a backend (like Strapi), ensure you have the appropriate `.env` file configured. See `.env.example` (if available) for reference.

## 📦 Building for Production

To build both applications for production:

**Client:**
```bash
npm run build
```

**Admin Panel:**
```bash
cd admin-panel
npm run build
```

The output will be in the `dist` folder of each respective project.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

[MIT](LICENSE)
