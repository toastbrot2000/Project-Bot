import { useState, useRef, useEffect } from 'react';
import { useChatFlow } from './hooks/useChatFlow';
import { ChatMessage } from './components/Chat/ChatMessage';
import { AnswerOptions } from './components/Chat/AnswerOptions';
import { Tooltip } from './components/UI/Tooltip';
import { ResultsPage } from './components/Results/ResultsPage';

import { ConfirmationModal } from './components/UI/ConfirmationModal';

function App() {
  const { history, loading, handleAnswer, resetChat, goBack, rewindTo, isFinished, userAnswers } = useChatFlow();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipTrigger, setTooltipTrigger] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, targetId: null });
  const chatBoxRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [history]);

  const onShowTooltip = (content, trigger) => {
    setActiveTooltip(content);
    setTooltipTrigger(trigger);
  };

  const handleEdit = (message) => {
    // Find the index of this answer
    if (!message.questionId) return;

    const lastAnswer = userAnswers[userAnswers.length - 1];

    // If it's the last answer, just go back (undo)
    if (lastAnswer && lastAnswer.questionId === message.questionId) {
      goBack();
    } else {
      // It's a previous answer, ask for confirmation
      setConfirmModal({ isOpen: true, targetId: message.questionId });
    }
  };

  const handleConfirmRewind = () => {
    if (confirmModal.targetId) {
      rewindTo(confirmModal.targetId);
    }
    setConfirmModal({ isOpen: false, targetId: null });
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (isFinished) {
    return (
      <div id="main-content">
        <ResultsPage onReset={resetChat} onBack={goBack} answers={userAnswers} />
      </div>
    );
  }

  return (
    <div id="main-content">
      <div id="chat-container">
        <div id="chat-box" ref={chatBoxRef}>
          {history.map((msg, idx) => (
            <div key={idx}>
              <ChatMessage
                message={msg}
                onShowTooltip={onShowTooltip}
                onEdit={msg.type === 'user' ? handleEdit : undefined}
              />
            </div>
          ))}

          {/* If this is the active message (last bot message), show options */}
          {history.length > 0 && history[history.length - 1].type === 'bot' && !isFinished && (
            <AnswerOptions
              options={history[history.length - 1].options}
              onSelect={handleAnswer}
            />
          )}
        </div>
      </div>

      {activeTooltip && (
        <Tooltip
          content={activeTooltip}
          onClose={() => setActiveTooltip(null)}
          triggerElement={tooltipTrigger}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        message="Changing this answer will clear all subsequent progress. Are you sure?"
        onConfirm={handleConfirmRewind}
        onCancel={() => setConfirmModal({ isOpen: false, targetId: null })}
      />
    </div>
  );
}

export default App;
