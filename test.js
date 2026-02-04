async function isVpnConnected(timeout = 3000) {
  const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
  const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const inbox = imapServer.rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Inbox);

      return await new Promise((resolve) => {
        let finished = false;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve(false);
          }
        }, timeout);

        try {
          // Фиктивный listener — UI не трогает
          inbox.getNewMessages({
            OnStartRunningUrl() {},
            OnStopRunningUrl() {
              if (finished) return;
              finished = true;
              clearTimeout(timer);
              resolve(true);
            }
          });
        } catch {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve(false);
          }
        }
      });
    } catch {}
  }

  return false;
}
