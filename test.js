const indicator = document.getElementById("connectionIndicator");

let offlineTooltip = null;

function onIndicatorMouseEnter() {
  if (!indicator.classList.contains("status-offline")) {
    return;
  }

  offlineTooltip = document.createElement("div");
  offlineTooltip.className = "connection-tooltip";
  offlineTooltip.textContent = "Пропало интернет-соединение";

  indicator.appendChild(offlineTooltip);

  indicator.classList.remove("status-offline");
  indicator.classList.add("status-offline-seen");
}

function onIndicatorMouseLeave() {
  if (offlineTooltip) {
    offlineTooltip.remove();
    offlineTooltip = null;
  }
}

indicator.addEventListener("mouseenter", onIndicatorMouseEnter);
indicator.addEventListener("mouseleave", onIndicatorMouseLeave);
