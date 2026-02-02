const indicator = document.getElementById("connectionIndicator");

function showOfflineTooltipOnce() {
  if (!indicator.classList.contains("status-offline")) {
    return;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "connection-tooltip";
  tooltip.textContent = "Пропало интернет-соединение";

  indicator.appendChild(tooltip);

  indicator.classList.remove("status-offline");
  indicator.classList.add("status-offline-seen");

  setTimeout(() => {
    tooltip.remove();
  }, 2500);
}

indicator.addEventListener("mouseenter", showOfflineTooltipOnce);

#connectionIndicator .connection-tooltip {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--arrowpanel-background);
  color: var(--arrowpanel-color);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: var(--shadow-30);
  z-index: 1000;
  pointer-events: none;
}
