(() => {
  "use strict";
  const config = window.POSNET_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const state = { language: config.DEFAULT_LANGUAGE === "en" ? "en" : "th", theme: config.DEFAULT_THEME === "dark" ? "dark" : "light", liffReady: false, authenticated: false, scanner: null, scanning: false, scanHandled: false };

  const i18n = {
    th: {
      secure:"SECURE SESSION", overline:"PAYMENT AUTHENTICATION", title:"E-Slip Scanner", subtitle:"ยืนยันตัวตนผ่าน LINE แล้วสแกน QR Code บนสลิปอย่างปลอดภัย", meta:"Fast. Secure. Verified.",
      stepOne:"STEP ONE", authTitle:"LINE Authentication", notConnected:"Not connected", authDesc:"เชื่อมต่อผ่าน LINE LIFF เพื่อเริ่มใช้งานเครื่องสแกน",
      lineDesc:"เข้าสู่ระบบอย่างปลอดภัยด้วย LINE", authButton:"ยืนยันตัวตนด้วย LINE", authHint:"กรุณายืนยันตัวตนผ่าน LINE ก่อนเริ่มสแกน", authenticated:"ยืนยันตัวตนผ่าน LINE แล้ว",
      stepTwo:"STEP TWO", scanTitle:"สแกน QR สลิป", scanDesc:"วาง QR Code ของสลิปไว้ตรงกลางกรอบสแกน", cameraLabel:"กล้อง", scannerReady:"พร้อมสแกน", scannerHint:"ยืนยันตัวตนผ่าน LINE เพื่อเปิดใช้งานกล้อง",
      scanButton:"เริ่มสแกน QR", stopButton:"หยุดสแกน", scanLocked:"กรุณายืนยันตัวตนผ่าน LINE ก่อนเปิดใช้งานเครื่องสแกน",
      scanSuccess:"อ่าน QR Code สำเร็จ", scanSuccessDesc:"ข้อมูลที่อ่านได้พร้อมใช้งาน", decodedLabel:"ข้อมูล QR CODE", copyButton:"คัดลอกข้อมูล QR",
      privacy:"แสดงข้อมูล QR ภายในหน้านี้เท่านั้น ไม่มีการเรียก API ตรวจสอบการชำระเงิน", footer:"ออกแบบสำหรับสแกนอย่างปลอดภัยภายใน LINE",
      authRequired:"กรุณายืนยันตัวตนผ่าน LINE ก่อน", liffMissing:"ยังไม่ได้ตั้งค่า LIFF ID ใน web/config.js", authFailed:"ไม่สามารถเริ่มการยืนยันตัวตนผ่าน LINE ได้",
      cameraDenied:"ไม่สามารถเข้าถึงกล้องได้ โปรดอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์", cameraError:"ไม่สามารถเปิดกล้องได้ โปรดใช้ HTTPS และตรวจสอบสิทธิ์กล้อง",
      noCamera:"ไม่พบกล้องบนอุปกรณ์นี้", scanning:"กำลังสแกน กรุณาจัด QR Code ให้อยู่ในกรอบ", stopped:"หยุดการสแกนแล้ว", copied:"คัดลอกข้อมูล QR แล้ว", copyFailed:"ไม่สามารถคัดลอกได้",
      scanError:"เกิดข้อผิดพลาดระหว่างสแกน QR"
    },
    en: {
      secure:"SECURE SESSION", overline:"PAYMENT AUTHENTICATION", title:"E-Slip Scanner", subtitle:"Authenticate with LINE, then scan the slip QR code securely.", meta:"Fast. Secure. Verified.",
      stepOne:"STEP ONE", authTitle:"LINE Authentication", notConnected:"Not connected", authDesc:"Connect through LINE LIFF to unlock the QR scanner.",
      lineDesc:"Secure sign-in with LINE", authButton:"Authenticate with LINE", authHint:"LINE authentication is required before scanning.", authenticated:"Authenticated with LINE",
      stepTwo:"STEP TWO", scanTitle:"Scan E-Slip QR", scanDesc:"Align the slip QR code in the center of the scan frame.", cameraLabel:"CAMERA", scannerReady:"Scanner ready", scannerHint:"Authenticate with LINE to enable camera access",
      scanButton:"Start QR scanner", stopButton:"Stop scanning", scanLocked:"Authenticate with LINE first to unlock the scanner.",
      scanSuccess:"QR code captured", scanSuccessDesc:"Decoded content is ready to use.", decodedLabel:"DECODED QR CONTENT", copyButton:"Copy QR content",
      privacy:"QR content is displayed locally. No payment verification API is called.", footer:"Designed for secure scanning inside LINE",
      authRequired:"Please authenticate with LINE first.", liffMissing:"LIFF ID is not configured in web/config.js.", authFailed:"Unable to start LINE authentication.",
      cameraDenied:"Camera access denied. Allow camera permission in your browser settings.", cameraError:"Could not start the camera. Use HTTPS and check camera permissions.",
      noCamera:"No camera was found on this device.", scanning:"Scanning. Align the QR code inside the frame.", stopped:"Scanning stopped.", copied:"QR content copied.", copyFailed:"Could not copy QR content.",
      scanError:"An error occurred while scanning the QR code."
    }
  };
  const t = key => i18n[state.language][key] || i18n.en[key] || key;

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.querySelectorAll("[data-i18n]").forEach(el => { const key = el.dataset.i18n; if (i18n[state.language][key]) el.textContent = t(key); });
    $("languageToggle").textContent = state.language === "th" ? "EN" : "TH";
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.theme === "dark" ? "#071321" : "#0b2850";
    $("themeToggle").setAttribute("aria-label", state.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  let toastTimer;
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }
  function setAuthUi(profile = null) {
    state.authenticated = true;
    $("authState").classList.add("connected");
    $("authState").innerHTML = '<span class="state-dot"></span><span>' + (state.language === "th" ? "เชื่อมต่อแล้ว" : "Connected") + '</span>';
    $("authMessage").hidden = true;
    $("profile").hidden = false;
    $("profileName").textContent = profile?.displayName || (state.language === "th" ? "ผู้ใช้ LINE" : "LINE User");
    const avatar = $("avatar");
    avatar.replaceChildren();
    if (profile?.pictureUrl) {
      const img = document.createElement("img"); img.src = profile.pictureUrl; img.alt = ""; avatar.append(img);
    } else avatar.textContent = (profile?.displayName || "L").trim().charAt(0).toUpperCase();
    $("scanBtn").disabled = false;
    $("scanFeedback").lastElementChild.textContent = state.language === "th" ? "ยืนยันตัวตนแล้ว สามารถเปิดกล้องเพื่อสแกน QR ได้" : "Authenticated. You can now open the camera to scan a QR code.";
    $("scannerPlaceholder").querySelector("strong").textContent = t("scannerReady");
    $("scannerPlaceholder").querySelector("span").textContent = state.language === "th" ? "กดเริ่มสแกน QR เพื่อเปิดกล้อง" : "Tap Start QR scanner to open the camera";
  }
  async function authenticate() {
    const liffId = String(config.LIFF_ID || "").trim();
    if (!liffId || liffId === "YOUR_LIFF_ID") { toast(t("liffMissing")); $("authMessage").textContent = t("liffMissing"); return; }
    if (!window.liff) { toast(t("authFailed")); return; }
    $("authBtn").disabled = true;
    try {
      if (!state.liffReady) {
        await liff.init({ liffId });
        state.liffReady = true;
      }
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      let profile = null;
      try { profile = await liff.getProfile(); } catch (_) {}
      setAuthUi(profile);
    } catch (err) {
      $("authMessage").textContent = t("authFailed") + (err?.message ? " (" + err.message + ")" : "");
      toast(t("authFailed"));
    } finally {
      if (!state.authenticated) $("authBtn").disabled = false;
    }
  }
  async function startScanner() {
    if (!state.authenticated) { toast(t("authRequired")); return; }
    if (state.scanning) return;
    if (!window.Html5Qrcode) { toast(t("cameraError")); return; }
    try {
      $("scannerPlaceholder").hidden = true;
      $("scanGuide").hidden = false;
      $("scanFeedback").lastElementChild.textContent = t("scanning");
      state.scanner = new Html5Qrcode("qr-reader", { verbose: false });
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) throw new Error("NO_CAMERA");
      const camera = cameras.find(c => /back|rear|environment|หลัง/i.test(c.label)) || cameras[cameras.length - 1];
      await state.scanner.start(camera.id, {
        fps: 10, aspectRatio: 1.0,
        qrbox: (width, height) => { const size = Math.max(140, Math.min(220, Math.floor(Math.min(width, height) * .72))); return { width: size, height: size }; }
      }, decoded => {
        if (state.scanHandled) return;
        state.scanHandled = true;
        $("decodedValue").textContent = decoded;
        $("qrResult").hidden = false;
        $("scanFeedback").lastElementChild.textContent = t("scanSuccess");
        stopScanner(false);
        $("qrResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, () => {});
      state.scanning = true;
      $("scanBtn").hidden = true;
      $("stopBtn").hidden = false;
    } catch (err) {
      await stopScanner(false);
      $("scannerPlaceholder").hidden = false;
      $("scanGuide").hidden = true;
      const msg = err?.message === "NO_CAMERA" ? t("noCamera") : (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" ? t("cameraDenied") : t("cameraError"));
      $("scanFeedback").lastElementChild.textContent = msg;
      toast(msg);
    }
  }
  async function stopScanner(showMessage = true) {
    if (state.scanner) {
      try { if (state.scanning) await state.scanner.stop(); } catch (_) {}
      try { await state.scanner.clear(); } catch (_) {}
    }
    state.scanner = null; state.scanning = false;
    $("scanBtn").hidden = false; $("stopBtn").hidden = true;
    $("scanGuide").hidden = true; $("scannerPlaceholder").hidden = false;
    if (showMessage) $("scanFeedback").lastElementChild.textContent = t("stopped");
  }
  async function copyQr() {
    const value = $("decodedValue").textContent || "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast(t("copied"));
    } catch (_) {
      const range = document.createRange(); range.selectNodeContents($("decodedValue"));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      toast(t("copyFailed"));
    }
  }

  $("languageToggle").addEventListener("click", () => { state.language = state.language === "th" ? "en" : "th"; applyLanguage(); if (state.authenticated) setAuthUi(); });
  $("themeToggle").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; applyTheme(); });
  $("authBtn").addEventListener("click", authenticate);
  $("scanBtn").addEventListener("click", startScanner);
  $("stopBtn").addEventListener("click", () => stopScanner(true));
  $("copyBtn").addEventListener("click", copyQr);
  window.addEventListener("pagehide", () => { if (state.scanner && state.scanning) state.scanner.stop().catch(() => {}); });

  applyLanguage(); applyTheme();
  (async () => {
    const liffId = String(config.LIFF_ID || "").trim();
    if (!liffId || liffId === "YOUR_LIFF_ID" || !window.liff) return;
    try {
      await liff.init({ liffId }); state.liffReady = true;
      if (liff.isLoggedIn()) {
        let profile = null; try { profile = await liff.getProfile(); } catch (_) {}
        setAuthUi(profile);
      }
    } catch (_) { /* Explicit authentication action reports failures to the user. */ }
  })();
})();
