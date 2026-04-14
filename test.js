function waitForLoad(browser) {
  return new Promise(resolve => {
    if (browser.contentDocument?.readyState === "complete") {
      resolve();
      return;
    }
    browser.addEventListener("load", resolve, {
      once: true,
      capture: true
    });
  });
}

// Использование:
tabmail.addEventListener("TabOpen", async (event) => {
  const tabInfo = event.detail.tabInfo;
  const browser = tabInfo.chromeBrowser;

  await waitForLoad(browser);

  const win = browser.contentWindow;
  applyMessageIdFilter(win, allowedIds);
});
