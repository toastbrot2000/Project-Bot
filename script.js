let xmlDoc;

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const resultsPage = document.getElementById("results-page");
  const recommendationsContainer = document.getElementById("recommendations-container");
  const documentsContainer = document.getElementById("documents-container");
  const restartButton = document.getElementById("restart-button");
  const confirmationDialog = document.getElementById("confirmation-dialog");
  const confirmEditButton = document.getElementById("confirm-edit");
  const cancelEditButton = document.getElementById("cancel-edit");
  const resumeDialog = document.getElementById("resume-dialog");
const resumeYes = document.getElementById("resume-yes");
const resumeNo = document.getElementById("resume-no");

  let userAnswers = [];
  let recommendations = [];
  let documents = new Set();
  let currentEditQuestionId = null;

  // Smooth scroll to bottom function with padding
  function scrollToBottom() {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    // Add extra padding to keep content higher from the bottom
    const bottomPadding = 20;
    const targetScroll = chatBox.scrollHeight - chatBox.clientHeight + bottomPadding;
    
    // Use smooth scrolling
    chatBox.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
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

  confirmEditButton.addEventListener("click", () => {
    confirmationDialog.classList.add("hidden");
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
      currentEditQuestionId = null;
    }
  });

  cancelEditButton.addEventListener("click", () => {
    confirmationDialog.classList.add("hidden");
    currentEditQuestionId = null;
  });

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
    document.getElementById("chat-container").classList.remove("hidden");
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
  
        resumeDialog.classList.remove("hidden");
  
        resumeYes.onclick = () => {
          resumeDialog.classList.add("hidden");
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
        };
  
        resumeNo.onclick = () => {
          resumeDialog.classList.add("hidden");
          setCookie("savedAnswers", "", -1);
          chatBox.innerHTML = "";
          userAnswers = [];
          displayQuestion(xmlDoc, "1");
        };
  
      } else {
        displayQuestion(xmlDoc, "1");
      }
    }

  function displayQuestion(xmlDoc, questionId) {
    const question = xmlDoc.querySelector(`question[id="${questionId}"]`);
    if (!question) return;

    const text = question.querySelector("text").textContent;
    const tooltipNode = question.querySelector("tooltip");
    const options = question.querySelectorAll("option");

    const questionMessage = document.createElement("div");
    questionMessage.className = "chat-message fade-in";
    questionMessage.textContent = text;

    if (tooltipNode) {
      const tooltipIcon = document.createElement("span");
      tooltipIcon.className = "tooltip-icon";
      tooltipIcon.style.color = "#888";
      tooltipIcon.innerHTML = `<i class="fas fa-question-circle"></i>`;

      // Make the entire message clickable
      questionMessage.style.cursor = "pointer";
      questionMessage.classList.add("has-tooltip");

      const showTooltipModal = () => {
        const modal = document.createElement('div');
        modal.className = 'tooltip-modal';
        modal.innerHTML = `
          <div class="tooltip-modal-content">
            <p>${tooltipNode.textContent}</p>
            <button class="close-tooltip">Got it</button>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-tooltip').addEventListener('click', () => {
          modal.remove();
        });
      };

      questionMessage.addEventListener('click', showTooltipModal);
      questionMessage.appendChild(tooltipIcon);
    }

    chatBox.appendChild(questionMessage);

    const answerContainer = document.createElement("div");
    answerContainer.className = "answer-container fade-in";
    adjustAnswerContainerSpacing(answerContainer);

    let answered = false;

    options.forEach((option, index) => {
      const answerBubble = document.createElement("div");
      answerBubble.className = "answer-bubble fade-in";
      answerBubble.textContent = option.textContent;
      answerBubble.style.animationDelay = `${0.3 + index * 0.1}s`;

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
        answerBubble.style.pointerEvents = 'none';

        // Add edit button
        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.innerHTML = '<i class="fas fa-pen" title="Edit"></i>';
        editButton.addEventListener("click", () => {
          confirmationDialog.classList.remove("hidden");
          currentEditQuestionId = questionId;
        });
        answerContainer.appendChild(editButton);

        // Process next question
        setTimeout(() => {
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
        }, 400); // Delay to match bubble animation
      });

      answerContainer.appendChild(answerBubble);
    });

    chatBox.appendChild(answerContainer);
    
    // First scroll immediately to prevent jarring layout shifts
    requestAnimationFrame(() => {
      scrollToBottom();
      
      // Then scroll smoothly after a brief delay to account for layout
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });
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
      answerBubble.style.pointerEvents = "none";

      const editButton = document.createElement("button");
      editButton.className = "edit-button";
      editButton.innerHTML = '<i class="fas fa-pen" title="Edit"></i>';
      editButton.addEventListener("click", () => {
        confirmationDialog.classList.remove("hidden");
        currentEditQuestionId = answer.questionId;
      });

      answerContainer.appendChild(answerBubble);
      answerContainer.appendChild(editButton);

      chatBox.appendChild(questionMessage);
      chatBox.appendChild(answerContainer);
    });
    
    // Scroll to bottom after displaying all previous answers
    setTimeout(() => {
      scrollToBottom();
    }, 100);
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
    document.getElementById("chat-container").classList.add("hidden");
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
      recommendationsContainer.appendChild(message);
      documentsContainer.innerHTML = "";
      documentsSection.classList.add("hidden");
    }
  }
});