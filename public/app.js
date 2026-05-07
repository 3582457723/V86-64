// DOM elements initialization function
function initializeDOMElements() {
  return {
    isoUpload: document.getElementById("iso-upload"),
    uploadBtn: document.getElementById("upload-btn"),
    uploadStatus: document.getElementById("upload-status"),
    uploadProgress: document.getElementById("upload-progress"),
    uploadProgressBar: document.getElementById("upload-progress-bar"),
    osSelect: document.getElementById("os-select"),
    architectureSelect: document.getElementById("architecture-select"),
    memorySelect: document.getElementById("memory-size"),
    cpuSelect: document.getElementById("cpu-count"),
    startButton: document.getElementById("start"),
    resetButton: document.getElementById("reset"),
    stopButton: document.getElementById("stop"),
    statusLabel: document.getElementById("status"),
    logOutput: document.getElementById("log-output"),
    screenContainer: document.getElementById("screen"),
  };
}

let dom = null;
let emulator = null;
let isoUrl = null;
let currentArchitecture = "x86-64";
let isoList = [];

// Logging function
function log(message) {
  if (!dom || !dom.logOutput) return;
  const now = new Date().toLocaleTimeString();
  dom.logOutput.textContent += `[${now}] ${message}\n`;
  dom.logOutput.scrollTop = dom.logOutput.scrollHeight;
  console.log(`[LOG] ${message}`);
}

// Status update
function updateStatus(text, color = "var(--accent)") {
  if (!dom || !dom.statusLabel) return;
  dom.statusLabel.textContent = text;
  dom.statusLabel.style.color = color;
  console.log(`[STATUS] ${text}`);
}

// ISO upload handler
function setupUploadHandler() {
  dom.uploadBtn.addEventListener("click", async () => {
    const file = dom.isoUpload.files[0];
    if (!file) {
      dom.uploadStatus.textContent = "ファイルを選択してください";
      dom.uploadStatus.style.color = "#ff6f61";
      return;
    }

    dom.uploadBtn.disabled = true;
    dom.uploadProgress.style.display = "block";
    dom.uploadStatus.textContent = "アップロード中...";
    dom.uploadStatus.style.color = "#5ad8ff";

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        dom.uploadProgressBar.style.width = percent + "%";
      }
    });

    xhr.addEventListener("load", () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          dom.uploadStatus.textContent = `✓ ${result.filename} (${result.architecture})`;
          dom.uploadStatus.style.color = "#8fffa5";
          log(`ISO アップロード完了: ${result.filename} (${result.architecture})`);
          dom.isoUpload.value = "";
          dom.uploadProgress.style.display = "none";
          dom.uploadProgressBar.style.width = "0%";
          populateIsoList();
        } else {
          let errorMsg = "アップロード失敗";
          try {
            const result = JSON.parse(xhr.responseText);
            errorMsg = result.error || errorMsg;
          } catch (e) {}
          throw new Error(errorMsg);
        }
      } catch (error) {
        dom.uploadStatus.textContent = `エラー: ${error.message}`;
        dom.uploadStatus.style.color = "#ff6f61";
        log(`アップロードエラー: ${error.message}`);
      } finally {
        dom.uploadBtn.disabled = false;
      }
    });

    xhr.addEventListener("error", () => {
      dom.uploadStatus.textContent = "ネットワークエラー";
      dom.uploadStatus.style.color = "#ff6f61";
      log("アップロード: ネットワークエラー");
      dom.uploadBtn.disabled = false;
    });

    xhr.addEventListener("abort", () => {
      dom.uploadStatus.textContent = "キャンセルされました";
      dom.uploadStatus.style.color = "#ff6f61";
      dom.uploadBtn.disabled = false;
    });

    try {
      xhr.open("POST", "/upload-iso", true);
      xhr.send(formData);
    } catch (error) {
      dom.uploadStatus.textContent = `エラー: ${error.message}`;
      dom.uploadStatus.style.color = "#ff6f61";
      dom.uploadBtn.disabled = false;
    }
  });
}

// Reset emulator
function resetEmulator() {
  if (emulator) {
    try {
      emulator.stop();
    } catch (error) {
      console.warn(error);
    }
    emulator = null;
  }
  dom.screenContainer.innerHTML = "";
  updateStatus("停止しました", "#ff6f61");
  dom.resetButton.disabled = true;
  dom.stopButton.disabled = true;
  dom.startButton.disabled = !isoUrl;
}

// Start emulator with selected architecture
function startEmulator() {
  if (!isoUrl) {
    updateStatus("起動するOSを選択してください", "#ff6f61");
    return;
  }

  if (emulator) {
    resetEmulator();
  }

  const memorySize = Number(dom.memorySelect.value) * 1024 * 1024;
  const cpuCount = Number(dom.cpuSelect.value);
  const selectedArch = dom.architectureSelect.value;

  // Auto-detect architecture from filename if selected
  if (selectedArch === "auto") {
    const filename = dom.osSelect.options[dom.osSelect.selectedIndex].text;
    currentArchitecture = detectArchitectureFromFilename(filename);
  } else {
    currentArchitecture = selectedArch;
  }

  const x64Mode = currentArchitecture === "x86-64" || currentArchitecture === "arm64";

  updateStatus("起動中…", "#5ad8ff");
  log(`ISO URL: ${isoUrl}`);
  log(`メモリ: ${dom.memorySelect.value} MB`);
  log(`CPU: ${cpuCount} コア`);
  log(`アーキテクチャ: ${currentArchitecture}`);
  log(`x64 モード: ${x64Mode ? "有効" : "無効"}`);

  if (!window.V86Starter) {
    updateStatus("V86ライブラリが読み込まれていません", "#ff6f61");
    log("エラー: V86 wasm library not loaded");
    return;
  }

  try {
    emulator = new V86Starter({
      wasm_path: "https://cdn.jsdelivr.net/npm/v86@latest/dist/v86.wasm",
      memory_size: memorySize,
      cpu_count: cpuCount,
      screen_container: dom.screenContainer,
      bios: "https://cdn.jsdelivr.net/npm/v86@latest/bios/seabios.bin",
      vga_bios: "https://cdn.jsdelivr.net/npm/v86@latest/bios/vgabios.bin",
      autostart: true,
      boot_order: 0x132,
      x64: x64Mode,
      cdrom: {
        url: isoUrl,
      },
      filesystem: {
        baseurl: "https://cdn.jsdelivr.net/npm/v86@latest/",
      },
    });

    emulator.add_listener("emulator-ready", () => {
      updateStatus("仮想環境が起動しました ✓", "#8fffa5");
      log("エミュレータが準備完了");
      dom.resetButton.disabled = false;
      dom.stopButton.disabled = false;
    });

    emulator.add_listener("serial0-output-char", (chr) => {
      // Silently handle serial output
    });

    emulator.add_listener("emulator-error", (error) => {
      updateStatus("起動中にエラーが発生しました", "#ff6f61");
      log(`エラー: ${error.toString()}`);
    });
  } catch (error) {
    updateStatus("起動できませんでした", "#ff6f61");
    log(`例外: ${error.message}`);
    console.error(error);
  }
}

// Detect architecture from filename
function detectArchitectureFromFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes("amd64") || lower.includes("x86-64") || lower.includes("x64")) {
    return "x86-64";
  }
  if (lower.includes("i386") || lower.includes("x86") || lower.includes("32")) {
    return "x86";
  }
  if (lower.includes("arm64") || lower.includes("aarch64")) {
    return "arm64";
  }
  return "x86";
}

// Populate ISO list from server
function populateIsoList() {
  updateStatus("OS一覧を読み込み中…");
  log("ISO一覧を読み込み中...");

  fetch("/isos")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((result) => {
      console.log("ISO List Response:", result);
      
      if (!result.images || !Array.isArray(result.images)) {
        throw new Error("Invalid response format");
      }

      isoList = result.images;

      if (isoList.length === 0) {
        dom.osSelect.innerHTML = "<option>ISO ファイルが見つかりません</option>";
        updateStatus("iso/ フォルダに ISO を配置するか、アップロードしてください", "#ff6f61");
        dom.startButton.disabled = true;
        return;
      }

      // Build options
      dom.osSelect.innerHTML = isoList
        .map((item, index) => {
          const name = typeof item === "string" ? item : item.name;
          return `<option value="${index}">${name}</option>`;
        })
        .join("");
      
      // Set first ISO as default
      const firstItem = isoList[0];
      isoUrl = typeof firstItem === "string" ? `/iso/${encodeURIComponent(firstItem)}` : firstItem.path;
      
      dom.osSelect.disabled = false;
      dom.startButton.disabled = false;
      updateStatus("OSを選択して起動してください ✓", "#8fffa5");
      log(`ISO一覧読み込み完了: ${isoList.length}個見つかりました`);
    })
    .catch((error) => {
      console.error("Error fetching ISO list:", error);
      dom.osSelect.innerHTML = "<option>読み込みに失敗しました</option>";
      updateStatus(`OS一覧の読み込みに失敗しました: ${error.message}`, "#ff6f61");
      dom.startButton.disabled = true;
      log(`エラー: ${error.message}`);
    });
}

// OS selection change
function setupOSSelectHandler() {
  dom.osSelect.addEventListener("change", (event) => {
    const selectedIndex = parseInt(event.target.value);
    if (!isNaN(selectedIndex) && isoList[selectedIndex]) {
      const selectedItem = isoList[selectedIndex];
      const selectedName = typeof selectedItem === "string" ? selectedItem : selectedItem.name;
      isoUrl = typeof selectedItem === "string" ? `/iso/${encodeURIComponent(selectedItem)}` : selectedItem.path;
      
      // Auto-detect architecture
      const detectedArch = detectArchitectureFromFilename(selectedName);
      dom.architectureSelect.value = detectedArch;
      currentArchitecture = detectedArch;
      
      dom.startButton.disabled = false;
      log(`OS選択: ${selectedName} (${detectedArch})`);
    }
  });
}

// Button event listeners
function setupEventListeners() {
  dom.startButton.addEventListener("click", startEmulator);
  dom.resetButton.addEventListener("click", resetEmulator);
  dom.stopButton.addEventListener("click", resetEmulator);
  
  window.addEventListener("beforeunload", () => {
    if (emulator) {
      emulator.stop();
    }
  });
}

// Initialize app when V86 library and DOM are ready
function initializeApp() {
  console.log("Initializing application...");
  
  // Initialize DOM elements
  dom = initializeDOMElements();
  
  // Check if all DOM elements exist
  if (!dom.osSelect || !dom.uploadBtn) {
    console.error("Required DOM elements not found");
    setTimeout(initializeApp, 100);
    return;
  }
  
  // Wait for V86 library
  if (typeof V86Starter === "undefined") {
    console.log("V86Starter not loaded yet, retrying...");
    setTimeout(initializeApp, 100);
    return;
  }
  
  console.log("V86Starter loaded, setting up UI...");
  
  // Setup event listeners
  setupUploadHandler();
  setupOSSelectHandler();
  setupEventListeners();
  
  log("アプリケーション初期化完了");
  populateIsoList();
}

// Start initialization when document is ready
if (document.readyState === "loading") {
  console.log("Document loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  console.log("Document already loaded, initializing...");
  initializeApp();
}
