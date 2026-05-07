const isoFileInput = document.getElementById("iso-file");
const memorySelect = document.getElementById("memory-size");
const x64Checkbox = document.getElementById("x64-mode");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const stopButton = document.getElementById("stop");
const statusLabel = document.getElementById("status");
const logOutput = document.getElementById("log-output");
const screenContainer = document.getElementById("screen");

let emulator = null;
let loadedIso = null;

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
  startButton.disabled = !loadedIso;
}

function startEmulator() {
  if (!loadedIso) {
    updateStatus("ISOをアップロードしてください", "#ff6f61");
    return;
  }

  if (emulator) {
    resetEmulator();
  }

  const memorySize = Number(memorySelect.value) * 1024 * 1024;
  const x64Mode = x64Checkbox.checked;

  updateStatus("起動中…", "#5ad8ff");
  log(`ISO サイズ: ${loadedIso.byteLength} bytes`);
  log(`メモリ: ${memorySelect.value} MB`);
  log(`x86-64 モード: ${x64Mode ? "有効" : "無効"}`);

  try {
    emulator = new V86Starter({
      wasm_path: "https://cdn.jsdelivr.net/npm/v86@latest/dist/v86.wasm",
      memory_size: memorySize,
      screen_container: screenContainer,
      bios: "https://cdn.jsdelivr.net/npm/v86@latest/bios/seabios.bin",
      vga_bios: "https://cdn.jsdelivr.net/npm/v86@latest/bios/vgabios.bin",
      autostart: true,
      boot_order: 0x132,
      x64: x64Mode,
      cdrom: {
        buffer: loadedIso,
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

isoFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  updateStatus("ISO 読み込み中…");
  log(`ISO 読み込み: ${file.name}`);

  try {
    loadedIso = await file.arrayBuffer();
    updateStatus("ISO が読み込まれました。起動準備完了", "#8fffa5");
    startButton.disabled = false;
    log(`ISO 読み込み完了: ${file.name}`);
  } catch (error) {
    updateStatus("ISO の読み込みに失敗しました", "#ff6f61");
    log(`読み込みエラー: ${error.message}`);
    loadedIso = null;
    startButton.disabled = true;
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
