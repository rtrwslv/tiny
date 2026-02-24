async function SaveAsTemplate(uri) {
  console.log("=== SaveAsTemplate DEBUG ===");
  console.log("gMessage:", typeof gMessage !== "undefined" ? gMessage : "undefined");
  console.log("gMessage?.folder:", typeof gMessage !== "undefined" ? gMessage?.folder : "N/A");
  console.log("gDBView:", typeof gDBView !== "undefined" ? gDBView : "undefined");
  console.log("browser.currentURI:", document.getElementById("messagepane")?.currentURI?.spec);
  console.log("windowtype:", document.documentElement.getAttribute("windowtype"));
  console.log("========================");
  
  // ... остальной код
}
