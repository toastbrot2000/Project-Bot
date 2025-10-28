let xmlDoc;
let activeTooltipNode = null; // Keep track of the currently open tooltip content

document.addEventListener("DOMContentLoaded", () => {
  // --- Viewport Height Fix for Mobile Browsers ---
  const setViewportHeight = () => {
    // window.innerHeight gives the actual visible viewport height.
    // We convert it to a CSS unit by dividing by 100.
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  // Set the value on initial load
  setViewportHeight();
  // And reset it on window resize (e.g., orientation change)
  window.addEventListener('resize', setViewportHeight);

  // --- Responsive Tooltip Handling ---
  const handleResize = () => {
    const sidePanel = document.getElementById('tooltip-side-panel');
    const modal = document.querySelector('.tooltip-modal');

    // Check if the side panel is open and if the screen is now too small for it
    if (sidePanel && !window.matchMedia('(min-width: 1025px)').matches) {
      // Trigger the closing animation and remove the panel
      sidePanel.classList.add('is-hiding');
      sidePanel.addEventListener('animationend', () => {
        sidePanel.remove();
        activeTooltipNode = null; // Clear the active tooltip
      }, { once: true });
    }

    // Check if a modal is open and if the screen is now large enough for the side panel
    if (modal && window.matchMedia('(min-width: 1025px)').matches) {
      modal.remove(); // Close the modal
      if (activeTooltipNode) {
        // Re-open as a side panel. We need to find the function's context.
        showTooltipAsSidePanel(activeTooltipNode);
      }
    }
  };

  // Listen for window resize events to handle the tooltip panel
  window.addEventListener('resize', handleResize);

  const chatBox = document.getElementById("chat-box");
  const chatContainer = document.getElementById("chat-container");
  const resultsPage = document.getElementById("results-page");
  const recommendationsContainer = document.getElementById("recommendations-container");
  const documentsContainer = document.getElementById("documents-container");
  const restartButton = document.getElementById("restart-button");

  let userAnswers = [];
  let recommendations = [];
  let documents = new Set();
  let currentEditQuestionId = null;

  // --- Global Keyboard Navigation ---
  document.addEventListener('keydown', (event) => {
    const isForwardNav = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const isBackwardNav = event.key === 'ArrowUp' || event.key === 'ArrowLeft';

    if (!isForwardNav && !isBackwardNav) {
      return; // Not an arrow key we care about
    }

    // Define what is considered a focusable item in the chat
    const focusableSelector = '.chat-message[tabindex="0"], .answer-bubble[tabindex="0"], .edit-button';
    const focusableItems = Array.from(document.querySelectorAll(focusableSelector));

    const activeElement = document.activeElement;
    const currentIndex = focusableItems.findIndex(item => item === activeElement);

    // If focus is not within our chat items, do nothing
    if (currentIndex === -1) {
      return;
    }

    event.preventDefault(); // Prevent default page scrolling

    let nextIndex;
    if (isForwardNav) {
      // Move to the next item, loop to start if at the end
      nextIndex = (currentIndex + 1) % focusableItems.length;
    } else { // isBackwardNav
      // Move to the previous item, loop to end if at the start
      nextIndex = (currentIndex - 1 + focusableItems.length) % focusableItems.length;
    }
    focusableItems[nextIndex].focus();
  });

  // Smooth scroll to bottom function with padding
  function scrollToBottom() {
    // In a flex-end layout, setting scrollTop to scrollHeight is all we need.
    // The browser handles scrolling to the bottom of the content.
    requestAnimationFrame(() => {
        const chatBox = document.getElementById("chat-box");
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
  }

  // Function to ensure the answer container has proper spacing
  function adjustAnswerContainerSpacing(answerContainer) {
    // Add bottom margin to raise the options from the bottom edge
    answerContainer.style.marginBottom = '24px';
    
    // Add some side padding to match chat app style
    answerContainer.style.paddingLeft = '12px';
    answerContainer.style.paddingRight = '12px';
  }

  restartButton.addEventListener("click", restartApp);

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/";
  }

  function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1);
      if (c.indexOf(cname) == 0) return c.substring(cname.length);
    }
    return "";
  }

  function restartApp() {
    chatContainer.classList.remove("hidden");
    resultsPage.classList.add("hidden");
    chatBox.innerHTML = "";
    recommendationsContainer.innerHTML = "";
    documentsContainer.innerHTML = "";

    userAnswers = [];
    recommendations = [];
    documents = new Set();

    setCookie("savedAnswers", "", -1);

    startApp(xmlDoc);
  }

  fetch("questions.xml")
    .then(response => response.ok ? response.text() : Promise.reject("Failed to load XML"))
    .then(xmlText => {
      xmlDoc = new DOMParser().parseFromString(xmlText, "application/xml");
      startApp(xmlDoc);
    })
    .catch(error => console.error("❌ Error loading XML:", error));

    function startApp(xmlDoc) {
      resultsPage.classList.add("hidden");
      chatBox.innerHTML = "";
      userAnswers = [];
  
      const savedAnswers = getCookie("savedAnswers");
      if (savedAnswers) {
        userAnswers = JSON.parse(savedAnswers);
        displayAllPreviousAnswers();
        showResumeDialog();
      } else {
        displayQuestion(xmlDoc, "1");
      }
    }

    function handleResume(shouldResume) {
      if (shouldResume) {
        const lastAnswer = userAnswers[userAnswers.length - 1];
        const lastQuestionNode = xmlDoc.querySelector(`question[id="${lastAnswer.questionId}"]`);
        
        // Find next question based on the last answer
        const nextQuestionNode = lastQuestionNode.querySelector(`nextQuestions > next[optionId="${lastAnswer.optionId}"]`);
        // Fallback to default next question if no specific one is found
        const defaultNextNode = lastQuestionNode.querySelector('nextQuestions > next:not([optionId])');
        
        const nextId = nextQuestionNode?.getAttribute("questionId") || defaultNextNode?.getAttribute("questionId");

        if (nextId) {
          displayQuestion(xmlDoc, nextId);
        } else {
          evaluateDependencies();
          displayResults();
        }
      } else {
          setCookie("savedAnswers", "", -1);
          chatBox.innerHTML = "";
          userAnswers = [];
          displayQuestion(xmlDoc, "1");
      }
    }

    function getInnerXml(node) {
      if (!node) return '';
      const serializer = new XMLSerializer();
      return Array.from(node.childNodes).map(child => {
        // For element nodes, serialize them to string. For text nodes, just return their content.
        return child.nodeType === Node.ELEMENT_NODE ? serializer.serializeToString(child) : child.textContent;
      }).join('');
    }

  function showTooltipAsModal(node, focusReturnElement) {
    activeTooltipNode = node; // Set the active tooltip
    const modal = document.createElement('div');
    modal.className = 'tooltip-modal';
    modal.innerHTML = `
      <div class="tooltip-modal-content">
        <button class="close-icon">&times;</button>
        ${getInnerXml(node)}
        <div class="tooltip-modal-footer">
          <button class="close-tooltip">Got it</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const modalContent = modal.querySelector('.tooltip-modal-content');

    // Check if the modal content is scrollable
    if (modalContent.scrollHeight > modalContent.clientHeight) {
      modalContent.classList.add('is-scrollable');
    }

    const closeModal = () => {
      modal.remove();
      activeTooltipNode = null; // Clear active tooltip on close
      if (focusReturnElement) {
        focusReturnElement.focus();
      }
    };

    modal.querySelector('.close-tooltip').addEventListener('click', closeModal);
    modal.querySelector('.close-icon').addEventListener('click', closeModal);

    const handleModalKeydown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        closeModal();
        document.removeEventListener('keydown', handleModalKeydown);
      }
    };
    document.addEventListener('keydown', handleModalKeydown);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
        document.removeEventListener('keydown', handleModalKeydown);
      }
    });

    modal.querySelector('.close-icon').focus();
  }

  function showTooltipAsSidePanel(node, focusReturnElement) {
    activeTooltipNode = node; // Set the active tooltip
    const existingPanel = document.getElementById('tooltip-side-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'tooltip-side-panel';
    
    // Create a temporary container to parse the tooltip content
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = getInnerXml(node);

    // Try to find an h2 to use as a title
    const titleElement = tempContainer.querySelector('h2');
    let title = "More Information"; // Default title
    if (titleElement) {
      title = titleElement.innerHTML;
      titleElement.remove(); // Remove it from the content to avoid duplication
    }
    const content = tempContainer.innerHTML;

    panel.innerHTML = `
      <div class="tooltip-side-panel-header">
        <h2>${title}</h2>
        <button class="close-icon">&times;</button>
      </div>
      <div class="tooltip-side-panel-content">${content}</div>
    `;

    document.getElementById('main-content').appendChild(panel);

    const closePanel = () => {
      // Remove inline style to prevent it from affecting other tooltips
      panel.style.marginTop = '';
      panel.style.maxHeight = '';

      panel.classList.add('is-hiding');
      panel.addEventListener('animationend', () => {
        panel.remove();
        activeTooltipNode = null; // Clear active tooltip on close
        document.removeEventListener('keydown', handlePanelKeydown); // Clean up listener
        if (focusReturnElement) focusReturnElement.focus();
      }, { once: true });
    };

    // --- Dynamic Vertical Positioning ---
    // Calculate the top position of the icon relative to the main content area
    const mainContentRect = document.getElementById('main-content').getBoundingClientRect();
    const iconRect = focusReturnElement.getBoundingClientRect();
    const marginTop = iconRect.top - mainContentRect.top;

    // Set initial max-height to allow for measurement
    panel.style.maxHeight = `${mainContentRect.height}px`;

    // Check if the panel with its new margin top would overflow the container
    if (panel.offsetHeight + marginTop < mainContentRect.height) {
      // If it fits, apply the margin
      panel.style.marginTop = `${marginTop}px`;
      panel.style.maxHeight = `${mainContentRect.height - marginTop}px`;
    }

    panel.querySelector('.close-icon').addEventListener('click', closePanel);

    const handlePanelKeydown = (event) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };
    document.addEventListener('keydown', handlePanelKeydown);
  }

  function displayQuestion(xmlDoc, questionId) {
    const question = xmlDoc.querySelector(`question[id="${questionId}"]`);
    if (!question) return;

    const text = question.querySelector("text").textContent;
    const tooltipNode = question.querySelector("tooltip");
    const options = question.querySelectorAll("option");

    const questionMessageContainer = document.createElement("div");
    questionMessageContainer.className = "chat-message fade-in";
    questionMessageContainer.textContent = text;

    if (tooltipNode) {
      const tooltipIcon = document.createElement("span");
      tooltipIcon.className = "tooltip-icon";
      tooltipIcon.innerHTML = `<i class="fas fa-question-circle"></i>`;
      tooltipIcon.setAttribute('tabindex', '0');
      tooltipIcon.setAttribute('role', 'button');
      tooltipIcon.setAttribute('aria-label', 'Show more information');
      questionMessageContainer.classList.add("has-tooltip");

      const showTooltip = () => {
        // Use matchMedia to decide which tooltip to show
        if (window.matchMedia('(min-width: 1025px)').matches) {
          showTooltipAsSidePanel(tooltipNode, tooltipIcon);
        } else {
          showTooltipAsModal(tooltipNode, tooltipIcon);
        }
      };

      const showTooltipWithKeyboard = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showTooltip();
        } 
      };
      tooltipIcon.addEventListener('click', showTooltip);
      tooltipIcon.addEventListener('keydown', showTooltipWithKeyboard);
      questionMessageContainer.appendChild(tooltipIcon);
    }

    chatBox.appendChild(questionMessageContainer);

    const answerContainer = document.createElement("div");
    answerContainer.className = "answer-container fade-in";
    adjustAnswerContainerSpacing(answerContainer);

    let answered = false;

    options.forEach((option, index) => {
      const answerBubble = document.createElement("div");
      answerBubble.className = "answer-bubble fade-in";
      answerBubble.textContent = option.textContent;
      answerBubble.style.animationDelay = `${0.1 + index * 0.1}s`;
      answerBubble.setAttribute('tabindex', '0'); // Make bubble focusable

      answerBubble.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        userAnswers.push({ questionId, optionId: option.getAttribute("id") });
        setCookie("savedAnswers", JSON.stringify(userAnswers), 30);

        // Remove other bubbles and update selected bubble
        Array.from(answerContainer.children).forEach(child => {
          if (child !== answerBubble) {
            child.remove();
          }
        });
        answerBubble.classList.add('selected');
        // Keep the bubble focusable for accessibility

        // Add edit button
        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.innerHTML = '<i class="fas fa-pen" title="Edit"></i>';
        editButton.setAttribute('aria-label', 'Edit this answer');
        editButton.addEventListener("click", () => {
          showConfirmationDialog(questionId);
        });
        answerContainer.appendChild(editButton);

        // Process next question immediately
        const selectedOptionId = option.getAttribute("id");
        
        // Find the next question based on the selected option
        const nextNode = question.querySelector(`nextQuestions > next[optionId="${selectedOptionId}"]`);
        // Find a default next question if no specific one exists for the selected option
        const defaultNextNode = question.querySelector('nextQuestions > next:not([optionId])');
        
        // Use the specific next question ID, or fall back to the default
        const nextId = nextNode?.getAttribute("questionId") || defaultNextNode?.getAttribute("questionId");

        scrollToBottom();
        if (nextId) {
          displayQuestion(xmlDoc, nextId);
        } else {
          evaluateDependencies();
          displayResults();
        }
      });

      answerBubble.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault(); // Prevent default form submission or other behavior
          answerBubble.click(); // Trigger the click handler
        }
      });

      answerContainer.appendChild(answerBubble);
    });

    chatBox.appendChild(answerContainer);
    
    // First scroll immediately to prevent jarring layout shifts
    scrollToBottom();
  }

  function displayAllPreviousAnswers() {
    userAnswers.forEach(answer => {
      const question = xmlDoc.querySelector(`question[id="${answer.questionId}"]`);
      if (!question) return;
      const selectedOption = question.querySelector(`option[id="${answer.optionId}"]`);
      if (!selectedOption) return;

      const questionMessage = document.createElement("div");
      questionMessage.className = "chat-message";
      questionMessage.textContent = question.querySelector("text").textContent;

      const answerContainer = document.createElement("div");
      answerContainer.className = "answer-container";
      adjustAnswerContainerSpacing(answerContainer);

      const answerBubble = document.createElement("div");
      answerBubble.className = "answer-bubble selected";
      answerBubble.textContent = selectedOption.textContent;
      answerBubble.setAttribute('tabindex', '0'); // Ensure it's focusable

      const editButton = document.createElement("button");
      editButton.className = "edit-button";
      editButton.innerHTML = '<i class="fas fa-pen" title="Edit"></i>';
      editButton.setAttribute('aria-label', 'Edit this answer');
      editButton.addEventListener("click", () => {
        showConfirmationDialog(answer.questionId);
      });

      answerContainer.appendChild(answerBubble);
      answerContainer.appendChild(editButton);

      chatBox.appendChild(questionMessage);
      chatBox.appendChild(answerContainer);
    });
    
    // Scroll to bottom after displaying all previous answers
    scrollToBottom();
  }

  function showConfirmationDialog(questionId) {
    currentEditQuestionId = questionId;

    const dialog = document.createElement('div');
    dialog.id = 'confirmation-dialog';
    dialog.style.opacity = '0'; // Start transparent for transition
    dialog.innerHTML = `
      <div class="dialog-content">
        <p>Editing this answer will remove all following answers and restart from this point. Do you want to continue?</p>
        <button id="confirm-edit">Yes</button>
        <button id="cancel-edit">No</button>
      </div>
    `;
    document.body.appendChild(dialog);

    // Trigger fade-in
    requestAnimationFrame(() => { dialog.style.opacity = '1'; });

    const closeDialog = () => {
      dialog.style.opacity = '0';
      // Remove from DOM after transition
      dialog.addEventListener('transitionend', () => dialog.remove(), { once: true });
      document.removeEventListener('keydown', handleConfirmationKeydown); // Remove listener
      currentEditQuestionId = null;
    };

    dialog.querySelector('#confirm-edit').addEventListener('click', () => {
      if (currentEditQuestionId !== null) {
        const index = userAnswers.findIndex(ans => ans.questionId === currentEditQuestionId);
        if (index !== -1) {
          userAnswers = userAnswers.slice(0, index);
          chatBox.innerHTML = "";
          recommendations = [];
          documents = new Set();
          setCookie("savedAnswers", JSON.stringify(userAnswers), 30);
          displayAllPreviousAnswers();
          displayQuestion(xmlDoc, currentEditQuestionId);
        }
      }
      closeDialog();
    });

    dialog.querySelector('#cancel-edit').addEventListener('click', closeDialog);

    // Close dialog on Escape or Enter key
    const handleConfirmationKeydown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        closeDialog();
      }
    };
    document.addEventListener('keydown', handleConfirmationKeydown);
  }

  function showResumeDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'resume-dialog';
    dialog.style.opacity = '0'; // Start transparent for transition
    dialog.innerHTML = `
      <div class="dialog-content">
        <p>We found your previous session. Would you like to continue where you left off?</p>
        <button id="resume-yes">Continue</button>
        <button id="resume-no">Start Over</button>
      </div>
    `;
    document.body.appendChild(dialog);

    // Trigger fade-in
    requestAnimationFrame(() => { dialog.style.opacity = '1'; });

    const closeDialog = () => {
      dialog.style.opacity = '0';
      dialog.addEventListener('transitionend', dialog.remove, { once: true });
      document.removeEventListener('keydown', handleResumeKeydown); // Remove listener
    };

    dialog.querySelector('#resume-yes').addEventListener('click', () => {
      handleResume(true);
      closeDialog();
    });

    dialog.querySelector('#resume-no').addEventListener('click', () => {
      handleResume(false);
      closeDialog();
    });

    // Close dialog on Escape or Enter key
    const handleResumeKeydown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        closeDialog();
      }
    };
    document.addEventListener('keydown', handleResumeKeydown);
  }

  function closeAllTooltips(callback) {
    // Close side panel if it exists
    const sidePanel = document.getElementById('tooltip-side-panel');
    const modal = document.querySelector('.tooltip-modal');

    if (sidePanel) {
      // Trigger the closing animation and remove after it finishes
      sidePanel.classList.add('is-hiding');
      sidePanel.addEventListener('animationend', () => {
        sidePanel.remove();
        activeTooltipNode = null; // Clear active tooltip
        if (callback) callback();
      }, { once: true });
    } else {
      // If no side panel, execute callback immediately
      if (callback) callback();
    }

    // Close modal if it exists
    if (modal) {
      modal.remove();
      activeTooltipNode = null; // Clear active tooltip
    }
  }
  function evaluateDependencies() {
    const dependencies = xmlDoc.querySelector("dependencies");

    dependencies.querySelectorAll("recommendation").forEach(rec => {
      if (Array.from(rec.querySelectorAll("condition")).every(matchesCondition)) {
        recommendations.push(rec.textContent.trim());
      }
    });

    dependencies.querySelectorAll("document").forEach(doc => {
      if (Array.from(doc.querySelectorAll("condition")).every(matchesCondition)) {
        const title = doc.querySelector("text")?.textContent.trim();
        if (title) documents.add(title);
      }
    });
  }

  function matchesCondition(condition) {
    const questionId = condition.getAttribute("questionId");
    const optionId = condition.getAttribute("optionId");
    const logic = condition.getAttribute("logic");

    const userAnswer = userAnswers.find(ans => ans.questionId === questionId);
    return logic === "not"
      ? userAnswer && userAnswer.optionId !== optionId
      : userAnswer && userAnswer.optionId === optionId;
  }

  function displayResults() {
    // Close any open tooltips (side panel or modal) to prevent layout issues.
    closeAllTooltips();

    chatContainer.classList.add("hidden");
    resultsPage.classList.remove("hidden");
    const documentsSection = document.getElementById("documents-section");

    recommendationsContainer.innerHTML = "";
    documentsContainer.innerHTML = "";

    if (recommendations.length > 0) {
      const firstRec = recommendations[0];
      const message = document.createElement("div");
      message.className = "result-message";
      message.innerHTML = `<h3>${firstRec}</h3>`;
      recommendationsContainer.appendChild(message);

      if (documents.size > 0) {
        documentsSection.classList.remove("hidden");
        documentsContainer.innerHTML = ''; // Clear previous content

        const allDocNodes = xmlDoc.querySelectorAll("document");

        allDocNodes.forEach(docNode => {
          const docText = docNode.querySelector("text")?.textContent.trim();
          if (!documents.has(docText)) return;

          const description = docNode.querySelector("description")?.textContent.trim();

          const item = document.createElement("div");
          item.classList.add("document-item");

          item.innerHTML = `
            <p><i class="fas fa-file-alt"></i> <strong>${docText}</strong></p>
            ${description ? `<p class="doc-description">${description}</p>` : ""}
          `;

          documentsContainer.appendChild(item);
        });
      }
    } else {
      const message = document.createElement("div");
      message.className = "result-message";
      message.innerHTML = `
        <h3>We couldn’t match your case with a visa category</h3>
        <p>Please contact the German embassy or a visa advisor for further assistance.</p>
      `;
      recommendationsContainer.appendChild(message); // Add this line
      documentsContainer.innerHTML = "";
      documentsSection.classList.add("hidden");
    }
  }
});