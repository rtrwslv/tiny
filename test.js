inbox.getNewMessages({
  OnStartRunningUrl() {},
  OnStopRunningUrl() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    resolve(true);
  }
}, {});
