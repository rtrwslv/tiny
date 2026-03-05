let currentReplyHandler = null;

// При каждом открытии письма:
if (currentReplyHandler) {
  button.removeEventListener("click", currentReplyHandler);
}

currentReplyHandler = () => {
  openRepliesForMessage(
    result.filteredGlodaMessages,
    result.conversationCollection,
    msgHdr,
    tabmail
  );
};

button.addEventListener("click", currentReplyHandler);
