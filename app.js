
(() => {
  "use strict";

  const config = window.POSNET_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  const state = {
    language: config.DEFAULT_LANGUAGE === "en" ? "en" : "th",
    theme: config.DEFAULT_THEME === "dark" ? "dark" : "light",
    liffReady: false,
    authenticated: false,
    scanner: null,
    scanning: false,
    scannerStarting: false,
    scanHandled: false,
    profile: null
  };

  const i18n = {
    th: {
      secure: "SECURE SESSION",
      overline: "PAYMENT AUTHENTICATION",
      title: "E-Slip Scanner",
      subtitle: "ยืนยันตัวตนผ่าน LINE แล้วสแกน QR Code บนสลิปอย่างปลอดภัย",
      meta: "Fast. Secure. Verified.",
      stepOne: "STEP ONE",
      authTitle: "LINE Authentication",
      notConnected: "Not connected",
      authDesc: "เชื่อมต่อผ่าน LINE LIFF เพื่อเริ่มใช้งานเครื่องสแกน",
      lineDesc: "เข้าสู่ระบบอย่างปลอดภัยด้วย LINE",
      authButton: "ยืนยันตัวตนด้วย LINE",
      authHint: "กรุณายืนยันตัวตนผ่าน LINE ก่อนเริ่มสแกน",
      authenticated: "ยืนยันตัวตนผ่าน LINE แล้ว",
      stepTwo: "STEP TWO",
      scanTitle: "สแกน QR สลิป",
      scanDesc: "วาง QR Code ของสลิปไว้ตรงกลางกรอบสแกน",
      cameraLabel: "กล้อง",
      scannerReady: "พร้อมสแกน",
      scannerHint: "ยืนยันตัวตนผ่าน LINE เพื่อเปิดใช้งานกล้อง",
      scanButton: "เริ่มสแกน QR",
      stopButton: "หยุดสแกน",
      scanLocked: "กรุณายืนยันตัวตนผ่าน LINE ก่อนเปิดใช้งานเครื่องสแกน",
      scanSuccess: "อ่าน QR Code สำเร็จ",
      scanSuccessDesc: "ข้อมูลที่อ่านได้พร้อมใช้งาน",
      decodedLabel: "ข้อมูล QR CODE",
      copyButton: "คัดลอกข้อมูล QR",
      privacy: "แสดงข้อมูล QR ภายในหน้านี้เท่านั้น ไม่มีการเรียก API ตรวจสอบการชำระเงิน",
      footer: "ออกแบบสำหรับสแกนอย่างปลอดภัยภายใน LINE",
      authRequired: "กรุณายืนยันตัวตนผ่าน LINE ก่อน",
      liffMissing: "ยังไม่ได้ตั้งค่า LIFF ID ใน web/config.js",
      authFailed: "ไม่สามารถเริ่มการยืนยันตัวตนผ่าน LINE ได้",
      cameraDenied: "ไม่สามารถเข้าถึงกล้องได้ โปรดอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์",
      cameraError: "ไม่สามารถเปิดกล้องได้ โปรดใช้ HTTPS และตรวจสอบสิทธิ์กล้อง",
      noCamera: "ไม่พบกล้องบนอุปกรณ์นี้",
      scanning: "กำลังสแกน กรุณาจัด QR Code ให้อยู่ในกรอบ",
      stopped: "หยุดการสแกนแล้ว",
      copied: "คัดลอกข้อมูล QR แล้ว",
      copyFailed: "ไม่สามารถคัดลอกได้",
      scanError: "เกิดข้อผิดพลาดระหว่างสแกน QR"
    },
    en: {
      secure: "SECURE SESSION",
      overline: "PAYMENT AUTHENTICATION",
      title: "E-Slip Scanner",
      subtitle: "Authenticate with LINE, then scan the slip QR code securely.",
      meta: "Fast. Secure. Verified.",
      stepOne: "STEP ONE",
      authTitle: "LINE Authentication",
      notConnected: "Not connected",
      authDesc: "Connect through LINE LIFF to unlock the QR scanner.",
      lineDesc: "Secure sign-in with LINE",
      authButton: "Authenticate with LINE",
      authHint: "LINE authentication is required before scanning.",
      authenticated: "Authenticated with LINE",
      stepTwo: "STEP TWO",
      scanTitle: "Scan E-Slip QR",
      scanDesc: "Align the slip QR code in the center of the scan frame.",
      cameraLabel: "CAMERA",
      scannerReady: "Scanner ready",
      scannerHint: "Authenticate with LINE to enable camera access",
      scanButton: "Start QR scanner",
      stopButton: "Stop scanning",
      scanLocked: "Authenticate with LINE first to unlock the scanner.",
      scanSuccess: "QR code captured",
      scanSuccessDesc: "Decoded content is ready to use.",
      decodedLabel: "DECODED QR CONTENT",
      copyButton: "Copy QR content",
      privacy: "QR content is displayed locally. No payment verification API is called.",
      footer: "Designed for secure scanning inside LINE",
      authRequired: "Please authenticate with LINE first.",
      liffMissing: "LIFF ID is not configured in web/config.js.",
      authFailed: "Unable to start LINE authentication.",
      cameraDenied: "Camera access denied. Allow camera permission in your browser settings.",
      cameraError: "Could not start the camera. Use HTTPS and check camera permissions.",
      noCamera: "No camera was found on this device.",
      scanning: "Scanning. Align the QR code inside the frame.",
      stopped: "Scanning stopped.",
      copied: "QR content copied.",
      copyFailed: "Could not copy QR content.",
      scanError: "An error occurred while scanning the QR code."
    }
  };

  const t = (key) =>
    i18n[state.language][key] || i18n.en[key] || key;

  function applyLanguage() {
    document.documentElement.lang = state.language;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (i18n[state.language][key]) {
        el.textContent = t(key);
      }
    });

    $("languageToggle").textContent =
      state.language === "th" ? "EN" : "TH";

    if (state.authenticated) {
      $("authState").innerHTML =
        '<span class="state-dot"></span><span>' +
        (state.language === "th" ? "เชื่อมต่อแล้ว" : "Connected") +
        "</span>";

      $("profileName").textContent =
        state.profile?.displayName ||
        (state.language === "th" ? "ผู้ใช้ LINE" : "LINE User");

      if (!state.scanning && !state.scannerStarting) {
        $("scannerPlaceholder").querySelector("strong").textContent =
          t("scannerReady");

        $("scannerPlaceholder").querySelector("span").textContent =
          state.language === "th"
            ? "กดเริ่มสแกน QR เพื่อเปิดกล้อง"
            : "Tap Start QR scanner to open the camera";
      }
    }
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      meta.content =
        state.theme === "dark" ? "#071321" : "#0b2850";
    }

    $("themeToggle").setAttribute(
      "aria-label",
      state.theme === "dark"
        ? "Switch to light theme"
        : "Switch to dark theme"
    );
  }

  let toastTimer;

  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("visible");
    }, 2600);
  }

  function setFeedback(message) {
    const feedback = $("scanFeedback");

    if (feedback?.lastElementChild) {
      feedback.lastElementChild.textContent = message;
    }
  }

  function setScannerPlaceholder(visible) {
    const placeholder = $("scannerPlaceholder");

    if (!placeholder) return;

    placeholder.hidden = !visible;
  }

  function setAuthUi(profile = null) {
    state.authenticated = true;

    if (profile) {
      state.profile = profile;
    }

    $("authState").classList.add("connected");

    $("authState").innerHTML =
      '<span class="state-dot"></span><span>' +
      (state.language === "th" ? "เชื่อมต่อแล้ว" : "Connected") +
      "</span>";

    $("authMessage").hidden = true;
    $("profile").hidden = false;

    $("profileName").textContent =
      state.profile?.displayName ||
      (state.language === "th" ? "ผู้ใช้ LINE" : "LINE User");

    const avatar = $("avatar");
    avatar.replaceChildren();

    if (state.profile?.pictureUrl) {
      const img = document.createElement("img");
      img.src = state.profile.pictureUrl;
      img.alt = "";
      avatar.append(img);
    } else {
      avatar.textContent =
        (state.profile?.displayName || "L")
          .trim()
          .charAt(0)
          .toUpperCase();
    }

    $("scanBtn").disabled = false;

    if (!state.scanning && !state.scannerStarting) {
      setScannerPlaceholder(true);

      $("scannerPlaceholder").querySelector("strong").textContent =
        t("scannerReady");

      $("scannerPlaceholder").querySelector("span").textContent =
        state.language === "th"
          ? "กดเริ่มสแกน QR เพื่อเปิดกล้อง"
          : "Tap Start QR scanner to open the camera";

      setFeedback(
        state.language === "th"
          ? "ยืนยันตัวตนแล้ว สามารถเปิดกล้องเพื่อสแกน QR ได้"
          : "Authenticated. You can now open the camera to scan a QR code."
      );
    }
  }

  async function authenticate() {
    const liffId = String(config.LIFF_ID || "").trim();

    if (!liffId || liffId === "YOUR_LIFF_ID") {
      $("authMessage").textContent = t("liffMissing");
      toast(t("liffMissing"));
      return;
    }

    if (!window.liff) {
      $("authMessage").textContent = t("authFailed");
      toast(t("authFailed"));
      return;
    }

    $("authBtn").disabled = true;

    try {
      if (!state.liffReady) {
        await window.liff.init({ liffId });
        state.liffReady = true;
      }

      if (!window.liff.isLoggedIn()) {
        window.liff.login({
          redirectUri: window.location.href
        });
        return;
      }

      let profile = null;

      try {
        profile = await window.liff.getProfile();
      } catch (err) {
        console.warn("Unable to get LINE profile:", err);
      }

      setAuthUi(profile);
    } catch (err) {
      console.error("LINE authentication failed:", err);

      $("authMessage").textContent =
        t("authFailed") +
        (err?.message ? " (" + err.message + ")" : "");

      toast(t("authFailed"));
    } finally {
      if (!state.authenticated) {
        $("authBtn").disabled = false;
      }
    }
  }

  async function startScanner() {
    if (!state.authenticated) {
      toast(t("authRequired"));
      return;
    }

    if (state.scanning || state.scannerStarting) {
      return;
    }

    if (!window.Html5Qrcode) {
      setFeedback(t("cameraError"));
      toast(t("cameraError"));
      return;
    }

    state.scannerStarting = true;
    state.scanHandled = false;

    const scanBtn = $("scanBtn");
    const stopBtn = $("stopBtn");
    const placeholder = $("scannerPlaceholder");
    const guide = $("scanGuide");
    const frame = $("scannerFrame");
    const reader = $("qr-reader");
    const result = $("qrResult");

    scanBtn.disabled = true;
    scanBtn.hidden = true;
    stopBtn.hidden = false;

    setScannerPlaceholder(true);
    guide.hidden = true;
    frame.classList.remove("is-scanning");
    result.hidden = true;

    setFeedback(
      state.language === "th"
        ? "กำลังเปิดกล้อง กรุณารอสักครู่..."
        : "Starting camera. Please wait..."
    );

    let scanner = null;

    try {
      const cameras = await window.Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        const error = new Error("NO_CAMERA");
        error.code = "NO_CAMERA";
        throw error;
      }

      const camera =
        cameras.find((c) =>
          /back|rear|environment|หลัง/i.test(c.label)
        ) || cameras[cameras.length - 1];

      reader.replaceChildren();

      scanner = new window.Html5Qrcode("qr-reader", {
        verbose: false
      });

      state.scanner = scanner;

      await scanner.start(
        camera.id,
        {
          fps: 10,
          aspectRatio: 1,
          qrbox: (width, height) => {
            const size = Math.max(
              140,
              Math.min(
                220,
                Math.floor(Math.min(width, height) * 0.72)
              )
            );

            return { width: size, height: size };
          }
        },
        async (decoded) => {
          if (
            state.scanHandled ||
            state.scanner !== scanner
          ) {
            return;
          }

          state.scanHandled = true;

          $("decodedValue").textContent = decoded;
          result.hidden = false;

          setFeedback(t("scanSuccess"));

          await stopScanner(false);

          // Keep the result visible without the placeholder overlay.
          result.hidden = false;
          setScannerPlaceholder(false);
          guide.hidden = true;
          frame.classList.remove("is-scanning");

          result.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        },
        () => {}
      );

      // The user may have stopped the scanner while it was starting.
      if (state.scanner !== scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (_) {}

        try {
          scanner.clear();
        } catch (_) {}

        return;
      }

      state.scanning = true;
      state.scannerStarting = false;

      setScannerPlaceholder(false);
      guide.hidden = false;
      frame.classList.add("is-scanning");

      scanBtn.hidden = true;
      scanBtn.disabled = false;
      stopBtn.hidden = false;

      setFeedback(t("scanning"));
    } catch (err) {
      console.error("QR scanner start failed:", err);

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (_) {}

        try {
          scanner.clear();
        } catch (_) {}
      }

      if (state.scanner === scanner) {
        state.scanner = null;
      }

      state.scanning = false;
      state.scannerStarting = false;

      scanBtn.hidden = false;
      scanBtn.disabled = false;
      stopBtn.hidden = true;

      setScannerPlaceholder(true);
      guide.hidden = true;
      frame.classList.remove("is-scanning");

      const msg =
        err?.code === "NO_CAMERA" ||
        err?.message === "NO_CAMERA"
          ? t("noCamera")
          : err?.name === "NotAllowedError" ||
            err?.name === "PermissionDeniedError"
          ? t("cameraDenied")
          : t("cameraError");

      setFeedback(msg);
      toast(msg);
    }
  }

  async function stopScanner(showMessage = true) {
    const scanner = state.scanner;

    // Reset state before awaiting camera shutdown.
    state.scanner = null;
    state.scanning = false;
    state.scannerStarting = false;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn("Unable to stop QR scanner:", err);
      }

      try {
        scanner.clear();
      } catch (_) {}
    }

    $("scanBtn").hidden = false;
    $("scanBtn").disabled = false;
    $("stopBtn").hidden = true;

    $("scanGuide").hidden = true;
    $("scannerFrame").classList.remove("is-scanning");

    if (showMessage) {
      $("qr-reader").replaceChildren();
      $("qrResult").hidden = true;
      setScannerPlaceholder(true);
      setFeedback(t("stopped"));
    } else if (!$("qrResult").hidden) {
      // A successful scan should not be covered by the placeholder.
      setScannerPlaceholder(false);
    } else {
      setScannerPlaceholder(true);
    }
  }

  async function copyQr() {
    const value = $("decodedValue")?.textContent?.trim();

    if (!value) {
      toast(t("scanError"));
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.setAttribute("readonly", "");

        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();

        if (!copied) {
          throw new Error("COPY_FAILED");
        }
      }

      toast(t("copied"));
    } catch (err) {
      console.error("Copy QR failed:", err);
      toast(t("copyFailed"));
    }
  }

  $("languageToggle").addEventListener("click", () => {
    state.language = state.language === "th" ? "en" : "th";
    applyLanguage();
  });

  $("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });

  $("authBtn").addEventListener("click", authenticate);
  $("scanBtn").addEventListener("click", startScanner);
  $("stopBtn").addEventListener("click", () => stopScanner(true));
  $("copyBtn").addEventListener("click", copyQr);

  window.addEventListener("pagehide", () => {
    const scanner = state.scanner;

    if (scanner && scanner.isScanning) {
      scanner.stop().catch(() => {});
    }
  });

  applyLanguage();
  applyTheme();

  (async () => {
    const liffId = String(config.LIFF_ID || "").trim();

    if (
      !liffId ||
      liffId === "YOUR_LIFF_ID" ||
      !window.liff
    ) {
      return;
    }

    try {
      await window.liff.init({ liffId });
      state.liffReady = true;

      if (window.liff.isLoggedIn()) {
        let profile = null;

        try {
          profile = await window.liff.getProfile();
        } catch (err) {
          console.warn("Unable to get LINE profile:", err);
        }

        setAuthUi(profile);
      }
    } catch (err) {
      console.warn("LIFF initialization failed:", err);
    }
  })();
})();
