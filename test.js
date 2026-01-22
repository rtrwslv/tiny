function matchFrom(hdr, value) {
  return hdr.author?.toLowerCase().includes(value);
}

function matchTo(hdr, value) {
  return hdr.recipients?.toLowerCase().includes(value);
}

function matchCc(hdr, value) {
  return hdr.ccList?.toLowerCase().includes(value);
}

const FIELD_MATCHERS = {
  from: matchFrom,
  to: matchTo,
  cc: matchCc
};

function matchesAllConditions(hdr, conditions) {
  for (let cond of conditions) {
    let matcher = FIELD_MATCHERS[cond.field];
    if (!matcher) {
      console.warn("Неизвестное поле:", cond.field);
      return false;
    }

    if (!matcher(hdr, cond.value.toLowerCase())) {
      return false; // ❌ одно из условий не выполнено
    }
  }
  return true; // ✅ все условия выполнены
}

function getHdr(msg) {
  try {
    return MailServices.messageServiceFromURI(msg.uri)
      .messageURIToMsgHdr(msg.uri);
  } catch (e) {
    return null;
  }
}
