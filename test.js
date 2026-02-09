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

  console.log("[verifyLogon] проверяем сервер:", imapServer.hostName);

  const listener = {
    OnStartRunningUrl(url) {
      console.log(
        "[verifyLogon] start:",
        url?.spec ?? "<no url>"
      );
    },

    OnStopRunningUrl(url, aExitCode) {
      console.log(
        "[verifyLogon] stop:",
        url?.spec ?? "<no url>",
        "exitCode:",
        aExitCode,
        "success:",
        Components.isSuccessCode(aExitCode)
      );
    },
  };

  try {
    imapServer.verifyLogon(listener);
  } catch (e) {
    console.error("[verifyLogon] exception:", e);
  }

  break; // проверяем один сервер для наглядности
}
