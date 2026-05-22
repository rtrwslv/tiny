/**
 * Возвращает PARTSTAT из первого VEVENT в itipItem.
 * @param {calIItipItem} itipItem
 * @returns {"ACCEPTED"|"DECLINED"|"TENTATIVE"|"UNKNOWN"}
 */
function getReplyPartStat(itipItem) {
  try {
    for (const item of itipItem.getItemList()) {
      // item — это calIEvent/calITodo
      const attendees = item.getAttendees();
      for (const att of attendees) {
        const partStat = att.participationStatus; // "ACCEPTED", "DECLINED", "TENTATIVE", etc.
        if (partStat && partStat !== "NEEDS-ACTION") {
          return partStat;
        }
      }
    }
  } catch (e) {
    console.error("CalInvitationPanel: could not read PARTSTAT", e);
  }
  return "UNKNOWN";
}

/**
 * Возвращает имя/адрес attendee из REPLY.
 * @param {calIItipItem} itipItem
 * @returns {string}
 */
function getReplyAttendeeLabel(itipItem) {
  try {
    for (const item of itipItem.getItemList()) {
      const attendees = item.getAttendees();
      if (attendees.length > 0) {
        const att = attendees[0];
        return att.commonName || att.id?.replace(/^mailto:/i, "") || "";
      }
    }
  } catch (e) {}
  return "";
}

/**
 * Возвращает COMMENT из первого VEVENT, если есть.
 * @param {calIItipItem} itipItem
 * @returns {string|null}
 */
function getReplyComment(itipItem) {
  try {
    for (const item of itipItem.getItemList()) {
      const comment = item.getProperty("COMMENT");
      if (comment) {
        return comment;
      }
    }
  } catch (e) {}
  return null;
}
