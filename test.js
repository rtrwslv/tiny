#connectionIndicator .connection-tooltip {
  position: absolute;
  bottom: calc(100% + 15px); /* ← ВАЖНО */
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
