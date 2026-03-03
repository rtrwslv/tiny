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
        const exists = templatesFolder.filePath?.exists();
        
        if (exists) {
          return templatesFolder;
        }
        
        console.log("Configured Templates folder doesn't exist physically, falling back to Local Folders");
      }
    } catch (e) {
      console.log("Failed to get configured Templates folder:", e);
    }
  }

  try {
    const localServer = MailServices.accounts.localFoldersServer;
    if (!localServer) {
      return null;
    }
    
    const localRoot = localServer.rootFolder;
    let templatesFolder = null;
    
    try {
      templatesFolder = localRoot.getFolderWithFlags(Ci.nsMsgFolderFlags.Templates);
    } catch {}
    
    if (!templatesFolder && localRoot.canCreateSubfolders) {
      templatesFolder = localRoot.createLocalSubfolder("Templates");
      templatesFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
      
      try {
        localRoot.NotifyFolderAdded(templatesFolder);
      } catch {}
    }
    
    if (templatesFolder) {
      return templatesFolder;
    }
  } catch (e) {
    console.error("Local Folders fallback error:", e);
  }

  return null;
}
