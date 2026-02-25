const tabInfo = window.tabmail?.currentTabInfo;
if (tabInfo) {
  let inboxTab = null;
  for (const tab of window.tabmail.tabInfo) {
    if (tab.mode?.name === "folder" || tab.mode?.name === "mail3PaneTab") {
      inboxTab = tab;
      break;
    }
  }
  
  if (inboxTab) {
    window.tabmail.switchToTab(inboxTab);
  }
  
  window.tabmail.closeTab(tabInfo);
}
