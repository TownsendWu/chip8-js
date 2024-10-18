class Chip8 {
    constructor() {
        this.memory = new Uint8Array(4096);
        this.V = new Uint8Array(16);
        this.I = 0;
        this.pc = 0x200;
        this.stack = new Uint16Array(16);
        this.sp = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.display = new Array(64 * 32);
        this.keys = new Array(16);
        this.reset();
    }

    reset() {
        this.memory.fill(0);
        this.V.fill(0);
        this.I = 0;
        this.pc = 0x200;
        this.stack.fill(0);
        this.sp = 0;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.display.fill(0);
        this.keys.fill(0);
        const fontset = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, 0x20, 0x60, 0x20, 0x20, 0x70,
            0xF0, 0x10, 0xF0, 0x80, 0xF0, 0xF0, 0x10, 0xF0, 0x10, 0xF0,
            0x90, 0x90, 0xF0, 0x10, 0x10, 0xF0, 0x80, 0xF0, 0x10, 0xF0,
            0xF0, 0x80, 0xF0, 0x90, 0xF0, 0xF0, 0x10, 0x20, 0x40, 0x40,
            0xF0, 0x90, 0xF0, 0x90, 0xF0, 0xF0, 0x90, 0xF0, 0x10, 0xF0,
            0xF0, 0x90, 0xF0, 0x90, 0x90, 0xE0, 0x90, 0xE0, 0x90, 0xE0,
            0xF0, 0x80, 0x80, 0x80, 0xF0, 0xE0, 0x90, 0x90, 0x90, 0xE0,
            0xF0, 0x80, 0xF0, 0x80, 0xF0, 0xF0, 0x80, 0xF0, 0x80, 0x80
        ];
        for (let i = 0; i < fontset.length; i++) {
            this.memory[i] = fontset[i];
        }
    }

    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i];
        }
    }

    cycle() {
        const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        switch(opcode & 0xF000) {
            case 0x0000:
                switch(opcode & 0x00FF) {
                    case 0x00E0:
                        this.display.fill(0);
                        this.pc += 2;
                        break;
                    case 0x00EE:
                        this.sp--;
                        this.pc = this.stack[this.sp];
                        this.pc += 2;
                        break;
                    default:
                        console.error(`Unknown opcode [0x0000]: 0x${opcode.toString(16)}`);
                        break;
                }
                break;
            case 0x1000:
                this.pc = opcode & 0x0FFF;
                break;
            case 0x2000:
                this.stack[this.sp] = this.pc + 2;
                this.sp++;
                this.pc = opcode & 0x0FFF;
                break;
            case 0x6000: // 处理 0x6XNN 操作码
                const vx = (opcode & 0x0F00) >> 8;
                const nn = opcode & 0x00FF;
                this.V[vx] = nn;
                this.pc += 2;
                break;
            case 0xA000:
                this.I = opcode & 0x0FFF;
                this.pc += 2;
                break;
            case 0xD000:
                const x = this.V[(opcode & 0x0F00) >> 8];
                const y = this.V[(opcode & 0x00F0) >> 4];
                const height = opcode & 0x000F;
                let pixel;
                this.V[0xF] = 0;
                for (let yline = 0; yline < height; yline++) {
                    pixel = this.memory[this.I + yline];
                    for (let xline = 0; xline < 8; xline++) {
                        if ((pixel & (0x80 >> xline)) !== 0) {
                            const index = (x + xline + ((y + yline) * 64)) % (64 * 32);
                            if (this.display[index] === 1) {
                                this.V[0xF] = 1;
                            }
                            this.display[index] ^= 1;
                        }
                    }
                }
                this.pc += 2;
                break;
            default:
                console.error(`Unknown opcode: 0x${opcode.toString(16)}`);
                break;
        }
        if (this.delayTimer > 0) {
            this.delayTimer--;
        }
        if (this.soundTimer > 0) {
            if (this.soundTimer === 1) {
                console.log('BEEP!');
            }
            this.soundTimer--;
        }
    }

    drawScreen(context) {
        context.clearRect(0, 0, 640, 320);
        for (let i = 0; i < 64 * 32; i++) {
            const x = (i % 64) * 10;
            const y = Math.floor(i / 64) * 10;
            if (this.display[i] === 1) {
                context.fillStyle = 'black';
                context.fillRect(x, y, 10, 10);
            }
        }
    }
}

const chip8 = new Chip8();
// const program = [0xA2, 0x02, 0x60, 0x00, 0x61, 0x00, 0xD0, 0x15, 0x12, 0x00, 0xF0, 0x90, 0x90, 0x90, 0xF0];
const program = [
    0x60, 0x00, // LD V0, 0x00   ; Set V0 to 0 (X coordinate)
    0x61, 0x00, // LD V1, 0x00   ; Set V1 to 0 (Y coordinate)
    0xA2, 0x0A, // LD I, 0x20A   ; Set I to the memory address 0x20A (where the font set is stored)
    0xD0, 0x15, // DRW V0, V1, 5 ; Draw 5-byte sprite at (V0, V1)
    0x12, 0x00, // JP 0x200      ; Jump to the start of the program (infinite loop)
    0xF0, 0x90, 0xF0, 0x90, 0x90 // Font data for character "A"
  ];
chip8.loadProgram(program);
const canvas = document.getElementById('chip8');
const context = canvas.getContext('2d');

function loop() {
    chip8.cycle();
    chip8.drawScreen(context);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);