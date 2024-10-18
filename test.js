const a = 0xA2
const b = 0x0A

console.log("==============二进制==============");
console.log(a.toString(2));
console.log(b.toString(2));

console.log("==============进位==============");
const c = a << 1
const d = a >> 8
console.log(c.toString(2));
console.log(d.toString(2));

console.log("==============或运算符==============");
const e = (a << 8) | b
console.log(e.toString(2));

console.log("==============与运算符==============");
const f = e & 0xF000
const g = e & 0x0F00
const h = e & 0x00F0
const i = e & 0x000F
console.log(f.toString(2), f.toString(16));
console.log(g.toString(2), g.toString(16));
console.log(h.toString(2), h.toString(16));
console.log(i.toString(2), i.toString(16));

console.log("=============取进制位===============");
const j = g >> 8
const k = f >> 12
console.log(j.toString(2), j.toString(16));
console.log(k.toString(2), k.toString(16));
