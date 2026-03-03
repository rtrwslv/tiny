async function getTemplatesFolderForTemplate() {
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
        const server = templatesFolder.server;
        
        if (server?.type === "imap") {
          const exists = templatesFolder.filePath?.exists();
          
          if (!exists) {
            console.log("IMAP Templates folder doesn't exist, creating on server...");
            
            try {
              const rootFolder = server.rootFolder;
              
              await new Promise((resolve, reject) => {
                rootFolder.createSubfolder("Templates", {
                  OnStopRunningUrl(url, exitCode) {
                    Components.isSuccessCode(exitCode) ? resolve() : reject();
                  }
                });
              });
              
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const newFolder = rootFolder.getChildNamed("Templates");
              if (newFolder) {
                newFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
                return newFolder;
              }
            } catch (e) {
              console.error("IMAP folder creation failed:", e);
            }
            
            console.log("Failed to create IMAP folder, using Local Folders");
          } else {
            return templatesFolder;
          }
        } else {
          return templatesFolder;
        }
      }
    } catch (e) {
      console.error("IMAP folder error:", e);
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
    
    if (!templatesFolder) {
      try {
        await new Promise((resolve, reject) => {
          localRoot.createSubfolder("Templates", {
            OnStopRunningUrl(url, exitCode) {
              Components.isSuccessCode(exitCode) ? resolve() : reject();
            }
          });
        });
        
        templatesFolder = localRoot.getChildNamed("Templates");
        if (templatesFolder) {
          templatesFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
        }
      } catch (e) {
        console.error("Failed to create Templates in Local Folders:", e);
      }
    }
    
    if (templatesFolder) {
      return templatesFolder;
    }
  } catch (e) {
    console.error("Local Folders fallback error:", e);
  }

  return null;
}
