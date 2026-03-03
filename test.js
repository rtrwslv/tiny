function getTemplatesFolderForTemplate() {
  let identity = null;
  
  const defaultAccount = MailServices.accounts.defaultAccount;
  if (defaultAccount) {
    identity = defaultAccount.defaultIdentity;
  }

  if (identity?.stationeryFolder) {
    try {
      const folder = MailUtils.getOrCreateFolder(identity.stationeryFolder);
      if (folder) {
        return folder;
      }
    } catch {}
  }

  if (defaultAccount) {
    try {
      const rootFolder = defaultAccount.incomingServer.rootFolder;
      const templatesFolder = rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
      if (templatesFolder) {
        return templatesFolder;
      }
    } catch {}
  }

  try {
    for (const account of MailServices.accounts.accounts) {
      const rootFolder = account.incomingServer.rootFolder;
      const templatesFolder = rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
      if (templatesFolder) {
        return templatesFolder;
      }
    }
  } catch {}

  return null;
}
