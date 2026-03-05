const seen = new Set();
conversationCollection.items = conversationCollection.items.filter(glodaMsg => {
  if (seen.has(glodaMsg.headerMessageID)) {
    return false;
  }
  seen.add(glodaMsg.headerMessageID);
  return true;
});
