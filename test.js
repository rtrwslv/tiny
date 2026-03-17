function waitForTabmail(win) {
  return new Promise(resolve => {
    let tabmail = win.document.getElementById("tabmail");

    if (tabmail && tabmail.tabModes) {
      resolve(tabmail);
      return;
    }

    let interval = win.setInterval(() => {
      tabmail = win.document.getElementById("tabmail");

      if (tabmail && tabmail.tabModes) {
        win.clearInterval(interval);
        resolve(tabmail);
      }
    }, 50);
  });
}
