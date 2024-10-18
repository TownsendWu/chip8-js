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
        this.keys = new Array(16)

        this.canvas = document.getElementById("chip8-canvas")
        this.ctx = this.canvas.getContext("2d")

        this.loadFontset()
    }

    loadFontset() {
        const fontset = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, 0x20, 0x60, 0x20, 0x20, 0x70,
            0xF0, 0x10, 0xF0, 0x80, 0xF0, 0xF0, 0x10, 0xF0, 0x10, 0xF0,
            0x90, 0x90, 0xF0, 0x10, 0x10, 0xF0, 0x80, 0xF0, 0x10, 0xF0,
            0xF0, 0x80, 0xF0, 0x90, 0xF0, 0xF0, 0x10, 0x20, 0x40, 0x40,
            0xF0, 0x90, 0xF0, 0x90, 0xF0, 0xF0, 0x90, 0xF0, 0x10, 0xF0,
            0xF0, 0x90, 0xF0, 0x90, 0x90, 0xE0, 0x90, 0xE0, 0x90, 0xE0,
            0xF0, 0x80, 0x80, 0x80, 0xF0, 0xE0, 0x90, 0x90, 0x90, 0xE0,
            0xF0, 0x80, 0xF0, 0x80, 0xF0, 0xF0, 0x80, 0xF0, 0x80, 0x80
        ]
        for (let i = 0; i < fontset.length; i++) {
            this.memory[i] = fontset[i]
        }
    }
    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i]
        }
    }

    cycle() {
        //读取两个字节的指令
        const opcode = (this.memory[this.pc] >>> 8) | this.memory[this.pc + 1]
        //
        switch (opcode & 0xF000) {
            case 0x0000:
                this.handle0NNN(opcode)
                break
            case 0x1000:
                this.handle1NNN(opcode)
                break
            case 0x2000:
                this.handle2NNN(opcode)
                break
            case 0x3000:
                this.handle3XNN(opcode)
                break
            case 0x4000:
                this.handle4XNN(opcode)
                break
            case 0x5000:
                break
            case 0x6000:
                break
            case 0x7000:
                break
            case 0x8000:
                break
            case 0x9000:
                break
            case 0xA000:
                break
            case 0xB000:
                break
            case 0xC000:
                break
            case 0xD000:
                break
            case 0xE000:
                break
            case 0xF000:
                break

        }
    }
    handle0NNN(opcode) {
        switch (opcode & 0x0FF) {
            case 0x00E0:
                this.ctx.clearRect(0, 0, 640, 320)
                this.pc += 2
                break
            case 0x00EE:
                this.sp--
                this.pc = this.stack[this.sp]
                this.pc += 2
                break
            default:
                console.error(`handle0NNN - Unknown opcode [0x0000]: 0x${opcode.toString(16)}`)
                break
        }
    }
    handle1NNN(opcode) {
        this.pc = opcode & 0x0FFF
    }

    handle2NNN(opcode) {
        this.stack[this.sp] = this.pc + 2
        this.sp++
        this.pc = opcode & 0x0FFF
    }

    handle3XNN(opcode) {
        const x = opcode & 0x0F00
        const nn = opcode & 0x00FF
        if (this.V[x] === nn) {
            this.pc += 4
        } else {
            this.pc += 2
        }
    }

    handle4XNN(opcode) {
        const x = opcode & 0x0F00
        const nn = opcode & 0x00FF
        if (this.V[x] !== nn) {
            this.pc += 4
        } else {
            this.pc += 2
        }
    }

    handle5XY0(opcode) {
        const x = opcode & 0x0F00
        const y = opcode & 0x00F0
        if (this.V[x] === this.V[y]) {
            this.pc += 4
        } else {
            this.pc += 2
        }
    }
    handle6XNN(opcode) {
        const x = opcode & 0x0F00
        const nn = opcode & 0x00FF
        this.V[x] = nn
        this.pc += 2
    }

    handle7XNN(opcode) {
        const x = opcode & 0x0F00
        const nn = opcode & 0x00FF
        this.V[x] += nn
        this.pc += 2
    }
    handle8XYN(opcode) {
        const x = opcode & 0x0F00
        const y = opcode & 0x00F0
        switch (opcode & 0x000F) {
            case 0x0000:
                this.V[x] = this.V[y]
                break;
            case 0x0001:
                this.V[x] |= this.V[y]
                break;
            case 0x0002:
                this.V[x] &= this.V[y]
                break;
            case 0x0003:
                this.V[x] ^= this.V[y]
                break;
            case 0x0004:
                const sum = this.V[x] + this.V[y]
                if (sum > 0xFF) {
                    this.V[0xF] = 1
                } else {
                    this.V[0xF] = 1
                }
                this.V[x] = sum & 0xFF;
                break;
            case 0x0005:
                if (this.V[x] > this.V[y]) {
                    this.V[0xF] = 1;
                } else {
                    this.V[0xF] = 0;
                }
                this.V[x] = (this.V[x] - this.V[y]) & 0xFF;
                break;
            case 0x0006:
                const sum = this.V[x] + this.V[y]
                if (sum > 0xFF) {
                    this.V[0xF] = 1
                } else {
                    this.V[0xF] = 1
                }
                this.V[x] = sum & 0xFF;
                break;
            case 0x0007:
                const sum = this.V[x] + this.V[y]
                if (sum > 0xFF) {
                    this.V[0xF] = 1
                } else {
                    this.V[0xF] = 1
                }
                this.V[x] = sum & 0xFF;
                break;
            case 0x000E:
                const sum = this.V[x] + this.V[y]
                if (sum > 0xFF) {
                    this.V[0xF] = 1
                } else {
                    this.V[0xF] = 1
                }
                this.V[x] = sum & 0xFF;
                break;
            default:
                console.error(`handle8NNN - Unknown opcode [0x8000]: 0x${opcode.toString(16)}`)
                break;
        }
        this.pc += 2
    }

}