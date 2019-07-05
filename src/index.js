import storage from "./storage";

(function() {
  const namespace = "andreasmischke-gh-project-board-tool";
  const animationClassName = `${namespace}-A`;
  const accessTokenKey = 'ACCESS_TOKEN';
  const runOnlyOnceMarker = `${namespace}-I`;
  const estimationButtonClassName = `${namespace}-E`;
  const totalTaskPointsClassName = `${namespace}-T`;
  const unestimatedTaskPointClassName = `${namespace}-U`;

  if (window[runOnlyOnceMarker]) {
    return;
  }

  function getEstimateFromTitle(title) {
    const matches = title.match(/\((\d+)\)$/);
    if (matches === null) {
      return null;
    }
    return parseInt(matches[1]);
  }

  async function getAccessToken() {
    const token = await storage.get(accessTokenKey);
    if (token) {
      return token;
    }

    const newToken = window.prompt("Please enter your personal access token");
    if (newToken === null) {
      return null;
    }

    storage.set(accessTokenKey, newToken);
    return newToken;
  }

  async function fetchIssueUrlForCard(accessToken, cardId) {
    const response = await fetch(
      `https://api.github.com/projects/columns/cards/${cardId}`,
      {
        headers: {
          authorization: `token ${accessToken}`,
          accept: "application/vnd.github.inertia-preview+json"
        }
      }
    );
    const json = await response.json();
    return json.content_url;
  }

  async function fetchIssueTitle(accessToken, issueUrl) {
    const response = await fetch(issueUrl, {
      headers: {
        authorization: `token ${accessToken}`,
        accept: "application/vnd.github.inertia-preview+json"
      }
    });
    const json = await response.json();
    return json.title;
  }

  async function patchIssueTitle(accessToken, issueUrl, newTitle) {
    const response = await fetch(issueUrl, {
      method: "PATCH",
      headers: {
        authorization: `token ${accessToken}`,
        accept: "application/vnd.github.inertia-preview+json"
      },
      body: JSON.stringify({ title: newTitle })
    });
    const json = await response.json();
    return json;
  }

  async function estimateTask(cardId) {
    const accessToken = await getAccessToken();
    if (accessToken === null) {
      return;
    }

    let estimation = window.prompt("Please enter your estimation");
    if (estimation === null) {
      return;
    }
    if (estimation !== "") {
      estimation = ` (${estimation})`;
    }

    const issueUrl = await fetchIssueUrlForCard(accessToken, cardId);

    const issueTitle = await fetchIssueTitle(accessToken, issueUrl);

    const estimate = getEstimateFromTitle(issueTitle);
    let newTitle;
    if (estimate === null) {
      newTitle = `${issueTitle}${estimation}`;
    } else {
      newTitle = issueTitle.replace(/ \(\d+\)$/, estimation);
    }

    await patchIssueTitle(accessToken, issueUrl, newTitle);
  }

  function updateColumnCounters(
    $column,
    $taskPointCounter,
    $unestimatedTasksCounter
  ) {
    const issueCardTitles = $column.querySelectorAll(".issue-card a.h5");
    const { totalTaskPoints, unestimatedTasks, $firstUnestimatedCard } = [
      ...issueCardTitles
    ].reduce(
      (acc, title) => {
        const $card = title.parentElement;

        if ($card.querySelector(`.${estimationButtonClassName}`) === null) {
          const $estimateButton = document.createElement("button");
          const $templateButton = $card.querySelector("button");
          $estimateButton.classList = $templateButton.classList;
          $estimateButton.classList.add(estimationButtonClassName);
          $estimateButton.textContent = "Estimate";
          $estimateButton.onclick = () => {
            const cardId = $card
              .closest(".issue-card")
              .getAttribute("data-card-id");
            estimateTask(cardId);
          };
          $card
            .querySelector("details-menu")
            .insertAdjacentElement("beforeend", $estimateButton);
        }

        const estimate = getEstimateFromTitle(title.textContent);
        if (estimate === null) {
          acc.unestimatedTasks += 1;
          if (acc.$firstUnestimatedCard === null) {
            acc.$firstUnestimatedCard = $card;
          }
        } else {
          acc.totalTaskPoints += estimate;
        }
        return acc;
      },
      {
        totalTaskPoints: 0,
        unestimatedTasks: 0,
        $firstUnestimatedCard: null
      }
    );

    $taskPointCounter.textContent = totalTaskPoints;
    $unestimatedTasksCounter.textContent = unestimatedTasks;

    if ($firstUnestimatedCard !== null) {
      let timeout;

      $unestimatedTasksCounter.addEventListener("click", function() {
        $firstUnestimatedCard.classList.remove(animationClassName);
        clearTimeout(timeout);

        $firstUnestimatedCard.scrollIntoViewIfNeeded();
        $firstUnestimatedCard.classList.add(animationClassName);

        timeout = setTimeout(function() {
          $firstUnestimatedCard.classList.remove(animationClassName);
        }, 3100);
      });
    }
  }

  function copyNode(sourceNode, className) {
    const node = sourceNode.cloneNode(true);
    if (className !== undefined) {
      node.classList.add(className);
    }
    sourceNode.insertAdjacentElement("afterend", node);
    return node;
  }

  window[runOnlyOnceMarker] = 1;

  const styleElement = document.createElement("style");

  styleElement.textContent = `
    @keyframes custom-highlighter {
      0% { background: none }
      1% { background: transparent }
      15% { background: #FFDC97 }
      99% { background: transparent }
      100% { background :none }
    }
    .${totalTaskPointsClassName} {
      background: #2ecc71;
      color: #eee;
    }
    .${unestimatedTaskPointClassName} {
      background: #966;
      color: #eee;
      cursor:pointer
    }
    .${animationClassName} {
      animation: custom-highlighter 3s
    }`;

  document.querySelector("head").appendChild(styleElement);

  const boardColumns = document.querySelectorAll(".project-column");
  [...boardColumns].forEach(column => {
    const cardCounterElement = column.querySelector(".Counter");
    const unestimatedTaskCounterElement = copyNode(
      cardCounterElement,
      unestimatedTaskPointClassName
    );
    const totalTaskPointCounterElement = copyNode(
      cardCounterElement,
      totalTaskPointsClassName
    );

    const issueList = column.querySelector(".js-project-column-cards");

    const mutationObserver = new MutationObserver(function() {
      updateColumnCounters(
        column,
        totalTaskPointCounterElement,
        unestimatedTaskCounterElement
      );
    });
    mutationObserver.observe(issueList, {
      subtree: true,
      childList: true,
      characterData: true
    });

    updateColumnCounters(
      column,
      totalTaskPointCounterElement,
      unestimatedTaskCounterElement
    );
  });
})();
