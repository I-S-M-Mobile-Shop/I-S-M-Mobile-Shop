(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var toast = $("toast"), toastTimer;

  // Clean URL of this page (no query string or hash)
  function pageUrl() { return location.href.split("#")[0].split("?")[0]; }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {          // fallback for older browsers / file://
      var t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", "");
      t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(t);
    });
  }

  function copyLink() {
    return copyText(pageUrl()).then(
      function () { showToast("Link copied"); },
      function () { showToast("Couldn't copy. Copy the address bar link instead."); }
    );
  }

  $("copyBtn").addEventListener("click", copyLink);

  $("shareBtn").addEventListener("click", function () {
    if (navigator.share) {
      navigator.share({ title: "ISM Mobile Shop", text: "ISM Mobile Shop: Your Trusted Mobile & Electronics Store", url: pageUrl() })
        .catch(function (e) { if (e && e.name !== "AbortError") copyLink(); });
    } else {
      copyLink();                                            // no Web Share API: copy instead
    }
  });

  // QR code
  var dialog = $("qrDialog"), canvas = $("qrCanvas");

  function drawQR(text) {
    var modules = makeQR(text), n = modules.length, quiet = 4, scale = 10;
    var px = (n + quiet * 2) * scale, ctx;
    canvas.width = canvas.height = px;                       // full-resolution canvas, CSS scales it down
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = "#07090d";
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++)
      if (modules[y][x]) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
  }

  $("qrBtn").addEventListener("click", function () {
    var url = pageUrl();
    try { drawQR(url); } catch (e) { showToast("Couldn't create the QR code"); return; }
    $("qrUrl").textContent = url;
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  });
  $("qrClose").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

  $("qrDownload").addEventListener("click", function () {
    var a = document.createElement("a");
    a.download = "ism-mobile-shop-qr.png";
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast("QR code downloaded");
  });

  $("year").textContent = new Date().getFullYear();
})();
