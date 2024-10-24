class Chip8 {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Number} scale
   */
  constructor(canvas, scale) {
    if (!canvas) {
      throw new Error("canvas未定义");
    }
    this.memory = new Uint8Array(4096);
    this.V = new Uint8Array(16);
    this.I = 0;
    this.pc = 0x200;
    this.stack = new Uint16Array(16);
    this.sp = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Uint8Array(64 * 32);
    this.keys = new Array(16).fill(false);

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.scale = scale ?? 1;

    // Create an off-screen canvas for double buffering
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d");

    this.setupKeyboardListeners();
    this.waitingForKey = false; // 是否在等待按键
    this.keyPressHandler = null; // 按键处理函数
  }

  setupKeyboardListeners() {
    // prettier-ignore
    const keyMap = {
      '1': 0x1,'2': 0x2,'3': 0x3,'4': 0xc,
      'q': 0x4,'w': 0x5,'e': 0x6,'r': 0xd,
      'a': 0x7,'s': 0x8,'d': 0x9,'f': 0xe,
      'z': 0xa,'x': 0x0,'c': 0xb,'v': 0xf,
    };

    document.addEventListener("keydown", event => {
      const key = keyMap[event.key.toLowerCase()];
      if (key !== undefined) {
        this.keys[key] = true;
        if (this.waitingForKey && this.keyPressHandler) {
          this.keyPressHandler(key);
        }
      }
    });

    document.addEventListener("keyup", event => {
      const key = keyMap[event.key];
      if (key !== undefined) {
        this.keys[key] = false;
      }
    });
  }

  loadFontset() {
    const fontset = [
      0xf0, 0x90, 0x90, 0x90, 0xf0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xf0, 0x10, 0xf0, 0x80, 0xf0,
      0xf0, 0x10, 0xf0, 0x10, 0xf0, 0x90, 0x90, 0xf0, 0x10, 0x10, 0xf0, 0x80, 0xf0, 0x10, 0xf0,
      0xf0, 0x80, 0xf0, 0x90, 0xf0, 0xf0, 0x10, 0x20, 0x40, 0x40, 0xf0, 0x90, 0xf0, 0x90, 0xf0,
      0xf0, 0x90, 0xf0, 0x10, 0xf0, 0xf0, 0x90, 0xf0, 0x90, 0x90, 0xe0, 0x90, 0xe0, 0x90, 0xe0,
      0xf0, 0x80, 0x80, 0x80, 0xf0, 0xe0, 0x90, 0x90, 0x90, 0xe0, 0xf0, 0x80, 0xf0, 0x80, 0xf0,
      0xf0, 0x80, 0xf0, 0x80, 0x80,
    ];
    for (let i = 0; i < fontset.length; i++) {
      this.memory[i] = fontset[i];
    }
  }
  loadProgram(program) {
    this.memory.fill(0);
    this.display.fill(0);
    this.V.fill(0);
    this.I = 0;
    this.pc = 0x200;
    this.stack.fill(0);
    this.sp = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.keys.fill(false);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.loadFontset();
    for (let i = 0; i < program.length; i++) {
      this.memory[0x200 + i] = program[i];
    }
  }

  draw() {
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    for (let i = 0; i < 64 * 32; i++) {
      const x = (i % 64) * this.scale;
      const y = Math.floor(i / 64) * this.scale;
      if (this.display[i] === 1) {
        this.offscreenCtx.fillStyle = "rgba(232,233,237,1)";
        this.offscreenCtx.fillRect(x, y, this.scale, this.scale);
      }
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  cycle() {
    //读取两个字节的指令
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    switch (opcode & 0xf000) {
      case 0x0000:
        this.handle0NNN(opcode);
        break;
      case 0x1000:
        this.handle1NNN(opcode);
        break;
      case 0x2000:
        this.handle2NNN(opcode);
        break;
      case 0x3000:
        this.handle3XNN(opcode);
        break;
      case 0x4000:
        this.handle4XNN(opcode);
        break;
      case 0x5000:
        this.handle5XY0(opcode);
        break;
      case 0x6000:
        this.handle6XNN(opcode);
        break;
      case 0x7000:
        this.handle7XNN(opcode);
        break;
      case 0x8000:
        this.handle8XYN(opcode);
        break;
      case 0x9000:
        this.handle9XY0(opcode);
        break;
      case 0xa000:
        this.handleANNN(opcode);
        break;
      case 0xb000:
        this.handleBNNN(opcode);
        break;
      case 0xc000:
        this.handleCXNN(opcode);
        break;
      case 0xd000:
        this.handleDXYN(opcode);
        break;
      case 0xe000:
        this.handleEXNN(opcode);
        break;
      case 0xf000:
        this.handleFXNN(opcode);
        break;
      default:
        console.error(`cycle - Unknown opcode: 0x${opcode.toString(16)}`);
        break;
    }
  }
  handle0NNN(opcode) {
    switch (opcode & 0x0ff) {
      case 0x00e0:
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.display.fill(0);
        this.pc += 2;
        break;
      case 0x00ee:
        this.sp--;
        this.pc = this.stack[this.sp];
        break;
      default:
        console.error(`handle0NNN - Unknown opcode [0x0000]: 0x${opcode.toString(16)}`);
        this.pc += 2;
        break;
    }
  }
  handle1NNN(opcode) {
    this.pc = opcode & 0x0fff;
  }

  handle2NNN(opcode) {
    this.stack[this.sp] = this.pc + 2;
    this.sp++;
    this.pc = opcode & 0x0fff;
  }

  handle3XNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const nn = opcode & 0x00ff;
    if (this.V[x] === nn) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  handle4XNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const nn = opcode & 0x00ff;
    if (this.V[x] !== nn) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  handle5XY0(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;
    if (this.V[x] === this.V[y]) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }
  handle6XNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const nn = opcode & 0x00ff;
    this.V[x] = nn;
    this.pc += 2;
  }

  handle7XNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const nn = opcode & 0x00ff;
    this.V[x] += nn;
    this.pc += 2;
  }

  handle8XYN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;
    switch (opcode & 0x000f) {
      case 0x0000:
        this.V[x] = this.V[y];
        break;
      case 0x0001:
        this.V[x] |= this.V[y];
        break;
      case 0x0002:
        this.V[x] &= this.V[y];
        break;
      case 0x0003:
        this.V[x] ^= this.V[y];
        break;
      case 0x0004:
        const sum = this.V[x] + this.V[y];
        this.V[0xf] = sum > 0xff ? 1 : 0;
        this.V[x] = sum & 0xff;
        break;
      case 0x0005:
        this.V[0xf] = this.V[x] >= this.V[y] ? 1 : 0;
        this.V[x] = (this.V[x] - this.V[y]) & 0xff;
        break;
      case 0x0006:
        this.V[0xf] = this.V[x] & 0x1;
        this.V[x] >>= 1;
        break;
      case 0x0007:
        this.V[0xf] = this.V[y] >= this.V[x] ? 1 : 0;
        this.V[x] = (this.V[y] - this.V[x]) & 0xff;
        break;
      case 0x000e:
        this.V[0xf] = (this.V[y] & 0x80) >> 7;
        this.V[x] = (this.V[y] << 1) & 0xff;
        break;
      default:
        console.error(`handle8NNN - Unknown opcode [0x8000]: 0x${opcode.toString(16)}`);
        break;
    }
    this.pc += 2;
  }

  handle9XY0(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;
    if (this.V[x] != this.V[y]) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  handleANNN(opcode) {
    this.I = opcode & 0x0fff;
    this.pc += 2;
  }

  handleBNNN(opcode) {
    this.pc = (opcode & 0x0fff) + this.V[0];
  }

  handleCXNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    const nn = opcode & 0x00ff;
    const randomByte = Math.floor(Math.random() * 256);
    this.V[x] = randomByte & nn;
    this.pc += 2;
  }

  handleDXYN(opcode) {
    const x = this.V[(opcode & 0x0f00) >> 8];
    const y = this.V[(opcode & 0x00f0) >> 4];
    const height = opcode & 0x000f;
    let pixel;
    this.V[0xf] = 0;
    for (let yline = 0; yline < height; yline++) {
      pixel = this.memory[this.I + yline];
      for (let xline = 0; xline < 8; xline++) {
        if ((pixel & (0x80 >> xline)) !== 0) {
          const index = (x + xline + (y + yline) * 64) % (64 * 32);
          if (this.display[index] === 1) {
            this.V[0xf] = 1;
          }
          this.display[index] ^= 1;
        }
      }
    }
    this.pc += 2;
  }

  handleEXNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    switch (opcode & 0x00ff) {
      case 0x9e:
        if (this.keys[this.V[x]]) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;
      case 0xa1:
        if (!this.keys[this.V[x]]) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;
      default:
        console.error(`Unknown opcode [0xE000]: 0x${opcode.toString(16)}`);
        this.pc += 2;
        break;
    }
  }

  handleFXNN(opcode) {
    const x = (opcode & 0x0f00) >> 8;
    switch (opcode & 0x00ff) {
      case 0x07:
        this.V[x] = this.delayTimer;
        break;
      case 0x0a:
        this.waitingForKey = true;
        this.keyPressHandler = key => {
          this.V[x] = key;
          this.waitingForKey = false;
          this.keyPressHandler = null;
          this.pc += 2;
        };
        break;
      case 0x15:
        this.delayTimer = this.V[x];
        break;
      case 0x18:
        this.soundTimer = this.V[x];
        break;
      case 0x1e:
        this.I = (this.I + this.V[x]) & 0xfff;
        break;
      case 0x29:
        this.I = this.V[x] * 5;
        break;
      case 0x33:
        this.memory[this.I] = Math.floor(this.V[x] / 100);
        this.memory[this.I + 1] = Math.floor((this.V[x] % 100) / 10);
        this.memory[this.I + 2] = this.V[x] % 10;
        break;
      case 0x55:
        for (let i = 0; i <= x; i++) {
          this.memory[this.I + i] = this.V[i];
        }
        break;
      case 0x65:
        for (let i = 0; i <= x; i++) {
          this.V[i] = this.memory[this.I + i];
        }
        break;
      default:
        console.error(`Unknown opcode [0xF000]: 0x${opcode.toString(16)}`);
        break;
    }
    if ((opcode & 0x00ff) !== 0x0a) {
      this.pc += 2;
    }
  }
}

function main() {
  const canvas = document.getElementById("chip8Canvas");
  const scale = 10;
  const chip8 = new Chip8(canvas, scale);

  const targetFrequency = 500; // 500Hz
  const interval = 1000 / targetFrequency; // 每次执行的间隔时间（毫秒）

  let lastTime = performance.now();

  function executeChip8() {
    const now = performance.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    const cyclesPerFrame = Math.floor(deltaTime / interval);

    for (let i = 0; i < cyclesPerFrame; i++) {
      chip8.cycle();
    }
  }

  function render() {
    chip8.draw();
    requestAnimationFrame(render);
  }

  document.getElementById("fileInput").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        const romBuffer = new Uint8Array(arrayBuffer);
        chip8.loadProgram(romBuffer);
        // 启动模拟器主循环
        setInterval(executeChip8, interval);
        requestAnimationFrame(render);
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

main();
