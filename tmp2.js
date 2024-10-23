class Chip8 {
    constructor() {
        this.memory = new Uint8Array(4096)
        this.V = new Uint8Array(16)
        this.I = 0
        this.pc = 0x200
        this.stack = new Uint16Array(16)
        this.sp = 0
        this.delayTimer = 0
        this.soundTimer = 0
        this.display = new Array(64 * 32)
        this.keys = new Array(16).fill(false)

        this.canvas = document.getElementById("chip8-canvas")
        this.ctx = this.canvas.getContext("2d")

        this.setupKeyboardListeners()
        this.waitingForKey = false; // 是否在等待按键
        this.keyPressHandler = null; // 按键处理函数

        this.loadFontset()
    }

    setupKeyboardListeners() {
        const keyMap = {
            '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
            'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
            'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
            'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
        };

        document.addEventListener('keydown', (event) => {
            const key = keyMap[event.key];
            if (key !== undefined) {
                this.keys[key] = true;
                if (this.waitingForKey && this.keyPressHandler) {
                    this.keyPressHandler(key);
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = keyMap[event.key];
            if (key !== undefined) {
                this.keys[key] = false;
            }
        });
    }
    handleFXNN(opcode) {
        const x = (opcode & 0x0F00) >> 8;
        switch (opcode & 0x00FF) {
            case 0x07:
                this.V[x] = this.delayTimer;
                break;
            case 0x0A:
                this.waitingForKey = true;
                this.keyPressHandler = (key) => {
                    this.V[x] = key;
                    this.waitingForKey = false;
                    this.keyPressHandler = null;
                };
                break;
            case 0x15:
                this.delayTimer = this.V[x];
                break;
            case 0x18:
                this.soundTimer = this.V[x];
                break;
            case 0x1E:
                this.I += this.V[x];
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
        this.pc += 2;
    }

}