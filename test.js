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


/**
 * Создаёт DOM-узел баннера статуса ответа.
 * Вызывается при method === "REPLY".
 *
 * @param {calIItipItem} itipItem
 * @param {Document} doc
 * @returns {Element}
 */
function buildReplyStatusBanner(itipItem, doc) {
  const partStat = getReplyPartStat(itipItem);   // "ACCEPTED" | "DECLINED" | "TENTATIVE" | "UNKNOWN"
  const attendee = getReplyAttendeeLabel(itipItem);
  const comment  = getReplyComment(itipItem);

  // Название события из первого item
  let eventTitle = "";
  try {
    const items = itipItem.getItemList();
    if (items.length > 0) {
      eventTitle = items[0].title || "";
    }
  } catch (e) {}

  // Выбираем иконку (используем встроенные SVG-иконки Thunderbird из chrome://messenger)
  const iconMap = {
    ACCEPTED:  "chrome://calendar/skin/icons/invitation-accepted.svg",
    DECLINED:  "chrome://calendar/skin/icons/invitation-declined.svg",
    TENTATIVE: "chrome://calendar/skin/icons/invitation-tentative.svg",
    UNKNOWN:   "chrome://calendar/skin/icons/invitation-reply.svg",
  };

  // Выбираем Fluent-ключ
  const hasComment = !!comment;
  const ftlKeyMap = {
    ACCEPTED:  hasComment ? "calendar-invitation-panel-reply-accepted-comment"
                          : "calendar-invitation-panel-reply-accepted",
    DECLINED:  hasComment ? "calendar-invitation-panel-reply-declined-comment"
                          : "calendar-invitation-panel-reply-declined",
    TENTATIVE: hasComment ? "calendar-invitation-panel-reply-tentative-comment"
                          : "calendar-invitation-panel-reply-tentative",
    UNKNOWN:   "calendar-invitation-panel-reply-unknown",
  };

  const banner = doc.createElement("div");
  banner.classList.add("itip-reply-banner");
  banner.setAttribute("status", partStat);

  // Иконка
  const icon = doc.createElement("img");
  icon.classList.add("itip-reply-icon");
  icon.src = iconMap[partStat] || iconMap.UNKNOWN;
  icon.setAttribute("aria-hidden", "true");
  banner.appendChild(icon);

  // Текстовый контейнер
  const textWrap = doc.createElement("div");
  textWrap.style.flex = "1";

  // Основной текст через Fluent
  const mainText = doc.createElement("p");
  mainText.style.margin = "0";
  doc.l10n.setAttributes(mainText, ftlKeyMap[partStat] || ftlKeyMap.UNKNOWN, {
    organizer: attendee,
    title: eventTitle,
  });
  textWrap.appendChild(mainText);

  // Комментарий, если есть
  if (comment) {
    const commentEl = doc.createElement("p");
    commentEl.classList.add("itip-reply-comment");
    commentEl.style.margin = "0";
    commentEl.textContent = comment;
    textWrap.appendChild(commentEl);
  }

  banner.appendChild(textWrap);
  return banner;
}
