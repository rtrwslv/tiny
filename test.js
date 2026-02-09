const { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);
const { Ci } = ChromeUtils.import(
  "chrome://global/content/xpcom.jsm"
);

for (let server of MailServices.accounts.allServers) {
  if (!server || server.type !== "imap") continue;

  const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);

  console.log("[verifyLogon] Проверяем сервер:", imapServer.hostName);

  const listener = {
    OnStartRunningUrl(url) {
      console.log("[verifyLogon] start:", url?.spec ?? "<no url>");
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

  imapServer.verifyLogon(listener);

  break; // проверяем только первый сервер
}
