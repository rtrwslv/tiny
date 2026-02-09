const { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);
const { Ci } = ChromeUtils.import(
  "chrome://global/content/xpcom.jsm"
);

const servers = MailServices.accounts.allServers;

for (let server of servers) {
  if (!server || server.type !== "imap") {
    continue;
  }

  const imapServer =
    server.QueryInterface(Ci.nsIImapIncomingServer);

  console.log(
    "[biff] вызываем performBiff для сервера:",
    imapServer.hostName
  );

  const listener = {
    OnStartRunningUrl(url) {
      console.log(
        "[biff] start:",
        url?.spec ?? "<no url>"
      );
    },

    OnStopRunningUrl(url, aExitCode) {
      console.log(
        "[biff] stop:",
        url?.spec ?? "<no url>",
        "exitCode:",
        aExitCode,
        "success:",
        Components.isSuccessCode(aExitCode)
      );
    },
  };

  try {
    imapServer.performBiff(listener);
  } catch (e) {
    console.error("[biff] exception:", e);
  }

  break; // один сервер для наглядности
}
