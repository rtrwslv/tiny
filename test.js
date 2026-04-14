QuickFilterManager.defineFilter({
  name: "allowedIds",

  getDefaults() {
    return {
      enabled: false,
      allowedSet: null,
    };
  },

  /**
   * 🔥 ВАЖНО: сюда превращаем allowedSet в search terms
   */
  appendTerms(terms, state) {
    if (!state?.enabled || !state?.allowedSet) {
      return;
    }

    for (let id of state.allowedSet) {
      terms.push({
        term: {
          attrib: Ci.nsMsgSearchAttrib.MessageId,
          op: Ci.nsMsgSearchOp.Contains,
          value: id,
        },
        booleanAnd: false, // OR между ID
      });
    }
  },
});

function applyAllowedIdsFilter(win, allowedSet) {
  let qfb = win.QuickFilterBarMuxer;

  qfb.setFilterValue("allowedIds", {
    enabled: true,
    allowedSet,
  });

  qfb.deferredUpdateSearch();
}
