const osSelect = document.getElementById("os-select");
const memorySelect = document.getElementById("memory-size");
const cpuSelect = document.getElementById("cpu-count");
const x64Checkbox = document.getElementById("x64-mode");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const stopButton = document.getElementById("stop");
const statusLabel = document.getElementById("status");
const logOutput = document.getElementById("log-output");
const screenContainer = document.getElementById("screen");

let emulator = null;
let isoUrl = null;

function log(message) {
  const now = new Date().toLocaleTimeString();
  logOutput.textContent += `[${now}] ${message}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

function updateStatus(text, color = "var(--accent)") {
  statusLabel.textContent = text;
  statusLabel.style.color = color;
}

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

function startEmulator() {
  if (emulator) {
    resetEmulator();
  }

  const memorySize = Number(memorySelect.value) * 1024 * 1024;
  const cpuCount = Number(cpuSelect.value);
  const x64Mode = x64Checkbox.checked;

  if (!isoUrl) {
    updateStatus("起動するOSを選択してください", "#ff6f61");
    return;
  }

  updateStatus("起動中…", "#5ad8ff");
  log(`ISO URL: ${isoUrl}`);
  log(`メモリ: ${memorySelect.value} MB`);
  log(`CPU: ${cpuCount} コア`);
  log(`x86-64 モード: ${x64Mode ? "有効" : "無効"}`);

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
      updateStatus("仮想環境が起動しました", "#8fffa5");
      log("エミュレータが準備完了しました。");
      resetButton.disabled = false;
      stopButton.disabled = false;
    });

    emulator.add_listener("serial0-output-char", (chr) => {
      log(chr);
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

async function loadIsoList() {
  updateStatus("OS一覧を読み込み中…");
  try {
    const response = await fetch("/isos");
    if (!response.ok) {
      throw new Error("OS一覧の取得に失敗しました");
    }
    const result = await response.json();
    if (!Array.isArray(result.images) || result.images.length === 0) {
      osSelect.innerHTML = "<option>ISO ファイルが見つかりません</option>";
      updateStatus("iso/ フォルダに ISO を配置してください", "#ff6f61");
      startButton.disabled = true;
      return;
    }

    osSelect.innerHTML = result.images
      .map((name) => `<option value="${encodeURIComponent(name)}">${name}</option>`)
      .join("");
    isoUrl = `/iso/${encodeURIComponent(result.images[0])}`;
    osSelect.disabled = false;
    startButton.disabled = false;
    updateStatus("OSを選択して起動してください", "#8fffa5");
  } catch (error) {
    osSelect.innerHTML = "<option>読み込みに失敗しました</option>";
    updateStatus(`OS一覧の読み込みに失敗しました: ${error.message}`, "#ff6f61");
    startButton.disabled = true;
  }
}

osSelect.addEventListener("change", (event) => {
  const selectedValue = event.target.value;
  if (selectedValue) {
    isoUrl = `/iso/${selectedValue}`;
    startButton.disabled = false;
  }
});

startButton.addEventListener("click", startEmulator);
resetButton.addEventListener("click", resetEmulator);
stopButton.addEventListener("click", resetEmulator);

window.addEventListener("beforeunload", () => {
  if (emulator) {
    emulator.stop();
  }
});

loadIsoList();
