async function copyToTemplatesFolderForTemplate(emlFile, templatesFolder) {
  console.log("=== copyToTemplatesFolder START ===");
  console.log("emlFile:", emlFile.path);
  console.log("templatesFolder:", templatesFolder.name);
  console.log("templatesFolder.server.type:", templatesFolder.server?.type);

  if (templatesFolder.server?.type === "imap") {
    console.log("IMAP detected, using alternative method");
    return await copyToIMAPTemplatesFolder(emlFile, templatesFolder);
  }

  return new Promise((resolve, reject) => {
    const copyListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
      OnStartCopy() { console.log("OnStartCopy"); },
      OnProgress(p, m) { console.log("OnProgress:", p, m); },
      SetMessageKey(k) { console.log("SetMessageKey:", k); },
      GetMessageId() { return null; },
      OnStopCopy(statusCode) {
        console.log("OnStopCopy:", statusCode);
        Components.isSuccessCode(statusCode) ? resolve() : reject(new Error(`failed: 0x${statusCode.toString(16)}`));
      },
    };

    try {
      MailServices.copy.copyFileMessage(
        emlFile,
        templatesFolder,
        null,
        false,
        Ci.nsMsgMessageFlags.Template,
        "",
        copyListener,
        null
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function copyToIMAPTemplatesFolder(emlFile, templatesFolder) {
  console.log("=== IMAP copy method ===");
  
  try {
    const localServer = MailServices.accounts.localFoldersServer;
    const localRoot = localServer.rootFolder;
    let localTemplates = null;
    
    try {
      localTemplates = localRoot.getChildNamed("TempTemplates");
    } catch {}
    
    if (!localTemplates) {
      localRoot.createSubfolder("TempTemplates", null);
      await new Promise(resolve => setTimeout(resolve, 500));
      localTemplates = localRoot.getChildNamed("TempTemplates");
    }
    
    if (!localTemplates) {
      throw new Error("Failed to create temp folder");
    }

    await new Promise((resolve, reject) => {
      const copyListener = {
        QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
        OnStopCopy(statusCode) {
          Components.isSuccessCode(statusCode) ? resolve() : reject();
        },
      };

      MailServices.copy.copyFileMessage(
        emlFile,
        localTemplates,
        null,
        false,
        Ci.nsMsgMessageFlags.Template,
        "",
        copyListener,
        null
      );
    });

    console.log("Copied to local temp, now moving to IMAP...");

    const tempMessages = [...localTemplates.messages];
    if (tempMessages.length === 0) {
      throw new Error("No message in temp folder");
    }

    await new Promise((resolve, reject) => {
      const moveListener = {
        QueryInterface: ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
        OnStopCopy(statusCode) {
          Components.isSuccessCode(statusCode) ? resolve() : reject();
        },
      };

      MailServices.copy.copyMessages(
        localTemplates,
        tempMessages,
        templatesFolder,
        true,
        moveListener,
        null,
        false
      );
    });

    console.log("Moved to IMAP successfully");

    localTemplates.deleteSelf(null);

  } catch (e) {
    console.error("IMAP copy failed:", e);
    throw e;
  }
}
