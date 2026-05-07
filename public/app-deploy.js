// DOM elements
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

// ロギング関数
function log(message) {
  const now = new Date().toLocaleTimeString();
  logOutput.textContent += `[${now}] ${message}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
  console.log(`[LOG] ${message}`);
}

// ステータス更新
function updateStatus(text, color = "var(--accent)") {
  statusLabel.textContent = text;
  statusLabel.style.color = color;
  console.log(`[STATUS] ${text}`);
}

// リセット
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

// エミュレータ起動
function startEmulator() {
  if (!isoUrl) {
    updateStatus("OSを選択してください", "#ff6f61");
    return;
  }

  if (emulator) {
    resetEmulator();
  }

  const memorySize = Number(memorySelect.value) * 1024 * 1024;
  const cpuCount = Number(cpuSelect.value);
  const selectedArch = architectureSelect.value;

  // アーキテクチャ自動検出
  if (selectedArch === "auto") {
    const filename = osSelect.options[osSelect.selectedIndex].text;
    currentArchitecture = detectArchitectureFromFilename(filename);
  } else {
    currentArchitecture = selectedArch;
  }

  const x64Mode = currentArchitecture === "x86-64" || currentArchitecture === "arm64";

  updateStatus("起動中…", "#5ad8ff");
  log(`ISO: ${osSelect.options[osSelect.selectedIndex].text}`);
  log(`メモリ: ${memorySelect.value} MB | CPU: ${cpuCount} コア | アーキ: ${currentArchitecture}`);

  if (!window.V86Starter) {
    updateStatus("V86ライブラリ読み込みエラー", "#ff6f61");
    log("エラー: V86 wasm library が読み込まれていません");
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
      cdrom: { url: isoUrl },
      filesystem: { baseurl: "https://cdn.jsdelivr.net/npm/v86@latest/" },
    });

    emulator.add_listener("emulator-ready", () => {
      updateStatus("✓ 仮想環境が起動しました", "#8fffa5");
      log("起動完了");
      resetButton.disabled = false;
      stopButton.disabled = false;
    });

    emulator.add_listener("emulator-error", (error) => {
      updateStatus("エラーが発生しました", "#ff6f61");
      log(`エラー: ${error.toString()}`);
    });
  } catch (error) {
    updateStatus("起動失敗", "#ff6f61");
    log(`例外: ${error.message}`);
    console.error(error);
  }
}

// ファイル名からアーキテクチャ検出
function detectArchitectureFromFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes("amd64") || lower.includes("x86-64") || lower.includes("x64")) {
    return "x86-64";
  }
  if (lower.includes("i386") || lower.includes("i686") || lower.includes("32")) {
    return "x86";
  }
  if (lower.includes("arm64") || lower.includes("aarch64")) {
    return "arm64";
  }
  return "x86";
}

// ISO一覧を読み込む
function populateIsoList() {
  updateStatus("OS一覧を読み込み中...");
  log("ISO一覧を読み込み中");

  fetch("/isos")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((result) => {
      if (!result.images || !Array.isArray(result.images) || result.images.length === 0) {
        throw new Error("ISOが見つかりません");
      }

      isoList = result.images;

      osSelect.innerHTML = isoList
        .map((item, index) => {
          const name = typeof item === "string" ? item : item.name;
          return `<option value="${index}">${name}</option>`;
        })
        .join("");

      const firstItem = isoList[0];
      isoUrl = typeof firstItem === "string" ? `/iso/${encodeURIComponent(firstItem)}` : firstItem.path;
      
      osSelect.disabled = false;
      startButton.disabled = false;
      updateStatus("✓ OSを選択して起動", "#8fffa5");
      log(`${isoList.length}個のOS が利用可能です`);
    })
    .catch((error) => {
      osSelect.innerHTML = "<option>読み込みエラー</option>";
      updateStatus(`エラー: ${error.message}`, "#ff6f61");
      startButton.disabled = true;
      log(`読み込みエラー: ${error.message}`);
    });
}

// イベントリスナー設定
osSelect.addEventListener("change", (event) => {
  const selectedIndex = parseInt(event.target.value);
  if (!isNaN(selectedIndex) && isoList[selectedIndex]) {
    const selectedItem = isoList[selectedIndex];
    const selectedName = typeof selectedItem === "string" ? selectedItem : selectedItem.name;
    isoUrl = typeof selectedItem === "string" ? `/iso/${encodeURIComponent(selectedItem)}` : selectedItem.path;

    const arch = detectArchitectureFromFilename(selectedName);
    architectureSelect.value = arch;
    currentArchitecture = arch;

    startButton.disabled = false;
    log(`選択: ${selectedName}`);
  }
});

startButton.addEventListener("click", startEmulator);
resetButton.addEventListener("click", resetEmulator);
stopButton.addEventListener("click", resetEmulator);

window.addEventListener("beforeunload", () => {
  if (emulator) emulator.stop();
});

// 初期化
function initializeApp() {
  if (typeof V86Starter === "undefined") {
    setTimeout(initializeApp, 100);
    return;
  }
  log("アプリケーション起動");
  populateIsoList();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
