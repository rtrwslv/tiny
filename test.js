function getTemplatesFolderForTemplate() {
  const defaultAccount = MailServices.accounts.defaultAccount;
  if (!defaultAccount) {
    return null;
  }

  const identity = defaultAccount.defaultIdentity;
  if (!identity) {
    return null;
  }

  if (identity.tmplFolderUri) {
    try {
      const templatesFolder = MailUtils.getOrCreateFolder(identity.tmplFolderUri);
      if (templatesFolder) {
        return templatesFolder;
      }
    } catch {}
  }

  const pickerMode = identity.tmplFolderPickerMode;

  if (pickerMode === 1) {
    try {
      const server = defaultAccount.incomingServer;
      const rootFolder = server.rootFolder;
      let templatesFolder = rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
      
      if (!templatesFolder && rootFolder.canCreateSubfolders) {
        templatesFolder = rootFolder.createLocalSubfolder("Templates");
        templatesFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
      }
      
      if (templatesFolder) {
        return templatesFolder;
      }
    } catch {}
  } else if (pickerMode === 0) {
    try {
      const localServer = MailServices.accounts.localFoldersServer;
      const localRoot = localServer.rootFolder;
      let templatesFolder = localRoot.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
      
      if (!templatesFolder && localRoot.canCreateSubfolders) {
        templatesFolder = localRoot.createLocalSubfolder("Templates");
        templatesFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
      }
      
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
