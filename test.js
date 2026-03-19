// В консоли DevTools на about3Pane:
const orig = document.dispatchEvent.bind(document);
document.dispatchEvent = function(e) {
  if (!e.type.startsWith("mouse") && !e.type.startsWith("pointer")) {
    console.log("dispatchEvent:", e.type, new Error().stack.split("\n")[1]);
  }
  return orig(e);
};
