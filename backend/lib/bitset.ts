export default class Bitset {
	array: Uint32Array;

	constructor(public size: number) {
		this.array = new Uint32Array(Math.ceil(size / 32));
	}

	setBit(i: number) {
		if (i >= 0 && i < this.size) {
			this.array[i >> 5] |= 1 << (i & 31);
		}
		return this;
	}

	clearBit(i: number) {
		if (i >= 0 && i < this.size) {
			this.array[i >> 5] &= ~(1 << (i & 31));
		}
		return this;
	}

	hasBit(i: number) {
		if (i < 0 || i >= this.size) return;
		return (this.array[i >> 5] & (1 << (i & 31))) !== 0;
	}
}

export const and = (a: Bitset , b: Bitset, out: Bitset) => {
	for (let i = 0; i < out.array.length; i++) {
		out.array[i] = a.array[i] & b.array[i];
	}
};

export const popcount = (x: number) => {
	x -= (x >>> 1) & 0x55555555;
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};

export const countTrailingZeros = (x: number) =>
	(Math.clz32(x & -x) ^ 31) | 0;