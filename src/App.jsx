import { useState, useRef, useEffect } from 'react';
import { useChatFlow } from './hooks/useChatFlow';
import { ChatMessage } from './components/Chat/ChatMessage';
import { AnswerOptions } from './components/Chat/AnswerOptions';
import { Tooltip } from './components/UI/Tooltip';
// import { ResultsPage } from './components/Results/ResultsPage'; // Todo

function App() {
  const { history, loading, handleAnswer, resetChat, rewindTo, isFinished } = useChatFlow();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipTrigger, setTooltipTrigger] = useState(null);
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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div id="main-content">
      <div id="chat-container">
        <div id="chat-box" ref={chatBoxRef}>
          {history.map((msg, idx) => (
            <div key={idx}>
              <ChatMessage message={msg} onShowTooltip={onShowTooltip} />
              {/* If this is the active message (last bot message), show options */}
            </div>
          ))}

          {/* Show options for the last question if it's the latest and not answered yet?
                 Actually useChatFlow history includes user answers. 
                 So if last item is 'bot', we show options.
              */}
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
    </div>
  );
}

export default App;
