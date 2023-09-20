const dragList = document.getElementById("dragList");
let draggedItem = null;

// Add event listeners for drag and drop events
dragList.addEventListener("dragstart", handleDragStart);
dragList.addEventListener("dragover", handleDragOver);
dragList.addEventListener("drop", handleDrop);

// Drag start event handler
function handleDragStart(event) {
  draggedItem = event.target;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", draggedItem.innerHTML);
  event.target.style.opacity = "0.5";
}

// Drag over event handler
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const targetItem = event.target;
  if (
    targetItem !== draggedItem &&
    targetItem.classList.contains("drag-item")
  ) {
    const boundingRect = targetItem.getBoundingClientRect();
    const offset = boundingRect.y + boundingRect.height / 2;
    if (event.clientY - offset > 0) {
      targetItem.style.borderBottom = "solid 2px #000";
      targetItem.style.borderTop = "";
    } else {
      targetItem.style.borderTop = "solid 2px #000";
      targetItem.style.borderBottom = "";
    }
  }
}

// Drop event handler
function handleDrop(event) {
  event.preventDefault();
  const targetItem = event.target;
  if (
    targetItem !== draggedItem &&
    targetItem.classList.contains("drag-item")
  ) {
    if (
      event.clientY >
      targetItem.getBoundingClientRect().top + targetItem.offsetHeight / 2
    ) {
      targetItem.parentNode.insertBefore(draggedItem, targetItem.nextSibling);
    } else {
      targetItem.parentNode.insertBefore(draggedItem, targetItem);
    }
  }
  targetItem.style.borderTop = "";
  targetItem.style.borderBottom = "";
  draggedItem.style.opacity = "";
  draggedItem = null;
}

async function submitPreferences() {
  const preferenceList = [];
  const preferenceElementList = document.getElementById("dragList").children;

  for (let item of preferenceElementList) {
    preferenceList.push(item.id);
  }



  // for (i=0;i < 500; i++){
  //   shuffleArray(preferenceList)
    const requestJSON = {
      preferenceList,
    };
    const res = await fetch("/api/submitpreferences", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(requestJSON),
    });
    const data = await res.json();
  // }
  
  const buttonPlusResult = document.getElementById("buttonPlusResult");
  buttonPlusResult.innerHTML =
    data.message == "oops"
      ? "Failed"
      : `<div class="main"><h2>Applicant Number = ${data.applicantNumber} </h2> <p> Please note down your applicant number, so that you can look up your allocation, when the algorithm has finished.</p> </br> <p>Please only use the website once to reduce the error.</p></div>`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}