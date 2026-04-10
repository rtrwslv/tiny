async function openRepliesAsFolderView(msgHdr) {
  const replies = await findReplies(msgHdr);
  if (!replies.length) {
    return;
  }

  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const tabmail = win.gTabmail;

  // ensure folder is open
  tabmail.openTab("mail3PaneTab", {
    folder: msgHdr.folder,
    background: false,
  });

  setTimeout(() => {
    const about3Pane = tabmail.currentAbout3Pane;
    const view = about3Pane?.gDBView;

    if (!view) {
      return;
    }

    // collect hdrs
    const hdrs = replies
      .map(m => m.folderMessage)
      .filter(Boolean);

    // IMPORTANT: use selectItems → native folder UI
    view.selectItems(hdrs.length, hdrs);
  }, 300);
}
