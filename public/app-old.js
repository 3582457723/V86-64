// DOM elements
const isoUpload = document.getElementById("iso-upload");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");
const uploadProgress = document.getElementById("upload-progress");
const uploadProgressBar = document.getElementById("upload-progress-bar");
const osSelect = document.getElementById("os-select");
const architectureSelect = document.getElementById("architecture-select");
const memorySelect = document.getElementById("memory-size");
const cpuSelect = document.getElementById("cpu-count");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const stopButton = document.getElementById("stop");
const statusLabel = document.getElementById("status");
const logOutput = document.getElementById("log-output");
const screenContainer = document.getElementById("screen");

let emulator = null;
let isoUrl = null;
let currentArchitecture = "x86-64";
let isoList = [];

// Logging function
function log(message) {
  const now = new Date().toLocaleTimeString();
  logOutput.textContent += `[${now}] ${message}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

// Status update
function updateStatus(text, color = "var(--accent)") {
  statusLabel.textContent = text;
  statusLabel.style.color = color;
}

// ISO upload handler
uploadBtn.addEventListener("click", async () => {
  const file = isoUpload.files[0];
  if (!file) {
    uploadStatus.textContent = "ファイルを選択してください";
    uploadStatus.style.color = "#ff6f61";
    return;
  }

  uploadBtn.disabled = true;
  uploadProgress.style.display = "block";
  uploadStatus.textContent = "アップロード中...";
  uploadStatus.style.color = "#5ad8ff";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        uploadProgressBar.style.width = percent + "%";
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        uploadStatus.textContent = `✓ ${result.filename} (${result.architecture})`;
        uploadStatus.style.color = "#8fffa5";
        log(`ISO アップロード完了: ${result.filename} (${result.architecture})`);
        isoUpload.value = "";
        uploadProgress.style.display = "none";
        populateIsoList();
      } else {
        throw new Error(JSON.parse(xhr.responseText).error);
      }
    });

    xhr.addEventListener("error", () => {
      uploadStatus.textContent = "アップロード失敗";
      uploadStatus.style.color = "#ff6f61";
    });

    xhr.open("POST", "/upload-iso");
    xhr.send(formData);
  } catch (error) {
    uploadStatus.textContent = `エラー: ${error.message}`;
    uploadStatus.style.color = "#ff6f61";
  } finally {
    uploadBtn.disabled = false;
  }
});

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
  screenContainer.innerHTML = "";
  updateStatus("停止しました", "#ff6f61");
  resetButton.disabled = true;
  stopButton.disabled = true;
  startButton.disabled = !isoUrl;
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

  const memorySize = Number(memorySelect.value) * 1024 * 1024;
  const cpuCount = Number(cpuSelect.value);
  const selectedArch = architectureSelect.value;

  // Auto-detect architecture from filename if selected
  if (selectedArch === "auto") {
    const filename = osSelect.options[osSelect.selectedIndex].text;
    currentArchitecture = detectArchitectureFromFilename(filename);
  } else {
    currentArchitecture = selectedArch;
  }

  const x64Mode = currentArchitecture === "x86-64" || currentArchitecture === "arm64";

  updateStatus("起動中…", "#5ad8ff");
  log(`ISO URL: ${isoUrl}`);
  log(`メモリ: ${memorySelect.value} MB`);
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
      screen_container: screenContainer,
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
      resetButton.disabled = false;
      stopButton.disabled = false;
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
  fetch("/isos")
    .then((res) => {
      if (!res.ok) {
        throw new Error("OS一覧の取得に失敗しました");
      }
      return res.json();
    })
    .then((result) => {
      isoList = result.images || [];
      if (!Array.isArray(isoList) || isoList.length === 0) {
        osSelect.innerHTML = "<option>ISO ファイルが見つかりません</option>";
        updateStatus("iso/ フォルダに ISO を配置するか、アップロードしてください", "#ff6f61");
        startButton.disabled = true;
        return;
      }

      osSelect.innerHTML = isoList
        .map((item) => {
          const name = typeof item === "string" ? item : item.name;
          return `<option value="${encodeURIComponent(name)}">${name}</option>`;
        })
        .join("");
      
      isoUrl = isoList.length > 0 ? (isoList[0].path || `/iso/${encodeURIComponent(isoList[0].name || isoList[0])}`) : null;
      osSelect.disabled = false;
      startButton.disabled = !isoUrl;
      updateStatus("OSを選択して起動してください ✓", "#8fffa5");
    })
    .catch((error) => {
      osSelect.innerHTML = "<option>読み込みに失敗しました</option>";
      updateStatus(`OS一覧の読み込みに失敗しました: ${error.message}`, "#ff6f61");
      startButton.disabled = true;
      log(`エラー: ${error.message}`);
    });
}

// OS selection change
osSelect.addEventListener("change", (event) => {
  const selectedValue = event.target.value;
  if (selectedValue) {
    const selectedName = osSelect.options[osSelect.selectedIndex].text;
    isoUrl = isoList.find(
      (item) => encodeURIComponent(item.name || item) === selectedValue
    )?.path || `/iso/${selectedValue}`;
    
    // Auto-detect architecture
    const detectedArch = detectArchitectureFromFilename(selectedName);
    architectureSelect.value = detectedArch;
    currentArchitecture = detectedArch;
    
    startButton.disabled = false;
    log(`OS選択: ${selectedName} (${detectedArch})`);
  }
});

// Button event listeners
startButton.addEventListener("click", startEmulator);
resetButton.addEventListener("click", resetEmulator);
stopButton.addEventListener("click", resetEmulator);

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (emulator) {
    emulator.stop();
  }
});

// Initialize app when V86 library and DOM are ready
function initializeApp() {
  if (typeof V86Starter === "undefined") {
    setTimeout(initializeApp, 100);
    return;
  }
  log("アプリケーション初期化完了");
  populateIsoList();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
