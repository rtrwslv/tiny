if (identity.tmplFolderUri) {
  try {
    const templatesFolder = MailUtils.getOrCreateFolder(identity.tmplFolderUri);
    
    if (templatesFolder) {
      const server = templatesFolder.server;
      
      if (server && server.type === "imap") {
        try {
          if (!templatesFolder.filePath?.exists()) {
            templatesFolder.createStorageIfMissing(null);
          }
          
          if (templatesFolder.canCreateSubfolders) {
            templatesFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
          }
        } catch (e) {
          console.warn("IMAP folder setup failed:", e);
        }
      }
      
      return templatesFolder;
    }
  } catch (e) {
    console.error("getOrCreateFolder error:", e);
  }
}
