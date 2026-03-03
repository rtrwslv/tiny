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
            
            const parentFolder = await getParentFolderForIMAP(server, identity.tmplFolderUri);
            
            if (parentFolder) {
              await createIMAPFolder(parentFolder, "Templates");
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const newFolder = MailUtils.getOrCreateFolder(identity.tmplFolderUri);
              if (newFolder?.filePath?.exists()) {
                return newFolder;
              }
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
      console.error("IMAP folder creation error:", e);
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

async function getParentFolderForIMAP(server, folderUri) {
  try {
    const rootFolder = server.rootFolder;
    return rootFolder;
  } catch {
    return null;
  }
}

function createIMAPFolder(parentFolder, folderName) {
  return new Promise((resolve, reject) => {
    try {
      const listener = {
        QueryInterface: ChromeUtils.generateQI(["nsIUrlListener"]),
        OnStartRunningUrl(url) {},
        OnStopRunningUrl(url, exitCode) {
          if (Components.isSuccessCode(exitCode)) {
            resolve();
          } else {
            reject(new Error(`IMAP create failed: 0x${exitCode.toString(16)}`));
          }
        }
      };

      parentFolder.createSubfolder(folderName, null);
      
      const newFolder = parentFolder.getChildNamed(folderName);
      if (newFolder) {
        newFolder.setFlag(Ci.nsMsgFolderFlags.Templates);
      }
      
      resolve();
      
    } catch (e) {
      reject(e);
    }
  });
}
