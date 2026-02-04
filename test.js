const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

async function isVpnConnected(timeout = 2000) {
  for (let server of MailServices.accounts.allServers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const rootFolder = imapServer.rootFolder;

      return await new Promise((resolve) => {
        let finished = false;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve(false);
          }
        }, timeout);

        try {
          rootFolder.performExpand(null, {
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
