import React from 'react';
import './index.css';
import FlowModeler from './components/FlowModeler';
import './App.css';
import { ToastProvider } from '@project-bot/ui';

function App() {
  return (
    <div className="App">
      <ToastProvider>
        <FlowModeler />
      </ToastProvider>
    </div>
  );
}

export default App;
