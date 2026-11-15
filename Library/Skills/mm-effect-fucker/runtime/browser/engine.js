var e = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2
}, t = {
	ROTATE: 0,
	PAN: 1,
	DOLLY_PAN: 2,
	DOLLY_ROTATE: 3
}, n = 1e3, r = 1001, i = 1002, a = 1003, o = 1004, s = 1005, c = 1006, l = 1007, u = 1008, d = 1009, f = 1010, p = 1011, m = 1012, h = 1013, g = 1014, _ = 1015, v = 1016, y = 1017, b = 1018, x = 1020, S = 35902, C = 35899, w = 1021, T = 1022, E = 1023, D = 1026, O = 1027, k = 1028, A = 1029, j = 1030, M = 1031, N = 1033, P = 33776, F = 33777, I = 33778, L = 33779, R = 35840, ee = 35841, te = 35842, z = 35843, ne = 36196, re = 37492, B = 37496, ie = 37488, ae = 37489, oe = 37490, se = 37491, ce = 37808, le = 37809, ue = 37810, de = 37811, fe = 37812, pe = 37813, me = 37814, he = 37815, ge = 37816, _e = 37817, ve = 37818, ye = 37819, be = 37820, xe = 37821, Se = 36492, Ce = 36494, we = 36495, Te = 36283, Ee = 36284, De = 36285, Oe = 36286, V = 2300, ke = 2301, Ae = 2302, je = 2303, H = 2400, Me = 2401, U = 2402, W = 3200, Ne = "srgb", Pe = "srgb-linear", Fe = "linear", Ie = "srgb", Le = 7680, Re = 35044, ze = 35048, Be = 2e3;
function Ve(e) {
	for (let t = e.length - 1; t >= 0; --t) if (e[t] >= 65535) return !0;
	return !1;
}
function He(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
function Ue(e) {
	return document.createElementNS("http://www.w3.org/1999/xhtml", e);
}
function We() {
	let e = Ue("canvas");
	return e.style.display = "block", e;
}
var Ge = {};
function Ke(...e) {
	let t = "THREE." + e.shift();
	console.log(t, ...e);
}
function qe(e) {
	let t = e[0];
	if (typeof t == "string" && t.startsWith("TSL:")) {
		let t = e[1];
		t && t.isStackTrace ? e[0] += " " + t.getLocation() : e[1] = "Stack trace not available. Enable \"THREE.Node.captureStackTrace\" to capture stack traces.";
	}
	return e;
}
function G(...e) {
	e = qe(e);
	let t = "THREE." + e.shift();
	{
		let n = e[0];
		n && n.isStackTrace ? console.warn(n.getError(t)) : console.warn(t, ...e);
	}
}
function K(...e) {
	e = qe(e);
	let t = "THREE." + e.shift();
	{
		let n = e[0];
		n && n.isStackTrace ? console.error(n.getError(t)) : console.error(t, ...e);
	}
}
function Je(...e) {
	let t = e.join(" ");
	t in Ge || (Ge[t] = !0, G(...e));
}
function Ye(e, t, n) {
	return new Promise(function(r, i) {
		function a() {
			switch (e.clientWaitSync(t, e.SYNC_FLUSH_COMMANDS_BIT, 0)) {
				case e.WAIT_FAILED:
					i();
					break;
				case e.TIMEOUT_EXPIRED:
					setTimeout(a, n);
					break;
				default: r();
			}
		}
		setTimeout(a, n);
	});
}
var Xe = {
	0: 0,
	2: 6,
	4: 4,
	3: 5,
	1: 1,
	6: 2,
	7: 7,
	5: 3
}, Ze = class {
	addEventListener(e, t) {
		this._listeners === void 0 && (this._listeners = {});
		let n = this._listeners;
		n[e] === void 0 && (n[e] = []), n[e].indexOf(t) === -1 && n[e].push(t);
	}
	hasEventListener(e, t) {
		let n = this._listeners;
		return n !== void 0 && n[e] !== void 0 && n[e].indexOf(t) !== -1;
	}
	removeEventListener(e, t) {
		let n = this._listeners;
		if (n === void 0) return;
		let r = n[e];
		if (r !== void 0) {
			let e = r.indexOf(t);
			e !== -1 && r.splice(e, 1);
		}
	}
	dispatchEvent(e) {
		let t = this._listeners;
		if (t === void 0) return;
		let n = t[e.type];
		if (n !== void 0) {
			e.target = this;
			let t = n.slice(0);
			for (let n = 0, r = t.length; n < r; n++) t[n].call(this, e);
			e.target = null;
		}
	}
}, Qe = /* @__PURE__ */ "00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff".split("."), $e = 1234567, et = Math.PI / 180, tt = 180 / Math.PI;
function nt() {
	let e = Math.random() * 4294967295 | 0, t = Math.random() * 4294967295 | 0, n = Math.random() * 4294967295 | 0, r = Math.random() * 4294967295 | 0;
	return (Qe[e & 255] + Qe[e >> 8 & 255] + Qe[e >> 16 & 255] + Qe[e >> 24 & 255] + "-" + Qe[t & 255] + Qe[t >> 8 & 255] + "-" + Qe[t >> 16 & 15 | 64] + Qe[t >> 24 & 255] + "-" + Qe[n & 63 | 128] + Qe[n >> 8 & 255] + "-" + Qe[n >> 16 & 255] + Qe[n >> 24 & 255] + Qe[r & 255] + Qe[r >> 8 & 255] + Qe[r >> 16 & 255] + Qe[r >> 24 & 255]).toLowerCase();
}
function q(e, t, n) {
	return Math.max(t, Math.min(n, e));
}
function rt(e, t) {
	return (e % t + t) % t;
}
function it(e, t, n, r, i) {
	return r + (e - t) * (i - r) / (n - t);
}
function at(e, t, n) {
	return e === t ? 0 : (n - e) / (t - e);
}
function ot(e, t, n) {
	return (1 - n) * e + n * t;
}
function st(e, t, n, r) {
	return ot(e, t, 1 - Math.exp(-n * r));
}
function ct(e, t = 1) {
	return t - Math.abs(rt(e, t * 2) - t);
}
function lt(e, t, n) {
	return e <= t ? 0 : e >= n ? 1 : (e = (e - t) / (n - t), e * e * (3 - 2 * e));
}
function ut(e, t, n) {
	return e <= t ? 0 : e >= n ? 1 : (e = (e - t) / (n - t), e * e * e * (e * (e * 6 - 15) + 10));
}
function dt(e, t) {
	return e + Math.floor(Math.random() * (t - e + 1));
}
function ft(e, t) {
	return e + Math.random() * (t - e);
}
function pt(e) {
	return e * (.5 - Math.random());
}
function mt(e) {
	e !== void 0 && ($e = e);
	let t = $e += 1831565813;
	return t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function ht(e) {
	return e * et;
}
function gt(e) {
	return e * tt;
}
function _t(e) {
	return e > 0 && Number.isInteger(e) && 2 ** Math.round(Math.log2(e)) === e;
}
function vt(e) {
	return 2 ** Math.ceil(Math.log(e) / Math.LN2);
}
function yt(e) {
	return 2 ** Math.floor(Math.log(e) / Math.LN2);
}
function bt(e, t, n, r, i) {
	let a = Math.cos, o = Math.sin, s = a(n / 2), c = o(n / 2), l = a((t + r) / 2), u = o((t + r) / 2), d = a((t - r) / 2), f = o((t - r) / 2), p = a((r - t) / 2), m = o((r - t) / 2);
	switch (i) {
		case "XYX":
			e.set(s * u, c * d, c * f, s * l);
			break;
		case "YZY":
			e.set(c * f, s * u, c * d, s * l);
			break;
		case "ZXZ":
			e.set(c * d, c * f, s * u, s * l);
			break;
		case "XZX":
			e.set(s * u, c * m, c * p, s * l);
			break;
		case "YXY":
			e.set(c * p, s * u, c * m, s * l);
			break;
		case "ZYZ":
			e.set(c * m, c * p, s * u, s * l);
			break;
		default: G("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: " + i);
	}
}
function xt(e) {
	switch (e.constructor) {
		case Uint32Array: return 4294967295;
		case Uint16Array: return 65535;
		case Uint8Array:
		case Uint8ClampedArray: return 255;
		case Int32Array: return 2147483647;
		case Int16Array: return 32767;
		case Int8Array: return 127;
		default: return;
	}
}
function St(e, t) {
	if (t.constructor === Float32Array) return e;
	let n = xt(t);
	if (n === void 0) throw Error("THREE.MathUtils: Invalid component type.");
	return Math.max(e / n, -1);
}
function Ct(e, t) {
	if (t.constructor === Float32Array) return e;
	let n = xt(t);
	if (n === void 0) throw Error("THREE.MathUtils: Invalid component type.");
	return Math.round(e * n);
}
var wt = {
	DEG2RAD: et,
	RAD2DEG: tt,
	generateUUID: nt,
	clamp: q,
	euclideanModulo: rt,
	mapLinear: it,
	inverseLerp: at,
	lerp: ot,
	damp: st,
	pingpong: ct,
	smoothstep: lt,
	smootherstep: ut,
	randInt: dt,
	randFloat: ft,
	randFloatSpread: pt,
	seededRandom: mt,
	degToRad: ht,
	radToDeg: gt,
	isPowerOfTwo: _t,
	ceilPowerOfTwo: vt,
	floorPowerOfTwo: yt,
	setQuaternionFromProperEuler: bt,
	normalize: Ct,
	denormalize: St
}, J = class {
	static {
		this.prototype.isVector2 = !0;
	}
	constructor(e = 0, t = 0) {
		this.x = e, this.y = t;
	}
	get width() {
		return this.x;
	}
	set width(e) {
		this.x = e;
	}
	get height() {
		return this.y;
	}
	set height(e) {
		this.y = e;
	}
	set(e, t) {
		return this.x = e, this.y = t, this;
	}
	setScalar(e) {
		return this.x = e, this.y = e, this;
	}
	setX(e) {
		return this.x = e, this;
	}
	setY(e) {
		return this.y = e, this;
	}
	setComponent(e, t) {
		switch (e) {
			case 0:
				this.x = t;
				break;
			case 1:
				this.y = t;
				break;
			default: throw Error("THREE.Vector2: index is out of range: " + e);
		}
		return this;
	}
	getComponent(e) {
		switch (e) {
			case 0: return this.x;
			case 1: return this.y;
			default: throw Error("THREE.Vector2: index is out of range: " + e);
		}
	}
	clone() {
		return new this.constructor(this.x, this.y);
	}
	copy(e) {
		return this.x = e.x, this.y = e.y, this;
	}
	add(e) {
		return this.x += e.x, this.y += e.y, this;
	}
	addScalar(e) {
		return this.x += e, this.y += e, this;
	}
	addVectors(e, t) {
		return this.x = e.x + t.x, this.y = e.y + t.y, this;
	}
	addScaledVector(e, t) {
		return this.x += e.x * t, this.y += e.y * t, this;
	}
	sub(e) {
		return this.x -= e.x, this.y -= e.y, this;
	}
	subScalar(e) {
		return this.x -= e, this.y -= e, this;
	}
	subVectors(e, t) {
		return this.x = e.x - t.x, this.y = e.y - t.y, this;
	}
	multiply(e) {
		return this.x *= e.x, this.y *= e.y, this;
	}
	multiplyScalar(e) {
		return this.x *= e, this.y *= e, this;
	}
	divide(e) {
		return this.x /= e.x, this.y /= e.y, this;
	}
	divideScalar(e) {
		return this.multiplyScalar(1 / e);
	}
	applyMatrix3(e) {
		let t = this.x, n = this.y, r = e.elements;
		return this.x = r[0] * t + r[3] * n + r[6], this.y = r[1] * t + r[4] * n + r[7], this;
	}
	min(e) {
		return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this;
	}
	max(e) {
		return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this;
	}
	clamp(e, t) {
		return this.x = q(this.x, e.x, t.x), this.y = q(this.y, e.y, t.y), this;
	}
	clampScalar(e, t) {
		return this.x = q(this.x, e, t), this.y = q(this.y, e, t), this;
	}
	clampLength(e, t) {
		let n = this.length();
		return this.divideScalar(n || 1).multiplyScalar(q(n, e, t));
	}
	floor() {
		return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this;
	}
	ceil() {
		return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this;
	}
	round() {
		return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
	}
	roundToZero() {
		return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this;
	}
	negate() {
		return this.x = -this.x, this.y = -this.y, this;
	}
	dot(e) {
		return this.x * e.x + this.y * e.y;
	}
	cross(e) {
		return this.x * e.y - this.y * e.x;
	}
	lengthSq() {
		return this.x * this.x + this.y * this.y;
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	manhattanLength() {
		return Math.abs(this.x) + Math.abs(this.y);
	}
	normalize() {
		return this.divideScalar(this.length() || 1);
	}
	angle() {
		return Math.atan2(-this.y, -this.x) + Math.PI;
	}
	angleTo(e) {
		let t = Math.sqrt(this.lengthSq() * e.lengthSq());
		if (t === 0) return Math.PI / 2;
		let n = this.dot(e) / t;
		return Math.acos(q(n, -1, 1));
	}
	distanceTo(e) {
		return Math.sqrt(this.distanceToSquared(e));
	}
	distanceToSquared(e) {
		let t = this.x - e.x, n = this.y - e.y;
		return t * t + n * n;
	}
	manhattanDistanceTo(e) {
		return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
	}
	setLength(e) {
		return this.normalize().multiplyScalar(e);
	}
	lerp(e, t) {
		return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this;
	}
	lerpVectors(e, t, n) {
		return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this;
	}
	equals(e) {
		return e.x === this.x && e.y === this.y;
	}
	fromArray(e, t = 0) {
		return this.x = e[t], this.y = e[t + 1], this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this.x, e[t + 1] = this.y, e;
	}
	fromBufferAttribute(e, t) {
		return this.x = e.getX(t), this.y = e.getY(t), this;
	}
	rotateAround(e, t) {
		let n = Math.cos(t), r = Math.sin(t), i = this.x - e.x, a = this.y - e.y;
		return this.x = i * n - a * r + e.x, this.y = i * r + a * n + e.y, this;
	}
	random() {
		return this.x = Math.random(), this.y = Math.random(), this;
	}
	*[Symbol.iterator]() {
		yield this.x, yield this.y;
	}
}, Tt = class {
	constructor(e = 0, t = 0, n = 0, r = 1) {
		this.isQuaternion = !0, this._x = e, this._y = t, this._z = n, this._w = r;
	}
	static slerpFlat(e, t, n, r, i, a, o) {
		let s = n[r + 0], c = n[r + 1], l = n[r + 2], u = n[r + 3], d = i[a + 0], f = i[a + 1], p = i[a + 2], m = i[a + 3];
		if (u !== m || s !== d || c !== f || l !== p) {
			let e = s * d + c * f + l * p + u * m;
			e < 0 && (d = -d, f = -f, p = -p, m = -m, e = -e);
			let t = 1 - o;
			if (e < .9995) {
				let n = Math.acos(e), r = Math.sin(n);
				t = Math.sin(t * n) / r, o = Math.sin(o * n) / r, s = s * t + d * o, c = c * t + f * o, l = l * t + p * o, u = u * t + m * o;
			} else {
				s = s * t + d * o, c = c * t + f * o, l = l * t + p * o, u = u * t + m * o;
				let e = 1 / Math.sqrt(s * s + c * c + l * l + u * u);
				s *= e, c *= e, l *= e, u *= e;
			}
		}
		e[t] = s, e[t + 1] = c, e[t + 2] = l, e[t + 3] = u;
	}
	static multiplyQuaternionsFlat(e, t, n, r, i, a) {
		let o = n[r], s = n[r + 1], c = n[r + 2], l = n[r + 3], u = i[a], d = i[a + 1], f = i[a + 2], p = i[a + 3];
		return e[t] = o * p + l * u + s * f - c * d, e[t + 1] = s * p + l * d + c * u - o * f, e[t + 2] = c * p + l * f + o * d - s * u, e[t + 3] = l * p - o * u - s * d - c * f, e;
	}
	get x() {
		return this._x;
	}
	set x(e) {
		this._x = e, this._onChangeCallback();
	}
	get y() {
		return this._y;
	}
	set y(e) {
		this._y = e, this._onChangeCallback();
	}
	get z() {
		return this._z;
	}
	set z(e) {
		this._z = e, this._onChangeCallback();
	}
	get w() {
		return this._w;
	}
	set w(e) {
		this._w = e, this._onChangeCallback();
	}
	set(e, t, n, r) {
		return this._x = e, this._y = t, this._z = n, this._w = r, this._onChangeCallback(), this;
	}
	clone() {
		return new this.constructor(this._x, this._y, this._z, this._w);
	}
	copy(e) {
		return this._x = e.x, this._y = e.y, this._z = e.z, this._w = e.w, this._onChangeCallback(), this;
	}
	setFromEuler(e, t = !0) {
		let n = e._x, r = e._y, i = e._z, a = e._order, o = Math.cos, s = Math.sin, c = o(n / 2), l = o(r / 2), u = o(i / 2), d = s(n / 2), f = s(r / 2), p = s(i / 2);
		switch (a) {
			case "XYZ":
				this._x = d * l * u + c * f * p, this._y = c * f * u - d * l * p, this._z = c * l * p + d * f * u, this._w = c * l * u - d * f * p;
				break;
			case "YXZ":
				this._x = d * l * u + c * f * p, this._y = c * f * u - d * l * p, this._z = c * l * p - d * f * u, this._w = c * l * u + d * f * p;
				break;
			case "ZXY":
				this._x = d * l * u - c * f * p, this._y = c * f * u + d * l * p, this._z = c * l * p + d * f * u, this._w = c * l * u - d * f * p;
				break;
			case "ZYX":
				this._x = d * l * u - c * f * p, this._y = c * f * u + d * l * p, this._z = c * l * p - d * f * u, this._w = c * l * u + d * f * p;
				break;
			case "YZX":
				this._x = d * l * u + c * f * p, this._y = c * f * u + d * l * p, this._z = c * l * p - d * f * u, this._w = c * l * u - d * f * p;
				break;
			case "XZY":
				this._x = d * l * u - c * f * p, this._y = c * f * u - d * l * p, this._z = c * l * p + d * f * u, this._w = c * l * u + d * f * p;
				break;
			default: G("Quaternion: .setFromEuler() encountered an unknown order: " + a);
		}
		return t === !0 && this._onChangeCallback(), this;
	}
	setFromAxisAngle(e, t) {
		let n = t / 2, r = Math.sin(n);
		return this._x = e.x * r, this._y = e.y * r, this._z = e.z * r, this._w = Math.cos(n), this._onChangeCallback(), this;
	}
	setFromRotationMatrix(e) {
		let t = e.elements, n = t[0], r = t[4], i = t[8], a = t[1], o = t[5], s = t[9], c = t[2], l = t[6], u = t[10], d = n + o + u;
		if (d > 0) {
			let e = .5 / Math.sqrt(d + 1);
			this._w = .25 / e, this._x = (l - s) * e, this._y = (i - c) * e, this._z = (a - r) * e;
		} else if (n > o && n > u) {
			let e = 2 * Math.sqrt(1 + n - o - u);
			this._w = (l - s) / e, this._x = .25 * e, this._y = (r + a) / e, this._z = (i + c) / e;
		} else if (o > u) {
			let e = 2 * Math.sqrt(1 + o - n - u);
			this._w = (i - c) / e, this._x = (r + a) / e, this._y = .25 * e, this._z = (s + l) / e;
		} else {
			let e = 2 * Math.sqrt(1 + u - n - o);
			this._w = (a - r) / e, this._x = (i + c) / e, this._y = (s + l) / e, this._z = .25 * e;
		}
		return this._onChangeCallback(), this;
	}
	setFromUnitVectors(e, t) {
		let n = e.dot(t) + 1;
		return n < 1e-8 ? (n = 0, Math.abs(e.x) > Math.abs(e.z) ? (this._x = -e.y, this._y = e.x, this._z = 0, this._w = n) : (this._x = 0, this._y = -e.z, this._z = e.y, this._w = n)) : (this._x = e.y * t.z - e.z * t.y, this._y = e.z * t.x - e.x * t.z, this._z = e.x * t.y - e.y * t.x, this._w = n), this.normalize();
	}
	angleTo(e) {
		return 2 * Math.acos(Math.abs(q(this.dot(e), -1, 1)));
	}
	rotateTowards(e, t) {
		let n = this.angleTo(e);
		if (n === 0) return this;
		let r = Math.min(1, t / n);
		return this.slerp(e, r), this;
	}
	identity() {
		return this.set(0, 0, 0, 1);
	}
	invert() {
		return this.conjugate();
	}
	conjugate() {
		return this._x *= -1, this._y *= -1, this._z *= -1, this._onChangeCallback(), this;
	}
	dot(e) {
		return this._x * e._x + this._y * e._y + this._z * e._z + this._w * e._w;
	}
	lengthSq() {
		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
	}
	length() {
		return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
	}
	normalize() {
		let e = this.length();
		return e === 0 ? (this._x = 0, this._y = 0, this._z = 0, this._w = 1) : (e = 1 / e, this._x *= e, this._y *= e, this._z *= e, this._w *= e), this._onChangeCallback(), this;
	}
	multiply(e) {
		return this.multiplyQuaternions(this, e);
	}
	premultiply(e) {
		return this.multiplyQuaternions(e, this);
	}
	multiplyQuaternions(e, t) {
		let n = e._x, r = e._y, i = e._z, a = e._w, o = t._x, s = t._y, c = t._z, l = t._w;
		return this._x = n * l + a * o + r * c - i * s, this._y = r * l + a * s + i * o - n * c, this._z = i * l + a * c + n * s - r * o, this._w = a * l - n * o - r * s - i * c, this._onChangeCallback(), this;
	}
	slerp(e, t) {
		let n = e._x, r = e._y, i = e._z, a = e._w, o = this.dot(e);
		o < 0 && (n = -n, r = -r, i = -i, a = -a, o = -o);
		let s = 1 - t;
		if (o < .9995) {
			let e = Math.acos(o), c = Math.sin(e);
			s = Math.sin(s * e) / c, t = Math.sin(t * e) / c, this._x = this._x * s + n * t, this._y = this._y * s + r * t, this._z = this._z * s + i * t, this._w = this._w * s + a * t, this._onChangeCallback();
		} else this._x = this._x * s + n * t, this._y = this._y * s + r * t, this._z = this._z * s + i * t, this._w = this._w * s + a * t, this.normalize();
		return this;
	}
	slerpQuaternions(e, t, n) {
		return this.copy(e).slerp(t, n);
	}
	random() {
		let e = 2 * Math.PI * Math.random(), t = 2 * Math.PI * Math.random(), n = Math.random(), r = Math.sqrt(1 - n), i = Math.sqrt(n);
		return this.set(r * Math.sin(e), r * Math.cos(e), i * Math.sin(t), i * Math.cos(t));
	}
	equals(e) {
		return e._x === this._x && e._y === this._y && e._z === this._z && e._w === this._w;
	}
	fromArray(e, t = 0) {
		return this._x = e[t], this._y = e[t + 1], this._z = e[t + 2], this._w = e[t + 3], this._onChangeCallback(), this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this._x, e[t + 1] = this._y, e[t + 2] = this._z, e[t + 3] = this._w, e;
	}
	fromBufferAttribute(e, t) {
		return this._x = e.getX(t), this._y = e.getY(t), this._z = e.getZ(t), this._w = e.getW(t), this._onChangeCallback(), this;
	}
	toJSON() {
		return this.toArray();
	}
	_onChange(e) {
		return this._onChangeCallback = e, this;
	}
	_onChangeCallback() {}
	*[Symbol.iterator]() {
		yield this._x, yield this._y, yield this._z, yield this._w;
	}
}, Y = class {
	static {
		this.prototype.isVector3 = !0;
	}
	constructor(e = 0, t = 0, n = 0) {
		this.x = e, this.y = t, this.z = n;
	}
	set(e, t, n) {
		return n === void 0 && (n = this.z), this.x = e, this.y = t, this.z = n, this;
	}
	setScalar(e) {
		return this.x = e, this.y = e, this.z = e, this;
	}
	setX(e) {
		return this.x = e, this;
	}
	setY(e) {
		return this.y = e, this;
	}
	setZ(e) {
		return this.z = e, this;
	}
	setComponent(e, t) {
		switch (e) {
			case 0:
				this.x = t;
				break;
			case 1:
				this.y = t;
				break;
			case 2:
				this.z = t;
				break;
			default: throw Error("THREE.Vector3: index is out of range: " + e);
		}
		return this;
	}
	getComponent(e) {
		switch (e) {
			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw Error("THREE.Vector3: index is out of range: " + e);
		}
	}
	clone() {
		return new this.constructor(this.x, this.y, this.z);
	}
	copy(e) {
		return this.x = e.x, this.y = e.y, this.z = e.z, this;
	}
	add(e) {
		return this.x += e.x, this.y += e.y, this.z += e.z, this;
	}
	addScalar(e) {
		return this.x += e, this.y += e, this.z += e, this;
	}
	addVectors(e, t) {
		return this.x = e.x + t.x, this.y = e.y + t.y, this.z = e.z + t.z, this;
	}
	addScaledVector(e, t) {
		return this.x += e.x * t, this.y += e.y * t, this.z += e.z * t, this;
	}
	sub(e) {
		return this.x -= e.x, this.y -= e.y, this.z -= e.z, this;
	}
	subScalar(e) {
		return this.x -= e, this.y -= e, this.z -= e, this;
	}
	subVectors(e, t) {
		return this.x = e.x - t.x, this.y = e.y - t.y, this.z = e.z - t.z, this;
	}
	multiply(e) {
		return this.x *= e.x, this.y *= e.y, this.z *= e.z, this;
	}
	multiplyScalar(e) {
		return this.x *= e, this.y *= e, this.z *= e, this;
	}
	multiplyVectors(e, t) {
		return this.x = e.x * t.x, this.y = e.y * t.y, this.z = e.z * t.z, this;
	}
	applyEuler(e) {
		return this.applyQuaternion(Dt.setFromEuler(e));
	}
	applyAxisAngle(e, t) {
		return this.applyQuaternion(Dt.setFromAxisAngle(e, t));
	}
	applyMatrix3(e) {
		let t = this.x, n = this.y, r = this.z, i = e.elements;
		return this.x = i[0] * t + i[3] * n + i[6] * r, this.y = i[1] * t + i[4] * n + i[7] * r, this.z = i[2] * t + i[5] * n + i[8] * r, this;
	}
	applyNormalMatrix(e) {
		return this.applyMatrix3(e).normalize();
	}
	applyMatrix4(e) {
		let t = this.x, n = this.y, r = this.z, i = e.elements, a = 1 / (i[3] * t + i[7] * n + i[11] * r + i[15]);
		return this.x = (i[0] * t + i[4] * n + i[8] * r + i[12]) * a, this.y = (i[1] * t + i[5] * n + i[9] * r + i[13]) * a, this.z = (i[2] * t + i[6] * n + i[10] * r + i[14]) * a, this;
	}
	applyQuaternion(e) {
		let t = this.x, n = this.y, r = this.z, i = e.x, a = e.y, o = e.z, s = e.w, c = 2 * (a * r - o * n), l = 2 * (o * t - i * r), u = 2 * (i * n - a * t);
		return this.x = t + s * c + a * u - o * l, this.y = n + s * l + o * c - i * u, this.z = r + s * u + i * l - a * c, this;
	}
	project(e) {
		return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix);
	}
	unproject(e) {
		return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld);
	}
	transformDirection(e) {
		let t = this.x, n = this.y, r = this.z, i = e.elements;
		return this.x = i[0] * t + i[4] * n + i[8] * r, this.y = i[1] * t + i[5] * n + i[9] * r, this.z = i[2] * t + i[6] * n + i[10] * r, this.normalize();
	}
	divide(e) {
		return this.x /= e.x, this.y /= e.y, this.z /= e.z, this;
	}
	divideScalar(e) {
		return this.multiplyScalar(1 / e);
	}
	min(e) {
		return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this.z = Math.min(this.z, e.z), this;
	}
	max(e) {
		return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this.z = Math.max(this.z, e.z), this;
	}
	clamp(e, t) {
		return this.x = q(this.x, e.x, t.x), this.y = q(this.y, e.y, t.y), this.z = q(this.z, e.z, t.z), this;
	}
	clampScalar(e, t) {
		return this.x = q(this.x, e, t), this.y = q(this.y, e, t), this.z = q(this.z, e, t), this;
	}
	clampLength(e, t) {
		let n = this.length();
		return this.divideScalar(n || 1).multiplyScalar(q(n, e, t));
	}
	floor() {
		return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this;
	}
	ceil() {
		return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this;
	}
	round() {
		return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this;
	}
	roundToZero() {
		return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this;
	}
	negate() {
		return this.x = -this.x, this.y = -this.y, this.z = -this.z, this;
	}
	dot(e) {
		return this.x * e.x + this.y * e.y + this.z * e.z;
	}
	lengthSq() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
	manhattanLength() {
		return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
	}
	normalize() {
		return this.divideScalar(this.length() || 1);
	}
	setLength(e) {
		return this.normalize().multiplyScalar(e);
	}
	lerp(e, t) {
		return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this.z += (e.z - this.z) * t, this;
	}
	lerpVectors(e, t, n) {
		return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this.z = e.z + (t.z - e.z) * n, this;
	}
	cross(e) {
		return this.crossVectors(this, e);
	}
	crossVectors(e, t) {
		let n = e.x, r = e.y, i = e.z, a = t.x, o = t.y, s = t.z;
		return this.x = r * s - i * o, this.y = i * a - n * s, this.z = n * o - r * a, this;
	}
	projectOnVector(e) {
		let t = e.lengthSq();
		if (t === 0) return this.set(0, 0, 0);
		let n = e.dot(this) / t;
		return this.copy(e).multiplyScalar(n);
	}
	projectOnPlane(e) {
		return Et.copy(this).projectOnVector(e), this.sub(Et);
	}
	reflect(e) {
		return this.sub(Et.copy(e).multiplyScalar(2 * this.dot(e)));
	}
	angleTo(e) {
		let t = Math.sqrt(this.lengthSq() * e.lengthSq());
		if (t === 0) return Math.PI / 2;
		let n = this.dot(e) / t;
		return Math.acos(q(n, -1, 1));
	}
	distanceTo(e) {
		return Math.sqrt(this.distanceToSquared(e));
	}
	distanceToSquared(e) {
		let t = this.x - e.x, n = this.y - e.y, r = this.z - e.z;
		return t * t + n * n + r * r;
	}
	manhattanDistanceTo(e) {
		return Math.abs(this.x - e.x) + Math.abs(this.y - e.y) + Math.abs(this.z - e.z);
	}
	setFromSpherical(e) {
		return this.setFromSphericalCoords(e.radius, e.phi, e.theta);
	}
	setFromSphericalCoords(e, t, n) {
		let r = Math.sin(t) * e;
		return this.x = r * Math.sin(n), this.y = Math.cos(t) * e, this.z = r * Math.cos(n), this;
	}
	setFromCylindrical(e) {
		return this.setFromCylindricalCoords(e.radius, e.theta, e.y);
	}
	setFromCylindricalCoords(e, t, n) {
		return this.x = e * Math.sin(t), this.y = n, this.z = e * Math.cos(t), this;
	}
	setFromMatrixPosition(e) {
		let t = e.elements;
		return this.x = t[12], this.y = t[13], this.z = t[14], this;
	}
	setFromMatrixScale(e) {
		let t = this.setFromMatrixColumn(e, 0).length(), n = this.setFromMatrixColumn(e, 1).length(), r = this.setFromMatrixColumn(e, 2).length();
		return this.x = t, this.y = n, this.z = r, this;
	}
	setFromMatrixColumn(e, t) {
		return this.fromArray(e.elements, t * 4);
	}
	setFromMatrix3Column(e, t) {
		return this.fromArray(e.elements, t * 3);
	}
	setFromEuler(e) {
		return this.x = e._x, this.y = e._y, this.z = e._z, this;
	}
	setFromColor(e) {
		return this.x = e.r, this.y = e.g, this.z = e.b, this;
	}
	equals(e) {
		return e.x === this.x && e.y === this.y && e.z === this.z;
	}
	fromArray(e, t = 0) {
		return this.x = e[t], this.y = e[t + 1], this.z = e[t + 2], this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this.x, e[t + 1] = this.y, e[t + 2] = this.z, e;
	}
	fromBufferAttribute(e, t) {
		return this.x = e.getX(t), this.y = e.getY(t), this.z = e.getZ(t), this;
	}
	random() {
		return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this;
	}
	randomDirection() {
		let e = Math.random() * Math.PI * 2, t = Math.random() * 2 - 1, n = Math.sqrt(1 - t * t);
		return this.x = n * Math.cos(e), this.y = t, this.z = n * Math.sin(e), this;
	}
	*[Symbol.iterator]() {
		yield this.x, yield this.y, yield this.z;
	}
}, Et = /*@__PURE__*/ new Y(), Dt = /*@__PURE__*/ new Tt(), X = class {
	static {
		this.prototype.isMatrix3 = !0;
	}
	constructor(e, t, n, r, i, a, o, s, c) {
		this.elements = [
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1
		], e !== void 0 && this.set(e, t, n, r, i, a, o, s, c);
	}
	set(e, t, n, r, i, a, o, s, c) {
		let l = this.elements;
		return l[0] = e, l[1] = r, l[2] = o, l[3] = t, l[4] = i, l[5] = s, l[6] = n, l[7] = a, l[8] = c, this;
	}
	identity() {
		return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this;
	}
	copy(e) {
		let t = this.elements, n = e.elements;
		return t[0] = n[0], t[1] = n[1], t[2] = n[2], t[3] = n[3], t[4] = n[4], t[5] = n[5], t[6] = n[6], t[7] = n[7], t[8] = n[8], this;
	}
	extractBasis(e, t, n) {
		return e.setFromMatrix3Column(this, 0), t.setFromMatrix3Column(this, 1), n.setFromMatrix3Column(this, 2), this;
	}
	setFromMatrix4(e) {
		let t = e.elements;
		return this.set(t[0], t[4], t[8], t[1], t[5], t[9], t[2], t[6], t[10]), this;
	}
	multiply(e) {
		return this.multiplyMatrices(this, e);
	}
	premultiply(e) {
		return this.multiplyMatrices(e, this);
	}
	multiplyMatrices(e, t) {
		let n = e.elements, r = t.elements, i = this.elements, a = n[0], o = n[3], s = n[6], c = n[1], l = n[4], u = n[7], d = n[2], f = n[5], p = n[8], m = r[0], h = r[3], g = r[6], _ = r[1], v = r[4], y = r[7], b = r[2], x = r[5], S = r[8];
		return i[0] = a * m + o * _ + s * b, i[3] = a * h + o * v + s * x, i[6] = a * g + o * y + s * S, i[1] = c * m + l * _ + u * b, i[4] = c * h + l * v + u * x, i[7] = c * g + l * y + u * S, i[2] = d * m + f * _ + p * b, i[5] = d * h + f * v + p * x, i[8] = d * g + f * y + p * S, this;
	}
	multiplyScalar(e) {
		let t = this.elements;
		return t[0] *= e, t[3] *= e, t[6] *= e, t[1] *= e, t[4] *= e, t[7] *= e, t[2] *= e, t[5] *= e, t[8] *= e, this;
	}
	determinant() {
		let e = this.elements, t = e[0], n = e[1], r = e[2], i = e[3], a = e[4], o = e[5], s = e[6], c = e[7], l = e[8];
		return t * a * l - t * o * c - n * i * l + n * o * s + r * i * c - r * a * s;
	}
	invert() {
		let e = this.elements, t = e[0], n = e[1], r = e[2], i = e[3], a = e[4], o = e[5], s = e[6], c = e[7], l = e[8], u = l * a - o * c, d = o * s - l * i, f = c * i - a * s, p = t * u + n * d + r * f;
		if (p === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
		let m = 1 / p;
		return e[0] = u * m, e[1] = (r * c - l * n) * m, e[2] = (o * n - r * a) * m, e[3] = d * m, e[4] = (l * t - r * s) * m, e[5] = (r * i - o * t) * m, e[6] = f * m, e[7] = (n * s - c * t) * m, e[8] = (a * t - n * i) * m, this;
	}
	transpose() {
		let e, t = this.elements;
		return e = t[1], t[1] = t[3], t[3] = e, e = t[2], t[2] = t[6], t[6] = e, e = t[5], t[5] = t[7], t[7] = e, this;
	}
	getNormalMatrix(e) {
		return this.setFromMatrix4(e).invert().transpose();
	}
	transposeIntoArray(e) {
		let t = this.elements;
		return e[0] = t[0], e[1] = t[3], e[2] = t[6], e[3] = t[1], e[4] = t[4], e[5] = t[7], e[6] = t[2], e[7] = t[5], e[8] = t[8], this;
	}
	setUvTransform(e, t, n, r, i, a, o) {
		let s = Math.cos(i), c = Math.sin(i);
		return this.set(n * s, n * c, -n * (s * a + c * o) + a + e, -r * c, r * s, -r * (-c * a + s * o) + o + t, 0, 0, 1), this;
	}
	scale(e, t) {
		return Je("Matrix3: .scale() is deprecated. Use .makeScale() instead."), this.premultiply(Ot.makeScale(e, t)), this;
	}
	rotate(e) {
		return Je("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."), this.premultiply(Ot.makeRotation(-e)), this;
	}
	translate(e, t) {
		return Je("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."), this.premultiply(Ot.makeTranslation(e, t)), this;
	}
	makeTranslation(e, t) {
		return e.isVector2 ? this.set(1, 0, e.x, 0, 1, e.y, 0, 0, 1) : this.set(1, 0, e, 0, 1, t, 0, 0, 1), this;
	}
	makeRotation(e) {
		let t = Math.cos(e), n = Math.sin(e);
		return this.set(t, -n, 0, n, t, 0, 0, 0, 1), this;
	}
	makeScale(e, t) {
		return this.set(e, 0, 0, 0, t, 0, 0, 0, 1), this;
	}
	equals(e) {
		let t = this.elements, n = e.elements;
		for (let e = 0; e < 9; e++) if (t[e] !== n[e]) return !1;
		return !0;
	}
	fromArray(e, t = 0) {
		for (let n = 0; n < 9; n++) this.elements[n] = e[n + t];
		return this;
	}
	toArray(e = [], t = 0) {
		let n = this.elements;
		return e[t] = n[0], e[t + 1] = n[1], e[t + 2] = n[2], e[t + 3] = n[3], e[t + 4] = n[4], e[t + 5] = n[5], e[t + 6] = n[6], e[t + 7] = n[7], e[t + 8] = n[8], e;
	}
	clone() {
		return new this.constructor().fromArray(this.elements);
	}
}, Ot = /*@__PURE__*/ new X(), kt = /*@__PURE__*/ new X().set(.4123908, .3575843, .1804808, .212639, .7151687, .0721923, .0193308, .1191948, .9505322), At = /*@__PURE__*/ new X().set(3.2409699, -1.5373832, -.4986108, -.9692436, 1.8759675, .0415551, .0556301, -.203977, 1.0569715);
function jt() {
	let e = {
		enabled: !0,
		workingColorSpace: Pe,
		spaces: {},
		convert: function(e, t, n) {
			return this.enabled === !1 || t === n || !t || !n || (this.spaces[t].transfer === "srgb" && (e.r = Nt(e.r), e.g = Nt(e.g), e.b = Nt(e.b)), this.spaces[t].primaries !== this.spaces[n].primaries && (e.applyMatrix3(this.spaces[t].toXYZ), e.applyMatrix3(this.spaces[n].fromXYZ)), this.spaces[n].transfer === "srgb" && (e.r = Pt(e.r), e.g = Pt(e.g), e.b = Pt(e.b))), e;
		},
		workingToColorSpace: function(e, t) {
			return this.convert(e, this.workingColorSpace, t);
		},
		colorSpaceToWorking: function(e, t) {
			return this.convert(e, t, this.workingColorSpace);
		},
		getPrimaries: function(e) {
			return this.spaces[e].primaries;
		},
		getTransfer: function(e) {
			return e === "" ? Fe : this.spaces[e].transfer;
		},
		getToneMappingMode: function(e) {
			return this.spaces[e].outputColorSpaceConfig.toneMappingMode || "standard";
		},
		getLuminanceCoefficients: function(e, t = this.workingColorSpace) {
			return e.fromArray(this.spaces[t].luminanceCoefficients);
		},
		define: function(e) {
			Object.assign(this.spaces, e);
		},
		_getMatrix: function(e, t, n) {
			return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ);
		},
		_getDrawingBufferColorSpace: function(e) {
			return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace;
		},
		_getUnpackColorSpace: function(e = this.workingColorSpace) {
			return this.spaces[e].workingColorSpaceConfig.unpackColorSpace;
		}
	}, t = [
		.64,
		.33,
		.3,
		.6,
		.15,
		.06
	], n = [
		.2126,
		.7152,
		.0722
	], r = [.3127, .329];
	return e.define({
		[Pe]: {
			primaries: t,
			whitePoint: r,
			transfer: Fe,
			toXYZ: kt,
			fromXYZ: At,
			luminanceCoefficients: n,
			workingColorSpaceConfig: { unpackColorSpace: Ne },
			outputColorSpaceConfig: { drawingBufferColorSpace: Ne }
		},
		[Ne]: {
			primaries: t,
			whitePoint: r,
			transfer: Ie,
			toXYZ: kt,
			fromXYZ: At,
			luminanceCoefficients: n,
			outputColorSpaceConfig: { drawingBufferColorSpace: Ne }
		}
	}), e;
}
var Mt = /*@__PURE__*/ jt();
function Nt(e) {
	return e < .04045 ? e * .0773993808 : (e * .9478672986 + .0521327014) ** 2.4;
}
function Pt(e) {
	return e < .0031308 ? e * 12.92 : 1.055 * e ** .41666 - .055;
}
var Ft, It = class {
	static getDataURL(e, t = "image/png") {
		if (/^data:/i.test(e.src) || typeof HTMLCanvasElement > "u") return e.src;
		let n;
		if (e instanceof HTMLCanvasElement) n = e;
		else {
			Ft === void 0 && (Ft = Ue("canvas")), Ft.width = e.width, Ft.height = e.height;
			let t = Ft.getContext("2d");
			e instanceof ImageData ? t.putImageData(e, 0, 0) : t.drawImage(e, 0, 0, e.width, e.height), n = Ft;
		}
		return n.toDataURL(t);
	}
	static sRGBToLinear(e) {
		if (typeof HTMLImageElement < "u" && e instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap) {
			let t = Ue("canvas");
			t.width = e.width, t.height = e.height;
			let n = t.getContext("2d");
			n.drawImage(e, 0, 0, e.width, e.height);
			let r = n.getImageData(0, 0, e.width, e.height), i = r.data;
			for (let e = 0; e < i.length; e++) i[e] = Nt(i[e] / 255) * 255;
			return n.putImageData(r, 0, 0), t;
		}
		if (e.data) {
			let t = e.data.slice(0);
			for (let e = 0; e < t.length; e++) t instanceof Uint8Array || t instanceof Uint8ClampedArray ? t[e] = Math.floor(Nt(t[e] / 255) * 255) : t[e] = Nt(t[e]);
			return {
				data: t,
				width: e.width,
				height: e.height
			};
		}
		return G("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."), e;
	}
}, Lt = 0, Rt = class {
	constructor(e = null) {
		this.isTextureSource = !0, Object.defineProperty(this, "id", { value: Lt++ }), this.uuid = nt(), this.data = e, this.dataReady = !0, this.version = 0;
	}
	getSize(e) {
		let t = this.data;
		return typeof HTMLVideoElement < "u" && t instanceof HTMLVideoElement ? e.set(t.videoWidth, t.videoHeight, 0) : typeof VideoFrame < "u" && t instanceof VideoFrame ? e.set(t.displayWidth, t.displayHeight, 0) : t === null ? e.set(0, 0, 0) : e.set(t.width || 0, t.height || 0, t.depth || 0), e;
	}
	set needsUpdate(e) {
		e === !0 && this.version++;
	}
	toJSON(e) {
		let t = e === void 0 || typeof e == "string";
		if (!t && e.images[this.uuid] !== void 0) return e.images[this.uuid];
		let n = {
			uuid: this.uuid,
			url: ""
		}, r = this.data;
		if (r !== null) {
			let e;
			if (Array.isArray(r)) {
				e = [];
				for (let t = 0, n = r.length; t < n; t++) r[t].isDataTexture ? e.push(zt(r[t].image)) : e.push(zt(r[t]));
			} else e = zt(r);
			n.url = e;
		}
		return t || (e.images[this.uuid] = n), n;
	}
};
function zt(e) {
	return typeof HTMLImageElement < "u" && e instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap ? It.getDataURL(e) : e.data ? {
		data: Array.from(e.data),
		width: e.width,
		height: e.height,
		type: e.data.constructor.name
	} : (G("Texture: Unable to serialize Texture."), {});
}
var Bt = 0, Vt = /*@__PURE__*/ new Y(), Ht = class e extends Ze {
	constructor(t = e.DEFAULT_IMAGE, n = e.DEFAULT_MAPPING, i = r, a = r, o = c, s = u, l = E, f = d, p = e.DEFAULT_ANISOTROPY, m = "") {
		super(), this.isTexture = !0, Object.defineProperty(this, "id", { value: Bt++ }), this.uuid = nt(), this.name = "", this.source = new Rt(t), this.mipmaps = [], this.mapping = n, this.channel = 0, this.wrapS = i, this.wrapT = a, this.magFilter = o, this.minFilter = s, this.anisotropy = p, this.format = l, this.internalFormat = null, this.type = f, this.offset = new J(0, 0), this.repeat = new J(1, 1), this.center = new J(0, 0), this.rotation = 0, this.matrixAutoUpdate = !0, this.matrix = new X(), this.generateMipmaps = !0, this.mipmapsAutoUpdate = !0, this.premultiplyAlpha = !1, this.flipY = !0, this.unpackAlignment = 4, this.colorSpace = m, this.userData = {}, this.updateRanges = [], this.version = 0, this.onUpdate = null, this.renderTarget = null, this.isRenderTargetTexture = !1, this.isArrayTexture = !!(t && t.depth && t.depth > 1), this.pmremVersion = 0, this.isPMREMTexture = !1, this.normalized = !1;
	}
	get width() {
		return this.source.getSize(Vt).x;
	}
	get height() {
		return this.source.getSize(Vt).y;
	}
	get depth() {
		return this.source.getSize(Vt).z;
	}
	get image() {
		return this.source.data;
	}
	set image(e) {
		this.source.data = e;
	}
	updateMatrix() {
		this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
	}
	addUpdateRange(e, t) {
		this.updateRanges.push({
			start: e,
			count: t
		});
	}
	clearUpdateRanges() {
		this.updateRanges.length = 0;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		return this.name = e.name, this.source = e.source, this.mipmaps = e.mipmaps.slice(0), this.mapping = e.mapping, this.channel = e.channel, this.wrapS = e.wrapS, this.wrapT = e.wrapT, this.magFilter = e.magFilter, this.minFilter = e.minFilter, this.anisotropy = e.anisotropy, this.format = e.format, this.internalFormat = e.internalFormat, this.type = e.type, this.normalized = e.normalized, this.offset.copy(e.offset), this.repeat.copy(e.repeat), this.center.copy(e.center), this.rotation = e.rotation, this.matrixAutoUpdate = e.matrixAutoUpdate, this.matrix.copy(e.matrix), this.generateMipmaps = e.generateMipmaps, this.mipmapsAutoUpdate = e.mipmapsAutoUpdate, this.premultiplyAlpha = e.premultiplyAlpha, this.flipY = e.flipY, this.unpackAlignment = e.unpackAlignment, this.colorSpace = e.colorSpace, this.renderTarget = e.renderTarget, this.isRenderTargetTexture = e.isRenderTargetTexture, this.isPMREMTexture = e.isPMREMTexture, this.isArrayTexture = e.isArrayTexture, this.userData = JSON.parse(JSON.stringify(e.userData)), this.needsUpdate = !0, this;
	}
	setValues(e) {
		for (let t in e) {
			let n = e[t];
			if (n === void 0) {
				G(`Texture.setValues(): parameter '${t}' has value of undefined.`);
				continue;
			}
			let r = this[t];
			r === void 0 ? G(`Texture.setValues(): property '${t}' does not exist.`) : r && n && r.isVector2 && n.isVector2 || r && n && r.isVector3 && n.isVector3 || r && n && r.isMatrix3 && n.isMatrix3 ? r.copy(n) : this[t] = n;
		}
	}
	toJSON(e) {
		let t = e === void 0 || typeof e == "string";
		if (!t && e.textures[this.uuid] !== void 0) return e.textures[this.uuid];
		let n = {
			metadata: {
				version: 4.7,
				type: "Texture",
				generator: "Texture.toJSON"
			},
			uuid: this.uuid,
			name: this.name,
			image: this.source.toJSON(e).uuid,
			mapping: this.mapping,
			channel: this.channel,
			repeat: [this.repeat.x, this.repeat.y],
			offset: [this.offset.x, this.offset.y],
			center: [this.center.x, this.center.y],
			rotation: this.rotation,
			wrap: [this.wrapS, this.wrapT],
			format: this.format,
			internalFormat: this.internalFormat,
			type: this.type,
			normalized: this.normalized,
			colorSpace: this.colorSpace,
			minFilter: this.minFilter,
			magFilter: this.magFilter,
			anisotropy: this.anisotropy,
			flipY: this.flipY,
			generateMipmaps: this.generateMipmaps,
			mipmapsAutoUpdate: this.mipmapsAutoUpdate,
			premultiplyAlpha: this.premultiplyAlpha,
			unpackAlignment: this.unpackAlignment
		};
		return Object.keys(this.userData).length > 0 && (n.userData = this.userData), t || (e.textures[this.uuid] = n), n;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
	transformUv(e) {
		if (this.mapping !== 300) return e;
		if (e.applyMatrix3(this.matrix), e.x < 0 || e.x > 1) switch (this.wrapS) {
			case n:
				e.x -= Math.floor(e.x);
				break;
			case r:
				e.x = e.x < 0 ? 0 : 1;
				break;
			case i: Math.abs(Math.floor(e.x) % 2) === 1 ? e.x = Math.ceil(e.x) - e.x : e.x -= Math.floor(e.x);
		}
		if (e.y < 0 || e.y > 1) switch (this.wrapT) {
			case n:
				e.y -= Math.floor(e.y);
				break;
			case r:
				e.y = e.y < 0 ? 0 : 1;
				break;
			case i: Math.abs(Math.floor(e.y) % 2) === 1 ? e.y = Math.ceil(e.y) - e.y : e.y -= Math.floor(e.y);
		}
		return this.flipY && (e.y = 1 - e.y), e;
	}
	set needsUpdate(e) {
		e === !0 && (this.version++, this.source.needsUpdate = !0);
	}
	set needsPMREMUpdate(e) {
		e === !0 && this.pmremVersion++;
	}
};
Ht.DEFAULT_IMAGE = null, Ht.DEFAULT_MAPPING = 300, Ht.DEFAULT_ANISOTROPY = 1;
var Ut = class {
	static {
		this.prototype.isVector4 = !0;
	}
	constructor(e = 0, t = 0, n = 0, r = 1) {
		this.x = e, this.y = t, this.z = n, this.w = r;
	}
	get width() {
		return this.z;
	}
	set width(e) {
		this.z = e;
	}
	get height() {
		return this.w;
	}
	set height(e) {
		this.w = e;
	}
	set(e, t, n, r) {
		return this.x = e, this.y = t, this.z = n, this.w = r, this;
	}
	setScalar(e) {
		return this.x = e, this.y = e, this.z = e, this.w = e, this;
	}
	setX(e) {
		return this.x = e, this;
	}
	setY(e) {
		return this.y = e, this;
	}
	setZ(e) {
		return this.z = e, this;
	}
	setW(e) {
		return this.w = e, this;
	}
	setComponent(e, t) {
		switch (e) {
			case 0:
				this.x = t;
				break;
			case 1:
				this.y = t;
				break;
			case 2:
				this.z = t;
				break;
			case 3:
				this.w = t;
				break;
			default: throw Error("THREE.Vector4: index is out of range: " + e);
		}
		return this;
	}
	getComponent(e) {
		switch (e) {
			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			case 3: return this.w;
			default: throw Error("THREE.Vector4: index is out of range: " + e);
		}
	}
	clone() {
		return new this.constructor(this.x, this.y, this.z, this.w);
	}
	copy(e) {
		return this.x = e.x, this.y = e.y, this.z = e.z, this.w = e.w === void 0 ? 1 : e.w, this;
	}
	add(e) {
		return this.x += e.x, this.y += e.y, this.z += e.z, this.w += e.w, this;
	}
	addScalar(e) {
		return this.x += e, this.y += e, this.z += e, this.w += e, this;
	}
	addVectors(e, t) {
		return this.x = e.x + t.x, this.y = e.y + t.y, this.z = e.z + t.z, this.w = e.w + t.w, this;
	}
	addScaledVector(e, t) {
		return this.x += e.x * t, this.y += e.y * t, this.z += e.z * t, this.w += e.w * t, this;
	}
	sub(e) {
		return this.x -= e.x, this.y -= e.y, this.z -= e.z, this.w -= e.w, this;
	}
	subScalar(e) {
		return this.x -= e, this.y -= e, this.z -= e, this.w -= e, this;
	}
	subVectors(e, t) {
		return this.x = e.x - t.x, this.y = e.y - t.y, this.z = e.z - t.z, this.w = e.w - t.w, this;
	}
	multiply(e) {
		return this.x *= e.x, this.y *= e.y, this.z *= e.z, this.w *= e.w, this;
	}
	multiplyScalar(e) {
		return this.x *= e, this.y *= e, this.z *= e, this.w *= e, this;
	}
	applyMatrix4(e) {
		let t = this.x, n = this.y, r = this.z, i = this.w, a = e.elements;
		return this.x = a[0] * t + a[4] * n + a[8] * r + a[12] * i, this.y = a[1] * t + a[5] * n + a[9] * r + a[13] * i, this.z = a[2] * t + a[6] * n + a[10] * r + a[14] * i, this.w = a[3] * t + a[7] * n + a[11] * r + a[15] * i, this;
	}
	divide(e) {
		return this.x /= e.x, this.y /= e.y, this.z /= e.z, this.w /= e.w, this;
	}
	divideScalar(e) {
		return this.multiplyScalar(1 / e);
	}
	setAxisAngleFromQuaternion(e) {
		this.w = 2 * Math.acos(e.w);
		let t = Math.sqrt(1 - e.w * e.w);
		return t < 1e-4 ? (this.x = 1, this.y = 0, this.z = 0) : (this.x = e.x / t, this.y = e.y / t, this.z = e.z / t), this;
	}
	setAxisAngleFromRotationMatrix(e) {
		let t, n, r, i, a = .01, o = .1, s = e.elements, c = s[0], l = s[4], u = s[8], d = s[1], f = s[5], p = s[9], m = s[2], h = s[6], g = s[10];
		if (Math.abs(l - d) < a && Math.abs(u - m) < a && Math.abs(p - h) < a) {
			if (Math.abs(l + d) < o && Math.abs(u + m) < o && Math.abs(p + h) < o && Math.abs(c + f + g - 3) < o) return this.set(1, 0, 0, 0), this;
			t = Math.PI;
			let e = (c + 1) / 2, s = (f + 1) / 2, _ = (g + 1) / 2, v = (l + d) / 4, y = (u + m) / 4, b = (p + h) / 4;
			return e > s && e > _ ? e < a ? (n = 0, r = .707106781, i = .707106781) : (n = Math.sqrt(e), r = v / n, i = y / n) : s > _ ? s < a ? (n = .707106781, r = 0, i = .707106781) : (r = Math.sqrt(s), n = v / r, i = b / r) : _ < a ? (n = .707106781, r = .707106781, i = 0) : (i = Math.sqrt(_), n = y / i, r = b / i), this.set(n, r, i, t), this;
		}
		let _ = Math.sqrt((h - p) * (h - p) + (u - m) * (u - m) + (d - l) * (d - l));
		return Math.abs(_) < .001 && (_ = 1), this.x = (h - p) / _, this.y = (u - m) / _, this.z = (d - l) / _, this.w = Math.acos((c + f + g - 1) / 2), this;
	}
	setFromMatrixPosition(e) {
		let t = e.elements;
		return this.x = t[12], this.y = t[13], this.z = t[14], this.w = t[15], this;
	}
	min(e) {
		return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this.z = Math.min(this.z, e.z), this.w = Math.min(this.w, e.w), this;
	}
	max(e) {
		return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this.z = Math.max(this.z, e.z), this.w = Math.max(this.w, e.w), this;
	}
	clamp(e, t) {
		return this.x = q(this.x, e.x, t.x), this.y = q(this.y, e.y, t.y), this.z = q(this.z, e.z, t.z), this.w = q(this.w, e.w, t.w), this;
	}
	clampScalar(e, t) {
		return this.x = q(this.x, e, t), this.y = q(this.y, e, t), this.z = q(this.z, e, t), this.w = q(this.w, e, t), this;
	}
	clampLength(e, t) {
		let n = this.length();
		return this.divideScalar(n || 1).multiplyScalar(q(n, e, t));
	}
	floor() {
		return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this.w = Math.floor(this.w), this;
	}
	ceil() {
		return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this.w = Math.ceil(this.w), this;
	}
	round() {
		return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this.w = Math.round(this.w), this;
	}
	roundToZero() {
		return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this.w = Math.trunc(this.w), this;
	}
	negate() {
		return this.x = -this.x, this.y = -this.y, this.z = -this.z, this.w = -this.w, this;
	}
	dot(e) {
		return this.x * e.x + this.y * e.y + this.z * e.z + this.w * e.w;
	}
	lengthSq() {
		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
	}
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	}
	manhattanLength() {
		return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
	}
	normalize() {
		return this.divideScalar(this.length() || 1);
	}
	setLength(e) {
		return this.normalize().multiplyScalar(e);
	}
	lerp(e, t) {
		return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this.z += (e.z - this.z) * t, this.w += (e.w - this.w) * t, this;
	}
	lerpVectors(e, t, n) {
		return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this.z = e.z + (t.z - e.z) * n, this.w = e.w + (t.w - e.w) * n, this;
	}
	equals(e) {
		return e.x === this.x && e.y === this.y && e.z === this.z && e.w === this.w;
	}
	fromArray(e, t = 0) {
		return this.x = e[t], this.y = e[t + 1], this.z = e[t + 2], this.w = e[t + 3], this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this.x, e[t + 1] = this.y, e[t + 2] = this.z, e[t + 3] = this.w, e;
	}
	fromBufferAttribute(e, t) {
		return this.x = e.getX(t), this.y = e.getY(t), this.z = e.getZ(t), this.w = e.getW(t), this;
	}
	random() {
		return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this.w = Math.random(), this;
	}
	*[Symbol.iterator]() {
		yield this.x, yield this.y, yield this.z, yield this.w;
	}
}, Wt = class extends Ze {
	constructor(e = 1, t = 1, n = {}) {
		super(), n = Object.assign({
			generateMipmaps: !1,
			internalFormat: null,
			minFilter: c,
			depthBuffer: !0,
			stencilBuffer: !1,
			resolveColorBuffer: !0,
			resolveDepthBuffer: !0,
			resolveStencilBuffer: !0,
			storeMultisampledColorBuffer: !0,
			storeMultisampledDepthBuffer: !0,
			storeMultisampledStencilBuffer: !0,
			depthTexture: null,
			samples: 0,
			count: 1,
			depth: 1,
			multiview: !1,
			useArrayDepthTexture: !1
		}, n), this.isRenderTarget = !0, this.width = e, this.height = t, this.depth = n.depth, this.scissor = new Ut(0, 0, e, t), this.scissorTest = !1, this.viewport = new Ut(0, 0, e, t), this.textures = [];
		let r = n.count;
		for (let i = 0; i < r; i++) this.textures[i] = new Ht({
			width: e,
			height: t,
			depth: n.depth
		}), this.textures[i].isRenderTargetTexture = !0, this.textures[i].renderTarget = this;
		this._setTextureOptions(n), this.depthBuffer = n.depthBuffer, this.stencilBuffer = n.stencilBuffer, this.resolveColorBuffer = n.resolveColorBuffer, this.resolveDepthBuffer = n.resolveDepthBuffer, this.resolveStencilBuffer = n.resolveStencilBuffer, this.storeMultisampledColorBuffer = n.storeMultisampledColorBuffer, this.storeMultisampledDepthBuffer = n.storeMultisampledDepthBuffer, this.storeMultisampledStencilBuffer = n.storeMultisampledStencilBuffer, this._depthTexture = null, this.depthTexture = n.depthTexture, this.samples = n.samples, this.multiview = n.multiview, this.useArrayDepthTexture = n.useArrayDepthTexture;
	}
	_setTextureOptions(e = {}) {
		let t = {
			minFilter: c,
			generateMipmaps: !1,
			flipY: !1,
			internalFormat: null
		};
		e.mapping !== void 0 && (t.mapping = e.mapping), e.wrapS !== void 0 && (t.wrapS = e.wrapS), e.wrapT !== void 0 && (t.wrapT = e.wrapT), e.wrapR !== void 0 && (t.wrapR = e.wrapR), e.magFilter !== void 0 && (t.magFilter = e.magFilter), e.minFilter !== void 0 && (t.minFilter = e.minFilter), e.format !== void 0 && (t.format = e.format), e.type !== void 0 && (t.type = e.type), e.anisotropy !== void 0 && (t.anisotropy = e.anisotropy), e.colorSpace !== void 0 && (t.colorSpace = e.colorSpace), e.flipY !== void 0 && (t.flipY = e.flipY), e.generateMipmaps !== void 0 && (t.generateMipmaps = e.generateMipmaps), e.mipmapsAutoUpdate !== void 0 && (t.mipmapsAutoUpdate = e.mipmapsAutoUpdate), e.internalFormat !== void 0 && (t.internalFormat = e.internalFormat);
		for (let e = 0; e < this.textures.length; e++) this.textures[e].setValues(t);
	}
	get texture() {
		return this.textures[0];
	}
	set texture(e) {
		this.textures[0] = e;
	}
	set depthTexture(e) {
		this._depthTexture !== null && this._depthTexture.renderTarget === this && (this._depthTexture.renderTarget = null), e !== null && e.renderTarget === null && (e.renderTarget = this), this._depthTexture = e;
	}
	get depthTexture() {
		return this._depthTexture;
	}
	setSize(e, t, n = 1) {
		if (this.width !== e || this.height !== t || this.depth !== n) {
			this.width = e, this.height = t, this.depth = n;
			for (let r = 0, i = this.textures.length; r < i; r++) this.textures[r].image.width = e, this.textures[r].image.height = t, this.textures[r].image.depth = n, this.textures[r].isData3DTexture !== !0 && (this.textures[r].isArrayTexture = this.textures[r].image.depth > 1);
			this.dispose();
		}
		this.viewport.set(0, 0, e, t), this.scissor.set(0, 0, e, t);
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		this.width = e.width, this.height = e.height, this.depth = e.depth, this.scissor.copy(e.scissor), this.scissorTest = e.scissorTest, this.viewport.copy(e.viewport), this.textures.length = 0;
		for (let t = 0, n = e.textures.length; t < n; t++) {
			this.textures[t] = e.textures[t].clone(), this.textures[t].isRenderTargetTexture = !0, this.textures[t].renderTarget = this;
			let n = Object.assign({}, e.textures[t].image);
			this.textures[t].source = new Rt(n);
		}
		if (this.depthBuffer = e.depthBuffer, this.stencilBuffer = e.stencilBuffer, this.resolveColorBuffer = e.resolveColorBuffer, this.resolveDepthBuffer = e.resolveDepthBuffer, this.resolveStencilBuffer = e.resolveStencilBuffer, this.storeMultisampledColorBuffer = e.storeMultisampledColorBuffer, this.storeMultisampledDepthBuffer = e.storeMultisampledDepthBuffer, this.storeMultisampledStencilBuffer = e.storeMultisampledStencilBuffer, e.depthTexture !== null) {
			if (e.depthTexture.renderTarget === e) {
				let t = e.depthTexture.clone();
				t.renderTarget = null, this.depthTexture = t;
			} else this.depthTexture = e.depthTexture;
		} else this.depthTexture = null;
		return this.samples = e.samples, this.multiview = e.multiview, this.useArrayDepthTexture = e.useArrayDepthTexture, this;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
}, Gt = class extends Wt {
	constructor(e = 1, t = 1, n = {}) {
		super(e, t, n), this.isWebGLRenderTarget = !0;
	}
}, Kt = class extends Ht {
	constructor(e = null, t = 1, n = 1, i = 1) {
		super(null), this.isDataArrayTexture = !0, this.image = {
			data: e,
			width: t,
			height: n,
			depth: i
		}, this.magFilter = a, this.minFilter = a, this.wrapR = r, this.generateMipmaps = !1, this.flipY = !1, this.unpackAlignment = 1, this.layerUpdates = /* @__PURE__ */ new Set();
	}
	copy(e) {
		return super.copy(e), this.wrapR = e.wrapR, this;
	}
	addLayerUpdate(e) {
		this.layerUpdates.add(e);
	}
	clearLayerUpdates() {
		this.layerUpdates.clear();
	}
}, qt = class extends Ht {
	constructor(e = null, t = 1, n = 1, i = 1) {
		super(null), this.isData3DTexture = !0, this.image = {
			data: e,
			width: t,
			height: n,
			depth: i
		}, this.magFilter = a, this.minFilter = a, this.wrapR = r, this.generateMipmaps = !1, this.flipY = !1, this.unpackAlignment = 1;
	}
	copy(e) {
		return super.copy(e), this.wrapR = e.wrapR, this;
	}
}, Jt = class e {
	static {
		this.prototype.isMatrix4 = !0;
	}
	constructor(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
		this.elements = [
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		], e !== void 0 && this.set(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h);
	}
	set(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
		let g = this.elements;
		return g[0] = e, g[4] = t, g[8] = n, g[12] = r, g[1] = i, g[5] = a, g[9] = o, g[13] = s, g[2] = c, g[6] = l, g[10] = u, g[14] = d, g[3] = f, g[7] = p, g[11] = m, g[15] = h, this;
	}
	identity() {
		return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
	}
	clone() {
		return new e().fromArray(this.elements);
	}
	copy(e) {
		let t = this.elements, n = e.elements;
		return t[0] = n[0], t[1] = n[1], t[2] = n[2], t[3] = n[3], t[4] = n[4], t[5] = n[5], t[6] = n[6], t[7] = n[7], t[8] = n[8], t[9] = n[9], t[10] = n[10], t[11] = n[11], t[12] = n[12], t[13] = n[13], t[14] = n[14], t[15] = n[15], this;
	}
	copyPosition(e) {
		let t = this.elements, n = e.elements;
		return t[12] = n[12], t[13] = n[13], t[14] = n[14], this;
	}
	setFromMatrix3(e) {
		let t = e.elements;
		return this.set(t[0], t[3], t[6], 0, t[1], t[4], t[7], 0, t[2], t[5], t[8], 0, 0, 0, 0, 1), this;
	}
	extractBasis(e, t, n) {
		return this.determinantAffine() === 0 ? (e.set(1, 0, 0), t.set(0, 1, 0), n.set(0, 0, 1), this) : (e.setFromMatrixColumn(this, 0), t.setFromMatrixColumn(this, 1), n.setFromMatrixColumn(this, 2), this);
	}
	makeBasis(e, t, n) {
		return this.set(e.x, t.x, n.x, 0, e.y, t.y, n.y, 0, e.z, t.z, n.z, 0, 0, 0, 0, 1), this;
	}
	extractRotation(e) {
		if (e.determinantAffine() === 0) return this.identity();
		let t = this.elements, n = e.elements, r = 1 / Yt.setFromMatrixColumn(e, 0).length(), i = 1 / Yt.setFromMatrixColumn(e, 1).length(), a = 1 / Yt.setFromMatrixColumn(e, 2).length();
		return t[0] = n[0] * r, t[1] = n[1] * r, t[2] = n[2] * r, t[3] = 0, t[4] = n[4] * i, t[5] = n[5] * i, t[6] = n[6] * i, t[7] = 0, t[8] = n[8] * a, t[9] = n[9] * a, t[10] = n[10] * a, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, this;
	}
	makeRotationFromEuler(e) {
		let t = this.elements, n = e.x, r = e.y, i = e.z, a = Math.cos(n), o = Math.sin(n), s = Math.cos(r), c = Math.sin(r), l = Math.cos(i), u = Math.sin(i);
		if (e.order === "XYZ") {
			let e = a * l, n = a * u, r = o * l, i = o * u;
			t[0] = s * l, t[4] = -s * u, t[8] = c, t[1] = n + r * c, t[5] = e - i * c, t[9] = -o * s, t[2] = i - e * c, t[6] = r + n * c, t[10] = a * s;
		} else if (e.order === "YXZ") {
			let e = s * l, n = s * u, r = c * l, i = c * u;
			t[0] = e + i * o, t[4] = r * o - n, t[8] = a * c, t[1] = a * u, t[5] = a * l, t[9] = -o, t[2] = n * o - r, t[6] = i + e * o, t[10] = a * s;
		} else if (e.order === "ZXY") {
			let e = s * l, n = s * u, r = c * l, i = c * u;
			t[0] = e - i * o, t[4] = -a * u, t[8] = r + n * o, t[1] = n + r * o, t[5] = a * l, t[9] = i - e * o, t[2] = -a * c, t[6] = o, t[10] = a * s;
		} else if (e.order === "ZYX") {
			let e = a * l, n = a * u, r = o * l, i = o * u;
			t[0] = s * l, t[4] = r * c - n, t[8] = e * c + i, t[1] = s * u, t[5] = i * c + e, t[9] = n * c - r, t[2] = -c, t[6] = o * s, t[10] = a * s;
		} else if (e.order === "YZX") {
			let e = a * s, n = a * c, r = o * s, i = o * c;
			t[0] = s * l, t[4] = i - e * u, t[8] = r * u + n, t[1] = u, t[5] = a * l, t[9] = -o * l, t[2] = -c * l, t[6] = n * u + r, t[10] = e - i * u;
		} else if (e.order === "XZY") {
			let e = a * s, n = a * c, r = o * s, i = o * c;
			t[0] = s * l, t[4] = -u, t[8] = c * l, t[1] = e * u + i, t[5] = a * l, t[9] = n * u - r, t[2] = r * u - n, t[6] = o * l, t[10] = i * u + e;
		}
		return t[3] = 0, t[7] = 0, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, this;
	}
	makeRotationFromQuaternion(e) {
		return this.compose(Zt, e, Qt);
	}
	lookAt(e, t, n) {
		let r = this.elements;
		return tn.subVectors(e, t), tn.lengthSq() === 0 && (tn.z = 1), tn.normalize(), $t.crossVectors(n, tn), $t.lengthSq() === 0 && (Math.abs(n.z) === 1 ? tn.x += 1e-4 : tn.z += 1e-4, tn.normalize(), $t.crossVectors(n, tn)), $t.normalize(), en.crossVectors(tn, $t), r[0] = $t.x, r[4] = en.x, r[8] = tn.x, r[1] = $t.y, r[5] = en.y, r[9] = tn.y, r[2] = $t.z, r[6] = en.z, r[10] = tn.z, this;
	}
	multiply(e) {
		return this.multiplyMatrices(this, e);
	}
	premultiply(e) {
		return this.multiplyMatrices(e, this);
	}
	multiplyMatrices(e, t) {
		let n = e.elements, r = t.elements, i = this.elements, a = n[0], o = n[4], s = n[8], c = n[12], l = n[1], u = n[5], d = n[9], f = n[13], p = n[2], m = n[6], h = n[10], g = n[14], _ = n[3], v = n[7], y = n[11], b = n[15], x = r[0], S = r[4], C = r[8], w = r[12], T = r[1], E = r[5], D = r[9], O = r[13], k = r[2], A = r[6], j = r[10], M = r[14], N = r[3], P = r[7], F = r[11], I = r[15];
		return i[0] = a * x + o * T + s * k + c * N, i[4] = a * S + o * E + s * A + c * P, i[8] = a * C + o * D + s * j + c * F, i[12] = a * w + o * O + s * M + c * I, i[1] = l * x + u * T + d * k + f * N, i[5] = l * S + u * E + d * A + f * P, i[9] = l * C + u * D + d * j + f * F, i[13] = l * w + u * O + d * M + f * I, i[2] = p * x + m * T + h * k + g * N, i[6] = p * S + m * E + h * A + g * P, i[10] = p * C + m * D + h * j + g * F, i[14] = p * w + m * O + h * M + g * I, i[3] = _ * x + v * T + y * k + b * N, i[7] = _ * S + v * E + y * A + b * P, i[11] = _ * C + v * D + y * j + b * F, i[15] = _ * w + v * O + y * M + b * I, this;
	}
	multiplyScalar(e) {
		let t = this.elements;
		return t[0] *= e, t[4] *= e, t[8] *= e, t[12] *= e, t[1] *= e, t[5] *= e, t[9] *= e, t[13] *= e, t[2] *= e, t[6] *= e, t[10] *= e, t[14] *= e, t[3] *= e, t[7] *= e, t[11] *= e, t[15] *= e, this;
	}
	determinant() {
		let e = this.elements, t = e[0], n = e[4], r = e[8], i = e[12], a = e[1], o = e[5], s = e[9], c = e[13], l = e[2], u = e[6], d = e[10], f = e[14], p = e[3], m = e[7], h = e[11], g = e[15], _ = s * f - c * d, v = o * f - c * u, y = o * d - s * u, b = a * f - c * l, x = a * d - s * l, S = a * u - o * l;
		return t * (m * _ - h * v + g * y) - n * (p * _ - h * b + g * x) + r * (p * v - m * b + g * S) - i * (p * y - m * x + h * S);
	}
	determinantAffine() {
		let e = this.elements, t = e[0], n = e[4], r = e[8], i = e[1], a = e[5], o = e[9], s = e[2], c = e[6], l = e[10];
		return t * (a * l - o * c) - n * (i * l - o * s) + r * (i * c - a * s);
	}
	transpose() {
		let e = this.elements, t;
		return t = e[1], e[1] = e[4], e[4] = t, t = e[2], e[2] = e[8], e[8] = t, t = e[6], e[6] = e[9], e[9] = t, t = e[3], e[3] = e[12], e[12] = t, t = e[7], e[7] = e[13], e[13] = t, t = e[11], e[11] = e[14], e[14] = t, this;
	}
	setPosition(e, t, n) {
		let r = this.elements;
		return e.isVector3 ? (r[12] = e.x, r[13] = e.y, r[14] = e.z) : (r[12] = e, r[13] = t, r[14] = n), this;
	}
	invert() {
		let e = this.elements, t = e[0], n = e[1], r = e[2], i = e[3], a = e[4], o = e[5], s = e[6], c = e[7], l = e[8], u = e[9], d = e[10], f = e[11], p = e[12], m = e[13], h = e[14], g = e[15], _ = t * o - n * a, v = t * s - r * a, y = t * c - i * a, b = n * s - r * o, x = n * c - i * o, S = r * c - i * s, C = l * m - u * p, w = l * h - d * p, T = l * g - f * p, E = u * h - d * m, D = u * g - f * m, O = d * g - f * h, k = _ * O - v * D + y * E + b * T - x * w + S * C;
		if (k === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
		let A = 1 / k;
		return e[0] = (o * O - s * D + c * E) * A, e[1] = (r * D - n * O - i * E) * A, e[2] = (m * S - h * x + g * b) * A, e[3] = (d * x - u * S - f * b) * A, e[4] = (s * T - a * O - c * w) * A, e[5] = (t * O - r * T + i * w) * A, e[6] = (h * y - p * S - g * v) * A, e[7] = (l * S - d * y + f * v) * A, e[8] = (a * D - o * T + c * C) * A, e[9] = (n * T - t * D - i * C) * A, e[10] = (p * x - m * y + g * _) * A, e[11] = (u * y - l * x - f * _) * A, e[12] = (o * w - a * E - s * C) * A, e[13] = (t * E - n * w + r * C) * A, e[14] = (m * v - p * b - h * _) * A, e[15] = (l * b - u * v + d * _) * A, this;
	}
	scale(e) {
		let t = this.elements, n = e.x, r = e.y, i = e.z;
		return t[0] *= n, t[4] *= r, t[8] *= i, t[1] *= n, t[5] *= r, t[9] *= i, t[2] *= n, t[6] *= r, t[10] *= i, t[3] *= n, t[7] *= r, t[11] *= i, this;
	}
	getMaxScaleOnAxis() {
		let e = this.elements, t = e[0] * e[0] + e[1] * e[1] + e[2] * e[2], n = e[4] * e[4] + e[5] * e[5] + e[6] * e[6], r = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];
		return Math.sqrt(Math.max(t, n, r));
	}
	makeTranslation(e, t, n) {
		return e.isVector3 ? this.set(1, 0, 0, e.x, 0, 1, 0, e.y, 0, 0, 1, e.z, 0, 0, 0, 1) : this.set(1, 0, 0, e, 0, 1, 0, t, 0, 0, 1, n, 0, 0, 0, 1), this;
	}
	makeRotationX(e) {
		let t = Math.cos(e), n = Math.sin(e);
		return this.set(1, 0, 0, 0, 0, t, -n, 0, 0, n, t, 0, 0, 0, 0, 1), this;
	}
	makeRotationY(e) {
		let t = Math.cos(e), n = Math.sin(e);
		return this.set(t, 0, n, 0, 0, 1, 0, 0, -n, 0, t, 0, 0, 0, 0, 1), this;
	}
	makeRotationZ(e) {
		let t = Math.cos(e), n = Math.sin(e);
		return this.set(t, -n, 0, 0, n, t, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
	}
	makeRotationAxis(e, t) {
		let n = Math.cos(t), r = Math.sin(t), i = 1 - n, a = e.x, o = e.y, s = e.z, c = i * a, l = i * o;
		return this.set(c * a + n, c * o - r * s, c * s + r * o, 0, c * o + r * s, l * o + n, l * s - r * a, 0, c * s - r * o, l * s + r * a, i * s * s + n, 0, 0, 0, 0, 1), this;
	}
	makeScale(e, t, n) {
		return this.set(e, 0, 0, 0, 0, t, 0, 0, 0, 0, n, 0, 0, 0, 0, 1), this;
	}
	makeShear(e, t, n, r, i, a) {
		return this.set(1, n, i, 0, e, 1, a, 0, t, r, 1, 0, 0, 0, 0, 1), this;
	}
	compose(e, t, n) {
		let r = this.elements, i = t._x, a = t._y, o = t._z, s = t._w, c = i + i, l = a + a, u = o + o, d = i * c, f = i * l, p = i * u, m = a * l, h = a * u, g = o * u, _ = s * c, v = s * l, y = s * u, b = n.x, x = n.y, S = n.z;
		return r[0] = (1 - (m + g)) * b, r[1] = (f + y) * b, r[2] = (p - v) * b, r[3] = 0, r[4] = (f - y) * x, r[5] = (1 - (d + g)) * x, r[6] = (h + _) * x, r[7] = 0, r[8] = (p + v) * S, r[9] = (h - _) * S, r[10] = (1 - (d + m)) * S, r[11] = 0, r[12] = e.x, r[13] = e.y, r[14] = e.z, r[15] = 1, this;
	}
	decompose(e, t, n) {
		let r = this.elements;
		e.x = r[12], e.y = r[13], e.z = r[14];
		let i = this.determinantAffine();
		if (i === 0) return n.set(1, 1, 1), t.identity(), this;
		let a = Yt.set(r[0], r[1], r[2]).length(), o = Yt.set(r[4], r[5], r[6]).length(), s = Yt.set(r[8], r[9], r[10]).length();
		i < 0 && (a = -a), Xt.copy(this);
		let c = 1 / a, l = 1 / o, u = 1 / s;
		return Xt.elements[0] *= c, Xt.elements[1] *= c, Xt.elements[2] *= c, Xt.elements[4] *= l, Xt.elements[5] *= l, Xt.elements[6] *= l, Xt.elements[8] *= u, Xt.elements[9] *= u, Xt.elements[10] *= u, t.setFromRotationMatrix(Xt), n.x = a, n.y = o, n.z = s, this;
	}
	makePerspective(e, t, n, r, i, a, o = Be, s = !1) {
		let c = this.elements, l = 2 * i / (t - e), u = 2 * i / (n - r), d = (t + e) / (t - e), f = (n + r) / (n - r), p, m;
		if (s) p = i / (a - i), m = a * i / (a - i);
		else if (o === 2e3) p = -(a + i) / (a - i), m = -2 * a * i / (a - i);
		else if (o === 2001) p = -a / (a - i), m = -a * i / (a - i);
		else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: " + o);
		return c[0] = l, c[4] = 0, c[8] = d, c[12] = 0, c[1] = 0, c[5] = u, c[9] = f, c[13] = 0, c[2] = 0, c[6] = 0, c[10] = p, c[14] = m, c[3] = 0, c[7] = 0, c[11] = -1, c[15] = 0, this;
	}
	makeOrthographic(e, t, n, r, i, a, o = Be, s = !1) {
		let c = this.elements, l = 2 / (t - e), u = 2 / (n - r), d = -(t + e) / (t - e), f = -(n + r) / (n - r), p, m;
		if (s) p = 1 / (a - i), m = a / (a - i);
		else if (o === 2e3) p = -2 / (a - i), m = -(a + i) / (a - i);
		else if (o === 2001) p = -1 / (a - i), m = -i / (a - i);
		else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + o);
		return c[0] = l, c[4] = 0, c[8] = 0, c[12] = d, c[1] = 0, c[5] = u, c[9] = 0, c[13] = f, c[2] = 0, c[6] = 0, c[10] = p, c[14] = m, c[3] = 0, c[7] = 0, c[11] = 0, c[15] = 1, this;
	}
	equals(e) {
		let t = this.elements, n = e.elements;
		for (let e = 0; e < 16; e++) if (t[e] !== n[e]) return !1;
		return !0;
	}
	fromArray(e, t = 0) {
		for (let n = 0; n < 16; n++) this.elements[n] = e[n + t];
		return this;
	}
	toArray(e = [], t = 0) {
		let n = this.elements;
		return e[t] = n[0], e[t + 1] = n[1], e[t + 2] = n[2], e[t + 3] = n[3], e[t + 4] = n[4], e[t + 5] = n[5], e[t + 6] = n[6], e[t + 7] = n[7], e[t + 8] = n[8], e[t + 9] = n[9], e[t + 10] = n[10], e[t + 11] = n[11], e[t + 12] = n[12], e[t + 13] = n[13], e[t + 14] = n[14], e[t + 15] = n[15], e;
	}
}, Yt = /*@__PURE__*/ new Y(), Xt = /*@__PURE__*/ new Jt(), Zt = /*@__PURE__*/ new Y(0, 0, 0), Qt = /*@__PURE__*/ new Y(1, 1, 1), $t = /*@__PURE__*/ new Y(), en = /*@__PURE__*/ new Y(), tn = /*@__PURE__*/ new Y(), nn = /*@__PURE__*/ new Jt(), rn = /*@__PURE__*/ new Tt(), an = class e {
	constructor(t = 0, n = 0, r = 0, i = e.DEFAULT_ORDER) {
		this.isEuler = !0, this._x = t, this._y = n, this._z = r, this._order = i;
	}
	get x() {
		return this._x;
	}
	set x(e) {
		this._x = e, this._onChangeCallback();
	}
	get y() {
		return this._y;
	}
	set y(e) {
		this._y = e, this._onChangeCallback();
	}
	get z() {
		return this._z;
	}
	set z(e) {
		this._z = e, this._onChangeCallback();
	}
	get order() {
		return this._order;
	}
	set order(e) {
		this._order = e, this._onChangeCallback();
	}
	set(e, t, n, r = this._order) {
		return this._x = e, this._y = t, this._z = n, this._order = r, this._onChangeCallback(), this;
	}
	clone() {
		return new this.constructor(this._x, this._y, this._z, this._order);
	}
	copy(e) {
		return this._x = e._x, this._y = e._y, this._z = e._z, this._order = e._order, this._onChangeCallback(), this;
	}
	setFromRotationMatrix(e, t = this._order, n = !0) {
		let r = e.elements, i = r[0], a = r[4], o = r[8], s = r[1], c = r[5], l = r[9], u = r[2], d = r[6], f = r[10];
		switch (t) {
			case "XYZ":
				this._y = Math.asin(q(o, -1, 1)), Math.abs(o) < .9999999 ? (this._x = Math.atan2(-l, f), this._z = Math.atan2(-a, i)) : (this._x = Math.atan2(d, c), this._z = 0);
				break;
			case "YXZ":
				this._x = Math.asin(-q(l, -1, 1)), Math.abs(l) < .9999999 ? (this._y = Math.atan2(o, f), this._z = Math.atan2(s, c)) : (this._y = Math.atan2(-u, i), this._z = 0);
				break;
			case "ZXY":
				this._x = Math.asin(q(d, -1, 1)), Math.abs(d) < .9999999 ? (this._y = Math.atan2(-u, f), this._z = Math.atan2(-a, c)) : (this._y = 0, this._z = Math.atan2(s, i));
				break;
			case "ZYX":
				this._y = Math.asin(-q(u, -1, 1)), Math.abs(u) < .9999999 ? (this._x = Math.atan2(d, f), this._z = Math.atan2(s, i)) : (this._x = 0, this._z = Math.atan2(-a, c));
				break;
			case "YZX":
				this._z = Math.asin(q(s, -1, 1)), Math.abs(s) < .9999999 ? (this._x = Math.atan2(-l, c), this._y = Math.atan2(-u, i)) : (this._x = 0, this._y = Math.atan2(o, f));
				break;
			case "XZY":
				this._z = Math.asin(-q(a, -1, 1)), Math.abs(a) < .9999999 ? (this._x = Math.atan2(d, c), this._y = Math.atan2(o, i)) : (this._x = Math.atan2(-l, f), this._y = 0);
				break;
			default: G("Euler: .setFromRotationMatrix() encountered an unknown order: " + t);
		}
		return this._order = t, n === !0 && this._onChangeCallback(), this;
	}
	setFromQuaternion(e, t, n) {
		return nn.makeRotationFromQuaternion(e), this.setFromRotationMatrix(nn, t, n);
	}
	setFromVector3(e, t = this._order) {
		return this.set(e.x, e.y, e.z, t);
	}
	reorder(e) {
		return rn.setFromEuler(this), this.setFromQuaternion(rn, e);
	}
	equals(e) {
		return e._x === this._x && e._y === this._y && e._z === this._z && e._order === this._order;
	}
	fromArray(e) {
		return this._x = e[0], this._y = e[1], this._z = e[2], e[3] !== void 0 && (this._order = e[3]), this._onChangeCallback(), this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this._x, e[t + 1] = this._y, e[t + 2] = this._z, e[t + 3] = this._order, e;
	}
	_onChange(e) {
		return this._onChangeCallback = e, this;
	}
	_onChangeCallback() {}
	*[Symbol.iterator]() {
		yield this._x, yield this._y, yield this._z, yield this._order;
	}
};
an.DEFAULT_ORDER = "XYZ";
var on = class {
	constructor() {
		this.mask = 1;
	}
	set(e) {
		this.mask = 1 << e >>> 0;
	}
	enable(e) {
		this.mask |= 1 << e;
	}
	enableAll() {
		this.mask = -1;
	}
	toggle(e) {
		this.mask ^= 1 << e;
	}
	disable(e) {
		this.mask &= ~(1 << e);
	}
	disableAll() {
		this.mask = 0;
	}
	test(e) {
		return (this.mask & e.mask) !== 0;
	}
	isEnabled(e) {
		return !!(this.mask & 1 << e);
	}
}, sn = 0, cn = /*@__PURE__*/ new Y(), ln = /*@__PURE__*/ new Tt(), un = /*@__PURE__*/ new Jt(), dn = /*@__PURE__*/ new Y(), fn = /*@__PURE__*/ new Y(), pn = /*@__PURE__*/ new Y(), mn = /*@__PURE__*/ new Tt(), hn = /*@__PURE__*/ new Y(1, 0, 0), gn = /*@__PURE__*/ new Y(0, 1, 0), _n = /*@__PURE__*/ new Y(0, 0, 1), vn = { type: "added" }, yn = { type: "removed" }, bn = {
	type: "childadded",
	child: null
}, xn = {
	type: "childremoved",
	child: null
}, Sn = class e extends Ze {
	constructor() {
		super(), this.isObject3D = !0, Object.defineProperty(this, "id", { value: sn++ }), this.uuid = nt(), this.name = "", this.type = "Object3D", this.parent = null, this.children = [], this.up = e.DEFAULT_UP.clone();
		let t = new Y(), n = new an(), r = new Tt(), i = new Y(1, 1, 1);
		function a() {
			r.setFromEuler(n, !1);
		}
		function o() {
			n.setFromQuaternion(r, void 0, !1);
		}
		n._onChange(a), r._onChange(o), Object.defineProperties(this, {
			position: {
				configurable: !0,
				enumerable: !0,
				value: t
			},
			rotation: {
				configurable: !0,
				enumerable: !0,
				value: n
			},
			quaternion: {
				configurable: !0,
				enumerable: !0,
				value: r
			},
			scale: {
				configurable: !0,
				enumerable: !0,
				value: i
			},
			modelViewMatrix: { value: new Jt() },
			normalMatrix: { value: new X() }
		}), this.matrix = new Jt(), this.matrixWorld = new Jt(), this.matrixAutoUpdate = e.DEFAULT_MATRIX_AUTO_UPDATE, this.matrixWorldAutoUpdate = e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE, this.matrixWorldNeedsUpdate = !1, this.layers = new on(), this.visible = !0, this.castShadow = !1, this.receiveShadow = !1, this.frustumCulled = !0, this.renderOrder = 0, this.animations = [], this.customDepthMaterial = void 0, this.customDistanceMaterial = void 0, this.static = !1, this.userData = {}, this.pivot = null;
	}
	onBeforeShadow() {}
	onAfterShadow() {}
	onBeforeRender() {}
	onAfterRender() {}
	applyMatrix4(e) {
		this.matrixAutoUpdate && this.updateMatrix(), this.matrix.premultiply(e), this.matrix.decompose(this.position, this.quaternion, this.scale), this.pivot !== null && this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot);
	}
	applyQuaternion(e) {
		return this.quaternion.premultiply(e), this;
	}
	setRotationFromAxisAngle(e, t) {
		this.quaternion.setFromAxisAngle(e, t);
	}
	setRotationFromEuler(e) {
		this.quaternion.setFromEuler(e, !0);
	}
	setRotationFromMatrix(e) {
		this.quaternion.setFromRotationMatrix(e);
	}
	setRotationFromQuaternion(e) {
		this.quaternion.copy(e);
	}
	rotateOnAxis(e, t) {
		return ln.setFromAxisAngle(e, t), this.quaternion.multiply(ln), this;
	}
	rotateOnWorldAxis(e, t) {
		return ln.setFromAxisAngle(e, t), this.quaternion.premultiply(ln), this;
	}
	rotateX(e) {
		return this.rotateOnAxis(hn, e);
	}
	rotateY(e) {
		return this.rotateOnAxis(gn, e);
	}
	rotateZ(e) {
		return this.rotateOnAxis(_n, e);
	}
	translateOnAxis(e, t) {
		return cn.copy(e).applyQuaternion(this.quaternion), this.position.add(cn.multiplyScalar(t)), this;
	}
	translateX(e) {
		return this.translateOnAxis(hn, e);
	}
	translateY(e) {
		return this.translateOnAxis(gn, e);
	}
	translateZ(e) {
		return this.translateOnAxis(_n, e);
	}
	localToWorld(e) {
		return this.updateWorldMatrix(!0, !1), e.applyMatrix4(this.matrixWorld);
	}
	worldToLocal(e) {
		return this.updateWorldMatrix(!0, !1), e.applyMatrix4(un.copy(this.matrixWorld).invert());
	}
	lookAt(e, t, n) {
		e.isVector3 ? dn.copy(e) : dn.set(e, t, n);
		let r = this.parent;
		this.updateWorldMatrix(!0, !1), fn.setFromMatrixPosition(this.matrixWorld), this.isCamera || this.isLight ? un.lookAt(fn, dn, this.up) : un.lookAt(dn, fn, this.up), this.quaternion.setFromRotationMatrix(un), r && (un.extractRotation(r.matrixWorld), ln.setFromRotationMatrix(un), this.quaternion.premultiply(ln.invert()));
	}
	add(e) {
		if (arguments.length > 1) {
			for (let e = 0; e < arguments.length; e++) this.add(arguments[e]);
			return this;
		}
		return e === this ? (K("Object3D.add: object can't be added as a child of itself.", e), this) : (e && e.isObject3D ? (e.removeFromParent(), e.parent = this, this.children.push(e), e.dispatchEvent(vn), bn.child = e, this.dispatchEvent(bn), bn.child = null) : K("Object3D.add: object not an instance of THREE.Object3D.", e), this);
	}
	remove(e) {
		if (arguments.length > 1) {
			for (let e = 0; e < arguments.length; e++) this.remove(arguments[e]);
			return this;
		}
		let t = this.children.indexOf(e);
		return t !== -1 && (e.parent = null, this.children.splice(t, 1), e.dispatchEvent(yn), xn.child = e, this.dispatchEvent(xn), xn.child = null), this;
	}
	removeFromParent() {
		let e = this.parent;
		return e !== null && e.remove(this), this;
	}
	clear() {
		return this.remove(...this.children);
	}
	attach(e) {
		return this.updateWorldMatrix(!0, !1), un.copy(this.matrixWorld).invert(), e.parent !== null && (e.parent.updateWorldMatrix(!0, !1), un.multiply(e.parent.matrixWorld)), e.applyMatrix4(un), e.removeFromParent(), e.parent = this, this.children.push(e), e.updateWorldMatrix(!1, !0), e.dispatchEvent(vn), bn.child = e, this.dispatchEvent(bn), bn.child = null, this;
	}
	getObjectById(e) {
		return this.getObjectByProperty("id", e);
	}
	getObjectByName(e) {
		return this.getObjectByProperty("name", e);
	}
	getObjectByProperty(e, t) {
		if (this[e] === t) return this;
		for (let n = 0, r = this.children.length; n < r; n++) {
			let r = this.children[n].getObjectByProperty(e, t);
			if (r !== void 0) return r;
		}
	}
	getObjectsByProperty(e, t, n = []) {
		this[e] === t && n.push(this);
		let r = this.children;
		for (let i = 0, a = r.length; i < a; i++) r[i].getObjectsByProperty(e, t, n);
		return n;
	}
	getWorldPosition(e) {
		return this.updateWorldMatrix(!0, !1), e.setFromMatrixPosition(this.matrixWorld);
	}
	getWorldQuaternion(e) {
		return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(fn, e, pn), e;
	}
	getWorldScale(e) {
		return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(fn, mn, e), e;
	}
	getWorldDirection(e) {
		this.updateWorldMatrix(!0, !1);
		let t = this.matrixWorld.elements;
		return e.set(t[8], t[9], t[10]).normalize();
	}
	raycast() {}
	intersectsFrustum() {
		return !0;
	}
	traverse(e) {
		e(this);
		let t = this.children;
		for (let n = 0, r = t.length; n < r; n++) t[n].traverse(e);
	}
	traverseVisible(e) {
		if (this.visible === !1) return;
		e(this);
		let t = this.children;
		for (let n = 0, r = t.length; n < r; n++) t[n].traverseVisible(e);
	}
	traverseAncestors(e) {
		let t = this.parent;
		t !== null && (e(t), t.traverseAncestors(e));
	}
	updateMatrix() {
		this.matrix.compose(this.position, this.quaternion, this.scale);
		let e = this.pivot;
		if (e !== null) {
			let t = e.x, n = e.y, r = e.z, i = this.matrix.elements;
			i[12] += t - i[0] * t - i[4] * n - i[8] * r, i[13] += n - i[1] * t - i[5] * n - i[9] * r, i[14] += r - i[2] * t - i[6] * n - i[10] * r;
		}
		this.matrixWorldNeedsUpdate = !0;
	}
	updateMatrixWorld(e) {
		this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || e) && (this.matrixWorldAutoUpdate === !0 && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), this.matrixWorldNeedsUpdate = !1, e = !0);
		let t = this.children;
		for (let n = 0, r = t.length; n < r; n++) t[n].updateMatrixWorld(e);
	}
	updateWorldMatrix(e, t, n = !1) {
		let r = this.parent;
		if (e === !0 && r !== null && r.updateWorldMatrix(!0, !1), this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || n) && (this.matrixWorldAutoUpdate === !0 && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), this.matrixWorldNeedsUpdate = !1, n = !0), t === !0) {
			let e = this.children;
			for (let t = 0, r = e.length; t < r; t++) e[t].updateWorldMatrix(!1, !0, n);
		}
	}
	toJSON(e) {
		let t = e === void 0 || typeof e == "string", n = {};
		t && (e = {
			geometries: {},
			materials: {},
			textures: {},
			images: {},
			shapes: {},
			skeletons: {},
			animations: {},
			nodes: {}
		}, n.metadata = {
			version: 4.7,
			type: "Object",
			generator: "Object3D.toJSON"
		});
		let r = {};
		r.uuid = this.uuid, r.type = this.type, r.name = this.name, r.castShadow = this.castShadow, r.receiveShadow = this.receiveShadow, r.visible = this.visible, r.frustumCulled = this.frustumCulled, r.renderOrder = this.renderOrder, r.static = this.static, r.matrixAutoUpdate = this.matrixAutoUpdate, Object.keys(this.userData).length > 0 && (r.userData = this.userData), r.layers = this.layers.mask, r.matrix = this.matrix.toArray(), r.up = this.up.toArray(), this.pivot !== null && (r.pivot = this.pivot.toArray()), this.morphTargetDictionary !== void 0 && (r.morphTargetDictionary = Object.assign({}, this.morphTargetDictionary)), this.morphTargetInfluences !== void 0 && (r.morphTargetInfluences = this.morphTargetInfluences.slice()), this.isInstancedMesh && (r.type = "InstancedMesh", r.count = this.count, r.instanceMatrix = this.instanceMatrix.toJSON(), this.instanceColor !== null && (r.instanceColor = this.instanceColor.toJSON())), this.isBatchedMesh && (r.type = "BatchedMesh", r.perObjectFrustumCulled = this.perObjectFrustumCulled, r.sortObjects = this.sortObjects, r.drawRanges = this._drawRanges, r.reservedRanges = this._reservedRanges, r.geometryInfo = this._geometryInfo.map((e) => ({
			...e,
			boundingBox: e.boundingBox ? e.boundingBox.toJSON() : void 0,
			boundingSphere: e.boundingSphere ? e.boundingSphere.toJSON() : void 0
		})), r.instanceInfo = this._instanceInfo.map((e) => ({ ...e })), r.availableInstanceIds = this._availableInstanceIds.slice(), r.availableGeometryIds = this._availableGeometryIds.slice(), r.nextIndexStart = this._nextIndexStart, r.nextVertexStart = this._nextVertexStart, r.geometryCount = this._geometryCount, r.maxInstanceCount = this._maxInstanceCount, r.maxVertexCount = this._maxVertexCount, r.maxIndexCount = this._maxIndexCount, r.geometryInitialized = this._geometryInitialized, r.matricesTexture = this._matricesTexture.toJSON(e), r.indirectTexture = this._indirectTexture.toJSON(e), this._colorsTexture !== null && (r.colorsTexture = this._colorsTexture.toJSON(e)), this.boundingSphere !== null && (r.boundingSphere = this.boundingSphere.toJSON()), this.boundingBox !== null && (r.boundingBox = this.boundingBox.toJSON()));
		function i(t, n) {
			return t[n.uuid] === void 0 && (t[n.uuid] = n.toJSON(e)), n.uuid;
		}
		if (this.isScene) this.background && (this.background.isColor ? r.background = this.background.toJSON() : this.background.isTexture && (r.background = this.background.toJSON(e).uuid)), this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== !0 && (r.environment = this.environment.toJSON(e).uuid);
		else if (this.isMesh || this.isLine || this.isPoints) {
			r.geometry = i(e.geometries, this.geometry);
			let t = this.geometry.parameters;
			if (t !== void 0 && t.shapes !== void 0) {
				let n = t.shapes;
				if (Array.isArray(n)) for (let t = 0, r = n.length; t < r; t++) {
					let r = n[t];
					i(e.shapes, r);
				}
				else i(e.shapes, n);
			}
		}
		if (this.isSkinnedMesh && (r.bindMode = this.bindMode, r.bindMatrix = this.bindMatrix.toArray(), this.skeleton !== void 0 && (i(e.skeletons, this.skeleton), r.skeleton = this.skeleton.uuid)), this.material !== void 0) {
			if (Array.isArray(this.material)) {
				let t = [];
				for (let n = 0, r = this.material.length; n < r; n++) t.push(i(e.materials, this.material[n]));
				r.material = t;
			} else r.material = i(e.materials, this.material);
		}
		if (this.children.length > 0) {
			r.children = [];
			for (let t = 0; t < this.children.length; t++) r.children.push(this.children[t].toJSON(e).object);
		}
		if (this.animations.length > 0) {
			r.animations = [];
			for (let t = 0; t < this.animations.length; t++) {
				let n = this.animations[t];
				r.animations.push(i(e.animations, n));
			}
		}
		if (t) {
			let t = a(e.geometries), r = a(e.materials), i = a(e.textures), o = a(e.images), s = a(e.shapes), c = a(e.skeletons), l = a(e.animations), u = a(e.nodes);
			t.length > 0 && (n.geometries = t), r.length > 0 && (n.materials = r), i.length > 0 && (n.textures = i), o.length > 0 && (n.images = o), s.length > 0 && (n.shapes = s), c.length > 0 && (n.skeletons = c), l.length > 0 && (n.animations = l), u.length > 0 && (n.nodes = u);
		}
		return n.object = r, n;
		function a(e) {
			let t = [];
			for (let n in e) {
				let r = e[n];
				delete r.metadata, t.push(r);
			}
			return t;
		}
	}
	clone(e) {
		return new this.constructor().copy(this, e);
	}
	copy(e, t = !0) {
		if (this.name = e.name, this.up.copy(e.up), this.position.copy(e.position), this.rotation.order = e.rotation.order, this.quaternion.copy(e.quaternion), this.scale.copy(e.scale), this.pivot = e.pivot === null ? null : e.pivot.clone(), this.matrix.copy(e.matrix), this.matrixWorld.copy(e.matrixWorld), this.matrixAutoUpdate = e.matrixAutoUpdate, this.matrixWorldAutoUpdate = e.matrixWorldAutoUpdate, this.matrixWorldNeedsUpdate = e.matrixWorldNeedsUpdate, this.layers.mask = e.layers.mask, this.visible = e.visible, this.castShadow = e.castShadow, this.receiveShadow = e.receiveShadow, this.frustumCulled = e.frustumCulled, this.renderOrder = e.renderOrder, this.static = e.static, this.animations = e.animations.slice(), this.userData = JSON.parse(JSON.stringify(e.userData)), t === !0) for (let t = 0; t < e.children.length; t++) {
			let n = e.children[t];
			this.add(n.clone());
		}
		return this;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
};
Sn.DEFAULT_UP = /*@__PURE__*/ new Y(0, 1, 0), Sn.DEFAULT_MATRIX_AUTO_UPDATE = !0, Sn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0;
var Cn = class extends Sn {
	constructor() {
		super(), this.isGroup = !0, this.type = "Group";
	}
}, wn = { type: "move" }, Tn = class {
	constructor() {
		this._targetRay = null, this._grip = null, this._hand = null;
	}
	getHandSpace() {
		return this._hand === null && (this._hand = new Cn(), this._hand.matrixAutoUpdate = !1, this._hand.visible = !1, this._hand.joints = {}, this._hand.inputState = { pinching: !1 }), this._hand;
	}
	getTargetRaySpace() {
		return this._targetRay === null && (this._targetRay = new Cn(), this._targetRay.matrixAutoUpdate = !1, this._targetRay.visible = !1, this._targetRay.hasLinearVelocity = !1, this._targetRay.linearVelocity = new Y(), this._targetRay.hasAngularVelocity = !1, this._targetRay.angularVelocity = new Y()), this._targetRay;
	}
	getGripSpace() {
		return this._grip === null && (this._grip = new Cn(), this._grip.matrixAutoUpdate = !1, this._grip.visible = !1, this._grip.hasLinearVelocity = !1, this._grip.linearVelocity = new Y(), this._grip.hasAngularVelocity = !1, this._grip.angularVelocity = new Y(), this._grip.eventsEnabled = !1), this._grip;
	}
	dispatchEvent(e) {
		return this._targetRay !== null && this._targetRay.dispatchEvent(e), this._grip !== null && this._grip.dispatchEvent(e), this._hand !== null && this._hand.dispatchEvent(e), this;
	}
	connect(e) {
		if (e && e.hand) {
			let t = this._hand;
			if (t) for (let n of e.hand.values()) this._getHandJoint(t, n);
		}
		return this.dispatchEvent({
			type: "connected",
			data: e
		}), this;
	}
	disconnect(e) {
		return this.dispatchEvent({
			type: "disconnected",
			data: e
		}), this._targetRay !== null && (this._targetRay.visible = !1), this._grip !== null && (this._grip.visible = !1), this._hand !== null && (this._hand.visible = !1), this;
	}
	update(e, t, n) {
		let r = null, i = null, a = null, o = this._targetRay, s = this._grip, c = this._hand;
		if (e && t.session.visibilityState !== "visible-blurred") {
			if (c && e.hand) {
				a = !0;
				for (let r of e.hand.values()) {
					let e = t.getJointPose(r, n), i = this._getHandJoint(c, r);
					e !== null && (i.matrix.fromArray(e.transform.matrix), i.matrix.decompose(i.position, i.quaternion, i.scale), i.matrixWorldNeedsUpdate = !0, i.jointRadius = e.radius), i.visible = e !== null;
				}
				let r = c.joints["index-finger-tip"], i = c.joints["thumb-tip"], o = r.position.distanceTo(i.position);
				c.inputState.pinching && o > .025 ? (c.inputState.pinching = !1, this.dispatchEvent({
					type: "pinchend",
					handedness: e.handedness,
					target: this
				})) : !c.inputState.pinching && o <= .015 && (c.inputState.pinching = !0, this.dispatchEvent({
					type: "pinchstart",
					handedness: e.handedness,
					target: this
				}));
			} else s !== null && e.gripSpace && (i = t.getPose(e.gripSpace, n), i !== null && (s.matrix.fromArray(i.transform.matrix), s.matrix.decompose(s.position, s.quaternion, s.scale), s.matrixWorldNeedsUpdate = !0, i.linearVelocity ? (s.hasLinearVelocity = !0, s.linearVelocity.copy(i.linearVelocity)) : s.hasLinearVelocity = !1, i.angularVelocity ? (s.hasAngularVelocity = !0, s.angularVelocity.copy(i.angularVelocity)) : s.hasAngularVelocity = !1, s.eventsEnabled && s.dispatchEvent({
				type: "gripUpdated",
				data: e,
				target: this
			})));
			o !== null && (r = t.getPose(e.targetRaySpace, n), r === null && i !== null && (r = i), r !== null && (o.matrix.fromArray(r.transform.matrix), o.matrix.decompose(o.position, o.quaternion, o.scale), o.matrixWorldNeedsUpdate = !0, r.linearVelocity ? (o.hasLinearVelocity = !0, o.linearVelocity.copy(r.linearVelocity)) : o.hasLinearVelocity = !1, r.angularVelocity ? (o.hasAngularVelocity = !0, o.angularVelocity.copy(r.angularVelocity)) : o.hasAngularVelocity = !1, this.dispatchEvent(wn)));
		}
		return o !== null && (o.visible = r !== null), s !== null && (s.visible = i !== null), c !== null && (c.visible = a !== null), this;
	}
	_getHandJoint(e, t) {
		if (e.joints[t.jointName] === void 0) {
			let n = new Cn();
			n.matrixAutoUpdate = !1, n.visible = !1, e.joints[t.jointName] = n, e.add(n);
		}
		return e.joints[t.jointName];
	}
}, En = {
	aliceblue: 15792383,
	antiquewhite: 16444375,
	aqua: 65535,
	aquamarine: 8388564,
	azure: 15794175,
	beige: 16119260,
	bisque: 16770244,
	black: 0,
	blanchedalmond: 16772045,
	blue: 255,
	blueviolet: 9055202,
	brown: 10824234,
	burlywood: 14596231,
	cadetblue: 6266528,
	chartreuse: 8388352,
	chocolate: 13789470,
	coral: 16744272,
	cornflowerblue: 6591981,
	cornsilk: 16775388,
	crimson: 14423100,
	cyan: 65535,
	darkblue: 139,
	darkcyan: 35723,
	darkgoldenrod: 12092939,
	darkgray: 11119017,
	darkgreen: 25600,
	darkgrey: 11119017,
	darkkhaki: 12433259,
	darkmagenta: 9109643,
	darkolivegreen: 5597999,
	darkorange: 16747520,
	darkorchid: 10040012,
	darkred: 9109504,
	darksalmon: 15308410,
	darkseagreen: 9419919,
	darkslateblue: 4734347,
	darkslategray: 3100495,
	darkslategrey: 3100495,
	darkturquoise: 52945,
	darkviolet: 9699539,
	deeppink: 16716947,
	deepskyblue: 49151,
	dimgray: 6908265,
	dimgrey: 6908265,
	dodgerblue: 2003199,
	firebrick: 11674146,
	floralwhite: 16775920,
	forestgreen: 2263842,
	fuchsia: 16711935,
	gainsboro: 14474460,
	ghostwhite: 16316671,
	gold: 16766720,
	goldenrod: 14329120,
	gray: 8421504,
	green: 32768,
	greenyellow: 11403055,
	grey: 8421504,
	honeydew: 15794160,
	hotpink: 16738740,
	indianred: 13458524,
	indigo: 4915330,
	ivory: 16777200,
	khaki: 15787660,
	lavender: 15132410,
	lavenderblush: 16773365,
	lawngreen: 8190976,
	lemonchiffon: 16775885,
	lightblue: 11393254,
	lightcoral: 15761536,
	lightcyan: 14745599,
	lightgoldenrodyellow: 16448210,
	lightgray: 13882323,
	lightgreen: 9498256,
	lightgrey: 13882323,
	lightpink: 16758465,
	lightsalmon: 16752762,
	lightseagreen: 2142890,
	lightskyblue: 8900346,
	lightslategray: 7833753,
	lightslategrey: 7833753,
	lightsteelblue: 11584734,
	lightyellow: 16777184,
	lime: 65280,
	limegreen: 3329330,
	linen: 16445670,
	magenta: 16711935,
	maroon: 8388608,
	mediumaquamarine: 6737322,
	mediumblue: 205,
	mediumorchid: 12211667,
	mediumpurple: 9662683,
	mediumseagreen: 3978097,
	mediumslateblue: 8087790,
	mediumspringgreen: 64154,
	mediumturquoise: 4772300,
	mediumvioletred: 13047173,
	midnightblue: 1644912,
	mintcream: 16121850,
	mistyrose: 16770273,
	moccasin: 16770229,
	navajowhite: 16768685,
	navy: 128,
	oldlace: 16643558,
	olive: 8421376,
	olivedrab: 7048739,
	orange: 16753920,
	orangered: 16729344,
	orchid: 14315734,
	palegoldenrod: 15657130,
	palegreen: 10025880,
	paleturquoise: 11529966,
	palevioletred: 14381203,
	papayawhip: 16773077,
	peachpuff: 16767673,
	peru: 13468991,
	pink: 16761035,
	plum: 14524637,
	powderblue: 11591910,
	purple: 8388736,
	rebeccapurple: 6697881,
	red: 16711680,
	rosybrown: 12357519,
	royalblue: 4286945,
	saddlebrown: 9127187,
	salmon: 16416882,
	sandybrown: 16032864,
	seagreen: 3050327,
	seashell: 16774638,
	sienna: 10506797,
	silver: 12632256,
	skyblue: 8900331,
	slateblue: 6970061,
	slategray: 7372944,
	slategrey: 7372944,
	snow: 16775930,
	springgreen: 65407,
	steelblue: 4620980,
	tan: 13808780,
	teal: 32896,
	thistle: 14204888,
	tomato: 16737095,
	turquoise: 4251856,
	violet: 15631086,
	wheat: 16113331,
	white: 16777215,
	whitesmoke: 16119285,
	yellow: 16776960,
	yellowgreen: 10145074
}, Dn = {
	h: 0,
	s: 0,
	l: 0
}, On = {
	h: 0,
	s: 0,
	l: 0
};
function kn(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * 6 * (2 / 3 - n) : e;
}
var Z = class {
	constructor(e, t, n) {
		return this.isColor = !0, this.r = 1, this.g = 1, this.b = 1, this.set(e, t, n);
	}
	set(e, t, n) {
		if (t === void 0 && n === void 0) {
			let t = e;
			t && t.isColor ? this.copy(t) : typeof t == "number" ? this.setHex(t) : typeof t == "string" && this.setStyle(t);
		} else this.setRGB(e, t, n);
		return this;
	}
	setScalar(e) {
		return this.r = e, this.g = e, this.b = e, this;
	}
	setHex(e, t = Ne) {
		return e = Math.floor(e), this.r = (e >> 16 & 255) / 255, this.g = (e >> 8 & 255) / 255, this.b = (e & 255) / 255, Mt.colorSpaceToWorking(this, t), this;
	}
	setRGB(e, t, n, r = Mt.workingColorSpace) {
		return this.r = e, this.g = t, this.b = n, Mt.colorSpaceToWorking(this, r), this;
	}
	setHSL(e, t, n, r = Mt.workingColorSpace) {
		if (e = rt(e, 1), t = q(t, 0, 1), n = q(n, 0, 1), t === 0) this.r = this.g = this.b = n;
		else {
			let r = n <= .5 ? n * (1 + t) : n + t - n * t, i = 2 * n - r;
			this.r = kn(i, r, e + 1 / 3), this.g = kn(i, r, e), this.b = kn(i, r, e - 1 / 3);
		}
		return Mt.colorSpaceToWorking(this, r), this;
	}
	setStyle(e, t = Ne) {
		function n(t) {
			t !== void 0 && parseFloat(t) < 1 && G("Color: Alpha component of " + e + " will be ignored.");
		}
		let r;
		if (r = /^(\w+)\(([^\)]*)\)/.exec(e)) {
			let i, a = r[1], o = r[2];
			switch (a) {
				case "rgb":
				case "rgba":
					if (i = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o)) return n(i[4]), this.setRGB(Math.min(255, parseInt(i[1], 10)) / 255, Math.min(255, parseInt(i[2], 10)) / 255, Math.min(255, parseInt(i[3], 10)) / 255, t);
					if (i = /^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o)) return n(i[4]), this.setRGB(Math.min(100, parseFloat(i[1])) / 100, Math.min(100, parseFloat(i[2])) / 100, Math.min(100, parseFloat(i[3])) / 100, t);
					break;
				case "hsl":
				case "hsla":
					if (i = /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o)) return n(i[4]), this.setHSL(parseFloat(i[1]) / 360, parseFloat(i[2]) / 100, parseFloat(i[3]) / 100, t);
					break;
				default: G("Color: Unknown color model " + e);
			}
		} else if (r = /^\#([A-Fa-f\d]+)$/.exec(e)) {
			let n = r[1], i = n.length;
			if (i === 3) return this.setRGB(parseInt(n.charAt(0), 16) / 15, parseInt(n.charAt(1), 16) / 15, parseInt(n.charAt(2), 16) / 15, t);
			if (i === 6) return this.setHex(parseInt(n, 16), t);
			G("Color: Invalid hex color " + e);
		} else if (e && e.length > 0) return this.setColorName(e, t);
		return this;
	}
	setColorName(e, t = Ne) {
		let n = En[e.toLowerCase()];
		return n === void 0 ? G("Color: Unknown color " + e) : this.setHex(n, t), this;
	}
	clone() {
		return new this.constructor(this.r, this.g, this.b);
	}
	copy(e) {
		return this.r = e.r, this.g = e.g, this.b = e.b, this;
	}
	copySRGBToLinear(e) {
		return this.r = Nt(e.r), this.g = Nt(e.g), this.b = Nt(e.b), this;
	}
	copyLinearToSRGB(e) {
		return this.r = Pt(e.r), this.g = Pt(e.g), this.b = Pt(e.b), this;
	}
	convertSRGBToLinear() {
		return this.copySRGBToLinear(this), this;
	}
	convertLinearToSRGB() {
		return this.copyLinearToSRGB(this), this;
	}
	getHex(e = Ne) {
		return Mt.workingToColorSpace(An.copy(this), e), Math.round(q(An.r * 255, 0, 255)) * 65536 + Math.round(q(An.g * 255, 0, 255)) * 256 + Math.round(q(An.b * 255, 0, 255));
	}
	getHexString(e = Ne) {
		return ("000000" + this.getHex(e).toString(16)).slice(-6);
	}
	getHSL(e, t = Mt.workingColorSpace) {
		Mt.workingToColorSpace(An.copy(this), t);
		let n = An.r, r = An.g, i = An.b, a = Math.max(n, r, i), o = Math.min(n, r, i), s, c, l = (o + a) / 2;
		if (o === a) s = 0, c = 0;
		else {
			let e = a - o;
			switch (c = l <= .5 ? e / (a + o) : e / (2 - a - o), a) {
				case n:
					s = (r - i) / e + (r < i ? 6 : 0);
					break;
				case r:
					s = (i - n) / e + 2;
					break;
				case i: s = (n - r) / e + 4;
			}
			s /= 6;
		}
		return e.h = s, e.s = c, e.l = l, e;
	}
	getRGB(e, t = Mt.workingColorSpace) {
		return Mt.workingToColorSpace(An.copy(this), t), e.r = An.r, e.g = An.g, e.b = An.b, e;
	}
	getStyle(e = Ne) {
		Mt.workingToColorSpace(An.copy(this), e);
		let t = An.r, n = An.g, r = An.b;
		return e === "srgb" ? `rgb(${Math.round(t * 255)},${Math.round(n * 255)},${Math.round(r * 255)})` : `color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`;
	}
	offsetHSL(e, t, n) {
		return this.getHSL(Dn), this.setHSL(Dn.h + e, Dn.s + t, Dn.l + n);
	}
	add(e) {
		return this.r += e.r, this.g += e.g, this.b += e.b, this;
	}
	addColors(e, t) {
		return this.r = e.r + t.r, this.g = e.g + t.g, this.b = e.b + t.b, this;
	}
	addScalar(e) {
		return this.r += e, this.g += e, this.b += e, this;
	}
	sub(e) {
		return this.r = Math.max(0, this.r - e.r), this.g = Math.max(0, this.g - e.g), this.b = Math.max(0, this.b - e.b), this;
	}
	multiply(e) {
		return this.r *= e.r, this.g *= e.g, this.b *= e.b, this;
	}
	multiplyScalar(e) {
		return this.r *= e, this.g *= e, this.b *= e, this;
	}
	lerp(e, t) {
		return this.r += (e.r - this.r) * t, this.g += (e.g - this.g) * t, this.b += (e.b - this.b) * t, this;
	}
	lerpColors(e, t, n) {
		return this.r = e.r + (t.r - e.r) * n, this.g = e.g + (t.g - e.g) * n, this.b = e.b + (t.b - e.b) * n, this;
	}
	lerpHSL(e, t) {
		this.getHSL(Dn), e.getHSL(On);
		let n = ot(Dn.h, On.h, t), r = ot(Dn.s, On.s, t), i = ot(Dn.l, On.l, t);
		return this.setHSL(n, r, i), this;
	}
	setFromVector3(e) {
		return this.r = e.x, this.g = e.y, this.b = e.z, this;
	}
	applyMatrix3(e) {
		let t = this.r, n = this.g, r = this.b, i = e.elements;
		return this.r = i[0] * t + i[3] * n + i[6] * r, this.g = i[1] * t + i[4] * n + i[7] * r, this.b = i[2] * t + i[5] * n + i[8] * r, this;
	}
	equals(e) {
		return e.r === this.r && e.g === this.g && e.b === this.b;
	}
	fromArray(e, t = 0) {
		return this.r = e[t], this.g = e[t + 1], this.b = e[t + 2], this;
	}
	toArray(e = [], t = 0) {
		return e[t] = this.r, e[t + 1] = this.g, e[t + 2] = this.b, e;
	}
	fromBufferAttribute(e, t) {
		return this.r = e.getX(t), this.g = e.getY(t), this.b = e.getZ(t), this;
	}
	toJSON() {
		return this.getHex();
	}
	*[Symbol.iterator]() {
		yield this.r, yield this.g, yield this.b;
	}
}, An = /*@__PURE__*/ new Z();
Z.NAMES = En;
var jn = class extends Sn {
	constructor() {
		super(), this.isScene = !0, this.type = "Scene", this.background = null, this.environment = null, this.fog = null, this.backgroundBlurriness = 0, this.backgroundIntensity = 1, this.backgroundRotation = new an(), this.environmentIntensity = 1, this.environmentRotation = new an(), this.overrideMaterial = null, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
	}
	copy(e, t) {
		return super.copy(e, t), this.background = e.background === null ? null : e.background.clone(), this.environment = e.environment === null ? null : e.environment.clone(), this.fog = e.fog === null ? null : e.fog.clone(), this.backgroundBlurriness = e.backgroundBlurriness, this.backgroundIntensity = e.backgroundIntensity, this.backgroundRotation.copy(e.backgroundRotation), this.environmentIntensity = e.environmentIntensity, this.environmentRotation.copy(e.environmentRotation), this.overrideMaterial = e.overrideMaterial === null ? null : e.overrideMaterial.clone(), this.matrixAutoUpdate = e.matrixAutoUpdate, this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return this.fog !== null && (t.object.fog = this.fog.toJSON()), t.object.backgroundBlurriness = this.backgroundBlurriness, t.object.backgroundIntensity = this.backgroundIntensity, t.object.backgroundRotation = this.backgroundRotation.toArray(), t.object.environmentIntensity = this.environmentIntensity, t.object.environmentRotation = this.environmentRotation.toArray(), t;
	}
}, Mn = /*@__PURE__*/ new Y(), Nn = /*@__PURE__*/ new Y(), Pn = /*@__PURE__*/ new Y(), Fn = /*@__PURE__*/ new Y(), In = /*@__PURE__*/ new Y(), Ln = /*@__PURE__*/ new Y(), Rn = /*@__PURE__*/ new Y(), zn = /*@__PURE__*/ new Y(), Bn = /*@__PURE__*/ new Y(), Vn = /*@__PURE__*/ new Y(), Hn = /*@__PURE__*/ new Ut(), Un = /*@__PURE__*/ new Ut(), Wn = /*@__PURE__*/ new Ut(), Gn = class e {
	constructor(e = new Y(), t = new Y(), n = new Y()) {
		this.a = e, this.b = t, this.c = n;
	}
	static getNormal(e, t, n, r) {
		r.subVectors(n, t), Mn.subVectors(e, t), r.cross(Mn);
		let i = r.lengthSq();
		return i > 0 ? r.multiplyScalar(1 / Math.sqrt(i)) : r.set(0, 0, 0);
	}
	static getBarycoord(e, t, n, r, i) {
		Mn.subVectors(r, t), Nn.subVectors(n, t), Pn.subVectors(e, t);
		let a = Mn.dot(Mn), o = Mn.dot(Nn), s = Mn.dot(Pn), c = Nn.dot(Nn), l = Nn.dot(Pn), u = a * c - o * o;
		if (u === 0) return i.set(0, 0, 0), null;
		let d = 1 / u, f = (c * s - o * l) * d, p = (a * l - o * s) * d;
		return i.set(1 - f - p, p, f);
	}
	static containsPoint(e, t, n, r) {
		return this.getBarycoord(e, t, n, r, Fn) !== null && Fn.x >= 0 && Fn.y >= 0 && Fn.x + Fn.y <= 1;
	}
	static getInterpolation(e, t, n, r, i, a, o, s) {
		return this.getBarycoord(e, t, n, r, Fn) === null ? (s.x = 0, s.y = 0, "z" in s && (s.z = 0), "w" in s && (s.w = 0), null) : (s.setScalar(0), s.addScaledVector(i, Fn.x), s.addScaledVector(a, Fn.y), s.addScaledVector(o, Fn.z), s);
	}
	static getInterpolatedAttribute(e, t, n, r, i, a) {
		return Hn.setScalar(0), Un.setScalar(0), Wn.setScalar(0), Hn.fromBufferAttribute(e, t), Un.fromBufferAttribute(e, n), Wn.fromBufferAttribute(e, r), a.setScalar(0), a.addScaledVector(Hn, i.x), a.addScaledVector(Un, i.y), a.addScaledVector(Wn, i.z), a;
	}
	static isFrontFacing(e, t, n, r) {
		return Mn.subVectors(n, t), Nn.subVectors(e, t), Mn.cross(Nn).dot(r) < 0;
	}
	set(e, t, n) {
		return this.a.copy(e), this.b.copy(t), this.c.copy(n), this;
	}
	setFromPointsAndIndices(e, t, n, r) {
		return this.a.copy(e[t]), this.b.copy(e[n]), this.c.copy(e[r]), this;
	}
	setFromAttributeAndIndices(e, t, n, r) {
		return this.a.fromBufferAttribute(e, t), this.b.fromBufferAttribute(e, n), this.c.fromBufferAttribute(e, r), this;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		return this.a.copy(e.a), this.b.copy(e.b), this.c.copy(e.c), this;
	}
	getArea() {
		return Mn.subVectors(this.c, this.b), Nn.subVectors(this.a, this.b), Mn.cross(Nn).length() * .5;
	}
	getMidpoint(e) {
		return e.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
	}
	getNormal(t) {
		return e.getNormal(this.a, this.b, this.c, t);
	}
	getPlane(e) {
		return e.setFromCoplanarPoints(this.a, this.b, this.c);
	}
	getBarycoord(t, n) {
		return e.getBarycoord(t, this.a, this.b, this.c, n);
	}
	getInterpolation(t, n, r, i, a) {
		return e.getInterpolation(t, this.a, this.b, this.c, n, r, i, a);
	}
	containsPoint(t) {
		return e.containsPoint(t, this.a, this.b, this.c);
	}
	isFrontFacing(t) {
		return e.isFrontFacing(this.a, this.b, this.c, t);
	}
	intersectsBox(e) {
		return e.intersectsTriangle(this);
	}
	closestPointToPoint(e, t) {
		let n = this.a, r = this.b, i = this.c, a, o;
		In.subVectors(r, n), Ln.subVectors(i, n), zn.subVectors(e, n);
		let s = In.dot(zn), c = Ln.dot(zn);
		if (s <= 0 && c <= 0) return t.copy(n);
		Bn.subVectors(e, r);
		let l = In.dot(Bn), u = Ln.dot(Bn);
		if (l >= 0 && u <= l) return t.copy(r);
		let d = s * u - l * c;
		if (d <= 0 && s >= 0 && l <= 0 && s - l > 0) return a = s / (s - l), t.copy(n).addScaledVector(In, a);
		Vn.subVectors(e, i);
		let f = In.dot(Vn), p = Ln.dot(Vn);
		if (p >= 0 && f <= p) return t.copy(i);
		let m = f * c - s * p;
		if (m <= 0 && c >= 0 && p <= 0) return o = c / (c - p), t.copy(n).addScaledVector(Ln, o);
		let h = l * p - f * u;
		if (h <= 0 && u - l >= 0 && f - p >= 0) return Rn.subVectors(i, r), o = (u - l) / (u - l + (f - p)), t.copy(r).addScaledVector(Rn, o);
		let g = 1 / (h + m + d);
		return a = m * g, o = d * g, t.copy(n).addScaledVector(In, a).addScaledVector(Ln, o);
	}
	equals(e) {
		return e.a.equals(this.a) && e.b.equals(this.b) && e.c.equals(this.c);
	}
}, Kn = class {
	constructor(e = new Y(Infinity, Infinity, Infinity), t = new Y(-Infinity, -Infinity, -Infinity)) {
		this.isBox3 = !0, this.min = e, this.max = t;
	}
	set(e, t) {
		return this.min.copy(e), this.max.copy(t), this;
	}
	setFromArray(e) {
		this.makeEmpty();
		for (let t = 0, n = e.length; t < n; t += 3) this.expandByPoint(Jn.fromArray(e, t));
		return this;
	}
	setFromBufferAttribute(e) {
		this.makeEmpty();
		for (let t = 0, n = e.count; t < n; t++) this.expandByPoint(Jn.fromBufferAttribute(e, t));
		return this;
	}
	setFromPoints(e) {
		this.makeEmpty();
		for (let t = 0, n = e.length; t < n; t++) this.expandByPoint(e[t]);
		return this;
	}
	setFromCenterAndSize(e, t) {
		let n = Jn.copy(t).multiplyScalar(.5);
		return this.min.copy(e).sub(n), this.max.copy(e).add(n), this;
	}
	setFromObject(e, t = !1) {
		return this.makeEmpty(), this.expandByObject(e, t);
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		return this.min.copy(e.min), this.max.copy(e.max), this;
	}
	makeEmpty() {
		return this.min.x = this.min.y = this.min.z = Infinity, this.max.x = this.max.y = this.max.z = -Infinity, this;
	}
	isEmpty() {
		return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
	}
	getCenter(e) {
		return this.isEmpty() ? e.set(0, 0, 0) : e.addVectors(this.min, this.max).multiplyScalar(.5);
	}
	getSize(e) {
		return this.isEmpty() ? e.set(0, 0, 0) : e.subVectors(this.max, this.min);
	}
	expandByPoint(e) {
		return this.min.min(e), this.max.max(e), this;
	}
	expandByVector(e) {
		return this.min.sub(e), this.max.add(e), this;
	}
	expandByScalar(e) {
		return this.min.addScalar(-e), this.max.addScalar(e), this;
	}
	expandByObject(e, t = !1) {
		e.updateWorldMatrix(!1, !1);
		let n = e.geometry;
		if (n !== void 0) {
			let r = n.getAttribute("position");
			if (t === !0 && r !== void 0 && e.isInstancedMesh !== !0 && e.isBatchedMesh !== !0) for (let t = 0, n = r.count; t < n; t++) e.isMesh === !0 ? e.getVertexPosition(t, Jn) : Jn.fromBufferAttribute(r, t), Jn.applyMatrix4(e.matrixWorld), this.expandByPoint(Jn);
			else e.boundingBox === void 0 ? (n.boundingBox === null && n.computeBoundingBox(), Yn.copy(n.boundingBox)) : (e.boundingBox === null && e.computeBoundingBox(), Yn.copy(e.boundingBox)), Yn.applyMatrix4(e.matrixWorld), this.union(Yn);
		}
		let r = e.children;
		for (let e = 0, n = r.length; e < n; e++) this.expandByObject(r[e], t);
		return this;
	}
	containsPoint(e) {
		return e.x >= this.min.x && e.x <= this.max.x && e.y >= this.min.y && e.y <= this.max.y && e.z >= this.min.z && e.z <= this.max.z;
	}
	containsBox(e) {
		return this.min.x <= e.min.x && e.max.x <= this.max.x && this.min.y <= e.min.y && e.max.y <= this.max.y && this.min.z <= e.min.z && e.max.z <= this.max.z;
	}
	getParameter(e, t) {
		return t.set((e.x - this.min.x) / (this.max.x - this.min.x), (e.y - this.min.y) / (this.max.y - this.min.y), (e.z - this.min.z) / (this.max.z - this.min.z));
	}
	intersectsBox(e) {
		return e.max.x >= this.min.x && e.min.x <= this.max.x && e.max.y >= this.min.y && e.min.y <= this.max.y && e.max.z >= this.min.z && e.min.z <= this.max.z;
	}
	intersectsSphere(e) {
		return this.clampPoint(e.center, Jn), Jn.distanceToSquared(e.center) <= e.radius * e.radius;
	}
	intersectsPlane(e) {
		let t, n;
		return e.normal.x > 0 ? (t = e.normal.x * this.min.x, n = e.normal.x * this.max.x) : (t = e.normal.x * this.max.x, n = e.normal.x * this.min.x), e.normal.y > 0 ? (t += e.normal.y * this.min.y, n += e.normal.y * this.max.y) : (t += e.normal.y * this.max.y, n += e.normal.y * this.min.y), e.normal.z > 0 ? (t += e.normal.z * this.min.z, n += e.normal.z * this.max.z) : (t += e.normal.z * this.max.z, n += e.normal.z * this.min.z), t <= -e.constant && n >= -e.constant;
	}
	intersectsTriangle(e) {
		if (this.isEmpty()) return !1;
		this.getCenter(nr), rr.subVectors(this.max, nr), Xn.subVectors(e.a, nr), Zn.subVectors(e.b, nr), Qn.subVectors(e.c, nr), $n.subVectors(Zn, Xn), er.subVectors(Qn, Zn), tr.subVectors(Xn, Qn);
		let t = [
			0,
			-$n.z,
			$n.y,
			0,
			-er.z,
			er.y,
			0,
			-tr.z,
			tr.y,
			$n.z,
			0,
			-$n.x,
			er.z,
			0,
			-er.x,
			tr.z,
			0,
			-tr.x,
			-$n.y,
			$n.x,
			0,
			-er.y,
			er.x,
			0,
			-tr.y,
			tr.x,
			0
		];
		return !or(t, Xn, Zn, Qn, rr) || (t = [
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1
		], !or(t, Xn, Zn, Qn, rr)) ? !1 : (ir.crossVectors($n, er), t = [
			ir.x,
			ir.y,
			ir.z
		], or(t, Xn, Zn, Qn, rr));
	}
	clampPoint(e, t) {
		return t.copy(e).clamp(this.min, this.max);
	}
	distanceToPoint(e) {
		return this.clampPoint(e, Jn).distanceTo(e);
	}
	getBoundingSphere(e) {
		return this.isEmpty() ? e.makeEmpty() : (this.getCenter(e.center), e.radius = this.getSize(Jn).length() * .5), e;
	}
	intersect(e) {
		return this.min.max(e.min), this.max.min(e.max), this.isEmpty() && this.makeEmpty(), this;
	}
	union(e) {
		return this.min.min(e.min), this.max.max(e.max), this;
	}
	applyMatrix4(e) {
		return this.isEmpty() || (qn[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(e), qn[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(e), qn[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(e), qn[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(e), qn[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(e), qn[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(e), qn[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(e), qn[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(e), this.setFromPoints(qn)), this;
	}
	translate(e) {
		return this.min.add(e), this.max.add(e), this;
	}
	equals(e) {
		return e.min.equals(this.min) && e.max.equals(this.max);
	}
	toJSON() {
		return {
			min: this.min.toArray(),
			max: this.max.toArray()
		};
	}
	fromJSON(e) {
		return this.min.fromArray(e.min), this.max.fromArray(e.max), this;
	}
}, qn = [
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y(),
	/*@__PURE__*/ new Y()
], Jn = /*@__PURE__*/ new Y(), Yn = /*@__PURE__*/ new Kn(), Xn = /*@__PURE__*/ new Y(), Zn = /*@__PURE__*/ new Y(), Qn = /*@__PURE__*/ new Y(), $n = /*@__PURE__*/ new Y(), er = /*@__PURE__*/ new Y(), tr = /*@__PURE__*/ new Y(), nr = /*@__PURE__*/ new Y(), rr = /*@__PURE__*/ new Y(), ir = /*@__PURE__*/ new Y(), ar = /*@__PURE__*/ new Y();
function or(e, t, n, r, i) {
	for (let a = 0, o = e.length - 3; a <= o; a += 3) {
		ar.fromArray(e, a);
		let o = i.x * Math.abs(ar.x) + i.y * Math.abs(ar.y) + i.z * Math.abs(ar.z), s = t.dot(ar), c = n.dot(ar), l = r.dot(ar);
		if (Math.max(-Math.max(s, c, l), Math.min(s, c, l)) > o) return !1;
	}
	return !0;
}
var sr = /*@__PURE__*/ new Y(), cr = /*@__PURE__*/ new J(), lr = 0, ur = class extends Ze {
	constructor(e, t, n = !1) {
		if (super(), Array.isArray(e)) throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");
		this.isBufferAttribute = !0, Object.defineProperty(this, "id", { value: lr++ }), this.name = "", this.array = e, this.itemSize = t, this.count = e === void 0 ? 0 : e.length / t, this.normalized = n, this.usage = Re, this.updateRanges = [], this.gpuType = _, this.version = 0, this._normalizationScale = e === void 0 ? void 0 : xt(e);
	}
	onUploadCallback() {}
	set needsUpdate(e) {
		e === !0 && this.version++;
	}
	setUsage(e) {
		return this.usage = e, this;
	}
	addUpdateRange(e, t) {
		this.updateRanges.push({
			start: e,
			count: t
		});
	}
	clearUpdateRanges() {
		this.updateRanges.length = 0;
	}
	copy(e) {
		return this.name = e.name, this.array = new e.array.constructor(e.array), this.itemSize = e.itemSize, this.count = e.count, this.normalized = e.normalized, this.usage = e.usage, this.gpuType = e.gpuType, this._normalizationScale = e._normalizationScale, this;
	}
	copyAt(e, t, n) {
		e *= this.itemSize, n *= t.itemSize;
		for (let r = 0, i = this.itemSize; r < i; r++) this.array[e + r] = t.array[n + r];
		return this;
	}
	copyArray(e) {
		return this.array.set(e), this;
	}
	applyMatrix3(e) {
		if (this.itemSize === 2) for (let t = 0, n = this.count; t < n; t++) cr.fromBufferAttribute(this, t), cr.applyMatrix3(e), this.setXY(t, cr.x, cr.y);
		else if (this.itemSize === 3) for (let t = 0, n = this.count; t < n; t++) sr.fromBufferAttribute(this, t), sr.applyMatrix3(e), this.setXYZ(t, sr.x, sr.y, sr.z);
		return this;
	}
	applyMatrix4(e) {
		for (let t = 0, n = this.count; t < n; t++) sr.fromBufferAttribute(this, t), sr.applyMatrix4(e), this.setXYZ(t, sr.x, sr.y, sr.z);
		return this;
	}
	applyNormalMatrix(e) {
		for (let t = 0, n = this.count; t < n; t++) sr.fromBufferAttribute(this, t), sr.applyNormalMatrix(e), this.setXYZ(t, sr.x, sr.y, sr.z);
		return this;
	}
	transformDirection(e) {
		for (let t = 0, n = this.count; t < n; t++) sr.fromBufferAttribute(this, t), sr.transformDirection(e), this.setXYZ(t, sr.x, sr.y, sr.z);
		return this;
	}
	set(e, t = 0) {
		return this.array.set(e, t), this;
	}
	getComponent(e, t) {
		let n = this.array[e * this.itemSize + t];
		return this.normalized && (n = this._denormalize(n)), n;
	}
	setComponent(e, t, n) {
		return this.normalized && (n = this._normalize(n)), this.array[e * this.itemSize + t] = n, this;
	}
	getX(e) {
		let t = this.array[e * this.itemSize];
		return this.normalized && (t = this._denormalize(t)), t;
	}
	setX(e, t) {
		return this.normalized && (t = this._normalize(t)), this.array[e * this.itemSize] = t, this;
	}
	getY(e) {
		let t = this.array[e * this.itemSize + 1];
		return this.normalized && (t = this._denormalize(t)), t;
	}
	setY(e, t) {
		return this.normalized && (t = this._normalize(t)), this.array[e * this.itemSize + 1] = t, this;
	}
	getZ(e) {
		let t = this.array[e * this.itemSize + 2];
		return this.normalized && (t = this._denormalize(t)), t;
	}
	setZ(e, t) {
		return this.normalized && (t = this._normalize(t)), this.array[e * this.itemSize + 2] = t, this;
	}
	getW(e) {
		let t = this.array[e * this.itemSize + 3];
		return this.normalized && (t = this._denormalize(t)), t;
	}
	setW(e, t) {
		return this.normalized && (t = this._normalize(t)), this.array[e * this.itemSize + 3] = t, this;
	}
	setXY(e, t, n) {
		return e *= this.itemSize, this.normalized && (t = this._normalize(t), n = this._normalize(n)), this.array[e + 0] = t, this.array[e + 1] = n, this;
	}
	setXYZ(e, t, n, r) {
		return e *= this.itemSize, this.normalized && (t = this._normalize(t), n = this._normalize(n), r = this._normalize(r)), this.array[e + 0] = t, this.array[e + 1] = n, this.array[e + 2] = r, this;
	}
	setXYZW(e, t, n, r, i) {
		return e *= this.itemSize, this.normalized && (t = this._normalize(t), n = this._normalize(n), r = this._normalize(r), i = this._normalize(i)), this.array[e + 0] = t, this.array[e + 1] = n, this.array[e + 2] = r, this.array[e + 3] = i, this;
	}
	onUpload(e) {
		return this.onUploadCallback = e, this;
	}
	clone() {
		return new this.constructor(this.array, this.itemSize).copy(this);
	}
	toJSON() {
		let e = {
			itemSize: this.itemSize,
			type: this.array.constructor.name,
			array: Array.from(this.array),
			normalized: this.normalized
		};
		return e.name = this.name, e.usage = this.usage, e.gpuType = this.gpuType, e;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
	_denormalize(e) {
		let t = this._normalizationScale;
		return t === void 0 ? St(e, this.array) : Math.max(e / t, -1);
	}
	_normalize(e) {
		let t = this._normalizationScale;
		return t === void 0 ? Ct(e, this.array) : Math.round(e * t);
	}
}, dr = class extends ur {
	constructor(e, t, n) {
		super(new Uint16Array(e), t, n);
	}
}, fr = class extends ur {
	constructor(e, t, n) {
		super(new Uint32Array(e), t, n);
	}
}, pr = class extends ur {
	constructor(e, t, n) {
		super(new Float32Array(e), t, n);
	}
}, mr = /*@__PURE__*/ new Kn(), hr = /*@__PURE__*/ new Y(), gr = /*@__PURE__*/ new Y(), _r = class {
	constructor(e = new Y(), t = -1) {
		this.isSphere = !0, this.center = e, this.radius = t;
	}
	set(e, t) {
		return this.center.copy(e), this.radius = t, this;
	}
	setFromPoints(e, t) {
		let n = this.center;
		t === void 0 ? mr.setFromPoints(e).getCenter(n) : n.copy(t);
		let r = 0;
		for (let t = 0, i = e.length; t < i; t++) r = Math.max(r, n.distanceToSquared(e[t]));
		return this.radius = Math.sqrt(r), this;
	}
	copy(e) {
		return this.center.copy(e.center), this.radius = e.radius, this;
	}
	isEmpty() {
		return this.radius < 0;
	}
	makeEmpty() {
		return this.center.set(0, 0, 0), this.radius = -1, this;
	}
	containsPoint(e) {
		return e.distanceToSquared(this.center) <= this.radius * this.radius;
	}
	distanceToPoint(e) {
		return e.distanceTo(this.center) - this.radius;
	}
	intersectsSphere(e) {
		let t = this.radius + e.radius;
		return e.center.distanceToSquared(this.center) <= t * t;
	}
	intersectsBox(e) {
		return e.intersectsSphere(this);
	}
	intersectsPlane(e) {
		return Math.abs(e.distanceToPoint(this.center)) <= this.radius;
	}
	clampPoint(e, t) {
		let n = this.center.distanceToSquared(e);
		return t.copy(e), n > this.radius * this.radius && (t.sub(this.center).normalize(), t.multiplyScalar(this.radius).add(this.center)), t;
	}
	getBoundingBox(e) {
		return this.isEmpty() ? (e.makeEmpty(), e) : (e.set(this.center, this.center), e.expandByScalar(this.radius), e);
	}
	applyMatrix4(e) {
		return this.center.applyMatrix4(e), this.radius *= e.getMaxScaleOnAxis(), this;
	}
	translate(e) {
		return this.center.add(e), this;
	}
	expandByPoint(e) {
		if (this.isEmpty()) return this.center.copy(e), this.radius = 0, this;
		hr.subVectors(e, this.center);
		let t = hr.lengthSq();
		if (t > this.radius * this.radius) {
			let e = Math.sqrt(t), n = (e - this.radius) * .5;
			this.center.addScaledVector(hr, n / e), this.radius += n;
		}
		return this;
	}
	union(e) {
		return e.isEmpty() ? this : this.isEmpty() ? (this.copy(e), this) : (this.center.equals(e.center) === !0 ? this.radius = Math.max(this.radius, e.radius) : (gr.subVectors(e.center, this.center).setLength(e.radius), this.expandByPoint(hr.copy(e.center).add(gr)), this.expandByPoint(hr.copy(e.center).sub(gr))), this);
	}
	equals(e) {
		return e.center.equals(this.center) && e.radius === this.radius;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	toJSON() {
		return {
			radius: this.radius,
			center: this.center.toArray()
		};
	}
	fromJSON(e) {
		return this.radius = e.radius, this.center.fromArray(e.center), this;
	}
}, vr = 0, yr = /*@__PURE__*/ new Jt(), br = /*@__PURE__*/ new Sn(), xr = /*@__PURE__*/ new Y(), Sr = /*@__PURE__*/ new Kn(), Cr = /*@__PURE__*/ new Kn(), wr = /*@__PURE__*/ new Y(), Tr = class e extends Ze {
	constructor() {
		super(), this.isBufferGeometry = !0, Object.defineProperty(this, "id", { value: vr++ }), this.uuid = nt(), this.name = "", this.type = "BufferGeometry", this.index = null, this.indirect = null, this.indirectOffset = 0, this.attributes = {}, this.morphAttributes = {}, this.morphTargetsRelative = !1, this.groups = [], this.boundingBox = null, this.boundingSphere = null, this.drawRange = {
			start: 0,
			count: Infinity
		}, this.userData = {}, this._transformed = !1;
	}
	getIndex() {
		return this.index;
	}
	setIndex(e) {
		return this.index = Array.isArray(e) ? new (Ve(e) ? fr : dr)(e, 1) : e, this;
	}
	setIndirect(e, t = 0) {
		return this.indirect = e, this.indirectOffset = t, this;
	}
	getIndirect() {
		return this.indirect;
	}
	getAttribute(e) {
		return this.attributes[e];
	}
	setAttribute(e, t) {
		return this.attributes[e] = t, this;
	}
	deleteAttribute(e) {
		return delete this.attributes[e], this;
	}
	hasAttribute(e) {
		return this.attributes[e] !== void 0;
	}
	addGroup(e, t, n = 0) {
		this.groups.push({
			start: e,
			count: t,
			materialIndex: n
		});
	}
	clearGroups() {
		this.groups = [];
	}
	setDrawRange(e, t) {
		this.drawRange.start = e, this.drawRange.count = t;
	}
	applyMatrix4(e) {
		let t = this.attributes.position;
		t !== void 0 && (t.applyMatrix4(e), t.needsUpdate = !0);
		let n = this.attributes.normal;
		if (n !== void 0) {
			let t = new X().getNormalMatrix(e);
			n.applyNormalMatrix(t), n.needsUpdate = !0;
		}
		let r = this.attributes.tangent;
		return r !== void 0 && (r.transformDirection(e), r.needsUpdate = !0), this.boundingBox !== null && this.computeBoundingBox(), this.boundingSphere !== null && this.computeBoundingSphere(), this._transformed = !0, this;
	}
	applyQuaternion(e) {
		return yr.makeRotationFromQuaternion(e), this.applyMatrix4(yr), this;
	}
	rotateX(e) {
		return yr.makeRotationX(e), this.applyMatrix4(yr), this;
	}
	rotateY(e) {
		return yr.makeRotationY(e), this.applyMatrix4(yr), this;
	}
	rotateZ(e) {
		return yr.makeRotationZ(e), this.applyMatrix4(yr), this;
	}
	translate(e, t, n) {
		return yr.makeTranslation(e, t, n), this.applyMatrix4(yr), this;
	}
	scale(e, t, n) {
		return yr.makeScale(e, t, n), this.applyMatrix4(yr), this;
	}
	lookAt(e) {
		return br.lookAt(e), br.updateMatrix(), this.applyMatrix4(br.matrix), this;
	}
	center() {
		return this.computeBoundingBox(), this.boundingBox.getCenter(xr).negate(), this.translate(xr.x, xr.y, xr.z), this;
	}
	setFromPoints(e) {
		let t = this.getAttribute("position");
		if (t === void 0) {
			let t = [];
			for (let n = 0, r = e.length; n < r; n++) {
				let r = e[n];
				t.push(r.x, r.y, r.z || 0);
			}
			this.setAttribute("position", new pr(t, 3));
		} else {
			let n = Math.min(e.length, t.count);
			for (let r = 0; r < n; r++) {
				let n = e[r];
				t.setXYZ(r, n.x, n.y, n.z || 0);
			}
			e.length > t.count && G("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."), t.needsUpdate = !0;
		}
		return this;
	}
	computeBoundingBox() {
		this.boundingBox === null && (this.boundingBox = new Kn());
		let e = this.attributes.position, t = this.morphAttributes.position;
		if (e && e.isGLBufferAttribute) K("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.", this), this.boundingBox.set(new Y(-Infinity, -Infinity, -Infinity), new Y(Infinity, Infinity, Infinity));
		else {
			if (e !== void 0) {
				if (this.boundingBox.setFromBufferAttribute(e), t) for (let e = 0, n = t.length; e < n; e++) {
					let n = t[e];
					Sr.setFromBufferAttribute(n), this.morphTargetsRelative ? (wr.addVectors(this.boundingBox.min, Sr.min), this.boundingBox.expandByPoint(wr), wr.addVectors(this.boundingBox.max, Sr.max), this.boundingBox.expandByPoint(wr)) : (this.boundingBox.expandByPoint(Sr.min), this.boundingBox.expandByPoint(Sr.max));
				}
			} else this.boundingBox.makeEmpty();
			(isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && K("BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The \"position\" attribute is likely to have NaN values.", this);
		}
	}
	computeBoundingSphere() {
		this.boundingSphere === null && (this.boundingSphere = new _r());
		let e = this.attributes.position, t = this.morphAttributes.position;
		if (e && e.isGLBufferAttribute) K("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.", this), this.boundingSphere.set(new Y(), Infinity);
		else if (e) {
			let n = this.boundingSphere.center;
			if (Sr.setFromBufferAttribute(e), t) for (let e = 0, n = t.length; e < n; e++) {
				let n = t[e];
				Cr.setFromBufferAttribute(n), this.morphTargetsRelative ? (wr.addVectors(Sr.min, Cr.min), Sr.expandByPoint(wr), wr.addVectors(Sr.max, Cr.max), Sr.expandByPoint(wr)) : (Sr.expandByPoint(Cr.min), Sr.expandByPoint(Cr.max));
			}
			Sr.getCenter(n);
			let r = 0;
			for (let t = 0, i = e.count; t < i; t++) wr.fromBufferAttribute(e, t), r = Math.max(r, n.distanceToSquared(wr));
			if (t) for (let i = 0, a = t.length; i < a; i++) {
				let a = t[i], o = this.morphTargetsRelative;
				for (let t = 0, i = a.count; t < i; t++) wr.fromBufferAttribute(a, t), o && (xr.fromBufferAttribute(e, t), wr.add(xr)), r = Math.max(r, n.distanceToSquared(wr));
			}
			this.boundingSphere.radius = Math.sqrt(r), isNaN(this.boundingSphere.radius) && K("BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The \"position\" attribute is likely to have NaN values.", this);
		}
	}
	computeTangents() {
		let e = this.index, t = this.attributes;
		if (e === null || t.position === void 0 || t.normal === void 0 || t.uv === void 0) {
			K("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");
			return;
		}
		let n = t.position, r = t.normal, i = t.uv, a = this.getAttribute("tangent");
		(a === void 0 || a.count !== n.count) && (a = new ur(new Float32Array(4 * n.count), 4), this.setAttribute("tangent", a));
		let o = [], s = [], c = new Uint8Array(n.count);
		for (let e = 0; e < n.count; e++) o[e] = new Y(), s[e] = new Y();
		let l = new Y(), u = new Y(), d = new Y(), f = new J(), p = new J(), m = new J(), h = new Y(), g = new Y();
		function _(e, t, r) {
			c[e] = c[t] = c[r] = 1, l.fromBufferAttribute(n, e), u.fromBufferAttribute(n, t), d.fromBufferAttribute(n, r), f.fromBufferAttribute(i, e), p.fromBufferAttribute(i, t), m.fromBufferAttribute(i, r), u.sub(l), d.sub(l), p.sub(f), m.sub(f);
			let a = 1 / (p.x * m.y - m.x * p.y);
			isFinite(a) && (h.copy(u).multiplyScalar(m.y).addScaledVector(d, -p.y).multiplyScalar(a), g.copy(d).multiplyScalar(p.x).addScaledVector(u, -m.x).multiplyScalar(a), o[e].add(h), o[t].add(h), o[r].add(h), s[e].add(g), s[t].add(g), s[r].add(g));
		}
		let v = this.groups;
		v.length === 0 && (v = [{
			start: 0,
			count: e.count
		}]);
		for (let t = 0, n = v.length; t < n; ++t) {
			let n = v[t], r = n.start, i = n.count;
			for (let t = r, n = r + i; t < n; t += 3) _(e.getX(t + 0), e.getX(t + 1), e.getX(t + 2));
		}
		let y = new Y(), b = new Y(), x = new Y(), S = new Y();
		function C(e) {
			x.fromBufferAttribute(r, e), S.copy(x);
			let t = o[e];
			y.copy(t), y.sub(x.multiplyScalar(x.dot(t))).normalize(), b.crossVectors(S, t);
			let n = b.dot(s[e]) < 0 ? -1 : 1;
			a.setXYZW(e, y.x, y.y, y.z, n);
		}
		for (let e = 0, t = n.count; e < t; ++e) c[e] && C(e);
		this._transformed = !0;
	}
	computeVertexNormals() {
		let e = this.index, t = this.getAttribute("position");
		if (t !== void 0) {
			let n = this.getAttribute("normal");
			if (n === void 0 || n.count !== t.count) n = new ur(new Float32Array(t.count * 3), 3), this.setAttribute("normal", n);
			else for (let e = 0, t = n.count; e < t; e++) n.setXYZ(e, 0, 0, 0);
			let r = new Y(), i = new Y(), a = new Y(), o = new Y(), s = new Y(), c = new Y(), l = new Y(), u = new Y();
			if (e) for (let d = 0, f = e.count; d < f; d += 3) {
				let f = e.getX(d + 0), p = e.getX(d + 1), m = e.getX(d + 2);
				r.fromBufferAttribute(t, f), i.fromBufferAttribute(t, p), a.fromBufferAttribute(t, m), l.subVectors(a, i), u.subVectors(r, i), l.cross(u), o.fromBufferAttribute(n, f), s.fromBufferAttribute(n, p), c.fromBufferAttribute(n, m), o.add(l), s.add(l), c.add(l), n.setXYZ(f, o.x, o.y, o.z), n.setXYZ(p, s.x, s.y, s.z), n.setXYZ(m, c.x, c.y, c.z);
			}
			else for (let e = 0, o = t.count; e < o; e += 3) r.fromBufferAttribute(t, e + 0), i.fromBufferAttribute(t, e + 1), a.fromBufferAttribute(t, e + 2), l.subVectors(a, i), u.subVectors(r, i), l.cross(u), n.setXYZ(e + 0, l.x, l.y, l.z), n.setXYZ(e + 1, l.x, l.y, l.z), n.setXYZ(e + 2, l.x, l.y, l.z);
			this.normalizeNormals(), n.needsUpdate = !0;
		}
	}
	normalizeNormals() {
		let e = this.attributes.normal;
		for (let t = 0, n = e.count; t < n; t++) wr.fromBufferAttribute(e, t), wr.normalize(), e.setXYZ(t, wr.x, wr.y, wr.z);
	}
	toNonIndexed() {
		function t(e, t) {
			let n = e.array, r = e.itemSize, i = e.normalized, a = new n.constructor(t.length * r), o = 0, s = 0;
			for (let i = 0, c = t.length; i < c; i++) {
				o = e.isInterleavedBufferAttribute ? t[i] * e.data.stride + e.offset : t[i] * r;
				for (let e = 0; e < r; e++) a[s++] = n[o++];
			}
			return new ur(a, r, i);
		}
		if (this.index === null) return G("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."), this;
		let n = new e(), r = this.index.array, i = this.attributes;
		for (let e in i) {
			let a = i[e], o = t(a, r);
			n.setAttribute(e, o);
		}
		let a = this.morphAttributes;
		for (let e in a) {
			let i = [], o = a[e];
			for (let e = 0, n = o.length; e < n; e++) {
				let n = o[e], a = t(n, r);
				i.push(a);
			}
			n.morphAttributes[e] = i;
		}
		n.morphTargetsRelative = this.morphTargetsRelative;
		let o = this.groups;
		for (let e = 0, t = o.length; e < t; e++) {
			let t = o[e];
			n.addGroup(t.start, t.count, t.materialIndex);
		}
		return n;
	}
	toJSON() {
		let e = { metadata: {
			version: 4.7,
			type: "BufferGeometry",
			generator: "BufferGeometry.toJSON"
		} };
		if (e.uuid = this.uuid, e.type = this.parameters !== void 0 && this._transformed === !0 ? "BufferGeometry" : this.type, e.name = this.name, Object.keys(this.userData).length > 0 && (e.userData = this.userData), this.parameters !== void 0 && this._transformed !== !0) {
			let t = this.parameters;
			for (let n in t) t[n] !== void 0 && (e[n] = t[n]);
			return e;
		}
		e.data = { attributes: {} };
		let t = this.index;
		t !== null && (e.data.index = {
			type: t.array.constructor.name,
			array: Array.prototype.slice.call(t.array)
		});
		let n = this.attributes;
		for (let t in n) {
			let r = n[t];
			e.data.attributes[t] = r.toJSON(e.data);
		}
		let r = {}, i = !1;
		for (let t in this.morphAttributes) {
			let n = this.morphAttributes[t], a = [];
			for (let t = 0, r = n.length; t < r; t++) {
				let r = n[t];
				a.push(r.toJSON(e.data));
			}
			a.length > 0 && (r[t] = a, i = !0);
		}
		i && (e.data.morphAttributes = r, e.data.morphTargetsRelative = this.morphTargetsRelative);
		let a = this.groups;
		a.length > 0 && (e.data.groups = JSON.parse(JSON.stringify(a)));
		let o = this.boundingSphere;
		return o !== null && (e.data.boundingSphere = o.toJSON()), e;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		this.index = null, this.attributes = {}, this.morphAttributes = {}, this.groups = [], this.boundingBox = null, this.boundingSphere = null;
		let t = {};
		this.name = e.name;
		let n = e.index;
		n !== null && this.setIndex(n.clone());
		let r = e.attributes;
		for (let e in r) {
			let n = r[e];
			this.setAttribute(e, n.clone(t));
		}
		let i = e.morphAttributes;
		for (let e in i) {
			let n = [], r = i[e];
			for (let e = 0, i = r.length; e < i; e++) n.push(r[e].clone(t));
			this.morphAttributes[e] = n;
		}
		this.morphTargetsRelative = e.morphTargetsRelative;
		let a = e.groups;
		for (let e = 0, t = a.length; e < t; e++) {
			let t = a[e];
			this.addGroup(t.start, t.count, t.materialIndex);
		}
		let o = e.boundingBox;
		o !== null && (this.boundingBox = o.clone());
		let s = e.boundingSphere;
		return s !== null && (this.boundingSphere = s.clone()), this.drawRange.start = e.drawRange.start, this.drawRange.count = e.drawRange.count, this.userData = e.userData, this._transformed = e._transformed, this;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
}, Er = /*@__PURE__*/ new Y(), Dr = /*@__PURE__*/ new Y(), Or = /*@__PURE__*/ new X(), kr = class {
	constructor(e = new Y(1, 0, 0), t = 0) {
		this.isPlane = !0, this.normal = e, this.constant = t;
	}
	set(e, t) {
		return this.normal.copy(e), this.constant = t, this;
	}
	setComponents(e, t, n, r) {
		return this.normal.set(e, t, n), this.constant = r, this;
	}
	setFromNormalAndCoplanarPoint(e, t) {
		return this.normal.copy(e), this.constant = -t.dot(this.normal), this;
	}
	setFromCoplanarPoints(e, t, n) {
		let r = Er.subVectors(n, t).cross(Dr.subVectors(e, t)).normalize();
		return this.setFromNormalAndCoplanarPoint(r, e), this;
	}
	copy(e) {
		return this.normal.copy(e.normal), this.constant = e.constant, this;
	}
	normalize() {
		let e = 1 / this.normal.length();
		return this.normal.multiplyScalar(e), this.constant *= e, this;
	}
	negate() {
		return this.constant *= -1, this.normal.negate(), this;
	}
	distanceToPoint(e) {
		return this.normal.dot(e) + this.constant;
	}
	distanceToSphere(e) {
		return this.distanceToPoint(e.center) - e.radius;
	}
	projectPoint(e, t) {
		return t.copy(e).addScaledVector(this.normal, -this.distanceToPoint(e));
	}
	intersectLine(e, t, n = !0) {
		let r = e.delta(Er), i = this.normal.dot(r);
		if (i === 0) return this.distanceToPoint(e.start) === 0 ? t.copy(e.start) : null;
		let a = -(e.start.dot(this.normal) + this.constant) / i;
		return n === !0 && (a < 0 || a > 1) ? null : t.copy(e.start).addScaledVector(r, a);
	}
	intersectsLine(e) {
		let t = this.distanceToPoint(e.start), n = this.distanceToPoint(e.end);
		return t < 0 && n > 0 || n < 0 && t > 0;
	}
	intersectsBox(e) {
		return e.intersectsPlane(this);
	}
	intersectsSphere(e) {
		return e.intersectsPlane(this);
	}
	coplanarPoint(e) {
		return e.copy(this.normal).multiplyScalar(-this.constant);
	}
	applyMatrix4(e, t) {
		let n = t || Or.getNormalMatrix(e), r = this.coplanarPoint(Er).applyMatrix4(e), i = this.normal.applyMatrix3(n).normalize();
		return this.constant = -r.dot(i), this;
	}
	translate(e) {
		return this.constant -= e.dot(this.normal), this;
	}
	equals(e) {
		return e.normal.equals(this.normal) && e.constant === this.constant;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	toJSON() {
		return {
			normal: this.normal.toArray(),
			constant: this.constant
		};
	}
	fromJSON(e) {
		return this.normal.fromArray(e.normal), this.constant = e.constant, this;
	}
}, Ar = 0, jr = class extends Ze {
	constructor() {
		super(), this.isMaterial = !0, Object.defineProperty(this, "id", { value: Ar++ }), this.uuid = nt(), this.name = "", this.type = "Material", this.blending = 1, this.side = 0, this.vertexColors = !1, this.opacity = 1, this.transparent = !1, this.alphaHash = !1, this.blendSrc = 204, this.blendDst = 205, this.blendEquation = 100, this.blendSrcAlpha = null, this.blendDstAlpha = null, this.blendEquationAlpha = null, this.blendColor = new Z(0, 0, 0), this.blendAlpha = 0, this.depthFunc = 3, this.depthTest = !0, this.depthWrite = !0, this.stencilWriteMask = 255, this.stencilFunc = 519, this.stencilRef = 0, this.stencilFuncMask = 255, this.stencilFail = Le, this.stencilZFail = Le, this.stencilZPass = Le, this.stencilWrite = !1, this.clippingPlanes = null, this.clipIntersection = !1, this.clipShadows = !1, this.shadowSide = null, this.colorWrite = !0, this.precision = null, this.polygonOffset = !1, this.polygonOffsetFactor = 0, this.polygonOffsetUnits = 0, this.dithering = !1, this.alphaToCoverage = !1, this.premultipliedAlpha = !1, this.forceSinglePass = !1, this.allowOverride = !0, this.visible = !0, this.toneMapped = !0, this.userData = {}, this.version = 0, this._alphaTest = 0;
	}
	get alphaTest() {
		return this._alphaTest;
	}
	set alphaTest(e) {
		this._alphaTest > 0 != e > 0 && this.version++, this._alphaTest = e;
	}
	onBeforeRender() {}
	onBeforeCompile() {}
	customProgramCacheKey() {
		return this.onBeforeCompile.toString();
	}
	setValues(e) {
		if (e !== void 0) for (let t in e) {
			let n = e[t];
			if (n === void 0) {
				G(`Material: parameter '${t}' has value of undefined.`);
				continue;
			}
			let r = this[t];
			r === void 0 ? G(`Material: '${t}' is not a property of THREE.${this.type}.`) : r && r.isColor ? r.set(n) : r && r.isVector2 && n && n.isVector2 || r && r.isEuler && n && n.isEuler || r && r.isVector3 && n && n.isVector3 ? r.copy(n) : this[t] = n;
		}
	}
	toJSON(e) {
		let t = e === void 0 || typeof e == "string";
		t && (e = {
			textures: {},
			images: {}
		});
		let n = { metadata: {
			version: 4.7,
			type: "Material",
			generator: "Material.toJSON"
		} };
		n.uuid = this.uuid, n.type = this.type, n.blending = this.blending, n.side = this.side, n.shadowSide = this.shadowSide, n.vertexColors = this.vertexColors, n.opacity = this.opacity, n.transparent = this.transparent, n.blendSrc = this.blendSrc, n.blendDst = this.blendDst, n.blendEquation = this.blendEquation, n.blendSrcAlpha = this.blendSrcAlpha, n.blendDstAlpha = this.blendDstAlpha, n.blendEquationAlpha = this.blendEquationAlpha, n.blendColor = this.blendColor.getHex(), n.blendAlpha = this.blendAlpha, n.depthFunc = this.depthFunc, n.depthTest = this.depthTest, n.depthWrite = this.depthWrite, n.colorWrite = this.colorWrite, n.clipIntersection = this.clipIntersection, n.clipShadows = this.clipShadows, n.stencilWriteMask = this.stencilWriteMask, n.stencilFunc = this.stencilFunc, n.stencilRef = this.stencilRef, n.stencilFuncMask = this.stencilFuncMask, n.stencilFail = this.stencilFail, n.stencilZFail = this.stencilZFail, n.stencilZPass = this.stencilZPass, n.stencilWrite = this.stencilWrite, n.polygonOffset = this.polygonOffset, n.polygonOffsetFactor = this.polygonOffsetFactor, n.polygonOffsetUnits = this.polygonOffsetUnits, n.dithering = this.dithering, n.alphaTest = this.alphaTest, n.alphaHash = this.alphaHash, n.alphaToCoverage = this.alphaToCoverage, n.premultipliedAlpha = this.premultipliedAlpha, n.forceSinglePass = this.forceSinglePass, n.allowOverride = this.allowOverride, n.visible = this.visible, n.toneMapped = this.toneMapped, n.name = this.name, this.color && this.color.isColor && (n.color = this.color.getHex()), this.roughness !== void 0 && (n.roughness = this.roughness), this.metalness !== void 0 && (n.metalness = this.metalness), this.sheen !== void 0 && (n.sheen = this.sheen), this.sheenColor && this.sheenColor.isColor && (n.sheenColor = this.sheenColor.getHex()), this.sheenRoughness !== void 0 && (n.sheenRoughness = this.sheenRoughness), this.emissive && this.emissive.isColor && (n.emissive = this.emissive.getHex()), this.emissiveIntensity !== void 0 && (n.emissiveIntensity = this.emissiveIntensity), this.specular && this.specular.isColor && (n.specular = this.specular.getHex()), this.specularIntensity !== void 0 && (n.specularIntensity = this.specularIntensity), this.specularColor && this.specularColor.isColor && (n.specularColor = this.specularColor.getHex()), this.shininess !== void 0 && (n.shininess = this.shininess), this.clearcoat !== void 0 && (n.clearcoat = this.clearcoat), this.clearcoatRoughness !== void 0 && (n.clearcoatRoughness = this.clearcoatRoughness), this.diffuseRoughness !== void 0 && (n.diffuseRoughness = this.diffuseRoughness), this.diffuseRoughnessMap && this.diffuseRoughnessMap.isTexture && (n.diffuseRoughnessMap = this.diffuseRoughnessMap.toJSON(e).uuid), this.clearcoatMap && this.clearcoatMap.isTexture && (n.clearcoatMap = this.clearcoatMap.toJSON(e).uuid), this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture && (n.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(e).uuid), this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture && (n.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(e).uuid, n.clearcoatNormalScale = this.clearcoatNormalScale.toArray()), this.sheenColorMap && this.sheenColorMap.isTexture && (n.sheenColorMap = this.sheenColorMap.toJSON(e).uuid), this.sheenRoughnessMap && this.sheenRoughnessMap.isTexture && (n.sheenRoughnessMap = this.sheenRoughnessMap.toJSON(e).uuid), this.dispersion !== void 0 && (n.dispersion = this.dispersion), this.retroreflectivity !== void 0 && (n.retroreflectivity = this.retroreflectivity), this.iridescence !== void 0 && (n.iridescence = this.iridescence), this.iridescenceIOR !== void 0 && (n.iridescenceIOR = this.iridescenceIOR), this.iridescenceThicknessMinimum !== void 0 && (n.iridescenceThicknessMinimum = this.iridescenceThicknessMinimum), this.iridescenceThicknessMaximum !== void 0 && (n.iridescenceThicknessMaximum = this.iridescenceThicknessMaximum), this.iridescenceMap && this.iridescenceMap.isTexture && (n.iridescenceMap = this.iridescenceMap.toJSON(e).uuid), this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture && (n.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(e).uuid), this.anisotropy !== void 0 && (n.anisotropy = this.anisotropy), this.anisotropyRotation !== void 0 && (n.anisotropyRotation = this.anisotropyRotation), this.anisotropyMap && this.anisotropyMap.isTexture && (n.anisotropyMap = this.anisotropyMap.toJSON(e).uuid), this.map && this.map.isTexture && (n.map = this.map.toJSON(e).uuid), this.matcap && this.matcap.isTexture && (n.matcap = this.matcap.toJSON(e).uuid), this.alphaMap && this.alphaMap.isTexture && (n.alphaMap = this.alphaMap.toJSON(e).uuid), this.lightMap && this.lightMap.isTexture && (n.lightMap = this.lightMap.toJSON(e).uuid, n.lightMapIntensity = this.lightMapIntensity), this.aoMap && this.aoMap.isTexture && (n.aoMap = this.aoMap.toJSON(e).uuid, n.aoMapIntensity = this.aoMapIntensity), this.bumpMap && this.bumpMap.isTexture && (n.bumpMap = this.bumpMap.toJSON(e).uuid, n.bumpScale = this.bumpScale), this.normalMap && this.normalMap.isTexture && (n.normalMap = this.normalMap.toJSON(e).uuid, n.normalMapType = this.normalMapType, n.normalScale = this.normalScale.toArray()), this.displacementMap && this.displacementMap.isTexture && (n.displacementMap = this.displacementMap.toJSON(e).uuid, n.displacementScale = this.displacementScale, n.displacementBias = this.displacementBias), this.roughnessMap && this.roughnessMap.isTexture && (n.roughnessMap = this.roughnessMap.toJSON(e).uuid), this.metalnessMap && this.metalnessMap.isTexture && (n.metalnessMap = this.metalnessMap.toJSON(e).uuid), this.emissiveMap && this.emissiveMap.isTexture && (n.emissiveMap = this.emissiveMap.toJSON(e).uuid), this.specularMap && this.specularMap.isTexture && (n.specularMap = this.specularMap.toJSON(e).uuid), this.specularIntensityMap && this.specularIntensityMap.isTexture && (n.specularIntensityMap = this.specularIntensityMap.toJSON(e).uuid), this.specularColorMap && this.specularColorMap.isTexture && (n.specularColorMap = this.specularColorMap.toJSON(e).uuid), this.envMap && this.envMap.isTexture && (n.envMap = this.envMap.toJSON(e).uuid, this.combine !== void 0 && (n.combine = this.combine)), this.envMapRotation !== void 0 && (n.envMapRotation = this.envMapRotation.toArray()), this.envMapIntensity !== void 0 && (n.envMapIntensity = this.envMapIntensity), this.reflectivity !== void 0 && (n.reflectivity = this.reflectivity), this.refractionRatio !== void 0 && (n.refractionRatio = this.refractionRatio), this.gradientMap && this.gradientMap.isTexture && (n.gradientMap = this.gradientMap.toJSON(e).uuid), this.transmission !== void 0 && (n.transmission = this.transmission), this.transmissionMap && this.transmissionMap.isTexture && (n.transmissionMap = this.transmissionMap.toJSON(e).uuid), this.thickness !== void 0 && (n.thickness = this.thickness), this.thicknessMap && this.thicknessMap.isTexture && (n.thicknessMap = this.thicknessMap.toJSON(e).uuid), this.attenuationDistance !== void 0 && (n.attenuationDistance = this.attenuationDistance), this.attenuationColor !== void 0 && (n.attenuationColor = this.attenuationColor.getHex()), this.size !== void 0 && (n.size = this.size), this.sizeAttenuation !== void 0 && (n.sizeAttenuation = this.sizeAttenuation), Array.isArray(this.clippingPlanes) && this.clippingPlanes.length > 0 && (n.clippingPlanes = this.clippingPlanes.map((e) => e.toJSON())), this.rotation !== void 0 && (n.rotation = this.rotation), this.depthPacking !== void 0 && (n.depthPacking = this.depthPacking), this.linewidth !== void 0 && (n.linewidth = this.linewidth), this.linecap !== void 0 && (n.linecap = this.linecap), this.linejoin !== void 0 && (n.linejoin = this.linejoin), this.dashSize !== void 0 && (n.dashSize = this.dashSize), this.gapSize !== void 0 && (n.gapSize = this.gapSize), this.scale !== void 0 && (n.scale = this.scale), this.wireframe !== void 0 && (n.wireframe = this.wireframe), this.wireframeLinewidth !== void 0 && (n.wireframeLinewidth = this.wireframeLinewidth), this.wireframeLinecap !== void 0 && (n.wireframeLinecap = this.wireframeLinecap), this.wireframeLinejoin !== void 0 && (n.wireframeLinejoin = this.wireframeLinejoin), this.flatShading !== void 0 && (n.flatShading = this.flatShading), this.fog !== void 0 && (n.fog = this.fog), Object.keys(this.userData).length > 0 && (n.userData = this.userData);
		function r(e) {
			let t = [];
			for (let n in e) {
				let r = e[n];
				delete r.metadata, t.push(r);
			}
			return t;
		}
		if (t) {
			let t = r(e.textures), i = r(e.images);
			t.length > 0 && (n.textures = t), i.length > 0 && (n.images = i);
		}
		return n;
	}
	fromJSON(e, t) {
		if (e.uuid !== void 0 && (this.uuid = e.uuid), e.name !== void 0 && (this.name = e.name), e.color !== void 0 && this.color !== void 0 && this.color.setHex(e.color), e.roughness !== void 0 && (this.roughness = e.roughness), e.metalness !== void 0 && (this.metalness = e.metalness), e.sheen !== void 0 && (this.sheen = e.sheen), e.sheenColor !== void 0 && (this.sheenColor = new Z().setHex(e.sheenColor)), e.sheenRoughness !== void 0 && (this.sheenRoughness = e.sheenRoughness), e.emissive !== void 0 && this.emissive !== void 0 && this.emissive.setHex(e.emissive), e.specular !== void 0 && this.specular !== void 0 && this.specular.setHex(e.specular), e.specularIntensity !== void 0 && (this.specularIntensity = e.specularIntensity), e.specularColor !== void 0 && this.specularColor !== void 0 && this.specularColor.setHex(e.specularColor), e.shininess !== void 0 && (this.shininess = e.shininess), e.clearcoat !== void 0 && (this.clearcoat = e.clearcoat), e.clearcoatRoughness !== void 0 && (this.clearcoatRoughness = e.clearcoatRoughness), e.diffuseRoughness !== void 0 && (this.diffuseRoughness = e.diffuseRoughness), e.dispersion !== void 0 && (this.dispersion = e.dispersion), e.retroreflectivity !== void 0 && (this.retroreflectivity = e.retroreflectivity), e.iridescence !== void 0 && (this.iridescence = e.iridescence), e.iridescenceIOR !== void 0 && (this.iridescenceIOR = e.iridescenceIOR), e.iridescenceThicknessMinimum !== void 0 && (this.iridescenceThicknessMinimum = e.iridescenceThicknessMinimum), e.iridescenceThicknessMaximum !== void 0 && (this.iridescenceThicknessMaximum = e.iridescenceThicknessMaximum), e.iridescenceThicknessRange !== void 0 && (this.iridescenceThicknessMinimum = e.iridescenceThicknessRange[0], this.iridescenceThicknessMaximum = e.iridescenceThicknessRange[1]), e.transmission !== void 0 && (this.transmission = e.transmission), e.thickness !== void 0 && (this.thickness = e.thickness), e.attenuationDistance !== void 0 && (this.attenuationDistance = e.attenuationDistance), e.attenuationColor !== void 0 && this.attenuationColor !== void 0 && this.attenuationColor.setHex(e.attenuationColor), e.anisotropy !== void 0 && (this.anisotropy = e.anisotropy), e.anisotropyRotation !== void 0 && (this.anisotropyRotation = e.anisotropyRotation), e.fog !== void 0 && (this.fog = e.fog), e.flatShading !== void 0 && (this.flatShading = e.flatShading), e.blending !== void 0 && (this.blending = e.blending), e.combine !== void 0 && (this.combine = e.combine), e.side !== void 0 && (this.side = e.side), e.shadowSide !== void 0 && (this.shadowSide = e.shadowSide), e.opacity !== void 0 && (this.opacity = e.opacity), e.transparent !== void 0 && (this.transparent = e.transparent), e.alphaTest !== void 0 && (this.alphaTest = e.alphaTest), e.alphaHash !== void 0 && (this.alphaHash = e.alphaHash), e.depthFunc !== void 0 && (this.depthFunc = e.depthFunc), e.depthTest !== void 0 && (this.depthTest = e.depthTest), e.depthWrite !== void 0 && (this.depthWrite = e.depthWrite), e.colorWrite !== void 0 && (this.colorWrite = e.colorWrite), e.clippingPlanes !== void 0 && (this.clippingPlanes = e.clippingPlanes.map((e) => new kr().fromJSON(e))), e.clipIntersection !== void 0 && (this.clipIntersection = e.clipIntersection), e.clipShadows !== void 0 && (this.clipShadows = e.clipShadows), e.depthPacking !== void 0 && (this.depthPacking = e.depthPacking), e.blendSrc !== void 0 && (this.blendSrc = e.blendSrc), e.blendDst !== void 0 && (this.blendDst = e.blendDst), e.blendEquation !== void 0 && (this.blendEquation = e.blendEquation), e.blendSrcAlpha !== void 0 && (this.blendSrcAlpha = e.blendSrcAlpha), e.blendDstAlpha !== void 0 && (this.blendDstAlpha = e.blendDstAlpha), e.blendEquationAlpha !== void 0 && (this.blendEquationAlpha = e.blendEquationAlpha), e.blendColor !== void 0 && this.blendColor !== void 0 && this.blendColor.setHex(e.blendColor), e.blendAlpha !== void 0 && (this.blendAlpha = e.blendAlpha), e.stencilWriteMask !== void 0 && (this.stencilWriteMask = e.stencilWriteMask), e.stencilFunc !== void 0 && (this.stencilFunc = e.stencilFunc), e.stencilRef !== void 0 && (this.stencilRef = e.stencilRef), e.stencilFuncMask !== void 0 && (this.stencilFuncMask = e.stencilFuncMask), e.stencilFail !== void 0 && (this.stencilFail = e.stencilFail), e.stencilZFail !== void 0 && (this.stencilZFail = e.stencilZFail), e.stencilZPass !== void 0 && (this.stencilZPass = e.stencilZPass), e.stencilWrite !== void 0 && (this.stencilWrite = e.stencilWrite), e.wireframe !== void 0 && (this.wireframe = e.wireframe), e.wireframeLinewidth !== void 0 && (this.wireframeLinewidth = e.wireframeLinewidth), e.wireframeLinecap !== void 0 && (this.wireframeLinecap = e.wireframeLinecap), e.wireframeLinejoin !== void 0 && (this.wireframeLinejoin = e.wireframeLinejoin), e.rotation !== void 0 && (this.rotation = e.rotation), e.linewidth !== void 0 && (this.linewidth = e.linewidth), e.linecap !== void 0 && (this.linecap = e.linecap), e.linejoin !== void 0 && (this.linejoin = e.linejoin), e.dashSize !== void 0 && (this.dashSize = e.dashSize), e.gapSize !== void 0 && (this.gapSize = e.gapSize), e.scale !== void 0 && (this.scale = e.scale), e.polygonOffset !== void 0 && (this.polygonOffset = e.polygonOffset), e.polygonOffsetFactor !== void 0 && (this.polygonOffsetFactor = e.polygonOffsetFactor), e.polygonOffsetUnits !== void 0 && (this.polygonOffsetUnits = e.polygonOffsetUnits), e.dithering !== void 0 && (this.dithering = e.dithering), e.alphaToCoverage !== void 0 && (this.alphaToCoverage = e.alphaToCoverage), e.premultipliedAlpha !== void 0 && (this.premultipliedAlpha = e.premultipliedAlpha), e.forceSinglePass !== void 0 && (this.forceSinglePass = e.forceSinglePass), e.allowOverride !== void 0 && (this.allowOverride = e.allowOverride), e.visible !== void 0 && (this.visible = e.visible), e.toneMapped !== void 0 && (this.toneMapped = e.toneMapped), e.userData !== void 0 && (this.userData = e.userData), e.vertexColors !== void 0 && (this.vertexColors = typeof e.vertexColors == "number" ? e.vertexColors > 0 : e.vertexColors), e.size !== void 0 && (this.size = e.size), e.sizeAttenuation !== void 0 && (this.sizeAttenuation = e.sizeAttenuation), e.map !== void 0 && (this.map = t[e.map] || null), e.matcap !== void 0 && (this.matcap = t[e.matcap] || null), e.alphaMap !== void 0 && (this.alphaMap = t[e.alphaMap] || null), e.bumpMap !== void 0 && (this.bumpMap = t[e.bumpMap] || null), e.bumpScale !== void 0 && (this.bumpScale = e.bumpScale), e.normalMap !== void 0 && (this.normalMap = t[e.normalMap] || null), e.normalMapType !== void 0 && (this.normalMapType = e.normalMapType), e.normalScale !== void 0) {
			let t = e.normalScale;
			Array.isArray(t) === !1 && (t = [t, t]), this.normalScale = new J().fromArray(t);
		}
		return e.displacementMap !== void 0 && (this.displacementMap = t[e.displacementMap] || null), e.displacementScale !== void 0 && (this.displacementScale = e.displacementScale), e.displacementBias !== void 0 && (this.displacementBias = e.displacementBias), e.roughnessMap !== void 0 && (this.roughnessMap = t[e.roughnessMap] || null), e.metalnessMap !== void 0 && (this.metalnessMap = t[e.metalnessMap] || null), e.emissiveMap !== void 0 && (this.emissiveMap = t[e.emissiveMap] || null), e.emissiveIntensity !== void 0 && (this.emissiveIntensity = e.emissiveIntensity), e.specularMap !== void 0 && (this.specularMap = t[e.specularMap] || null), e.specularIntensityMap !== void 0 && (this.specularIntensityMap = t[e.specularIntensityMap] || null), e.specularColorMap !== void 0 && (this.specularColorMap = t[e.specularColorMap] || null), e.envMap !== void 0 && (this.envMap = t[e.envMap] || null), e.envMapRotation !== void 0 && this.envMapRotation.fromArray(e.envMapRotation), e.envMapIntensity !== void 0 && (this.envMapIntensity = e.envMapIntensity), e.reflectivity !== void 0 && (this.reflectivity = e.reflectivity), e.refractionRatio !== void 0 && (this.refractionRatio = e.refractionRatio), e.lightMap !== void 0 && (this.lightMap = t[e.lightMap] || null), e.lightMapIntensity !== void 0 && (this.lightMapIntensity = e.lightMapIntensity), e.aoMap !== void 0 && (this.aoMap = t[e.aoMap] || null), e.aoMapIntensity !== void 0 && (this.aoMapIntensity = e.aoMapIntensity), e.gradientMap !== void 0 && (this.gradientMap = t[e.gradientMap] || null), e.clearcoatMap !== void 0 && (this.clearcoatMap = t[e.clearcoatMap] || null), e.clearcoatRoughnessMap !== void 0 && (this.clearcoatRoughnessMap = t[e.clearcoatRoughnessMap] || null), e.clearcoatNormalMap !== void 0 && (this.clearcoatNormalMap = t[e.clearcoatNormalMap] || null), e.clearcoatNormalScale !== void 0 && (this.clearcoatNormalScale = new J().fromArray(e.clearcoatNormalScale)), e.diffuseRoughnessMap !== void 0 && (this.diffuseRoughnessMap = t[e.diffuseRoughnessMap] || null), e.iridescenceMap !== void 0 && (this.iridescenceMap = t[e.iridescenceMap] || null), e.iridescenceThicknessMap !== void 0 && (this.iridescenceThicknessMap = t[e.iridescenceThicknessMap] || null), e.transmissionMap !== void 0 && (this.transmissionMap = t[e.transmissionMap] || null), e.thicknessMap !== void 0 && (this.thicknessMap = t[e.thicknessMap] || null), e.anisotropyMap !== void 0 && (this.anisotropyMap = t[e.anisotropyMap] || null), e.sheenColorMap !== void 0 && (this.sheenColorMap = t[e.sheenColorMap] || null), e.sheenRoughnessMap !== void 0 && (this.sheenRoughnessMap = t[e.sheenRoughnessMap] || null), this;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	copy(e) {
		this.name = e.name, this.blending = e.blending, this.side = e.side, this.vertexColors = e.vertexColors, this.opacity = e.opacity, this.transparent = e.transparent, this.blendSrc = e.blendSrc, this.blendDst = e.blendDst, this.blendEquation = e.blendEquation, this.blendSrcAlpha = e.blendSrcAlpha, this.blendDstAlpha = e.blendDstAlpha, this.blendEquationAlpha = e.blendEquationAlpha, this.blendColor.copy(e.blendColor), this.blendAlpha = e.blendAlpha, this.depthFunc = e.depthFunc, this.depthTest = e.depthTest, this.depthWrite = e.depthWrite, this.stencilWriteMask = e.stencilWriteMask, this.stencilFunc = e.stencilFunc, this.stencilRef = e.stencilRef, this.stencilFuncMask = e.stencilFuncMask, this.stencilFail = e.stencilFail, this.stencilZFail = e.stencilZFail, this.stencilZPass = e.stencilZPass, this.stencilWrite = e.stencilWrite;
		let t = e.clippingPlanes, n = null;
		if (t !== null) {
			let e = t.length;
			n = Array(e);
			for (let r = 0; r !== e; ++r) n[r] = t[r].clone();
		}
		return this.clippingPlanes = n, this.clipIntersection = e.clipIntersection, this.clipShadows = e.clipShadows, this.shadowSide = e.shadowSide, this.colorWrite = e.colorWrite, this.precision = e.precision, this.polygonOffset = e.polygonOffset, this.polygonOffsetFactor = e.polygonOffsetFactor, this.polygonOffsetUnits = e.polygonOffsetUnits, this.dithering = e.dithering, this.alphaTest = e.alphaTest, this.alphaHash = e.alphaHash, this.alphaToCoverage = e.alphaToCoverage, this.premultipliedAlpha = e.premultipliedAlpha, this.forceSinglePass = e.forceSinglePass, this.allowOverride = e.allowOverride, this.visible = e.visible, this.toneMapped = e.toneMapped, this.userData = JSON.parse(JSON.stringify(e.userData)), this;
	}
	dispose() {
		this.dispatchEvent({ type: "dispose" });
	}
	set needsUpdate(e) {
		e === !0 && this.version++;
	}
}, Mr = /*@__PURE__*/ new Y(), Nr = /*@__PURE__*/ new Y(), Pr = /*@__PURE__*/ new Y(), Fr = /*@__PURE__*/ new Y(), Ir = class {
	constructor(e = new Y(), t = new Y(0, 0, -1)) {
		this.origin = e, this.direction = t;
	}
	set(e, t) {
		return this.origin.copy(e), this.direction.copy(t), this;
	}
	copy(e) {
		return this.origin.copy(e.origin), this.direction.copy(e.direction), this;
	}
	at(e, t) {
		return t.copy(this.origin).addScaledVector(this.direction, e);
	}
	lookAt(e) {
		return this.direction.copy(e).sub(this.origin).normalize(), this;
	}
	recast(e) {
		return this.origin.copy(this.at(e, Mr)), this;
	}
	closestPointToPoint(e, t) {
		t.subVectors(e, this.origin);
		let n = t.dot(this.direction);
		return n < 0 ? t.copy(this.origin) : t.copy(this.origin).addScaledVector(this.direction, n);
	}
	distanceToPoint(e) {
		return Math.sqrt(this.distanceSqToPoint(e));
	}
	distanceSqToPoint(e) {
		let t = Mr.subVectors(e, this.origin).dot(this.direction);
		return t < 0 ? this.origin.distanceToSquared(e) : (Mr.copy(this.origin).addScaledVector(this.direction, t), Mr.distanceToSquared(e));
	}
	distanceSqToSegment(e, t, n, r) {
		Nr.copy(e).add(t).multiplyScalar(.5), Pr.copy(t).sub(e).normalize(), Fr.copy(this.origin).sub(Nr);
		let i = e.distanceTo(t) * .5, a = -this.direction.dot(Pr), o = Fr.dot(this.direction), s = -Fr.dot(Pr), c = Fr.lengthSq(), l = Math.abs(1 - a * a), u, d, f, p;
		if (l > 0) {
			if (u = a * s - o, d = a * o - s, p = i * l, u >= 0) {
				if (d >= -p) {
					if (d <= p) {
						let e = 1 / l;
						u *= e, d *= e, f = u * (u + a * d + 2 * o) + d * (a * u + d + 2 * s) + c;
					} else d = i, u = Math.max(0, -(a * d + o)), f = -u * u + d * (d + 2 * s) + c;
				} else d = -i, u = Math.max(0, -(a * d + o)), f = -u * u + d * (d + 2 * s) + c;
			} else d <= -p ? (u = Math.max(0, -(-a * i + o)), d = u > 0 ? -i : Math.min(Math.max(-i, -s), i), f = -u * u + d * (d + 2 * s) + c) : d <= p ? (u = 0, d = Math.min(Math.max(-i, -s), i), f = d * (d + 2 * s) + c) : (u = Math.max(0, -(a * i + o)), d = u > 0 ? i : Math.min(Math.max(-i, -s), i), f = -u * u + d * (d + 2 * s) + c);
		} else d = a > 0 ? -i : i, u = Math.max(0, -(a * d + o)), f = -u * u + d * (d + 2 * s) + c;
		return n && n.copy(this.origin).addScaledVector(this.direction, u), r && r.copy(Nr).addScaledVector(Pr, d), f;
	}
	intersectSphere(e, t) {
		if (e.radius < 0) return null;
		Mr.subVectors(e.center, this.origin);
		let n = Mr.dot(this.direction), r = Mr.dot(Mr) - n * n, i = e.radius * e.radius;
		if (r > i) return null;
		let a = Math.sqrt(i - r), o = n - a, s = n + a;
		return s < 0 ? null : o < 0 ? this.at(s, t) : this.at(o, t);
	}
	intersectsSphere(e) {
		return e.radius < 0 ? !1 : this.distanceSqToPoint(e.center) <= e.radius * e.radius;
	}
	distanceToPlane(e) {
		let t = e.normal.dot(this.direction);
		if (t === 0) return e.distanceToPoint(this.origin) === 0 ? 0 : null;
		let n = -(this.origin.dot(e.normal) + e.constant) / t;
		return n >= 0 ? n : null;
	}
	intersectPlane(e, t) {
		let n = this.distanceToPlane(e);
		return n === null ? null : this.at(n, t);
	}
	intersectsPlane(e) {
		let t = e.distanceToPoint(this.origin);
		return t === 0 || e.normal.dot(this.direction) * t < 0;
	}
	intersectBox(e, t) {
		let n, r, i, a, o, s, c = 1 / this.direction.x, l = 1 / this.direction.y, u = 1 / this.direction.z, d = this.origin;
		return c >= 0 ? (n = (e.min.x - d.x) * c, r = (e.max.x - d.x) * c) : (n = (e.max.x - d.x) * c, r = (e.min.x - d.x) * c), l >= 0 ? (i = (e.min.y - d.y) * l, a = (e.max.y - d.y) * l) : (i = (e.max.y - d.y) * l, a = (e.min.y - d.y) * l), n > a || i > r || ((i > n || isNaN(n)) && (n = i), (a < r || isNaN(r)) && (r = a), u >= 0 ? (o = (e.min.z - d.z) * u, s = (e.max.z - d.z) * u) : (o = (e.max.z - d.z) * u, s = (e.min.z - d.z) * u), n > s || o > r) || ((o > n || n !== n) && (n = o), (s < r || r !== r) && (r = s), r < 0) ? null : this.at(n >= 0 ? n : r, t);
	}
	intersectsBox(e) {
		return this.intersectBox(e, Mr) !== null;
	}
	intersectTriangle(e, t, n, r, i) {
		let a = this.origin, o = this.direction, s = o.x, c = o.y, l = o.z, u = e.x - a.x, d = e.y - a.y, f = e.z - a.z, p = t.x - a.x, m = t.y - a.y, h = t.z - a.z, g = n.x - a.x, _ = n.y - a.y, v = n.z - a.z, y = Math.abs(s), b = Math.abs(c), x = Math.abs(l), S, C, w, T, E, D, O, k, A, j, M, N;
		if (y >= b && y >= x ? (w = s, D = u, A = p, N = g, s >= 0 ? (S = c, C = l, T = d, E = f, O = m, k = h, j = _, M = v) : (S = l, C = c, T = f, E = d, O = h, k = m, j = v, M = _)) : b >= x ? (w = c, D = d, A = m, N = _, c >= 0 ? (S = l, C = s, T = f, E = u, O = h, k = p, j = v, M = g) : (S = s, C = l, T = u, E = f, O = p, k = h, j = g, M = v)) : (w = l, D = f, A = h, N = v, l >= 0 ? (S = s, C = c, T = u, E = d, O = p, k = m, j = g, M = _) : (S = c, C = s, T = d, E = u, O = m, k = p, j = _, M = g)), w === 0) return null;
		let P = S / w, F = C / w, I = 1 / w, L = T - P * D, R = E - F * D, ee = O - P * A, te = k - F * A, z = j - P * N, ne = M - F * N, re = z * te - ne * ee, B = L * ne - R * z, ie = ee * R - te * L;
		if (r) {
			if (re < 0 || B < 0 || ie < 0) return null;
		} else if ((re < 0 || B < 0 || ie < 0) && (re > 0 || B > 0 || ie > 0)) return null;
		let ae = re + B + ie;
		if (ae === 0) return null;
		let oe = I * (re * D + B * A + ie * N);
		return (ae > 0 ? oe < 0 : oe > 0) ? null : this.at(oe / ae, i);
	}
	applyMatrix4(e) {
		return this.origin.applyMatrix4(e), this.direction.transformDirection(e), this;
	}
	equals(e) {
		return e.origin.equals(this.origin) && e.direction.equals(this.direction);
	}
	clone() {
		return new this.constructor().copy(this);
	}
}, Lr = class extends jr {
	constructor(e) {
		super(), this.isMeshBasicMaterial = !0, this.type = "MeshBasicMaterial", this.color = new Z(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new an(), this.combine = 0, this.reflectivity = 1, this.refractionRatio = .98, this.wireframe = !1, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.fog = !0, this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.color.copy(e.color), this.map = e.map, this.lightMap = e.lightMap, this.lightMapIntensity = e.lightMapIntensity, this.aoMap = e.aoMap, this.aoMapIntensity = e.aoMapIntensity, this.specularMap = e.specularMap, this.alphaMap = e.alphaMap, this.envMap = e.envMap, this.envMapRotation.copy(e.envMapRotation), this.combine = e.combine, this.reflectivity = e.reflectivity, this.refractionRatio = e.refractionRatio, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.wireframeLinecap = e.wireframeLinecap, this.wireframeLinejoin = e.wireframeLinejoin, this.fog = e.fog, this;
	}
}, Rr = /*@__PURE__*/ new Jt(), zr = /*@__PURE__*/ new Ir(), Br = /*@__PURE__*/ new _r(), Vr = /*@__PURE__*/ new Y(), Hr = /*@__PURE__*/ new Y(), Ur = /*@__PURE__*/ new Y(), Wr = /*@__PURE__*/ new Y(), Gr = /*@__PURE__*/ new Y(), Kr = /*@__PURE__*/ new Y(), qr = /*@__PURE__*/ new Y(), Jr = /*@__PURE__*/ new Y(), Yr = class extends Sn {
	constructor(e = new Tr(), t = new Lr()) {
		super(), this.isMesh = !0, this.type = "Mesh", this.geometry = e, this.material = t, this.morphTargetDictionary = void 0, this.morphTargetInfluences = void 0, this.count = 1, this.updateMorphTargets();
	}
	copy(e, t) {
		return super.copy(e, t), this.morphTargetInfluences = e.morphTargetInfluences === void 0 ? void 0 : e.morphTargetInfluences.slice(), this.morphTargetDictionary = e.morphTargetDictionary === void 0 ? void 0 : Object.assign({}, e.morphTargetDictionary), this.material = Array.isArray(e.material) ? e.material.slice() : e.material, this.geometry = e.geometry, this;
	}
	updateMorphTargets() {
		let e = this.geometry.morphAttributes, t = Object.keys(e);
		if (t.length > 0) {
			let n = e[t[0]];
			if (n !== void 0) {
				this.morphTargetInfluences = [], this.morphTargetDictionary = {};
				for (let e = 0, t = n.length; e < t; e++) {
					let t = n[e].name || String(e);
					this.morphTargetInfluences.push(0), this.morphTargetDictionary[t] = e;
				}
			}
		}
	}
	getVertexPosition(e, t) {
		let n = this.geometry, r = n.attributes.position, i = n.morphAttributes.position, a = n.morphTargetsRelative;
		t.fromBufferAttribute(r, e);
		let o = this.morphTargetInfluences;
		if (i && o) {
			Kr.set(0, 0, 0);
			for (let n = 0, r = i.length; n < r; n++) {
				let r = o[n], s = i[n];
				r !== 0 && (Gr.fromBufferAttribute(s, e), a ? Kr.addScaledVector(Gr, r) : Kr.addScaledVector(Gr.sub(t), r));
			}
			t.add(Kr);
		}
		return t;
	}
	intersectsFrustum(e) {
		return e.intersectsObject(this);
	}
	raycast(e, t) {
		let n = this.geometry, r = this.material, i = this.matrixWorld;
		r !== void 0 && (n.boundingSphere === null && n.computeBoundingSphere(), Br.copy(n.boundingSphere), Br.applyMatrix4(i), zr.copy(e.ray).recast(e.near), Br.containsPoint(zr.origin) === !1 && (zr.intersectSphere(Br, Vr) === null || zr.origin.distanceToSquared(Vr) > (e.far - e.near) ** 2) || (Rr.copy(i).invert(), zr.copy(e.ray).applyMatrix4(Rr), (n.boundingBox === null || zr.intersectsBox(n.boundingBox) !== !1) && this._computeIntersections(e, t, zr)));
	}
	_computeIntersections(e, t, n) {
		let r, i = this.geometry, a = this.material, o = i.index, s = i.attributes.position, c = i.attributes.uv, l = i.attributes.uv1, u = i.attributes.normal, d = i.groups, f = i.drawRange;
		if (o !== null) {
			if (Array.isArray(a)) for (let i = 0, s = d.length; i < s; i++) {
				let s = d[i], p = a[s.materialIndex], m = Math.max(s.start, f.start), h = Math.min(o.count, Math.min(s.start + s.count, f.start + f.count));
				for (let i = m, a = h; i < a; i += 3) {
					let a = o.getX(i), d = o.getX(i + 1), f = o.getX(i + 2);
					r = Zr(this, p, e, n, c, l, u, a, d, f), r && (r.faceIndex = Math.floor(i / 3), r.face.materialIndex = s.materialIndex, t.push(r));
				}
			}
			else {
				let i = Math.max(0, f.start), s = Math.min(o.count, f.start + f.count);
				for (let d = i, f = s; d < f; d += 3) {
					let i = o.getX(d), s = o.getX(d + 1), f = o.getX(d + 2);
					r = Zr(this, a, e, n, c, l, u, i, s, f), r && (r.faceIndex = Math.floor(d / 3), t.push(r));
				}
			}
		} else if (s !== void 0) {
			if (Array.isArray(a)) for (let i = 0, o = d.length; i < o; i++) {
				let o = d[i], p = a[o.materialIndex], m = Math.max(o.start, f.start), h = Math.min(s.count, Math.min(o.start + o.count, f.start + f.count));
				for (let i = m, a = h; i < a; i += 3) {
					let a = i, s = i + 1, d = i + 2;
					r = Zr(this, p, e, n, c, l, u, a, s, d), r && (r.faceIndex = Math.floor(i / 3), r.face.materialIndex = o.materialIndex, t.push(r));
				}
			}
			else {
				let i = Math.max(0, f.start), o = Math.min(s.count, f.start + f.count);
				for (let s = i, d = o; s < d; s += 3) {
					let i = s, o = s + 1, d = s + 2;
					r = Zr(this, a, e, n, c, l, u, i, o, d), r && (r.faceIndex = Math.floor(s / 3), t.push(r));
				}
			}
		}
	}
};
function Xr(e, t, n, r, i, a, o, s) {
	let c;
	if (c = t.side === 1 ? r.intersectTriangle(o, a, i, !0, s) : r.intersectTriangle(i, a, o, t.side === 0, s), c === null) return null;
	Jr.copy(s), Jr.applyMatrix4(e.matrixWorld);
	let l = n.ray.origin.distanceTo(Jr);
	return l < n.near || l > n.far ? null : {
		distance: l,
		point: Jr.clone(),
		object: e
	};
}
function Zr(e, t, n, r, i, a, o, s, c, l) {
	e.getVertexPosition(s, Hr), e.getVertexPosition(c, Ur), e.getVertexPosition(l, Wr);
	let u = Xr(e, t, n, r, Hr, Ur, Wr, qr);
	if (u) {
		let e = new Y();
		Gn.getBarycoord(qr, Hr, Ur, Wr, e), i && (u.uv = Gn.getInterpolatedAttribute(i, s, c, l, e, new J())), a && (u.uv1 = Gn.getInterpolatedAttribute(a, s, c, l, e, new J())), o && (u.normal = Gn.getInterpolatedAttribute(o, s, c, l, e, new Y()), u.normal.dot(r.direction) > 0 && u.normal.multiplyScalar(-1));
		let t = {
			a: s,
			b: c,
			c: l,
			normal: new Y(),
			materialIndex: 0
		};
		Gn.getNormal(Hr, Ur, Wr, t.normal), u.face = t, u.barycoord = e;
	}
	return u;
}
var Qr = class extends Ht {
	constructor(e = null, t = 1, n = 1, r, i, o, s, c, l = a, u = a, d, f) {
		super(null, o, s, c, l, u, r, i, d, f), this.isDataTexture = !0, this.image = {
			data: e,
			width: t,
			height: n
		}, this.generateMipmaps = !1, this.flipY = !1, this.unpackAlignment = 1;
	}
}, $r = class extends ur {
	constructor(e, t, n, r = 1) {
		super(e, t, n), this.isInstancedBufferAttribute = !0, this.meshPerAttribute = r;
	}
	copy(e) {
		return super.copy(e), this.meshPerAttribute = e.meshPerAttribute, this;
	}
	toJSON() {
		let e = super.toJSON();
		return e.meshPerAttribute = this.meshPerAttribute, e.isInstancedBufferAttribute = !0, e;
	}
}, ei = /*@__PURE__*/ new _r(), ti = /*@__PURE__*/ new J(.5, .5), ni = /*@__PURE__*/ new Y(), ri = class {
	constructor(e = new kr(), t = new kr(), n = new kr(), r = new kr(), i = new kr(), a = new kr()) {
		this.planes = [
			e,
			t,
			n,
			r,
			i,
			a
		];
	}
	set(e, t, n, r, i, a) {
		let o = this.planes;
		return o[0].copy(e), o[1].copy(t), o[2].copy(n), o[3].copy(r), o[4].copy(i), o[5].copy(a), this;
	}
	copy(e) {
		let t = this.planes;
		for (let n = 0; n < 6; n++) t[n].copy(e.planes[n]);
		return this;
	}
	setFromProjectionMatrix(e, t = Be, n = !1) {
		let r = this.planes, i = e.elements, a = i[0], o = i[1], s = i[2], c = i[3], l = i[4], u = i[5], d = i[6], f = i[7], p = i[8], m = i[9], h = i[10], g = i[11], _ = i[12], v = i[13], y = i[14], b = i[15];
		if (r[0].setComponents(c - a, f - l, g - p, b - _).normalize(), r[1].setComponents(c + a, f + l, g + p, b + _).normalize(), r[2].setComponents(c + o, f + u, g + m, b + v).normalize(), r[3].setComponents(c - o, f - u, g - m, b - v).normalize(), n) r[4].setComponents(s, d, h, y).normalize(), r[5].setComponents(c - s, f - d, g - h, b - y).normalize();
		else if (r[4].setComponents(c - s, f - d, g - h, b - y).normalize(), t === 2e3) r[5].setComponents(c + s, f + d, g + h, b + y).normalize();
		else if (t === 2001) r[5].setComponents(s, d, h, y).normalize();
		else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: " + t);
		return this;
	}
	intersectsObject(e) {
		if (e.boundingSphere !== void 0) e.boundingSphere === null && e.computeBoundingSphere(), ei.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);
		else {
			let t = e.geometry;
			t.boundingSphere === null && t.computeBoundingSphere(), ei.copy(t.boundingSphere).applyMatrix4(e.matrixWorld);
		}
		return this.intersectsSphere(ei);
	}
	intersectsSprite(e) {
		return ei.center.set(0, 0, 0), ei.radius = .7071067811865476 + ti.distanceTo(e.center), ei.applyMatrix4(e.matrixWorld), this.intersectsSphere(ei);
	}
	intersectsSphere(e) {
		let t = this.planes, n = e.center, r = -e.radius;
		for (let e = 0; e < 6; e++) if (t[e].distanceToPoint(n) < r) return !1;
		return !0;
	}
	intersectsBox(e) {
		let t = this.planes;
		for (let n = 0; n < 6; n++) {
			let r = t[n];
			if (ni.x = r.normal.x > 0 ? e.max.x : e.min.x, ni.y = r.normal.y > 0 ? e.max.y : e.min.y, ni.z = r.normal.z > 0 ? e.max.z : e.min.z, r.distanceToPoint(ni) < 0) return !1;
		}
		return !0;
	}
	containsPoint(e) {
		let t = this.planes;
		for (let n = 0; n < 6; n++) if (t[n].distanceToPoint(e) < 0) return !1;
		return !0;
	}
	clone() {
		return new this.constructor().copy(this);
	}
}, ii = /*@__PURE__*/ new Jt(), ai = class e {
	constructor() {
		this.coordinateSystem = Be, this._frustums = [], this._count = 0;
	}
	setFromArrayCamera(e) {
		let t = e.cameras, n = this._frustums;
		for (let e = 0; e < t.length; e++) {
			let r = t[e];
			ii.multiplyMatrices(r.projectionMatrix, r.matrixWorldInverse), n[e] === void 0 && (n[e] = new ri()), n[e].setFromProjectionMatrix(ii, r.coordinateSystem, r.reversedDepth);
		}
		return this._count = t.length, this;
	}
	getFrustum(e) {
		return this._frustums[e];
	}
	intersectsObject(e) {
		let t = this._frustums;
		for (let n = 0; n < this._count; n++) if (t[n].intersectsObject(e)) return !0;
		return !1;
	}
	intersectsSprite(e) {
		let t = this._frustums;
		for (let n = 0; n < this._count; n++) if (t[n].intersectsSprite(e)) return !0;
		return !1;
	}
	intersectsSphere(e) {
		let t = this._frustums;
		for (let n = 0; n < this._count; n++) if (t[n].intersectsSphere(e)) return !0;
		return !1;
	}
	intersectsBox(e) {
		let t = this._frustums;
		for (let n = 0; n < this._count; n++) if (t[n].intersectsBox(e)) return !0;
		return !1;
	}
	containsPoint(e) {
		let t = this._frustums;
		for (let n = 0; n < this._count; n++) if (t[n].containsPoint(e)) return !0;
		return !1;
	}
	copy(e) {
		this.coordinateSystem = e.coordinateSystem;
		let t = this._frustums, n = e._frustums;
		for (let r = 0; r < e._count; r++) t[r] === void 0 && (t[r] = new ri()), t[r].copy(n[r]);
		return this._count = e._count, this;
	}
	clone() {
		return new e().copy(this);
	}
}, oi = class extends jr {
	constructor(e) {
		super(), this.isLineBasicMaterial = !0, this.type = "LineBasicMaterial", this.color = new Z(16777215), this.map = null, this.linewidth = 1, this.linecap = "round", this.linejoin = "round", this.fog = !0, this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.color.copy(e.color), this.map = e.map, this.linewidth = e.linewidth, this.linecap = e.linecap, this.linejoin = e.linejoin, this.fog = e.fog, this;
	}
}, si = /*@__PURE__*/ new Y(), ci = /*@__PURE__*/ new Y(), li = /*@__PURE__*/ new Jt(), ui = /*@__PURE__*/ new Ir(), di = /*@__PURE__*/ new _r(), fi = /*@__PURE__*/ new Y(), pi = /*@__PURE__*/ new Y(), mi = class extends Sn {
	constructor(e = new Tr(), t = new oi()) {
		super(), this.isLine = !0, this.type = "Line", this.geometry = e, this.material = t, this.morphTargetDictionary = void 0, this.morphTargetInfluences = void 0, this.updateMorphTargets();
	}
	copy(e, t) {
		return super.copy(e, t), this.morphTargetInfluences = e.morphTargetInfluences === void 0 ? void 0 : e.morphTargetInfluences.slice(), this.morphTargetDictionary = e.morphTargetDictionary === void 0 ? void 0 : Object.assign({}, e.morphTargetDictionary), this.material = Array.isArray(e.material) ? e.material.slice() : e.material, this.geometry = e.geometry, this;
	}
	computeLineDistances() {
		let e = this.geometry;
		if (e.index === null) {
			let t = e.attributes.position, n = [0];
			for (let e = 1, r = t.count; e < r; e++) si.fromBufferAttribute(t, e - 1), ci.fromBufferAttribute(t, e), n[e] = n[e - 1], n[e] += si.distanceTo(ci);
			e.setAttribute("lineDistance", new pr(n, 1));
		} else G("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
		return this;
	}
	intersectsFrustum(e) {
		return e.intersectsObject(this);
	}
	raycast(e, t) {
		let n = this.geometry, r = this.matrixWorld, i = e.params.Line.threshold, a = n.drawRange;
		if (n.boundingSphere === null && n.computeBoundingSphere(), di.copy(n.boundingSphere), di.applyMatrix4(r), di.radius += i, e.ray.intersectsSphere(di) === !1) return;
		li.copy(r).invert(), ui.copy(e.ray).applyMatrix4(li);
		let o = i / ((this.scale.x + this.scale.y + this.scale.z) / 3), s = o * o, c = this.isLineSegments ? 2 : 1, l = n.index, u = n.attributes.position;
		if (l !== null) {
			let n = Math.max(0, a.start), r = Math.min(l.count, a.start + a.count);
			for (let i = n, a = r - 1; i < a; i += c) {
				let n = l.getX(i), r = l.getX(i + 1), a = hi(this, e, ui, s, n, r, i);
				a && t.push(a);
			}
			if (this.isLineLoop) {
				let i = l.getX(r - 1), a = l.getX(n), o = hi(this, e, ui, s, i, a, r - 1);
				o && t.push(o);
			}
		} else {
			let n = Math.max(0, a.start), r = Math.min(u.count, a.start + a.count);
			for (let i = n, a = r - 1; i < a; i += c) {
				let n = hi(this, e, ui, s, i, i + 1, i);
				n && t.push(n);
			}
			if (this.isLineLoop) {
				let i = hi(this, e, ui, s, r - 1, n, r - 1);
				i && t.push(i);
			}
		}
	}
	updateMorphTargets() {
		let e = this.geometry.morphAttributes, t = Object.keys(e);
		if (t.length > 0) {
			let n = e[t[0]];
			if (n !== void 0) {
				this.morphTargetInfluences = [], this.morphTargetDictionary = {};
				for (let e = 0, t = n.length; e < t; e++) {
					let t = n[e].name || String(e);
					this.morphTargetInfluences.push(0), this.morphTargetDictionary[t] = e;
				}
			}
		}
	}
};
function hi(e, t, n, r, i, a, o) {
	let s = e.geometry.attributes.position;
	if (si.fromBufferAttribute(s, i), ci.fromBufferAttribute(s, a), n.distanceSqToSegment(si, ci, fi, pi) > r) return;
	fi.applyMatrix4(e.matrixWorld);
	let c = t.ray.origin.distanceTo(fi);
	if (!(c < t.near || c > t.far)) return {
		distance: c,
		point: pi.clone().applyMatrix4(e.matrixWorld),
		index: o,
		face: null,
		faceIndex: null,
		barycoord: null,
		object: e
	};
}
var gi = /*@__PURE__*/ new Y(), _i = /*@__PURE__*/ new Y(), vi = class extends mi {
	constructor(e, t) {
		super(e, t), this.isLineSegments = !0, this.type = "LineSegments";
	}
	computeLineDistances() {
		let e = this.geometry;
		if (e.index === null) {
			let t = e.attributes.position, n = [];
			for (let e = 0, r = t.count; e < r; e += 2) gi.fromBufferAttribute(t, e), _i.fromBufferAttribute(t, e + 1), n[e] = e === 0 ? 0 : n[e - 1], n[e + 1] = n[e] + gi.distanceTo(_i);
			e.setAttribute("lineDistance", new pr(n, 1));
		} else G("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");
		return this;
	}
}, yi = class extends Ht {
	constructor(e = [], t = 301, n, r, i, a, o, s, c, l) {
		super(e, t, n, r, i, a, o, s, c, l), this.isCubeTexture = !0, this.flipY = !1;
	}
	get images() {
		return this.image;
	}
	set images(e) {
		this.image = e;
	}
}, bi = class extends Ht {
	constructor(e, t, n, r, i, a, o, s, c) {
		super(e, t, n, r, i, a, o, s, c), this.isCanvasTexture = !0, this.needsUpdate = !0;
	}
}, xi = class extends Ht {
	constructor(e, t, n = g, r, i, o, s = a, c = a, l, u = D, d = 1) {
		if (u !== 1026 && u !== 1027) throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");
		super({
			width: e,
			height: t,
			depth: d
		}, r, i, o, s, c, u, n, l), this.isDepthTexture = !0, this.flipY = !1, this.generateMipmaps = !1, this.compareFunction = null;
	}
	copy(e) {
		return super.copy(e), this.source = new Rt(Object.assign({}, e.image)), this.compareFunction = e.compareFunction, this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.compareFunction = this.compareFunction, t;
	}
}, Si = class extends xi {
	constructor(e, t = g, n = 301, r, i, o = a, s = a, c, l = D) {
		let u = {
			width: e,
			height: e,
			depth: 1
		}, d = [
			u,
			u,
			u,
			u,
			u,
			u
		];
		super(e, e, t, n, r, i, o, s, c, l), this.image = d, this.isCubeDepthTexture = !0, this.isCubeTexture = !0;
	}
	get images() {
		return this.image;
	}
	set images(e) {
		this.image = e;
	}
}, Ci = class extends Ht {
	constructor(e = null) {
		super(), this.sourceTexture = e, this.isExternalTexture = !0;
	}
	copy(e) {
		return super.copy(e), this.sourceTexture = e.sourceTexture, this;
	}
}, wi = class e extends Tr {
	constructor(e = 1, t = 1, n = 1, r = 1, i = 1, a = 1) {
		super(), this.type = "BoxGeometry", this.parameters = {
			width: e,
			height: t,
			depth: n,
			widthSegments: r,
			heightSegments: i,
			depthSegments: a
		};
		let o = this;
		r = Math.floor(r), i = Math.floor(i), a = Math.floor(a);
		let s = [], c = [], l = [], u = [], d = 0, f = 0;
		p("z", "y", "x", -1, -1, n, t, e, a, i, 0), p("z", "y", "x", 1, -1, n, t, -e, a, i, 1), p("x", "z", "y", 1, 1, e, n, t, r, a, 2), p("x", "z", "y", 1, -1, e, n, -t, r, a, 3), p("x", "y", "z", 1, -1, e, t, n, r, i, 4), p("x", "y", "z", -1, -1, e, t, -n, r, i, 5), this.setIndex(s), this.setAttribute("position", new pr(c, 3)), this.setAttribute("normal", new pr(l, 3)), this.setAttribute("uv", new pr(u, 2));
		function p(e, t, n, r, i, a, p, m, h, g, _) {
			let v = a / h, y = p / g, b = a / 2, x = p / 2, S = m / 2, C = h + 1, w = g + 1, T = 0, E = 0, D = new Y();
			for (let a = 0; a < w; a++) {
				let o = a * y - x;
				for (let s = 0; s < C; s++) D[e] = (s * v - b) * r, D[t] = o * i, D[n] = S, c.push(D.x, D.y, D.z), D[e] = 0, D[t] = 0, D[n] = m > 0 ? 1 : -1, l.push(D.x, D.y, D.z), u.push(s / h), u.push(1 - a / g), T += 1;
			}
			for (let e = 0; e < g; e++) for (let t = 0; t < h; t++) {
				let n = d + t + C * e, r = d + t + C * (e + 1), i = d + (t + 1) + C * (e + 1), a = d + (t + 1) + C * e;
				s.push(n, r, a), s.push(r, i, a), E += 6;
			}
			o.addGroup(f, E, _), f += E, d += T;
		}
	}
	copy(e) {
		return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
	}
	static fromJSON(t) {
		return new e(t.width, t.height, t.depth, t.widthSegments, t.heightSegments, t.depthSegments);
	}
}, Ti = class e extends Tr {
	constructor(e = 1, t = 1, n = 4, r = 8, i = 1) {
		super(), this.type = "CapsuleGeometry", this.parameters = {
			radius: e,
			height: t,
			capSegments: n,
			radialSegments: r,
			heightSegments: i
		}, t = Math.max(0, t), n = Math.max(1, Math.floor(n)), r = Math.max(3, Math.floor(r)), i = Math.max(1, Math.floor(i));
		let a = [], o = [], s = [], c = [], l = t / 2, u = Math.PI / 2 * e, d = t, f = 2 * u + d, p = n * 2 + i, m = r + 1, h = new Y(), g = new Y();
		for (let _ = 0; _ <= p; _++) {
			let v = 0, y = 0, b = 0, x = 0;
			if (_ <= n) {
				let t = _ / n, r = t * Math.PI / 2;
				y = -l - e * Math.cos(r), b = e * Math.sin(r), x = -e * Math.cos(r), v = t * u;
			} else if (_ <= n + i) {
				let r = (_ - n) / i;
				y = -l + r * t, b = e, x = 0, v = u + r * d;
			} else {
				let t = (_ - n - i) / n, r = t * Math.PI / 2;
				y = l + e * Math.sin(r), b = e * Math.cos(r), x = e * Math.sin(r), v = u + d + t * u;
			}
			let S = Math.max(0, Math.min(1, v / f)), C = 0;
			_ === 0 ? C = .5 / r : _ === p && (C = -.5 / r);
			for (let e = 0; e <= r; e++) {
				let t = e / r, n = t * Math.PI * 2, i = Math.sin(n), a = Math.cos(n);
				g.x = -b * a, g.y = y, g.z = b * i, o.push(g.x, g.y, g.z), h.set(-b * a, x, b * i), h.normalize(), s.push(h.x, h.y, h.z), c.push(t + C, S);
			}
			if (_ > 0) {
				let e = (_ - 1) * m;
				for (let t = 0; t < r; t++) {
					let n = e + t, r = e + t + 1, i = _ * m + t, o = _ * m + t + 1;
					a.push(n, r, i), a.push(r, o, i);
				}
			}
		}
		this.setIndex(a), this.setAttribute("position", new pr(o, 3)), this.setAttribute("normal", new pr(s, 3)), this.setAttribute("uv", new pr(c, 2));
	}
	copy(e) {
		return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
	}
	static fromJSON(t) {
		return new e(t.radius, t.height, t.capSegments, t.radialSegments, t.heightSegments);
	}
}, Ei = class e extends Tr {
	constructor(e = 1, t = 1, n = 1, r = 1) {
		super(), this.type = "PlaneGeometry", this.parameters = {
			width: e,
			height: t,
			widthSegments: n,
			heightSegments: r
		};
		let i = e / 2, a = t / 2, o = Math.floor(n), s = Math.floor(r), c = o + 1, l = s + 1, u = e / o, d = t / s, f = [], p = [], m = [], h = [];
		for (let e = 0; e < l; e++) {
			let t = e * d - a;
			for (let n = 0; n < c; n++) {
				let r = n * u - i;
				p.push(r, -t, 0), m.push(0, 0, 1), h.push(n / o), h.push(1 - e / s);
			}
		}
		for (let e = 0; e < s; e++) for (let t = 0; t < o; t++) {
			let n = t + c * e, r = t + c * (e + 1), i = t + 1 + c * (e + 1), a = t + 1 + c * e;
			f.push(n, r, a), f.push(r, i, a);
		}
		this.setIndex(f), this.setAttribute("position", new pr(p, 3)), this.setAttribute("normal", new pr(m, 3)), this.setAttribute("uv", new pr(h, 2));
	}
	copy(e) {
		return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
	}
	static fromJSON(t) {
		return new e(t.width, t.height, t.widthSegments, t.heightSegments);
	}
}, Di = class e extends Tr {
	constructor(e = 1, t = 32, n = 16, r = 0, i = Math.PI * 2, a = 0, o = Math.PI) {
		super(), this.type = "SphereGeometry", this.parameters = {
			radius: e,
			widthSegments: t,
			heightSegments: n,
			phiStart: r,
			phiLength: i,
			thetaStart: a,
			thetaLength: o
		}, t = Math.max(3, Math.floor(t)), n = Math.max(2, Math.floor(n));
		let s = Math.min(a + o, Math.PI), c = 0, l = [], u = new Y(), d = new Y(), f = [], p = [], m = [], h = [];
		for (let f = 0; f <= n; f++) {
			let g = [], _ = f / n, v = a + _ * o, y = e * Math.cos(v), b = Math.sqrt(e * e - y * y), x = 0;
			f === 0 && a === 0 ? x = .5 / t : f === n && s === Math.PI && (x = -.5 / t);
			for (let e = 0; e <= t; e++) {
				let n = e / t, a = r + n * i;
				u.x = -b * Math.cos(a), u.y = y, u.z = b * Math.sin(a), p.push(u.x, u.y, u.z), d.copy(u).normalize(), m.push(d.x, d.y, d.z), h.push(n + x, 1 - _), g.push(c++);
			}
			l.push(g);
		}
		for (let e = 0; e < n; e++) for (let r = 0; r < t; r++) {
			let t = l[e][r + 1], i = l[e][r], o = l[e + 1][r], c = l[e + 1][r + 1];
			(e !== 0 || a > 0) && f.push(t, i, c), (e !== n - 1 || s < Math.PI) && f.push(i, o, c);
		}
		this.setIndex(f), this.setAttribute("position", new pr(p, 3)), this.setAttribute("normal", new pr(m, 3)), this.setAttribute("uv", new pr(h, 2));
	}
	copy(e) {
		return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
	}
	static fromJSON(t) {
		return new e(t.radius, t.widthSegments, t.heightSegments, t.phiStart, t.phiLength, t.thetaStart, t.thetaLength);
	}
};
function Oi(e) {
	let t = {};
	for (let n in e) {
		t[n] = {};
		for (let r in e[n]) {
			let i = e[n][r];
			if (Ai(i)) i.isRenderTargetTexture ? (G("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."), t[n][r] = null) : t[n][r] = i.clone();
			else if (Array.isArray(i)) {
				if (Ai(i[0])) {
					let e = [];
					for (let t = 0, n = i.length; t < n; t++) e[t] = i[t].clone();
					t[n][r] = e;
				} else t[n][r] = i.slice();
			} else t[n][r] = i;
		}
	}
	return t;
}
function ki(e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = Oi(e[n]);
		for (let e in r) t[e] = r[e];
	}
	return t;
}
function Ai(e) {
	return e && (e.isColor || e.isMatrix3 || e.isMatrix4 || e.isVector2 || e.isVector3 || e.isVector4 || e.isTexture || e.isQuaternion);
}
function ji(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) t.push(e[n].clone());
	return t;
}
function Mi(e) {
	let t = e.getRenderTarget();
	return t === null ? e.outputColorSpace : t.isXRRenderTarget === !0 ? t.texture.colorSpace : Mt.workingColorSpace;
}
var Ni = {
	clone: Oi,
	merge: ki
}, Pi = "void main() {\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}", Fi = "void main() {\n	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}", Ii = class extends jr {
	constructor(e) {
		super(), this.isShaderMaterial = !0, this.type = "ShaderMaterial", this.defines = {}, this.uniforms = {}, this.uniformsGroups = [], this.vertexShader = Pi, this.fragmentShader = Fi, this.linewidth = 1, this.wireframe = !1, this.wireframeLinewidth = 1, this.fog = !1, this.lights = !1, this.clipping = !1, this.forceSinglePass = !0, this.extensions = {
			clipCullDistance: !1,
			multiDraw: !1
		}, this.defaultAttributeValues = {
			color: [
				1,
				1,
				1
			],
			uv: [0, 0],
			uv1: [0, 0]
		}, this.index0AttributeName = void 0, this.uniformsNeedUpdate = !1, this.glslVersion = null, e !== void 0 && this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.fragmentShader = e.fragmentShader, this.vertexShader = e.vertexShader, this.uniforms = Oi(e.uniforms), this.uniformsGroups = ji(e.uniformsGroups), this.defines = Object.assign({}, e.defines), this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.fog = e.fog, this.lights = e.lights, this.clipping = e.clipping, this.extensions = Object.assign({}, e.extensions), this.glslVersion = e.glslVersion, this.defaultAttributeValues = Object.assign({}, e.defaultAttributeValues), this.index0AttributeName = e.index0AttributeName, this.uniformsNeedUpdate = e.uniformsNeedUpdate, this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		t.glslVersion = this.glslVersion, t.uniforms = {};
		for (let n in this.uniforms) {
			let r = this.uniforms[n].value;
			r && r.isTexture ? t.uniforms[n] = {
				type: "t",
				value: r.toJSON(e).uuid
			} : r && r.isColor ? t.uniforms[n] = {
				type: "c",
				value: r.getHex()
			} : r && r.isVector2 ? t.uniforms[n] = {
				type: "v2",
				value: r.toArray()
			} : r && r.isVector3 ? t.uniforms[n] = {
				type: "v3",
				value: r.toArray()
			} : r && r.isVector4 ? t.uniforms[n] = {
				type: "v4",
				value: r.toArray()
			} : r && r.isMatrix3 ? t.uniforms[n] = {
				type: "m3",
				value: r.toArray()
			} : r && r.isMatrix4 ? t.uniforms[n] = {
				type: "m4",
				value: r.toArray()
			} : t.uniforms[n] = { value: r };
		}
		Object.keys(this.defines).length > 0 && (t.defines = this.defines), t.vertexShader = this.vertexShader, t.fragmentShader = this.fragmentShader, t.lights = this.lights, t.clipping = this.clipping;
		let n = {};
		for (let e in this.extensions) this.extensions[e] === !0 && (n[e] = !0);
		return Object.keys(n).length > 0 && (t.extensions = n), t;
	}
	fromJSON(e, t) {
		if (super.fromJSON(e, t), e.uniforms !== void 0) for (let n in e.uniforms) {
			let r = e.uniforms[n];
			switch (this.uniforms[n] = {}, r.type) {
				case "t":
					this.uniforms[n].value = t[r.value] || null;
					break;
				case "c":
					this.uniforms[n].value = new Z().setHex(r.value);
					break;
				case "v2":
					this.uniforms[n].value = new J().fromArray(r.value);
					break;
				case "v3":
					this.uniforms[n].value = new Y().fromArray(r.value);
					break;
				case "v4":
					this.uniforms[n].value = new Ut().fromArray(r.value);
					break;
				case "m3":
					this.uniforms[n].value = new X().fromArray(r.value);
					break;
				case "m4":
					this.uniforms[n].value = new Jt().fromArray(r.value);
					break;
				default: this.uniforms[n].value = r.value;
			}
		}
		if (e.defines !== void 0 && (this.defines = e.defines), e.vertexShader !== void 0 && (this.vertexShader = e.vertexShader), e.fragmentShader !== void 0 && (this.fragmentShader = e.fragmentShader), e.glslVersion !== void 0 && (this.glslVersion = e.glslVersion), e.extensions !== void 0) for (let t in e.extensions) this.extensions[t] = e.extensions[t];
		return e.lights !== void 0 && (this.lights = e.lights), e.clipping !== void 0 && (this.clipping = e.clipping), this;
	}
}, Li = class extends Ii {
	constructor(e) {
		super(e), this.isRawShaderMaterial = !0, this.type = "RawShaderMaterial";
	}
}, Ri = class extends jr {
	constructor(e) {
		super(), this.isMeshStandardMaterial = !0, this.type = "MeshStandardMaterial", this.defines = { STANDARD: "" }, this.color = new Z(16777215), this.roughness = 1, this.metalness = 0, this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.emissive = new Z(0), this.emissiveIntensity = 1, this.emissiveMap = null, this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = 0, this.normalScale = new J(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.roughnessMap = null, this.metalnessMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new an(), this.envMapIntensity = 1, this.wireframe = !1, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.flatShading = !1, this.fog = !0, this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.defines = { STANDARD: "" }, this.color.copy(e.color), this.roughness = e.roughness, this.metalness = e.metalness, this.map = e.map, this.lightMap = e.lightMap, this.lightMapIntensity = e.lightMapIntensity, this.aoMap = e.aoMap, this.aoMapIntensity = e.aoMapIntensity, this.emissive.copy(e.emissive), this.emissiveMap = e.emissiveMap, this.emissiveIntensity = e.emissiveIntensity, this.bumpMap = e.bumpMap, this.bumpScale = e.bumpScale, this.normalMap = e.normalMap, this.normalMapType = e.normalMapType, this.normalScale.copy(e.normalScale), this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this.roughnessMap = e.roughnessMap, this.metalnessMap = e.metalnessMap, this.alphaMap = e.alphaMap, this.envMap = e.envMap, this.envMapRotation.copy(e.envMapRotation), this.envMapIntensity = e.envMapIntensity, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.wireframeLinecap = e.wireframeLinecap, this.wireframeLinejoin = e.wireframeLinejoin, this.flatShading = e.flatShading, this.fog = e.fog, this;
	}
}, zi = class extends jr {
	constructor(e) {
		super(), this.isMeshDepthMaterial = !0, this.type = "MeshDepthMaterial", this.depthPacking = W, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.wireframe = !1, this.wireframeLinewidth = 1, this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.depthPacking = e.depthPacking, this.map = e.map, this.alphaMap = e.alphaMap, this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this;
	}
}, Bi = class extends jr {
	constructor(e) {
		super(), this.isMeshDistanceMaterial = !0, this.type = "MeshDistanceMaterial", this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.setValues(e);
	}
	copy(e) {
		return super.copy(e), this.map = e.map, this.alphaMap = e.alphaMap, this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this;
	}
};
function Vi(e, t) {
	return !e || e.constructor === t ? e : typeof t.BYTES_PER_ELEMENT == "number" ? new t(e) : Array.prototype.slice.call(e);
}
function Hi(e) {
	return e !== void 0 && e.inTangents !== void 0 && e.outTangents !== void 0;
}
var Ui = class {
	constructor(e, t, n, r) {
		this.parameterPositions = e, this._cachedIndex = 0, this.resultBuffer = r === void 0 ? new t.constructor(n) : r, this.sampleValues = t, this.valueSize = n, this.settings = null, this.DefaultSettings_ = {};
	}
	evaluate(e) {
		let t = this.parameterPositions, n = this._cachedIndex, r = t[n], i = t[n - 1];
		validate_interval: {
			seek: {
				let a;
				linear_scan: {
					forward_scan: if (!(e < r)) {
						for (let a = n + 2;;) {
							if (r === void 0) {
								if (e < i) break forward_scan;
								return n = t.length, this._cachedIndex = n, this.copySampleValue_(n - 1);
							}
							if (n === a) break;
							if (i = r, r = t[++n], e < r) break seek;
						}
						a = t.length;
						break linear_scan;
					}
					if (!(e >= i)) {
						let o = t[1];
						e < o && (n = 2, i = o);
						for (let a = n - 2;;) {
							if (i === void 0) return this._cachedIndex = 0, this.copySampleValue_(0);
							if (n === a) break;
							if (r = i, i = t[--n - 1], e >= i) break seek;
						}
						a = n, n = 0;
						break linear_scan;
					}
					break validate_interval;
				}
				for (; n < a;) {
					let r = n + a >>> 1;
					e < t[r] ? a = r : n = r + 1;
				}
				if (r = t[n], i = t[n - 1], i === void 0) return this._cachedIndex = 0, this.copySampleValue_(0);
				if (r === void 0) return n = t.length, this._cachedIndex = n, this.copySampleValue_(n - 1);
			}
			this._cachedIndex = n, this.intervalChanged_(n, i, r);
		}
		return this.interpolate_(n, i, e, r);
	}
	getSettings_() {
		return this.settings || this.DefaultSettings_;
	}
	copySampleValue_(e) {
		let t = this.resultBuffer, n = this.sampleValues, r = this.valueSize, i = e * r;
		for (let e = 0; e !== r; ++e) t[e] = n[i + e];
		return t;
	}
	interpolate_() {
		throw Error("THREE.Interpolant: Call to abstract method.");
	}
	intervalChanged_() {}
}, Wi = class extends Ui {
	constructor(e, t, n, r) {
		super(e, t, n, r), this._weightPrev = -0, this._offsetPrev = -0, this._weightNext = -0, this._offsetNext = -0, this.DefaultSettings_ = {
			endingStart: H,
			endingEnd: H
		};
	}
	intervalChanged_(e, t, n) {
		let r = this.parameterPositions, i = e - 2, a = e + 1, o = r[i], s = r[a];
		if (o === void 0) switch (this.getSettings_().endingStart) {
			case Me:
				i = e, o = 2 * t - n;
				break;
			case U:
				i = r.length - 2, o = t + r[i] - r[i + 1];
				break;
			default: i = e, o = n;
		}
		if (s === void 0) switch (this.getSettings_().endingEnd) {
			case Me:
				a = e, s = 2 * n - t;
				break;
			case U:
				a = 1, s = n + r[1] - r[0];
				break;
			default: a = e - 1, s = t;
		}
		let c = (n - t) * .5, l = this.valueSize;
		this._weightPrev = c / (t - o), this._weightNext = c / (s - n), this._offsetPrev = i * l, this._offsetNext = a * l;
	}
	interpolate_(e, t, n, r) {
		let i = this.resultBuffer, a = this.sampleValues, o = this.valueSize, s = e * o, c = s - o, l = this._offsetPrev, u = this._offsetNext, d = this._weightPrev, f = this._weightNext, p = (n - t) / (r - t), m = p * p, h = m * p, g = -d * h + 2 * d * m - d * p, _ = (1 + d) * h + (-1.5 - 2 * d) * m + (-.5 + d) * p + 1, v = (-1 - f) * h + (1.5 + f) * m + .5 * p, y = f * h - f * m;
		for (let e = 0; e !== o; ++e) i[e] = g * a[l + e] + _ * a[c + e] + v * a[s + e] + y * a[u + e];
		return i;
	}
}, Gi = class extends Ui {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
	interpolate_(e, t, n, r) {
		let i = this.resultBuffer, a = this.sampleValues, o = this.valueSize, s = e * o, c = s - o, l = (n - t) / (r - t), u = 1 - l;
		for (let e = 0; e !== o; ++e) i[e] = a[c + e] * u + a[s + e] * l;
		return i;
	}
}, Ki = class extends Ui {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
	interpolate_(e) {
		return this.copySampleValue_(e - 1);
	}
}, qi = class extends Ui {
	interpolate_(e, t, n, r) {
		let i = this.resultBuffer, a = this.sampleValues, o = this.valueSize, s = e * o, c = s - o, l = this.inTangents, u = this.outTangents;
		if (!l || !u) {
			let e = (n - t) / (r - t), l = 1 - e;
			for (let t = 0; t !== o; ++t) i[t] = a[c + t] * l + a[s + t] * e;
			return i;
		}
		let d = o * 2, f = e - 1;
		for (let p = 0; p !== o; ++p) {
			let o = a[c + p], m = a[s + p], h = f * d + p * 2, g = u[h], _ = u[h + 1], v = e * d + p * 2, y = l[v], b = l[v + 1], x = Xi(n, t, g, y, r);
			i[p] = Ji(x, o, _, b, m);
		}
		return i;
	}
};
function Ji(e, t, n, r, i) {
	let a = 1 - e;
	return a * a * a * t + 3 * a * a * e * n + 3 * a * e * e * r + e * e * e * i;
}
function Yi(e, t, n, r, i) {
	let a = 1 - e;
	return 3 * a * a * (n - t) + 6 * a * e * (r - n) + 3 * e * e * (i - r);
}
function Xi(e, t, n, r, i) {
	let a = (e - t) / (i - t);
	for (let o = 0; o < 8; o++) {
		let o = Ji(a, t, n, r, i) - e;
		if (Math.abs(o) < 1e-10) break;
		let s = Yi(a, t, n, r, i);
		if (Math.abs(s) < 1e-10) break;
		a = Math.max(0, Math.min(1, a - o / s));
	}
	return a;
}
var Zi = class {
	constructor(e, t, n, r) {
		if (e === void 0) throw Error("THREE.KeyframeTrack: track name is undefined");
		if (t === void 0 || t.length === 0) throw Error("THREE.KeyframeTrack: no keyframes in track named " + e);
		this.name = e, this.times = Vi(t, this.TimeBufferType), this.values = Vi(n, this.ValueBufferType), this.setInterpolation(r || this.DefaultInterpolation);
	}
	static toJSON(e) {
		let t = e.constructor, n;
		if (t.toJSON !== this.toJSON) n = t.toJSON(e);
		else {
			n = {
				name: e.name,
				times: Vi(e.times, Array),
				values: Vi(e.values, Array)
			};
			let t = e.getInterpolation();
			t !== e.DefaultInterpolation && (n.interpolation = t), Hi(e.settings) && (n.settings = {
				inTangents: Vi(e.settings.inTangents, Array),
				outTangents: Vi(e.settings.outTangents, Array)
			});
		}
		return n.type = e.ValueTypeName, n;
	}
	InterpolantFactoryMethodDiscrete(e) {
		return new Ki(this.times, this.values, this.getValueSize(), e);
	}
	InterpolantFactoryMethodLinear(e) {
		return new Gi(this.times, this.values, this.getValueSize(), e);
	}
	InterpolantFactoryMethodSmooth(e) {
		return new Wi(this.times, this.values, this.getValueSize(), e);
	}
	InterpolantFactoryMethodBezier(e) {
		let t = new qi(this.times, this.values, this.getValueSize(), e);
		return this.settings && (t.inTangents = this.settings.inTangents, t.outTangents = this.settings.outTangents), t;
	}
	setInterpolation(e) {
		let t;
		switch (e) {
			case V:
				t = this.InterpolantFactoryMethodDiscrete;
				break;
			case ke:
				t = this.InterpolantFactoryMethodLinear;
				break;
			case Ae:
				t = this.InterpolantFactoryMethodSmooth;
				break;
			case je: t = this.InterpolantFactoryMethodBezier;
		}
		if (t === void 0) {
			let t = "unsupported interpolation for " + this.ValueTypeName + " keyframe track named " + this.name;
			if (this.createInterpolant === void 0) {
				if (e !== this.DefaultInterpolation) this.setInterpolation(this.DefaultInterpolation);
				else throw Error(t);
			}
			return G("KeyframeTrack:", t), this;
		}
		return this.createInterpolant = t, this;
	}
	getInterpolation() {
		switch (this.createInterpolant) {
			case this.InterpolantFactoryMethodDiscrete: return V;
			case this.InterpolantFactoryMethodLinear: return ke;
			case this.InterpolantFactoryMethodSmooth: return Ae;
			case this.InterpolantFactoryMethodBezier: return je;
		}
	}
	getValueSize() {
		return this.values.length / this.times.length;
	}
	shift(e) {
		if (e !== 0) {
			let t = this.times;
			for (let n = 0, r = t.length; n !== r; ++n) t[n] += e;
			Hi(this.settings) && (Qi(this.settings.inTangents, e), Qi(this.settings.outTangents, e));
		}
		return this;
	}
	scale(e) {
		if (e !== 1) {
			let t = this.times;
			for (let n = 0, r = t.length; n !== r; ++n) t[n] *= e;
			Hi(this.settings) && ($i(this.settings.inTangents, e), $i(this.settings.outTangents, e));
		}
		return this;
	}
	trim(e, t) {
		let n = this.times, r = n.length, i = 0, a = r - 1;
		for (; i !== r && n[i] < e;) ++i;
		for (; a !== -1 && n[a] > t;) --a;
		if (++a, i !== 0 || a !== r) {
			i >= a && (a = Math.max(a, 1), i = a - 1);
			let e = this.getValueSize();
			this.times = n.slice(i, a), this.values = this.values.slice(i * e, a * e);
		}
		return this;
	}
	validate() {
		let e = !0, t = this.getValueSize();
		t - Math.floor(t) !== 0 && (K("KeyframeTrack: Invalid value size in track.", this), e = !1);
		let n = this.times, r = this.values, i = n.length;
		i === 0 && (K("KeyframeTrack: Track is empty.", this), e = !1);
		let a = null;
		for (let t = 0; t !== i; t++) {
			let r = n[t];
			if (typeof r == "number" && isNaN(r)) {
				K("KeyframeTrack: Time is not a valid number.", this, t, r), e = !1;
				break;
			}
			if (a !== null && a > r) {
				K("KeyframeTrack: Out of order keys.", this, t, r, a), e = !1;
				break;
			}
			a = r;
		}
		if (r !== void 0 && He(r)) for (let t = 0, n = r.length; t !== n; ++t) {
			let n = r[t];
			if (isNaN(n)) {
				K("KeyframeTrack: Value is not a valid number.", this, t, n), e = !1;
				break;
			}
		}
		return e;
	}
	optimize() {
		let e = this.times.slice(), t = this.values.slice(), n = this.getValueSize(), r = this.getInterpolation() === Ae, i = e.length - 1, a = 1;
		for (let o = 1; o < i; ++o) {
			let i = !1, s = e[o];
			if (s !== e[o + 1] && (o !== 1 || s !== e[0])) {
				if (r) i = !0;
				else {
					let e = o * n, r = e - n, a = e + n;
					for (let o = 0; o !== n; ++o) {
						let n = t[e + o];
						if (n !== t[r + o] || n !== t[a + o]) {
							i = !0;
							break;
						}
					}
				}
			}
			if (i) {
				if (o !== a) {
					e[a] = e[o];
					let r = o * n, i = a * n;
					for (let e = 0; e !== n; ++e) t[i + e] = t[r + e];
				}
				++a;
			}
		}
		if (i > 0) {
			e[a] = e[i];
			for (let e = i * n, r = a * n, o = 0; o !== n; ++o) t[r + o] = t[e + o];
			++a;
		}
		return a === e.length ? (this.times = e, this.values = t) : (this.times = e.slice(0, a), this.values = t.slice(0, a * n)), this;
	}
	clone() {
		let e = this.times.slice(), t = this.values.slice(), n = this.constructor, r = new n(this.name, e, t);
		return r.createInterpolant = this.createInterpolant, Hi(this.settings) && (r.settings = {
			inTangents: this.settings.inTangents.slice(),
			outTangents: this.settings.outTangents.slice()
		}), r;
	}
};
function Qi(e, t) {
	for (let n = 0, r = e.length; n !== r; n += 2) e[n] += t;
}
function $i(e, t) {
	for (let n = 0, r = e.length; n !== r; n += 2) e[n] *= t;
}
Zi.prototype.ValueTypeName = "", Zi.prototype.TimeBufferType = Float32Array, Zi.prototype.ValueBufferType = Float32Array, Zi.prototype.DefaultInterpolation = ke;
var ea = class extends Zi {
	constructor(e, t, n) {
		super(e, t, n);
	}
};
ea.prototype.ValueTypeName = "bool", ea.prototype.ValueBufferType = Array, ea.prototype.DefaultInterpolation = V, ea.prototype.InterpolantFactoryMethodLinear = void 0, ea.prototype.InterpolantFactoryMethodSmooth = void 0;
var ta = class extends Zi {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
};
ta.prototype.ValueTypeName = "color";
var na = class extends Zi {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
};
na.prototype.ValueTypeName = "number";
var ra = class extends Ui {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
	interpolate_(e, t, n, r) {
		let i = this.resultBuffer, a = this.sampleValues, o = this.valueSize, s = (n - t) / (r - t), c = e * o;
		for (let e = c + o; c !== e; c += 4) Tt.slerpFlat(i, 0, a, c - o, a, c, s);
		return i;
	}
}, ia = class extends Zi {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
	InterpolantFactoryMethodLinear(e) {
		return new ra(this.times, this.values, this.getValueSize(), e);
	}
};
ia.prototype.ValueTypeName = "quaternion", ia.prototype.InterpolantFactoryMethodSmooth = void 0;
var aa = class extends Zi {
	constructor(e, t, n) {
		super(e, t, n);
	}
};
aa.prototype.ValueTypeName = "string", aa.prototype.ValueBufferType = Array, aa.prototype.DefaultInterpolation = V, aa.prototype.InterpolantFactoryMethodLinear = void 0, aa.prototype.InterpolantFactoryMethodSmooth = void 0;
var oa = class extends Zi {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
};
oa.prototype.ValueTypeName = "vector";
var sa = class extends Sn {
	static registerNode(e) {
		this.prototype._lightNode = e;
	}
	constructor(e, t = 1) {
		super(), this.isLight = !0, this.type = "Light", this.color = new Z(e), this.intensity = t;
	}
	copy(e, t) {
		return super.copy(e, t), this.color.copy(e.color), this.intensity = e.intensity, this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.color = this.color.getHex(), t.object.intensity = this.intensity, t;
	}
}, ca = class extends sa {
	constructor(e, t, n) {
		super(e, n), this.isHemisphereLight = !0, this.type = "HemisphereLight", this.position.copy(Sn.DEFAULT_UP), this.updateMatrix(), this.groundColor = new Z(t);
	}
	copy(e, t) {
		return super.copy(e, t), this.groundColor.copy(e.groundColor), this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.groundColor = this.groundColor.getHex(), t;
	}
}, la = /*@__PURE__*/ new Jt(), ua = /*@__PURE__*/ new Y(), da = /*@__PURE__*/ new Y(), fa = class {
	constructor(e) {
		this.camera = e, this.intensity = 1, this.bias = 0, this.biasNode = null, this.normalBias = 0, this.radius = 1, this.blurSamples = 8, this.mapSize = new J(512, 512), this.mapType = d, this.map = null, this.mapPass = null, this.matrix = new Jt(), this.autoUpdate = !0, this.needsUpdate = !1, this._frustum = new ri(), this._frameExtents = new J(1, 1), this._viewportCount = 1, this._viewports = [new Ut(0, 0, 1, 1)];
	}
	getViewportCount() {
		return this._viewportCount;
	}
	getCamera() {
		return this.camera;
	}
	getFrustum() {
		return this._frustum;
	}
	updateMatrices(e) {
		let t = this.camera;
		ua.setFromMatrixPosition(e.matrixWorld), t.position.copy(ua), da.setFromMatrixPosition(e.target.matrixWorld), t.lookAt(da), t.updateMatrixWorld(), this._updateMatrix(t, this.matrix, this._frustum);
	}
	_updateMatrix(e, t, n, r) {
		la.multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse), n.setFromProjectionMatrix(la, e.coordinateSystem, e.reversedDepth);
		let i = this._frameExtents, a = r ? r.z / i.x : 1, o = r ? r.w / i.y : 1, s = r ? r.x / i.x : 0, c = r ? r.y / i.y : 0;
		e.coordinateSystem === 2001 || e.reversedDepth ? t.set(.5 * a, 0, 0, .5 * a + s, 0, .5 * o, 0, .5 * o + c, 0, 0, 1, 0, 0, 0, 0, 1) : t.set(.5 * a, 0, 0, .5 * a + s, 0, .5 * o, 0, .5 * o + c, 0, 0, .5, .5, 0, 0, 0, 1), t.multiply(la);
	}
	getViewport(e) {
		return this._viewports[e];
	}
	getFrameExtents() {
		return this._frameExtents;
	}
	dispose() {
		this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose();
	}
	copy(e) {
		return this.camera = e.camera.clone(), this.intensity = e.intensity, this.bias = e.bias, this.radius = e.radius, this.autoUpdate = e.autoUpdate, this.needsUpdate = e.needsUpdate, this.normalBias = e.normalBias, this.blurSamples = e.blurSamples, this.mapSize.copy(e.mapSize), this.mapType = e.mapType, this.biasNode = e.biasNode, this;
	}
	clone() {
		return new this.constructor().copy(this);
	}
	toJSON() {
		let e = {};
		return e.intensity = this.intensity, e.bias = this.bias, e.normalBias = this.normalBias, e.radius = this.radius, e.blurSamples = this.blurSamples, e.mapSize = this.mapSize.toArray(), e.mapType = this.mapType, e.camera = this.camera.toJSON(!1).object, delete e.camera.matrix, e;
	}
}, pa = /*@__PURE__*/ new Y(), ma = /*@__PURE__*/ new Tt(), ha = /*@__PURE__*/ new Y(), ga = class extends Sn {
	constructor() {
		super(), this.isCamera = !0, this.type = "Camera", this.matrixWorldInverse = new Jt(), this.projectionMatrix = new Jt(), this.projectionMatrixInverse = new Jt(), this.coordinateSystem = Be, this._reversedDepth = !1;
	}
	get reversedDepth() {
		return this._reversedDepth;
	}
	copy(e, t) {
		return super.copy(e, t), this.matrixWorldInverse.copy(e.matrixWorldInverse), this.projectionMatrix.copy(e.projectionMatrix), this.projectionMatrixInverse.copy(e.projectionMatrixInverse), this.coordinateSystem = e.coordinateSystem, this;
	}
	getWorldDirection(e) {
		return super.getWorldDirection(e).negate();
	}
	updateMatrixWorld(e) {
		super.updateMatrixWorld(e), this.matrixWorld.decompose(pa, ma, ha), ha.x === 1 && ha.y === 1 && ha.z === 1 ? this.matrixWorldInverse.copy(this.matrixWorld).invert() : this.matrixWorldInverse.compose(pa, ma, ha.set(1, 1, 1)).invert();
	}
	updateWorldMatrix(e, t, n = !1) {
		super.updateWorldMatrix(e, t, n), this.matrixWorld.decompose(pa, ma, ha), ha.x === 1 && ha.y === 1 && ha.z === 1 ? this.matrixWorldInverse.copy(this.matrixWorld).invert() : this.matrixWorldInverse.compose(pa, ma, ha.set(1, 1, 1)).invert();
	}
	clone() {
		return new this.constructor().copy(this);
	}
}, _a = /*@__PURE__*/ new Y(), va = /*@__PURE__*/ new J(), ya = /*@__PURE__*/ new J(), ba = class extends ga {
	constructor(e = 50, t = 1, n = .1, r = 2e3) {
		super(), this.isPerspectiveCamera = !0, this.type = "PerspectiveCamera", this.fov = e, this.zoom = 1, this.near = n, this.far = r, this.focus = 10, this.aspect = t, this.view = null, this.filmGauge = 35, this.filmOffset = 0, this.updateProjectionMatrix();
	}
	copy(e, t) {
		return super.copy(e, t), this.fov = e.fov, this.zoom = e.zoom, this.near = e.near, this.far = e.far, this.focus = e.focus, this.aspect = e.aspect, this.view = e.view === null ? null : Object.assign({}, e.view), this.filmGauge = e.filmGauge, this.filmOffset = e.filmOffset, this;
	}
	setFocalLength(e) {
		let t = .5 * this.getFilmHeight() / e;
		this.fov = tt * 2 * Math.atan(t), this.updateProjectionMatrix();
	}
	getFocalLength() {
		let e = Math.tan(et * .5 * this.fov);
		return .5 * this.getFilmHeight() / e;
	}
	getEffectiveFOV() {
		return tt * 2 * Math.atan(Math.tan(et * .5 * this.fov) / this.zoom);
	}
	getFilmWidth() {
		return this.filmGauge * Math.min(this.aspect, 1);
	}
	getFilmHeight() {
		return this.filmGauge / Math.max(this.aspect, 1);
	}
	getViewBounds(e, t, n) {
		_a.set(-1, -1, .5).applyMatrix4(this.projectionMatrixInverse), t.set(_a.x, _a.y).multiplyScalar(-e / _a.z), _a.set(1, 1, .5).applyMatrix4(this.projectionMatrixInverse), n.set(_a.x, _a.y).multiplyScalar(-e / _a.z);
	}
	getViewSize(e, t) {
		return this.getViewBounds(e, va, ya), t.subVectors(ya, va);
	}
	setViewOffset(e, t, n, r, i, a) {
		this.aspect = e / t, this.view === null && (this.view = {
			enabled: !0,
			fullWidth: 1,
			fullHeight: 1,
			offsetX: 0,
			offsetY: 0,
			width: 1,
			height: 1
		}), this.view.enabled = !0, this.view.fullWidth = e, this.view.fullHeight = t, this.view.offsetX = n, this.view.offsetY = r, this.view.width = i, this.view.height = a, this.updateProjectionMatrix();
	}
	clearViewOffset() {
		this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix();
	}
	updateProjectionMatrix() {
		let e = this.near, t = e * Math.tan(et * .5 * this.fov) / this.zoom, n = 2 * t, r = this.aspect * n, i = -.5 * r, a = this.view;
		if (this.view !== null && this.view.enabled) {
			let e = a.fullWidth, o = a.fullHeight;
			i += a.offsetX * r / e, t -= a.offsetY * n / o, r *= a.width / e, n *= a.height / o;
		}
		let o = this.filmOffset;
		o !== 0 && (i += e * o / this.getFilmWidth()), this.projectionMatrix.makePerspective(i, i + r, t, t - n, e, this.far, this.coordinateSystem, this.reversedDepth), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.fov = this.fov, t.object.zoom = this.zoom, t.object.near = this.near, t.object.far = this.far, t.object.focus = this.focus, t.object.aspect = this.aspect, this.view !== null && (t.object.view = Object.assign({}, this.view)), t.object.filmGauge = this.filmGauge, t.object.filmOffset = this.filmOffset, t;
	}
}, xa = class extends fa {
	constructor() {
		super(new ba(90, 1, .5, 500)), this.isPointLightShadow = !0;
	}
}, Sa = class extends sa {
	constructor(e, t, n = 0, r = 2) {
		super(e, t), this.isPointLight = !0, this.type = "PointLight", this.distance = n, this.decay = r, this.shadow = new xa();
	}
	get power() {
		return this.intensity * 4 * Math.PI;
	}
	set power(e) {
		this.intensity = e / (4 * Math.PI);
	}
	dispose() {
		super.dispose(), this.shadow.dispose();
	}
	copy(e, t) {
		return super.copy(e, t), this.distance = e.distance, this.decay = e.decay, this.shadow = e.shadow.clone(), this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.distance = this.distance, t.object.decay = this.decay, t.object.shadow = this.shadow.toJSON(), t;
	}
}, Ca = class extends ga {
	constructor(e = -1, t = 1, n = 1, r = -1, i = .1, a = 2e3) {
		super(), this.isOrthographicCamera = !0, this.type = "OrthographicCamera", this.zoom = 1, this.view = null, this.left = e, this.right = t, this.top = n, this.bottom = r, this.near = i, this.far = a, this.updateProjectionMatrix();
	}
	copy(e, t) {
		return super.copy(e, t), this.left = e.left, this.right = e.right, this.top = e.top, this.bottom = e.bottom, this.near = e.near, this.far = e.far, this.zoom = e.zoom, this.view = e.view === null ? null : Object.assign({}, e.view), this;
	}
	setViewOffset(e, t, n, r, i, a) {
		this.view === null && (this.view = {
			enabled: !0,
			fullWidth: 1,
			fullHeight: 1,
			offsetX: 0,
			offsetY: 0,
			width: 1,
			height: 1
		}), this.view.enabled = !0, this.view.fullWidth = e, this.view.fullHeight = t, this.view.offsetX = n, this.view.offsetY = r, this.view.width = i, this.view.height = a, this.updateProjectionMatrix();
	}
	clearViewOffset() {
		this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix();
	}
	updateProjectionMatrix() {
		let e = (this.right - this.left) / (2 * this.zoom), t = (this.top - this.bottom) / (2 * this.zoom), n = (this.right + this.left) / 2, r = (this.top + this.bottom) / 2, i = n - e, a = n + e, o = r + t, s = r - t;
		if (this.view !== null && this.view.enabled) {
			let e = (this.right - this.left) / this.view.fullWidth / this.zoom, t = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
			i += e * this.view.offsetX, a = i + e * this.view.width, o -= t * this.view.offsetY, s = o - t * this.view.height;
		}
		this.projectionMatrix.makeOrthographic(i, a, o, s, this.near, this.far, this.coordinateSystem, this.reversedDepth), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.zoom = this.zoom, t.object.left = this.left, t.object.right = this.right, t.object.top = this.top, t.object.bottom = this.bottom, t.object.near = this.near, t.object.far = this.far, this.view !== null && (t.object.view = Object.assign({}, this.view)), t;
	}
}, wa = class extends fa {
	constructor() {
		super(new Ca(-5, 5, 5, -5, .5, 500)), this.isDirectionalLightShadow = !0;
	}
}, Ta = class extends sa {
	constructor(e, t) {
		super(e, t), this.isDirectionalLight = !0, this.type = "DirectionalLight", this.position.copy(Sn.DEFAULT_UP), this.updateMatrix(), this.target = new Sn(), this.shadow = new wa();
	}
	dispose() {
		super.dispose(), this.shadow.dispose();
	}
	copy(e) {
		return super.copy(e), this.target = e.target.clone(), this.shadow = e.shadow.clone(), this;
	}
	toJSON(e) {
		let t = super.toJSON(e);
		return t.object.shadow = this.shadow.toJSON(), t.object.target = this.target.uuid, t;
	}
}, Ea = class extends Tr {
	constructor() {
		super(), this.isInstancedBufferGeometry = !0, this.type = "InstancedBufferGeometry", this.instanceCount = Infinity;
	}
	copy(e) {
		return super.copy(e), this.instanceCount = e.instanceCount, this;
	}
	toJSON() {
		let e = super.toJSON();
		return e.instanceCount = this.instanceCount, e.isInstancedBufferGeometry = !0, e;
	}
}, Da = -90, Oa = 1, ka = class extends Sn {
	constructor(e, t, n) {
		super(), this.type = "CubeCamera", this.renderTarget = n, this.coordinateSystem = null, this.activeMipmapLevel = 0;
		let r = new ba(Da, Oa, e, t);
		r.layers = this.layers, this.add(r);
		let i = new ba(Da, Oa, e, t);
		i.layers = this.layers, this.add(i);
		let a = new ba(Da, Oa, e, t);
		a.layers = this.layers, this.add(a);
		let o = new ba(Da, Oa, e, t);
		o.layers = this.layers, this.add(o);
		let s = new ba(Da, Oa, e, t);
		s.layers = this.layers, this.add(s);
		let c = new ba(Da, Oa, e, t);
		c.layers = this.layers, this.add(c);
	}
	updateCoordinateSystem() {
		let e = this.coordinateSystem, t = this.children.concat(), [n, r, i, a, o, s] = t;
		for (let e of t) this.remove(e);
		if (e === 2e3) n.up.set(0, 1, 0), n.lookAt(1, 0, 0), r.up.set(0, 1, 0), r.lookAt(-1, 0, 0), i.up.set(0, 0, -1), i.lookAt(0, 1, 0), a.up.set(0, 0, 1), a.lookAt(0, -1, 0), o.up.set(0, 1, 0), o.lookAt(0, 0, 1), s.up.set(0, 1, 0), s.lookAt(0, 0, -1);
		else if (e === 2001) n.up.set(0, -1, 0), n.lookAt(-1, 0, 0), r.up.set(0, -1, 0), r.lookAt(1, 0, 0), i.up.set(0, 0, 1), i.lookAt(0, 1, 0), a.up.set(0, 0, -1), a.lookAt(0, -1, 0), o.up.set(0, -1, 0), o.lookAt(0, 0, 1), s.up.set(0, -1, 0), s.lookAt(0, 0, -1);
		else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: " + e);
		for (let e of t) this.add(e), e.updateMatrixWorld();
	}
	update(e, t) {
		this.parent === null && this.updateMatrixWorld();
		let { renderTarget: n, activeMipmapLevel: r } = this;
		this.coordinateSystem !== e.coordinateSystem && (this.coordinateSystem = e.coordinateSystem, this.updateCoordinateSystem());
		let [i, a, o, s, c, l] = this.children, u = e.getRenderTarget(), d = e.getActiveCubeFace(), f = e.getActiveMipmapLevel(), p = e.xr.enabled;
		e.xr.enabled = !1;
		let m = n.texture.mipmapsAutoUpdate;
		n.texture.mipmapsAutoUpdate = !1;
		let h = !1;
		h = e.isWebGLRenderer === !0 ? e.state.buffers.depth.getReversed() : e.reversedDepthBuffer, e.setRenderTarget(n, 0, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, i), e.setRenderTarget(n, 1, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, a), e.setRenderTarget(n, 2, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, o), e.setRenderTarget(n, 3, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, s), e.setRenderTarget(n, 4, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, c), n.texture.mipmapsAutoUpdate = m, e.setRenderTarget(n, 5, r), h && e.autoClear === !1 && e.clearDepth(), e.render(t, l), e.setRenderTarget(u, d, f), e.xr.enabled = p, n.texture.needsPMREMUpdate = !0;
	}
}, Aa = class extends ba {
	constructor(e = []) {
		super(), this.isArrayCamera = !0, this.isMultiViewCamera = !1, this.cameras = e, this.perCameraFrustumCulled = !1;
	}
}, ja = class {
	constructor() {
		this._previousTime = 0, this._currentTime = 0, this._startTime = performance.now(), this._delta = 0, this._elapsed = 0, this._timescale = 1, this._document = null, this._pageVisibilityHandler = null;
	}
	connect(e) {
		this._document = e, e.hidden !== void 0 && (this._pageVisibilityHandler = Ma.bind(this), e.addEventListener("visibilitychange", this._pageVisibilityHandler, !1));
	}
	disconnect() {
		this._pageVisibilityHandler !== null && (this._document.removeEventListener("visibilitychange", this._pageVisibilityHandler), this._pageVisibilityHandler = null), this._document = null;
	}
	getDelta() {
		return this._delta / 1e3;
	}
	getElapsed() {
		return this._elapsed / 1e3;
	}
	getTimescale() {
		return this._timescale;
	}
	setTimescale(e) {
		return this._timescale = e, this;
	}
	reset() {
		return this._currentTime = performance.now() - this._startTime, this;
	}
	dispose() {
		this.disconnect();
	}
	update(e) {
		return this._pageVisibilityHandler !== null && this._document.hidden === !0 ? this._delta = 0 : (this._previousTime = this._currentTime, this._currentTime = (e === void 0 ? performance.now() : e) - this._startTime, this._delta = (this._currentTime - this._previousTime) * this._timescale, this._elapsed += this._delta), this;
	}
};
function Ma() {
	this._document.hidden === !1 && this.reset();
}
var Na = "\\[\\]\\.:\\/", Pa = /* @__PURE__ */ RegExp("[\\[\\]\\.:\\/]", "g"), Fa = "[^\\[\\]\\.:\\/]", Ia = "[^" + Na.replace("\\.", "") + "]", La = /*@__PURE__*/ "((?:WC+[\\/:])*)".replace("WC", Fa), Ra = /*@__PURE__*/ "(WCOD+)?".replace("WCOD", Ia), za = /*@__PURE__*/ "(?:\\.(WC+)(?:\\[(.+)\\])?)?".replace("WC", Fa), Ba = /*@__PURE__*/ "\\.(WC+)(?:\\[(.+)\\])?".replace("WC", Fa), Va = RegExp("^" + La + Ra + za + Ba + "$"), Ha = [
	"material",
	"materials",
	"bones",
	"map"
], Ua = class {
	constructor(e, t, n) {
		let r = n || Wa.parseTrackName(t);
		this._targetGroup = e, this._bindings = e.subscribe_(t, r);
	}
	getValue(e, t) {
		this.bind();
		let n = this._targetGroup.nCachedObjects_, r = this._bindings[n];
		r !== void 0 && r.getValue(e, t);
	}
	setValue(e, t) {
		let n = this._bindings;
		for (let r = this._targetGroup.nCachedObjects_, i = n.length; r !== i; ++r) n[r].setValue(e, t);
	}
	bind() {
		let e = this._bindings;
		for (let t = this._targetGroup.nCachedObjects_, n = e.length; t !== n; ++t) e[t].bind();
	}
	unbind() {
		let e = this._bindings;
		for (let t = this._targetGroup.nCachedObjects_, n = e.length; t !== n; ++t) e[t].unbind();
	}
}, Wa = class e {
	constructor(t, n, r) {
		this.path = n, this.parsedPath = r || e.parseTrackName(n), this.node = e.findNode(t, this.parsedPath.nodeName), this.rootNode = t, this.getValue = this._getValue_unbound, this.setValue = this._setValue_unbound;
	}
	static create(t, n, r) {
		return t && t.isAnimationObjectGroup ? new e.Composite(t, n, r) : new e(t, n, r);
	}
	static sanitizeNodeName(e) {
		return e.replace(/\s/g, "_").replace(Pa, "");
	}
	static parseTrackName(e) {
		let t = Va.exec(e);
		if (t === null) throw Error("THREE.PropertyBinding: Cannot parse trackName: " + e);
		let n = {
			nodeName: t[2],
			objectName: t[3],
			objectIndex: t[4],
			propertyName: t[5],
			propertyIndex: t[6]
		}, r = n.nodeName && n.nodeName.lastIndexOf(".");
		if (r !== void 0 && r !== -1) {
			let e = n.nodeName.substring(r + 1);
			Ha.indexOf(e) !== -1 && (n.nodeName = n.nodeName.substring(0, r), n.objectName = e);
		}
		if (n.propertyName === null || n.propertyName.length === 0) throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: " + e);
		return n;
	}
	static findNode(e, t) {
		if (t === void 0 || t === "" || t === "." || t === -1 || t === e.name || t === e.uuid) return e;
		if (e.skeleton) {
			let n = e.skeleton.getBoneByName(t);
			if (n !== void 0) return n;
		}
		if (e.children) {
			let n = function(e) {
				for (let r = 0; r < e.length; r++) {
					let i = e[r];
					if (i.name === t || i.uuid === t) return i;
					let a = n(i.children);
					if (a) return a;
				}
				return null;
			}, r = n(e.children);
			if (r) return r;
		}
		return null;
	}
	_getValue_unavailable() {}
	_setValue_unavailable() {}
	_getValue_direct(e, t) {
		e[t] = this.targetObject[this.propertyName];
	}
	_getValue_array(e, t) {
		let n = this.resolvedProperty;
		for (let r = 0, i = n.length; r !== i; ++r) e[t++] = n[r];
	}
	_getValue_arrayElement(e, t) {
		e[t] = this.resolvedProperty[this.propertyIndex];
	}
	_getValue_toArray(e, t) {
		this.resolvedProperty.toArray(e, t);
	}
	_setValue_direct(e, t) {
		this.targetObject[this.propertyName] = e[t];
	}
	_setValue_direct_setNeedsUpdate(e, t) {
		this.targetObject[this.propertyName] = e[t], this.targetObject.needsUpdate = !0;
	}
	_setValue_direct_setMatrixWorldNeedsUpdate(e, t) {
		this.targetObject[this.propertyName] = e[t], this.targetObject.matrixWorldNeedsUpdate = !0;
	}
	_setValue_array(e, t) {
		let n = this.resolvedProperty;
		for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
	}
	_setValue_array_setNeedsUpdate(e, t) {
		let n = this.resolvedProperty;
		for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
		this.targetObject.needsUpdate = !0;
	}
	_setValue_array_setMatrixWorldNeedsUpdate(e, t) {
		let n = this.resolvedProperty;
		for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
		this.targetObject.matrixWorldNeedsUpdate = !0;
	}
	_setValue_arrayElement(e, t) {
		this.resolvedProperty[this.propertyIndex] = e[t];
	}
	_setValue_arrayElement_setNeedsUpdate(e, t) {
		this.resolvedProperty[this.propertyIndex] = e[t], this.targetObject.needsUpdate = !0;
	}
	_setValue_arrayElement_setMatrixWorldNeedsUpdate(e, t) {
		this.resolvedProperty[this.propertyIndex] = e[t], this.targetObject.matrixWorldNeedsUpdate = !0;
	}
	_setValue_fromArray(e, t) {
		this.resolvedProperty.fromArray(e, t);
	}
	_setValue_fromArray_setNeedsUpdate(e, t) {
		this.resolvedProperty.fromArray(e, t), this.targetObject.needsUpdate = !0;
	}
	_setValue_fromArray_setMatrixWorldNeedsUpdate(e, t) {
		this.resolvedProperty.fromArray(e, t), this.targetObject.matrixWorldNeedsUpdate = !0;
	}
	_getValue_unbound(e, t) {
		this.bind(), this.getValue(e, t);
	}
	_setValue_unbound(e, t) {
		this.bind(), this.setValue(e, t);
	}
	bind() {
		let t = this.node, n = this.parsedPath, r = n.objectName, i = n.propertyName, a = n.propertyIndex;
		if (t || (t = e.findNode(this.rootNode, n.nodeName), this.node = t), this.getValue = this._getValue_unavailable, this.setValue = this._setValue_unavailable, !t) {
			G("PropertyBinding: No target node found for track: " + this.path + ".");
			return;
		}
		if (r) {
			let e = n.objectIndex;
			switch (r) {
				case "materials":
					if (!t.material) {
						K("PropertyBinding: Can not bind to material as node does not have a material.", this);
						return;
					}
					if (!t.material.materials) {
						K("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.", this);
						return;
					}
					t = t.material.materials;
					break;
				case "bones":
					if (!t.skeleton) {
						K("PropertyBinding: Can not bind to bones as node does not have a skeleton.", this);
						return;
					}
					t = t.skeleton.bones;
					for (let n = 0; n < t.length; n++) if (t[n].name === e) {
						e = n;
						break;
					}
					break;
				case "map":
					if ("map" in t) {
						t = t.map;
						break;
					}
					if (!t.material) {
						K("PropertyBinding: Can not bind to material as node does not have a material.", this);
						return;
					}
					if (!t.material.map) {
						K("PropertyBinding: Can not bind to material.map as node.material does not have a map.", this);
						return;
					}
					t = t.material.map;
					break;
				default:
					if (t[r] === void 0) {
						K("PropertyBinding: Can not bind to objectName of node undefined.", this);
						return;
					}
					t = t[r];
			}
			if (e !== void 0) {
				if (t[e] === void 0) {
					K("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.", this, t);
					return;
				}
				t = t[e];
			}
		}
		let o = t[i];
		if (o === void 0) {
			let e = n.nodeName;
			K("PropertyBinding: Trying to update property for track: " + e + "." + i + " but it wasn't found.", t);
			return;
		}
		let s = this.Versioning.None;
		this.targetObject = t, t.isMaterial === !0 ? s = this.Versioning.NeedsUpdate : t.isObject3D === !0 && (s = this.Versioning.MatrixWorldNeedsUpdate);
		let c = this.BindingType.Direct;
		if (a !== void 0) {
			if (i === "morphTargetInfluences") {
				if (!t.geometry) {
					K("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.", this);
					return;
				}
				if (!t.geometry.morphAttributes) {
					K("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.", this);
					return;
				}
				t.morphTargetDictionary[a] !== void 0 && (a = t.morphTargetDictionary[a]);
			}
			c = this.BindingType.ArrayElement, this.resolvedProperty = o, this.propertyIndex = a;
		} else o.fromArray !== void 0 && o.toArray !== void 0 ? (c = this.BindingType.HasFromToArray, this.resolvedProperty = o) : Array.isArray(o) ? (c = this.BindingType.EntireArray, this.resolvedProperty = o) : this.propertyName = i;
		this.getValue = this.GetterByBindingType[c], this.setValue = this.SetterByBindingTypeAndVersioning[c][s];
	}
	unbind() {
		this.node = null, this.getValue = this._getValue_unbound, this.setValue = this._setValue_unbound;
	}
};
Wa.Composite = Ua, Wa.prototype.BindingType = {
	Direct: 0,
	EntireArray: 1,
	ArrayElement: 2,
	HasFromToArray: 3
}, Wa.prototype.Versioning = {
	None: 0,
	NeedsUpdate: 1,
	MatrixWorldNeedsUpdate: 2
}, Wa.prototype.GetterByBindingType = [
	Wa.prototype._getValue_direct,
	Wa.prototype._getValue_array,
	Wa.prototype._getValue_arrayElement,
	Wa.prototype._getValue_toArray
], Wa.prototype.SetterByBindingTypeAndVersioning = [
	[
		Wa.prototype._setValue_direct,
		Wa.prototype._setValue_direct_setNeedsUpdate,
		Wa.prototype._setValue_direct_setMatrixWorldNeedsUpdate
	],
	[
		Wa.prototype._setValue_array,
		Wa.prototype._setValue_array_setNeedsUpdate,
		Wa.prototype._setValue_array_setMatrixWorldNeedsUpdate
	],
	[
		Wa.prototype._setValue_arrayElement,
		Wa.prototype._setValue_arrayElement_setNeedsUpdate,
		Wa.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate
	],
	[
		Wa.prototype._setValue_fromArray,
		Wa.prototype._setValue_fromArray_setNeedsUpdate,
		Wa.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate
	]
];
var Ga = class {
	constructor(e = 1, t = 0, n = 0) {
		this.radius = e, this.phi = t, this.theta = n;
	}
	set(e, t, n) {
		return this.radius = e, this.phi = t, this.theta = n, this;
	}
	copy(e) {
		return this.radius = e.radius, this.phi = e.phi, this.theta = e.theta, this;
	}
	makeSafe() {
		let e = 1e-6;
		return this.phi = q(this.phi, e, Math.PI - e), this;
	}
	setFromVector3(e) {
		return this.setFromCartesianCoords(e.x, e.y, e.z);
	}
	setFromCartesianCoords(e, t, n) {
		return this.radius = Math.sqrt(e * e + t * t + n * n), this.radius === 0 ? (this.theta = 0, this.phi = 0) : (this.theta = Math.atan2(e, n), this.phi = Math.acos(q(t / this.radius, -1, 1))), this;
	}
	clone() {
		return new this.constructor().copy(this);
	}
};
(class {
	static {
		this.prototype.isMatrix2 = !0;
	}
	constructor(e, t, n, r) {
		this.elements = [
			1,
			0,
			0,
			1
		], e !== void 0 && this.set(e, t, n, r);
	}
	identity() {
		return this.set(1, 0, 0, 1), this;
	}
	fromArray(e, t = 0) {
		for (let n = 0; n < 4; n++) this.elements[n] = e[n + t];
		return this;
	}
	set(e, t, n, r) {
		let i = this.elements;
		return i[0] = e, i[2] = t, i[1] = n, i[3] = r, this;
	}
});
var Ka = class extends vi {
	constructor(e = 10, t = 10, n = 4473924, r = 8947848) {
		n = new Z(n), r = new Z(r);
		let i = t / 2, a = e / t, o = e / 2, s = [], c = [];
		for (let e = 0, l = 0, u = -o; e <= t; e++, u += a) {
			s.push(-o, 0, u, o, 0, u), s.push(u, 0, -o, u, 0, o);
			let t = e === i ? n : r;
			t.toArray(c, l), l += 3, t.toArray(c, l), l += 3, t.toArray(c, l), l += 3, t.toArray(c, l), l += 3;
		}
		let l = new Tr();
		l.setAttribute("position", new pr(s, 3)), l.setAttribute("color", new pr(c, 3));
		let u = new oi({
			vertexColors: !0,
			toneMapped: !1
		});
		super(l, u), this.type = "GridHelper";
	}
	dispose() {
		super.dispose(), this.geometry.dispose(), this.material.dispose();
	}
}, qa = class extends Ze {
	constructor(e, t = null) {
		super(), this.object = e, this.domElement = t, this.enabled = !0, this.state = -1, this.keys = {}, this.mouseButtons = {
			LEFT: null,
			MIDDLE: null,
			RIGHT: null
		}, this.touches = {
			ONE: null,
			TWO: null
		};
	}
	connect(e) {
		this.domElement !== null && this.disconnect(), this.domElement = e;
	}
	disconnect() {}
	dispose() {}
	update() {}
};
function Ja(e, t, n, r) {
	let i = Ya(r);
	switch (n) {
		case w: return e * t;
		case k: return e * t / i.components * i.byteLength;
		case A: return e * t / i.components * i.byteLength;
		case j: return e * t * 2 / i.components * i.byteLength;
		case M: return e * t * 2 / i.components * i.byteLength;
		case T: return e * t * 3 / i.components * i.byteLength;
		case E: return e * t * 4 / i.components * i.byteLength;
		case N: return e * t * 4 / i.components * i.byteLength;
		case P:
		case F: return Math.floor((e + 3) / 4) * Math.floor((t + 3) / 4) * 8;
		case I:
		case L: return Math.floor((e + 3) / 4) * Math.floor((t + 3) / 4) * 16;
		case ee:
		case z: return Math.max(e, 16) * Math.max(t, 8) / 4;
		case R:
		case te: return Math.max(e, 8) * Math.max(t, 8) / 2;
		case ne:
		case re:
		case ie:
		case ae: return Math.floor((e + 3) / 4) * Math.floor((t + 3) / 4) * 8;
		case B:
		case oe:
		case se: return Math.floor((e + 3) / 4) * Math.floor((t + 3) / 4) * 16;
		case ce: return Math.floor((e + 3) / 4) * Math.floor((t + 3) / 4) * 16;
		case le: return Math.floor((e + 4) / 5) * Math.floor((t + 3) / 4) * 16;
		case ue: return Math.floor((e + 4) / 5) * Math.floor((t + 4) / 5) * 16;
		case de: return Math.floor((e + 5) / 6) * Math.floor((t + 4) / 5) * 16;
		case fe: return Math.floor((e + 5) / 6) * Math.floor((t + 5) / 6) * 16;
		case pe: return Math.floor((e + 7) / 8) * Math.floor((t + 4) / 5) * 16;
		case me: return Math.floor((e + 7) / 8) * Math.floor((t + 5) / 6) * 16;
		case he: return Math.floor((e + 7) / 8) * Math.floor((t + 7) / 8) * 16;
		case ge: return Math.floor((e + 9) / 10) * Math.floor((t + 4) / 5) * 16;
		case _e: return Math.floor((e + 9) / 10) * Math.floor((t + 5) / 6) * 16;
		case ve: return Math.floor((e + 9) / 10) * Math.floor((t + 7) / 8) * 16;
		case ye: return Math.floor((e + 9) / 10) * Math.floor((t + 9) / 10) * 16;
		case be: return Math.floor((e + 11) / 12) * Math.floor((t + 9) / 10) * 16;
		case xe: return Math.floor((e + 11) / 12) * Math.floor((t + 11) / 12) * 16;
		case Se:
		case Ce:
		case we: return Math.ceil(e / 4) * Math.ceil(t / 4) * 16;
		case Te:
		case Ee: return Math.ceil(e / 4) * Math.ceil(t / 4) * 8;
		case De:
		case Oe: return Math.ceil(e / 4) * Math.ceil(t / 4) * 16;
	}
	throw Error(`Unable to determine texture byte length for ${n} format.`);
}
function Ya(e) {
	switch (e) {
		case d:
		case f: return {
			byteLength: 1,
			components: 1
		};
		case m:
		case p:
		case v: return {
			byteLength: 2,
			components: 1
		};
		case y:
		case b: return {
			byteLength: 2,
			components: 4
		};
		case g:
		case h:
		case _: return {
			byteLength: 4,
			components: 1
		};
		case S:
		case C: return {
			byteLength: 4,
			components: 3
		};
	}
	throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`);
}
typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: { revision: "187" } })), typeof window < "u" && (window.__THREE__ ? G("WARNING: Multiple instances of Three.js being imported.") : window.__THREE__ = "187");
// ../../../../Downloads/FX-Forge-源码及Web-20261110/FX-Forge/node_modules/three/build/three.module.js
function Xa() {
	let e = null, t = !1, n = null, r = null;
	function i(t, a) {
		r = e.requestAnimationFrame(i), n(t, a);
	}
	return {
		start: function() {
			t !== !0 && n !== null && e !== null && (r = e.requestAnimationFrame(i), t = !0);
		},
		stop: function() {
			e !== null && e.cancelAnimationFrame(r), t = !1;
		},
		setAnimationLoop: function(e) {
			n = e;
		},
		setContext: function(t) {
			e = t;
		}
	};
}
function Za(e) {
	let t = /* @__PURE__ */ new WeakMap();
	function n(t, n) {
		let r = t.array, i = t.usage, a = r.byteLength, o = e.createBuffer();
		e.bindBuffer(n, o), e.bufferData(n, r, i), t.onUploadCallback();
		let s;
		if (r instanceof Float32Array) s = e.FLOAT;
		else if (typeof Float16Array < "u" && r instanceof Float16Array) s = e.HALF_FLOAT;
		else if (r instanceof Uint16Array) s = t.isFloat16BufferAttribute ? e.HALF_FLOAT : e.UNSIGNED_SHORT;
		else if (r instanceof Int16Array) s = e.SHORT;
		else if (r instanceof Uint32Array) s = e.UNSIGNED_INT;
		else if (r instanceof Int32Array) s = e.INT;
		else if (r instanceof Int8Array) s = e.BYTE;
		else if (r instanceof Uint8Array) s = e.UNSIGNED_BYTE;
		else if (r instanceof Uint8ClampedArray) s = e.UNSIGNED_BYTE;
		else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: " + r);
		return {
			buffer: o,
			type: s,
			bytesPerElement: r.BYTES_PER_ELEMENT,
			version: t.version,
			size: a
		};
	}
	function r(t, n, r) {
		let i = n.array, a = n.updateRanges;
		if (e.bindBuffer(r, t), a.length === 0) e.bufferSubData(r, 0, i);
		else {
			a.sort((e, t) => e.start - t.start);
			let t = 0;
			for (let e = 1; e < a.length; e++) {
				let n = a[t], r = a[e];
				r.start <= n.start + n.count + 1 ? n.count = Math.max(n.count, r.start + r.count - n.start) : (++t, a[t] = r);
			}
			a.length = t + 1;
			for (let t = 0, n = a.length; t < n; t++) {
				let n = a[t];
				e.bufferSubData(r, n.start * i.BYTES_PER_ELEMENT, i, n.start, n.count);
			}
			n.clearUpdateRanges();
		}
		n.onUploadCallback();
	}
	function i(e) {
		return e.isInterleavedBufferAttribute && (e = e.data), t.get(e);
	}
	function a(n) {
		n.isInterleavedBufferAttribute && (n = n.data);
		let r = t.get(n);
		r && (e.deleteBuffer(r.buffer), t.delete(n));
	}
	function o(e, i) {
		if (e.isInterleavedBufferAttribute && (e = e.data), e.isGLBufferAttribute) {
			let n = t.get(e);
			(!n || n.version < e.version) && t.set(e, {
				buffer: e.buffer,
				type: e.type,
				bytesPerElement: e.elementSize,
				version: e.version
			});
			return;
		}
		let a = t.get(e);
		if (a === void 0) t.set(e, n(e, i));
		else if (a.version < e.version) {
			if (a.size !== e.array.byteLength) throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");
			r(a.buffer, e, i), a.version = e.version;
		}
	}
	return {
		get: i,
		remove: a,
		update: o
	};
}
var Qa = {
	alphahash_fragment: "#ifdef USE_ALPHAHASH\n	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;\n#endif",
	alphahash_pars_fragment: "#ifdef USE_ALPHAHASH\n	const float ALPHA_HASH_SCALE = 0.05;\n	float hash2D( vec2 value ) {\n		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );\n	}\n	float hash3D( vec3 value ) {\n		return hash2D( vec2( hash2D( value.xy ), value.z ) );\n	}\n	float getAlphaHashThreshold( vec3 position ) {\n		float maxDeriv = max(\n			length( dFdx( position.xyz ) ),\n			length( dFdy( position.xyz ) )\n		);\n		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );\n		vec2 pixScales = vec2(\n			exp2( floor( log2( pixScale ) ) ),\n			exp2( ceil( log2( pixScale ) ) )\n		);\n		vec2 alpha = vec2(\n			hash3D( floor( pixScales.x * position.xyz ) ),\n			hash3D( floor( pixScales.y * position.xyz ) )\n		);\n		float lerpFactor = fract( log2( pixScale ) );\n		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;\n		float a = min( lerpFactor, 1.0 - lerpFactor );\n		vec3 cases = vec3(\n			x * x / ( 2.0 * a * ( 1.0 - a ) ),\n			( x - 0.5 * a ) / ( 1.0 - a ),\n			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )\n		);\n		float threshold = ( x < ( 1.0 - a ) )\n			? ( ( x < a ) ? cases.x : cases.y )\n			: cases.z;\n		return clamp( threshold , 1.0e-6, 1.0 );\n	}\n#endif",
	alphamap_fragment: "#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;\n#endif",
	alphamap_pars_fragment: "#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif",
	alphatest_fragment: "#ifdef USE_ALPHATEST\n	#ifdef ALPHA_TO_COVERAGE\n	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );\n	if ( diffuseColor.a == 0.0 ) discard;\n	#else\n	if ( diffuseColor.a < alphaTest ) discard;\n	#endif\n#endif",
	alphatest_pars_fragment: "#ifdef USE_ALPHATEST\n	uniform float alphaTest;\n#endif",
	aomap_fragment: "#ifdef USE_AOMAP\n	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;\n	reflectedLight.indirectDiffuse *= ambientOcclusion;\n	#if defined( USE_CLEARCOAT ) \n		clearcoatSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_SHEEN ) \n		sheenSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( STANDARD )\n		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n	#endif\n#endif",
	aomap_pars_fragment: "#ifdef USE_AOMAP\n	uniform sampler2D aoMap;\n	uniform float aoMapIntensity;\n#endif",
	batching_pars_vertex: "#ifdef USE_BATCHING\n	#if ! defined( GL_ANGLE_multi_draw )\n	#define gl_DrawID _gl_DrawID\n	uniform int _gl_DrawID;\n	#endif\n	uniform highp sampler2D batchingTexture;\n	uniform highp usampler2D batchingIdTexture;\n	mat4 getBatchingMatrix( const in float i ) {\n		int size = textureSize( batchingTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n	float getIndirectIndex( const in int i ) {\n		int size = textureSize( batchingIdTexture, 0 ).x;\n		int x = i % size;\n		int y = i / size;\n		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );\n	}\n#endif\n#ifdef USE_BATCHING_COLOR\n	uniform sampler2D batchingColorTexture;\n	vec4 getBatchingColor( const in float i ) {\n		int size = textureSize( batchingColorTexture, 0 ).x;\n		int j = int( i );\n		int x = j % size;\n		int y = j / size;\n		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );\n	}\n#endif",
	batching_vertex: "#ifdef USE_BATCHING\n	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );\n#endif",
	begin_vertex: "vec3 transformed = vec3( position );\n#ifdef USE_ALPHAHASH\n	vPosition = vec3( position );\n#endif",
	beginnormal_vertex: "vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\n	vec3 objectTangent = vec3( tangent.xyz );\n#endif",
	bsdfs: "float G_BlinnPhong_Implicit( ) {\n	return 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( specularColor, 1.0, dotVH );\n	float G = G_BlinnPhong_Implicit( );\n	float D = D_BlinnPhong( shininess, dotNH );\n	return F * ( G * D );\n} // validated",
	iridescence_fragment: "#ifdef USE_IRIDESCENCE\n	const mat3 XYZ_TO_REC709 = mat3(\n		 3.2404542, -0.9692660,  0.0556434,\n		-1.5371385,  1.8760108, -0.2040259,\n		-0.4985314,  0.0415560,  1.0572252\n	);\n	vec3 Fresnel0ToIor( vec3 fresnel0 ) {\n		vec3 sqrtF0 = sqrt( fresnel0 );\n		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );\n	}\n	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );\n	}\n	float IorToFresnel0( float transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));\n	}\n	vec3 evalSensitivity( float OPD, vec3 shift ) {\n		float phase = 2.0 * PI * OPD * 1.0e-9;\n		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );\n		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );\n		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );\n		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );\n		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );\n		xyz /= 1.0685e-7;\n		vec3 rgb = XYZ_TO_REC709 * xyz;\n		return rgb;\n	}\n	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {\n		vec3 I;\n		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );\n		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );\n		float cosTheta2Sq = 1.0 - sinTheta2Sq;\n		if ( cosTheta2Sq < 0.0 ) {\n			return vec3( 1.0 );\n		}\n		float cosTheta2 = sqrt( cosTheta2Sq );\n		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );\n		float R12 = F_Schlick( R0, 1.0, cosTheta1 );\n		float T121 = 1.0 - R12;\n		float phi12 = 0.0;\n		if ( iridescenceIOR < outsideIOR ) phi12 = PI;\n		float phi21 = PI - phi12;\n		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );\n		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );\n		vec3 phi23 = vec3( 0.0 );\n		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;\n		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;\n		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;\n		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;\n		vec3 phi = vec3( phi21 ) + phi23;\n		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );\n		vec3 r123 = sqrt( R123 );\n		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );\n		vec3 C0 = R12 + Rs;\n		I = C0;\n		vec3 Cm = Rs - T121;\n		for ( int m = 1; m <= 2; ++ m ) {\n			Cm *= r123;\n			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );\n			I += Cm * Sm;\n		}\n		return max( I, vec3( 0.0 ) );\n	}\n#endif",
	bumpmap_pars_fragment: "#ifdef USE_BUMPMAP\n	uniform sampler2D bumpMap;\n	uniform float bumpScale;\n	vec2 dHdxy_fwd() {\n		vec2 dSTdx = dFdx( vBumpMapUv );\n		vec2 dSTdy = dFdy( vBumpMapUv );\n		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;\n		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;\n		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;\n		return vec2( dBx, dBy );\n	}\n	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {\n		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );\n		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );\n		vec3 vN = surf_norm;\n		vec3 R1 = cross( vSigmaY, vN );\n		vec3 R2 = cross( vN, vSigmaX );\n		float fDet = dot( vSigmaX, R1 ) * faceDirection;\n		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n		return normalize( abs( fDet ) * surf_norm - vGrad );\n	}\n#endif",
	clipping_planes_fragment: "#if NUM_CLIPPING_PLANES > 0\n	vec4 plane;\n	#ifdef ALPHA_TO_COVERAGE\n		float distanceToPlane, distanceGradient;\n		float clipOpacity = 1.0;\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n			distanceGradient = fwidth( distanceToPlane ) / 2.0;\n			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			if ( clipOpacity == 0.0 ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			float unionClipOpacity = 1.0;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n				distanceGradient = fwidth( distanceToPlane ) / 2.0;\n				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			}\n			#pragma unroll_loop_end\n			clipOpacity *= 1.0 - unionClipOpacity;\n		#endif\n		diffuseColor.a *= clipOpacity;\n		if ( diffuseColor.a == 0.0 ) discard;\n	#else\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			bool clipped = true;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;\n			}\n			#pragma unroll_loop_end\n			if ( clipped ) discard;\n		#endif\n	#endif\n#endif",
	clipping_planes_pars_fragment: "#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif",
	clipping_planes_pars_vertex: "#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n#endif",
	clipping_planes_vertex: "#if NUM_CLIPPING_PLANES > 0\n	vClipPosition = - mvPosition.xyz;\n#endif",
	color_fragment: "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	diffuseColor *= vColor;\n#endif",
	color_pars_fragment: "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	varying vec4 vColor;\n#endif",
	color_pars_vertex: "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	varying vec4 vColor;\n#endif",
	color_vertex: "#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	vColor = vec4( 1.0 );\n#endif\n#ifdef USE_COLOR_ALPHA\n	vColor *= color;\n#elif defined( USE_COLOR )\n	vColor.rgb *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n	vColor.rgb *= instanceColor.rgb;\n#endif\n#ifdef USE_BATCHING_COLOR\n	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );\n#endif",
	common: "#define PI 3.141592653589793\n#define PI2 6.283185307179586\n#define PI_HALF 1.5707963267948966\n#define RECIPROCAL_PI 0.3183098861837907\n#define RECIPROCAL_PI2 0.15915494309189535\n#define EPSILON 1e-6\n#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\n#define whiteComplement( a ) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nvec3 pow2( const in vec3 x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }\nfloat average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }\nhighp float rand( const in vec2 uv ) {\n	const highp float a = 12.9898, b = 78.233, c = 43758.5453;\n	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n	return fract( sin( sn ) * c );\n}\n#ifdef HIGH_PRECISION\n	float precisionSafeLength( vec3 v ) { return length( v ); }\n#else\n	float precisionSafeLength( vec3 v ) {\n		float maxComponent = max3( abs( v ) );\n		return length( v / maxComponent ) * maxComponent;\n	}\n#endif\nstruct IncidentLight {\n	vec3 color;\n	vec3 direction;\n	bool visible;\n};\nstruct ReflectedLight {\n	vec3 directDiffuse;\n	vec3 directSpecular;\n	vec3 indirectDiffuse;\n	vec3 indirectSpecular;\n};\n#ifdef USE_ALPHAHASH\n	varying vec3 vPosition;\n#endif\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\n#define inverseTransformDirection transformDirectionByInverseViewMatrix\nvec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {\n	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );\n}\nvec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {\n	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );\n}\nbool isPerspectiveMatrix( mat4 m ) {\n	return m[ 2 ][ 3 ] == - 1.0;\n}\nvec2 equirectUv( in vec3 dir ) {\n	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n	return vec2( u, v );\n}\nvec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n	return RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n}\nfloat F_Schlick( const in float f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n} // validated",
	defaultnormal_vertex: "vec3 transformedNormal = objectNormal;\n#ifdef USE_TANGENT\n	vec3 transformedTangent = objectTangent;\n#endif\n#ifdef USE_BATCHING\n	mat3 bm = mat3( batchingMatrix );\n	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n	transformedNormal = bm * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = bm * transformedTangent;\n	#endif\n#endif\n#ifdef USE_INSTANCING\n	mat3 im = mat3( instanceMatrix );\n	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );\n	transformedNormal = im * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = im * transformedTangent;\n	#endif\n#endif\ntransformedNormal = normalMatrix * transformedNormal;\n#ifdef FLIP_SIDED\n	transformedNormal = - transformedNormal;\n#endif\n#ifdef USE_TANGENT\n	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;\n#endif",
	displacementmap_pars_vertex: "#ifdef USE_DISPLACEMENTMAP\n	uniform sampler2D displacementMap;\n	uniform float displacementScale;\n	uniform float displacementBias;\n#endif",
	displacementmap_vertex: "#ifdef USE_DISPLACEMENTMAP\n	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );\n#endif",
	emissivemap_fragment: "#ifdef USE_EMISSIVEMAP\n	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE\n		emissiveColor = sRGBTransferEOTF( emissiveColor );\n	#endif\n	totalEmissiveRadiance *= emissiveColor.rgb;\n#endif",
	emissivemap_pars_fragment: "#ifdef USE_EMISSIVEMAP\n	uniform sampler2D emissiveMap;\n#endif",
	colorspace_fragment: "gl_FragColor = linearToOutputTexel( gl_FragColor );",
	colorspace_pars_fragment: "vec4 LinearTransferOETF( in vec4 value ) {\n	return value;\n}\nvec4 sRGBTransferEOTF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 sRGBTransferOETF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}",
	envmap_fragment: "#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vec3 cameraToFrag;\n		if ( isOrthographic ) {\n			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToFrag = normalize( vWorldPosition - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vec3 reflectVec = reflect( cameraToFrag, worldNormal );\n		#else\n			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );\n		#endif\n	#else\n		vec3 reflectVec = vReflect;\n	#endif\n	#ifdef ENVMAP_TYPE_CUBE\n		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );\n		#ifdef ENVMAP_BLENDING_MULTIPLY\n			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_MIX )\n			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_ADD )\n			outgoingLight += envColor.xyz * specularStrength * reflectivity;\n		#endif\n	#endif\n#endif",
	envmap_common_pars_fragment: "#ifdef USE_ENVMAP\n	uniform float envMapIntensity;\n	uniform mat3 envMapRotation;\n	uniform samplerCube envMap;\n	#ifdef ENVMAP_TYPE_PMREM\n		float roughnessToMip( const in float roughness ) {\n			float r = clamp( roughness, 0.0, 1.0 );\n			return ENVMAP_MAX_LOD * r * ( 2.0 - r );\n		}\n	#endif\n#endif",
	envmap_pars_fragment: "#ifdef USE_ENVMAP\n	uniform float reflectivity;\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		varying vec3 vWorldPosition;\n		uniform float refractionRatio;\n	#else\n		varying vec3 vReflect;\n	#endif\n#endif",
	envmap_pars_vertex: "#ifdef USE_ENVMAP\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		\n		varying vec3 vWorldPosition;\n	#else\n		varying vec3 vReflect;\n		uniform float refractionRatio;\n	#endif\n#endif",
	envmap_physical_pars_fragment: "#ifdef USE_ENVMAP\n	vec3 getIBLIrradiance( const in vec3 normal ) {\n		#ifdef ENVMAP_TYPE_PMREM\n			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );\n			return PI * envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n		#ifdef ENVMAP_TYPE_PMREM\n			vec3 reflectVec = reflect( - viewDir, normal );\n			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );\n			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );\n			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );\n			return envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	#ifdef USE_RETROREFLECTION\n		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n			#ifdef ENVMAP_TYPE_PMREM\n				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );\n				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );\n				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );\n				return envMapColor.rgb * envMapIntensity;\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n	#endif\n	#ifdef USE_ANISOTROPY\n		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n			#ifdef ENVMAP_TYPE_PMREM\n				vec3 bentNormal = cross( bitangent, viewDir );\n				bentNormal = normalize( cross( bentNormal, bitangent ) );\n				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n				return getIBLRadiance( viewDir, bentNormal, roughness );\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n		#ifdef USE_RETROREFLECTION\n			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n				#ifdef ENVMAP_TYPE_PMREM\n					vec3 bentNormal = cross( bitangent, viewDir );\n					bentNormal = normalize( cross( bentNormal, bitangent ) );\n					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n					return getIBLRetroRadiance( viewDir, bentNormal, roughness );\n				#else\n					return vec3( 0.0 );\n				#endif\n			}\n		#endif\n	#endif\n#endif",
	envmap_vertex: "#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vWorldPosition = worldPosition.xyz;\n	#else\n		vec3 cameraToVertex;\n		if ( isOrthographic ) {\n			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vReflect = reflect( cameraToVertex, worldNormal );\n		#else\n			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n		#endif\n	#endif\n#endif",
	fog_vertex: "#ifdef USE_FOG\n	vFogDepth = - mvPosition.z;\n#endif",
	fog_pars_vertex: "#ifdef USE_FOG\n	varying float vFogDepth;\n#endif",
	fog_fragment: "#ifdef USE_FOG\n	#ifdef FOG_EXP2\n		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n	#else\n		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n	#endif\n	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif",
	fog_pars_fragment: "#ifdef USE_FOG\n	uniform vec3 fogColor;\n	varying float vFogDepth;\n	#ifdef FOG_EXP2\n		uniform float fogDensity;\n	#else\n		uniform float fogNear;\n		uniform float fogFar;\n	#endif\n#endif",
	gradientmap_pars_fragment: "#ifdef USE_GRADIENTMAP\n	uniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n	float dotNL = dot( normal, lightDirection );\n	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n	#ifdef USE_GRADIENTMAP\n		return vec3( texture2D( gradientMap, coord ).r );\n	#else\n		vec2 fw = fwidth( coord ) * 0.5;\n		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );\n	#endif\n}",
	lightmap_pars_fragment: "#ifdef USE_LIGHTMAP\n	uniform sampler2D lightMap;\n	uniform float lightMapIntensity;\n#endif",
	lights_lambert_fragment: "LambertMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularStrength = specularStrength;",
	lights_lambert_pars_fragment: "varying vec3 vViewPosition;\nstruct LambertMaterial {\n	vec3 diffuseColor;\n	float specularStrength;\n};\nvoid RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Lambert\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert",
	lights_pars_begin: "uniform bool receiveShadow;\nuniform vec3 ambientLightColor;\n#if defined( USE_LIGHT_PROBES )\n	uniform vec3 lightProbe[ 9 ];\n#endif\nvec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {\n	float x = normal.x, y = normal.y, z = normal.z;\n	vec3 result = shCoefficients[ 0 ] * 0.886227;\n	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;\n	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;\n	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;\n	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;\n	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;\n	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );\n	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;\n	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );\n	return result;\n}\nvec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {\n	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );\n	return irradiance;\n}\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n	vec3 irradiance = ambientLightColor;\n	return irradiance;\n}\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n	if ( cutoffDistance > 0.0 ) {\n		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n	}\n	return distanceFalloff;\n}\nfloat getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {\n	return smoothstep( coneCosine, penumbraCosine, angleCosine );\n}\n#if NUM_SUN_LIGHTS > 0\n	struct SunLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];\n	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {\n		light.color = sunLight.color;\n		light.direction = sunLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_DIR_LIGHTS > 0\n	struct DirectionalLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {\n		light.color = directionalLight.color;\n		light.direction = directionalLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_POINT_LIGHTS > 0\n	struct PointLight {\n		vec3 position;\n		vec3 color;\n		float distance;\n		float decay;\n	};\n	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = pointLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float lightDistance = length( lVector );\n		light.color = pointLight.color;\n		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );\n		light.visible = ( light.color != vec3( 0.0 ) );\n	}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n	struct SpotLight {\n		vec3 position;\n		vec3 direction;\n		vec3 color;\n		float distance;\n		float decay;\n		float coneCos;\n		float penumbraCos;\n	};\n	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = spotLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float angleCos = dot( light.direction, spotLight.direction );\n		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n		if ( spotAttenuation > 0.0 ) {\n			float lightDistance = length( lVector );\n			light.color = spotLight.color * spotAttenuation;\n			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );\n			light.visible = ( light.color != vec3( 0.0 ) );\n		} else {\n			light.color = vec3( 0.0 );\n			light.visible = false;\n		}\n	}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n	struct RectAreaLight {\n		vec3 color;\n		vec3 position;\n		vec3 halfWidth;\n		vec3 halfHeight;\n	};\n	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;\n	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n	struct HemisphereLight {\n		vec3 direction;\n		vec3 skyColor;\n		vec3 groundColor;\n	};\n	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {\n		float dotNL = dot( normal, hemiLight.direction );\n		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n		return irradiance;\n	}\n#endif\n#include <lightprobes_pars_fragment>",
	lights_toon_fragment: "ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;",
	lights_toon_pars_fragment: "varying vec3 vViewPosition;\nstruct ToonMaterial {\n	vec3 diffuseColor;\n};\nvoid RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Toon\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon",
	lights_phong_fragment: "BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;",
	lights_phong_pars_fragment: "varying vec3 vViewPosition;\nstruct BlinnPhongMaterial {\n	vec3 diffuseColor;\n	vec3 specularColor;\n	float specularShininess;\n	float specularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_BlinnPhong\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong",
	lights_physical_fragment: "PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nmaterial.metalness = metalnessFactor;\nvec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );\nfloat geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );\nmaterial.roughness = max( roughnessFactor, 0.045 );\nmaterial.roughness += geometryRoughness;\nmaterial.roughness = min( material.roughness, 1.0 );\n#ifdef USE_DIFFUSE_ROUGHNESS\n	float diffuseRoughnessFactor = diffuseRoughness;\n	#ifdef USE_DIFFUSE_ROUGHNESSMAP\n		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;\n	#endif\n	material.diffuseRoughness = saturate( diffuseRoughnessFactor );\n#endif\n#ifdef IOR\n	material.ior = ior;\n	#ifdef USE_SPECULAR\n		float specularIntensityFactor = specularIntensity;\n		vec3 specularColorFactor = specularColor;\n		#ifdef USE_SPECULAR_COLORMAP\n			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;\n		#endif\n		#ifdef USE_SPECULAR_INTENSITYMAP\n			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;\n		#endif\n		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n	#else\n		float specularIntensityFactor = 1.0;\n		vec3 specularColorFactor = vec3( 1.0 );\n		material.specularF90 = 1.0;\n	#endif\n	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n#else\n	material.specularColor = vec3( 0.04 );\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n	material.specularF90 = 1.0;\n#endif\n#ifdef USE_CLEARCOAT\n	material.clearcoat = clearcoat;\n	material.clearcoatRoughness = clearcoatRoughness;\n	material.clearcoatF0 = vec3( 0.04 );\n	material.clearcoatF90 = 1.0;\n	#ifdef USE_CLEARCOATMAP\n		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;\n	#endif\n	#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;\n	#endif\n	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );\n	material.clearcoatRoughness += geometryRoughness;\n	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );\n#endif\n#ifdef USE_DISPERSION\n	material.dispersion = dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	material.retroreflectivity = retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	material.iridescence = iridescence;\n	material.iridescenceIOR = iridescenceIOR;\n	#ifdef USE_IRIDESCENCEMAP\n		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;\n	#endif\n	#ifdef USE_IRIDESCENCE_THICKNESSMAP\n		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;\n	#else\n		material.iridescenceThickness = iridescenceThicknessMaximum;\n	#endif\n#endif\n#ifdef USE_SHEEN\n	material.sheenColor = sheenColor;\n	#ifdef USE_SHEEN_COLORMAP\n		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;\n	#endif\n	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	#ifdef USE_ANISOTROPYMAP\n		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );\n		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;\n		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;\n	#else\n		vec2 anisotropyV = anisotropyVector;\n	#endif\n	material.anisotropy = length( anisotropyV );\n	if( material.anisotropy == 0.0 ) {\n		anisotropyV = vec2( 1.0, 0.0 );\n	} else {\n		anisotropyV /= material.anisotropy;\n		material.anisotropy = saturate( material.anisotropy );\n	}\n	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );\n	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;\n	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;\n#endif",
	lights_physical_pars_fragment: "uniform sampler2D dfgLUT;\nstruct PhysicalMaterial {\n	vec3 diffuseColor;\n	vec3 diffuseContribution;\n	vec3 specularColor;\n	vec3 specularColorBlended;\n	float roughness;\n	float metalness;\n	float specularF90;\n	float dispersion;\n	vec2 dfg;\n	vec3 multiScatteringCompensation;\n	#ifdef USE_DIFFUSE_ROUGHNESS\n		float diffuseRoughness;\n	#endif\n	#ifdef USE_RETROREFLECTION\n		float retroreflectivity;\n	#endif\n	#ifdef USE_CLEARCOAT\n		float clearcoat;\n		float clearcoatRoughness;\n		vec3 clearcoatF0;\n		float clearcoatF90;\n	#endif\n	#ifdef USE_IRIDESCENCE\n		float iridescence;\n		float iridescenceIOR;\n		float iridescenceThickness;\n		vec3 iridescenceFresnel;\n		vec3 iridescenceF0Dielectric;\n		vec3 iridescenceF0Metallic;\n	#endif\n	#ifdef USE_SHEEN\n		vec3 sheenColor;\n		float sheenRoughness;\n	#endif\n	#ifdef IOR\n		float ior;\n	#endif\n	#ifdef USE_TRANSMISSION\n		float transmission;\n		float transmissionAlpha;\n		float thickness;\n		float attenuationDistance;\n		vec3 attenuationColor;\n	#endif\n	#ifdef USE_ANISOTROPY\n		float anisotropy;\n		float alphaT;\n		vec3 anisotropyT;\n		vec3 anisotropyB;\n	#endif\n};\nvec3 clearcoatSpecularDirect = vec3( 0.0 );\nvec3 clearcoatSpecularIndirect = vec3( 0.0 );\nvec3 sheenSpecularDirect = vec3( 0.0 );\nvec3 sheenSpecularIndirect = vec3(0.0 );\nvec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {\n    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );\n    float x2 = x * x;\n    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );\n    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );\n}\n#ifdef USE_DIFFUSE_ROUGHNESS\n	const float EON_EPSILON = 1e-7;\n	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {\n		float muComp = 1.0 - mu;\n		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );\n		return A * ( 1.0 + roughness * gOverPi );\n	}\n	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {\n		vec3 rho = saturate( diffuseColor );\n		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );\n		float dotNL = saturate( dot( normal, lightDir ) );\n		float dotNV = saturate( dot( normal, viewDir ) );\n		float s = dot( lightDir, viewDir ) - dotNL * dotNV;\n		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;\n		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );\n		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );\n		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );\n		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );\n		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );\n		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );\n		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI\n			* max( EON_EPSILON, 1.0 - albedoV )\n			* max( EON_EPSILON, 1.0 - albedoL )\n			/ max( EON_EPSILON, 1.0 - averageAlbedo );\n		return singleScatter + multiScatter;\n	}\n	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {\n		vec3 rho = saturate( diffuseColor );\n		if ( roughness <= EON_EPSILON ) return rho;\n		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );\n		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );\n		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );\n		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );\n		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );\n	}\n#endif\nfloat V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n	float a2 = pow2( alpha );\n	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n	return 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n	float a2 = pow2( alpha );\n	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n	return RECIPROCAL_PI * a2 / pow2( denom );\n}\n#ifdef USE_ANISOTROPY\n	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {\n		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );\n		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );\n		return 0.5 / max( gv + gl, EPSILON );\n	}\n	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {\n		float a2 = alphaT * alphaB;\n		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );\n		highp float v2 = dot( v, v );\n		float w2 = a2 / v2;\n		return RECIPROCAL_PI * a2 * pow2 ( w2 );\n	}\n#endif\n#ifdef USE_CLEARCOAT\n	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {\n		vec3 f0 = material.clearcoatF0;\n		float f90 = material.clearcoatF90;\n		float roughness = max( material.clearcoatRoughness, 0.045 );\n		float alpha = pow2( roughness );\n		vec3 halfDir = normalize( lightDir + viewDir );\n		float dotNL = saturate( dot( normal, lightDir ) );\n		float dotNV = saturate( dot( normal, viewDir ) );\n		float dotNH = saturate( dot( normal, halfDir ) );\n		float dotVH = saturate( dot( viewDir, halfDir ) );\n		vec3 F = F_Schlick( f0, f90, dotVH );\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n		return F * ( V * D );\n	}\n#endif\nvec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {\n	vec3 f0 = material.specularColorBlended;\n	float f90 = material.specularF90;\n	float roughness = max( material.roughness, 0.045 );\n	float alpha = pow2( roughness );\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( f0, f90, dotVH );\n	#ifdef USE_IRIDESCENCE\n		F = mix( F, material.iridescenceFresnel, material.iridescence );\n	#endif\n	#ifdef USE_ANISOTROPY\n		float dotTL = dot( material.anisotropyT, lightDir );\n		float dotTV = dot( material.anisotropyT, viewDir );\n		float dotTH = dot( material.anisotropyT, halfDir );\n		float dotBL = dot( material.anisotropyB, lightDir );\n		float dotBV = dot( material.anisotropyB, viewDir );\n		float dotBH = dot( material.anisotropyB, halfDir );\n		float alphaT = max( material.alphaT, alpha );\n		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );\n		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );\n	#else\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n	#endif\n	return F * ( V * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n	const float LUT_SIZE = 64.0;\n	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n	const float LUT_BIAS = 0.5 / LUT_SIZE;\n	float dotNV = saturate( dot( N, V ) );\n	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n	uv = uv * LUT_SCALE + LUT_BIAS;\n	return uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n	float l = length( f );\n	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n	float x = dot( v1, v2 );\n	float y = abs( x );\n	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n	float b = 3.4175940 + ( 4.1616724 + y ) * y;\n	float v = a / b;\n	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n	return cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n	vec3 lightNormal = cross( v1, v2 );\n	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n	vec3 T1, T2;\n	T1 = normalize( V - N * dot( V, N ) );\n	T2 = - cross( N, T1 );\n	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );\n	vec3 coords[ 4 ];\n	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n	coords[ 0 ] = normalize( coords[ 0 ] );\n	coords[ 1 ] = normalize( coords[ 1 ] );\n	coords[ 2 ] = normalize( coords[ 2 ] );\n	coords[ 3 ] = normalize( coords[ 3 ] );\n	vec3 vectorFormFactor = vec3( 0.0 );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n	return vec3( result );\n}\n#if defined( USE_SHEEN )\nfloat D_Charlie( float roughness, float dotNH ) {\n	float alpha = pow2( roughness );\n	float invAlpha = 1.0 / alpha;\n	float cos2h = dotNH * dotNH;\n	float sin2h = max( 1.0 - cos2h, 0.0078125 );\n	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );\n}\nfloat V_Neubelt( float dotNV, float dotNL ) {\n	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );\n}\nvec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float D = D_Charlie( sheenRoughness, dotNH );\n	float V = V_Neubelt( dotNV, dotNL );\n	return sheenColor * ( D * V );\n}\n#endif\nfloat IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float r2 = roughness * roughness;\n	float rInv = 1.0 / ( roughness + 0.1 );\n	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;\n	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;\n	float DG = exp( a * dotNV + b );\n	return saturate( DG );\n}\nvec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;\n	return specularColor * fab.x + specularF90 * fab.y;\n}\n#ifdef USE_IRIDESCENCE\nvoid computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#else\nvoid computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#endif\n	#ifdef USE_IRIDESCENCE\n		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );\n	#else\n		vec3 Fr = specularColor;\n	#endif\n	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;\n	float Ess = fab.x + fab.y;\n	float Ems = 1.0 - Ess;\n	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n	singleScatter += FssEss;\n	multiScatter += Fms * Ems;\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n		vec3 normal = geometryNormal;\n		vec3 viewDir = geometryViewDir;\n		vec3 position = geometryPosition;\n		vec3 lightPos = rectAreaLight.position;\n		vec3 halfWidth = rectAreaLight.halfWidth;\n		vec3 halfHeight = rectAreaLight.halfHeight;\n		vec3 lightColor = rectAreaLight.color;\n		float roughness = material.roughness;\n		vec3 rectCoords[ 4 ];\n		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n		vec2 uv = LTC_Uv( normal, viewDir, roughness );\n		vec4 t1 = texture2D( ltc_1, uv );\n		vec4 t2 = texture2D( ltc_2, uv );\n		mat3 mInv = mat3(\n			vec3( t1.x, 0, t1.y ),\n			vec3(    0, 1,    0 ),\n			vec3( t1.z, 0, t1.w )\n		);\n		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );\n		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n		#ifdef USE_CLEARCOAT\n			vec3 Ncc = geometryClearcoatNormal;\n			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );\n			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );\n			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );\n			mat3 mInvClearcoat = mat3(\n				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),\n				vec3(             0, 1,             0 ),\n				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )\n			);\n			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;\n			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );\n		#endif\n	}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	#ifdef USE_CLEARCOAT\n		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );\n		vec3 ccIrradiance = dotNLcc * directLight.color;\n		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );\n	#endif\n	#ifdef USE_SHEEN\n \n 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );\n \n 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );\n \n 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );\n \n 		irradiance *= sheenEnergyComp;\n \n 	#endif\n	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );\n		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );\n		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );\n	#endif\n	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;\n	vec3 halfDir = normalize( directLight.direction + geometryViewDir );\n	float dotVH = saturate( dot( geometryViewDir, halfDir ) );\n	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );\n		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );\n		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );\n		F = mix( F, retroF, saturate( material.retroreflectivity ) );\n	#endif\n	#ifdef USE_DIFFUSE_ROUGHNESS\n		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );\n	#else\n		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );\n	#endif\n	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 singleScattering = vec3( 0.0 );\n	vec3 multiScattering = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );\n	#endif\n	#ifdef USE_DIFFUSE_ROUGHNESS\n		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );\n		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );\n	#else\n		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );\n	#endif\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		diffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectDiffuse += diffuse;\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n	#ifdef USE_CLEARCOAT\n		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );\n	#endif\n	#ifdef USE_SHEEN\n		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;\n 	#endif\n	vec3 singleScatteringDielectric = vec3( 0.0 );\n	vec3 multiScatteringDielectric = vec3( 0.0 );\n	vec3 singleScatteringMetallic = vec3( 0.0 );\n	vec3 multiScatteringMetallic = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );\n	#endif\n	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );\n	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );\n	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;\n	#ifdef USE_DIFFUSE_ROUGHNESS\n		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );\n	#else\n		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );\n	#endif\n	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n	vec3 indirectSpecular = radiance * singleScattering;\n	indirectSpecular += multiScattering * cosineWeightedIrradiance;\n	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		indirectSpecular *= sheenEnergyComp;\n		indirectDiffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectSpecular += indirectSpecular;\n	reflectedLight.indirectDiffuse += indirectDiffuse;\n}\n#define RE_Direct				RE_Direct_Physical\n#define RE_Direct_RectArea		RE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular		RE_IndirectSpecular_Physical\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}",
	lights_fragment_begin: "\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n	geometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n	float dotNVi = saturate( dot( normal, geometryViewDir ) );\n	if ( material.iridescenceThickness == 0.0 ) {\n		material.iridescence = 0.0;\n	} else {\n		material.iridescence = saturate( material.iridescence );\n	}\n	if ( material.iridescence > 0.0 ) {\n		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );\n		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );\n		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );\n		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );\n	}\n#endif\n#ifdef STANDARD\n	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );\n	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;\n	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )\n		float EssMs = material.dfg.x + material.dfg.y;\n		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );\n	#endif\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n	PointLight pointLight;\n	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n	PointLightShadow pointLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n		pointLight = pointLights[ i ];\n		getPointLightInfo( pointLight, geometryPosition, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n		pointLightShadow = pointLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n	SpotLight spotLight;\n	vec4 spotColor;\n	vec3 spotLightCoord;\n	bool inSpotLightMap;\n	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n		spotLight = spotLights[ i ];\n		getSpotLightInfo( spotLight, geometryPosition, directLight );\n		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n		#else\n		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#endif\n		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n		#endif\n		#undef SPOT_LIGHT_MAP_INDEX\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		spotLightShadow = spotLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )\n	SunLight sunLight;\n	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {\n		sunLight = sunLights[ i ];\n		getSunLightInfo( sunLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )\n		sunLightShadow = sunLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n	DirectionalLight directionalLight;\n	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n		directionalLight = directionalLights[ i ];\n		getDirectionalLightInfo( directionalLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n		directionalLightShadow = directionalLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n	RectAreaLight rectAreaLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n		rectAreaLight = rectAreaLights[ i ];\n		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n	vec3 iblIrradiance = vec3( 0.0 );\n	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n	#if defined( USE_LIGHT_PROBES )\n		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n	#endif\n	#if ( NUM_HEMI_LIGHTS > 0 )\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n		}\n		#pragma unroll_loop_end\n	#endif\n	#if NUM_LIGHT_PROBE_GRIDS > 0\n		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;\n		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );\n		int probeGrid = - 1;\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {\n			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;\n		}\n		#pragma unroll_loop_end\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {\n			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );\n		}\n		#pragma unroll_loop_end\n	#endif\n#endif\n#if defined( RE_IndirectSpecular )\n	vec3 radiance = vec3( 0.0 );\n	vec3 clearcoatRadiance = vec3( 0.0 );\n#endif",
	lights_fragment_maps: "#if defined( RE_IndirectDiffuse )\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;\n		irradiance += lightMapIrradiance;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )\n		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )\n			iblIrradiance += getIBLIrradiance( geometryNormal );\n		#endif\n	#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n	#ifdef USE_ANISOTROPY\n		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n	#else\n		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );\n	#endif\n	#ifdef USE_RETROREFLECTION\n		#ifdef USE_ANISOTROPY\n			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n		#else\n			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );\n		#endif\n		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );\n	#endif\n	radiance += iblRadiance;\n	#ifdef USE_CLEARCOAT\n		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );\n	#endif\n#endif",
	lights_fragment_end: "#if defined( RE_IndirectDiffuse )\n	#if defined( LAMBERT ) || defined( PHONG )\n		irradiance += iblIrradiance;\n	#endif\n	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif",
	lightprobes_pars_fragment: "#if NUM_LIGHT_PROBE_GRIDS > 0\nuniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];\nuniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];\nuniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];\nuniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];\nbool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {\n	vec3 spacing = ( probesMax - probesMin ) / probesResolution;\n	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;\n	vec3 margin = spacing * 0.01;\n	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );\n}\nvec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {\n	vec3 res = probesResolution;\n	vec3 gridRange = probesMax - probesMin;\n	vec3 probeSpacing = gridRange / res;\n	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;\n	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );\n	float nz          = res.z;\n	float paddedSlices = nz + 2.0;\n	float atlasDepth  = 7.0 * paddedSlices;\n	float uvZBase     = uvw.z * nz + 1.0;\n	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );\n	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );\n	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );\n	vec3 c0 = s0.xyz;\n	vec3 c1 = vec3( s0.w, s1.xy );\n	vec3 c2 = vec3( s1.zw, s2.x );\n	vec3 c3 = s2.yzw;\n	vec3 c4 = s3.xyz;\n	vec3 c5 = vec3( s3.w, s4.xy );\n	vec3 c6 = vec3( s4.zw, s5.x );\n	vec3 c7 = s5.yzw;\n	vec3 c8 = s6.xyz;\n	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;\n	vec3 result = c0 * 0.886227;\n	result += c1 * 2.0 * 0.511664 * y;\n	result += c2 * 2.0 * 0.511664 * z;\n	result += c3 * 2.0 * 0.511664 * x;\n	result += c4 * 2.0 * 0.429043 * x * y;\n	result += c5 * 2.0 * 0.429043 * y * z;\n	result += c6 * ( 0.743125 * z * z - 0.247708 );\n	result += c7 * 2.0 * 0.429043 * x * z;\n	result += c8 * 0.429043 * ( x * x - y * y );\n	return max( result, vec3( 0.0 ) );\n}\n#endif",
	logdepthbuf_fragment: "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif",
	logdepthbuf_pars_fragment: "#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	uniform float logDepthBufFC;\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif",
	logdepthbuf_pars_vertex: "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif",
	logdepthbuf_vertex: "#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	vFragDepth = 1.0 + gl_Position.w;\n	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );\n#endif",
	map_fragment: "#ifdef USE_MAP\n	vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n	#endif\n	diffuseColor *= sampledDiffuseColor;\n#endif",
	map_pars_fragment: "#ifdef USE_MAP\n	uniform sampler2D map;\n#endif",
	map_particle_fragment: "#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n	#if defined( USE_POINTS_UV )\n		vec2 uv = vUv;\n	#else\n		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n	#endif\n#endif\n#ifdef USE_MAP\n	diffuseColor *= texture2D( map, uv );\n#endif\n#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, uv ).g;\n#endif",
	map_particle_pars_fragment: "#if defined( USE_POINTS_UV )\n	varying vec2 vUv;\n#else\n	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n		uniform mat3 uvTransform;\n	#endif\n#endif\n#ifdef USE_MAP\n	uniform sampler2D map;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif",
	metalnessmap_fragment: "float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );\n	metalnessFactor *= texelMetalness.b;\n#endif",
	metalnessmap_pars_fragment: "#ifdef USE_METALNESSMAP\n	uniform sampler2D metalnessMap;\n#endif",
	morphinstance_vertex: "#ifdef USE_INSTANCING_MORPH\n	float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;\n	}\n#endif",
	morphcolor_vertex: "#if defined( USE_MORPHCOLORS )\n	#if defined( USE_COLOR_ALPHA )\n		vColor *= morphTargetBaseInfluence;\n	#elif defined( USE_COLOR )\n		vColor.rgb *= morphTargetBaseInfluence;\n	#endif\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		#if defined( USE_COLOR_ALPHA )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];\n		#elif defined( USE_COLOR )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];\n		#endif\n	}\n#endif",
	morphnormal_vertex: "#ifdef USE_MORPHNORMALS\n	objectNormal *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif",
	morphtarget_pars_vertex: "#ifdef USE_MORPHTARGETS\n	#ifndef USE_INSTANCING_MORPH\n		uniform float morphTargetBaseInfluence;\n		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	#endif\n	uniform sampler2DArray morphTargetsTexture;\n	uniform ivec2 morphTargetsTextureSize;\n	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {\n		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;\n		int y = texelIndex / morphTargetsTextureSize.x;\n		int x = texelIndex - y * morphTargetsTextureSize.x;\n		ivec3 morphUV = ivec3( x, y, morphTargetIndex );\n		return texelFetch( morphTargetsTexture, morphUV, 0 );\n	}\n#endif",
	morphtarget_vertex: "#ifdef USE_MORPHTARGETS\n	transformed *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif",
	normal_fragment_begin: "float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n#ifdef FLAT_SHADED\n	vec3 fdx = dFdx( vViewPosition );\n	vec3 fdy = dFdy( vViewPosition );\n	vec3 normal = normalize( cross( fdx, fdy ) );\n#else\n	vec3 normal = normalize( vNormal );\n	#ifdef DOUBLE_SIDED\n		normal *= faceDirection;\n	#endif\n#endif\n#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )\n	#ifdef USE_TANGENT\n		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn = getTangentFrame( - vViewPosition, normal,\n		#if defined( USE_NORMALMAP )\n			vNormalMapUv\n		#elif defined( USE_CLEARCOAT_NORMALMAP )\n			vClearcoatNormalMapUv\n		#else\n			vUv\n		#endif\n		);\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn[0] *= faceDirection;\n		tbn[1] *= faceDirection;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	#ifdef USE_TANGENT\n		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn2[0] *= faceDirection;\n		tbn2[1] *= faceDirection;\n	#endif\n#endif\nvec3 nonPerturbedNormal = normal;",
	normal_fragment_maps: "#ifdef USE_NORMALMAP_OBJECTSPACE\n	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#ifdef FLIP_SIDED\n		normal = - normal;\n	#endif\n	#ifdef DOUBLE_SIDED\n		normal = normal * faceDirection;\n	#endif\n	normal = normalize( normalMatrix * normal );\n#elif defined( USE_NORMALMAP_TANGENTSPACE )\n	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#if defined( USE_PACKED_NORMALMAP )\n		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );\n	#endif\n	mapN.xy *= normalScale;\n	normal = normalize( tbn * mapN );\n#elif defined( USE_BUMPMAP )\n	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif",
	normal_pars_fragment: "#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif",
	normal_pars_vertex: "#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif",
	normal_vertex: "#ifndef FLAT_SHADED\n	vNormal = normalize( transformedNormal );\n	#ifdef USE_TANGENT\n		vTangent = normalize( transformedTangent );\n		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n		#ifdef FLIP_SIDED\n			vBitangent = - vBitangent;\n		#endif\n	#endif\n#endif",
	normalmap_pars_fragment: "#ifdef USE_NORMALMAP\n	uniform sampler2D normalMap;\n	uniform vec2 normalScale;\n#endif\n#ifdef USE_NORMALMAP_OBJECTSPACE\n	uniform mat3 normalMatrix;\n#endif\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )\n	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n		vec3 q0 = dFdx( eye_pos.xyz );\n		vec3 q1 = dFdy( eye_pos.xyz );\n		vec2 st0 = dFdx( uv.st );\n		vec2 st1 = dFdy( uv.st );\n		vec3 N = surf_norm;\n		vec3 q1perp = cross( q1, N );\n		vec3 q0perp = cross( N, q0 );\n		vec3 T = q1perp * st0.x + q0perp * st1.x;\n		vec3 B = q1perp * st0.y + q0perp * st1.y;\n		float det = max( dot( T, T ), dot( B, B ) );\n		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n		return mat3( T * scale, B * scale, N );\n	}\n#endif",
	clearcoat_normal_fragment_begin: "#ifdef USE_CLEARCOAT\n	vec3 clearcoatNormal = nonPerturbedNormal;\n#endif",
	clearcoat_normal_fragment_maps: "#ifdef USE_CLEARCOAT_NORMALMAP\n	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;\n	clearcoatMapN.xy *= clearcoatNormalScale;\n	clearcoatNormal = normalize( tbn2 * clearcoatMapN );\n#endif",
	clearcoat_pars_fragment: "#ifdef USE_CLEARCOATMAP\n	uniform sampler2D clearcoatMap;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform sampler2D clearcoatNormalMap;\n	uniform vec2 clearcoatNormalScale;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform sampler2D clearcoatRoughnessMap;\n#endif",
	iridescence_pars_fragment: "#ifdef USE_IRIDESCENCEMAP\n	uniform sampler2D iridescenceMap;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform sampler2D iridescenceThicknessMap;\n#endif",
	opaque_fragment: "#ifdef OPAQUE\ndiffuseColor.a = 1.0;\n#endif\n#ifdef USE_TRANSMISSION\ndiffuseColor.a *= material.transmissionAlpha;\n#endif\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );",
	packing: "vec3 packNormalToRGB( const in vec3 normal ) {\n	return normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n	return 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;\nconst float Inv255 = 1. / 255.;\nconst vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );\nconst vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );\nconst vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );\nconst vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );\nvec4 packDepthToRGBA( const in float v ) {\n	if( v <= 0.0 )\n		return vec4( 0., 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec4( 1., 1., 1., 1. );\n	float vuf;\n	float af = modf( v * PackFactors.a, vuf );\n	float bf = modf( vuf * ShiftRight8, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );\n}\nvec3 packDepthToRGB( const in float v ) {\n	if( v <= 0.0 )\n		return vec3( 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec3( 1., 1., 1. );\n	float vuf;\n	float bf = modf( v * PackFactors.b, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec3( vuf * Inv255, gf * PackUpscale, bf );\n}\nvec2 packDepthToRG( const in float v ) {\n	if( v <= 0.0 )\n		return vec2( 0., 0. );\n	if( v >= 1.0 )\n		return vec2( 1., 1. );\n	float vuf;\n	float gf = modf( v * 256., vuf );\n	return vec2( vuf * Inv255, gf );\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n	return dot( v, UnpackFactors4 );\n}\nfloat unpackRGBToDepth( const in vec3 v ) {\n	return dot( v, UnpackFactors3 );\n}\nfloat unpackRGToDepth( const in vec2 v ) {\n	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;\n}\nvec4 pack2HalfToRGBA( const in vec2 v ) {\n	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );\n	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );\n}\nvec2 unpackRGBATo2Half( const in vec4 v ) {\n	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n	\n		return depth * ( far - near ) - far;\n	#else\n		return depth * ( near - far ) - near;\n	#endif\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		return ( near * far ) / ( ( near - far ) * depth - near );\n	#else\n		return ( near * far ) / ( ( far - near ) * depth - far );\n	#endif\n}",
	premultiplied_alpha_fragment: "#ifdef PREMULTIPLIED_ALPHA\n	gl_FragColor.rgb *= gl_FragColor.a;\n#endif",
	project_vertex: "vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n	mvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n	mvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;",
	dithering_fragment: "#ifdef DITHERING\n	gl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif",
	dithering_pars_fragment: "#ifdef DITHERING\n	vec3 dithering( vec3 color ) {\n		float grid_position = rand( gl_FragCoord.xy );\n		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n		return color + dither_shift_RGB;\n	}\n#endif",
	roughnessmap_fragment: "float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n	roughnessFactor *= texelRoughness.g;\n#endif",
	roughnessmap_pars_fragment: "#ifdef USE_ROUGHNESSMAP\n	uniform sampler2D roughnessMap;\n#endif",
	shadowmap_pars_fragment: "#if NUM_SPOT_LIGHT_COORDS > 0\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#if NUM_SPOT_LIGHT_MAPS > 0\n	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		#define SUN_LIGHT_CASCADES 2\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#endif\n		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n		struct SunLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#endif\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#elif defined( SHADOWMAP_TYPE_BASIC )\n			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float interleavedGradientNoise( vec2 position ) {\n			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );\n		}\n		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {\n			const float goldenAngle = 2.399963229728653;\n			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );\n			float theta = float( sampleIndex ) * goldenAngle + phi;\n			return vec2( cos( theta ), sin( theta ) ) * r;\n		}\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n				vec2 radius = shadowRadius * texelSize;\n				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n				shadow = (\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )\n				) * 0.2;\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#elif defined( SHADOWMAP_TYPE_VSM )\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;\n				float mean = distribution.x;\n				float variance = distribution.y * distribution.y;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					float hard_shadow = step( mean, shadowCoord.z );\n				#else\n					float hard_shadow = step( shadowCoord.z, mean );\n				#endif\n				\n				if ( hard_shadow == 1.0 ) {\n					shadow = 1.0;\n				} else {\n					variance = max( variance, 0.0000001 );\n					float d = shadowCoord.z - mean;\n					float p_max = variance / ( variance + d * d );\n					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );\n					shadow = max( hard_shadow, p_max );\n				}\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#else\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				float depth = texture2D( shadowMap, shadowCoord.xy ).r;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					shadow = step( depth, shadowCoord.z );\n				#else\n					shadow = step( shadowCoord.z, depth );\n				#endif\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#endif\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		float getSunShadow(\n			#if defined( SHADOWMAP_TYPE_PCF )\n				sampler2DShadow shadowMap,\n			#else\n				sampler2D shadowMap,\n			#endif\n			SunLightShadow sunLightShadow,\n			int shadowIndex\n		) {\n			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );\n			float viewDepth = vSunShadowWorldPosition.w;\n			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;\n			float shadow = 1.0;\n			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {\n				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];\n				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {\n					float cascadeShadow = getShadow(\n						shadowMap,\n						sunLightShadow.shadowMapSize,\n						sunLightShadow.shadowIntensity,\n						sunLightShadow.shadowBias,\n						sunLightShadow.shadowRadius,\n						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition\n					);\n					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );\n				}\n			}\n			return shadow;\n		}\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n	#if defined( SHADOWMAP_TYPE_PCF )\n	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 bd3D = normalize( lightToPosition );\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			float lightDistance = length( lightToPosition );\n			float depthRange = shadowCameraFar - shadowCameraNear;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				float depthA = - shadowCameraNear / depthRange - shadowBias;\n				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );\n			#else\n				float depthA = shadowCameraFar / depthRange + shadowBias;\n				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );\n			#endif\n			float texelSize = shadowRadius / shadowMapSize.x;\n			vec3 absDir = abs( bd3D );\n			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );\n			tangent = normalize( cross( bd3D, tangent ) );\n			vec3 bitangent = cross( bd3D, tangent );\n			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n			shadow = 0.0;\n			for ( int i = 0; i < 5; i ++ ) {\n				vec2 offset = vogelDiskSample( i, 5, phi );\n				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;\n				vec3 absDirection = abs( direction );\n				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );\n				shadow += texture( shadowMap, vec4( direction, dp ) );\n			}\n			shadow *= 0.2;\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#elif defined( SHADOWMAP_TYPE_BASIC )\n	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n			dp += shadowBias;\n			vec3 bd3D = normalize( lightToPosition );\n			float depth = textureCube( shadowMap, bd3D ).r;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				depth = 1.0 - depth;\n			#endif\n			shadow = step( dp, depth );\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#endif\n	#endif\n#endif",
	shadowmap_pars_vertex: "#if NUM_SPOT_LIGHT_COORDS > 0\n	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n#endif",
	shadowmap_vertex: "#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )\n	#ifdef HAS_NORMAL\n		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n	#else\n		vec3 shadowWorldNormal = vec3( 0.0 );\n	#endif\n	vec4 shadowWorldPosition;\n#endif\n#if defined( USE_SHADOWMAP )\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );\n		vSunShadowWorldNormal = shadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );\n			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );\n			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n#endif\n#if NUM_SPOT_LIGHT_COORDS > 0\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {\n		shadowWorldPosition = worldPosition;\n		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;\n		#endif\n		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;\n	}\n	#pragma unroll_loop_end\n#endif",
	shadowmask_pars_fragment: "float getShadowMask() {\n	float shadow = 1.0;\n	#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {\n		sunLight = sunLightShadows[ i ];\n		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n		directionalLight = directionalLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {\n		spotLight = spotLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n	PointLightShadow pointLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n		pointLight = pointLightShadows[ i ];\n		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#endif\n	return shadow;\n}",
	skinbase_vertex: "#ifdef USE_SKINNING\n	mat4 boneMatX = getBoneMatrix( skinIndex.x );\n	mat4 boneMatY = getBoneMatrix( skinIndex.y );\n	mat4 boneMatZ = getBoneMatrix( skinIndex.z );\n	mat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif",
	skinning_pars_vertex: "#ifdef USE_SKINNING\n	uniform mat4 bindMatrix;\n	uniform mat4 bindMatrixInverse;\n	uniform highp sampler2D boneTexture;\n	mat4 getBoneMatrix( const in float i ) {\n		int size = textureSize( boneTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n#endif",
	skinning_vertex: "#ifdef USE_SKINNING\n	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n	vec4 skinned = vec4( 0.0 );\n	skinned += boneMatX * skinVertex * skinWeight.x;\n	skinned += boneMatY * skinVertex * skinWeight.y;\n	skinned += boneMatZ * skinVertex * skinWeight.z;\n	skinned += boneMatW * skinVertex * skinWeight.w;\n	transformed = ( bindMatrixInverse * skinned ).xyz;\n#endif",
	skinnormal_vertex: "#ifdef USE_SKINNING\n	mat4 skinMatrix = mat4( 0.0 );\n	skinMatrix += skinWeight.x * boneMatX;\n	skinMatrix += skinWeight.y * boneMatY;\n	skinMatrix += skinWeight.z * boneMatZ;\n	skinMatrix += skinWeight.w * boneMatW;\n	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;\n	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n	#ifdef USE_TANGENT\n		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;\n	#endif\n#endif",
	specularmap_fragment: "float specularStrength;\n#ifdef USE_SPECULARMAP\n	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );\n	specularStrength = texelSpecular.r;\n#else\n	specularStrength = 1.0;\n#endif",
	specularmap_pars_fragment: "#ifdef USE_SPECULARMAP\n	uniform sampler2D specularMap;\n#endif",
	tonemapping_fragment: "#if defined( TONE_MAPPING )\n	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif",
	tonemapping_pars_fragment: "#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nvec3 LinearToneMapping( vec3 color ) {\n	return saturate( toneMappingExposure * color );\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	return saturate( color / ( vec3( 1.0 ) + color ) );\n}\nvec3 CineonToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	color = max( vec3( 0.0 ), color - 0.004 );\n	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 RRTAndODTFit( vec3 v ) {\n	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;\n	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;\n	return a / b;\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n	const mat3 ACESInputMat = mat3(\n		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),\n		vec3( 0.04823, 0.01566, 0.83777 )\n	);\n	const mat3 ACESOutputMat = mat3(\n		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),\n		vec3( -0.07367, -0.00605,  1.07602 )\n	);\n	color *= toneMappingExposure / 0.6;\n	color = ACESInputMat * color;\n	color = RRTAndODTFit( color );\n	color = ACESOutputMat * color;\n	return saturate( color );\n}\nconst mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(\n	vec3( 1.6605, - 0.1246, - 0.0182 ),\n	vec3( - 0.5876, 1.1329, - 0.1006 ),\n	vec3( - 0.0728, - 0.0083, 1.1187 )\n);\nconst mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(\n	vec3( 0.6274, 0.0691, 0.0164 ),\n	vec3( 0.3293, 0.9195, 0.0880 ),\n	vec3( 0.0433, 0.0113, 0.8956 )\n);\nvec3 agxDefaultContrastApprox( vec3 x ) {\n	vec3 x2 = x * x;\n	vec3 x4 = x2 * x2;\n	return + 15.5 * x4 * x2\n		- 40.14 * x4 * x\n		+ 31.96 * x4\n		- 6.868 * x2 * x\n		+ 0.4298 * x2\n		+ 0.1191 * x\n		- 0.00232;\n}\nvec3 AgXToneMapping( vec3 color ) {\n	const mat3 AgXInsetMatrix = mat3(\n		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),\n		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),\n		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )\n	);\n	const mat3 AgXOutsetMatrix = mat3(\n		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),\n		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),\n		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )\n	);\n	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;\n	color *= toneMappingExposure;\n	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;\n	color = AgXInsetMatrix * color;\n	color = max( color, 1e-10 );	color = log2( color );\n	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );\n	color = clamp( color, 0.0, 1.0 );\n	color = agxDefaultContrastApprox( color );\n	color = AgXOutsetMatrix * color;\n	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );\n	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;\n	color = clamp( color, 0.0, 1.0 );\n	return color;\n}\nvec3 NeutralToneMapping( vec3 color ) {\n	const float StartCompression = 0.8 - 0.04;\n	const float Desaturation = 0.15;\n	color *= toneMappingExposure;\n	float x = min( color.r, min( color.g, color.b ) );\n	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;\n	color -= offset;\n	float peak = max( color.r, max( color.g, color.b ) );\n	if ( peak < StartCompression ) return color;\n	float d = 1. - StartCompression;\n	float newPeak = 1. - d * d / ( peak + d - StartCompression );\n	color *= newPeak / peak;\n	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );\n	return mix( color, vec3( newPeak ), g );\n}\nvec3 CustomToneMapping( vec3 color ) { return color; }",
	transmission_fragment: "#ifdef USE_TRANSMISSION\n	material.transmission = transmission;\n	material.transmissionAlpha = 1.0;\n	material.thickness = thickness;\n	material.attenuationDistance = attenuationDistance;\n	material.attenuationColor = attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;\n	#endif\n	vec3 pos = vWorldPosition;\n	vec3 v = normalize( cameraPosition - pos );\n	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec4 transmitted = getIBLVolumeRefraction(\n		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,\n		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,\n		material.attenuationColor, material.attenuationDistance );\n	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );\n	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );\n#endif",
	transmission_pars_fragment: "#ifdef USE_TRANSMISSION\n	uniform float transmission;\n	uniform float thickness;\n	uniform float attenuationDistance;\n	uniform vec3 attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		uniform sampler2D transmissionMap;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		uniform sampler2D thicknessMap;\n	#endif\n	uniform vec2 transmissionSamplerSize;\n	uniform sampler2D transmissionSamplerMap;\n	uniform mat4 modelMatrix;\n	uniform mat4 projectionMatrix;\n	varying vec3 vWorldPosition;\n	float w0( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );\n	}\n	float w1( float a ) {\n		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );\n	}\n	float w2( float a ){\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );\n	}\n	float w3( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * a * a );\n	}\n	float g0( float a ) {\n		return w0( a ) + w1( a );\n	}\n	float g1( float a ) {\n		return w2( a ) + w3( a );\n	}\n	float h0( float a ) {\n		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );\n	}\n	float h1( float a ) {\n		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );\n	}\n	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {\n		uv = uv * texelSize.zw + 0.5;\n		vec2 iuv = floor( uv );\n		vec2 fuv = fract( uv );\n		float g0x = g0( fuv.x );\n		float g1x = g1( fuv.x );\n		float h0x = h0( fuv.x );\n		float h1x = h1( fuv.x );\n		float h0y = h0( fuv.y );\n		float h1y = h1( fuv.y );\n		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +\n			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );\n	}\n	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {\n		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );\n		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );\n		vec2 fLodSizeInv = 1.0 / fLodSize;\n		vec2 cLodSizeInv = 1.0 / cLodSize;\n		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );\n		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );\n		return mix( fSample, cSample, fract( lod ) );\n	}\n	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {\n		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );\n		vec3 modelScale;\n		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );\n		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );\n		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );\n		return normalize( refractionVector ) * thickness * modelScale;\n	}\n	float applyIorToRoughness( const in float roughness, const in float ior ) {\n		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );\n	}\n	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {\n		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );\n		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );\n	}\n	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {\n		if ( isinf( attenuationDistance ) ) {\n			return vec3( 1.0 );\n		} else {\n			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;\n			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;\n		}\n	}\n	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,\n		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,\n		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,\n		const in vec3 attenuationColor, const in float attenuationDistance ) {\n		vec4 transmittedLight;\n		vec3 transmittance;\n		#ifdef USE_DISPERSION\n			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;\n			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );\n			for ( int i = 0; i < 3; i ++ ) {\n				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );\n				vec3 refractedRayExit = position + transmissionRay;\n				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n				vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n				refractionCoords += 1.0;\n				refractionCoords /= 2.0;\n				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );\n				transmittedLight[ i ] = transmissionSample[ i ];\n				transmittedLight.a += transmissionSample.a;\n				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];\n			}\n			transmittedLight.a /= 3.0;\n		#else\n			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );\n			vec3 refractedRayExit = position + transmissionRay;\n			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n			vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n			refractionCoords += 1.0;\n			refractionCoords /= 2.0;\n			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );\n			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );\n		#endif\n		vec3 attenuatedColor = transmittance * transmittedLight.rgb;\n		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );\n		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;\n		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );\n	}\n#endif",
	uv_pars_fragment: "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_DIFFUSE_ROUGHNESSMAP\n	varying vec2 vDiffuseRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif",
	uv_pars_vertex: "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	uniform mat3 mapTransform;\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform mat3 alphaMapTransform;\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	uniform mat3 lightMapTransform;\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	uniform mat3 aoMapTransform;\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	uniform mat3 bumpMapTransform;\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	uniform mat3 normalMapTransform;\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	uniform mat3 displacementMapTransform;\n	varying vec2 vDisplacementMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	uniform mat3 emissiveMapTransform;\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	uniform mat3 metalnessMapTransform;\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	uniform mat3 roughnessMapTransform;\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_DIFFUSE_ROUGHNESSMAP\n	uniform mat3 diffuseRoughnessMapTransform;\n	varying vec2 vDiffuseRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	uniform mat3 anisotropyMapTransform;\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	uniform mat3 clearcoatMapTransform;\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform mat3 clearcoatNormalMapTransform;\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform mat3 clearcoatRoughnessMapTransform;\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	uniform mat3 sheenColorMapTransform;\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	uniform mat3 sheenRoughnessMapTransform;\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	uniform mat3 iridescenceMapTransform;\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform mat3 iridescenceThicknessMapTransform;\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	uniform mat3 specularMapTransform;\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	uniform mat3 specularColorMapTransform;\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	uniform mat3 specularIntensityMapTransform;\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif",
	uv_vertex: "#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	vUv = vec3( uv, 1 ).xy;\n#endif\n#ifdef USE_MAP\n	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ALPHAMAP\n	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_LIGHTMAP\n	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_AOMAP\n	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_BUMPMAP\n	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_NORMALMAP\n	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_EMISSIVEMAP\n	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_METALNESSMAP\n	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DIFFUSE_ROUGHNESSMAP\n	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOATMAP\n	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULARMAP\n	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_THICKNESSMAP\n	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;\n#endif",
	worldpos_vertex: "#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\n	vec4 worldPosition = vec4( transformed, 1.0 );\n	#ifdef USE_BATCHING\n		worldPosition = batchingMatrix * worldPosition;\n	#endif\n	#ifdef USE_INSTANCING\n		worldPosition = instanceMatrix * worldPosition;\n	#endif\n	worldPosition = modelMatrix * worldPosition;\n#endif",
	background_vert: "varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	gl_Position = vec4( position.xy, 1.0, 1.0 );\n}",
	background_frag: "uniform sampler2D t2D;\nuniform float backgroundIntensity;\nvarying vec2 vUv;\nvoid main() {\n	vec4 texColor = texture2D( t2D, vUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}",
	backgroundCube_vert: "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}",
	backgroundCube_frag: "uniform float backgroundBlurriness;\nuniform float backgroundIntensity;\nuniform mat3 backgroundRotation;\nvarying vec3 vWorldDirection;\n#include <envmap_common_pars_fragment>\nvoid main() {\n	#ifdef ENVMAP_TYPE_PMREM\n		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );\n	#else\n		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}",
	cube_vert: "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}",
	cube_frag: "uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n	gl_FragColor = texColor;\n	gl_FragColor.a *= opacity;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}",
	depth_vert: "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vHighPrecisionZW = gl_Position.zw;\n}",
	depth_frag: "#if DEPTH_PACKING == 3200\n	uniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#if DEPTH_PACKING == 3200\n		diffuseColor.a = opacity;\n	#endif\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <logdepthbuf_fragment>\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];\n	#else\n		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;\n	#endif\n	#if DEPTH_PACKING == 3200\n		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );\n	#elif DEPTH_PACKING == 3201\n		gl_FragColor = packDepthToRGBA( fragCoordZ );\n	#elif DEPTH_PACKING == 3202\n		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );\n	#elif DEPTH_PACKING == 3203\n		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );\n	#endif\n}",
	distance_vert: "#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <worldpos_vertex>\n	#include <clipping_planes_vertex>\n	vWorldPosition = worldPosition.xyz;\n}",
	distance_frag: "#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	float dist = length( vWorldPosition - referencePosition );\n	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n	dist = saturate( dist );\n	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );\n}",
	equirect_vert: "varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n}",
	equirect_frag: "uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vec3 direction = normalize( vWorldDirection );\n	vec2 sampleUV = equirectUv( direction );\n	gl_FragColor = texture2D( tEquirect, sampleUV );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}",
	linedashed_vert: "uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	vLineDistance = scale * lineDistance;\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}",
	linedashed_frag: "uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	if ( mod( vLineDistance, totalSize ) > dashSize ) {\n		discard;\n	}\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}",
	meshbasic_vert: "#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinbase_vertex>\n		#include <skinnormal_vertex>\n		#include <defaultnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <fog_vertex>\n}",
	meshbasic_frag: "uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n#endif\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;\n	#else\n		reflectedLight.indirectDiffuse += vec3( 1.0 );\n	#endif\n	#include <aomap_fragment>\n	reflectedLight.indirectDiffuse *= diffuseColor.rgb;\n	vec3 outgoingLight = reflectedLight.indirectDiffuse;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	meshlambert_vert: "#define LAMBERT\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}",
	meshlambert_frag: "#define LAMBERT\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_lambert_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_lambert_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	meshmatcap_vert: "#define MATCAP\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n	vViewPosition = - mvPosition.xyz;\n}",
	meshmatcap_frag: "#define MATCAP\nuniform vec3 diffuse;\nuniform float opacity;\nuniform sampler2D matcap;\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	vec3 viewDir = normalize( vViewPosition );\n	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );\n	vec3 y = cross( viewDir, x );\n	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;\n	#ifdef USE_MATCAP\n		vec4 matcapColor = texture2D( matcap, uv );\n	#else\n		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );\n	#endif\n	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	meshnormal_vert: "#define NORMAL\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	vViewPosition = - mvPosition.xyz;\n#endif\n}",
	meshnormal_frag: "#define NORMAL\nuniform float opacity;\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <uv_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );\n	#ifdef OPAQUE\n		gl_FragColor.a = 1.0;\n	#endif\n}",
	meshphong_vert: "#define PHONG\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}",
	meshphong_frag: "#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_phong_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	meshphysical_vert: "#define STANDARD\nvarying vec3 vViewPosition;\n#ifdef USE_TRANSMISSION\n	varying vec3 vWorldPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n#ifdef USE_TRANSMISSION\n	vWorldPosition = worldPosition.xyz;\n#endif\n}",
	meshphysical_frag: "#define STANDARD\n#ifdef PHYSICAL\n	#define IOR\n	#define USE_SPECULAR\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef IOR\n	uniform float ior;\n#endif\n#ifdef USE_SPECULAR\n	uniform float specularIntensity;\n	uniform vec3 specularColor;\n	#ifdef USE_SPECULAR_COLORMAP\n		uniform sampler2D specularColorMap;\n	#endif\n	#ifdef USE_SPECULAR_INTENSITYMAP\n		uniform sampler2D specularIntensityMap;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT\n	uniform float clearcoat;\n	uniform float clearcoatRoughness;\n#endif\n#ifdef USE_DIFFUSE_ROUGHNESS\n	uniform float diffuseRoughness;\n	#ifdef USE_DIFFUSE_ROUGHNESSMAP\n		uniform sampler2D diffuseRoughnessMap;\n	#endif\n#endif\n#ifdef USE_DISPERSION\n	uniform float dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	uniform float retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	uniform float iridescence;\n	uniform float iridescenceIOR;\n	uniform float iridescenceThicknessMinimum;\n	uniform float iridescenceThicknessMaximum;\n#endif\n#ifdef USE_SHEEN\n	uniform vec3 sheenColor;\n	uniform float sheenRoughness;\n	#ifdef USE_SHEEN_COLORMAP\n		uniform sampler2D sheenColorMap;\n	#endif\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		uniform sampler2D sheenRoughnessMap;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	uniform vec2 anisotropyVector;\n	#ifdef USE_ANISOTROPYMAP\n		uniform sampler2D anisotropyMap;\n	#endif\n#endif\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <iridescence_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_physical_pars_fragment>\n#include <transmission_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <iridescence_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <roughnessmap_fragment>\n	#include <metalnessmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <clearcoat_normal_fragment_begin>\n	#include <clearcoat_normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_physical_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;\n	#include <transmission_fragment>\n	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;\n	#ifdef USE_SHEEN\n \n		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;\n \n 	#endif\n	#ifdef USE_CLEARCOAT\n		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );\n		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );\n		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;\n	#endif\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	meshtoon_vert: "#define TOON\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}",
	meshtoon_frag: "#define TOON\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_toon_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_toon_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}",
	points_vert: "uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#ifdef USE_POINTS_UV\n	varying vec2 vUv;\n	uniform mat3 uvTransform;\n#endif\nvoid main() {\n	#ifdef USE_POINTS_UV\n		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	#endif\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	gl_PointSize = size;\n	#ifdef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n	#endif\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <fog_vertex>\n}",
	points_frag: "uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_particle_fragment>\n	#include <color_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}",
	shadow_vert: "#include <common>\n#include <batching_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <shadowmap_pars_vertex>\nvoid main() {\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}",
	shadow_frag: "uniform vec3 color;\nuniform float opacity;\n#include <common>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <logdepthbuf_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n	#include <logdepthbuf_fragment>\n	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}",
	sprite_vert: "uniform float rotation;\nuniform vec2 center;\n#include <common>\n#include <uv_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	vec4 mvPosition = modelViewMatrix[ 3 ];\n	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );\n	#ifndef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) scale *= - mvPosition.z;\n	#endif\n	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n	vec2 rotatedPosition;\n	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\n	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\n	mvPosition.xy += rotatedPosition;\n	gl_Position = projectionMatrix * mvPosition;\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}",
	sprite_frag: "uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n}"
}, Q = {
	common: {
		diffuse: { value: /*@__PURE__*/ new Z(16777215) },
		opacity: { value: 1 },
		map: { value: null },
		mapTransform: { value: /*@__PURE__*/ new X() },
		alphaMap: { value: null },
		alphaMapTransform: { value: /*@__PURE__*/ new X() },
		alphaTest: { value: 0 }
	},
	specularmap: {
		specularMap: { value: null },
		specularMapTransform: { value: /*@__PURE__*/ new X() }
	},
	envmap: {
		envMap: { value: null },
		envMapRotation: { value: /*@__PURE__*/ new X() },
		reflectivity: { value: 1 },
		ior: { value: 1.5 },
		refractionRatio: { value: .98 },
		dfgLUT: { value: null }
	},
	aomap: {
		aoMap: { value: null },
		aoMapIntensity: { value: 1 },
		aoMapTransform: { value: /*@__PURE__*/ new X() }
	},
	lightmap: {
		lightMap: { value: null },
		lightMapIntensity: { value: 1 },
		lightMapTransform: { value: /*@__PURE__*/ new X() }
	},
	bumpmap: {
		bumpMap: { value: null },
		bumpMapTransform: { value: /*@__PURE__*/ new X() },
		bumpScale: { value: 1 }
	},
	normalmap: {
		normalMap: { value: null },
		normalMapTransform: { value: /*@__PURE__*/ new X() },
		normalScale: { value: /*@__PURE__*/ new J(1, 1) }
	},
	displacementmap: {
		displacementMap: { value: null },
		displacementMapTransform: { value: /*@__PURE__*/ new X() },
		displacementScale: { value: 1 },
		displacementBias: { value: 0 }
	},
	emissivemap: {
		emissiveMap: { value: null },
		emissiveMapTransform: { value: /*@__PURE__*/ new X() }
	},
	metalnessmap: {
		metalnessMap: { value: null },
		metalnessMapTransform: { value: /*@__PURE__*/ new X() }
	},
	roughnessmap: {
		roughnessMap: { value: null },
		roughnessMapTransform: { value: /*@__PURE__*/ new X() }
	},
	gradientmap: { gradientMap: { value: null } },
	fog: {
		fogDensity: { value: 25e-5 },
		fogNear: { value: 1 },
		fogFar: { value: 2e3 },
		fogColor: { value: /*@__PURE__*/ new Z(16777215) }
	},
	lights: {
		ambientLightColor: { value: [] },
		lightProbe: { value: [] },
		sunLights: {
			value: [],
			properties: {
				direction: {},
				color: {}
			}
		},
		sunLightShadows: {
			value: [],
			properties: {
				shadowIntensity: 1,
				shadowBias: {},
				shadowNormalBias: {},
				shadowRadius: {},
				shadowMapSize: {}
			}
		},
		sunShadowMatrix: { value: [] },
		sunShadowCascade: { value: [] },
		directionalLights: {
			value: [],
			properties: {
				direction: {},
				color: {}
			}
		},
		directionalLightShadows: {
			value: [],
			properties: {
				shadowIntensity: 1,
				shadowBias: {},
				shadowNormalBias: {},
				shadowRadius: {},
				shadowMapSize: {}
			}
		},
		directionalShadowMatrix: { value: [] },
		spotLights: {
			value: [],
			properties: {
				color: {},
				position: {},
				direction: {},
				distance: {},
				coneCos: {},
				penumbraCos: {},
				decay: {}
			}
		},
		spotLightShadows: {
			value: [],
			properties: {
				shadowIntensity: 1,
				shadowBias: {},
				shadowNormalBias: {},
				shadowRadius: {},
				shadowMapSize: {}
			}
		},
		spotLightMap: { value: [] },
		spotLightMatrix: { value: [] },
		pointLights: {
			value: [],
			properties: {
				color: {},
				position: {},
				decay: {},
				distance: {}
			}
		},
		pointLightShadows: {
			value: [],
			properties: {
				shadowIntensity: 1,
				shadowBias: {},
				shadowNormalBias: {},
				shadowRadius: {},
				shadowMapSize: {},
				shadowCameraNear: {},
				shadowCameraFar: {}
			}
		},
		pointShadowMatrix: { value: [] },
		hemisphereLights: {
			value: [],
			properties: {
				direction: {},
				skyColor: {},
				groundColor: {}
			}
		},
		rectAreaLights: {
			value: [],
			properties: {
				color: {},
				position: {},
				width: {},
				height: {}
			}
		},
		ltc_1: { value: null },
		ltc_2: { value: null },
		probesSH: { value: [] },
		probesMin: { value: [] },
		probesMax: { value: [] },
		probesResolution: { value: [] }
	},
	points: {
		diffuse: { value: /*@__PURE__*/ new Z(16777215) },
		opacity: { value: 1 },
		size: { value: 1 },
		scale: { value: 1 },
		map: { value: null },
		alphaMap: { value: null },
		alphaMapTransform: { value: /*@__PURE__*/ new X() },
		alphaTest: { value: 0 },
		uvTransform: { value: /*@__PURE__*/ new X() }
	},
	sprite: {
		diffuse: { value: /*@__PURE__*/ new Z(16777215) },
		opacity: { value: 1 },
		center: { value: /*@__PURE__*/ new J(.5, .5) },
		rotation: { value: 0 },
		map: { value: null },
		mapTransform: { value: /*@__PURE__*/ new X() },
		alphaMap: { value: null },
		alphaMapTransform: { value: /*@__PURE__*/ new X() },
		alphaTest: { value: 0 }
	}
}, $a = {
	basic: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.specularmap,
			Q.envmap,
			Q.aomap,
			Q.lightmap,
			Q.fog
		]),
		vertexShader: Qa.meshbasic_vert,
		fragmentShader: Qa.meshbasic_frag
	},
	lambert: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.specularmap,
			Q.envmap,
			Q.aomap,
			Q.lightmap,
			Q.emissivemap,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			Q.fog,
			Q.lights,
			{
				emissive: { value: /*@__PURE__*/ new Z(0) },
				envMapIntensity: { value: 1 }
			}
		]),
		vertexShader: Qa.meshlambert_vert,
		fragmentShader: Qa.meshlambert_frag
	},
	phong: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.specularmap,
			Q.envmap,
			Q.aomap,
			Q.lightmap,
			Q.emissivemap,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			Q.fog,
			Q.lights,
			{
				emissive: { value: /*@__PURE__*/ new Z(0) },
				specular: { value: /*@__PURE__*/ new Z(1118481) },
				shininess: { value: 30 },
				envMapIntensity: { value: 1 }
			}
		]),
		vertexShader: Qa.meshphong_vert,
		fragmentShader: Qa.meshphong_frag
	},
	standard: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.envmap,
			Q.aomap,
			Q.lightmap,
			Q.emissivemap,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			Q.roughnessmap,
			Q.metalnessmap,
			Q.fog,
			Q.lights,
			{
				emissive: { value: /*@__PURE__*/ new Z(0) },
				roughness: { value: 1 },
				metalness: { value: 0 },
				envMapIntensity: { value: 1 }
			}
		]),
		vertexShader: Qa.meshphysical_vert,
		fragmentShader: Qa.meshphysical_frag
	},
	toon: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.aomap,
			Q.lightmap,
			Q.emissivemap,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			Q.gradientmap,
			Q.fog,
			Q.lights,
			{ emissive: { value: /*@__PURE__*/ new Z(0) } }
		]),
		vertexShader: Qa.meshtoon_vert,
		fragmentShader: Qa.meshtoon_frag
	},
	matcap: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			Q.fog,
			{ matcap: { value: null } }
		]),
		vertexShader: Qa.meshmatcap_vert,
		fragmentShader: Qa.meshmatcap_frag
	},
	points: {
		uniforms: /*@__PURE__*/ ki([Q.points, Q.fog]),
		vertexShader: Qa.points_vert,
		fragmentShader: Qa.points_frag
	},
	dashed: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.fog,
			{
				scale: { value: 1 },
				dashSize: { value: 1 },
				totalSize: { value: 2 }
			}
		]),
		vertexShader: Qa.linedashed_vert,
		fragmentShader: Qa.linedashed_frag
	},
	depth: {
		uniforms: /*@__PURE__*/ ki([Q.common, Q.displacementmap]),
		vertexShader: Qa.depth_vert,
		fragmentShader: Qa.depth_frag
	},
	normal: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.bumpmap,
			Q.normalmap,
			Q.displacementmap,
			{ opacity: { value: 1 } }
		]),
		vertexShader: Qa.meshnormal_vert,
		fragmentShader: Qa.meshnormal_frag
	},
	sprite: {
		uniforms: /*@__PURE__*/ ki([Q.sprite, Q.fog]),
		vertexShader: Qa.sprite_vert,
		fragmentShader: Qa.sprite_frag
	},
	background: {
		uniforms: {
			uvTransform: { value: /*@__PURE__*/ new X() },
			t2D: { value: null },
			backgroundIntensity: { value: 1 }
		},
		vertexShader: Qa.background_vert,
		fragmentShader: Qa.background_frag
	},
	backgroundCube: {
		uniforms: {
			envMap: { value: null },
			backgroundBlurriness: { value: 0 },
			backgroundIntensity: { value: 1 },
			backgroundRotation: { value: /*@__PURE__*/ new X() }
		},
		vertexShader: Qa.backgroundCube_vert,
		fragmentShader: Qa.backgroundCube_frag
	},
	cube: {
		uniforms: {
			tCube: { value: null },
			tFlip: { value: -1 },
			opacity: { value: 1 }
		},
		vertexShader: Qa.cube_vert,
		fragmentShader: Qa.cube_frag
	},
	equirect: {
		uniforms: { tEquirect: { value: null } },
		vertexShader: Qa.equirect_vert,
		fragmentShader: Qa.equirect_frag
	},
	distance: {
		uniforms: /*@__PURE__*/ ki([
			Q.common,
			Q.displacementmap,
			{
				referencePosition: { value: /*@__PURE__*/ new Y() },
				nearDistance: { value: 1 },
				farDistance: { value: 1e3 }
			}
		]),
		vertexShader: Qa.distance_vert,
		fragmentShader: Qa.distance_frag
	},
	shadow: {
		uniforms: /*@__PURE__*/ ki([
			Q.lights,
			Q.fog,
			{
				color: { value: /*@__PURE__*/ new Z(0) },
				opacity: { value: 1 }
			}
		]),
		vertexShader: Qa.shadow_vert,
		fragmentShader: Qa.shadow_frag
	}
};
$a.physical = {
	uniforms: /*@__PURE__*/ ki([$a.standard.uniforms, {
		clearcoat: { value: 0 },
		clearcoatMap: { value: null },
		clearcoatMapTransform: { value: /*@__PURE__*/ new X() },
		clearcoatNormalMap: { value: null },
		clearcoatNormalMapTransform: { value: /*@__PURE__*/ new X() },
		clearcoatNormalScale: { value: /*@__PURE__*/ new J(1, 1) },
		clearcoatRoughness: { value: 0 },
		clearcoatRoughnessMap: { value: null },
		clearcoatRoughnessMapTransform: { value: /*@__PURE__*/ new X() },
		diffuseRoughness: { value: 0 },
		diffuseRoughnessMap: { value: null },
		diffuseRoughnessMapTransform: { value: /*@__PURE__*/ new X() },
		dispersion: { value: 0 },
		retroreflectivity: { value: 0 },
		iridescence: { value: 0 },
		iridescenceMap: { value: null },
		iridescenceMapTransform: { value: /*@__PURE__*/ new X() },
		iridescenceIOR: { value: 1.3 },
		iridescenceThicknessMinimum: { value: 100 },
		iridescenceThicknessMaximum: { value: 400 },
		iridescenceThicknessMap: { value: null },
		iridescenceThicknessMapTransform: { value: /*@__PURE__*/ new X() },
		sheen: { value: 0 },
		sheenColor: { value: /*@__PURE__*/ new Z(0) },
		sheenColorMap: { value: null },
		sheenColorMapTransform: { value: /*@__PURE__*/ new X() },
		sheenRoughness: { value: 1 },
		sheenRoughnessMap: { value: null },
		sheenRoughnessMapTransform: { value: /*@__PURE__*/ new X() },
		transmission: { value: 0 },
		transmissionMap: { value: null },
		transmissionMapTransform: { value: /*@__PURE__*/ new X() },
		transmissionSamplerSize: { value: /*@__PURE__*/ new J() },
		transmissionSamplerMap: { value: null },
		thickness: { value: 0 },
		thicknessMap: { value: null },
		thicknessMapTransform: { value: /*@__PURE__*/ new X() },
		attenuationDistance: { value: 0 },
		attenuationColor: { value: /*@__PURE__*/ new Z(0) },
		specularColor: { value: /*@__PURE__*/ new Z(1, 1, 1) },
		specularColorMap: { value: null },
		specularColorMapTransform: { value: /*@__PURE__*/ new X() },
		specularIntensity: { value: 1 },
		specularIntensityMap: { value: null },
		specularIntensityMapTransform: { value: /*@__PURE__*/ new X() },
		anisotropyVector: { value: /*@__PURE__*/ new J() },
		anisotropyMap: { value: null },
		anisotropyMapTransform: { value: /*@__PURE__*/ new X() }
	}]),
	vertexShader: Qa.meshphysical_vert,
	fragmentShader: Qa.meshphysical_frag
};
var eo = {
	r: 0,
	b: 0,
	g: 0
}, to = /*@__PURE__*/ new Jt(), no = /*@__PURE__*/ new X();
no.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);
function ro(e, t, n, r, i, a) {
	let o = new Z(0), s = i === !0 ? 0 : 1, c, l, u = null, d = 0, f = null;
	function p(e) {
		let n = e.isScene === !0 ? e.background : null;
		if (n && n.isTexture) {
			let r = e.backgroundBlurriness > 0;
			n = t.get(n, r);
		}
		return n;
	}
	function m(t) {
		let r = !1, i = p(t);
		i === null ? g(o, s) : i && i.isColor && (g(i, 1), r = !0);
		let c = e.xr.getEnvironmentBlendMode();
		c === "additive" ? n.buffers.color.setClear(0, 0, 0, 1, a) : c === "alpha-blend" && n.buffers.color.setClear(0, 0, 0, 0, a), (e.autoClear || r) && (n.buffers.depth.setTest(!0), n.buffers.depth.setMask(!0), n.buffers.color.setMask(!0), e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil));
	}
	function h(t, n) {
		let i = p(n);
		i && i.isCubeTexture ? (l === void 0 && (l = new Yr(new wi(1, 1, 1), new Ii({
			name: "BackgroundCubeMaterial",
			uniforms: Oi($a.backgroundCube.uniforms),
			vertexShader: $a.backgroundCube.vertexShader,
			fragmentShader: $a.backgroundCube.fragmentShader,
			side: 1,
			depthTest: !1,
			depthWrite: !1,
			fog: !1,
			allowOverride: !1
		})), l.geometry.deleteAttribute("normal"), l.geometry.deleteAttribute("uv"), l.onBeforeRender = function(e, t, n) {
			this.matrixWorld.copyPosition(n.matrixWorld);
		}, Object.defineProperty(l.material, "envMap", { get: function() {
			return this.uniforms.envMap.value;
		} }), r.update(l)), l.material.uniforms.envMap.value = i, l.material.uniforms.backgroundBlurriness.value = n.backgroundBlurriness, l.material.uniforms.backgroundIntensity.value = n.backgroundIntensity, l.material.uniforms.backgroundRotation.value.setFromMatrix4(to.makeRotationFromEuler(n.backgroundRotation)).transpose(), i.isRenderTargetTexture === !1 && l.material.uniforms.backgroundRotation.value.premultiply(no), l.material.toneMapped = Mt.getTransfer(i.colorSpace) !== Ie, (u !== i || d !== i.version || f !== e.toneMapping) && (l.material.needsUpdate = !0, u = i, d = i.version, f = e.toneMapping), l.layers.enableAll(), t.unshift(l, l.geometry, l.material, 0, 0, null)) : i && i.isTexture && (c === void 0 && (c = new Yr(new Ei(2, 2), new Ii({
			name: "BackgroundMaterial",
			uniforms: Oi($a.background.uniforms),
			vertexShader: $a.background.vertexShader,
			fragmentShader: $a.background.fragmentShader,
			side: 0,
			depthTest: !1,
			depthWrite: !1,
			fog: !1,
			allowOverride: !1
		})), c.geometry.deleteAttribute("normal"), Object.defineProperty(c.material, "map", { get: function() {
			return this.uniforms.t2D.value;
		} }), r.update(c)), c.material.uniforms.t2D.value = i, c.material.uniforms.backgroundIntensity.value = n.backgroundIntensity, c.material.toneMapped = Mt.getTransfer(i.colorSpace) !== Ie, i.matrixAutoUpdate === !0 && i.updateMatrix(), c.material.uniforms.uvTransform.value.copy(i.matrix), (u !== i || d !== i.version || f !== e.toneMapping) && (c.material.needsUpdate = !0, u = i, d = i.version, f = e.toneMapping), c.layers.enableAll(), t.unshift(c, c.geometry, c.material, 0, 0, null));
	}
	function g(t, r) {
		t.getRGB(eo, Mi(e)), n.buffers.color.setClear(eo.r, eo.g, eo.b, r, a);
	}
	function _() {
		l !== void 0 && (l.geometry.dispose(), l.material.dispose(), l = void 0), c !== void 0 && (c.geometry.dispose(), c.material.dispose(), c = void 0);
	}
	return {
		getClearColor: function() {
			return o;
		},
		setClearColor: function(e, t = 1) {
			o.set(e), s = t, g(o, s);
		},
		getClearAlpha: function() {
			return s;
		},
		setClearAlpha: function(e) {
			s = e, g(o, s);
		},
		render: m,
		addToRenderList: h,
		dispose: _
	};
}
function io(e, t) {
	let n = e.getParameter(e.MAX_VERTEX_ATTRIBS), r = {}, i = f(null), a = i, o = !1;
	function s(n, r, i, s, c) {
		let u = !1, f = d(n, s, i, r);
		a !== f && (a = f, l(a.object)), u = p(n, s, i, c), u && m(n, s, i, c), c !== null && t.update(c, e.ELEMENT_ARRAY_BUFFER), (u || o) && (o = !1, b(n, r, i, s), c !== null && e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, t.get(c).buffer));
	}
	function c() {
		return e.createVertexArray();
	}
	function l(t) {
		return e.bindVertexArray(t);
	}
	function u(t) {
		return e.deleteVertexArray(t);
	}
	function d(e, t, n, i) {
		let a = i.wireframe === !0, o = r[t.id];
		o === void 0 && (o = {}, r[t.id] = o);
		let s = e.isInstancedMesh === !0 ? e.id : 0, l = o[s];
		l === void 0 && (l = {}, o[s] = l);
		let u = l[n.id];
		u === void 0 && (u = {}, l[n.id] = u);
		let d = u[a];
		return d === void 0 && (d = f(c()), u[a] = d), d;
	}
	function f(e) {
		let t = [], r = [], i = [];
		for (let e = 0; e < n; e++) t[e] = 0, r[e] = 0, i[e] = 0;
		return {
			geometry: null,
			program: null,
			wireframe: !1,
			newAttributes: t,
			enabledAttributes: r,
			attributeDivisors: i,
			object: e,
			attributes: {},
			index: null
		};
	}
	function p(e, t, n, r) {
		let i = a.attributes, o = t.attributes, s = 0, c = n.getAttributes();
		for (let t in c) if (c[t].location >= 0) {
			let n = i[t], r = o[t];
			if (r === void 0 && (t === "instanceMatrix" && e.instanceMatrix && (r = e.instanceMatrix), t === "instanceColor" && e.instanceColor && (r = e.instanceColor)), n === void 0 || n.attribute !== r || r && n.data !== r.data) return !0;
			s++;
		}
		return a.attributesNum !== s || a.index !== r;
	}
	function m(e, t, n, r) {
		let i = {}, o = t.attributes, s = 0, c = n.getAttributes();
		for (let t in c) if (c[t].location >= 0) {
			let n = o[t];
			n === void 0 && (t === "instanceMatrix" && e.instanceMatrix && (n = e.instanceMatrix), t === "instanceColor" && e.instanceColor && (n = e.instanceColor));
			let r = {};
			r.attribute = n, n && n.data && (r.data = n.data), i[t] = r, s++;
		}
		a.attributes = i, a.attributesNum = s, a.index = r;
	}
	function h() {
		let e = a.newAttributes;
		for (let t = 0, n = e.length; t < n; t++) e[t] = 0;
	}
	function g(e) {
		_(e, 0);
	}
	function _(t, n) {
		let r = a.newAttributes, i = a.enabledAttributes, o = a.attributeDivisors;
		r[t] = 1, i[t] === 0 && (e.enableVertexAttribArray(t), i[t] = 1), o[t] !== n && (e.vertexAttribDivisor(t, n), o[t] = n);
	}
	function v() {
		let t = a.newAttributes, n = a.enabledAttributes;
		for (let r = 0, i = n.length; r < i; r++) n[r] !== t[r] && (e.disableVertexAttribArray(r), n[r] = 0);
	}
	function y(t, n, r, i, a, o, s) {
		s === !0 ? e.vertexAttribIPointer(t, n, r, a, o) : e.vertexAttribPointer(t, n, r, i, a, o);
	}
	function b(n, r, i, a) {
		h();
		let o = a.attributes, s = i.getAttributes(), c = r.defaultAttributeValues;
		for (let r in s) {
			let i = s[r];
			if (i.location >= 0) {
				let s = o[r];
				if (s === void 0 && (r === "instanceMatrix" && n.instanceMatrix && (s = n.instanceMatrix), r === "instanceColor" && n.instanceColor && (s = n.instanceColor)), s !== void 0) {
					let r = s.normalized, o = s.itemSize, c = t.get(s);
					if (c === void 0) continue;
					let l = c.buffer, u = c.type, d = c.bytesPerElement, f = u === e.INT || u === e.UNSIGNED_INT || s.gpuType === 1013;
					if (s.isInterleavedBufferAttribute) {
						let t = s.data, c = t.isInterleavedBuffer === !0 ? t.stride : t.itemSize, p = s.offset;
						if (t.isInstancedInterleavedBuffer || t.isInstancedBufferAttribute) {
							for (let e = 0; e < i.locationSize; e++) _(i.location + e, t.meshPerAttribute);
							n.isInstancedMesh !== !0 && a._maxInstanceCount === void 0 && (a._maxInstanceCount = t.meshPerAttribute * t.count);
						} else for (let e = 0; e < i.locationSize; e++) g(i.location + e);
						e.bindBuffer(e.ARRAY_BUFFER, l);
						for (let e = 0; e < i.locationSize; e++) y(i.location + e, o / i.locationSize, u, r, c * d, (p + o / i.locationSize * e) * d, f);
					} else {
						if (s.isInstancedBufferAttribute) {
							for (let e = 0; e < i.locationSize; e++) _(i.location + e, s.meshPerAttribute);
							n.isInstancedMesh !== !0 && a._maxInstanceCount === void 0 && (a._maxInstanceCount = s.meshPerAttribute * s.count);
						} else for (let e = 0; e < i.locationSize; e++) g(i.location + e);
						e.bindBuffer(e.ARRAY_BUFFER, l);
						for (let e = 0; e < i.locationSize; e++) y(i.location + e, o / i.locationSize, u, r, o * d, o / i.locationSize * e * d, f);
					}
				} else if (c !== void 0) {
					let t = c[r];
					if (t !== void 0) switch (t.length) {
						case 2:
							e.vertexAttrib2fv(i.location, t);
							break;
						case 3:
							e.vertexAttrib3fv(i.location, t);
							break;
						case 4:
							e.vertexAttrib4fv(i.location, t);
							break;
						default: e.vertexAttrib1fv(i.location, t);
					}
				}
			}
		}
		v();
	}
	function x() {
		T();
		for (let e in r) {
			let t = r[e];
			for (let e in t) {
				let n = t[e];
				for (let e in n) {
					let t = n[e];
					for (let e in t) u(t[e].object), delete t[e];
					delete n[e];
				}
			}
			delete r[e];
		}
	}
	function S(e) {
		if (r[e.id] === void 0) return;
		let t = r[e.id];
		for (let e in t) {
			let n = t[e];
			for (let e in n) {
				let t = n[e];
				for (let e in t) u(t[e].object), delete t[e];
				delete n[e];
			}
		}
		delete r[e.id];
	}
	function C(e) {
		for (let t in r) {
			let n = r[t];
			for (let t in n) {
				let r = n[t];
				if (r[e.id] === void 0) continue;
				let i = r[e.id];
				for (let e in i) u(i[e].object), delete i[e];
				delete r[e.id];
			}
		}
	}
	function w(e) {
		for (let t in r) {
			let n = r[t], i = e.isInstancedMesh === !0 ? e.id : 0, a = n[i];
			if (a !== void 0) {
				for (let e in a) {
					let t = a[e];
					for (let e in t) u(t[e].object), delete t[e];
					delete a[e];
				}
				delete n[i], Object.keys(n).length === 0 && delete r[t];
			}
		}
	}
	function T() {
		E(), o = !0, a !== i && (a = i, l(a.object));
	}
	function E() {
		i.geometry = null, i.program = null, i.wireframe = !1;
	}
	return {
		setup: s,
		reset: T,
		resetDefaultState: E,
		dispose: x,
		releaseStatesOfGeometry: S,
		releaseStatesOfObject: w,
		releaseStatesOfProgram: C,
		initAttributes: h,
		enableAttribute: g,
		disableUnusedAttributes: v
	};
}
function ao(e, t, n) {
	let r;
	function i(e) {
		r = e;
	}
	function a(t, i) {
		e.drawArrays(r, t, i), n.update(i, r, 1);
	}
	function o(t, i, a) {
		a !== 0 && (e.drawArraysInstanced(r, t, i, a), n.update(i, r, a));
	}
	function s(e, i, a) {
		if (a === 0) return;
		t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(r, e, 0, i, 0, a);
		let o = 0;
		for (let e = 0; e < a; e++) o += i[e];
		n.update(o, r, 1);
	}
	this.setMode = i, this.render = a, this.renderInstances = o, this.renderMultiDraw = s;
}
function oo(e, t, n, r) {
	let i;
	function a() {
		if (i !== void 0) return i;
		if (t.has("EXT_texture_filter_anisotropic") === !0) {
			let n = t.get("EXT_texture_filter_anisotropic");
			i = e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		} else i = 0;
		return i;
	}
	function o(t) {
		return t === 1023 || r.convert(t) === e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT);
	}
	function s(n) {
		let i = n === 1016 && (t.has("EXT_color_buffer_half_float") || t.has("EXT_color_buffer_float"));
		return !(n !== 1009 && n !== 1015 && !i && r.convert(n) !== e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE));
	}
	function c(t) {
		if (t === "highp") {
			if (e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_FLOAT).precision > 0 && e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).precision > 0) return "highp";
			t = "mediump";
		}
		return t === "mediump" && e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_FLOAT).precision > 0 && e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_FLOAT).precision > 0 ? "mediump" : "lowp";
	}
	let l = n.precision === void 0 ? "highp" : n.precision, u = c(l);
	u !== l && (G("WebGLRenderer:", l, "not supported, using", u, "instead."), l = u);
	let d = n.reversedDepthBuffer === !0 && t.has("EXT_clip_control"), f = n.logarithmicDepthBuffer === !0 && d === !1;
	n.reversedDepthBuffer === !0 && d === !1 && G("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."), n.logarithmicDepthBuffer === !0 && d === !0 && G("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");
	let p = e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), m = e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS), h = e.getParameter(e.MAX_TEXTURE_SIZE), g = e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE), _ = e.getParameter(e.MAX_VERTEX_ATTRIBS), v = e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS), y = e.getParameter(e.MAX_VARYING_VECTORS), b = e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS), x = e.getParameter(e.MAX_SAMPLES), S = e.getParameter(e.SAMPLES);
	return {
		isWebGL2: !0,
		getMaxAnisotropy: a,
		getMaxPrecision: c,
		textureFormatReadable: o,
		textureTypeReadable: s,
		precision: l,
		logarithmicDepthBuffer: f,
		reversedDepthBuffer: d,
		maxTextures: p,
		maxVertexTextures: m,
		maxTextureSize: h,
		maxCubemapSize: g,
		maxAttributes: _,
		maxVertexUniforms: v,
		maxVaryings: y,
		maxFragmentUniforms: b,
		maxSamples: x,
		samples: S
	};
}
function so(e) {
	let t = this, n = null, r = 0, i = !1, a = !1, o = new kr(), s = new X(), c = {
		value: null,
		needsUpdate: !1
	};
	this.uniform = c, this.numPlanes = 0, this.numIntersection = 0, this.init = function(e, t) {
		let n = e.length !== 0 || t || r !== 0 || i;
		return i = t, r = e.length, n;
	}, this.beginShadows = function() {
		a = !0, u(null);
	}, this.endShadows = function() {
		a = !1;
	}, this.setGlobalState = function(e, t) {
		n = u(e, t, 0);
	}, this.setState = function(t, o, s) {
		let d = t.clippingPlanes, f = t.clipIntersection, p = t.clipShadows, m = e.get(t);
		if (!i || d === null || d.length === 0 || a && !p) a ? u(null) : l();
		else {
			let e = a ? 0 : r, t = e * 4, i = m.clippingState || null;
			c.value = i, i = u(d, o, t, s);
			for (let e = 0; e !== t; ++e) i[e] = n[e];
			m.clippingState = i, this.numIntersection = f ? this.numPlanes : 0, this.numPlanes += e;
		}
	};
	function l() {
		c.value !== n && (c.value = n, c.needsUpdate = r > 0), t.numPlanes = r, t.numIntersection = 0;
	}
	function u(e, n, r, i) {
		let a = e === null ? 0 : e.length, l = null;
		if (a !== 0) {
			if (l = c.value, i !== !0 || l === null) {
				let t = r + a * 4, i = n.matrixWorldInverse;
				s.getNormalMatrix(i), (l === null || l.length < t) && (l = new Float32Array(t));
				for (let t = 0, n = r; t !== a; ++t, n += 4) o.copy(e[t]).applyMatrix4(i, s), o.normal.toArray(l, n), l[n + 3] = o.constant;
			}
			c.value = l, c.needsUpdate = !0;
		}
		return t.numPlanes = a, t.numIntersection = 0, l;
	}
}
var co = class extends Gt {
	constructor(e = 1, t = {}) {
		super(e, e, t), this.isWebGLCubeRenderTarget = !0;
		let n = {
			width: e,
			height: e,
			depth: 1
		}, r = [
			n,
			n,
			n,
			n,
			n,
			n
		];
		this.texture = new yi(r), this._setTextureOptions(t), this.texture.isRenderTargetTexture = !0;
	}
	fromEquirectangularTexture(e, t) {
		this.texture.type = t.type, this.texture.colorSpace = t.colorSpace, this.texture.generateMipmaps = t.generateMipmaps, this.texture.minFilter = t.minFilter, this.texture.magFilter = t.magFilter;
		let n = {
			uniforms: { tEquirect: { value: null } },
			vertexShader: "\n\n				varying vec3 vWorldDirection;\n\n				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\n					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n\n				}\n\n				void main() {\n\n					vWorldDirection = transformDirection( position, modelMatrix );\n\n					#include <begin_vertex>\n					#include <project_vertex>\n\n				}\n			",
			fragmentShader: "\n\n				uniform sampler2D tEquirect;\n\n				varying vec3 vWorldDirection;\n\n				#include <common>\n\n				void main() {\n\n					vec3 direction = normalize( vWorldDirection );\n\n					vec2 sampleUV = equirectUv( direction );\n\n					gl_FragColor = texture2D( tEquirect, sampleUV );\n\n				}\n			"
		}, r = new wi(5, 5, 5), i = new Ii({
			name: "CubemapFromEquirect",
			uniforms: Oi(n.uniforms),
			vertexShader: n.vertexShader,
			fragmentShader: n.fragmentShader,
			side: 1,
			blending: 0
		});
		i.uniforms.tEquirect.value = t;
		let a = new Yr(r, i), o = t.minFilter;
		return t.minFilter === 1008 && (t.minFilter = c), new ka(1, 10, this).update(e, a), t.minFilter = o, a.geometry.dispose(), a.material.dispose(), this;
	}
	clear(e, t = !0, n = !0, r = !0) {
		let i = e.getRenderTarget();
		for (let i = 0; i < 6; i++) e.setRenderTarget(this, i), e.clear(t, n, r);
		e.setRenderTarget(i);
	}
}, lo = 256, uo = 3, fo = 20, po = 256, mo = 16, ho = 3, go = /*@__PURE__*/ new Y(), _o = /*@__PURE__*/ new Z(), vo = class e {
	constructor(e) {
		this._renderer = e, this._cubeSize = 0, this._sourceTarget = null, this._cubeCamera = new ka(1, 10, null), this._boxMesh = new Yr(new wi(5, 5, 5), null), this._cubemapMaterial = null, this._equirectMaterial = null, this._blurMaterial = null, this._ggxMaterial = null, this._integrationMaterial = null;
	}
	fromScene(e, t = 0, n = .1, r = 100, i = {}) {
		let { size: a = 256, position: o = go } = i, s = this._renderer;
		this._setSize(a);
		let c = this._allocateTarget(), l = this._getSourceTarget(!0);
		t > 0 && (l.texture.mipmapsAutoUpdate = !1);
		let u = s.autoClear, d = s.autoClearColor, f = s.autoClearDepth, p = s.autoClearStencil, m = e.background;
		s.autoClear = !0, s.autoClearColor = !0, s.autoClearDepth = !0, s.autoClearStencil = !0, m === null && (e.background = s.getClearColor(_o));
		let h = new ka(n, r, l);
		return h.position.copy(o), h.update(s, e), s.autoClear = u, s.autoClearColor = d, s.autoClearDepth = f, s.autoClearStencil = p, e.background = m, t > 0 && (l.texture.mipmapsAutoUpdate = !0, this._blur(c, t)), this._applyPMREM(c), c;
	}
	fromEquirectangular(e, t = null) {
		return this._fromTexture(e, t);
	}
	fromCubemap(e, t = null) {
		return this._fromTexture(e, t);
	}
	compileCubemapShader() {
		this._cubemapMaterial === null && (this._cubemapMaterial = To(), this._compileMaterial(this._cubemapMaterial));
	}
	compileEquirectangularShader() {
		this._equirectMaterial === null && (this._equirectMaterial = wo(), this._compileMaterial(this._equirectMaterial));
	}
	dispose() {
		this._sourceTarget !== null && this._sourceTarget.dispose(), this._cubemapMaterial !== null && this._cubemapMaterial.dispose(), this._equirectMaterial !== null && this._equirectMaterial.dispose(), this._blurMaterial !== null && this._blurMaterial.dispose(), this._ggxMaterial !== null && this._ggxMaterial.dispose(), this._integrationMaterial !== null && this._integrationMaterial.dispose(), this._boxMesh.geometry.dispose();
	}
	static lodToRoughness(e, t) {
		return t > 0 ? 1 - Math.sqrt(1 - e / t) : 0;
	}
	_setSize(e) {
		this._cubeSize = Math.max(lo, yt(e));
	}
	_fromTexture(e, t) {
		e.mapping === 301 || e.mapping === 302 ? this._setSize(e.image.length === 0 ? lo : e.image[0].width || e.image[0].image.width) : this._setSize(e.image.width / 4);
		let n = t || this._allocateTarget();
		return this._textureToCubemap(e), this._applyPMREM(n), n;
	}
	_allocateTarget() {
		let e = this._cubeSize, t = yo(e, !1, !1), n = Math.log2(e) - uo;
		for (let r = 0; r <= n; r++) t.texture.mipmaps.push({
			width: e >> r,
			height: e >> r
		});
		return t.texture.name = "PMREM", t.texture.isPMREMTexture = !0, t;
	}
	_getSourceTarget(e = !1) {
		let t = this._cubeSize, n = this._sourceTarget;
		return (n === null || n.width !== t || e && n.depthBuffer === !1) && (n !== null && n.dispose(), this._sourceTarget = yo(t, !0, e)), this._sourceTarget;
	}
	_compileMaterial(e) {
		this._boxMesh.material = e, this._renderer.compile(this._boxMesh, this._cubeCamera.children[0]);
	}
	_renderCube(e, t, n) {
		let r = this._boxMesh, i = this._cubeCamera;
		r.material = n, i.renderTarget = e, i.activeMipmapLevel = t;
		let a = e.width >> t;
		e.viewport.set(0, 0, a, a), i.update(this._renderer, r), e.viewport.set(0, 0, e.width, e.height);
	}
	_textureToCubemap(e) {
		let t;
		e.mapping === 301 || e.mapping === 302 ? (this._cubemapMaterial === null && (this._cubemapMaterial = To()), t = this._cubemapMaterial, t.uniforms.flipEnvMap.value = e.isRenderTargetTexture === !1 ? -1 : 1) : (this._equirectMaterial === null && (this._equirectMaterial = wo()), t = this._equirectMaterial), t.uniforms.envMap.value = e, this._renderCube(this._getSourceTarget(), 0, t);
	}
	_applyPMREM(t) {
		this._ggxMaterial === null && (this._ggxMaterial = xo(), this._integrationMaterial = So());
		let n = this._cubeSize, r = t.texture.mipmaps.length - 1, i = this._ggxMaterial.uniforms;
		i.envMap.value = this._sourceTarget.texture;
		let a = this._integrationMaterial.uniforms;
		a.envMap.value = this._sourceTarget.texture, a.sourceLod.value = Math.log2(n / mo);
		for (let o = 0; o <= r; o++) {
			let s = e.lodToRoughness(o, r);
			if (o > r - ho) a.roughness.value = s, this._renderCube(t, o, this._integrationMaterial);
			else {
				let e = s > 0 ? Math.log2(n) + .5 * Math.log2(6 / (po * s ** 4)) + .5 : 0;
				i.roughness.value = s, i.lodBias.value = e, this._renderCube(t, o, this._ggxMaterial);
			}
		}
	}
	_blur(e, t) {
		this._blurMaterial === null && (this._blurMaterial = Co());
		let n = this._blurMaterial, r = n.uniforms, i = this._sourceTarget;
		r.sigma.value = Math.min(t, Math.PI) / Math.SQRT2, r.envMap.value = i.texture, this._renderCube(e, 0, n), r.envMap.value = e.texture, this._renderCube(i, 0, n);
	}
};
function yo(e, t, n) {
	return new co(e, {
		minFilter: u,
		generateMipmaps: t,
		type: v,
		colorSpace: Pe,
		depthBuffer: n
	});
}
function bo(e, t, n) {
	return new Ii({
		name: e,
		uniforms: t,
		vertexShader: Qa.cube_vert,
		fragmentShader: n,
		side: 1,
		blending: 0,
		depthTest: !1,
		depthWrite: !1
	});
}
function xo() {
	return bo("PMREMGGXConvolution", {
		envMap: { value: null },
		roughness: { value: 0 },
		lodBias: { value: 0 }
	}, `

		#define GGX_SAMPLES ${po}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`);
}
function So() {
	return bo("PMREMGGXIntegration", {
		envMap: { value: null },
		roughness: { value: 0 },
		sourceLod: { value: 0 },
		sourceSize: { value: mo }
	}, "\n\n		varying vec3 vWorldDirection;\n\n		uniform samplerCube envMap;\n		uniform float roughness;\n		uniform float sourceLod;\n		uniform int sourceSize;\n\n		void main() {\n\n			vec3 N = normalize( vWorldDirection );\n\n			float alpha = roughness * roughness;\n			float alpha2 = alpha * alpha;\n\n			float texelSize = 2.0 / float( sourceSize );\n\n			vec3 prefilteredColor = vec3( 0.0 );\n			float totalWeight = 0.0;\n\n			// Pair opposite texels: only the one in N's hemisphere contributes.\n			for ( int face = 0; face < 3; face ++ ) {\n\n				for ( int y = 0; y < sourceSize; y ++ ) {\n\n					for ( int x = 0; x < sourceSize; x ++ ) {\n\n						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;\n						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );\n\n						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );\n						float NdotL = dot( N, texelDirection );\n						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;\n						NdotL = abs( NdotL ) * invDistance;\n\n						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors\n						// in the GGX distribution and texel solid angle cancel when normalized.\n						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;\n						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );\n\n						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;\n						totalWeight += weight;\n\n					}\n\n				}\n\n			}\n\n			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );\n\n		}\n	");
}
function Co() {
	return bo("PMREMSphericalGaussianBlur", {
		envMap: { value: null },
		sigma: { value: 0 }
	}, `

		#define SAMPLES ${fo}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`);
}
function wo() {
	return bo("PMREMEquirectangularToCubemap", { envMap: { value: null } }, "\n\n		varying vec3 vWorldDirection;\n\n		uniform sampler2D envMap;\n\n		#include <common>\n\n		void main() {\n\n			// Average four subpixel samples to preserve small, bright features.\n			vec3 direction = normalize( vWorldDirection );\n			vec3 dx = dFdx( direction ) * 0.25;\n			vec3 dy = dFdy( direction ) * 0.25;\n\n			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;\n			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;\n			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;\n			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;\n			gl_FragColor = vec4( color * 0.25, 1.0 );\n\n		}\n	");
}
function To() {
	return bo("PMREMCubemapToCubemap", {
		envMap: { value: null },
		flipEnvMap: { value: -1 }
	}, "\n\n		varying vec3 vWorldDirection;\n\n		uniform samplerCube envMap;\n		uniform float flipEnvMap;\n\n		void main() {\n\n			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );\n\n		}\n	");
}
function Eo(e) {
	let t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap(), r = null;
	function i(e, t = !1) {
		return e == null ? null : t ? o(e) : a(e);
	}
	function a(n) {
		if (n && n.isTexture) {
			let r = n.mapping;
			if (r === 303 || r === 304) {
				if (t.has(n)) {
					let e = t.get(n).texture;
					return s(e, n.mapping);
				}
				{
					let r = n.image;
					if (r && r.height > 0) {
						let i = new co(r.height);
						return i.fromEquirectangularTexture(e, n), t.set(n, i), n.addEventListener("dispose", l), s(i.texture, n.mapping);
					}
					return null;
				}
			}
		}
		return n;
	}
	function o(t) {
		if (t && t.isTexture && t.isPMREMTexture !== !0) {
			let i = t.mapping, a = i === 303 || i === 304, o = i === 301 || i === 302;
			if (a || o) {
				let i = n.get(t), s = i === void 0 ? 0 : i.texture.pmremVersion;
				if (t.isRenderTargetTexture && t.pmremVersion !== s) return r === null && (r = new vo(e)), i = a ? r.fromEquirectangular(t, i) : r.fromCubemap(t, i), i.texture.pmremVersion = t.pmremVersion, n.set(t, i), i.texture;
				if (i !== void 0) return i.texture;
				{
					let s = t.image;
					return a && s && s.height > 0 || o && s && c(s) ? (r === null && (r = new vo(e)), i = a ? r.fromEquirectangular(t) : r.fromCubemap(t), i.texture.pmremVersion = t.pmremVersion, n.set(t, i), t.addEventListener("dispose", u), i.texture) : null;
				}
			}
		}
		return t;
	}
	function s(e, t) {
		return t === 303 ? e.mapping = 301 : t === 304 && (e.mapping = 302), e;
	}
	function c(e) {
		let t = 0;
		for (let n = 0; n < 6; n++) e[n] !== void 0 && t++;
		return t === 6;
	}
	function l(e) {
		let n = e.target;
		n.removeEventListener("dispose", l);
		let r = t.get(n);
		r !== void 0 && (t.delete(n), r.dispose());
	}
	function u(e) {
		let t = e.target;
		t.removeEventListener("dispose", u);
		let r = n.get(t);
		r !== void 0 && (n.delete(t), r.dispose());
	}
	function d() {
		t = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap(), r !== null && (r.dispose(), r = null);
	}
	return {
		get: i,
		dispose: d
	};
}
function Do(e) {
	let t = {};
	function n(n) {
		if (t[n] !== void 0) return t[n];
		let r = e.getExtension(n);
		return t[n] = r, r;
	}
	return {
		has: function(e) {
			return n(e) !== null;
		},
		init: function() {
			n("EXT_color_buffer_float"), n("WEBGL_clip_cull_distance"), n("OES_texture_float_linear"), n("EXT_color_buffer_half_float"), n("WEBGL_multisampled_render_to_texture"), n("WEBGL_render_shared_exponent");
		},
		get: function(e) {
			let t = n(e);
			return t === null && Je("WebGLRenderer: " + e + " extension not supported."), t;
		}
	};
}
function Oo(e, t, n, r) {
	let i = {}, a = /* @__PURE__ */ new WeakMap(), o = new FinalizationRegistry((e) => delete i[e]);
	function s(e) {
		c(e.target);
	}
	function c(e) {
		e.index !== null && t.remove(e.index);
		for (let n in e.attributes) t.remove(e.attributes[n]);
		e.removeEventListener("dispose", s), delete i[e.id], o.unregister(e);
		let c = a.get(e);
		c && (t.remove(c), a.delete(e)), r.releaseStatesOfGeometry(e), e.isInstancedBufferGeometry === !0 && delete e._maxInstanceCount, n.memory.geometries--;
	}
	function l(e, t) {
		return i[t.id] === void 0 && (t.addEventListener("dispose", s), i[t.id] = new WeakRef(t), o.register(t, t.id, t), n.memory.geometries++), t;
	}
	function u(n) {
		let r = n.attributes;
		for (let n in r) t.update(r[n], e.ARRAY_BUFFER);
	}
	function d(e) {
		let n = e.index, r = e.attributes.position, i = 0;
		if (r === void 0) return;
		let o = n === null ? r.array.length / 3 - 1 : n.array.length, s = new (r.count >= 65535 ? fr : dr)(Math.ceil(o / 3) * 6, 1), c = s.array;
		if (n !== null) {
			let e = n.array;
			i = n.version;
			for (let t = 0, n = 0; t < o; t += 3) {
				let r = e[t + 0], i = e[t + 1], a = e[t + 2];
				c[n++] = r, c[n++] = i, c[n++] = i, c[n++] = a, c[n++] = a, c[n++] = r;
			}
		} else {
			i = r.version;
			for (let e = 0, t = 0; e < o; e += 3) {
				let n = e + 0, r = e + 1, i = e + 2;
				c[t++] = n, c[t++] = r, c[t++] = r, c[t++] = i, c[t++] = i, c[t++] = n;
			}
		}
		s.version = i;
		let l = a.get(e);
		l && t.remove(l), a.set(e, s);
	}
	function f(e) {
		let t = a.get(e);
		if (t) {
			let n = e.index;
			n !== null && t.version < n.version && d(e);
		} else d(e);
		return a.get(e);
	}
	function p() {
		for (let e in i) {
			let t = i[e].deref();
			t !== void 0 && c(t);
		}
	}
	return {
		get: l,
		update: u,
		getWireframeAttribute: f,
		dispose: p
	};
}
function ko(e, t, n) {
	let r;
	function i(e) {
		r = e;
	}
	let a, o;
	function s(e) {
		a = e.type, o = e.bytesPerElement;
	}
	function c(t, i) {
		e.drawElements(r, i, a, t * o), n.update(i, r, 1);
	}
	function l(t, i, s) {
		s !== 0 && (e.drawElementsInstanced(r, i, a, t * o, s), n.update(i, r, s));
	}
	function u(e, i, o) {
		if (o === 0) return;
		t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(r, i, 0, a, e, 0, o);
		let s = 0;
		for (let e = 0; e < o; e++) s += i[e];
		n.update(s, r, 1);
	}
	this.setMode = i, this.setIndex = s, this.render = c, this.renderInstances = l, this.renderMultiDraw = u;
}
function Ao(e) {
	let t = {
		geometries: 0,
		textures: 0
	}, n = {
		frame: 0,
		calls: 0,
		triangles: 0,
		points: 0,
		lines: 0
	};
	function r(t, r, i) {
		switch (n.calls++, r) {
			case e.TRIANGLES:
				n.triangles += t / 3 * i;
				break;
			case e.LINES:
				n.lines += t / 2 * i;
				break;
			case e.LINE_STRIP:
				n.lines += i * (t - 1);
				break;
			case e.LINE_LOOP:
				n.lines += i * t;
				break;
			case e.POINTS:
				n.points += i * t;
				break;
			default: K("WebGLInfo: Unknown draw mode:", r);
		}
	}
	function i() {
		n.calls = 0, n.triangles = 0, n.points = 0, n.lines = 0;
	}
	return {
		memory: t,
		render: n,
		programs: null,
		autoReset: !0,
		reset: i,
		update: r
	};
}
function jo(e, t, n) {
	let r = /* @__PURE__ */ new WeakMap(), i = new Ut();
	function a(a, o, s) {
		let c = a.morphTargetInfluences, l = o.morphAttributes.position || o.morphAttributes.normal || o.morphAttributes.color, u = l === void 0 ? 0 : l.length, d = r.get(o);
		if (d === void 0 || d.count !== u) {
			d !== void 0 && d.texture.dispose();
			let e = o.morphAttributes.position !== void 0, n = o.morphAttributes.normal !== void 0, a = o.morphAttributes.color !== void 0, s = o.morphAttributes.position || [], c = o.morphAttributes.normal || [], l = o.morphAttributes.color || [], f = 0;
			e === !0 && (f = 1), n === !0 && (f = 2), a === !0 && (f = 3);
			let p = o.attributes.position.count * f, m = 1;
			p > t.maxTextureSize && (m = Math.ceil(p / t.maxTextureSize), p = t.maxTextureSize);
			let h = new Float32Array(p * m * 4 * u), g = new Kt(h, p, m, u);
			g.type = _, g.needsUpdate = !0;
			let v = f * 4;
			for (let t = 0; t < u; t++) {
				let r = s[t], o = c[t], u = l[t], d = p * m * 4 * t;
				for (let t = 0; t < r.count; t++) {
					let s = t * v;
					e === !0 && (i.fromBufferAttribute(r, t), h[d + s + 0] = i.x, h[d + s + 1] = i.y, h[d + s + 2] = i.z, h[d + s + 3] = 0), n === !0 && (i.fromBufferAttribute(o, t), h[d + s + 4] = i.x, h[d + s + 5] = i.y, h[d + s + 6] = i.z, h[d + s + 7] = 0), a === !0 && (i.fromBufferAttribute(u, t), h[d + s + 8] = i.x, h[d + s + 9] = i.y, h[d + s + 10] = i.z, h[d + s + 11] = u.itemSize === 4 ? i.w : 1);
				}
			}
			d = {
				count: u,
				texture: g,
				size: new J(p, m)
			}, r.set(o, d);
			function y() {
				g.dispose(), r.delete(o), o.removeEventListener("dispose", y);
			}
			o.addEventListener("dispose", y);
		}
		if (a.isInstancedMesh === !0 && a.morphTexture !== null) s.getUniforms().setValue(e, "morphTexture", a.morphTexture, n);
		else {
			let t = 0;
			for (let e = 0; e < c.length; e++) t += c[e];
			let n = o.morphTargetsRelative ? 1 : 1 - t;
			s.getUniforms().setValue(e, "morphTargetBaseInfluence", n), s.getUniforms().setValue(e, "morphTargetInfluences", c);
		}
		s.getUniforms().setValue(e, "morphTargetsTexture", d.texture, n), s.getUniforms().setValue(e, "morphTargetsTextureSize", d.size);
	}
	return { update: a };
}
function Mo(e, t, n, r, i) {
	let a = /* @__PURE__ */ new WeakMap();
	function o(r) {
		let o = i.render.frame, s = r.geometry, l = t.get(r, s);
		if (a.get(l) !== o && (t.update(l), a.set(l, o)), r.isInstancedMesh && (r.hasEventListener("dispose", c) === !1 && r.addEventListener("dispose", c), a.get(r) !== o && (n.update(r.instanceMatrix, e.ARRAY_BUFFER), r.instanceColor !== null && n.update(r.instanceColor, e.ARRAY_BUFFER), a.set(r, o))), r.isSkinnedMesh) {
			let e = r.skeleton;
			a.get(e) !== o && (e.update(), a.set(e, o));
		}
		return l;
	}
	function s() {
		a = /* @__PURE__ */ new WeakMap();
	}
	function c(e) {
		let t = e.target;
		t.removeEventListener("dispose", c), r.releaseStatesOfObject(t), n.remove(t.instanceMatrix), t.instanceColor !== null && n.remove(t.instanceColor);
	}
	return {
		update: o,
		dispose: s
	};
}
var No = {
	1: "LINEAR_TONE_MAPPING",
	2: "REINHARD_TONE_MAPPING",
	3: "CINEON_TONE_MAPPING",
	4: "ACES_FILMIC_TONE_MAPPING",
	6: "AGX_TONE_MAPPING",
	7: "NEUTRAL_TONE_MAPPING",
	5: "CUSTOM_TONE_MAPPING"
};
function Po(e, t, n, r, i, a) {
	let o = new Gt(t, n, {
		type: e,
		depthBuffer: i,
		stencilBuffer: a,
		samples: r ? 4 : 0,
		storeMultisampledDepthBuffer: !1,
		storeMultisampledStencilBuffer: !1,
		resolveDepthBuffer: !1,
		resolveStencilBuffer: !1
	}), s = null, c = null, l = null, u = new Tr();
	u.setAttribute("position", new pr([
		-1,
		3,
		0,
		-1,
		-1,
		0,
		3,
		-1,
		0
	], 3)), u.setAttribute("uv", new pr([
		0,
		2,
		0,
		0,
		2,
		0
	], 2));
	let d = new Li({
		uniforms: { tDiffuse: { value: null } },
		vertexShader: "\n			precision highp float;\n\n			uniform mat4 modelViewMatrix;\n			uniform mat4 projectionMatrix;\n\n			attribute vec3 position;\n			attribute vec2 uv;\n\n			varying vec2 vUv;\n\n			void main() {\n				vUv = uv;\n				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n			}",
		fragmentShader: "\n			precision highp float;\n\n			uniform sampler2D tDiffuse;\n\n			varying vec2 vUv;\n\n			#include <tonemapping_pars_fragment>\n			#include <colorspace_pars_fragment>\n\n			void main() {\n				gl_FragColor = texture2D( tDiffuse, vUv );\n\n				#ifdef LINEAR_TONE_MAPPING\n					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );\n				#elif defined( REINHARD_TONE_MAPPING )\n					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );\n				#elif defined( CINEON_TONE_MAPPING )\n					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );\n				#elif defined( ACES_FILMIC_TONE_MAPPING )\n					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );\n				#elif defined( AGX_TONE_MAPPING )\n					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );\n				#elif defined( NEUTRAL_TONE_MAPPING )\n					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );\n				#elif defined( CUSTOM_TONE_MAPPING )\n					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );\n				#endif\n\n				#ifdef SRGB_TRANSFER\n					gl_FragColor = sRGBTransferOETF( gl_FragColor );\n				#endif\n			}",
		depthTest: !1,
		depthWrite: !1
	}), f = new Yr(u, d), p = new Ca(-1, 1, 1, -1, 0, 1), m = null, h = null, g = !1, _, y = null, b = [], S = !1;
	this.setSize = function(e, t) {
		o.setSize(e, t), s !== null && s.setSize(e, t), c !== null && c.setSize(e, t);
		for (let n = 0; n < b.length; n++) {
			let r = b[n];
			r.setSize && r.setSize(e, t);
		}
	}, this.setEffects = function(e) {
		b = e, S = b.length > 0 && b[0].isRenderPass === !0;
		let t = o.width, n = o.height;
		b.length > 0 && s === null && (s = new Gt(t, n, {
			type: v,
			depthBuffer: !1,
			stencilBuffer: !1
		}), c = new Gt(t, n, {
			type: v,
			depthBuffer: !1,
			stencilBuffer: !1
		}));
		let r = i === !0 && b.some((e) => e.needsDepthTexture === !0);
		r !== (o.depthTexture !== null) && (r === !0 && l === null && (l = new xi(t, n), a === !0 && (l.format = O, l.type = x)), o.dispose(), o.depthTexture = r ? l : null, o.resolveDepthBuffer = r, o.storeMultisampledDepthBuffer = r);
		for (let e = 0; e < b.length; e++) {
			let i = b[e];
			i.setSize && i.setSize(t, n), r && i.needsDepthTexture === !0 && i.setDepthTexture && i.setDepthTexture(l);
		}
	}, this.begin = function(e, t) {
		if (g || e.toneMapping === 0 && b.length === 0) return !1;
		if (y = t, t !== null) {
			let e = t.width, n = t.height;
			(o.width !== e || o.height !== n) && this.setSize(e, n);
		}
		return S === !1 && e.setRenderTarget(o), _ = e.toneMapping, e.toneMapping = 0, !0;
	}, this.hasRenderPass = function() {
		return S;
	}, this.end = function(e, t) {
		e.toneMapping = _, g = !0;
		let n = o, r = s;
		for (let i = 0; i < b.length; i++) {
			let a = b[i];
			a.enabled !== !1 && (a.render(e, r, n, t), a.needsSwap !== !1 && (n = r, r = r === s ? c : s));
		}
		if (m !== e.outputColorSpace || h !== e.toneMapping) {
			m = e.outputColorSpace, h = e.toneMapping, d.defines = {}, Mt.getTransfer(m) === "srgb" && (d.defines.SRGB_TRANSFER = "");
			let t = No[h];
			t && (d.defines[t] = ""), d.needsUpdate = !0;
		}
		d.uniforms.tDiffuse.value = n.texture, e.setRenderTarget(y), e.render(f, p), y = null, g = !1;
	}, this.isCompositing = function() {
		return g;
	}, this.dispose = function() {
		o.dispose(), s !== null && s.dispose(), c !== null && c.dispose(), u.dispose(), d.dispose();
	};
}
var Fo = /*@__PURE__*/ new Ht(), Io = /*@__PURE__*/ new xi(1, 1), Lo = /*@__PURE__*/ new Si(1), Ro = /*@__PURE__*/ new Kt(), zo = /*@__PURE__*/ new qt(), Bo = /*@__PURE__*/ new yi(), Vo = [], Ho = [], Uo = /* @__PURE__ */ new Float32Array(16), Wo = /* @__PURE__ */ new Float32Array(9), Go = /* @__PURE__ */ new Float32Array(4);
function Ko(e, t, n) {
	let r = e[0];
	if (r <= 0 || r > 0) return e;
	let i = t * n, a = Vo[i];
	if (a === void 0 && (a = new Float32Array(i), Vo[i] = a), t !== 0) {
		r.toArray(a, 0);
		for (let r = 1, i = 0; r !== t; ++r) i += n, e[r].toArray(a, i);
	}
	return a;
}
function qo(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0, r = e.length; n < r; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function Jo(e, t) {
	for (let n = 0, r = t.length; n < r; n++) e[n] = t[n];
}
function Yo(e, t) {
	let n = Ho[t];
	n === void 0 && (n = new Int32Array(t), Ho[t] = n);
	for (let r = 0; r !== t; ++r) n[r] = e.allocateTextureUnit();
	return n;
}
function Xo(e, t) {
	let n = this.cache;
	n[0] !== t && (e.uniform1f(this.addr, t), n[0] = t);
}
function Zo(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y) && (e.uniform2f(this.addr, t.x, t.y), n[0] = t.x, n[1] = t.y);
	else {
		if (qo(n, t)) return;
		e.uniform2fv(this.addr, t), Jo(n, t);
	}
}
function Qo(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z) && (e.uniform3f(this.addr, t.x, t.y, t.z), n[0] = t.x, n[1] = t.y, n[2] = t.z);
	else if (t.r !== void 0) (n[0] !== t.r || n[1] !== t.g || n[2] !== t.b) && (e.uniform3f(this.addr, t.r, t.g, t.b), n[0] = t.r, n[1] = t.g, n[2] = t.b);
	else {
		if (qo(n, t)) return;
		e.uniform3fv(this.addr, t), Jo(n, t);
	}
}
function $o(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z || n[3] !== t.w) && (e.uniform4f(this.addr, t.x, t.y, t.z, t.w), n[0] = t.x, n[1] = t.y, n[2] = t.z, n[3] = t.w);
	else {
		if (qo(n, t)) return;
		e.uniform4fv(this.addr, t), Jo(n, t);
	}
}
function es(e, t) {
	let n = this.cache, r = t.elements;
	if (r === void 0) {
		if (qo(n, t)) return;
		e.uniformMatrix2fv(this.addr, !1, t), Jo(n, t);
	} else {
		if (qo(n, r)) return;
		Go.set(r), e.uniformMatrix2fv(this.addr, !1, Go), Jo(n, r);
	}
}
function ts(e, t) {
	let n = this.cache, r = t.elements;
	if (r === void 0) {
		if (qo(n, t)) return;
		e.uniformMatrix3fv(this.addr, !1, t), Jo(n, t);
	} else {
		if (qo(n, r)) return;
		Wo.set(r), e.uniformMatrix3fv(this.addr, !1, Wo), Jo(n, r);
	}
}
function ns(e, t) {
	let n = this.cache, r = t.elements;
	if (r === void 0) {
		if (qo(n, t)) return;
		e.uniformMatrix4fv(this.addr, !1, t), Jo(n, t);
	} else {
		if (qo(n, r)) return;
		Uo.set(r), e.uniformMatrix4fv(this.addr, !1, Uo), Jo(n, r);
	}
}
function rs(e, t) {
	let n = this.cache;
	n[0] !== t && (e.uniform1i(this.addr, t), n[0] = t);
}
function is(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y) && (e.uniform2i(this.addr, t.x, t.y), n[0] = t.x, n[1] = t.y);
	else {
		if (qo(n, t)) return;
		e.uniform2iv(this.addr, t), Jo(n, t);
	}
}
function as(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z) && (e.uniform3i(this.addr, t.x, t.y, t.z), n[0] = t.x, n[1] = t.y, n[2] = t.z);
	else {
		if (qo(n, t)) return;
		e.uniform3iv(this.addr, t), Jo(n, t);
	}
}
function os(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z || n[3] !== t.w) && (e.uniform4i(this.addr, t.x, t.y, t.z, t.w), n[0] = t.x, n[1] = t.y, n[2] = t.z, n[3] = t.w);
	else {
		if (qo(n, t)) return;
		e.uniform4iv(this.addr, t), Jo(n, t);
	}
}
function ss(e, t) {
	let n = this.cache;
	n[0] !== t && (e.uniform1ui(this.addr, t), n[0] = t);
}
function cs(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y) && (e.uniform2ui(this.addr, t.x, t.y), n[0] = t.x, n[1] = t.y);
	else {
		if (qo(n, t)) return;
		e.uniform2uiv(this.addr, t), Jo(n, t);
	}
}
function ls(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z) && (e.uniform3ui(this.addr, t.x, t.y, t.z), n[0] = t.x, n[1] = t.y, n[2] = t.z);
	else {
		if (qo(n, t)) return;
		e.uniform3uiv(this.addr, t), Jo(n, t);
	}
}
function us(e, t) {
	let n = this.cache;
	if (t.x !== void 0) (n[0] !== t.x || n[1] !== t.y || n[2] !== t.z || n[3] !== t.w) && (e.uniform4ui(this.addr, t.x, t.y, t.z, t.w), n[0] = t.x, n[1] = t.y, n[2] = t.z, n[3] = t.w);
	else {
		if (qo(n, t)) return;
		e.uniform4uiv(this.addr, t), Jo(n, t);
	}
}
function ds(e) {
	return e.version === 0 && (e.compareFunction = 519, e.needsUpdate = !0), e;
}
function fs(e, t, n) {
	let r = this.cache, i = n.allocateTextureUnit();
	r[0] !== i && (e.uniform1i(this.addr, i), r[0] = i);
	let a;
	a = this.type === e.SAMPLER_2D_SHADOW ? ds(Io) : Fo, n.setTexture2D(t || a, i);
}
function ps(e, t, n) {
	let r = this.cache, i = n.allocateTextureUnit();
	r[0] !== i && (e.uniform1i(this.addr, i), r[0] = i), n.setTexture3D(t || zo, i);
}
function ms(e, t, n) {
	let r = this.cache, i = n.allocateTextureUnit();
	r[0] !== i && (e.uniform1i(this.addr, i), r[0] = i);
	let a;
	a = this.type === e.SAMPLER_CUBE_SHADOW ? ds(Lo) : Bo, n.setTextureCube(t || a, i);
}
function hs(e, t, n) {
	let r = this.cache, i = n.allocateTextureUnit();
	r[0] !== i && (e.uniform1i(this.addr, i), r[0] = i), n.setTexture2DArray(t || Ro, i);
}
function gs(e) {
	switch (e) {
		case 5126: return Xo;
		case 35664: return Zo;
		case 35665: return Qo;
		case 35666: return $o;
		case 35674: return es;
		case 35675: return ts;
		case 35676: return ns;
		case 5124:
		case 35670: return rs;
		case 35667:
		case 35671: return is;
		case 35668:
		case 35672: return as;
		case 35669:
		case 35673: return os;
		case 5125: return ss;
		case 36294: return cs;
		case 36295: return ls;
		case 36296: return us;
		case 35678:
		case 36198:
		case 36298:
		case 36306:
		case 35682: return fs;
		case 35679:
		case 36299:
		case 36307: return ps;
		case 35680:
		case 36300:
		case 36308:
		case 36293: return ms;
		case 36289:
		case 36303:
		case 36311:
		case 36292: return hs;
	}
}
function _s(e, t) {
	e.uniform1fv(this.addr, t);
}
function vs(e, t) {
	let n = Ko(t, this.size, 2);
	e.uniform2fv(this.addr, n);
}
function ys(e, t) {
	let n = Ko(t, this.size, 3);
	e.uniform3fv(this.addr, n);
}
function bs(e, t) {
	let n = Ko(t, this.size, 4);
	e.uniform4fv(this.addr, n);
}
function xs(e, t) {
	let n = Ko(t, this.size, 4);
	e.uniformMatrix2fv(this.addr, !1, n);
}
function Ss(e, t) {
	let n = Ko(t, this.size, 9);
	e.uniformMatrix3fv(this.addr, !1, n);
}
function Cs(e, t) {
	let n = Ko(t, this.size, 16);
	e.uniformMatrix4fv(this.addr, !1, n);
}
function ws(e, t) {
	e.uniform1iv(this.addr, t);
}
function Ts(e, t) {
	e.uniform2iv(this.addr, t);
}
function Es(e, t) {
	e.uniform3iv(this.addr, t);
}
function Ds(e, t) {
	e.uniform4iv(this.addr, t);
}
function Os(e, t) {
	e.uniform1uiv(this.addr, t);
}
function ks(e, t) {
	e.uniform2uiv(this.addr, t);
}
function As(e, t) {
	e.uniform3uiv(this.addr, t);
}
function js(e, t) {
	e.uniform4uiv(this.addr, t);
}
function Ms(e, t, n) {
	let r = this.cache, i = t.length, a = Yo(n, i);
	qo(r, a) || (e.uniform1iv(this.addr, a), Jo(r, a));
	let o;
	o = this.type === e.SAMPLER_2D_SHADOW ? ds(Io) : Fo;
	for (let e = 0; e !== i; ++e) n.setTexture2D(t[e] || o, a[e]);
}
function Ns(e, t, n) {
	let r = this.cache, i = t.length, a = Yo(n, i);
	qo(r, a) || (e.uniform1iv(this.addr, a), Jo(r, a));
	for (let e = 0; e !== i; ++e) n.setTexture3D(t[e] || zo, a[e]);
}
function Ps(e, t, n) {
	let r = this.cache, i = t.length, a = Yo(n, i);
	qo(r, a) || (e.uniform1iv(this.addr, a), Jo(r, a));
	let o;
	o = this.type === e.SAMPLER_CUBE_SHADOW ? ds(Lo) : Bo;
	for (let e = 0; e !== i; ++e) n.setTextureCube(t[e] || o, a[e]);
}
function Fs(e, t, n) {
	let r = this.cache, i = t.length, a = Yo(n, i);
	qo(r, a) || (e.uniform1iv(this.addr, a), Jo(r, a));
	for (let e = 0; e !== i; ++e) n.setTexture2DArray(t[e] || Ro, a[e]);
}
function Is(e) {
	switch (e) {
		case 5126: return _s;
		case 35664: return vs;
		case 35665: return ys;
		case 35666: return bs;
		case 35674: return xs;
		case 35675: return Ss;
		case 35676: return Cs;
		case 5124:
		case 35670: return ws;
		case 35667:
		case 35671: return Ts;
		case 35668:
		case 35672: return Es;
		case 35669:
		case 35673: return Ds;
		case 5125: return Os;
		case 36294: return ks;
		case 36295: return As;
		case 36296: return js;
		case 35678:
		case 36198:
		case 36298:
		case 36306:
		case 35682: return Ms;
		case 35679:
		case 36299:
		case 36307: return Ns;
		case 35680:
		case 36300:
		case 36308:
		case 36293: return Ps;
		case 36289:
		case 36303:
		case 36311:
		case 36292: return Fs;
	}
}
var Ls = class {
	constructor(e, t, n) {
		this.id = e, this.addr = n, this.cache = [], this.type = t.type, this.setValue = gs(t.type);
	}
}, Rs = class {
	constructor(e, t, n) {
		this.id = e, this.addr = n, this.cache = [], this.type = t.type, this.size = t.size, this.setValue = Is(t.type);
	}
}, zs = class {
	constructor(e) {
		this.id = e, this.seq = [], this.map = {};
	}
	setValue(e, t, n) {
		let r = this.seq;
		for (let i = 0, a = r.length; i !== a; ++i) {
			let a = r[i];
			a.setValue(e, t[a.id], n);
		}
	}
}, Bs = /(\w+)(\])?(\[|\.)?/g;
function Vs(e, t) {
	e.seq.push(t), e.map[t.id] = t;
}
function Hs(e, t, n) {
	let r = e.name, i = r.length;
	for (Bs.lastIndex = 0;;) {
		let a = Bs.exec(r), o = Bs.lastIndex, s = a[1], c = a[2] === "]", l = a[3];
		if (c && (s |= 0), l === void 0 || l === "[" && o + 2 === i) {
			Vs(n, l === void 0 ? new Ls(s, e, t) : new Rs(s, e, t));
			break;
		}
		{
			let e = n.map[s];
			e === void 0 && (e = new zs(s), Vs(n, e)), n = e;
		}
	}
}
var Us = class {
	constructor(e, t) {
		this.seq = [], this.map = {};
		let n = e.getProgramParameter(t, e.ACTIVE_UNIFORMS);
		for (let r = 0; r < n; ++r) {
			let n = e.getActiveUniform(t, r);
			Hs(n, e.getUniformLocation(t, n.name), this);
		}
		let r = [], i = [];
		for (let t of this.seq) t.type === e.SAMPLER_2D_SHADOW || t.type === e.SAMPLER_CUBE_SHADOW || t.type === e.SAMPLER_2D_ARRAY_SHADOW ? r.push(t) : i.push(t);
		r.length > 0 && (this.seq = r.concat(i));
	}
	setValue(e, t, n, r) {
		let i = this.map[t];
		i !== void 0 && i.setValue(e, n, r);
	}
	setOptional(e, t, n) {
		let r = t[n];
		r !== void 0 && this.setValue(e, n, r);
	}
	static upload(e, t, n, r) {
		for (let i = 0, a = t.length; i !== a; ++i) {
			let a = t[i], o = n[a.id];
			o.needsUpdate !== !1 && a.setValue(e, o.value, r);
		}
	}
	static seqWithValue(e, t) {
		let n = [];
		for (let r = 0, i = e.length; r !== i; ++r) {
			let i = e[r];
			i.id in t && n.push(i);
		}
		return n;
	}
};
function Ws(e, t, n) {
	let r = e.createShader(t);
	return e.shaderSource(r, n), e.compileShader(r), r;
}
var Gs = 37297, Ks = 0;
function qs(e, t) {
	let n = e.split("\n"), r = [], i = Math.max(t - 6, 0), a = Math.min(t + 6, n.length);
	for (let e = i; e < a; e++) {
		let i = e + 1;
		r.push(`${i === t ? ">" : " "} ${i}: ${n[e]}`);
	}
	return r.join("\n");
}
var Js = /*@__PURE__*/ new X();
function Ys(e) {
	Mt._getMatrix(Js, Mt.workingColorSpace, e);
	let t = `mat3( ${Js.elements.map((e) => e.toFixed(4))} )`;
	switch (Mt.getTransfer(e)) {
		case Fe: return [t, "LinearTransferOETF"];
		case Ie: return [t, "sRGBTransferOETF"];
		default: return G("WebGLProgram: Unsupported color space: ", e), [t, "LinearTransferOETF"];
	}
}
function Xs(e, t, n) {
	let r = e.getShaderParameter(t, e.COMPILE_STATUS), i = (e.getShaderInfoLog(t) || "").trim();
	if (r && i === "") return "";
	let a = /ERROR: 0:(\d+)/.exec(i);
	if (a) {
		let r = parseInt(a[1]);
		return n.toUpperCase() + "\n\n" + i + "\n\n" + qs(e.getShaderSource(t), r);
	}
	return i;
}
function Zs(e, t) {
	let n = Ys(t);
	return [
		`vec4 ${e}( vec4 value ) {`,
		`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,
		"}"
	].join("\n");
}
var Qs = {
	1: "Linear",
	2: "Reinhard",
	3: "Cineon",
	4: "ACESFilmic",
	6: "AgX",
	7: "Neutral",
	5: "Custom"
};
function $s(e, t) {
	let n = Qs[t];
	return n === void 0 ? (G("WebGLProgram: Unsupported toneMapping:", t), "vec3 " + e + "( vec3 color ) { return LinearToneMapping( color ); }") : "vec3 " + e + "( vec3 color ) { return " + n + "ToneMapping( color ); }";
}
var ec = /*@__PURE__*/ new Y();
function tc() {
	return Mt.getLuminanceCoefficients(ec), [
		"float luminance( const in vec3 rgb ) {",
		`	const vec3 weights = vec3( ${ec.x.toFixed(4)}, ${ec.y.toFixed(4)}, ${ec.z.toFixed(4)} );`,
		"	return dot( weights, rgb );",
		"}"
	].join("\n");
}
function nc(e) {
	return [e.extensionClipCullDistance ? "#extension GL_ANGLE_clip_cull_distance : require" : "", e.extensionMultiDraw ? "#extension GL_ANGLE_multi_draw : require" : ""].filter(ac).join("\n");
}
function rc(e) {
	let t = [];
	for (let n in e) {
		let r = e[n];
		r !== !1 && t.push("#define " + n + " " + r);
	}
	return t.join("\n");
}
function ic(e, t) {
	let n = {}, r = e.getProgramParameter(t, e.ACTIVE_ATTRIBUTES);
	for (let i = 0; i < r; i++) {
		let r = e.getActiveAttrib(t, i), a = r.name, o = 1;
		r.type === e.FLOAT_MAT2 && (o = 2), r.type === e.FLOAT_MAT3 && (o = 3), r.type === e.FLOAT_MAT4 && (o = 4), n[a] = {
			type: r.type,
			location: e.getAttribLocation(t, a),
			locationSize: o
		};
	}
	return n;
}
function ac(e) {
	return e !== "";
}
function oc(e, t) {
	let n = t.numSpotLightShadows + t.numSpotLightMaps - t.numSpotLightShadowsWithMaps;
	return e.replace(/NUM_SUN_LIGHTS/g, t.numSunLights).replace(/NUM_DIR_LIGHTS/g, t.numDirLights).replace(/NUM_SPOT_LIGHTS/g, t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g, t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g, n).replace(/NUM_RECT_AREA_LIGHTS/g, t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g, t.numPointLights).replace(/NUM_HEMI_LIGHTS/g, t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g, t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g, t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g, t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g, t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g, t.numLightProbeGrids);
}
function sc(e, t) {
	return e.replace(/NUM_CLIPPING_PLANES/g, t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g, t.numClippingPlanes - t.numClipIntersection);
}
var cc = /^[ \t]*#include +<([\w\d./]+)>/gm;
function lc(e) {
	return e.replace(cc, uc);
}
function uc(e, t) {
	let n = Qa[t];
	if (n === void 0) throw Error("THREE.WebGLProgram: Can not resolve #include <" + t + ">");
	return lc(n);
}
var dc = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
function fc(e) {
	return e.replace(dc, pc);
}
function pc(e, t, n, r) {
	let i = "";
	for (let e = parseInt(t); e < parseInt(n); e++) i += r.replace(/\[\s*i\s*\]/g, "[ " + e + " ]").replace(/UNROLLED_LOOP_INDEX/g, e);
	return i;
}
function mc(e) {
	let t = `precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;
	return e.precision === "highp" ? t += "\n#define HIGH_PRECISION" : e.precision === "mediump" ? t += "\n#define MEDIUM_PRECISION" : e.precision === "lowp" && (t += "\n#define LOW_PRECISION"), t;
}
var hc = {
	1: "SHADOWMAP_TYPE_PCF",
	3: "SHADOWMAP_TYPE_VSM"
};
function gc(e) {
	return hc[e.shadowMapType] || "SHADOWMAP_TYPE_BASIC";
}
var _c = { 302: "ENVMAP_MODE_REFRACTION" };
function vc(e) {
	return e.envMap === !1 ? "ENVMAP_MODE_REFLECTION" : _c[e.envMapMode] || "ENVMAP_MODE_REFLECTION";
}
var yc = {
	0: "ENVMAP_BLENDING_MULTIPLY",
	1: "ENVMAP_BLENDING_MIX",
	2: "ENVMAP_BLENDING_ADD"
};
function bc(e) {
	return e.envMap === !1 ? "ENVMAP_BLENDING_NONE" : yc[e.combine] || "ENVMAP_BLENDING_NONE";
}
function xc(e, t, n, r) {
	let i = e.getContext(), a = n.defines, o = n.vertexShader, s = n.fragmentShader, c = gc(n), l = n.envMapPMREM === !0 ? "ENVMAP_TYPE_PMREM" : "ENVMAP_TYPE_CUBE", u = vc(n), d = bc(n), f = nc(n), p = rc(a), m = i.createProgram(), h, g, _ = n.glslVersion ? "#version " + n.glslVersion + "\n" : "";
	n.isRawShaderMaterial ? (h = [
		"#define SHADER_TYPE " + n.shaderType,
		"#define SHADER_NAME " + n.shaderName,
		p
	].filter(ac).join("\n"), h.length > 0 && (h += "\n"), g = [
		"#define SHADER_TYPE " + n.shaderType,
		"#define SHADER_NAME " + n.shaderName,
		p
	].filter(ac).join("\n"), g.length > 0 && (g += "\n")) : (h = [
		mc(n),
		"#define SHADER_TYPE " + n.shaderType,
		"#define SHADER_NAME " + n.shaderName,
		p,
		n.extensionClipCullDistance ? "#define USE_CLIP_DISTANCE" : "",
		n.batching ? "#define USE_BATCHING" : "",
		n.batchingColor ? "#define USE_BATCHING_COLOR" : "",
		n.instancing ? "#define USE_INSTANCING" : "",
		n.instancingColor ? "#define USE_INSTANCING_COLOR" : "",
		n.instancingMorph ? "#define USE_INSTANCING_MORPH" : "",
		n.useFog && n.fog ? "#define USE_FOG" : "",
		n.useFog && n.fogExp2 ? "#define FOG_EXP2" : "",
		n.map ? "#define USE_MAP" : "",
		n.envMap ? "#define USE_ENVMAP" : "",
		n.envMap ? "#define " + u : "",
		n.lightMap ? "#define USE_LIGHTMAP" : "",
		n.aoMap ? "#define USE_AOMAP" : "",
		n.bumpMap ? "#define USE_BUMPMAP" : "",
		n.normalMap ? "#define USE_NORMALMAP" : "",
		n.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
		n.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
		n.displacementMap ? "#define USE_DISPLACEMENTMAP" : "",
		n.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
		n.anisotropy ? "#define USE_ANISOTROPY" : "",
		n.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "",
		n.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
		n.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
		n.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
		n.diffuseRoughnessMap ? "#define USE_DIFFUSE_ROUGHNESSMAP" : "",
		n.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
		n.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
		n.specularMap ? "#define USE_SPECULARMAP" : "",
		n.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
		n.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
		n.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
		n.metalnessMap ? "#define USE_METALNESSMAP" : "",
		n.alphaMap ? "#define USE_ALPHAMAP" : "",
		n.alphaHash ? "#define USE_ALPHAHASH" : "",
		n.transmission ? "#define USE_TRANSMISSION" : "",
		n.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
		n.thicknessMap ? "#define USE_THICKNESSMAP" : "",
		n.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
		n.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
		n.mapUv ? "#define MAP_UV " + n.mapUv : "",
		n.alphaMapUv ? "#define ALPHAMAP_UV " + n.alphaMapUv : "",
		n.lightMapUv ? "#define LIGHTMAP_UV " + n.lightMapUv : "",
		n.aoMapUv ? "#define AOMAP_UV " + n.aoMapUv : "",
		n.emissiveMapUv ? "#define EMISSIVEMAP_UV " + n.emissiveMapUv : "",
		n.bumpMapUv ? "#define BUMPMAP_UV " + n.bumpMapUv : "",
		n.normalMapUv ? "#define NORMALMAP_UV " + n.normalMapUv : "",
		n.displacementMapUv ? "#define DISPLACEMENTMAP_UV " + n.displacementMapUv : "",
		n.metalnessMapUv ? "#define METALNESSMAP_UV " + n.metalnessMapUv : "",
		n.roughnessMapUv ? "#define ROUGHNESSMAP_UV " + n.roughnessMapUv : "",
		n.anisotropyMapUv ? "#define ANISOTROPYMAP_UV " + n.anisotropyMapUv : "",
		n.clearcoatMapUv ? "#define CLEARCOATMAP_UV " + n.clearcoatMapUv : "",
		n.clearcoatNormalMapUv ? "#define CLEARCOAT_NORMALMAP_UV " + n.clearcoatNormalMapUv : "",
		n.clearcoatRoughnessMapUv ? "#define CLEARCOAT_ROUGHNESSMAP_UV " + n.clearcoatRoughnessMapUv : "",
		n.diffuseRoughnessMapUv ? "#define DIFFUSE_ROUGHNESSMAP_UV " + n.diffuseRoughnessMapUv : "",
		n.iridescenceMapUv ? "#define IRIDESCENCEMAP_UV " + n.iridescenceMapUv : "",
		n.iridescenceThicknessMapUv ? "#define IRIDESCENCE_THICKNESSMAP_UV " + n.iridescenceThicknessMapUv : "",
		n.sheenColorMapUv ? "#define SHEEN_COLORMAP_UV " + n.sheenColorMapUv : "",
		n.sheenRoughnessMapUv ? "#define SHEEN_ROUGHNESSMAP_UV " + n.sheenRoughnessMapUv : "",
		n.specularMapUv ? "#define SPECULARMAP_UV " + n.specularMapUv : "",
		n.specularColorMapUv ? "#define SPECULAR_COLORMAP_UV " + n.specularColorMapUv : "",
		n.specularIntensityMapUv ? "#define SPECULAR_INTENSITYMAP_UV " + n.specularIntensityMapUv : "",
		n.transmissionMapUv ? "#define TRANSMISSIONMAP_UV " + n.transmissionMapUv : "",
		n.thicknessMapUv ? "#define THICKNESSMAP_UV " + n.thicknessMapUv : "",
		n.vertexTangents && n.flatShading === !1 ? "#define USE_TANGENT" : "",
		n.vertexNormals ? "#define HAS_NORMAL" : "",
		n.vertexColors ? "#define USE_COLOR" : "",
		n.vertexAlphas ? "#define USE_COLOR_ALPHA" : "",
		n.vertexUv1s ? "#define USE_UV1" : "",
		n.vertexUv2s ? "#define USE_UV2" : "",
		n.vertexUv3s ? "#define USE_UV3" : "",
		n.pointsUvs ? "#define USE_POINTS_UV" : "",
		n.flatShading ? "#define FLAT_SHADED" : "",
		n.skinning ? "#define USE_SKINNING" : "",
		n.morphTargets ? "#define USE_MORPHTARGETS" : "",
		n.morphNormals && n.flatShading === !1 ? "#define USE_MORPHNORMALS" : "",
		n.morphColors ? "#define USE_MORPHCOLORS" : "",
		n.morphTargetsCount > 0 ? "#define MORPHTARGETS_TEXTURE_STRIDE " + n.morphTextureStride : "",
		n.morphTargetsCount > 0 ? "#define MORPHTARGETS_COUNT " + n.morphTargetsCount : "",
		n.doubleSided ? "#define DOUBLE_SIDED" : "",
		n.flipSided ? "#define FLIP_SIDED" : "",
		n.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
		n.shadowMapEnabled ? "#define " + c : "",
		n.sizeAttenuation ? "#define USE_SIZEATTENUATION" : "",
		n.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "",
		n.logarithmicDepthBuffer ? "#define USE_LOGARITHMIC_DEPTH_BUFFER" : "",
		n.reversedDepthBuffer ? "#define USE_REVERSED_DEPTH_BUFFER" : "",
		"uniform mat4 modelMatrix;",
		"uniform mat4 modelViewMatrix;",
		"uniform mat4 projectionMatrix;",
		"uniform mat4 viewMatrix;",
		"uniform mat3 normalMatrix;",
		"uniform vec3 cameraPosition;",
		"uniform bool isOrthographic;",
		"#ifdef USE_INSTANCING",
		"	attribute mat4 instanceMatrix;",
		"#endif",
		"#ifdef USE_INSTANCING_COLOR",
		"	attribute vec3 instanceColor;",
		"#endif",
		"#ifdef USE_INSTANCING_MORPH",
		"	uniform sampler2D morphTexture;",
		"#endif",
		"attribute vec3 position;",
		"attribute vec3 normal;",
		"attribute vec2 uv;",
		"#ifdef USE_UV1",
		"	attribute vec2 uv1;",
		"#endif",
		"#ifdef USE_UV2",
		"	attribute vec2 uv2;",
		"#endif",
		"#ifdef USE_UV3",
		"	attribute vec2 uv3;",
		"#endif",
		"#ifdef USE_TANGENT",
		"	attribute vec4 tangent;",
		"#endif",
		"#if defined( USE_COLOR_ALPHA )",
		"	attribute vec4 color;",
		"#elif defined( USE_COLOR )",
		"	attribute vec3 color;",
		"#endif",
		"#ifdef USE_SKINNING",
		"	attribute vec4 skinIndex;",
		"	attribute vec4 skinWeight;",
		"#endif",
		"\n"
	].filter(ac).join("\n"), g = [
		mc(n),
		"#define SHADER_TYPE " + n.shaderType,
		"#define SHADER_NAME " + n.shaderName,
		p,
		n.useFog && n.fog ? "#define USE_FOG" : "",
		n.useFog && n.fogExp2 ? "#define FOG_EXP2" : "",
		n.alphaToCoverage ? "#define ALPHA_TO_COVERAGE" : "",
		n.map ? "#define USE_MAP" : "",
		n.matcap ? "#define USE_MATCAP" : "",
		n.envMap ? "#define USE_ENVMAP" : "",
		n.envMap ? "#define " + l : "",
		n.envMap ? "#define " + u : "",
		n.envMap ? "#define " + d : "",
		n.envMapPMREM ? "#define ENVMAP_MAX_LOD " + n.envMapMaxLod + ".0" : "",
		n.envMapPMREM ? "#define ENVMAP_SIZE " + n.envMapSize + ".0" : "",
		n.lightMap ? "#define USE_LIGHTMAP" : "",
		n.aoMap ? "#define USE_AOMAP" : "",
		n.bumpMap ? "#define USE_BUMPMAP" : "",
		n.normalMap ? "#define USE_NORMALMAP" : "",
		n.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
		n.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
		n.packedNormalMap ? "#define USE_PACKED_NORMALMAP" : "",
		n.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
		n.anisotropy ? "#define USE_ANISOTROPY" : "",
		n.anisotropyMap ? "#define USE_ANISOTROPYMAP" : "",
		n.clearcoat ? "#define USE_CLEARCOAT" : "",
		n.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
		n.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
		n.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
		n.diffuseRoughness ? "#define USE_DIFFUSE_ROUGHNESS" : "",
		n.diffuseRoughnessMap ? "#define USE_DIFFUSE_ROUGHNESSMAP" : "",
		n.dispersion ? "#define USE_DISPERSION" : "",
		n.retroreflection ? "#define USE_RETROREFLECTION" : "",
		n.iridescence ? "#define USE_IRIDESCENCE" : "",
		n.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
		n.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
		n.specularMap ? "#define USE_SPECULARMAP" : "",
		n.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
		n.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
		n.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
		n.metalnessMap ? "#define USE_METALNESSMAP" : "",
		n.alphaMap ? "#define USE_ALPHAMAP" : "",
		n.alphaTest ? "#define USE_ALPHATEST" : "",
		n.alphaHash ? "#define USE_ALPHAHASH" : "",
		n.sheen ? "#define USE_SHEEN" : "",
		n.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
		n.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
		n.transmission ? "#define USE_TRANSMISSION" : "",
		n.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
		n.thicknessMap ? "#define USE_THICKNESSMAP" : "",
		n.vertexTangents && n.flatShading === !1 ? "#define USE_TANGENT" : "",
		n.vertexColors || n.instancingColor ? "#define USE_COLOR" : "",
		n.vertexAlphas || n.batchingColor ? "#define USE_COLOR_ALPHA" : "",
		n.vertexUv1s ? "#define USE_UV1" : "",
		n.vertexUv2s ? "#define USE_UV2" : "",
		n.vertexUv3s ? "#define USE_UV3" : "",
		n.pointsUvs ? "#define USE_POINTS_UV" : "",
		n.gradientMap ? "#define USE_GRADIENTMAP" : "",
		n.flatShading ? "#define FLAT_SHADED" : "",
		n.doubleSided ? "#define DOUBLE_SIDED" : "",
		n.flipSided ? "#define FLIP_SIDED" : "",
		n.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
		n.shadowMapEnabled ? "#define " + c : "",
		n.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : "",
		n.numLightProbes > 0 ? "#define USE_LIGHT_PROBES" : "",
		n.decodeVideoTexture ? "#define DECODE_VIDEO_TEXTURE" : "",
		n.decodeVideoTextureEmissive ? "#define DECODE_VIDEO_TEXTURE_EMISSIVE" : "",
		n.logarithmicDepthBuffer ? "#define USE_LOGARITHMIC_DEPTH_BUFFER" : "",
		n.reversedDepthBuffer ? "#define USE_REVERSED_DEPTH_BUFFER" : "",
		"uniform mat4 viewMatrix;",
		"uniform vec3 cameraPosition;",
		"uniform bool isOrthographic;",
		n.toneMapping === 0 ? "" : "#define TONE_MAPPING",
		n.toneMapping === 0 ? "" : Qa.tonemapping_pars_fragment,
		n.toneMapping === 0 ? "" : $s("toneMapping", n.toneMapping),
		n.dithering ? "#define DITHERING" : "",
		n.opaque ? "#define OPAQUE" : "",
		Qa.colorspace_pars_fragment,
		Zs("linearToOutputTexel", n.outputColorSpace),
		tc(),
		n.useDepthPacking ? "#define DEPTH_PACKING " + n.depthPacking : "",
		"\n"
	].filter(ac).join("\n")), o = lc(o), o = oc(o, n), o = sc(o, n), s = lc(s), s = oc(s, n), s = sc(s, n), o = fc(o), s = fc(s), n.isRawShaderMaterial !== !0 && (_ = "#version 300 es\n", h = [
		f,
		"#define attribute in",
		"#define varying out",
		"#define texture2D texture"
	].join("\n") + "\n" + h, g = [
		"#define varying in",
		n.glslVersion === "300 es" ? "" : "layout(location = 0) out highp vec4 pc_fragColor;",
		n.glslVersion === "300 es" ? "" : "#define gl_FragColor pc_fragColor",
		"#define gl_FragDepthEXT gl_FragDepth",
		"#define texture2D texture",
		"#define textureCube texture",
		"#define texture2DProj textureProj",
		"#define texture2DLodEXT textureLod",
		"#define texture2DProjLodEXT textureProjLod",
		"#define textureCubeLodEXT textureLod",
		"#define texture2DGradEXT textureGrad",
		"#define texture2DProjGradEXT textureProjGrad",
		"#define textureCubeGradEXT textureGrad"
	].join("\n") + "\n" + g);
	let v = _ + h + o, y = _ + g + s, b = Ws(i, i.VERTEX_SHADER, v), x = Ws(i, i.FRAGMENT_SHADER, y);
	i.attachShader(m, b), i.attachShader(m, x), n.index0AttributeName === void 0 ? n.hasPositionAttribute === !0 && i.bindAttribLocation(m, 0, "position") : i.bindAttribLocation(m, 0, n.index0AttributeName), i.linkProgram(m);
	function S(t) {
		if (e.debug.checkShaderErrors) {
			let n = i.getProgramInfoLog(m) || "", r = i.getShaderInfoLog(b) || "", a = i.getShaderInfoLog(x) || "", o = n.trim(), s = r.trim(), c = a.trim(), l = !0, u = !0;
			if (i.getProgramParameter(m, i.LINK_STATUS) === !1) {
				if (l = !1, typeof e.debug.onShaderError == "function") e.debug.onShaderError(i, m, b, x);
				else {
					let e = Xs(i, b, "vertex"), n = Xs(i, x, "fragment");
					K("WebGLProgram: Shader Error " + i.getError() + " - VALIDATE_STATUS " + i.getProgramParameter(m, i.VALIDATE_STATUS) + "\n\nMaterial Name: " + t.name + "\nMaterial Type: " + t.type + "\n\nProgram Info Log: " + o + "\n" + e + "\n" + n);
				}
			} else o === "" ? (s === "" || c === "") && (u = !1) : G("WebGLProgram: Program Info Log:", o);
			u && (t.diagnostics = {
				runnable: l,
				programLog: o,
				vertexShader: {
					log: s,
					prefix: h
				},
				fragmentShader: {
					log: c,
					prefix: g
				}
			});
		}
		i.deleteShader(b), i.deleteShader(x), C = new Us(i, m), w = ic(i, m);
	}
	let C;
	this.getUniforms = function() {
		return C === void 0 && S(this), C;
	};
	let w;
	this.getAttributes = function() {
		return w === void 0 && S(this), w;
	};
	let T = n.rendererExtensionParallelShaderCompile === !1;
	return this.isReady = function() {
		return T === !1 && (T = i.getProgramParameter(m, Gs)), T;
	}, this.destroy = function() {
		r.releaseStatesOfProgram(this), i.deleteProgram(m), this.program = void 0;
	}, this.type = n.shaderType, this.name = n.shaderName, this.id = Ks++, this.cacheKey = t, this.usedTimes = 1, this.program = m, this.vertexShader = b, this.fragmentShader = x, this;
}
var Sc = 0, Cc = class {
	constructor() {
		this.shaderCache = /* @__PURE__ */ new Map(), this.materialCache = /* @__PURE__ */ new Map();
	}
	update(e, t, n) {
		let r = this._getShaderCacheForMaterial(e);
		return r.has(t) === !1 && (r.add(t), t.usedTimes++), r.has(n) === !1 && (r.add(n), n.usedTimes++), this;
	}
	remove(e) {
		let t = this.materialCache.get(e);
		for (let e of t) e.usedTimes--, e.usedTimes === 0 && this.shaderCache.delete(e.code);
		return this.materialCache.delete(e), this;
	}
	getVertexShaderStage(e) {
		return this._getShaderStage(e.vertexShader);
	}
	getFragmentShaderStage(e) {
		return this._getShaderStage(e.fragmentShader);
	}
	dispose() {
		this.shaderCache.clear(), this.materialCache.clear();
	}
	_getShaderCacheForMaterial(e) {
		let t = this.materialCache, n = t.get(e);
		return n === void 0 && (n = /* @__PURE__ */ new Set(), t.set(e, n)), n;
	}
	_getShaderStage(e) {
		let t = this.shaderCache, n = t.get(e);
		return n === void 0 && (n = new wc(e), t.set(e, n)), n;
	}
}, wc = class {
	constructor(e) {
		this.id = Sc++, this.code = e, this.usedTimes = 0;
	}
};
function Tc(e) {
	return e === 1030 || e === 37490 || e === 36285;
}
function Ec(e, t, n, r, i, a) {
	let o = new on(), s = new Cc(), c = /* @__PURE__ */ new Set(), l = [], u = /* @__PURE__ */ new Map(), d = r.logarithmicDepthBuffer, f = {
		MeshDepthMaterial: "depth",
		MeshDistanceMaterial: "distance",
		MeshNormalMaterial: "normal",
		MeshBasicMaterial: "basic",
		MeshLambertMaterial: "lambert",
		MeshPhongMaterial: "phong",
		MeshToonMaterial: "toon",
		MeshStandardMaterial: "physical",
		MeshPhysicalMaterial: "physical",
		MeshMatcapMaterial: "matcap",
		LineBasicMaterial: "basic",
		LineDashedMaterial: "dashed",
		PointsMaterial: "points",
		ShadowMaterial: "shadow",
		SpriteMaterial: "sprite"
	};
	function p(e) {
		return c.add(e), e === 0 ? "uv" : `uv${e}`;
	}
	function m(i, o, l, u, m, h) {
		let g = u.fog, _ = m.geometry, v = i.isMeshStandardMaterial || i.isMeshLambertMaterial || i.isMeshPhongMaterial ? u.environment : null, y = i.isMeshStandardMaterial || i.isMeshLambertMaterial && !i.envMap || i.isMeshPhongMaterial && !i.envMap, b = t.get(i.envMap || v, y), x = f[i.type], S = r.precision;
		i.precision !== null && (S = r.getMaxPrecision(i.precision), S !== i.precision && G("WebGLProgram.getParameters:", i.precision, "not supported, using", S, "instead."));
		let C = _.morphAttributes.position || _.morphAttributes.normal || _.morphAttributes.color, w = C === void 0 ? 0 : C.length, T = 0;
		_.morphAttributes.position !== void 0 && (T = 1), _.morphAttributes.normal !== void 0 && (T = 2), _.morphAttributes.color !== void 0 && (T = 3);
		let E, D, O, k;
		if (x) {
			let e = $a[x];
			E = e.vertexShader, D = e.fragmentShader;
		} else {
			E = i.vertexShader, D = i.fragmentShader;
			let e = s.getVertexShaderStage(i), t = s.getFragmentShaderStage(i);
			s.update(i, e, t), O = e.id, k = t.id;
		}
		let A = e.getRenderTarget(), j = e.state.buffers.depth.getReversed(), M = m.isInstancedMesh === !0, N = m.isBatchedMesh === !0, P = !!i.map, F = !!i.matcap, I = !!b, L = I && b.isPMREMTexture === !0, R = !!i.aoMap, ee = !!i.lightMap, te = !!i.bumpMap && i.wireframe === !1, z = !!i.normalMap, ne = !!i.displacementMap, re = !!i.emissiveMap, B = !!i.metalnessMap, ie = !!i.roughnessMap, ae = i.anisotropy > 0, oe = i.clearcoat > 0, se = i.diffuseRoughness > 0, ce = i.dispersion > 0, le = i.retroreflectivity > 0, ue = i.iridescence > 0, de = i.sheen > 0, fe = i.transmission > 0, pe = ae && !!i.anisotropyMap, me = oe && !!i.clearcoatMap, he = oe && !!i.clearcoatNormalMap, ge = oe && !!i.clearcoatRoughnessMap, _e = se && !!i.diffuseRoughnessMap, ve = ue && !!i.iridescenceMap, ye = ue && !!i.iridescenceThicknessMap, be = de && !!i.sheenColorMap, xe = de && !!i.sheenRoughnessMap, Se = !!i.specularMap, Ce = !!i.specularColorMap, we = !!i.specularIntensityMap, Te = fe && !!i.transmissionMap, Ee = fe && !!i.thicknessMap, De = !!i.gradientMap, Oe = !!i.alphaMap, V = i.alphaTest > 0, ke = !!i.alphaHash, Ae = !!i.extensions, je = 0;
		i.toneMapped && (A === null || A.isXRRenderTarget === !0) && (je = e.toneMapping);
		let H = L ? b.isCompressedCubeTexture ? b.image[0].mipmaps : b.mipmaps : null, Me = {
			shaderID: x,
			shaderType: i.type,
			shaderName: i.name,
			vertexShader: E,
			fragmentShader: D,
			defines: i.defines,
			customVertexShaderID: O,
			customFragmentShaderID: k,
			isRawShaderMaterial: i.isRawShaderMaterial === !0,
			glslVersion: i.glslVersion,
			precision: S,
			batching: N,
			batchingColor: N && m._colorsTexture !== null,
			instancing: M,
			instancingColor: M && m.instanceColor !== null,
			instancingMorph: M && m.morphTexture !== null,
			outputColorSpace: A === null ? e.outputColorSpace : A.isXRRenderTarget === !0 ? A.texture.colorSpace : Mt.workingColorSpace,
			alphaToCoverage: !!i.alphaToCoverage,
			map: P,
			matcap: F,
			envMap: I,
			envMapMode: I && b.mapping,
			envMapPMREM: L,
			envMapMaxLod: L ? H.length - 1 : null,
			envMapSize: L ? H[0].width : null,
			aoMap: R,
			lightMap: ee,
			bumpMap: te,
			normalMap: z,
			displacementMap: ne,
			emissiveMap: re,
			normalMapObjectSpace: z && i.normalMapType === 1,
			normalMapTangentSpace: z && i.normalMapType === 0,
			packedNormalMap: z && i.normalMapType === 0 && Tc(i.normalMap.format),
			metalnessMap: B,
			roughnessMap: ie,
			anisotropy: ae,
			anisotropyMap: pe,
			clearcoat: oe,
			clearcoatMap: me,
			clearcoatNormalMap: he,
			clearcoatRoughnessMap: ge,
			diffuseRoughness: se,
			diffuseRoughnessMap: _e,
			dispersion: ce,
			retroreflection: le,
			iridescence: ue,
			iridescenceMap: ve,
			iridescenceThicknessMap: ye,
			sheen: de,
			sheenColorMap: be,
			sheenRoughnessMap: xe,
			specularMap: Se,
			specularColorMap: Ce,
			specularIntensityMap: we,
			transmission: fe,
			transmissionMap: Te,
			thicknessMap: Ee,
			gradientMap: De,
			opaque: i.transparent === !1 && i.blending === 1 && i.alphaToCoverage === !1,
			alphaMap: Oe,
			alphaTest: V,
			alphaHash: ke,
			combine: i.combine,
			mapUv: P && p(i.map.channel),
			aoMapUv: R && p(i.aoMap.channel),
			lightMapUv: ee && p(i.lightMap.channel),
			bumpMapUv: te && p(i.bumpMap.channel),
			normalMapUv: z && p(i.normalMap.channel),
			displacementMapUv: ne && p(i.displacementMap.channel),
			emissiveMapUv: re && p(i.emissiveMap.channel),
			metalnessMapUv: B && p(i.metalnessMap.channel),
			roughnessMapUv: ie && p(i.roughnessMap.channel),
			anisotropyMapUv: pe && p(i.anisotropyMap.channel),
			clearcoatMapUv: me && p(i.clearcoatMap.channel),
			clearcoatNormalMapUv: he && p(i.clearcoatNormalMap.channel),
			clearcoatRoughnessMapUv: ge && p(i.clearcoatRoughnessMap.channel),
			diffuseRoughnessMapUv: _e && p(i.diffuseRoughnessMap.channel),
			iridescenceMapUv: ve && p(i.iridescenceMap.channel),
			iridescenceThicknessMapUv: ye && p(i.iridescenceThicknessMap.channel),
			sheenColorMapUv: be && p(i.sheenColorMap.channel),
			sheenRoughnessMapUv: xe && p(i.sheenRoughnessMap.channel),
			specularMapUv: Se && p(i.specularMap.channel),
			specularColorMapUv: Ce && p(i.specularColorMap.channel),
			specularIntensityMapUv: we && p(i.specularIntensityMap.channel),
			transmissionMapUv: Te && p(i.transmissionMap.channel),
			thicknessMapUv: Ee && p(i.thicknessMap.channel),
			alphaMapUv: Oe && p(i.alphaMap.channel),
			vertexTangents: !!_.attributes.tangent && (z || ae),
			vertexNormals: !!_.attributes.normal,
			vertexColors: i.vertexColors,
			vertexAlphas: i.vertexColors === !0 && !!_.attributes.color && _.attributes.color.itemSize === 4,
			pointsUvs: m.isPoints === !0 && !!_.attributes.uv && (P || Oe),
			fog: !!g,
			useFog: i.fog === !0,
			fogExp2: !!g && g.isFogExp2,
			flatShading: i.wireframe === !1 && (i.flatShading === !0 || _.attributes.normal === void 0 && z === !1 && (i.isMeshLambertMaterial || i.isMeshPhongMaterial || i.isMeshStandardMaterial || i.isMeshPhysicalMaterial)),
			sizeAttenuation: i.sizeAttenuation === !0,
			logarithmicDepthBuffer: d,
			reversedDepthBuffer: j,
			skinning: m.isSkinnedMesh === !0,
			hasPositionAttribute: _.attributes.position !== void 0,
			morphTargets: _.morphAttributes.position !== void 0,
			morphNormals: _.morphAttributes.normal !== void 0,
			morphColors: _.morphAttributes.color !== void 0,
			morphTargetsCount: w,
			morphTextureStride: T,
			numSunLights: o.sun.length,
			numDirLights: o.directional.length,
			numPointLights: o.point.length,
			numSpotLights: o.spot.length,
			numSpotLightMaps: o.spotLightMap.length,
			numRectAreaLights: o.rectArea.length,
			numHemiLights: o.hemi.length,
			numSunLightShadows: o.sunShadowMap.length,
			numDirLightShadows: o.directionalShadowMap.length,
			numPointLightShadows: o.pointShadowMap.length,
			numSpotLightShadows: o.spotShadowMap.length,
			numSpotLightShadowsWithMaps: o.numSpotLightShadowsWithMaps,
			numLightProbes: o.numLightProbes,
			numLightProbeGrids: h.filter((e) => e.texture !== null).length,
			numClippingPlanes: a.numPlanes,
			numClipIntersection: a.numIntersection,
			dithering: i.dithering,
			shadowMapEnabled: e.shadowMap.enabled && l.length > 0,
			shadowMapType: e.shadowMap.type,
			toneMapping: je,
			decodeVideoTexture: P && i.map.isVideoTexture === !0 && Mt.getTransfer(i.map.colorSpace) === "srgb",
			decodeVideoTextureEmissive: re && i.emissiveMap.isVideoTexture === !0 && Mt.getTransfer(i.emissiveMap.colorSpace) === "srgb",
			premultipliedAlpha: i.premultipliedAlpha,
			doubleSided: i.side === 2,
			flipSided: i.side === 1,
			useDepthPacking: i.depthPacking >= 0,
			depthPacking: i.depthPacking || 0,
			index0AttributeName: i.index0AttributeName,
			extensionClipCullDistance: Ae && i.extensions.clipCullDistance === !0 && n.has("WEBGL_clip_cull_distance"),
			extensionMultiDraw: (Ae && i.extensions.multiDraw === !0 || N) && n.has("WEBGL_multi_draw"),
			rendererExtensionParallelShaderCompile: n.has("KHR_parallel_shader_compile"),
			customProgramCacheKey: i.customProgramCacheKey()
		};
		return Me.vertexUv1s = c.has(1), Me.vertexUv2s = c.has(2), Me.vertexUv3s = c.has(3), c.clear(), Me;
	}
	function h(t) {
		let n = [];
		if (t.shaderID ? n.push(t.shaderID) : (n.push(t.customVertexShaderID), n.push(t.customFragmentShaderID)), t.defines !== void 0) for (let e in t.defines) n.push(e), n.push(t.defines[e]);
		return t.isRawShaderMaterial === !1 && (g(n, t), _(n, t), n.push(e.outputColorSpace)), n.push(t.customProgramCacheKey), n.join();
	}
	function g(e, t) {
		e.push(t.precision), e.push(t.outputColorSpace), e.push(t.envMapMode), e.push(t.envMapPMREM), e.push(t.envMapMaxLod), e.push(t.envMapSize), e.push(t.mapUv), e.push(t.alphaMapUv), e.push(t.lightMapUv), e.push(t.aoMapUv), e.push(t.bumpMapUv), e.push(t.normalMapUv), e.push(t.displacementMapUv), e.push(t.emissiveMapUv), e.push(t.metalnessMapUv), e.push(t.roughnessMapUv), e.push(t.anisotropyMapUv), e.push(t.clearcoatMapUv), e.push(t.clearcoatNormalMapUv), e.push(t.clearcoatRoughnessMapUv), e.push(t.diffuseRoughnessMapUv), e.push(t.iridescenceMapUv), e.push(t.iridescenceThicknessMapUv), e.push(t.sheenColorMapUv), e.push(t.sheenRoughnessMapUv), e.push(t.specularMapUv), e.push(t.specularColorMapUv), e.push(t.specularIntensityMapUv), e.push(t.transmissionMapUv), e.push(t.thicknessMapUv), e.push(t.combine), e.push(t.fogExp2), e.push(t.sizeAttenuation), e.push(t.morphTargetsCount), e.push(t.numSunLights), e.push(t.numDirLights), e.push(t.numPointLights), e.push(t.numSpotLights), e.push(t.numSpotLightMaps), e.push(t.numHemiLights), e.push(t.numRectAreaLights), e.push(t.numSunLightShadows), e.push(t.numDirLightShadows), e.push(t.numPointLightShadows), e.push(t.numSpotLightShadows), e.push(t.numSpotLightShadowsWithMaps), e.push(t.numLightProbes), e.push(t.numLightProbeGrids), e.push(t.shadowMapType), e.push(t.toneMapping), e.push(t.numClippingPlanes), e.push(t.numClipIntersection), e.push(t.depthPacking);
	}
	function _(e, t) {
		o.disableAll(), t.instancing && o.enable(0), t.instancingColor && o.enable(1), t.instancingMorph && o.enable(2), t.matcap && o.enable(3), t.envMap && o.enable(4), t.normalMapObjectSpace && o.enable(5), t.normalMapTangentSpace && o.enable(6), t.clearcoat && o.enable(7), t.iridescence && o.enable(8), t.alphaTest && o.enable(9), t.vertexColors && o.enable(10), t.vertexAlphas && o.enable(11), t.vertexUv1s && o.enable(12), t.vertexUv2s && o.enable(13), t.vertexUv3s && o.enable(14), t.vertexTangents && o.enable(15), t.anisotropy && o.enable(16), t.alphaHash && o.enable(17), t.batching && o.enable(18), t.dispersion && o.enable(19), t.retroreflection && o.enable(24), t.diffuseRoughness && o.enable(25), t.batchingColor && o.enable(20), t.gradientMap && o.enable(21), t.packedNormalMap && o.enable(22), t.vertexNormals && o.enable(23), e.push(o.mask), o.disableAll(), t.fog && o.enable(0), t.useFog && o.enable(1), t.flatShading && o.enable(2), t.logarithmicDepthBuffer && o.enable(3), t.reversedDepthBuffer && o.enable(4), t.skinning && o.enable(5), t.morphTargets && o.enable(6), t.morphNormals && o.enable(7), t.morphColors && o.enable(8), t.premultipliedAlpha && o.enable(9), t.shadowMapEnabled && o.enable(10), t.doubleSided && o.enable(11), t.flipSided && o.enable(12), t.useDepthPacking && o.enable(13), t.dithering && o.enable(14), t.transmission && o.enable(15), t.sheen && o.enable(16), t.opaque && o.enable(17), t.pointsUvs && o.enable(18), t.decodeVideoTexture && o.enable(19), t.decodeVideoTextureEmissive && o.enable(20), t.alphaToCoverage && o.enable(21), t.numLightProbeGrids > 0 && o.enable(22), t.hasPositionAttribute && o.enable(23), e.push(o.mask);
	}
	function v(e) {
		let t = f[e.type], n;
		if (t) {
			let e = $a[t];
			n = Ni.clone(e.uniforms);
		} else n = e.uniforms;
		return n;
	}
	function y(t, n) {
		let r = u.get(n);
		return r === void 0 ? (r = new xc(e, n, t, i), l.push(r), u.set(n, r)) : ++r.usedTimes, r;
	}
	function b(e) {
		if (--e.usedTimes === 0) {
			let t = l.indexOf(e);
			l[t] = l[l.length - 1], l.pop(), u.delete(e.cacheKey), e.destroy();
		}
	}
	function x(e) {
		s.remove(e);
	}
	function S() {
		s.dispose();
	}
	return {
		getParameters: m,
		getProgramCacheKey: h,
		getUniforms: v,
		acquireProgram: y,
		releaseProgram: b,
		releaseShaderCache: x,
		programs: l,
		dispose: S
	};
}
function Dc() {
	let e = /* @__PURE__ */ new WeakMap();
	function t(t) {
		return e.has(t);
	}
	function n(t) {
		let n = e.get(t);
		return n === void 0 && (n = {}, e.set(t, n)), n;
	}
	function r(t) {
		e.delete(t);
	}
	function i(t, n, r) {
		e.get(t)[n] = r;
	}
	function a() {
		e = /* @__PURE__ */ new WeakMap();
	}
	return {
		has: t,
		get: n,
		remove: r,
		update: i,
		dispose: a
	};
}
function Oc(e, t) {
	return e.groupOrder === t.groupOrder ? e.renderOrder === t.renderOrder ? e.material.id === t.material.id ? e.materialVariant === t.materialVariant ? e.z === t.z ? e.id - t.id : e.z - t.z : e.materialVariant - t.materialVariant : e.material.id - t.material.id : e.renderOrder - t.renderOrder : e.groupOrder - t.groupOrder;
}
function kc(e, t) {
	return e.groupOrder === t.groupOrder ? e.renderOrder === t.renderOrder ? e.z === t.z ? e.id - t.id : t.z - e.z : e.renderOrder - t.renderOrder : e.groupOrder - t.groupOrder;
}
function Ac() {
	let e = [], t = 0, n = [], r = [], i = [];
	function a() {
		t = 0, n.length = 0, r.length = 0, i.length = 0;
	}
	function o(e) {
		let t = 0;
		return e.isInstancedMesh && (t += 2), e.isSkinnedMesh && (t += 1), t;
	}
	function s(n, r, i, a, s, c) {
		let l = e[t];
		return l === void 0 ? (l = {
			id: n.id,
			object: n,
			geometry: r,
			material: i,
			materialVariant: o(n),
			groupOrder: a,
			renderOrder: n.renderOrder,
			z: s,
			group: c
		}, e[t] = l) : (l.id = n.id, l.object = n, l.geometry = r, l.material = i, l.materialVariant = o(n), l.groupOrder = a, l.renderOrder = n.renderOrder, l.z = s, l.group = c), t++, l;
	}
	function c(e, t, a, o, c, l, u) {
		u.reversedDepth === !0 && (c = -c);
		let d = s(e, t, a, o, c, l);
		a.transmission > 0 ? r.push(d) : a.transparent === !0 ? i.push(d) : n.push(d);
	}
	function l(e, t, a, o, c, l) {
		let u = s(e, t, a, o, c, l);
		a.transmission > 0 ? r.unshift(u) : a.transparent === !0 ? i.unshift(u) : n.unshift(u);
	}
	function u(e, t) {
		n.length > 1 && n.sort(e || Oc), r.length > 1 && r.sort(t || kc), i.length > 1 && i.sort(t || kc);
	}
	function d() {
		for (let n = t, r = e.length; n < r; n++) {
			let t = e[n];
			if (t.id === null) break;
			t.id = null, t.object = null, t.geometry = null, t.material = null, t.group = null;
		}
	}
	return {
		opaque: n,
		transmissive: r,
		transparent: i,
		init: a,
		push: c,
		unshift: l,
		finish: d,
		sort: u
	};
}
function jc() {
	let e = /* @__PURE__ */ new WeakMap();
	function t(t, n) {
		let r = e.get(t), i;
		return r === void 0 ? (i = new Ac(), e.set(t, [i])) : n >= r.length ? (i = new Ac(), r.push(i)) : i = r[n], i;
	}
	function n() {
		e = /* @__PURE__ */ new WeakMap();
	}
	return {
		get: t,
		dispose: n
	};
}
function Mc() {
	let e = {};
	return { get: function(t) {
		if (e[t.id] !== void 0) return e[t.id];
		let n;
		switch (t.type) {
			case "SunLight":
			case "DirectionalLight":
				n = {
					direction: new Y(),
					color: new Z()
				};
				break;
			case "SpotLight":
				n = {
					position: new Y(),
					direction: new Y(),
					color: new Z(),
					distance: 0,
					coneCos: 0,
					penumbraCos: 0,
					decay: 0
				};
				break;
			case "PointLight":
				n = {
					position: new Y(),
					color: new Z(),
					distance: 0,
					decay: 0
				};
				break;
			case "HemisphereLight":
				n = {
					direction: new Y(),
					skyColor: new Z(),
					groundColor: new Z()
				};
				break;
			case "RectAreaLight": n = {
				color: new Z(),
				position: new Y(),
				halfWidth: new Y(),
				halfHeight: new Y()
			};
		}
		return e[t.id] = n, n;
	} };
}
function Nc() {
	let e = {};
	return { get: function(t) {
		if (e[t.id] !== void 0) return e[t.id];
		let n;
		switch (t.type) {
			case "SunLight":
			case "DirectionalLight":
				n = {
					shadowIntensity: 1,
					shadowBias: 0,
					shadowNormalBias: 0,
					shadowRadius: 1,
					shadowMapSize: new J()
				};
				break;
			case "SpotLight":
				n = {
					shadowIntensity: 1,
					shadowBias: 0,
					shadowNormalBias: 0,
					shadowRadius: 1,
					shadowMapSize: new J()
				};
				break;
			case "PointLight": n = {
				shadowIntensity: 1,
				shadowBias: 0,
				shadowNormalBias: 0,
				shadowRadius: 1,
				shadowMapSize: new J(),
				shadowCameraNear: 1,
				shadowCameraFar: 1e3
			};
		}
		return e[t.id] = n, n;
	} };
}
var Pc = 0;
function Fc(e, t) {
	return (t.castShadow ? 2 : 0) - (e.castShadow ? 2 : 0) + +!!t.map - !!e.map;
}
function Ic(e) {
	let t = new Mc(), n = Nc(), r = {
		version: 0,
		hash: {
			sunLength: -1,
			directionalLength: -1,
			pointLength: -1,
			spotLength: -1,
			rectAreaLength: -1,
			hemiLength: -1,
			numSunShadows: -1,
			numDirectionalShadows: -1,
			numPointShadows: -1,
			numSpotShadows: -1,
			numSpotMaps: -1,
			numLightProbes: -1
		},
		ambient: [
			0,
			0,
			0
		],
		probe: [],
		sun: [],
		sunShadow: [],
		sunShadowMap: [],
		sunShadowMatrix: [],
		sunShadowCascade: [],
		directional: [],
		directionalShadow: [],
		directionalShadowMap: [],
		directionalShadowMatrix: [],
		spot: [],
		spotLightMap: [],
		spotShadow: [],
		spotShadowMap: [],
		spotLightMatrix: [],
		rectArea: [],
		rectAreaLTC1: null,
		rectAreaLTC2: null,
		point: [],
		pointShadow: [],
		pointShadowMap: [],
		pointShadowMatrix: [],
		hemi: [],
		numSpotLightShadowsWithMaps: 0,
		numLightProbes: 0
	};
	for (let e = 0; e < 9; e++) r.probe.push(new Y());
	let i = new Y(), a = new Jt(), o = new Jt();
	function s(i) {
		let a = 0, o = 0, s = 0;
		for (let e = 0; e < 9; e++) r.probe[e].set(0, 0, 0);
		let c = 0, l = 0, u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = 0, b = 0, x = 0;
		i.sort(Fc);
		for (let e = 0, S = i.length; e < S; e++) {
			let S = i[e], C = S.color, w = S.intensity, T = S.distance, E = null;
			if (S.shadow && S.shadow.map && (E = S.shadow.map.texture.format === 1030 ? S.shadow.map.texture : S.shadow.map.depthTexture || S.shadow.map.texture), S.isAmbientLight) a += C.r * w, o += C.g * w, s += C.b * w;
			else if (S.isLightProbe) {
				for (let e = 0; e < 9; e++) r.probe[e].addScaledVector(S.sh.coefficients[e], w);
				x++;
			} else if (S.isSunLight) {
				let e = t.get(S);
				if (e.color.copy(S.color).multiplyScalar(S.intensity), S.castShadow) {
					let e = S.shadow, t = n.get(S);
					t.shadowIntensity = e.intensity, t.shadowBias = e.bias, t.shadowNormalBias = e.normalBias, t.shadowRadius = e.radius, t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()), r.sunShadow[l] = t, r.sunShadowMap[l] = E;
					let i = e.getViewportCount();
					for (let t = 0; t < i; t++) r.sunShadowMatrix[u + t] = e.getMatrix(t), r.sunShadowCascade[u + t] = e._cascadeData[t];
					u += i, l++;
				}
				r.sun[c] = e, c++;
			} else if (S.isDirectionalLight) {
				let e = t.get(S);
				if (e.color.copy(S.color).multiplyScalar(S.intensity), S.castShadow) {
					let e = S.shadow, t = n.get(S);
					t.shadowIntensity = e.intensity, t.shadowBias = e.bias, t.shadowNormalBias = e.normalBias, t.shadowRadius = e.radius, t.shadowMapSize = e.mapSize, r.directionalShadow[d] = t, r.directionalShadowMap[d] = E, r.directionalShadowMatrix[d] = S.shadow.matrix, g++;
				}
				r.directional[d] = e, d++;
			} else if (S.isSpotLight) {
				let e = t.get(S);
				e.position.setFromMatrixPosition(S.matrixWorld), e.color.copy(C).multiplyScalar(w), e.distance = T, e.coneCos = Math.cos(S.angle), e.penumbraCos = Math.cos(S.angle * (1 - S.penumbra)), e.decay = S.decay, r.spot[p] = e;
				let i = S.shadow;
				if (S.map && (r.spotLightMap[y] = S.map, y++, i.updateMatrices(S), S.castShadow && b++), r.spotLightMatrix[p] = i.matrix, S.castShadow) {
					let e = n.get(S);
					e.shadowIntensity = i.intensity, e.shadowBias = i.bias, e.shadowNormalBias = i.normalBias, e.shadowRadius = i.radius, e.shadowMapSize = i.mapSize, r.spotShadow[p] = e, r.spotShadowMap[p] = E, v++;
				}
				p++;
			} else if (S.isRectAreaLight) {
				let e = t.get(S);
				e.color.copy(C).multiplyScalar(w), e.halfWidth.set(S.width * .5, 0, 0), e.halfHeight.set(0, S.height * .5, 0), r.rectArea[m] = e, m++;
			} else if (S.isPointLight) {
				let e = t.get(S);
				if (e.color.copy(S.color).multiplyScalar(S.intensity), e.distance = S.distance, e.decay = S.decay, S.castShadow) {
					let e = S.shadow, t = n.get(S);
					t.shadowIntensity = e.intensity, t.shadowBias = e.bias, t.shadowNormalBias = e.normalBias, t.shadowRadius = e.radius, t.shadowMapSize = e.mapSize, t.shadowCameraNear = e.camera.near, t.shadowCameraFar = e.camera.far, r.pointShadow[f] = t, r.pointShadowMap[f] = E, r.pointShadowMatrix[f] = S.shadow.matrix, _++;
				}
				r.point[f] = e, f++;
			} else if (S.isHemisphereLight) {
				let e = t.get(S);
				e.skyColor.copy(S.color).multiplyScalar(w), e.groundColor.copy(S.groundColor).multiplyScalar(w), r.hemi[h] = e, h++;
			}
		}
		m > 0 && (e.has("OES_texture_float_linear") === !0 ? (r.rectAreaLTC1 = Q.LTC_FLOAT_1, r.rectAreaLTC2 = Q.LTC_FLOAT_2) : (r.rectAreaLTC1 = Q.LTC_HALF_1, r.rectAreaLTC2 = Q.LTC_HALF_2)), r.ambient[0] = a, r.ambient[1] = o, r.ambient[2] = s;
		let S = r.hash;
		(S.sunLength !== c || S.directionalLength !== d || S.pointLength !== f || S.spotLength !== p || S.rectAreaLength !== m || S.hemiLength !== h || S.numSunShadows !== l || S.numDirectionalShadows !== g || S.numPointShadows !== _ || S.numSpotShadows !== v || S.numSpotMaps !== y || S.numLightProbes !== x) && (r.sun.length = c, r.directional.length = d, r.spot.length = p, r.rectArea.length = m, r.point.length = f, r.hemi.length = h, r.sunShadow.length = l, r.sunShadowMap.length = l, r.sunShadowMatrix.length = u, r.sunShadowCascade.length = u, r.directionalShadow.length = g, r.directionalShadowMap.length = g, r.directionalShadowMatrix.length = g, r.pointShadow.length = _, r.pointShadowMap.length = _, r.pointShadowMatrix.length = _, r.spotShadow.length = v, r.spotShadowMap.length = v, r.spotLightMatrix.length = v + y - b, r.spotLightMap.length = y, r.numSpotLightShadowsWithMaps = b, r.numLightProbes = x, S.sunLength = c, S.directionalLength = d, S.pointLength = f, S.spotLength = p, S.rectAreaLength = m, S.hemiLength = h, S.numSunShadows = l, S.numDirectionalShadows = g, S.numPointShadows = _, S.numSpotShadows = v, S.numSpotMaps = y, S.numLightProbes = x, r.version = Pc++);
	}
	function c(e, t) {
		let n = 0, s = 0, c = 0, l = 0, u = 0, d = 0, f = t.matrixWorldInverse;
		for (let t = 0, p = e.length; t < p; t++) {
			let p = e[t];
			if (p.isSunLight) {
				let e = r.sun[n];
				e.direction.setFromMatrixPosition(p.matrixWorld), e.direction.transformDirection(f), n++;
			} else if (p.isDirectionalLight) {
				let e = r.directional[s];
				e.direction.setFromMatrixPosition(p.matrixWorld), i.setFromMatrixPosition(p.target.matrixWorld), e.direction.sub(i), e.direction.transformDirection(f), s++;
			} else if (p.isSpotLight) {
				let e = r.spot[l];
				e.position.setFromMatrixPosition(p.matrixWorld), e.position.applyMatrix4(f), e.direction.setFromMatrixPosition(p.matrixWorld), i.setFromMatrixPosition(p.target.matrixWorld), e.direction.sub(i), e.direction.transformDirection(f), l++;
			} else if (p.isRectAreaLight) {
				let e = r.rectArea[u];
				e.position.setFromMatrixPosition(p.matrixWorld), e.position.applyMatrix4(f), o.identity(), a.copy(p.matrixWorld), a.premultiply(f), o.extractRotation(a), e.halfWidth.set(p.width * .5, 0, 0), e.halfHeight.set(0, p.height * .5, 0), e.halfWidth.applyMatrix4(o), e.halfHeight.applyMatrix4(o), u++;
			} else if (p.isPointLight) {
				let e = r.point[c];
				e.position.setFromMatrixPosition(p.matrixWorld), e.position.applyMatrix4(f), c++;
			} else if (p.isHemisphereLight) {
				let e = r.hemi[d];
				e.direction.setFromMatrixPosition(p.matrixWorld), e.direction.transformDirection(f), d++;
			}
		}
	}
	return {
		setup: s,
		setupView: c,
		state: r
	};
}
function Lc(e) {
	let t = new Ic(e), n = [], r = [], i = [];
	function a(e) {
		u.camera = e, n.length = 0, r.length = 0, i.length = 0;
	}
	function o(e) {
		e.isLightProbeGrid ? i.push(e) : n.push(e);
	}
	function s(e) {
		r.push(e);
	}
	function c() {
		t.setup(n), i.sort((e, t) => e.priority - t.priority || e.id - t.id);
	}
	function l(e) {
		t.setupView(n, e);
	}
	let u = {
		lightsArray: n,
		shadowsArray: r,
		lightProbeGridArray: i,
		camera: null,
		lights: t,
		transmissionRenderTarget: {},
		textureUnits: 0
	};
	return {
		init: a,
		state: u,
		setupLights: c,
		setupLightsView: l,
		pushLight: o,
		pushShadow: s
	};
}
function Rc(e) {
	let t = /* @__PURE__ */ new WeakMap();
	function n(n, r = 0) {
		let i = t.get(n), a;
		return i === void 0 ? (a = new Lc(e), t.set(n, [a])) : r >= i.length ? (a = new Lc(e), i.push(a)) : a = i[r], a;
	}
	function r() {
		t = /* @__PURE__ */ new WeakMap();
	}
	return {
		get: n,
		dispose: r
	};
}
var zc = "void main() {\n	gl_Position = vec4( position, 1.0 );\n}", Bc = "uniform sampler2D shadow_pass;\nuniform vec2 resolution;\nuniform float radius;\nvoid main() {\n	const float samples = float( VSM_SAMPLES );\n	float mean = 0.0;\n	float squared_mean = 0.0;\n	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );\n	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;\n	for ( float i = 0.0; i < samples; i ++ ) {\n		float uvOffset = uvStart + i * uvStride;\n		#ifdef HORIZONTAL_PASS\n			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;\n			mean += distribution.x;\n			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;\n		#else\n			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;\n			mean += depth;\n			squared_mean += depth * depth;\n		#endif\n	}\n	mean = mean / samples;\n	squared_mean = squared_mean / samples;\n	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );\n	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );\n}", Vc = [
	/*@__PURE__*/ new Y(1, 0, 0),
	/*@__PURE__*/ new Y(-1, 0, 0),
	/*@__PURE__*/ new Y(0, 1, 0),
	/*@__PURE__*/ new Y(0, -1, 0),
	/*@__PURE__*/ new Y(0, 0, 1),
	/*@__PURE__*/ new Y(0, 0, -1)
], Hc = [
	/*@__PURE__*/ new Y(0, -1, 0),
	/*@__PURE__*/ new Y(0, -1, 0),
	/*@__PURE__*/ new Y(0, 0, 1),
	/*@__PURE__*/ new Y(0, 0, -1),
	/*@__PURE__*/ new Y(0, -1, 0),
	/*@__PURE__*/ new Y(0, -1, 0)
], Uc = /*@__PURE__*/ new Jt(), Wc = /*@__PURE__*/ new Y(), Gc = /*@__PURE__*/ new Y();
function Kc(e, t, n) {
	let r = new ri(), i = new J(), o = new J(), s = new Ut(), l = new zi(), u = new Bi(), d = {}, f = n.maxTextureSize, p = {
		0: 1,
		1: 0,
		2: 2
	}, m = new Ii({
		defines: { VSM_SAMPLES: 8 },
		uniforms: {
			shadow_pass: { value: null },
			resolution: { value: new J() },
			radius: { value: 4 }
		},
		vertexShader: zc,
		fragmentShader: Bc
	}), h = m.clone();
	h.defines.HORIZONTAL_PASS = 1;
	let y = new Tr();
	y.setAttribute("position", new ur(new Float32Array([
		-1,
		-1,
		.5,
		3,
		-1,
		.5,
		-1,
		3,
		.5
	]), 3));
	let b = new Yr(y, m), x = this;
	this.enabled = !1, this.autoUpdate = !0, this.needsUpdate = !1, this.type = 1;
	let S = this.type;
	this.render = function(t, n, l) {
		if (x.enabled === !1 || x.autoUpdate === !1 && x.needsUpdate === !1 || t.length === 0) return;
		this.type === 2 && (G("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."), this.type = 1);
		let u = e.getRenderTarget(), d = e.getActiveCubeFace(), p = e.getActiveMipmapLevel(), m = e.state;
		m.setBlending(0), m.buffers.depth.getReversed() === !0 ? m.buffers.color.setClear(0, 0, 0, 0) : m.buffers.color.setClear(1, 1, 1, 1), m.buffers.depth.setTest(!0), m.setScissorTest(!1);
		let h = S !== this.type;
		h && n.traverse(function(e) {
			e.material && (Array.isArray(e.material) ? e.material.forEach((e) => e.needsUpdate = !0) : e.material.needsUpdate = !0);
		});
		for (let u = 0, d = t.length; u < d; u++) {
			let d = t[u], p = d.shadow;
			if (p === void 0) {
				G("WebGLShadowMap:", d, "has no shadow.");
				continue;
			}
			if (p.autoUpdate === !1 && p.needsUpdate === !1) continue;
			i.copy(p.mapSize);
			let y = p.getFrameExtents();
			i.multiply(y), o.copy(p.mapSize), (i.x > f || i.y > f) && (i.x > f && (o.x = Math.floor(f / y.x), i.x = o.x * y.x, p.mapSize.x = o.x), i.y > f && (o.y = Math.floor(f / y.y), i.y = o.y * y.y, p.mapSize.y = o.y));
			let b = e.state.buffers.depth.getReversed();
			if (p.camera._reversedDepth = b, p.map === null || h === !0) {
				if (p.map !== null && (p.map.depthTexture !== null && (p.map.depthTexture.dispose(), p.map.depthTexture = null), p.map.dispose()), this.type === 3) {
					if (d.isPointLight) {
						G("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");
						continue;
					}
					p.map = new Gt(i.x, i.y, {
						format: j,
						type: v,
						minFilter: c,
						magFilter: c,
						generateMipmaps: !1
					}), p.map.texture.name = d.name + ".shadowMap", p.map.depthTexture = new xi(i.x, i.y, _), p.map.depthTexture.name = d.name + ".shadowMapDepth", p.map.depthTexture.format = D, p.map.depthTexture.compareFunction = null, p.map.depthTexture.minFilter = a, p.map.depthTexture.magFilter = a;
				} else d.isPointLight ? (p.map = new co(i.x), p.map.depthTexture = new Si(i.x, g)) : (p.map = new Gt(i.x, i.y), p.map.depthTexture = new xi(i.x, i.y, g)), p.map.depthTexture.name = d.name + ".shadowMap", p.map.depthTexture.format = D, this.type === 1 ? (p.map.depthTexture.compareFunction = b ? 518 : 515, p.map.depthTexture.minFilter = c, p.map.depthTexture.magFilter = c) : (p.map.depthTexture.compareFunction = null, p.map.depthTexture.minFilter = a, p.map.depthTexture.magFilter = a);
				p.camera.updateProjectionMatrix();
			}
			p.map.isWebGLCubeRenderTarget !== !0 && (p.map.width !== i.x || p.map.height !== i.y) && p.map.setSize(i.x, i.y);
			let x = p.map.isWebGLCubeRenderTarget ? 6 : p.getViewportCount();
			d.isPointLight !== !0 && p.updateMatrices(d, l);
			let S = p.camera.layers.mask & 4294967294 ? p.camera.layers : l.layers;
			for (let t = 0; t < x; t++) {
				let i = p.getCamera(t);
				if (d.isPointLight) {
					let e = p.camera, n = p.matrix, r = d.distance || e.far;
					r !== e.far && (e.far = r, e.updateProjectionMatrix()), Wc.setFromMatrixPosition(d.matrixWorld), e.position.copy(Wc), Gc.copy(e.position), Gc.add(Vc[t]), e.up.copy(Hc[t]), e.lookAt(Gc), e.updateMatrixWorld(), n.makeTranslation(-Wc.x, -Wc.y, -Wc.z), Uc.multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse), p._frustum.setFromProjectionMatrix(Uc, e.coordinateSystem, e.reversedDepth);
				}
				if (p.map.isWebGLCubeRenderTarget) e.setRenderTarget(p.map, t), e.clear();
				else {
					t === 0 && (e.setRenderTarget(p.map), e.clear());
					let n = p.getViewport(t);
					s.set(o.x * n.x, o.y * n.y, o.x * n.z, o.y * n.w), m.viewport(s);
				}
				r = p.getFrustum(t), T(n, l, i, d, S, this.type);
			}
			p.isPointLightShadow !== !0 && this.type === 3 && C(p, l), p.needsUpdate = !1;
		}
		S = this.type, x.needsUpdate = !1, e.setRenderTarget(u, d, p);
	};
	function C(n, r) {
		let a = t.update(b);
		m.defines.VSM_SAMPLES !== n.blurSamples && (m.defines.VSM_SAMPLES = n.blurSamples, h.defines.VSM_SAMPLES = n.blurSamples, m.needsUpdate = !0, h.needsUpdate = !0), n.mapPass === null ? n.mapPass = new Gt(i.x, i.y, {
			format: j,
			type: v
		}) : (n.mapPass.width !== n.map.width || n.mapPass.height !== n.map.height) && n.mapPass.setSize(n.map.width, n.map.height), m.uniforms.shadow_pass.value = n.map.depthTexture, m.uniforms.resolution.value.set(n.map.width, n.map.height), m.uniforms.radius.value = n.radius, e.setRenderTarget(n.mapPass), e.clear(), e.renderBufferDirect(r, null, a, m, b, null), h.uniforms.shadow_pass.value = n.mapPass.texture, h.uniforms.resolution.value.set(n.map.width, n.map.height), h.uniforms.radius.value = n.radius, e.setRenderTarget(n.map), e.clear(), e.renderBufferDirect(r, null, a, h, b, null);
	}
	function w(t, n, r, i) {
		let a = null, o = r.isPointLight === !0 ? t.customDistanceMaterial : t.customDepthMaterial;
		if (o !== void 0) a = o;
		else if (a = r.isPointLight === !0 ? u : l, e.localClippingEnabled && n.clipShadows === !0 && Array.isArray(n.clippingPlanes) && n.clippingPlanes.length !== 0 || n.displacementMap && n.displacementScale !== 0 || n.alphaMap && n.alphaTest > 0 || n.map && n.alphaTest > 0 || n.alphaToCoverage === !0) {
			let e = a.uuid, t = n.uuid, r = d[e];
			r === void 0 && (r = {}, d[e] = r);
			let i = r[t];
			i === void 0 && (i = a.clone(), r[t] = i, n.addEventListener("dispose", E)), a = i;
		}
		if (a.visible = n.visible, a.wireframe = n.wireframe, i === 3 ? a.side = n.shadowSide === null ? n.side : n.shadowSide : a.side = n.shadowSide === null ? p[n.side] : n.shadowSide, a.alphaMap = n.alphaMap, a.alphaTest = n.alphaToCoverage === !0 ? .5 : n.alphaTest, a.map = n.map, a.clipShadows = n.clipShadows, a.clippingPlanes = n.clippingPlanes, a.clipIntersection = n.clipIntersection, a.displacementMap = n.displacementMap, a.displacementScale = n.displacementScale, a.displacementBias = n.displacementBias, a.wireframeLinewidth = n.wireframeLinewidth, a.linewidth = n.linewidth, r.isPointLight === !0 && a.isMeshDistanceMaterial === !0) {
			let t = e.properties.get(a);
			t.light = r;
		}
		return a;
	}
	function T(n, i, a, o, s, c) {
		if (n.visible === !1) return;
		if (n.layers.test(s) && (n.isMesh || n.isLine || n.isPoints) && (n.castShadow || n.receiveShadow && c === 3) && (!n.frustumCulled || n.intersectsFrustum(r))) {
			n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse, n.matrixWorld);
			let r = t.update(n), s = n.material;
			if (Array.isArray(s)) {
				let t = r.groups;
				for (let l = 0, u = t.length; l < u; l++) {
					let u = t[l], d = s[u.materialIndex];
					if (d && d.visible) {
						let t = w(n, d, o, c);
						n.onBeforeShadow(e, n, i, a, r, t, u), e.renderBufferDirect(a, null, r, t, n, u), n.onAfterShadow(e, n, i, a, r, t, u);
					}
				}
			} else if (s.visible) {
				let t = w(n, s, o, c);
				n.onBeforeShadow(e, n, i, a, r, t, null), e.renderBufferDirect(a, null, r, t, n, null), n.onAfterShadow(e, n, i, a, r, t, null);
			}
		}
		let l = n.children;
		for (let e = 0, t = l.length; e < t; e++) T(l[e], i, a, o, s, c);
	}
	function E(e) {
		e.target.removeEventListener("dispose", E);
		for (let t in d) {
			let n = d[t], r = e.target.uuid;
			r in n && (n[r].dispose(), delete n[r]);
		}
	}
}
function qc(e, t) {
	function n() {
		let t = !1, n = new Ut(), r = null, i = new Ut(0, 0, 0, 0);
		return {
			setMask: function(n) {
				r !== n && !t && (e.colorMask(n, n, n, n), r = n);
			},
			setLocked: function(e) {
				t = e;
			},
			setClear: function(t, r, a, o, s) {
				s === !0 && (t *= o, r *= o, a *= o), n.set(t, r, a, o), i.equals(n) === !1 && (e.clearColor(t, r, a, o), i.copy(n));
			},
			reset: function() {
				t = !1, r = null, i.set(-1, 0, 0, 0);
			}
		};
	}
	function r() {
		let n = !1, r = !1, i = null, a = null, o = null;
		return {
			setReversed: function(e) {
				if (r !== e) {
					let n = t.get("EXT_clip_control");
					e ? n.clipControlEXT(n.LOWER_LEFT_EXT, n.ZERO_TO_ONE_EXT) : n.clipControlEXT(n.LOWER_LEFT_EXT, n.NEGATIVE_ONE_TO_ONE_EXT), r = e;
					let i = o;
					o = null, this.setClear(i);
				}
			},
			getReversed: function() {
				return r;
			},
			setTest: function(t) {
				t ? B(e.DEPTH_TEST) : ie(e.DEPTH_TEST);
			},
			setMask: function(t) {
				i !== t && !n && (e.depthMask(t), i = t);
			},
			setFunc: function(t) {
				if (r && (t = Xe[t]), a !== t) {
					switch (t) {
						case 0:
							e.depthFunc(e.NEVER);
							break;
						case 1:
							e.depthFunc(e.ALWAYS);
							break;
						case 2:
							e.depthFunc(e.LESS);
							break;
						case 3:
							e.depthFunc(e.LEQUAL);
							break;
						case 4:
							e.depthFunc(e.EQUAL);
							break;
						case 5:
							e.depthFunc(e.GEQUAL);
							break;
						case 6:
							e.depthFunc(e.GREATER);
							break;
						case 7:
							e.depthFunc(e.NOTEQUAL);
							break;
						default: e.depthFunc(e.LEQUAL);
					}
					a = t;
				}
			},
			setLocked: function(e) {
				n = e;
			},
			setClear: function(t) {
				o !== t && (o = t, r && (t = 1 - t), e.clearDepth(t));
			},
			reset: function() {
				n = !1, i = null, a = null, o = null, r = !1;
			}
		};
	}
	function i() {
		let t = !1, n = null, r = null, i = null, a = null, o = null, s = null, c = null, l = null;
		return {
			setTest: function(n) {
				t || (n ? B(e.STENCIL_TEST) : ie(e.STENCIL_TEST));
			},
			setMask: function(r) {
				n !== r && !t && (e.stencilMask(r), n = r);
			},
			setFunc: function(t, n, o) {
				(r !== t || i !== n || a !== o) && (e.stencilFunc(t, n, o), r = t, i = n, a = o);
			},
			setOp: function(t, n, r) {
				(o !== t || s !== n || c !== r) && (e.stencilOp(t, n, r), o = t, s = n, c = r);
			},
			setLocked: function(e) {
				t = e;
			},
			setClear: function(t) {
				l !== t && (e.clearStencil(t), l = t);
			},
			reset: function() {
				t = !1, n = null, r = null, i = null, a = null, o = null, s = null, c = null, l = null;
			}
		};
	}
	let a = new n(), o = new r(), s = new i(), c = {}, l = /* @__PURE__ */ new WeakMap(), u = {}, d = {}, f = {}, p = /* @__PURE__ */ new WeakMap(), m = [], h = null, g = !1, _ = null, v = null, y = null, b = null, x = null, S = null, C = null, w = new Z(0, 0, 0), T = 0, E = !1, D = null, O = null, k = null, A = null, j = null, M = e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS), N = !1, P = 0, F = e.getParameter(e.VERSION);
	F.indexOf("WebGL") === -1 ? F.indexOf("OpenGL ES") !== -1 && (P = parseFloat(/^OpenGL ES (\d)/.exec(F)[1]), N = P >= 2) : (P = parseFloat(/^WebGL (\d)/.exec(F)[1]), N = P >= 1);
	let I = null, L = {}, R = e.getParameter(e.SCISSOR_BOX), ee = e.getParameter(e.VIEWPORT), te = new Ut().fromArray(R), z = new Ut().fromArray(ee);
	function ne(t, n, r, i) {
		let a = /* @__PURE__ */ new Uint8Array(4), o = e.createTexture();
		e.bindTexture(t, o), e.texParameteri(t, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(t, e.TEXTURE_MAG_FILTER, e.NEAREST);
		for (let o = 0; o < r; o++) t === e.TEXTURE_3D || t === e.TEXTURE_2D_ARRAY ? e.texImage3D(n, 0, e.RGBA, 1, 1, i, 0, e.RGBA, e.UNSIGNED_BYTE, a) : e.texImage2D(n + o, 0, e.RGBA, 1, 1, 0, e.RGBA, e.UNSIGNED_BYTE, a);
		return o;
	}
	let re = {};
	re[e.TEXTURE_2D] = ne(e.TEXTURE_2D, e.TEXTURE_2D, 1), re[e.TEXTURE_CUBE_MAP] = ne(e.TEXTURE_CUBE_MAP, e.TEXTURE_CUBE_MAP_POSITIVE_X, 6), re[e.TEXTURE_2D_ARRAY] = ne(e.TEXTURE_2D_ARRAY, e.TEXTURE_2D_ARRAY, 1, 1), re[e.TEXTURE_3D] = ne(e.TEXTURE_3D, e.TEXTURE_3D, 1, 1), a.setClear(0, 0, 0, 1), o.setClear(1), s.setClear(0), B(e.DEPTH_TEST), o.setFunc(3), fe(!1), pe(1), B(e.CULL_FACE), ue(0);
	function B(t) {
		u[t] !== !0 && (e.enable(t), u[t] = !0);
	}
	function ie(t) {
		u[t] !== !1 && (e.disable(t), u[t] = !1);
	}
	function ae(t, n) {
		return f[t] !== n && (e.bindFramebuffer(t, n), f[t] = n, t === e.DRAW_FRAMEBUFFER && (f[e.FRAMEBUFFER] = n), t === e.FRAMEBUFFER && (f[e.DRAW_FRAMEBUFFER] = n), !0);
	}
	function oe(t, n) {
		let r = m, i = !1;
		if (t) {
			r = p.get(n), r === void 0 && (r = [], p.set(n, r));
			let a = t.textures;
			if (r.length !== a.length || r[0] !== e.COLOR_ATTACHMENT0) {
				for (let t = 0, n = a.length; t < n; t++) r[t] = e.COLOR_ATTACHMENT0 + t;
				r.length = a.length, i = !0;
			}
		} else r[0] !== e.BACK && (r[0] = e.BACK, i = !0);
		i && e.drawBuffers(r);
	}
	function se(t) {
		return h !== t && (e.useProgram(t), h = t, !0);
	}
	let ce = {
		100: e.FUNC_ADD,
		101: e.FUNC_SUBTRACT,
		102: e.FUNC_REVERSE_SUBTRACT
	};
	ce[103] = e.MIN, ce[104] = e.MAX;
	let le = {
		200: e.ZERO,
		201: e.ONE,
		202: e.SRC_COLOR,
		204: e.SRC_ALPHA,
		210: e.SRC_ALPHA_SATURATE,
		208: e.DST_COLOR,
		206: e.DST_ALPHA,
		203: e.ONE_MINUS_SRC_COLOR,
		205: e.ONE_MINUS_SRC_ALPHA,
		209: e.ONE_MINUS_DST_COLOR,
		207: e.ONE_MINUS_DST_ALPHA,
		211: e.CONSTANT_COLOR,
		212: e.ONE_MINUS_CONSTANT_COLOR,
		213: e.CONSTANT_ALPHA,
		214: e.ONE_MINUS_CONSTANT_ALPHA
	};
	function ue(t, n, r, i, a, o, s, c, l, u) {
		if (t === 0) g === !0 && (ie(e.BLEND), g = !1);
		else if (g === !1 && (B(e.BLEND), g = !0), t !== 5) {
			if (t !== _ || u !== E) {
				if ((v !== 100 || x !== 100) && (e.blendEquation(e.FUNC_ADD), v = 100, x = 100), u) switch (t) {
					case 1:
						e.blendFuncSeparate(e.ONE, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA);
						break;
					case 2:
						e.blendFunc(e.ONE, e.ONE);
						break;
					case 3:
						e.blendFuncSeparate(e.ZERO, e.ONE_MINUS_SRC_COLOR, e.ZERO, e.ONE);
						break;
					case 4:
						e.blendFuncSeparate(e.DST_COLOR, e.ONE_MINUS_SRC_ALPHA, e.ZERO, e.ONE);
						break;
					default: K("WebGLState: Invalid blending: ", t);
				}
				else switch (t) {
					case 1:
						e.blendFuncSeparate(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA);
						break;
					case 2:
						e.blendFuncSeparate(e.SRC_ALPHA, e.ONE, e.ONE, e.ONE);
						break;
					case 3:
						K("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");
						break;
					case 4:
						K("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");
						break;
					default: K("WebGLState: Invalid blending: ", t);
				}
				y = null, b = null, S = null, C = null, w.set(0, 0, 0), T = 0, _ = t, E = u;
			}
		} else a ||= n, o ||= r, s ||= i, (n !== v || a !== x) && (e.blendEquationSeparate(ce[n], ce[a]), v = n, x = a), (r !== y || i !== b || o !== S || s !== C) && (e.blendFuncSeparate(le[r], le[i], le[o], le[s]), y = r, b = i, S = o, C = s), (c.equals(w) === !1 || l !== T) && (e.blendColor(c.r, c.g, c.b, l), w.copy(c), T = l), _ = t, E = !1;
	}
	function de(t, n) {
		t.side === 2 ? ie(e.CULL_FACE) : B(e.CULL_FACE);
		let r = t.side === 1;
		n && (r = !r), fe(r), t.blending === 1 && t.transparent === !1 ? ue(0) : ue(t.blending, t.blendEquation, t.blendSrc, t.blendDst, t.blendEquationAlpha, t.blendSrcAlpha, t.blendDstAlpha, t.blendColor, t.blendAlpha, t.premultipliedAlpha), o.setFunc(t.depthFunc), o.setTest(t.depthTest), o.setMask(t.depthWrite), a.setMask(t.colorWrite);
		let i = t.stencilWrite;
		s.setTest(i), i && (s.setMask(t.stencilWriteMask), s.setFunc(t.stencilFunc, t.stencilRef, t.stencilFuncMask), s.setOp(t.stencilFail, t.stencilZFail, t.stencilZPass)), he(t.polygonOffset, t.polygonOffsetFactor, t.polygonOffsetUnits), t.alphaToCoverage === !0 ? B(e.SAMPLE_ALPHA_TO_COVERAGE) : ie(e.SAMPLE_ALPHA_TO_COVERAGE);
	}
	function fe(t) {
		D !== t && (t ? e.frontFace(e.CW) : e.frontFace(e.CCW), D = t);
	}
	function pe(t) {
		t === 0 ? ie(e.CULL_FACE) : (B(e.CULL_FACE), t !== O && (t === 1 ? e.cullFace(e.BACK) : t === 2 ? e.cullFace(e.FRONT) : e.cullFace(e.FRONT_AND_BACK))), O = t;
	}
	function me(t) {
		t !== k && (N && e.lineWidth(t), k = t);
	}
	function he(t, n, r) {
		t ? (B(e.POLYGON_OFFSET_FILL), (A !== n || j !== r) && (A = n, j = r, o.getReversed() && (n = -n, r = -r), e.polygonOffset(n, r))) : ie(e.POLYGON_OFFSET_FILL);
	}
	function ge(t) {
		t ? B(e.SCISSOR_TEST) : ie(e.SCISSOR_TEST);
	}
	function _e(t) {
		t === void 0 && (t = e.TEXTURE0 + M - 1), I !== t && (e.activeTexture(t), I = t);
	}
	function ve(t, n, r) {
		r === void 0 && (r = I === null ? e.TEXTURE0 + M - 1 : I);
		let i = L[r];
		i === void 0 && (i = {
			type: void 0,
			texture: void 0
		}, L[r] = i), (i.type !== t || i.texture !== n) && (I !== r && (e.activeTexture(r), I = r), e.bindTexture(t, n || re[t]), i.type = t, i.texture = n);
	}
	function ye() {
		let t = L[I];
		t !== void 0 && t.type !== void 0 && (e.bindTexture(t.type, null), t.type = void 0, t.texture = void 0);
	}
	function be() {
		try {
			e.compressedTexImage2D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function xe() {
		try {
			e.compressedTexImage3D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function Se() {
		try {
			e.texSubImage2D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function Ce() {
		try {
			e.texSubImage3D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function we() {
		try {
			e.compressedTexSubImage2D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function Te() {
		try {
			e.compressedTexSubImage3D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function Ee() {
		try {
			e.texStorage2D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function De() {
		try {
			e.texStorage3D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function Oe() {
		try {
			e.texImage2D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function V() {
		try {
			e.texImage3D(...arguments);
		} catch (e) {
			K("WebGLState:", e);
		}
	}
	function ke(t) {
		return d[t] === void 0 ? e.getParameter(t) : d[t];
	}
	function Ae(t, n) {
		d[t] !== n && (e.pixelStorei(t, n), d[t] = n);
	}
	function je(t) {
		te.equals(t) === !1 && (e.scissor(t.x, t.y, t.z, t.w), te.copy(t));
	}
	function H(t) {
		z.equals(t) === !1 && (e.viewport(t.x, t.y, t.z, t.w), z.copy(t));
	}
	function Me(t, n) {
		let r = l.get(n);
		r === void 0 && (r = /* @__PURE__ */ new WeakMap(), l.set(n, r));
		let i = r.get(t);
		i === void 0 && (i = e.getUniformBlockIndex(n, t.name), e.uniformBlockBinding(n, i, i), r.set(t, i));
	}
	function U(t, n, r) {
		let i = l.get(n).get(t);
		c[i] !== r && (e.bindBufferBase(e.UNIFORM_BUFFER, i, r), c[i] = r);
	}
	function W() {
		e.disable(e.BLEND), e.disable(e.CULL_FACE), e.disable(e.DEPTH_TEST), e.disable(e.POLYGON_OFFSET_FILL), e.disable(e.SCISSOR_TEST), e.disable(e.STENCIL_TEST), e.disable(e.SAMPLE_ALPHA_TO_COVERAGE), e.blendEquation(e.FUNC_ADD), e.blendFunc(e.ONE, e.ZERO), e.blendFuncSeparate(e.ONE, e.ZERO, e.ONE, e.ZERO), e.blendColor(0, 0, 0, 0), e.colorMask(!0, !0, !0, !0), e.clearColor(0, 0, 0, 0), e.depthMask(!0), e.depthFunc(e.LESS), o.setReversed(!1), e.clearDepth(1), e.stencilMask(4294967295), e.stencilFunc(e.ALWAYS, 0, 4294967295), e.stencilOp(e.KEEP, e.KEEP, e.KEEP), e.clearStencil(0), e.cullFace(e.BACK), e.frontFace(e.CCW), e.polygonOffset(0, 0), e.activeTexture(e.TEXTURE0), e.bindFramebuffer(e.FRAMEBUFFER, null), e.bindFramebuffer(e.DRAW_FRAMEBUFFER, null), e.bindFramebuffer(e.READ_FRAMEBUFFER, null), e.useProgram(null), e.lineWidth(1), e.scissor(0, 0, e.canvas.width, e.canvas.height), e.viewport(0, 0, e.canvas.width, e.canvas.height), e.pixelStorei(e.PACK_ALIGNMENT, 4), e.pixelStorei(e.UNPACK_ALIGNMENT, 4), e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, !1), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL, e.BROWSER_DEFAULT_WEBGL), e.pixelStorei(e.PACK_ROW_LENGTH, 0), e.pixelStorei(e.PACK_SKIP_PIXELS, 0), e.pixelStorei(e.PACK_SKIP_ROWS, 0), e.pixelStorei(e.UNPACK_ROW_LENGTH, 0), e.pixelStorei(e.UNPACK_IMAGE_HEIGHT, 0), e.pixelStorei(e.UNPACK_SKIP_PIXELS, 0), e.pixelStorei(e.UNPACK_SKIP_ROWS, 0), e.pixelStorei(e.UNPACK_SKIP_IMAGES, 0), u = {}, d = {}, I = null, L = {}, f = {}, c = {}, p = /* @__PURE__ */ new WeakMap(), m = [], h = null, g = !1, _ = null, v = null, y = null, b = null, x = null, S = null, C = null, w = new Z(0, 0, 0), T = 0, E = !1, D = null, O = null, k = null, A = null, j = null, te.set(0, 0, e.canvas.width, e.canvas.height), z.set(0, 0, e.canvas.width, e.canvas.height), a.reset(), o.reset(), s.reset();
	}
	return {
		buffers: {
			color: a,
			depth: o,
			stencil: s
		},
		enable: B,
		disable: ie,
		bindFramebuffer: ae,
		drawBuffers: oe,
		useProgram: se,
		setBlending: ue,
		setMaterial: de,
		setFlipSided: fe,
		setCullFace: pe,
		setLineWidth: me,
		setPolygonOffset: he,
		setScissorTest: ge,
		activeTexture: _e,
		bindTexture: ve,
		unbindTexture: ye,
		compressedTexImage2D: be,
		compressedTexImage3D: xe,
		texImage2D: Oe,
		texImage3D: V,
		pixelStorei: Ae,
		getParameter: ke,
		updateUBOMapping: Me,
		uniformBlockBinding: U,
		texStorage2D: Ee,
		texStorage3D: De,
		texSubImage2D: Se,
		texSubImage3D: Ce,
		compressedTexSubImage2D: we,
		compressedTexSubImage3D: Te,
		scissor: je,
		viewport: H,
		reset: W
	};
}
function Jc(e, t, d, f, p, m, h) {
	let g = t.has("WEBGL_multisampled_render_to_texture") ? t.get("WEBGL_multisampled_render_to_texture") : null, _ = typeof navigator > "u" ? !1 : /OculusBrowser/g.test(navigator.userAgent), v = new J(), y = /* @__PURE__ */ new WeakMap(), b = /* @__PURE__ */ new Set(), x, S = /* @__PURE__ */ new WeakMap(), C = /* @__PURE__ */ new Set(), w = new FinalizationRegistry((e) => C.delete(e)), T = !1;
	try {
		T = typeof OffscreenCanvas < "u" && new OffscreenCanvas(1, 1).getContext("2d") !== null;
	} catch {}
	function E(e, t) {
		return T ? new OffscreenCanvas(e, t) : Ue("canvas");
	}
	function D(e, t, n) {
		let r = 1, i = W(e);
		if ((i.width > n || i.height > n) && (r = n / Math.max(i.width, i.height)), r < 1) {
			if (typeof HTMLImageElement < "u" && e instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap || typeof VideoFrame < "u" && e instanceof VideoFrame) {
				let n = Math.floor(r * i.width), a = Math.floor(r * i.height);
				x === void 0 && (x = E(n, a));
				let o = t ? E(n, a) : x;
				return o.width = n, o.height = a, o.getContext("2d").drawImage(e, 0, 0, n, a), G("WebGLRenderer: Texture has been resized from (" + i.width + "x" + i.height + ") to (" + n + "x" + a + ")."), o;
			}
			return "data" in e && G("WebGLRenderer: Image in DataTexture is too big (" + i.width + "x" + i.height + ")."), e;
		}
		return e;
	}
	function k(e) {
		return e.generateMipmaps;
	}
	function A(t) {
		e.generateMipmap(t);
	}
	function j(t) {
		return t.isWebGLCubeRenderTarget ? e.TEXTURE_CUBE_MAP : t.isWebGL3DRenderTarget ? e.TEXTURE_3D : t.isWebGLArrayRenderTarget || t.isCompressedArrayTexture ? e.TEXTURE_2D_ARRAY : e.TEXTURE_2D;
	}
	function M(n, r, i, a, o, s = !1) {
		if (n !== null) {
			if (e[n] !== void 0) return e[n];
			G("WebGLRenderer: Attempt to use non-existing WebGL internal format '" + n + "'");
		}
		let c;
		a && (c = t.get("EXT_texture_norm16"), c || G("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));
		let l = r;
		if (r === e.RED && (i === e.FLOAT && (l = e.R32F), i === e.HALF_FLOAT && (l = e.R16F), i === e.UNSIGNED_BYTE && (l = e.R8), i === e.UNSIGNED_SHORT && c && (l = c.R16_EXT), i === e.SHORT && c && (l = c.R16_SNORM_EXT)), r === e.RED_INTEGER && (i === e.UNSIGNED_BYTE && (l = e.R8UI), i === e.UNSIGNED_SHORT && (l = e.R16UI), i === e.UNSIGNED_INT && (l = e.R32UI), i === e.BYTE && (l = e.R8I), i === e.SHORT && (l = e.R16I), i === e.INT && (l = e.R32I)), r === e.RG && (i === e.FLOAT && (l = e.RG32F), i === e.HALF_FLOAT && (l = e.RG16F), i === e.UNSIGNED_BYTE && (l = e.RG8), i === e.UNSIGNED_SHORT && c && (l = c.RG16_EXT), i === e.SHORT && c && (l = c.RG16_SNORM_EXT)), r === e.RG_INTEGER && (i === e.UNSIGNED_BYTE && (l = e.RG8UI), i === e.UNSIGNED_SHORT && (l = e.RG16UI), i === e.UNSIGNED_INT && (l = e.RG32UI), i === e.BYTE && (l = e.RG8I), i === e.SHORT && (l = e.RG16I), i === e.INT && (l = e.RG32I)), r === e.RGB_INTEGER && (i === e.UNSIGNED_BYTE && (l = e.RGB8UI), i === e.UNSIGNED_SHORT && (l = e.RGB16UI), i === e.UNSIGNED_INT && (l = e.RGB32UI), i === e.BYTE && (l = e.RGB8I), i === e.SHORT && (l = e.RGB16I), i === e.INT && (l = e.RGB32I)), r === e.RGBA_INTEGER && (i === e.UNSIGNED_BYTE && (l = e.RGBA8UI), i === e.UNSIGNED_SHORT && (l = e.RGBA16UI), i === e.UNSIGNED_INT && (l = e.RGBA32UI), i === e.BYTE && (l = e.RGBA8I), i === e.SHORT && (l = e.RGBA16I), i === e.INT && (l = e.RGBA32I)), r === e.RGB && (i === e.UNSIGNED_SHORT && c && (l = c.RGB16_EXT), i === e.SHORT && c && (l = c.RGB16_SNORM_EXT), i === e.UNSIGNED_INT_5_9_9_9_REV && (l = e.RGB9_E5), i === e.UNSIGNED_INT_10F_11F_11F_REV && (l = e.R11F_G11F_B10F)), r === e.RGBA) {
			let t = s ? Fe : Mt.getTransfer(o);
			i === e.FLOAT && (l = e.RGBA32F), i === e.HALF_FLOAT && (l = e.RGBA16F), i === e.UNSIGNED_BYTE && (l = t === "srgb" ? e.SRGB8_ALPHA8 : e.RGBA8), i === e.UNSIGNED_SHORT && c && (l = c.RGBA16_EXT), i === e.SHORT && c && (l = c.RGBA16_SNORM_EXT), i === e.UNSIGNED_SHORT_4_4_4_4 && (l = e.RGBA4), i === e.UNSIGNED_SHORT_5_5_5_1 && (l = e.RGB5_A1);
		}
		return (l === e.R16F || l === e.R32F || l === e.RG16F || l === e.RG32F || l === e.RGBA16F || l === e.RGBA32F) && t.get("EXT_color_buffer_float"), l;
	}
	function N(t, n) {
		let r;
		return t ? n === null || n === 1014 || n === 1020 ? r = e.DEPTH24_STENCIL8 : n === 1015 ? r = e.DEPTH32F_STENCIL8 : n === 1012 && (r = e.DEPTH24_STENCIL8, G("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")) : n === null || n === 1014 || n === 1020 ? r = e.DEPTH_COMPONENT24 : n === 1015 ? r = e.DEPTH_COMPONENT32F : n === 1012 && (r = e.DEPTH_COMPONENT16), r;
	}
	function P(e, t) {
		return k(e) === !0 || e.isFramebufferTexture && e.minFilter !== 1003 && e.minFilter !== 1006 ? Math.log2(Math.max(t.width, t.height)) + 1 : e.mipmaps.length > 0 ? e.mipmaps.length : e.isCompressedTexture && Array.isArray(e.image) ? t.mipmaps.length : 1;
	}
	function F(e) {
		let t = new WeakRef(e);
		f.get(e).__ref = t, C.add(t), w.register(e, t, t);
	}
	function I(e) {
		let t = f.get(e).__ref;
		t !== void 0 && (C.delete(t), w.unregister(t));
	}
	function L(e) {
		ee(e.target);
	}
	function R(e) {
		te(e.target);
	}
	function ee(e) {
		e.removeEventListener("dispose", L), I(e), ne(e), e.isVideoTexture && y.delete(e), e.isHTMLTexture && b.delete(e);
	}
	function te(e) {
		e.removeEventListener("dispose", R), I(e), B(e);
	}
	function z() {
		for (let e of C) {
			let t = e.deref();
			t !== void 0 && (t.isRenderTarget === !0 ? te(t) : ee(t));
		}
		C.clear(), b.clear();
	}
	function ne(e) {
		let t = f.get(e);
		if (t.__webglInit === void 0) return;
		let n = e.source, r = S.get(n);
		if (r) {
			let i = r[t.__cacheKey];
			i.usedTimes--, i.usedTimes === 0 && re(e), Object.keys(r).length === 0 && S.delete(n);
		}
		f.remove(e);
	}
	function re(t) {
		let n = f.get(t);
		e.deleteTexture(n.__webglTexture);
		let r = t.source, i = S.get(r);
		delete i[n.__cacheKey], h.memory.textures--;
	}
	function B(t) {
		let n = f.get(t);
		n.__depthDisposeCallback && n.__depthDisposeCallback();
		let r = t.depthTexture;
		if (r && r.renderTarget === t && ee(r), t.isWebGLCubeRenderTarget) for (let t = 0; t < 6; t++) {
			if (Array.isArray(n.__webglFramebuffer[t])) for (let r = 0; r < n.__webglFramebuffer[t].length; r++) e.deleteFramebuffer(n.__webglFramebuffer[t][r]);
			else e.deleteFramebuffer(n.__webglFramebuffer[t]);
			n.__webglDepthbuffer && e.deleteRenderbuffer(n.__webglDepthbuffer[t]);
		}
		else {
			if (Array.isArray(n.__webglFramebuffer)) for (let t = 0; t < n.__webglFramebuffer.length; t++) e.deleteFramebuffer(n.__webglFramebuffer[t]);
			else e.deleteFramebuffer(n.__webglFramebuffer);
			if (n.__webglDepthbuffer && e.deleteRenderbuffer(n.__webglDepthbuffer), n.__webglMultisampledFramebuffer && e.deleteFramebuffer(n.__webglMultisampledFramebuffer), n.__webglColorRenderbuffer) for (let t = 0; t < n.__webglColorRenderbuffer.length; t++) n.__webglColorRenderbuffer[t] && e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);
			n.__webglDepthRenderbuffer && e.deleteRenderbuffer(n.__webglDepthRenderbuffer);
		}
		let i = t.textures;
		for (let t = 0, n = i.length; t < n; t++) {
			let n = f.get(i[t]);
			n.__webglTexture && (e.deleteTexture(n.__webglTexture), h.memory.textures--), f.remove(i[t]);
		}
		f.remove(t);
	}
	let ie = 0;
	function ae() {
		ie = 0;
	}
	function oe() {
		return ie;
	}
	function se(e) {
		ie = e;
	}
	function ce() {
		let e = ie;
		return e >= p.maxTextures && G("WebGLTextures: Trying to use " + (e + 1) + " texture units while this GPU supports only " + p.maxTextures), ie += 1, e;
	}
	function le(e) {
		let t = [];
		return t.push(e.wrapS), t.push(e.wrapT), t.push(e.wrapR || 0), t.push(e.magFilter), t.push(e.minFilter), t.push(e.anisotropy), t.push(e.internalFormat), t.push(e.format), t.push(e.type), t.push(e.generateMipmaps), t.push(e.mipmapsAutoUpdate), t.push(e.premultiplyAlpha), t.push(e.flipY), t.push(e.unpackAlignment), t.push(e.colorSpace), t.join();
	}
	function ue(t, n) {
		let r = f.get(t);
		if (t.isVideoTexture && Me(t), t.isRenderTargetTexture === !1 && t.isExternalTexture !== !0 && t.version > 0 && r.__version !== t.version) {
			let e = t.image;
			if (e === null) G("WebGLRenderer: Texture marked for update but no image data found.");
			else if (e.complete === !1) G("WebGLRenderer: Texture marked for update but image is incomplete");
			else {
				xe(r, t, n);
				return;
			}
		} else t.isExternalTexture && (r.__webglTexture = t.sourceTexture ? t.sourceTexture : null);
		d.bindTexture(e.TEXTURE_2D, r.__webglTexture, e.TEXTURE0 + n);
	}
	function de(t, n) {
		let r = f.get(t);
		t.isRenderTargetTexture === !1 && t.version > 0 && r.__version !== t.version ? xe(r, t, n) : (t.isExternalTexture && (r.__webglTexture = t.sourceTexture ? t.sourceTexture : null), d.bindTexture(e.TEXTURE_2D_ARRAY, r.__webglTexture, e.TEXTURE0 + n));
	}
	function fe(t, n) {
		let r = f.get(t);
		t.isRenderTargetTexture === !1 && t.version > 0 && r.__version !== t.version ? xe(r, t, n) : d.bindTexture(e.TEXTURE_3D, r.__webglTexture, e.TEXTURE0 + n);
	}
	function pe(t, n) {
		let r = f.get(t);
		t.version > 0 && r.__version !== t.version ? Se(r, t, n) : d.bindTexture(e.TEXTURE_CUBE_MAP, r.__webglTexture, e.TEXTURE0 + n);
	}
	let me = {
		[n]: e.REPEAT,
		[r]: e.CLAMP_TO_EDGE,
		[i]: e.MIRRORED_REPEAT
	}, he = {
		[a]: e.NEAREST,
		[o]: e.NEAREST_MIPMAP_NEAREST,
		[s]: e.NEAREST_MIPMAP_LINEAR,
		[c]: e.LINEAR,
		[l]: e.LINEAR_MIPMAP_NEAREST,
		[u]: e.LINEAR_MIPMAP_LINEAR
	}, ge = {
		512: e.NEVER,
		519: e.ALWAYS,
		513: e.LESS,
		515: e.LEQUAL,
		514: e.EQUAL,
		518: e.GEQUAL,
		516: e.GREATER,
		517: e.NOTEQUAL
	};
	function _e(n, r) {
		if (r.type === 1015 && t.has("OES_texture_float_linear") === !1 && (r.magFilter === 1006 || r.magFilter === 1007 || r.magFilter === 1005 || r.magFilter === 1008 || r.minFilter === 1006 || r.minFilter === 1007 || r.minFilter === 1005 || r.minFilter === 1008) && G("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."), e.texParameteri(n, e.TEXTURE_WRAP_S, me[r.wrapS]), e.texParameteri(n, e.TEXTURE_WRAP_T, me[r.wrapT]), (n === e.TEXTURE_3D || n === e.TEXTURE_2D_ARRAY) && e.texParameteri(n, e.TEXTURE_WRAP_R, me[r.wrapR]), e.texParameteri(n, e.TEXTURE_MAG_FILTER, he[r.magFilter]), e.texParameteri(n, e.TEXTURE_MIN_FILTER, he[r.minFilter]), r.compareFunction && (e.texParameteri(n, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.texParameteri(n, e.TEXTURE_COMPARE_FUNC, ge[r.compareFunction])), t.has("EXT_texture_filter_anisotropic") === !0) {
			if (r.magFilter === 1003 || r.minFilter !== 1005 && r.minFilter !== 1008 || r.type === 1015 && t.has("OES_texture_float_linear") === !1) return;
			if (r.anisotropy > 1 || f.get(r).__currentAnisotropy) {
				let i = t.get("EXT_texture_filter_anisotropic");
				e.texParameterf(n, i.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(r.anisotropy, p.getMaxAnisotropy())), f.get(r).__currentAnisotropy = r.anisotropy;
			}
		}
	}
	function ve(t, n) {
		let r = !1;
		t.__webglInit === void 0 && (t.__webglInit = !0, n.addEventListener("dispose", L), F(n));
		let i = n.source, a = S.get(i);
		a === void 0 && (a = {}, S.set(i, a));
		let o = le(n);
		if (o !== t.__cacheKey) {
			a[o] === void 0 && (a[o] = {
				texture: e.createTexture(),
				usedTimes: 0
			}, h.memory.textures++, r = !0), a[o].usedTimes++;
			let i = a[t.__cacheKey];
			i !== void 0 && (a[t.__cacheKey].usedTimes--, i.usedTimes === 0 && re(n)), t.__cacheKey = o, t.__webglTexture = a[o].texture;
		}
		return r;
	}
	function ye(e, t, n) {
		return Math.floor(Math.floor(e / n) / t);
	}
	function be(t, n, r, i) {
		let a = t.updateRanges;
		if (a.length === 0) d.texSubImage2D(e.TEXTURE_2D, 0, 0, 0, n.width, n.height, r, i, n.data);
		else {
			a.sort((e, t) => e.start - t.start);
			let o = 0;
			for (let e = 1; e < a.length; e++) {
				let t = a[o], r = a[e], i = t.start + t.count, s = ye(r.start, n.width, 4), c = ye(t.start, n.width, 4);
				r.start <= i + 1 && s === c && ye(r.start + r.count - 1, n.width, 4) === s ? t.count = Math.max(t.count, r.start + r.count - t.start) : (++o, a[o] = r);
			}
			a.length = o + 1;
			let s = d.getParameter(e.UNPACK_ROW_LENGTH), c = d.getParameter(e.UNPACK_SKIP_PIXELS), l = d.getParameter(e.UNPACK_SKIP_ROWS);
			d.pixelStorei(e.UNPACK_ROW_LENGTH, n.width);
			for (let t = 0, o = a.length; t < o; t++) {
				let o = a[t], s = Math.floor(o.start / 4), c = Math.ceil(o.count / 4), l = s % n.width, u = Math.floor(s / n.width), f = c;
				d.pixelStorei(e.UNPACK_SKIP_PIXELS, l), d.pixelStorei(e.UNPACK_SKIP_ROWS, u), d.texSubImage2D(e.TEXTURE_2D, 0, l, u, f, 1, r, i, n.data);
			}
			t.clearUpdateRanges(), d.pixelStorei(e.UNPACK_ROW_LENGTH, s), d.pixelStorei(e.UNPACK_SKIP_PIXELS, c), d.pixelStorei(e.UNPACK_SKIP_ROWS, l);
		}
	}
	function xe(t, n, r) {
		let i = e.TEXTURE_2D;
		(n.isDataArrayTexture || n.isCompressedArrayTexture) && (i = e.TEXTURE_2D_ARRAY), n.isData3DTexture && (i = e.TEXTURE_3D);
		let a = ve(t, n), o = n.source;
		d.bindTexture(i, t.__webglTexture, e.TEXTURE0 + r);
		let s = f.get(o);
		if (o.version !== s.__version || a === !0) {
			if (d.activeTexture(e.TEXTURE0 + r), !(typeof ImageBitmap < "u" && n.image instanceof ImageBitmap)) {
				let t = Mt.getPrimaries(Mt.workingColorSpace), r = n.colorSpace === "" ? null : Mt.getPrimaries(n.colorSpace), i = n.colorSpace === "" || t === r ? e.NONE : e.BROWSER_DEFAULT_WEBGL;
				d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, n.flipY), d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, n.premultiplyAlpha), d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL, i);
			}
			d.pixelStorei(e.UNPACK_ALIGNMENT, n.unpackAlignment);
			let t = D(n.image, !1, p.maxTextureSize);
			t = U(n, t);
			let c = m.convert(n.format, n.colorSpace), l = m.convert(n.type), u = M(n.internalFormat, c, l, n.normalized, n.colorSpace, n.isVideoTexture);
			_e(i, n);
			let f, h = n.mipmaps, g = n.isVideoTexture !== !0, _ = s.__version === void 0 || a === !0, v = o.dataReady, y = P(n, t);
			if (n.isDepthTexture) u = N(n.format === O, n.type), _ && (g ? d.texStorage2D(e.TEXTURE_2D, 1, u, t.width, t.height) : d.texImage2D(e.TEXTURE_2D, 0, u, t.width, t.height, 0, c, l, null));
			else if (n.isDataTexture) {
				if (h.length > 0) {
					g && _ && d.texStorage2D(e.TEXTURE_2D, y, u, h[0].width, h[0].height);
					for (let t = 0, n = h.length; t < n; t++) f = h[t], g ? v && d.texSubImage2D(e.TEXTURE_2D, t, 0, 0, f.width, f.height, c, l, f.data) : d.texImage2D(e.TEXTURE_2D, t, u, f.width, f.height, 0, c, l, f.data);
					n.generateMipmaps = !1;
				} else g ? (_ && d.texStorage2D(e.TEXTURE_2D, y, u, t.width, t.height), v && be(n, t, c, l)) : d.texImage2D(e.TEXTURE_2D, 0, u, t.width, t.height, 0, c, l, t.data);
			} else if (n.isCompressedTexture) {
				if (n.isCompressedArrayTexture) {
					g && _ && d.texStorage3D(e.TEXTURE_2D_ARRAY, y, u, h[0].width, h[0].height, t.depth);
					for (let r = 0, i = h.length; r < i; r++) if (f = h[r], n.format !== 1023) {
						if (c !== null) {
							if (g) {
								if (v) {
									if (n.layerUpdates.size > 0) {
										let t = Ja(f.width, f.height, n.format, n.type);
										for (let i of n.layerUpdates) {
											let n = f.data.subarray(i * t / f.data.BYTES_PER_ELEMENT, (i + 1) * t / f.data.BYTES_PER_ELEMENT);
											d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY, r, 0, 0, i, f.width, f.height, 1, c, n);
										}
									} else d.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY, r, 0, 0, 0, f.width, f.height, t.depth, c, f.data);
								}
							} else d.compressedTexImage3D(e.TEXTURE_2D_ARRAY, r, u, f.width, f.height, t.depth, 0, f.data, 0, 0);
						} else G("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");
					} else g ? v && d.texSubImage3D(e.TEXTURE_2D_ARRAY, r, 0, 0, 0, f.width, f.height, t.depth, c, l, f.data) : d.texImage3D(e.TEXTURE_2D_ARRAY, r, u, f.width, f.height, t.depth, 0, c, l, f.data);
					n.layerUpdates.size > 0 && n.clearLayerUpdates();
				} else {
					g && _ && d.texStorage2D(e.TEXTURE_2D, y, u, h[0].width, h[0].height);
					for (let t = 0, r = h.length; t < r; t++) f = h[t], n.format === 1023 ? g ? v && d.texSubImage2D(e.TEXTURE_2D, t, 0, 0, f.width, f.height, c, l, f.data) : d.texImage2D(e.TEXTURE_2D, t, u, f.width, f.height, 0, c, l, f.data) : c === null ? G("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()") : g ? v && d.compressedTexSubImage2D(e.TEXTURE_2D, t, 0, 0, f.width, f.height, c, f.data) : d.compressedTexImage2D(e.TEXTURE_2D, t, u, f.width, f.height, 0, f.data);
				}
			} else if (n.isDataArrayTexture) {
				if (g) {
					if (_ && d.texStorage3D(e.TEXTURE_2D_ARRAY, y, u, t.width, t.height, t.depth), v) {
						if (n.layerUpdates.size > 0) {
							let r = Ja(t.width, t.height, n.format, n.type);
							for (let i of n.layerUpdates) {
								let n = t.data.subarray(i * r / t.data.BYTES_PER_ELEMENT, (i + 1) * r / t.data.BYTES_PER_ELEMENT);
								d.texSubImage3D(e.TEXTURE_2D_ARRAY, 0, 0, 0, i, t.width, t.height, 1, c, l, n);
							}
							n.clearLayerUpdates();
						} else d.texSubImage3D(e.TEXTURE_2D_ARRAY, 0, 0, 0, 0, t.width, t.height, t.depth, c, l, t.data);
					}
				} else d.texImage3D(e.TEXTURE_2D_ARRAY, 0, u, t.width, t.height, t.depth, 0, c, l, t.data);
			} else if (n.isData3DTexture) g ? (_ && d.texStorage3D(e.TEXTURE_3D, y, u, t.width, t.height, t.depth), v && d.texSubImage3D(e.TEXTURE_3D, 0, 0, 0, 0, t.width, t.height, t.depth, c, l, t.data)) : d.texImage3D(e.TEXTURE_3D, 0, u, t.width, t.height, t.depth, 0, c, l, t.data);
			else if (n.isFramebufferTexture) {
				if (_) {
					if (g) d.texStorage2D(e.TEXTURE_2D, y, u, t.width, t.height);
					else {
						let n = t.width, r = t.height;
						for (let t = 0; t < y; t++) d.texImage2D(e.TEXTURE_2D, t, u, n, r, 0, c, l, null), n >>= 1, r >>= 1;
					}
				}
			} else if (n.isHTMLTexture) {
				if ("texElementImage2D" in e) {
					let r = e.canvas;
					if (r.hasAttribute("layoutsubtree") || r.setAttribute("layoutsubtree", "true"), t.parentNode !== r) {
						r.appendChild(t), b.add(n), r.onpaint = (e) => {
							let t = e.changedElements;
							for (let e of b) t.includes(e.image) && (e.needsUpdate = !0);
						}, r.requestPaint();
						return;
					}
					if (e.texElementImage2D.length === 3) e.texElementImage2D(e.TEXTURE_2D, e.RGBA8, t);
					else {
						let n = e.RGBA, r = e.RGBA, i = e.UNSIGNED_BYTE;
						e.texElementImage2D(e.TEXTURE_2D, 0, n, r, i, t);
					}
					e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
				}
			} else if (h.length > 0) {
				if (g && _) {
					let t = W(h[0]);
					d.texStorage2D(e.TEXTURE_2D, y, u, t.width, t.height);
				}
				for (let t = 0, n = h.length; t < n; t++) f = h[t], g ? v && d.texSubImage2D(e.TEXTURE_2D, t, 0, 0, c, l, f) : d.texImage2D(e.TEXTURE_2D, t, u, c, l, f);
				n.generateMipmaps = !1;
			} else if (g) {
				if (_) {
					let n = W(t);
					d.texStorage2D(e.TEXTURE_2D, y, u, n.width, n.height);
				}
				v && d.texSubImage2D(e.TEXTURE_2D, 0, 0, 0, c, l, t);
			} else d.texImage2D(e.TEXTURE_2D, 0, u, c, l, t);
			k(n) && n.mipmapsAutoUpdate === !0 && A(i), s.__version = o.version, n.onUpdate && n.onUpdate(n);
		}
		t.__version = n.version;
	}
	function Se(t, n, r) {
		if (n.image.length !== 6) return;
		let i = ve(t, n), a = n.source;
		d.bindTexture(e.TEXTURE_CUBE_MAP, t.__webglTexture, e.TEXTURE0 + r);
		let o = f.get(a);
		if (a.version !== o.__version || i === !0) {
			d.activeTexture(e.TEXTURE0 + r);
			let t = Mt.getPrimaries(Mt.workingColorSpace), s = n.colorSpace === "" ? null : Mt.getPrimaries(n.colorSpace), c = n.colorSpace === "" || t === s ? e.NONE : e.BROWSER_DEFAULT_WEBGL;
			d.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, n.flipY), d.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, n.premultiplyAlpha), d.pixelStorei(e.UNPACK_ALIGNMENT, n.unpackAlignment), d.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL, c);
			let l = n.isCompressedTexture || n.image[0].isCompressedTexture, u = n.image[0] && n.image[0].isDataTexture, f = [];
			for (let e = 0; e < 6; e++) !l && !u ? f[e] = D(n.image[e], !0, p.maxCubemapSize) : f[e] = u ? n.image[e].image : n.image[e], f[e] = U(n, f[e]);
			let h = f[0], g = m.convert(n.format, n.colorSpace), _ = m.convert(n.type), v = M(n.internalFormat, g, _, n.normalized, n.colorSpace), y = n.isVideoTexture !== !0, b = o.__version === void 0 || i === !0, x = a.dataReady, S = P(n, h);
			_e(e.TEXTURE_CUBE_MAP, n);
			let C;
			if (n.isDepthTexture) {
				if (v = N(n.format === O, n.type), b) {
					if (y) d.texStorage2D(e.TEXTURE_CUBE_MAP, 1, v, h.width, h.height);
					else for (let t = 0; t < 6; t++) d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, 0, v, h.width, h.height, 0, g, _, null);
				}
			} else if (l) {
				y && b && d.texStorage2D(e.TEXTURE_CUBE_MAP, S, v, h.width, h.height);
				for (let t = 0; t < 6; t++) {
					C = f[t].mipmaps;
					for (let r = 0; r < C.length; r++) {
						let i = C[r];
						n.format === 1023 ? y ? x && d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, r, 0, 0, i.width, i.height, g, _, i.data) : d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, r, v, i.width, i.height, 0, g, _, i.data) : g === null ? G("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()") : y ? x && d.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, r, 0, 0, i.width, i.height, g, i.data) : d.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, r, v, i.width, i.height, 0, i.data);
					}
				}
			} else {
				if (C = n.mipmaps, y && b) {
					C.length > 0 && S++;
					let t = W(f[0]);
					d.texStorage2D(e.TEXTURE_CUBE_MAP, S, v, t.width, t.height);
				}
				for (let t = 0; t < 6; t++) if (u) {
					y ? x && d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, 0, 0, 0, f[t].width, f[t].height, g, _, f[t].data) : d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, 0, v, f[t].width, f[t].height, 0, g, _, f[t].data);
					for (let n = 0; n < C.length; n++) {
						let r = C[n].image[t].image;
						y ? x && d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, n + 1, 0, 0, r.width, r.height, g, _, r.data) : d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, n + 1, v, r.width, r.height, 0, g, _, r.data);
					}
				} else {
					y ? x && d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, 0, 0, 0, g, _, f[t]) : d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, 0, v, g, _, f[t]);
					for (let n = 0; n < C.length; n++) {
						let r = C[n];
						y ? x && d.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, n + 1, 0, 0, g, _, r.image[t]) : d.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X + t, n + 1, v, g, _, r.image[t]);
					}
				}
			}
			k(n) && n.mipmapsAutoUpdate === !0 && A(e.TEXTURE_CUBE_MAP), o.__version = a.version, n.onUpdate && n.onUpdate(n);
		}
		t.__version = n.version;
	}
	function Ce(t, n, r, i, a, o) {
		let s = m.convert(r.format, r.colorSpace), c = m.convert(r.type), l = M(r.internalFormat, s, c, r.normalized, r.colorSpace), u = f.get(n), p = f.get(r);
		if (p.__renderTarget = n, !u.__hasExternalTextures) {
			let t = Math.max(1, n.width >> o), r = Math.max(1, n.height >> o);
			a === e.TEXTURE_3D || a === e.TEXTURE_2D_ARRAY ? d.texImage3D(a, o, l, t, r, n.depth, 0, s, c, null) : d.texImage2D(a, o, l, t, r, 0, s, c, null);
		}
		d.bindFramebuffer(e.FRAMEBUFFER, t), H(n) ? g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER, i, a, p.__webglTexture, 0, je(n)) : (a === e.TEXTURE_2D || a >= e.TEXTURE_CUBE_MAP_POSITIVE_X && a <= e.TEXTURE_CUBE_MAP_NEGATIVE_Z) && e.framebufferTexture2D(e.FRAMEBUFFER, i, a, p.__webglTexture, o), d.bindFramebuffer(e.FRAMEBUFFER, null);
	}
	function we(t, n, r) {
		if (e.bindRenderbuffer(e.RENDERBUFFER, t), n.depthBuffer) {
			let i = n.depthTexture, a = i && i.isDepthTexture ? i.type : null, o = N(n.stencilBuffer, a), s = n.stencilBuffer ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
			H(n) ? g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER, je(n), o, n.width, n.height) : r ? e.renderbufferStorageMultisample(e.RENDERBUFFER, je(n), o, n.width, n.height) : e.renderbufferStorage(e.RENDERBUFFER, o, n.width, n.height), e.framebufferRenderbuffer(e.FRAMEBUFFER, s, e.RENDERBUFFER, t);
		} else {
			let t = n.textures;
			for (let i = 0; i < t.length; i++) {
				let a = t[i], o = m.convert(a.format, a.colorSpace), s = m.convert(a.type), c = M(a.internalFormat, o, s, a.normalized, a.colorSpace);
				H(n) ? g.renderbufferStorageMultisampleEXT(e.RENDERBUFFER, je(n), c, n.width, n.height) : r ? e.renderbufferStorageMultisample(e.RENDERBUFFER, je(n), c, n.width, n.height) : e.renderbufferStorage(e.RENDERBUFFER, c, n.width, n.height);
			}
		}
		e.bindRenderbuffer(e.RENDERBUFFER, null);
	}
	function Te(t, n, r) {
		let i = n.isWebGLCubeRenderTarget === !0;
		if (d.bindFramebuffer(e.FRAMEBUFFER, t), !(n.depthTexture && n.depthTexture.isDepthTexture)) throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");
		let a = f.get(n.depthTexture);
		a.__renderTarget = n;
		let o = i ? n.depthTexture.image[0] : n.depthTexture.image;
		a.__webglTexture && o.width === n.width && o.height === n.height || (o.width = n.width, o.height = n.height, n.depthTexture.needsUpdate = !0), i ? pe(n.depthTexture, 0) : ue(n.depthTexture, 0);
		let s = a.__webglTexture, c = je(n), l = i ? e.TEXTURE_CUBE_MAP_POSITIVE_X + r : e.TEXTURE_2D, u = n.depthTexture.format === 1027 ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
		if (n.depthTexture.format === 1026) H(n) ? g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER, u, l, s, 0, c) : e.framebufferTexture2D(e.FRAMEBUFFER, u, l, s, 0);
		else if (n.depthTexture.format === 1027) H(n) ? g.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER, u, l, s, 0, c) : e.framebufferTexture2D(e.FRAMEBUFFER, u, l, s, 0);
		else throw Error("THREE.WebGLTextures: Unknown depthTexture format.");
	}
	function Ee(t) {
		let n = f.get(t), r = t.isWebGLCubeRenderTarget === !0;
		if (n.__boundDepthTexture !== t.depthTexture) {
			let e = t.depthTexture;
			if (n.__depthDisposeCallback && n.__depthDisposeCallback(), e) {
				let t = () => {
					delete n.__boundDepthTexture, delete n.__depthDisposeCallback, e.removeEventListener("dispose", t);
				};
				e.addEventListener("dispose", t), n.__depthDisposeCallback = t;
			}
			n.__boundDepthTexture = e;
		}
		if (t.depthTexture && !n.__autoAllocateDepthBuffer) {
			if (r) for (let e = 0; e < 6; e++) Te(n.__webglFramebuffer[e], t, e);
			else t.texture.mipmaps.length > 0 ? Te(n.__webglFramebuffer[0], t, 0) : Te(n.__webglFramebuffer, t, 0);
		} else if (r) {
			n.__webglDepthbuffer = [];
			for (let r = 0; r < 6; r++) if (d.bindFramebuffer(e.FRAMEBUFFER, n.__webglFramebuffer[r]), n.__webglDepthbuffer[r] === void 0) n.__webglDepthbuffer[r] = e.createRenderbuffer(), we(n.__webglDepthbuffer[r], t, !1);
			else {
				let i = t.stencilBuffer ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT, a = n.__webglDepthbuffer[r];
				e.bindRenderbuffer(e.RENDERBUFFER, a), e.framebufferRenderbuffer(e.FRAMEBUFFER, i, e.RENDERBUFFER, a);
			}
		} else if (t.texture.mipmaps.length > 0 ? d.bindFramebuffer(e.FRAMEBUFFER, n.__webglFramebuffer[0]) : d.bindFramebuffer(e.FRAMEBUFFER, n.__webglFramebuffer), n.__webglDepthbuffer === void 0) n.__webglDepthbuffer = e.createRenderbuffer(), we(n.__webglDepthbuffer, t, !1);
		else {
			let r = t.stencilBuffer ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT, i = n.__webglDepthbuffer;
			e.bindRenderbuffer(e.RENDERBUFFER, i), e.framebufferRenderbuffer(e.FRAMEBUFFER, r, e.RENDERBUFFER, i);
		}
		d.bindFramebuffer(e.FRAMEBUFFER, null);
	}
	function De(t, n, r) {
		let i = f.get(t);
		n !== void 0 && Ce(i.__webglFramebuffer, t, t.texture, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, 0), r !== void 0 && Ee(t);
	}
	function Oe(t) {
		let n = t.texture, r = f.get(t), i = f.get(n);
		t.addEventListener("dispose", R), F(t);
		let a = t.textures, o = t.isWebGLCubeRenderTarget === !0, s = a.length > 1;
		if (s || (i.__webglTexture === void 0 && (i.__webglTexture = e.createTexture()), i.__version = n.version, h.memory.textures++), o) {
			r.__webglFramebuffer = [];
			for (let t = 0; t < 6; t++) if (n.mipmaps.length > 0) {
				r.__webglFramebuffer[t] = [];
				for (let i = 0; i < n.mipmaps.length; i++) r.__webglFramebuffer[t][i] = e.createFramebuffer();
			} else r.__webglFramebuffer[t] = e.createFramebuffer();
		} else {
			if (n.mipmaps.length > 0) {
				r.__webglFramebuffer = [];
				for (let t = 0; t < n.mipmaps.length; t++) r.__webglFramebuffer[t] = e.createFramebuffer();
			} else r.__webglFramebuffer = e.createFramebuffer();
			if (s) for (let t = 0, n = a.length; t < n; t++) {
				let n = f.get(a[t]);
				n.__webglTexture === void 0 && (n.__webglTexture = e.createTexture(), h.memory.textures++);
			}
			if (t.samples > 0 && H(t) === !1) {
				r.__webglMultisampledFramebuffer = e.createFramebuffer(), r.__webglColorRenderbuffer = [], d.bindFramebuffer(e.FRAMEBUFFER, r.__webglMultisampledFramebuffer);
				for (let n = 0; n < a.length; n++) {
					let i = a[n];
					r.__webglColorRenderbuffer[n] = e.createRenderbuffer(), e.bindRenderbuffer(e.RENDERBUFFER, r.__webglColorRenderbuffer[n]);
					let o = m.convert(i.format, i.colorSpace), s = m.convert(i.type), c = M(i.internalFormat, o, s, i.normalized, i.colorSpace, t.isXRRenderTarget === !0), l = je(t);
					e.renderbufferStorageMultisample(e.RENDERBUFFER, l, c, t.width, t.height), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0 + n, e.RENDERBUFFER, r.__webglColorRenderbuffer[n]);
				}
				e.bindRenderbuffer(e.RENDERBUFFER, null), t.depthBuffer && (r.__webglDepthRenderbuffer = e.createRenderbuffer(), we(r.__webglDepthRenderbuffer, t, !0)), d.bindFramebuffer(e.FRAMEBUFFER, null);
			}
		}
		if (o) {
			d.bindTexture(e.TEXTURE_CUBE_MAP, i.__webglTexture), _e(e.TEXTURE_CUBE_MAP, n);
			for (let i = 0; i < 6; i++) if (n.mipmaps.length > 0) for (let a = 0; a < n.mipmaps.length; a++) Ce(r.__webglFramebuffer[i][a], t, n, e.COLOR_ATTACHMENT0, e.TEXTURE_CUBE_MAP_POSITIVE_X + i, a);
			else Ce(r.__webglFramebuffer[i], t, n, e.COLOR_ATTACHMENT0, e.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0);
			k(n) ? A(e.TEXTURE_CUBE_MAP) : n.mipmaps.length > 0 && e.texParameteri(e.TEXTURE_CUBE_MAP, e.TEXTURE_MAX_LEVEL, n.mipmaps.length - 1), d.unbindTexture();
		} else if (s) {
			for (let n = 0, i = a.length; n < i; n++) {
				let i = a[n], o = f.get(i), s = e.TEXTURE_2D;
				(t.isWebGL3DRenderTarget || t.isWebGLArrayRenderTarget) && (s = t.isWebGL3DRenderTarget ? e.TEXTURE_3D : e.TEXTURE_2D_ARRAY), d.bindTexture(s, o.__webglTexture), _e(s, i), Ce(r.__webglFramebuffer, t, i, e.COLOR_ATTACHMENT0 + n, s, 0), k(i) && A(s);
			}
			d.unbindTexture();
		} else {
			let a = e.TEXTURE_2D;
			if ((t.isWebGL3DRenderTarget || t.isWebGLArrayRenderTarget) && (a = t.isWebGL3DRenderTarget ? e.TEXTURE_3D : e.TEXTURE_2D_ARRAY), d.bindTexture(a, i.__webglTexture), _e(a, n), n.mipmaps.length > 0) for (let i = 0; i < n.mipmaps.length; i++) Ce(r.__webglFramebuffer[i], t, n, e.COLOR_ATTACHMENT0, a, i);
			else Ce(r.__webglFramebuffer, t, n, e.COLOR_ATTACHMENT0, a, 0);
			k(n) ? A(a) : n.mipmaps.length > 0 && e.texParameteri(a, e.TEXTURE_MAX_LEVEL, n.mipmaps.length - 1), d.unbindTexture();
		}
		t.depthBuffer && Ee(t);
	}
	function V(e) {
		let t = e.textures;
		for (let n = 0, r = t.length; n < r; n++) {
			let r = t[n];
			if (k(r) && r.mipmapsAutoUpdate === !0) {
				let t = j(e), n = f.get(r).__webglTexture;
				d.bindTexture(t, n), A(t), d.unbindTexture();
			}
		}
	}
	let ke = [];
	function Ae(t) {
		if (t.samples > 0) {
			if (H(t) === !1) {
				let n = t.textures, r = t.width, i = t.height, a = e.COLOR_BUFFER_BIT, o = t.stencilBuffer ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT, s = f.get(t), c = n.length > 1;
				if (c) for (let t = 0; t < n.length; t++) d.bindFramebuffer(e.FRAMEBUFFER, s.__webglMultisampledFramebuffer), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0 + t, e.RENDERBUFFER, null), d.bindFramebuffer(e.FRAMEBUFFER, s.__webglFramebuffer), e.framebufferTexture2D(e.DRAW_FRAMEBUFFER, e.COLOR_ATTACHMENT0 + t, e.TEXTURE_2D, null, 0);
				d.bindFramebuffer(e.READ_FRAMEBUFFER, s.__webglMultisampledFramebuffer), t.texture.mipmaps.length > 0 ? d.bindFramebuffer(e.DRAW_FRAMEBUFFER, s.__webglFramebuffer[0]) : d.bindFramebuffer(e.DRAW_FRAMEBUFFER, s.__webglFramebuffer);
				for (let l = 0; l < n.length; l++) {
					if (t.resolveDepthBuffer && (t.depthBuffer && (a |= e.DEPTH_BUFFER_BIT), t.stencilBuffer && t.resolveStencilBuffer && (a |= e.STENCIL_BUFFER_BIT)), c) {
						e.framebufferRenderbuffer(e.READ_FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.RENDERBUFFER, s.__webglColorRenderbuffer[l]);
						let t = f.get(n[l]).__webglTexture;
						e.framebufferTexture2D(e.DRAW_FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, t, 0);
					}
					e.blitFramebuffer(0, 0, r, i, 0, 0, r, i, a, e.NEAREST), _ === !0 && (ke.length = 0, ke.push(e.COLOR_ATTACHMENT0 + l), t.depthBuffer && t.storeMultisampledDepthBuffer === !1 && ke.push(o), e.invalidateFramebuffer(e.READ_FRAMEBUFFER, ke));
				}
				if (d.bindFramebuffer(e.READ_FRAMEBUFFER, null), d.bindFramebuffer(e.DRAW_FRAMEBUFFER, null), c) for (let t = 0; t < n.length; t++) {
					d.bindFramebuffer(e.FRAMEBUFFER, s.__webglMultisampledFramebuffer), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0 + t, e.RENDERBUFFER, s.__webglColorRenderbuffer[t]);
					let r = f.get(n[t]).__webglTexture;
					d.bindFramebuffer(e.FRAMEBUFFER, s.__webglFramebuffer), e.framebufferTexture2D(e.DRAW_FRAMEBUFFER, e.COLOR_ATTACHMENT0 + t, e.TEXTURE_2D, r, 0);
				}
				d.bindFramebuffer(e.DRAW_FRAMEBUFFER, s.__webglMultisampledFramebuffer);
			} else if (t.depthBuffer && t.storeMultisampledDepthBuffer === !1 && _) {
				let n = t.stencilBuffer ? e.DEPTH_STENCIL_ATTACHMENT : e.DEPTH_ATTACHMENT;
				e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER, [n]);
			}
		}
	}
	function je(e) {
		return Math.min(p.maxSamples, e.samples);
	}
	function H(e) {
		let n = f.get(e);
		return e.samples > 0 && t.has("WEBGL_multisampled_render_to_texture") === !0 && n.__useRenderToTexture !== !1;
	}
	function Me(e) {
		let t = h.render.frame;
		y.get(e) !== t && (y.set(e, t), e.update());
	}
	function U(e, t) {
		let n = e.colorSpace, r = e.format, i = e.type;
		return e.isCompressedTexture === !0 || e.isVideoTexture === !0 || n !== "srgb-linear" && n !== "" && (Mt.getTransfer(n) === "srgb" ? (r !== 1023 || i !== 1009) && G("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.") : K("WebGLTextures: Unsupported texture color space:", n)), t;
	}
	function W(e) {
		return typeof HTMLImageElement < "u" && e instanceof HTMLImageElement ? (v.width = e.naturalWidth || e.width, v.height = e.naturalHeight || e.height) : typeof VideoFrame < "u" && e instanceof VideoFrame ? (v.width = e.displayWidth, v.height = e.displayHeight) : (v.width = e.width, v.height = e.height), v;
	}
	this.allocateTextureUnit = ce, this.resetTextureUnits = ae, this.getTextureUnits = oe, this.setTextureUnits = se, this.setTexture2D = ue, this.setTexture2DArray = de, this.setTexture3D = fe, this.setTextureCube = pe, this.rebindTextures = De, this.setupRenderTarget = Oe, this.updateRenderTargetMipmap = V, this.updateMultisampleRenderTarget = Ae, this.setupDepthRenderbuffer = Ee, this.setupFrameBufferTexture = Ce, this.useMultisampledRTT = H, this.dispose = z;
}
function Yc(e, t) {
	function n(n, r = "") {
		let i, a = Mt.getTransfer(r);
		if (n === 1009) return e.UNSIGNED_BYTE;
		if (n === 1017) return e.UNSIGNED_SHORT_4_4_4_4;
		if (n === 1018) return e.UNSIGNED_SHORT_5_5_5_1;
		if (n === 35902) return e.UNSIGNED_INT_5_9_9_9_REV;
		if (n === 35899) return e.UNSIGNED_INT_10F_11F_11F_REV;
		if (n === 1010) return e.BYTE;
		if (n === 1011) return e.SHORT;
		if (n === 1012) return e.UNSIGNED_SHORT;
		if (n === 1013) return e.INT;
		if (n === 1014) return e.UNSIGNED_INT;
		if (n === 1015) return e.FLOAT;
		if (n === 1016) return e.HALF_FLOAT;
		if (n === 1021) return e.ALPHA;
		if (n === 1022) return e.RGB;
		if (n === 1023) return e.RGBA;
		if (n === 1026) return e.DEPTH_COMPONENT;
		if (n === 1027) return e.DEPTH_STENCIL;
		if (n === 1028) return e.RED;
		if (n === 1029) return e.RED_INTEGER;
		if (n === 1030) return e.RG;
		if (n === 1031) return e.RG_INTEGER;
		if (n === 1033) return e.RGBA_INTEGER;
		if (n === 33776 || n === 33777 || n === 33778 || n === 33779) {
			if (a === "srgb") {
				if (i = t.get("WEBGL_compressed_texture_s3tc_srgb"), i !== null) {
					if (n === 33776) return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;
					if (n === 33777) return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
					if (n === 33778) return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
					if (n === 33779) return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
				} else return null;
			} else if (i = t.get("WEBGL_compressed_texture_s3tc"), i !== null) {
				if (n === 33776) return i.COMPRESSED_RGB_S3TC_DXT1_EXT;
				if (n === 33777) return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;
				if (n === 33778) return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;
				if (n === 33779) return i.COMPRESSED_RGBA_S3TC_DXT5_EXT;
			} else return null;
		}
		if (n === 35840 || n === 35841 || n === 35842 || n === 35843) {
			if (i = t.get("WEBGL_compressed_texture_pvrtc"), i !== null) {
				if (n === 35840) return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
				if (n === 35841) return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
				if (n === 35842) return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
				if (n === 35843) return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
			} else return null;
		}
		if (n === 36196 || n === 37492 || n === 37496 || n === 37488 || n === 37489 || n === 37490 || n === 37491) {
			if (i = t.get("WEBGL_compressed_texture_etc"), i !== null) {
				if (n === 36196 || n === 37492) return a === "srgb" ? i.COMPRESSED_SRGB8_ETC2 : i.COMPRESSED_RGB8_ETC2;
				if (n === 37496) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : i.COMPRESSED_RGBA8_ETC2_EAC;
				if (n === 37488) return i.COMPRESSED_R11_EAC;
				if (n === 37489) return i.COMPRESSED_SIGNED_R11_EAC;
				if (n === 37490) return i.COMPRESSED_RG11_EAC;
				if (n === 37491) return i.COMPRESSED_SIGNED_RG11_EAC;
			} else return null;
		}
		if (n === 37808 || n === 37809 || n === 37810 || n === 37811 || n === 37812 || n === 37813 || n === 37814 || n === 37815 || n === 37816 || n === 37817 || n === 37818 || n === 37819 || n === 37820 || n === 37821) {
			if (i = t.get("WEBGL_compressed_texture_astc"), i !== null) {
				if (n === 37808) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR : i.COMPRESSED_RGBA_ASTC_4x4_KHR;
				if (n === 37809) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR : i.COMPRESSED_RGBA_ASTC_5x4_KHR;
				if (n === 37810) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR : i.COMPRESSED_RGBA_ASTC_5x5_KHR;
				if (n === 37811) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR : i.COMPRESSED_RGBA_ASTC_6x5_KHR;
				if (n === 37812) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR : i.COMPRESSED_RGBA_ASTC_6x6_KHR;
				if (n === 37813) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR : i.COMPRESSED_RGBA_ASTC_8x5_KHR;
				if (n === 37814) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR : i.COMPRESSED_RGBA_ASTC_8x6_KHR;
				if (n === 37815) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR : i.COMPRESSED_RGBA_ASTC_8x8_KHR;
				if (n === 37816) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR : i.COMPRESSED_RGBA_ASTC_10x5_KHR;
				if (n === 37817) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR : i.COMPRESSED_RGBA_ASTC_10x6_KHR;
				if (n === 37818) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR : i.COMPRESSED_RGBA_ASTC_10x8_KHR;
				if (n === 37819) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR : i.COMPRESSED_RGBA_ASTC_10x10_KHR;
				if (n === 37820) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR : i.COMPRESSED_RGBA_ASTC_12x10_KHR;
				if (n === 37821) return a === "srgb" ? i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR : i.COMPRESSED_RGBA_ASTC_12x12_KHR;
			} else return null;
		}
		if (n === 36492 || n === 36494 || n === 36495) {
			if (i = t.get("EXT_texture_compression_bptc"), i !== null) {
				if (n === 36492) return a === "srgb" ? i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT : i.COMPRESSED_RGBA_BPTC_UNORM_EXT;
				if (n === 36494) return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
				if (n === 36495) return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
			} else return null;
		}
		if (n === 36283 || n === 36284 || n === 36285 || n === 36286) {
			if (i = t.get("EXT_texture_compression_rgtc"), i !== null) {
				if (n === 36283) return i.COMPRESSED_RED_RGTC1_EXT;
				if (n === 36284) return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;
				if (n === 36285) return i.COMPRESSED_RED_GREEN_RGTC2_EXT;
				if (n === 36286) return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
			} else return null;
		}
		return n === 1020 ? e.UNSIGNED_INT_24_8 : e[n] === void 0 ? null : e[n];
	}
	return { convert: n };
}
var Xc = "\nvoid main() {\n\n	gl_Position = vec4( position, 1.0 );\n\n}", Zc = "\nuniform sampler2DArray depthColor;\nuniform float depthWidth;\nuniform float depthHeight;\n\nvoid main() {\n\n	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );\n\n	if ( coord.x >= 1.0 ) {\n\n		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;\n\n	} else {\n\n		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;\n\n	}\n\n}", Qc = class {
	constructor() {
		this.texture = null, this.mesh = null, this.depthNear = 0, this.depthFar = 0;
	}
	init(e, t) {
		if (this.texture === null) {
			let n = new Ci(e.texture);
			(e.depthNear !== t.depthNear || e.depthFar !== t.depthFar) && (this.depthNear = e.depthNear, this.depthFar = e.depthFar), this.texture = n;
		}
	}
	getMesh(e) {
		if (this.texture !== null && this.mesh === null) {
			let t = e.cameras[0].viewport, n = new Ii({
				vertexShader: Xc,
				fragmentShader: Zc,
				uniforms: {
					depthColor: { value: this.texture },
					depthWidth: { value: t.z },
					depthHeight: { value: t.w }
				}
			});
			this.mesh = new Yr(new Ei(20, 20), n);
		}
		return this.mesh;
	}
	reset() {
		this.texture = null, this.mesh = null;
	}
	getDepthTexture() {
		return this.texture;
	}
}, $c = class extends Ze {
	constructor(e, t) {
		super();
		let n = this, r = null, i = 1, a = null, o = "local-floor", s = 1, c = null, l = null, u = null, f = null, p = null, m = null, h = typeof XRWebGLBinding < "u", _ = new Qc(), v = {}, y = t.getContextAttributes(), b = null, S = null, C = [], w = [], T = new J(), k = null, A = null, j = new ba();
		j.viewport = new Ut();
		let M = new ba();
		M.viewport = new Ut();
		let N = [j, M], P = new Aa(), F = null, I = null;
		this.cameraAutoUpdate = !0, this.enabled = !1, this.isPresenting = !1, this.getController = function(e) {
			let t = C[e];
			return t === void 0 && (t = new Tn(), C[e] = t), t.getTargetRaySpace();
		}, this.getControllerGrip = function(e) {
			let t = C[e];
			return t === void 0 && (t = new Tn(), C[e] = t), t.getGripSpace();
		}, this.getHand = function(e) {
			let t = C[e];
			return t === void 0 && (t = new Tn(), C[e] = t), t.getHandSpace();
		};
		function L(e) {
			let t = w.indexOf(e.inputSource);
			if (t === -1) return;
			let n = C[t];
			n !== void 0 && (n.update(e.inputSource, e.frame, c || a), n.dispatchEvent({
				type: e.type,
				data: e.inputSource
			}));
		}
		function R() {
			r.removeEventListener("select", L), r.removeEventListener("selectstart", L), r.removeEventListener("selectend", L), r.removeEventListener("squeeze", L), r.removeEventListener("squeezestart", L), r.removeEventListener("squeezeend", L), r.removeEventListener("end", R), r.removeEventListener("inputsourceschange", ee);
			for (let e = 0; e < C.length; e++) {
				let t = w[e];
				t !== null && (w[e] = null, C[e].disconnect(t));
			}
			F = null, I = null, _.reset();
			for (let e in v) delete v[e];
			if (e.setRenderTarget(b), p = null, f = null, u = null, r = null, S = null, B.stop(), n.isPresenting = !1, e.setPixelRatio(k), e.setSize(T.width, T.height, !1), A !== null) {
				let e = A.camera;
				e.fov = A.fov, e.zoom = A.zoom, e.updateProjectionMatrix(), A = null;
			}
			n.dispatchEvent({ type: "sessionend" });
		}
		this.setFramebufferScaleFactor = function(e) {
			i = e, n.isPresenting === !0 && G("WebXRManager: Cannot change framebuffer scale while presenting.");
		}, this.setReferenceSpaceType = function(e) {
			o = e, n.isPresenting === !0 && G("WebXRManager: Cannot change reference space type while presenting.");
		}, this.getReferenceSpace = function() {
			return c || a;
		}, this.setReferenceSpace = function(e) {
			c = e;
		}, this.getBaseLayer = function() {
			return f === null ? p : f;
		}, this.getBinding = function() {
			return u === null && h && (u = new XRWebGLBinding(r, t)), u;
		}, this.getFrame = function() {
			return m;
		}, this.getSession = function() {
			return r;
		}, this.setSession = async function(l) {
			if (r = l, r !== null) {
				if (b = e.getRenderTarget(), r.addEventListener("select", L), r.addEventListener("selectstart", L), r.addEventListener("selectend", L), r.addEventListener("squeeze", L), r.addEventListener("squeezestart", L), r.addEventListener("squeezeend", L), r.addEventListener("end", R), r.addEventListener("inputsourceschange", ee), y.xrCompatible !== !0 && await t.makeXRCompatible(), k = e.getPixelRatio(), e.getSize(T), h && "createProjectionLayer" in XRWebGLBinding.prototype) {
					let n = null, a = null, o = null;
					y.depth && (o = y.stencil ? t.DEPTH24_STENCIL8 : t.DEPTH_COMPONENT24, n = y.stencil ? O : D, a = y.stencil ? x : g);
					let s = {
						colorFormat: t.RGBA8,
						depthFormat: o,
						scaleFactor: i
					};
					u = this.getBinding(), f = u.createProjectionLayer(s), r.updateRenderState({ layers: [f] }), e.setPixelRatio(1), e.setSize(f.textureWidth, f.textureHeight, !1), S = new Gt(f.textureWidth, f.textureHeight, {
						format: E,
						type: d,
						depthTexture: new xi(f.textureWidth, f.textureHeight, a, void 0, void 0, void 0, void 0, void 0, void 0, n),
						stencilBuffer: y.stencil,
						colorSpace: e.outputColorSpace,
						samples: y.antialias ? 4 : 0,
						resolveDepthBuffer: f.ignoreDepthValues === !1,
						resolveStencilBuffer: f.ignoreDepthValues === !1,
						storeMultisampledDepthBuffer: f.ignoreDepthValues === !1,
						storeMultisampledStencilBuffer: f.ignoreDepthValues === !1
					});
				} else {
					let n = {
						antialias: y.antialias,
						alpha: !0,
						depth: y.depth,
						stencil: y.stencil,
						framebufferScaleFactor: i
					};
					p = new XRWebGLLayer(r, t, n), r.updateRenderState({ baseLayer: p }), e.setPixelRatio(1), e.setSize(p.framebufferWidth, p.framebufferHeight, !1), S = new Gt(p.framebufferWidth, p.framebufferHeight, {
						format: E,
						type: d,
						colorSpace: e.outputColorSpace,
						stencilBuffer: y.stencil,
						resolveDepthBuffer: p.ignoreDepthValues === !1,
						resolveStencilBuffer: p.ignoreDepthValues === !1,
						storeMultisampledDepthBuffer: p.ignoreDepthValues === !1,
						storeMultisampledStencilBuffer: p.ignoreDepthValues === !1
					});
				}
				S.isXRRenderTarget = !0, this.setFoveation(s), c = null, a = await r.requestReferenceSpace(o), B.setContext(r), B.start(), n.isPresenting = !0, n.dispatchEvent({ type: "sessionstart" });
			}
		}, this.getEnvironmentBlendMode = function() {
			if (r !== null) return r.environmentBlendMode;
		}, this.getDepthTexture = function() {
			return _.getDepthTexture();
		};
		function ee(e) {
			for (let t = 0; t < e.removed.length; t++) {
				let n = e.removed[t], r = w.indexOf(n);
				r >= 0 && (w[r] = null, C[r].disconnect(n));
			}
			for (let t = 0; t < e.added.length; t++) {
				let n = e.added[t], r = w.indexOf(n);
				if (r === -1) {
					for (let e = 0; e < C.length; e++) if (e >= w.length) {
						w.push(n), r = e;
						break;
					} else if (w[e] === null) {
						w[e] = n, r = e;
						break;
					}
					if (r === -1) break;
				}
				let i = C[r];
				i && i.connect(n);
			}
		}
		function te(e, t) {
			t === null ? e.matrixWorld.copy(e.matrix) : e.matrixWorld.multiplyMatrices(t.matrixWorld, e.matrix), e.matrixWorldInverse.copy(e.matrixWorld).invert();
		}
		this.updateCamera = function(e) {
			if (r === null) return;
			let t = e.near, n = e.far;
			_.texture !== null && (_.depthNear > 0 && (t = _.depthNear), _.depthFar > 0 && (n = _.depthFar)), P.near = M.near = j.near = t, P.far = M.far = j.far = n, (F !== P.near || I !== P.far) && (r.updateRenderState({
				depthNear: P.near,
				depthFar: P.far
			}), F = P.near, I = P.far), P.layers.mask = e.layers.mask | 6, j.layers.mask = P.layers.mask & -5, M.layers.mask = P.layers.mask & -3;
			let i = e.parent, a = P.cameras;
			te(P, i);
			for (let e = 0; e < a.length; e++) te(a[e], i);
			P.projectionMatrix.copy(j.projectionMatrix), P.projectionMatrixInverse.copy(j.projectionMatrixInverse), A === null && e.isPerspectiveCamera && (A = {
				camera: e,
				fov: e.fov,
				zoom: e.zoom
			}), z(e, P, i);
		};
		function z(e, t, n) {
			n === null ? e.matrix.copy(t.matrixWorld) : (e.matrix.copy(n.matrixWorld), e.matrix.invert(), e.matrix.multiply(t.matrixWorld)), e.matrix.decompose(e.position, e.quaternion, e.scale), e.updateMatrixWorld(!0), e.projectionMatrix.copy(t.projectionMatrix), e.projectionMatrixInverse.copy(t.projectionMatrixInverse), e.isPerspectiveCamera && (e.fov = tt * 2 * Math.atan(1 / e.projectionMatrix.elements[5]), e.zoom = 1);
		}
		this.getCamera = function() {
			return P;
		}, this.getFoveation = function() {
			if (f !== null || p !== null) return s;
		}, this.setFoveation = function(e) {
			s = e, f !== null && (f.fixedFoveation = e), p !== null && p.fixedFoveation !== void 0 && (p.fixedFoveation = e);
		}, this.hasDepthSensing = function() {
			return _.texture !== null;
		}, this.getDepthSensingMesh = function() {
			return _.getMesh(P);
		}, this.getCameraTexture = function(e) {
			return v[e];
		};
		let ne = null;
		function re(t, i) {
			if (l = i.getViewerPose(c || a), m = i, l !== null) {
				let t = l.views;
				p !== null && (e.setRenderTargetFramebuffer(S, p.framebuffer), e.setRenderTarget(S));
				let i = !1;
				t.length !== P.cameras.length && (P.cameras.length = 0, i = !0);
				for (let n = 0; n < t.length; n++) {
					let r = t[n], a = null;
					if (p !== null) a = p.getViewport(r);
					else {
						let t = u.getViewSubImage(f, r);
						a = t.viewport, n === 0 && (e.setRenderTargetTextures(S, t.colorTexture, t.depthStencilTexture), e.setRenderTarget(S));
					}
					let o = N[n];
					o === void 0 && (o = new ba(), o.layers.enable(n), o.viewport = new Ut(), N[n] = o), o.matrix.fromArray(r.transform.matrix), o.matrix.decompose(o.position, o.quaternion, o.scale), o.projectionMatrix.fromArray(r.projectionMatrix), o.projectionMatrixInverse.copy(o.projectionMatrix).invert(), o.viewport.set(a.x, a.y, a.width, a.height), n === 0 && (P.matrix.copy(o.matrix), P.matrix.decompose(P.position, P.quaternion, P.scale)), i === !0 && P.cameras.push(o);
				}
				let a = r.enabledFeatures;
				if (a && a.includes("depth-sensing") && r.depthUsage == "gpu-optimized" && h) {
					u = n.getBinding();
					let e = u.getDepthInformation(t[0]);
					e && e.isValid && e.texture && _.init(e, r.renderState);
				}
				if (a && a.includes("camera-access") && h) {
					e.state.unbindTexture(), u = n.getBinding();
					for (let e = 0; e < t.length; e++) {
						let n = t[e].camera;
						if (n) {
							let e = v[n];
							e || (e = new Ci(), v[n] = e);
							let t = u.getCameraImage(n);
							e.sourceTexture = t;
						}
					}
				}
			}
			for (let e = 0; e < C.length; e++) {
				let t = w[e], n = C[e];
				t !== null && n !== void 0 && n.update(t, i, c || a);
			}
			ne && ne(t, i), i.detectedPlanes && n.dispatchEvent({
				type: "planesdetected",
				data: i
			}), m = null;
		}
		let B = new Xa();
		B.setAnimationLoop(re), this.setAnimationLoop = function(e) {
			ne = e;
		}, this.dispose = function() {};
	}
}, el = /*@__PURE__*/ new Jt(), tl = /*@__PURE__*/ new X();
tl.set(-1, 0, 0, 0, 1, 0, 0, 0, 1);
function nl(e, t) {
	function n(e, t) {
		e.matrixAutoUpdate === !0 && e.updateMatrix(), t.value.copy(e.matrix);
	}
	function r(t, n) {
		n.color.getRGB(t.fogColor.value, Mi(e)), n.isFog ? (t.fogNear.value = n.near, t.fogFar.value = n.far) : n.isFogExp2 && (t.fogDensity.value = n.density);
	}
	function i(e, t, n, r, i) {
		t.isNodeMaterial ? t.uniformsNeedUpdate = !1 : t.isMeshBasicMaterial ? a(e, t) : t.isMeshLambertMaterial ? (a(e, t), t.envMap && (e.envMapIntensity.value = t.envMapIntensity)) : t.isMeshToonMaterial ? (a(e, t), d(e, t)) : t.isMeshPhongMaterial ? (a(e, t), u(e, t), t.envMap && (e.envMapIntensity.value = t.envMapIntensity)) : t.isMeshStandardMaterial ? (a(e, t), f(e, t), t.isMeshPhysicalMaterial && p(e, t, i)) : t.isMeshMatcapMaterial ? (a(e, t), m(e, t)) : t.isMeshDepthMaterial ? a(e, t) : t.isMeshDistanceMaterial ? (a(e, t), h(e, t)) : t.isMeshNormalMaterial ? a(e, t) : t.isLineBasicMaterial ? (o(e, t), t.isLineDashedMaterial && s(e, t)) : t.isPointsMaterial ? c(e, t, n, r) : t.isSpriteMaterial ? l(e, t) : t.isShadowMaterial ? (e.color.value.copy(t.color), e.opacity.value = t.opacity) : t.isShaderMaterial && (t.uniformsNeedUpdate = !1);
	}
	function a(e, r) {
		e.opacity.value = r.opacity, r.color && e.diffuse.value.copy(r.color), r.emissive && e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity), r.map && (e.map.value = r.map, n(r.map, e.mapTransform)), r.alphaMap && (e.alphaMap.value = r.alphaMap, n(r.alphaMap, e.alphaMapTransform)), r.bumpMap && (e.bumpMap.value = r.bumpMap, n(r.bumpMap, e.bumpMapTransform), e.bumpScale.value = r.bumpScale, r.side === 1 && (e.bumpScale.value *= -1)), r.normalMap && (e.normalMap.value = r.normalMap, n(r.normalMap, e.normalMapTransform), e.normalScale.value.copy(r.normalScale), r.side === 1 && e.normalScale.value.negate()), r.displacementMap && (e.displacementMap.value = r.displacementMap, n(r.displacementMap, e.displacementMapTransform), e.displacementScale.value = r.displacementScale, e.displacementBias.value = r.displacementBias), r.emissiveMap && (e.emissiveMap.value = r.emissiveMap, n(r.emissiveMap, e.emissiveMapTransform)), r.specularMap && (e.specularMap.value = r.specularMap, n(r.specularMap, e.specularMapTransform)), r.alphaTest > 0 && (e.alphaTest.value = r.alphaTest);
		let i = t.get(r), a = i.envMap, o = i.envMapRotation;
		a && (e.envMap.value = a, e.envMapRotation.value.setFromMatrix4(el.makeRotationFromEuler(o)).transpose(), a.isCubeTexture && a.isRenderTargetTexture === !1 && e.envMapRotation.value.premultiply(tl), e.reflectivity.value = r.reflectivity, e.ior.value = r.ior, e.refractionRatio.value = r.refractionRatio), r.lightMap && (e.lightMap.value = r.lightMap, e.lightMapIntensity.value = r.lightMapIntensity, n(r.lightMap, e.lightMapTransform)), r.aoMap && (e.aoMap.value = r.aoMap, e.aoMapIntensity.value = r.aoMapIntensity, n(r.aoMap, e.aoMapTransform));
	}
	function o(e, t) {
		e.diffuse.value.copy(t.color), e.opacity.value = t.opacity, t.map && (e.map.value = t.map, n(t.map, e.mapTransform));
	}
	function s(e, t) {
		e.dashSize.value = t.dashSize, e.totalSize.value = t.dashSize + t.gapSize, e.scale.value = t.scale;
	}
	function c(e, t, r, i) {
		e.diffuse.value.copy(t.color), e.opacity.value = t.opacity, e.size.value = t.size * r, e.scale.value = i * .5, t.map && (e.map.value = t.map, n(t.map, e.uvTransform)), t.alphaMap && (e.alphaMap.value = t.alphaMap, n(t.alphaMap, e.alphaMapTransform)), t.alphaTest > 0 && (e.alphaTest.value = t.alphaTest);
	}
	function l(e, t) {
		e.diffuse.value.copy(t.color), e.opacity.value = t.opacity, e.rotation.value = t.rotation, t.map && (e.map.value = t.map, n(t.map, e.mapTransform)), t.alphaMap && (e.alphaMap.value = t.alphaMap, n(t.alphaMap, e.alphaMapTransform)), t.alphaTest > 0 && (e.alphaTest.value = t.alphaTest);
	}
	function u(e, t) {
		e.specular.value.copy(t.specular), e.shininess.value = Math.max(t.shininess, 1e-4);
	}
	function d(e, t) {
		t.gradientMap && (e.gradientMap.value = t.gradientMap);
	}
	function f(e, t) {
		e.metalness.value = t.metalness, t.metalnessMap && (e.metalnessMap.value = t.metalnessMap, n(t.metalnessMap, e.metalnessMapTransform)), e.roughness.value = t.roughness, t.roughnessMap && (e.roughnessMap.value = t.roughnessMap, n(t.roughnessMap, e.roughnessMapTransform)), t.envMap && (e.envMapIntensity.value = t.envMapIntensity);
	}
	function p(e, t, r) {
		e.ior.value = t.ior, t.diffuseRoughness > 0 && (e.diffuseRoughness.value = t.diffuseRoughness, t.diffuseRoughnessMap && (e.diffuseRoughnessMap.value = t.diffuseRoughnessMap, n(t.diffuseRoughnessMap, e.diffuseRoughnessMapTransform))), t.sheen > 0 && (e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen), e.sheenRoughness.value = t.sheenRoughness, t.sheenColorMap && (e.sheenColorMap.value = t.sheenColorMap, n(t.sheenColorMap, e.sheenColorMapTransform)), t.sheenRoughnessMap && (e.sheenRoughnessMap.value = t.sheenRoughnessMap, n(t.sheenRoughnessMap, e.sheenRoughnessMapTransform))), t.clearcoat > 0 && (e.clearcoat.value = t.clearcoat, e.clearcoatRoughness.value = t.clearcoatRoughness, t.clearcoatMap && (e.clearcoatMap.value = t.clearcoatMap, n(t.clearcoatMap, e.clearcoatMapTransform)), t.clearcoatRoughnessMap && (e.clearcoatRoughnessMap.value = t.clearcoatRoughnessMap, n(t.clearcoatRoughnessMap, e.clearcoatRoughnessMapTransform)), t.clearcoatNormalMap && (e.clearcoatNormalMap.value = t.clearcoatNormalMap, n(t.clearcoatNormalMap, e.clearcoatNormalMapTransform), e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale), t.side === 1 && e.clearcoatNormalScale.value.negate())), t.dispersion > 0 && (e.dispersion.value = t.dispersion), t.retroreflectivity > 0 && (e.retroreflectivity.value = t.retroreflectivity), t.iridescence > 0 && (e.iridescence.value = t.iridescence, e.iridescenceIOR.value = t.iridescenceIOR, e.iridescenceThicknessMinimum.value = t.iridescenceThicknessMinimum, e.iridescenceThicknessMaximum.value = t.iridescenceThicknessMaximum, t.iridescenceMap && (e.iridescenceMap.value = t.iridescenceMap, n(t.iridescenceMap, e.iridescenceMapTransform)), t.iridescenceThicknessMap && (e.iridescenceThicknessMap.value = t.iridescenceThicknessMap, n(t.iridescenceThicknessMap, e.iridescenceThicknessMapTransform))), t.transmission > 0 && (e.transmission.value = t.transmission, e.transmissionSamplerMap.value = r.texture, e.transmissionSamplerSize.value.set(r.width, r.height), t.transmissionMap && (e.transmissionMap.value = t.transmissionMap, n(t.transmissionMap, e.transmissionMapTransform)), e.thickness.value = t.thickness, t.thicknessMap && (e.thicknessMap.value = t.thicknessMap, n(t.thicknessMap, e.thicknessMapTransform)), e.attenuationDistance.value = t.attenuationDistance, e.attenuationColor.value.copy(t.attenuationColor)), t.anisotropy > 0 && (e.anisotropyVector.value.set(t.anisotropy * Math.cos(t.anisotropyRotation), t.anisotropy * Math.sin(t.anisotropyRotation)), t.anisotropyMap && (e.anisotropyMap.value = t.anisotropyMap, n(t.anisotropyMap, e.anisotropyMapTransform))), e.specularIntensity.value = t.specularIntensity, e.specularColor.value.copy(t.specularColor), t.specularColorMap && (e.specularColorMap.value = t.specularColorMap, n(t.specularColorMap, e.specularColorMapTransform)), t.specularIntensityMap && (e.specularIntensityMap.value = t.specularIntensityMap, n(t.specularIntensityMap, e.specularIntensityMapTransform));
	}
	function m(e, t) {
		t.matcap && (e.matcap.value = t.matcap);
	}
	function h(e, n) {
		let r = t.get(n).light;
		e.referencePosition.value.setFromMatrixPosition(r.matrixWorld), e.nearDistance.value = r.shadow.camera.near, e.farDistance.value = r.shadow.camera.far;
	}
	return {
		refreshFogUniforms: r,
		refreshMaterialUniforms: i
	};
}
function rl(e, t, n, r) {
	let i = {}, a = {};
	function o(e, t) {
		let n = t.program;
		r.uniformBlockBinding(e, n, i[e.id]);
	}
	function s(e, n) {
		let o = i[e.id];
		o === void 0 && (m(e), o = c(e), i[e.id] = o, e.addEventListener("dispose", g));
		let s = n.program;
		r.updateUBOMapping(e, s);
		let u = t.render.frame;
		a[e.id] !== u && (l(e), a[e.id] = u);
	}
	function c(t) {
		let n = e.createBuffer(), r = t.__size, i = t.usage;
		return e.bindBuffer(e.UNIFORM_BUFFER, n), e.bufferData(e.UNIFORM_BUFFER, r, i), e.bindBuffer(e.UNIFORM_BUFFER, null), n;
	}
	function l(t) {
		let n = i[t.id], r = t.uniforms, a = t.__cache;
		e.bindBuffer(e.UNIFORM_BUFFER, n);
		for (let e = 0, t = r.length; e < t; e++) {
			let t = r[e];
			if (Array.isArray(t)) for (let n = 0, r = t.length; n < r; n++) u(t[n], e, n, a);
			else u(t, e, 0, a);
		}
		e.bindBuffer(e.UNIFORM_BUFFER, null);
	}
	function u(t, n, r, i) {
		if (f(t, n, r, i) === !0) {
			let n = t.__offset, r = t.value;
			if (Array.isArray(r)) {
				let e = 0;
				for (let n = 0; n < r.length; n++) {
					let i = r[n], a = h(i, !0);
					d(i, t.__data, e), e += a.storage / Float32Array.BYTES_PER_ELEMENT;
				}
			} else d(r, t.__data, 0);
			e.bufferSubData(e.UNIFORM_BUFFER, n, t.__data);
		}
	}
	function d(e, t, n) {
		typeof e == "number" || typeof e == "boolean" ? t[n] = e : e.isMatrix3 ? (t[n] = e.elements[0], t[n + 1] = e.elements[1], t[n + 2] = e.elements[2], t[n + 3] = 0, t[n + 4] = e.elements[3], t[n + 5] = e.elements[4], t[n + 6] = e.elements[5], t[n + 7] = 0, t[n + 8] = e.elements[6], t[n + 9] = e.elements[7], t[n + 10] = e.elements[8], t[n + 11] = 0) : ArrayBuffer.isView(e) ? t.set(e.subarray(0, t.length - n), n) : e.toArray(t, n);
	}
	function f(e, t, n, r) {
		let i = e.value, a = t + "_" + n;
		if (Array.isArray(i)) {
			r[a] === void 0 && (r[a] = []);
			let e = r[a], t = !1;
			for (let n = 0; n < i.length; n++) p(i[n], e, n) === !0 && (t = !0);
			return t;
		}
		return p(i, r, a);
	}
	function p(e, t, n) {
		if (t[n] === void 0) return t[n] = typeof e == "number" || typeof e == "boolean" ? e : ArrayBuffer.isView(e) ? e.slice() : e.clone(), !0;
		{
			let r = t[n];
			if (typeof e == "number" || typeof e == "boolean") {
				if (r !== e) return t[n] = e, !0;
			} else if (ArrayBuffer.isView(e)) return !0;
			else if (r.equals(e) === !1) return r.copy(e), !0;
		}
		return !1;
	}
	function m(e) {
		let t = e.uniforms, n = 0;
		for (let e = 0, r = t.length; e < r; e++) {
			let r = Array.isArray(t[e]) ? t[e] : [t[e]];
			for (let i = 0, a = r.length; i < a; i++) {
				let a = r[i], o = Array.isArray(a.value) ? a.value : [a.value], s = Array.isArray(t[e]) || Array.isArray(a.value), c = n;
				for (let e = 0, t = o.length; e < t; e++) {
					let t = o[e], r = h(t, s), i = n % 16, a = i % r.boundary, l = i + a;
					n += a, l !== 0 && 16 - l < r.storage && (n += 16 - l), e === 0 && (c = n), n += r.storage;
				}
				a.__data = new (a.type === "int" ? Int32Array : a.type === "uint" ? Uint32Array : Float32Array)((n - c) / Float32Array.BYTES_PER_ELEMENT), a.__offset = c;
			}
		}
		let r = n % 16;
		return r > 0 && (n += 16 - r), e.__size = n, e.__cache = {}, this;
	}
	function h(e, t) {
		let n = {
			boundary: 0,
			storage: 0
		};
		return typeof e == "number" || typeof e == "boolean" ? (n.boundary = 4, n.storage = 4) : e.isVector2 ? (n.boundary = 8, n.storage = 8) : e.isVector3 || e.isColor ? (n.boundary = 16, n.storage = 12) : e.isVector4 ? (n.boundary = 16, n.storage = 16) : e.isMatrix3 ? (n.boundary = 16, n.storage = 48) : e.isMatrix4 ? (n.boundary = 16, n.storage = 64) : e.isTexture ? G("WebGLRenderer: Texture samplers can not be part of an uniforms group.") : ArrayBuffer.isView(e) ? (n.boundary = 16, n.storage = e.byteLength) : G("WebGLRenderer: Unsupported uniform value type.", e), t === !0 && (n.boundary = 16, n.storage = Math.ceil(n.storage / 16) * 16), n;
	}
	function g(t) {
		let n = t.target;
		n.removeEventListener("dispose", g), e.deleteBuffer(i[n.id]), delete i[n.id], delete a[n.id];
	}
	function _() {
		for (let t in i) e.deleteBuffer(i[t]);
		i = {}, a = {};
	}
	return {
		bind: o,
		update: s,
		dispose: _
	};
}
var il = new Uint16Array([
	12469,
	15057,
	12620,
	14925,
	13266,
	14620,
	13807,
	14376,
	14323,
	13990,
	14545,
	13625,
	14713,
	13328,
	14840,
	12882,
	14931,
	12528,
	14996,
	12233,
	15039,
	11829,
	15066,
	11525,
	15080,
	11295,
	15085,
	10976,
	15082,
	10705,
	15073,
	10495,
	13880,
	14564,
	13898,
	14542,
	13977,
	14430,
	14158,
	14124,
	14393,
	13732,
	14556,
	13410,
	14702,
	12996,
	14814,
	12596,
	14891,
	12291,
	14937,
	11834,
	14957,
	11489,
	14958,
	11194,
	14943,
	10803,
	14921,
	10506,
	14893,
	10278,
	14858,
	9960,
	14484,
	14039,
	14487,
	14025,
	14499,
	13941,
	14524,
	13740,
	14574,
	13468,
	14654,
	13106,
	14743,
	12678,
	14818,
	12344,
	14867,
	11893,
	14889,
	11509,
	14893,
	11180,
	14881,
	10751,
	14852,
	10428,
	14812,
	10128,
	14765,
	9754,
	14712,
	9466,
	14764,
	13480,
	14764,
	13475,
	14766,
	13440,
	14766,
	13347,
	14769,
	13070,
	14786,
	12713,
	14816,
	12387,
	14844,
	11957,
	14860,
	11549,
	14868,
	11215,
	14855,
	10751,
	14825,
	10403,
	14782,
	10044,
	14729,
	9651,
	14666,
	9352,
	14599,
	9029,
	14967,
	12835,
	14966,
	12831,
	14963,
	12804,
	14954,
	12723,
	14936,
	12564,
	14917,
	12347,
	14900,
	11958,
	14886,
	11569,
	14878,
	11247,
	14859,
	10765,
	14828,
	10401,
	14784,
	10011,
	14727,
	9600,
	14660,
	9289,
	14586,
	8893,
	14508,
	8533,
	15111,
	12234,
	15110,
	12234,
	15104,
	12216,
	15092,
	12156,
	15067,
	12010,
	15028,
	11776,
	14981,
	11500,
	14942,
	11205,
	14902,
	10752,
	14861,
	10393,
	14812,
	9991,
	14752,
	9570,
	14682,
	9252,
	14603,
	8808,
	14519,
	8445,
	14431,
	8145,
	15209,
	11449,
	15208,
	11451,
	15202,
	11451,
	15190,
	11438,
	15163,
	11384,
	15117,
	11274,
	15055,
	10979,
	14994,
	10648,
	14932,
	10343,
	14871,
	9936,
	14803,
	9532,
	14729,
	9218,
	14645,
	8742,
	14556,
	8381,
	14461,
	8020,
	14365,
	7603,
	15273,
	10603,
	15272,
	10607,
	15267,
	10619,
	15256,
	10631,
	15231,
	10614,
	15182,
	10535,
	15118,
	10389,
	15042,
	10167,
	14963,
	9787,
	14883,
	9447,
	14800,
	9115,
	14710,
	8665,
	14615,
	8318,
	14514,
	7911,
	14411,
	7507,
	14279,
	7198,
	15314,
	9675,
	15313,
	9683,
	15309,
	9712,
	15298,
	9759,
	15277,
	9797,
	15229,
	9773,
	15166,
	9668,
	15084,
	9487,
	14995,
	9274,
	14898,
	8910,
	14800,
	8539,
	14697,
	8234,
	14590,
	7790,
	14479,
	7409,
	14367,
	7067,
	14178,
	6621,
	15337,
	8619,
	15337,
	8631,
	15333,
	8677,
	15325,
	8769,
	15305,
	8871,
	15264,
	8940,
	15202,
	8909,
	15119,
	8775,
	15022,
	8565,
	14916,
	8328,
	14804,
	8009,
	14688,
	7614,
	14569,
	7287,
	14448,
	6888,
	14321,
	6483,
	14088,
	6171,
	15350,
	7402,
	15350,
	7419,
	15347,
	7480,
	15340,
	7613,
	15322,
	7804,
	15287,
	7973,
	15229,
	8057,
	15148,
	8012,
	15046,
	7846,
	14933,
	7611,
	14810,
	7357,
	14682,
	7069,
	14552,
	6656,
	14421,
	6316,
	14251,
	5948,
	14007,
	5528,
	15356,
	5942,
	15356,
	5977,
	15353,
	6119,
	15348,
	6294,
	15332,
	6551,
	15302,
	6824,
	15249,
	7044,
	15171,
	7122,
	15070,
	7050,
	14949,
	6861,
	14818,
	6611,
	14679,
	6349,
	14538,
	6067,
	14398,
	5651,
	14189,
	5311,
	13935,
	4958,
	15359,
	4123,
	15359,
	4153,
	15356,
	4296,
	15353,
	4646,
	15338,
	5160,
	15311,
	5508,
	15263,
	5829,
	15188,
	6042,
	15088,
	6094,
	14966,
	6001,
	14826,
	5796,
	14678,
	5543,
	14527,
	5287,
	14377,
	4985,
	14133,
	4586,
	13869,
	4257,
	15360,
	1563,
	15360,
	1642,
	15358,
	2076,
	15354,
	2636,
	15341,
	3350,
	15317,
	4019,
	15273,
	4429,
	15203,
	4732,
	15105,
	4911,
	14981,
	4932,
	14836,
	4818,
	14679,
	4621,
	14517,
	4386,
	14359,
	4156,
	14083,
	3795,
	13808,
	3437,
	15360,
	122,
	15360,
	137,
	15358,
	285,
	15355,
	636,
	15344,
	1274,
	15322,
	2177,
	15281,
	2765,
	15215,
	3223,
	15120,
	3451,
	14995,
	3569,
	14846,
	3567,
	14681,
	3466,
	14511,
	3305,
	14344,
	3121,
	14037,
	2800,
	13753,
	2467,
	15360,
	0,
	15360,
	1,
	15359,
	21,
	15355,
	89,
	15346,
	253,
	15325,
	479,
	15287,
	796,
	15225,
	1148,
	15133,
	1492,
	15008,
	1749,
	14856,
	1882,
	14685,
	1886,
	14506,
	1783,
	14324,
	1608,
	13996,
	1398,
	13702,
	1183
]), al = null;
function ol() {
	return al === null && (al = new Qr(il, 16, 16, j, v), al.name = "DFG_LUT", al.minFilter = c, al.magFilter = c, al.wrapS = r, al.wrapT = r, al.generateMipmaps = !1, al.needsUpdate = !0), al;
}
var sl = class {
	constructor(e = {}) {
		let { canvas: t = We(), context: n = null, depth: r = !0, stencil: i = !1, alpha: a = !1, antialias: o = !1, premultipliedAlpha: s = !0, preserveDrawingBuffer: c = !1, powerPreference: l = "default", failIfMajorPerformanceCaveat: f = !1, reversedDepthBuffer: p = !1, outputBufferType: h = d } = e;
		this.isWebGLRenderer = !0;
		let _;
		if (n !== null) {
			if (typeof WebGLRenderingContext < "u" && n instanceof WebGLRenderingContext) throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");
			_ = n.getContextAttributes().alpha;
		} else _ = a;
		let S = h, C = /* @__PURE__ */ new Set([
			N,
			M,
			A
		]), w = /* @__PURE__ */ new Set([
			d,
			g,
			m,
			x,
			y,
			b
		]), T = /* @__PURE__ */ new Uint32Array(4), E = /* @__PURE__ */ new Int32Array(4), D = {
			textures: [],
			min: [],
			max: [],
			resolution: []
		}, O = null, k = null, j = [], P = [], F = null;
		this.domElement = t, this.debug = {
			checkShaderErrors: !0,
			diagnostics: { keywords: !1 },
			onShaderError: null
		}, this.autoClear = !0, this.autoClearColor = !0, this.autoClearDepth = !0, this.autoClearStencil = !0, this.sortObjects = !0, this.clippingPlanes = [], this.localClippingEnabled = !1, this.toneMapping = 0, this.toneMappingExposure = 1, this.transmissionResolutionScale = 1;
		let I = this, L = !1, R = null, ee = null, te = null, z = null;
		this._outputColorSpace = Ne;
		let ne = 0, re = 0, B = null, ie = -1, ae = null, oe = new Ut(), se = new Ut(), ce = null, le = new Z(0), ue = 0, de = t.width, fe = t.height, pe = 1, me = null, he = null, ge = new Ut(0, 0, de, fe), _e = new Ut(0, 0, de, fe), ve = !1, ye = new ri(), be = new ai(), xe = !1, Se = !1, Ce = new Jt(), we = new Y(), Te = new Ut(), Ee = {
			background: null,
			fog: null,
			environment: null,
			overrideMaterial: null,
			isScene: !0
		}, De = !1;
		function Oe() {
			return B === null ? pe : 1;
		}
		let V = n;
		function ke(e, n) {
			return t.getContext(e, n);
		}
		let Ae, je, H, Me, U, W, Pe, Fe, Ie, Le, Re, ze, Ve, He, Ue, Ge, qe, Je, Xe, Ze, Qe, $e, et;
		try {
			let e = {
				alpha: !0,
				depth: r,
				stencil: i,
				antialias: o,
				premultipliedAlpha: s,
				preserveDrawingBuffer: c,
				powerPreference: l,
				failIfMajorPerformanceCaveat: f
			};
			if ("setAttribute" in t && t.setAttribute("data-engine", "three.js r187"), t.addEventListener("webglcontextlost", q, !1), t.addEventListener("webglcontextrestored", rt, !1), t.addEventListener("webglcontextcreationerror", it, !1), V === null) {
				let t = "webgl2";
				if (V = ke(t, e), V === null) throw ke(t) ? Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.") : Error("THREE.WebGLRenderer: Error creating WebGL context.");
			}
			tt();
		} catch (e) {
			throw t.removeEventListener("webglcontextlost", q, !1), t.removeEventListener("webglcontextrestored", rt, !1), t.removeEventListener("webglcontextcreationerror", it, !1), K("WebGLRenderer: " + e.message), e;
		}
		function tt() {
			Ae = new Do(V), Ae.init(), Qe = new Yc(V, Ae), je = new oo(V, Ae, e, Qe), H = new qc(V, Ae), je.reversedDepthBuffer && p && H.buffers.depth.setReversed(!0), ee = V.createFramebuffer(), te = V.createFramebuffer(), z = V.createFramebuffer(), Me = new Ao(V), U = new Dc(), W = new Jc(V, Ae, H, U, je, Qe, Me), Pe = new Eo(I), Fe = new Za(V), $e = new io(V, Fe), Ie = new Oo(V, Fe, Me, $e), Le = new Mo(V, Ie, Fe, $e, Me), Je = new jo(V, je, W), Ue = new so(U), Re = new Ec(I, Pe, Ae, je, $e, Ue), ze = new nl(I, U), Ve = new jc(), He = new Rc(Ae), qe = new ro(I, Pe, H, Le, _, s), Ge = new Kc(I, Le, je), et = new rl(V, Me, je, H), Xe = new ao(V, Ae, Me), Ze = new ko(V, Ae, Me), Me.programs = Re.programs, I.capabilities = je, I.extensions = Ae, I.properties = U, I.renderLists = Ve, I.shadowMap = Ge, I.state = H, I.info = Me;
		}
		S !== 1009 && (F = new Po(S, t.width, t.height, o, r, i));
		let nt = new $c(I, V);
		this.xr = nt, this.getContext = function() {
			return V;
		}, this.getContextAttributes = function() {
			return V.getContextAttributes();
		}, this.forceContextLoss = function() {
			let e = Ae.get("WEBGL_lose_context");
			e && e.loseContext();
		}, this.forceContextRestore = function() {
			let e = Ae.get("WEBGL_lose_context");
			e && e.restoreContext();
		}, this.getPixelRatio = function() {
			return pe;
		}, this.setPixelRatio = function(e) {
			e !== void 0 && (pe = e, this.setSize(de, fe, !1));
		}, this.getSize = function(e) {
			return e.set(de, fe);
		}, this.setSize = function(e, n, r = !0) {
			nt.isPresenting ? G("WebGLRenderer: Can't change size while VR device is presenting.") : (de = e, fe = n, t.width = Math.floor(e * pe), t.height = Math.floor(n * pe), r === !0 && (t.style.width = e + "px", t.style.height = n + "px"), F !== null && F.setSize(t.width, t.height), this.setViewport(0, 0, e, n));
		}, this.getDrawingBufferSize = function(e) {
			return e.set(de * pe, fe * pe).floor();
		}, this.setDrawingBufferSize = function(e, n, r) {
			de = e, fe = n, pe = r, t.width = Math.floor(e * r), t.height = Math.floor(n * r), this.setViewport(0, 0, e, n);
		}, this.setEffects = function(e) {
			if (S === 1009) K("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");
			else {
				if (e) {
					for (let t = 0; t < e.length; t++) if (e[t].isOutputPass === !0) {
						G("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");
						break;
					}
				}
				F.setEffects(e || []);
			}
		}, this.getCurrentViewport = function(e) {
			return e.copy(oe);
		}, this.getViewport = function(e) {
			return e.copy(ge);
		}, this.setViewport = function(e, t, n, r) {
			e.isVector4 ? ge.set(e.x, e.y, e.z, e.w) : ge.set(e, t, n, r), H.viewport(oe.copy(ge).multiplyScalar(Oe()).round());
		}, this.getScissor = function(e) {
			return e.copy(_e);
		}, this.setScissor = function(e, t, n, r) {
			e.isVector4 ? _e.set(e.x, e.y, e.z, e.w) : _e.set(e, t, n, r), H.scissor(se.copy(_e).multiplyScalar(Oe()).round());
		}, this.getScissorTest = function() {
			return ve;
		}, this.setScissorTest = function(e) {
			H.setScissorTest(ve = e);
		}, this.setOpaqueSort = function(e) {
			me = e;
		}, this.setTransparentSort = function(e) {
			he = e;
		}, this.getClearColor = function(e) {
			return e.copy(qe.getClearColor());
		}, this.setClearColor = function() {
			qe.setClearColor(...arguments);
		}, this.getClearAlpha = function() {
			return qe.getClearAlpha();
		}, this.setClearAlpha = function() {
			qe.setClearAlpha(...arguments);
		}, this.clear = function(e = !0, t = !0, n = !0) {
			let r = 0;
			if (e) {
				let e = !1;
				if (B !== null) {
					let t = B.texture.format;
					e = C.has(t);
				}
				if (e) {
					let e = B.texture.type, t = w.has(e), n = qe.getClearColor(), r = qe.getClearAlpha(), i = n.r, a = n.g, o = n.b;
					t ? (T[0] = i, T[1] = a, T[2] = o, T[3] = r, V.clearBufferuiv(V.COLOR, 0, T)) : (E[0] = i, E[1] = a, E[2] = o, E[3] = r, V.clearBufferiv(V.COLOR, 0, E));
				} else r |= V.COLOR_BUFFER_BIT;
			}
			t && (r |= V.DEPTH_BUFFER_BIT, this.state.buffers.depth.setMask(!0)), n && (r |= V.STENCIL_BUFFER_BIT, this.state.buffers.stencil.setMask(4294967295)), r !== 0 && V.clear(r);
		}, this.clearColor = function() {
			this.clear(!0, !1, !1);
		}, this.clearDepth = function() {
			this.clear(!1, !0, !1);
		}, this.clearStencil = function() {
			this.clear(!1, !1, !0);
		}, this.setNodesHandler = function(e) {
			e.setRenderer(this), R = e;
		}, this.dispose = function() {
			t.removeEventListener("webglcontextlost", q, !1), t.removeEventListener("webglcontextrestored", rt, !1), t.removeEventListener("webglcontextcreationerror", it, !1), qe.dispose(), Ve.dispose(), He.dispose(), W.dispose(), U.dispose(), Pe.dispose(), Le.dispose(), Ie.dispose(), $e.dispose(), et.dispose(), Re.dispose(), nt.dispose(), nt.removeEventListener("sessionstart", dt), nt.removeEventListener("sessionend", ft), pt.stop();
		};
		function q(e) {
			e.preventDefault(), Ke("WebGLRenderer: Context Lost."), L = !0;
		}
		function rt() {
			Ke("WebGLRenderer: Context Restored."), L = !1;
			let e = Me.autoReset, t = Ge.enabled, n = Ge.autoUpdate, r = Ge.needsUpdate, i = Ge.type;
			tt(), Me.autoReset = e, Ge.enabled = t, Ge.autoUpdate = n, Ge.needsUpdate = r, Ge.type = i;
		}
		function it(e) {
			K("WebGLRenderer: A WebGL context could not be created. Reason: ", e.statusMessage);
		}
		function at(e) {
			let t = e.target;
			t.removeEventListener("dispose", at), ot(t);
		}
		function ot(e) {
			st(e), U.remove(e);
		}
		function st(e) {
			let t = U.get(e).programs;
			t !== void 0 && (t.forEach(function(e) {
				Re.releaseProgram(e);
			}), e.isShaderMaterial && Re.releaseShaderCache(e));
		}
		this.renderBufferDirect = function(e, t, n, r, i, a) {
			t === null && (t = Ee);
			let o = i.isMesh && i.matrixWorld.determinantAffine() < 0, s = wt(e, t, n, r, i);
			H.setMaterial(r, o);
			let c = n.index, l = 1;
			if (r.wireframe === !0) {
				if (c = Ie.getWireframeAttribute(n), c === void 0) return;
				l = 2;
			}
			let u = n.drawRange, d = n.attributes.position, f = u.start * l, p = (u.start + u.count) * l;
			a !== null && (f = Math.max(f, a.start * l), p = Math.min(p, (a.start + a.count) * l)), c === null ? d != null && (f = Math.max(f, 0), p = Math.min(p, d.count)) : (f = Math.max(f, 0), p = Math.min(p, c.count));
			let m = p - f;
			if (m < 0 || m === Infinity) return;
			$e.setup(i, r, s, n, c);
			let h, g = Xe;
			if (c !== null && (h = Fe.get(c), g = Ze, g.setIndex(h)), i.isMesh) r.wireframe === !0 ? (H.setLineWidth(r.wireframeLinewidth * Oe()), g.setMode(V.LINES)) : g.setMode(V.TRIANGLES);
			else if (i.isLine) {
				let e = r.linewidth;
				e === void 0 && (e = 1), H.setLineWidth(e * Oe()), i.isLineSegments ? g.setMode(V.LINES) : i.isLineLoop ? g.setMode(V.LINE_LOOP) : g.setMode(V.LINE_STRIP);
			} else i.isPoints ? g.setMode(V.POINTS) : i.isSprite && g.setMode(V.TRIANGLES);
			if (i.isBatchedMesh) {
				if (Ae.get("WEBGL_multi_draw")) g.renderMultiDraw(i._multiDrawStarts, i._multiDrawCounts, i._multiDrawCount);
				else {
					let e = i._multiDrawStarts, t = i._multiDrawCounts, n = i._multiDrawCount, a = c ? Fe.get(c).bytesPerElement : 1, o = U.get(r).currentProgram.getUniforms();
					for (let r = 0; r < n; r++) o.setValue(V, "_gl_DrawID", r), g.render(e[r] / a, t[r]);
				}
			} else if (i.isInstancedMesh) g.renderInstances(f, m, i.count);
			else if (n.isInstancedBufferGeometry) {
				let e = n._maxInstanceCount === void 0 ? Infinity : n._maxInstanceCount, t = Math.min(n.instanceCount, e);
				g.renderInstances(f, m, t);
			} else g.render(f, m);
		};
		function ct(e, t, n, r) {
			R !== null && e.isNodeMaterial && R.setObject(r, e), xe === !0 && Ue.setState(e, n, !1), e.transparent === !0 && e.side === 2 && e.forceSinglePass === !1 ? (e.side = 1, e.needsUpdate = !0, bt(e, t, r), e.side = 0, e.needsUpdate = !0, bt(e, t, r), e.side = 2) : bt(e, t, r);
		}
		this.compile = function(e, t, n = null) {
			n === null && (n = e), R !== null && R.renderStart(e, t, n), k = He.get(n), k.init(t), P.push(k), n.traverseVisible(function(e) {
				e.isLight && e.layers.test(t.layers) && (k.pushLight(e), e.castShadow && k.pushShadow(e));
			}), e !== n && e.traverseVisible(function(e) {
				e.isLight && e.layers.test(t.layers) && (k.pushLight(e), e.castShadow && k.pushShadow(e));
			}), k.setupLights(), R !== null && R.updateLights(k.state.lightsArray), Se = this.localClippingEnabled, xe = Ue.init(this.clippingPlanes, Se), xe === !0 && Ue.setGlobalState(this.clippingPlanes, t), R !== null && Ge.render(k.state.shadowsArray, n, t);
			let r = /* @__PURE__ */ new Set();
			return e.traverse(function(e) {
				if (!(e.isMesh || e.isPoints || e.isLine || e.isSprite)) return;
				let i = e.material;
				if (i) {
					if (Array.isArray(i)) for (let a = 0; a < i.length; a++) {
						let o = i[a];
						ct(o, n, t, e), r.add(o);
					}
					else ct(i, n, t, e), r.add(i);
				}
			}), k = P.pop(), R !== null && R.renderEnd(), r;
		}, this.compileAsync = function(e, t, n = null) {
			let r = this.compile(e, t, n);
			return new Promise((t) => {
				function n() {
					r.forEach(function(e) {
						let t = U.get(e).currentProgram;
						(t === void 0 || t.isReady()) && r.delete(e);
					}), r.size === 0 ? t(e) : setTimeout(n, 10);
				}
				Ae.get("KHR_parallel_shader_compile") === null ? setTimeout(n, 10) : n();
			});
		};
		let lt = null;
		function ut(e) {
			lt && lt(e);
		}
		function dt() {
			pt.stop();
		}
		function ft() {
			pt.start();
		}
		let pt = new Xa();
		pt.setAnimationLoop(ut), typeof self < "u" && pt.setContext(self), this.setAnimationLoop = function(e) {
			lt = e, nt.setAnimationLoop(e), e === null ? pt.stop() : pt.start();
		}, nt.addEventListener("sessionstart", dt), nt.addEventListener("sessionend", ft), this.render = function(e, t) {
			if (t !== void 0 && t.isCamera !== !0) {
				K("WebGLRenderer.render: camera is not an instance of THREE.Camera.");
				return;
			}
			if (L === !0) return;
			R !== null && R.renderStart(e, t);
			let n = nt.enabled === !0 && nt.isPresenting === !0, r = F !== null && (B === null || n) && F.begin(I, B);
			if (e.matrixWorldAutoUpdate === !0 && e.updateMatrixWorld(), t.parent === null && t.matrixWorldAutoUpdate === !0 && t.updateMatrixWorld(), nt.enabled === !0 && nt.isPresenting === !0 && (F === null || F.isCompositing() === !1) && (nt.cameraAutoUpdate === !0 && nt.updateCamera(t), t = nt.getCamera()), e.isScene === !0 && e.onBeforeRender(I, e, t, B), k = He.get(e, P.length), k.init(t), k.state.textureUnits = W.getTextureUnits(), P.push(k), Ce.multiplyMatrices(t.projectionMatrix, t.matrixWorldInverse), t.isArrayCamera ? be.setFromArrayCamera(t) : ye.setFromProjectionMatrix(Ce, Be, t.reversedDepth), Se = this.localClippingEnabled, xe = Ue.init(this.clippingPlanes, Se), O = Ve.get(e, j.length), O.init(), j.push(O), this.info.render.frame++, nt.enabled === !0 && nt.isPresenting === !0) {
				let e = I.xr.getDepthSensingMesh();
				e !== null && mt(e, t, -Infinity, I.sortObjects);
			}
			mt(e, t, 0, I.sortObjects), O.finish(), R !== null && R.updateLights(k.state.lightsArray), I.sortObjects === !0 && O.sort(me, he), De = nt.enabled === !1 || nt.isPresenting === !1 || nt.hasDepthSensing() === !1, De && qe.addToRenderList(O, e), this.info.autoReset === !0 && this.info.reset(), xe === !0 && Ue.beginShadows();
			let i = k.state.shadowsArray;
			if (Ge.render(i, e, t), xe === !0 && Ue.endShadows(), (r && F.hasRenderPass()) === !1) {
				let n = O.opaque, r = O.transmissive;
				if (k.setupLights(), t.isArrayCamera) {
					let i = t.cameras;
					if (r.length > 0) for (let t = 0, a = i.length; t < a; t++) {
						let a = i[t];
						gt(n, r, e, a);
					}
					De && qe.render(e);
					for (let t = 0, n = i.length; t < n; t++) {
						let n = i[t];
						ht(O, e, n, n.viewport);
					}
				} else r.length > 0 && gt(n, r, e, t), De && qe.render(e), ht(O, e, t);
			}
			B !== null && re === 0 && (W.updateMultisampleRenderTarget(B), W.updateRenderTargetMipmap(B)), r && F.end(I), e.isScene === !0 && e.onAfterRender(I, e, t), $e.resetDefaultState(), ie = -1, ae = null, P.pop(), P.length > 0 ? (k = P[P.length - 1], W.setTextureUnits(k.state.textureUnits), xe === !0 && Ue.setGlobalState(I.clippingPlanes, k.state.camera)) : k = null, j.pop(), O = j.length > 0 ? j[j.length - 1] : null, R !== null && R.renderEnd();
		};
		function mt(e, t, n, r) {
			if (e.visible === !1) return;
			if (e.layers.test(t.layers)) {
				if (e.isGroup) n = e.renderOrder;
				else if (e.isLOD) e.autoUpdate === !0 && e.update(t);
				else if (e.isLight) k.pushLight(e), e.castShadow && k.pushShadow(e);
				else if (e.isSprite) {
					let i = t.isArrayCamera ? be : ye;
					if (!e.frustumCulled || e.intersectsFrustum(i)) {
						r && Te.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ce);
						let i = Le.update(e), a = e.material;
						a.visible && O.push(e, i, a, n, Te.z, null, t);
					}
				} else if (e.isMesh || e.isLine || e.isPoints) {
					let i = t.isArrayCamera ? be : ye;
					if (!e.frustumCulled || e.intersectsFrustum(i)) {
						let i = Le.update(e), a = e.material;
						if (r && (e.boundingSphere === void 0 ? (i.boundingSphere === null && i.computeBoundingSphere(), Te.copy(i.boundingSphere.center)) : (e.boundingSphere === null && e.computeBoundingSphere(), Te.copy(e.boundingSphere.center)), Te.applyMatrix4(e.matrixWorld).applyMatrix4(Ce)), Array.isArray(a)) {
							let r = i.groups;
							for (let o = 0, s = r.length; o < s; o++) {
								let s = r[o], c = a[s.materialIndex];
								c && c.visible && O.push(e, i, c, n, Te.z, s, t);
							}
						} else a.visible && O.push(e, i, a, n, Te.z, null, t);
					}
				}
			}
			let i = e.children;
			for (let e = 0, a = i.length; e < a; e++) mt(i[e], t, n, r);
		}
		function ht(e, t, n, r) {
			let { opaque: i, transmissive: a, transparent: o } = e;
			k.setupLightsView(n), xe === !0 && Ue.setGlobalState(I.clippingPlanes, n), r && H.viewport(oe.copy(r)), i.length > 0 && _t(i, t, n), a.length > 0 && _t(a, t, n), o.length > 0 && _t(o, t, n), H.buffers.depth.setTest(!0), H.buffers.depth.setMask(!0), H.buffers.color.setMask(!0), H.setPolygonOffset(!1);
		}
		function gt(e, t, n, r) {
			if ((n.isScene === !0 ? n.overrideMaterial : null) !== null) return;
			if (k.state.transmissionRenderTarget[r.id] === void 0) {
				let e = Ae.has("EXT_color_buffer_half_float") || Ae.has("EXT_color_buffer_float");
				k.state.transmissionRenderTarget[r.id] = new Gt(1, 1, {
					generateMipmaps: !0,
					type: e ? v : d,
					minFilter: u,
					samples: Math.max(4, je.samples),
					stencilBuffer: i,
					resolveDepthBuffer: !1,
					resolveStencilBuffer: !1,
					storeMultisampledDepthBuffer: !1,
					storeMultisampledStencilBuffer: !1,
					colorSpace: Mt.workingColorSpace
				});
			}
			let a = k.state.transmissionRenderTarget[r.id], o = r.viewport || oe;
			a.setSize(o.z * I.transmissionResolutionScale, o.w * I.transmissionResolutionScale);
			let s = I.getRenderTarget(), c = I.getActiveCubeFace(), l = I.getActiveMipmapLevel();
			I.setRenderTarget(a), I.getClearColor(le), ue = I.getClearAlpha(), ue < 1 && I.setClearColor(16777215, .5), I.clear(), De && qe.render(n);
			let f = I.toneMapping;
			I.toneMapping = 0;
			let p = r.viewport;
			if (r.viewport !== void 0 && (r.viewport = void 0), k.setupLightsView(r), xe === !0 && Ue.setGlobalState(I.clippingPlanes, r), _t(e, n, r), W.updateMultisampleRenderTarget(a), W.updateRenderTargetMipmap(a), Ae.has("WEBGL_multisampled_render_to_texture") === !1) {
				let e = !1;
				for (let i = 0, a = t.length; i < a; i++) {
					let { object: a, geometry: o, material: s, group: c } = t[i];
					if (s.side === 2 && a.layers.test(r.layers)) {
						let t = s.side;
						s.side = 1, s.needsUpdate = !0, vt(a, n, r, o, s, c), s.side = t, s.needsUpdate = !0, e = !0;
					}
				}
				e === !0 && (W.updateMultisampleRenderTarget(a), W.updateRenderTargetMipmap(a));
			}
			I.setRenderTarget(s, c, l), I.setClearColor(le, ue), p !== void 0 && (r.viewport = p), I.toneMapping = f;
		}
		function _t(e, t, n) {
			let r = t.isScene === !0 ? t.overrideMaterial : null;
			for (let i = 0, a = e.length; i < a; i++) {
				let a = e[i], { object: o, geometry: s, group: c } = a, l = a.material;
				l.allowOverride === !0 && r !== null && (l = r), o.layers.test(n.layers) && vt(o, t, n, s, l, c);
			}
		}
		function vt(e, t, n, r, i, a) {
			R !== null && i.isNodeMaterial && R.setObject(e, i), e.onBeforeRender(I, t, n, r, i, a), e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse, e.matrixWorld), e.normalMatrix.getNormalMatrix(e.modelViewMatrix), i.onBeforeRender(I, t, n, r, e, a), i.transparent === !0 && i.side === 2 && i.forceSinglePass === !1 ? (i.side = 1, i.needsUpdate = !0, I.renderBufferDirect(n, t, r, i, e, a), i.side = 0, i.needsUpdate = !0, I.renderBufferDirect(n, t, r, i, e, a), i.side = 2) : I.renderBufferDirect(n, t, r, i, e, a), e.onAfterRender(I, t, n, r, i, a);
		}
		function yt(e) {
			let t = 0;
			for (let n of e) n.texture !== null && t++;
			return t;
		}
		function bt(e, t, n) {
			t.isScene !== !0 && (t = Ee);
			let r = U.get(e), i = k.state.lights, a = k.state.shadowsArray, o = i.state.version, s = Re.getParameters(e, i.state, a, t, n, k.state.lightProbeGridArray), c = Re.getProgramCacheKey(s), l = r.programs;
			r.environment = e.isMeshStandardMaterial || e.isMeshLambertMaterial || e.isMeshPhongMaterial ? t.environment : null, r.fog = t.fog;
			let u = e.isMeshStandardMaterial || e.isMeshLambertMaterial && !e.envMap || e.isMeshPhongMaterial && !e.envMap;
			r.envMap = Pe.get(e.envMap || r.environment, u), r.envMapRotation = r.environment !== null && e.envMap === null ? t.environmentRotation : e.envMapRotation, l === void 0 && (e.addEventListener("dispose", at), l = /* @__PURE__ */ new Map(), r.programs = l, r.programVariants = /* @__PURE__ */ new Map());
			let d = l.get(c);
			if (d !== void 0) {
				if (r.currentProgram === d && r.lightsStateVersion === o) return Ct(e, s), d;
			} else s.uniforms = Re.getUniforms(e), R !== null && e.isNodeMaterial && R.build(e, n, s), e.onBeforeCompile(s, I), d = Re.acquireProgram(s, c), l.set(c, d), r.uniforms = s.uniforms;
			let f = r.uniforms;
			return (!e.isShaderMaterial && !e.isRawShaderMaterial || e.clipping === !0) && (f.clippingPlanes = Ue.uniform), Ct(e, s), r.needsLights = Tt(e), r.lightsStateVersion = o, r.needsLights && (f.ambientLightColor.value = i.state.ambient, f.lightProbe.value = i.state.probe, f.sunLights.value = i.state.sun, f.sunLightShadows.value = i.state.sunShadow, f.directionalLights.value = i.state.directional, f.directionalLightShadows.value = i.state.directionalShadow, f.spotLights.value = i.state.spot, f.spotLightShadows.value = i.state.spotShadow, f.rectAreaLights.value = i.state.rectArea, f.ltc_1.value = i.state.rectAreaLTC1, f.ltc_2.value = i.state.rectAreaLTC2, f.pointLights.value = i.state.point, f.pointLightShadows.value = i.state.pointShadow, f.hemisphereLights.value = i.state.hemi, f.sunShadowMatrix.value = i.state.sunShadowMatrix, f.sunShadowCascade.value = i.state.sunShadowCascade, f.directionalShadowMatrix.value = i.state.directionalShadowMatrix, f.spotLightMatrix.value = i.state.spotLightMatrix, f.spotLightMap.value = i.state.spotLightMap, f.pointShadowMatrix.value = i.state.pointShadowMatrix), r.numLightProbeGrids = yt(k.state.lightProbeGridArray), r.currentProgram = d, r.uniformsList = null, d;
		}
		function xt(e, t, n, r, i) {
			let a = U.get(e), o = a.currentProgram.id + "," + r + "," + i, s = a.programVariants.get(o);
			return s === void 0 ? (s = bt(e, t, n), a.programVariants.set(o, s)) : (a.currentProgram = s, a.uniformsList = null, a.outputColorSpace = r, a.toneMapping = i), s;
		}
		function St(e) {
			if (e.uniformsList === null) {
				let t = e.currentProgram.getUniforms();
				e.uniformsList = Us.seqWithValue(t.seq, e.uniforms);
			}
			return e.uniformsList;
		}
		function Ct(e, t) {
			let n = U.get(e);
			n.outputColorSpace = t.outputColorSpace, n.batching = t.batching, n.batchingColor = t.batchingColor, n.instancing = t.instancing, n.instancingColor = t.instancingColor, n.instancingMorph = t.instancingMorph, n.skinning = t.skinning, n.morphTargets = t.morphTargets, n.morphNormals = t.morphNormals, n.morphColors = t.morphColors, n.morphTargetsCount = t.morphTargetsCount, n.numClippingPlanes = t.numClippingPlanes, n.numIntersection = t.numClipIntersection, n.vertexAlphas = t.vertexAlphas, n.vertexTangents = t.vertexTangents, n.toneMapping = t.toneMapping;
		}
		function wt(e, t, n, r, i) {
			t.isScene !== !0 && (t = Ee), W.resetTextureUnits();
			let a = t.fog, o = r.isMeshStandardMaterial || r.isMeshLambertMaterial || r.isMeshPhongMaterial ? t.environment : null, s = B === null ? I.outputColorSpace : B.isXRRenderTarget === !0 ? B.texture.colorSpace : Mt.workingColorSpace, c = r.isMeshStandardMaterial || r.isMeshLambertMaterial && !r.envMap || r.isMeshPhongMaterial && !r.envMap, l = Pe.get(r.envMap || o, c), u = r.vertexColors === !0 && !!n.attributes.color && n.attributes.color.itemSize === 4, d = !!n.attributes.tangent && (!!r.normalMap || r.anisotropy > 0), f = !!n.morphAttributes.position, p = !!n.morphAttributes.normal, m = !!n.morphAttributes.color, h = 0;
			r.toneMapped && (B === null || B.isXRRenderTarget === !0) && (h = I.toneMapping);
			let g = n.morphAttributes.position || n.morphAttributes.normal || n.morphAttributes.color, _ = g === void 0 ? 0 : g.length, v = U.get(r), y = k.state.lights;
			if (xe === !0 && (Se === !0 || e !== ae)) {
				let t = e === ae && r.id === ie;
				Ue.setState(r, e, t);
			}
			let b = !1, x = !1;
			r.version === v.__version ? v.needsLights && v.lightsStateVersion !== y.state.version || i.isBatchedMesh && v.batching === !1 || !i.isBatchedMesh && v.batching === !0 || i.isBatchedMesh && v.batchingColor === !0 && i._colorsTexture === null || i.isBatchedMesh && v.batchingColor === !1 && i._colorsTexture !== null || i.isInstancedMesh && v.instancing === !1 || !i.isInstancedMesh && v.instancing === !0 || i.isSkinnedMesh && v.skinning === !1 || !i.isSkinnedMesh && v.skinning === !0 || i.isInstancedMesh && v.instancingColor === !0 && i.instanceColor === null || i.isInstancedMesh && v.instancingColor === !1 && i.instanceColor !== null || i.isInstancedMesh && v.instancingMorph === !0 && i.morphTexture === null || i.isInstancedMesh && v.instancingMorph === !1 && i.morphTexture !== null ? b = !0 : v.envMap === l ? r.fog === !0 && v.fog !== a || v.numClippingPlanes !== void 0 && (v.numClippingPlanes !== Ue.numPlanes || v.numIntersection !== Ue.numIntersection) ? b = !0 : v.vertexAlphas === u && v.vertexTangents === d && v.morphTargets === f && v.morphNormals === p && v.morphColors === m && v.morphTargetsCount === _ && v.numLightProbeGrids === yt(k.state.lightProbeGridArray) ? (v.outputColorSpace !== s || v.toneMapping !== h) && (x = !0) : b = !0 : b = !0 : (b = !0, v.__version = r.version);
			let S = v.currentProgram;
			(b === !0 || x === !0) && (S = x === !0 ? xt(r, t, i, s, h) : bt(r, t, i), R && r.isNodeMaterial && R.onUpdateProgram(r, S, v));
			let C = !1, w = !1, T = !1, E = S.getUniforms(), O = v.uniforms;
			if (H.useProgram(S.program) && (C = !0, w = !0, T = !0), r.id !== ie && (ie = r.id, w = !0), C || ae !== e) {
				H.buffers.depth.getReversed() && e.reversedDepth !== !0 && (e._reversedDepth = !0, e.updateProjectionMatrix()), E.setValue(V, "projectionMatrix", e.projectionMatrix), E.setValue(V, "viewMatrix", e.matrixWorldInverse);
				let t = E.map.cameraPosition;
				t !== void 0 && t.setValue(V, we.setFromMatrixPosition(e.matrixWorld)), je.logarithmicDepthBuffer && E.setValue(V, "logDepthBufFC", 2 / (Math.log(e.far + 1) / Math.LN2)), (r.isMeshPhongMaterial || r.isMeshToonMaterial || r.isMeshLambertMaterial || r.isMeshBasicMaterial || r.isMeshStandardMaterial || r.isShaderMaterial) && E.setValue(V, "isOrthographic", e.isOrthographicCamera === !0), ae !== e && (ae = e, w = !0, T = !0);
			}
			if (v.needsLights && (y.state.sunShadowMap.length > 0 && E.setValue(V, "sunShadowMap", y.state.sunShadowMap, W), y.state.directionalShadowMap.length > 0 && E.setValue(V, "directionalShadowMap", y.state.directionalShadowMap, W), y.state.spotShadowMap.length > 0 && E.setValue(V, "spotShadowMap", y.state.spotShadowMap, W), y.state.pointShadowMap.length > 0 && E.setValue(V, "pointShadowMap", y.state.pointShadowMap, W)), i.isSkinnedMesh) {
				E.setOptional(V, i, "bindMatrix"), E.setOptional(V, i, "bindMatrixInverse");
				let e = i.skeleton;
				e && (e.boneTexture === null && e.computeBoneTexture(), E.setValue(V, "boneTexture", e.boneTexture, W));
			}
			i.isBatchedMesh && (E.setOptional(V, i, "batchingTexture"), E.setValue(V, "batchingTexture", i._matricesTexture, W), E.setOptional(V, i, "batchingIdTexture"), E.setValue(V, "batchingIdTexture", i._indirectTexture, W), E.setOptional(V, i, "batchingColorTexture"), i._colorsTexture !== null && E.setValue(V, "batchingColorTexture", i._colorsTexture, W));
			let A = n.morphAttributes;
			if ((A.position !== void 0 || A.normal !== void 0 || A.color !== void 0) && Je.update(i, n, S), (w || v.receiveShadow !== i.receiveShadow) && (v.receiveShadow = i.receiveShadow, E.setValue(V, "receiveShadow", i.receiveShadow)), (r.isMeshStandardMaterial || r.isMeshLambertMaterial || r.isMeshPhongMaterial) && r.envMap === null && t.environment !== null && (O.envMapIntensity.value = t.environmentIntensity), O.dfgLUT !== void 0 && (O.dfgLUT.value = ol()), w) {
				if (E.setValue(V, "toneMappingExposure", I.toneMappingExposure), v.needsLights && J(O, T), a && r.fog === !0 && ze.refreshFogUniforms(O, a), ze.refreshMaterialUniforms(O, r, pe, fe, k.state.transmissionRenderTarget[e.id]), v.needsLights && v.numLightProbeGrids > 0) {
					let e = D, t = 0;
					for (let n of k.state.lightProbeGridArray) n.texture !== null && (e.textures[t] = n.texture, e.min[t] = n.boundingBox.min, e.max[t] = n.boundingBox.max, e.resolution[t] = n.resolution, t++);
					for (let n in e) e[n].length = t;
					O.probesSH.value = e.textures, O.probesMin.value = e.min, O.probesMax.value = e.max, O.probesResolution.value = e.resolution;
				}
				Us.upload(V, St(v), O, W);
			}
			if (r.isShaderMaterial && r.uniformsNeedUpdate === !0 && (Us.upload(V, St(v), O, W), r.uniformsNeedUpdate = !1), r.isSpriteMaterial && E.setValue(V, "center", i.center), E.setValue(V, "modelViewMatrix", i.modelViewMatrix), E.setValue(V, "normalMatrix", i.normalMatrix), E.setValue(V, "modelMatrix", i.matrixWorld), r.uniformsGroups !== void 0) {
				let e = r.uniformsGroups;
				for (let t = 0, n = e.length; t < n; t++) {
					let n = e[t];
					et.update(n, S), et.bind(n, S);
				}
			}
			return S;
		}
		function J(e, t) {
			e.ambientLightColor.needsUpdate = t, e.lightProbe.needsUpdate = t, e.sunLights.needsUpdate = t, e.sunLightShadows.needsUpdate = t, e.directionalLights.needsUpdate = t, e.directionalLightShadows.needsUpdate = t, e.pointLights.needsUpdate = t, e.pointLightShadows.needsUpdate = t, e.spotLights.needsUpdate = t, e.spotLightShadows.needsUpdate = t, e.rectAreaLights.needsUpdate = t, e.hemisphereLights.needsUpdate = t;
		}
		function Tt(e) {
			return e.isMeshLambertMaterial || e.isMeshToonMaterial || e.isMeshPhongMaterial || e.isMeshStandardMaterial || e.isShadowMaterial || e.isShaderMaterial && e.lights === !0;
		}
		this.getActiveCubeFace = function() {
			return ne;
		}, this.getActiveMipmapLevel = function() {
			return re;
		}, this.getRenderTarget = function() {
			return B;
		}, this.setRenderTargetTextures = function(e, t, n) {
			let r = U.get(e);
			r.__autoAllocateDepthBuffer = e.resolveDepthBuffer === !1, r.__autoAllocateDepthBuffer === !1 && (r.__useRenderToTexture = !1), U.get(e.texture).__webglTexture = t, U.get(e.depthTexture).__webglTexture = r.__autoAllocateDepthBuffer ? void 0 : n, r.__hasExternalTextures = !0;
		}, this.setRenderTargetFramebuffer = function(e, t) {
			let n = U.get(e);
			n.__webglFramebuffer = t, n.__useDefaultFramebuffer = t === void 0;
		}, this.setRenderTarget = function(e, t = 0, n = 0) {
			B = e, ne = t, re = n;
			let r = null, i = !1, a = !1;
			if (e) {
				let o = U.get(e);
				if (o.__useDefaultFramebuffer !== void 0) {
					H.bindFramebuffer(V.FRAMEBUFFER, o.__webglFramebuffer), oe.copy(e.viewport), se.copy(e.scissor), ce = e.scissorTest, H.viewport(oe), H.scissor(se), H.setScissorTest(ce), ie = -1;
					return;
				}
				if (o.__webglFramebuffer === void 0) W.setupRenderTarget(e);
				else if (o.__hasExternalTextures) W.rebindTextures(e, U.get(e.texture).__webglTexture, U.get(e.depthTexture).__webglTexture);
				else if (e.depthBuffer) {
					let t = e.depthTexture;
					if (o.__boundDepthTexture !== t) {
						if (t !== null && U.has(t) && (e.width !== t.image.width || e.height !== t.image.height)) throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");
						W.setupDepthRenderbuffer(e);
					}
				}
				let s = e.texture;
				(s.isData3DTexture || s.isDataArrayTexture || s.isCompressedArrayTexture) && (a = !0);
				let c = U.get(e).__webglFramebuffer;
				e.isWebGLCubeRenderTarget ? (r = Array.isArray(c[t]) ? c[t][n] : c[t], i = !0) : r = e.samples > 0 && W.useMultisampledRTT(e) === !1 ? U.get(e).__webglMultisampledFramebuffer : Array.isArray(c) ? c[n] : c, oe.copy(e.viewport), se.copy(e.scissor), ce = e.scissorTest;
			} else oe.copy(ge).multiplyScalar(pe).floor(), se.copy(_e).multiplyScalar(pe).floor(), ce = ve;
			if (n !== 0 && (r = ee), H.bindFramebuffer(V.FRAMEBUFFER, r) && H.drawBuffers(e, r), H.viewport(oe), H.scissor(se), H.setScissorTest(ce), i) {
				let r = U.get(e.texture);
				V.framebufferTexture2D(V.FRAMEBUFFER, V.COLOR_ATTACHMENT0, V.TEXTURE_CUBE_MAP_POSITIVE_X + t, r.__webglTexture, n);
			} else if (a) {
				let r = t;
				for (let t = 0; t < e.textures.length; t++) {
					let i = U.get(e.textures[t]);
					V.framebufferTextureLayer(V.FRAMEBUFFER, V.COLOR_ATTACHMENT0 + t, i.__webglTexture, n, r);
				}
			} else if (e !== null && n !== 0) {
				let t = U.get(e.texture);
				V.framebufferTexture2D(V.FRAMEBUFFER, V.COLOR_ATTACHMENT0, V.TEXTURE_2D, t.__webglTexture, n);
			}
			ie = -1;
		};
		function Et(e) {
			let t = U.get(e);
			return (t.__readFormat !== e.format || t.__readType !== e.type) && (t.__readFormat = e.format, t.__readType = e.type, t.__formatReadable = je.textureFormatReadable(e.format), t.__typeReadable = je.textureTypeReadable(e.type)), t;
		}
		this.readRenderTargetPixels = function(e, t, n, r, i, a, o, s = 0) {
			if (!(e && e.isWebGLRenderTarget)) {
				K("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
				return;
			}
			let c = U.get(e).__webglFramebuffer;
			if (e.isWebGLCubeRenderTarget && o !== void 0 && (c = c[o], Array.isArray(c) && (c = c[0])), c) {
				H.bindFramebuffer(V.FRAMEBUFFER, c);
				try {
					let o = e.textures[s], c = o.format, l = o.type;
					e.textures.length > 1 && V.readBuffer(V.COLOR_ATTACHMENT0 + s);
					let u = Et(o);
					if (u.__formatReadable === !1) {
						K("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");
						return;
					}
					if (u.__typeReadable === !1) {
						K("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");
						return;
					}
					t >= 0 && t <= e.width - r && n >= 0 && n <= e.height - i && V.readPixels(t, n, r, i, Qe.convert(c), Qe.convert(l), a);
				} finally {
					let e = B === null ? null : U.get(B).__webglFramebuffer;
					H.bindFramebuffer(V.FRAMEBUFFER, e);
				}
			}
		}, this.readRenderTargetPixelsAsync = async function(e, t, n, r, i, a, o, s = 0) {
			if (!(e && e.isWebGLRenderTarget)) throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
			let c = U.get(e).__webglFramebuffer;
			if (e.isWebGLCubeRenderTarget && o !== void 0 && (c = c[o], Array.isArray(c) && (c = c[0])), c) {
				if (t >= 0 && t <= e.width - r && n >= 0 && n <= e.height - i) {
					H.bindFramebuffer(V.FRAMEBUFFER, c);
					let o = e.textures[s], l = o.format, u = o.type;
					e.textures.length > 1 && V.readBuffer(V.COLOR_ATTACHMENT0 + s);
					let d = Et(o);
					if (d.__formatReadable === !1) throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");
					if (d.__typeReadable === !1) throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");
					let f = V.createBuffer();
					V.bindBuffer(V.PIXEL_PACK_BUFFER, f), V.bufferData(V.PIXEL_PACK_BUFFER, a.byteLength, V.STREAM_READ), V.readPixels(t, n, r, i, Qe.convert(l), Qe.convert(u), 0), V.bindBuffer(V.PIXEL_PACK_BUFFER, null);
					let p = B === null ? null : U.get(B).__webglFramebuffer;
					H.bindFramebuffer(V.FRAMEBUFFER, p);
					let m = V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE, 0);
					return V.flush(), await Ye(V, m, 4), V.bindBuffer(V.PIXEL_PACK_BUFFER, f), V.getBufferSubData(V.PIXEL_PACK_BUFFER, 0, a), V.bindBuffer(V.PIXEL_PACK_BUFFER, null), V.deleteBuffer(f), V.deleteSync(m), a;
				}
				throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.");
			}
		}, this.copyFramebufferToTexture = function(e, t = null, n = 0) {
			let r = 2 ** -n, i = Math.floor(e.image.width * r), a = Math.floor(e.image.height * r), o = t === null ? 0 : t.x, s = t === null ? 0 : t.y;
			W.setTexture2D(e, 0), V.copyTexSubImage2D(V.TEXTURE_2D, n, 0, 0, o, s, i, a), H.unbindTexture();
		}, this.copyTextureToTexture = function(e, t, n = null, r = null, i = 0, a = 0) {
			let o, s, c, l, u, d, f, p, m, h = e.isCompressedTexture ? e.mipmaps[a] : e.image;
			if (n !== null) o = n.max.x - n.min.x, s = n.max.y - n.min.y, c = n.isBox3 ? n.max.z - n.min.z : 1, l = n.min.x, u = n.min.y, d = n.isBox3 ? n.min.z : 0;
			else {
				let t = 2 ** -i;
				o = Math.floor(h.width * t), s = Math.floor(h.height * t), c = e.isDataArrayTexture ? h.depth : e.isData3DTexture ? Math.floor(h.depth * t) : 1, l = 0, u = 0, d = 0;
			}
			r === null ? (f = 0, p = 0, m = 0) : (f = r.x, p = r.y, m = r.z);
			let g = Qe.convert(t.format), _ = Qe.convert(t.type), v;
			t.isData3DTexture ? (W.setTexture3D(t, 0), v = V.TEXTURE_3D) : t.isDataArrayTexture || t.isCompressedArrayTexture ? (W.setTexture2DArray(t, 0), v = V.TEXTURE_2D_ARRAY) : (W.setTexture2D(t, 0), v = V.TEXTURE_2D), H.activeTexture(V.TEXTURE0), H.pixelStorei(V.UNPACK_FLIP_Y_WEBGL, t.flipY), H.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL, t.premultiplyAlpha), H.pixelStorei(V.UNPACK_ALIGNMENT, t.unpackAlignment);
			let y = H.getParameter(V.UNPACK_ROW_LENGTH), b = H.getParameter(V.UNPACK_IMAGE_HEIGHT), x = H.getParameter(V.UNPACK_SKIP_PIXELS), S = H.getParameter(V.UNPACK_SKIP_ROWS), C = H.getParameter(V.UNPACK_SKIP_IMAGES);
			H.pixelStorei(V.UNPACK_ROW_LENGTH, h.width), H.pixelStorei(V.UNPACK_IMAGE_HEIGHT, h.height), H.pixelStorei(V.UNPACK_SKIP_PIXELS, l), H.pixelStorei(V.UNPACK_SKIP_ROWS, u), H.pixelStorei(V.UNPACK_SKIP_IMAGES, d);
			let w = e.isDataArrayTexture || e.isData3DTexture, T = t.isDataArrayTexture || t.isData3DTexture;
			if (e.isDepthTexture) {
				let n = U.get(e), r = U.get(t), h = U.get(n.__renderTarget), g = U.get(r.__renderTarget);
				H.bindFramebuffer(V.READ_FRAMEBUFFER, h.__webglFramebuffer), H.bindFramebuffer(V.DRAW_FRAMEBUFFER, g.__webglFramebuffer);
				for (let n = 0; n < c; n++) w && (V.framebufferTextureLayer(V.READ_FRAMEBUFFER, V.COLOR_ATTACHMENT0, U.get(e).__webglTexture, i, d + n), V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER, V.COLOR_ATTACHMENT0, U.get(t).__webglTexture, a, m + n)), V.blitFramebuffer(l, u, l + o, u + s, f, p, f + o, p + s, V.DEPTH_BUFFER_BIT, V.NEAREST);
				H.bindFramebuffer(V.READ_FRAMEBUFFER, null), H.bindFramebuffer(V.DRAW_FRAMEBUFFER, null);
			} else if (i !== 0 || e.isRenderTargetTexture || U.has(e)) {
				let n = U.get(e), r = U.get(t);
				H.bindFramebuffer(V.READ_FRAMEBUFFER, te), H.bindFramebuffer(V.DRAW_FRAMEBUFFER, z);
				for (let e = 0; e < c; e++) w ? V.framebufferTextureLayer(V.READ_FRAMEBUFFER, V.COLOR_ATTACHMENT0, n.__webglTexture, i, d + e) : V.framebufferTexture2D(V.READ_FRAMEBUFFER, V.COLOR_ATTACHMENT0, V.TEXTURE_2D, n.__webglTexture, i), T ? V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER, V.COLOR_ATTACHMENT0, r.__webglTexture, a, m + e) : V.framebufferTexture2D(V.DRAW_FRAMEBUFFER, V.COLOR_ATTACHMENT0, V.TEXTURE_2D, r.__webglTexture, a), i === 0 ? T ? V.copyTexSubImage3D(v, a, f, p, m + e, l, u, o, s) : V.copyTexSubImage2D(v, a, f, p, l, u, o, s) : V.blitFramebuffer(l, u, l + o, u + s, f, p, f + o, p + s, V.COLOR_BUFFER_BIT, V.NEAREST);
				H.bindFramebuffer(V.READ_FRAMEBUFFER, null), H.bindFramebuffer(V.DRAW_FRAMEBUFFER, null);
			} else T ? e.isDataTexture || e.isData3DTexture ? V.texSubImage3D(v, a, f, p, m, o, s, c, g, _, h.data) : t.isCompressedArrayTexture ? V.compressedTexSubImage3D(v, a, f, p, m, o, s, c, g, h.data) : V.texSubImage3D(v, a, f, p, m, o, s, c, g, _, h) : e.isDataTexture ? V.texSubImage2D(V.TEXTURE_2D, a, f, p, o, s, g, _, h.data) : e.isCompressedTexture ? V.compressedTexSubImage2D(V.TEXTURE_2D, a, f, p, h.width, h.height, g, h.data) : V.texSubImage2D(V.TEXTURE_2D, a, f, p, o, s, g, _, h);
			H.pixelStorei(V.UNPACK_ROW_LENGTH, y), H.pixelStorei(V.UNPACK_IMAGE_HEIGHT, b), H.pixelStorei(V.UNPACK_SKIP_PIXELS, x), H.pixelStorei(V.UNPACK_SKIP_ROWS, S), H.pixelStorei(V.UNPACK_SKIP_IMAGES, C), a === 0 && t.generateMipmaps === !0 && t.mipmapsAutoUpdate === !0 && V.generateMipmap(v), H.unbindTexture();
		}, this.initRenderTarget = function(e) {
			U.get(e).__webglFramebuffer === void 0 && W.setupRenderTarget(e);
		}, this.initTexture = function(e) {
			e.isCubeTexture ? W.setTextureCube(e, 0) : e.isData3DTexture ? W.setTexture3D(e, 0) : e.isDataArrayTexture || e.isCompressedArrayTexture ? W.setTexture2DArray(e, 0) : W.setTexture2D(e, 0), H.unbindTexture();
		}, this.resetState = function() {
			ne = 0, re = 0, B = null, H.reset(), $e.reset();
		}, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
	}
	get coordinateSystem() {
		return Be;
	}
	get outputColorSpace() {
		return this._outputColorSpace;
	}
	set outputColorSpace(e) {
		this._outputColorSpace = e;
		let t = this.getContext();
		t.drawingBufferColorSpace = Mt._getDrawingBufferColorSpace(e), t.unpackColorSpace = Mt._getUnpackColorSpace();
	}
}, cl = { type: "change" }, ll = { type: "start" }, ul = { type: "end" }, dl = new Ir(), fl = new kr(), pl = Math.cos(70 * wt.DEG2RAD), ml = new Y(), hl = 2 * Math.PI, gl = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
}, _l = 1e-6, vl = class extends qa {
	constructor(n, r = null) {
		super(n, r), this.state = gl.NONE, this.target = new Y(), this.cursor = new Y(), this.minDistance = 0, this.maxDistance = Infinity, this.minZoom = 0, this.maxZoom = Infinity, this.minTargetRadius = 0, this.maxTargetRadius = Infinity, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -Infinity, this.maxAzimuthAngle = Infinity, this.enableDamping = !1, this.dampingFactor = .05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		}, this.mouseButtons = {
			LEFT: e.ROTATE,
			MIDDLE: e.DOLLY,
			RIGHT: e.PAN
		}, this.touches = {
			ONE: t.ROTATE,
			TWO: t.DOLLY_PAN
		}, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new Y(), this._lastQuaternion = new Tt(), this._lastTargetPosition = new Y(), this._quat = new Tt().setFromUnitVectors(n.up, new Y(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Ga(), this._sphericalDelta = new Ga(), this._scale = 1, this._panOffset = new Y(), this._rotateStart = new J(), this._rotateEnd = new J(), this._rotateDelta = new J(), this._panStart = new J(), this._panEnd = new J(), this._panDelta = new J(), this._dollyStart = new J(), this._dollyEnd = new J(), this._dollyDelta = new J(), this._dollyDirection = new Y(), this._mouse = new J(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = bl.bind(this), this._onPointerDown = yl.bind(this), this._onPointerUp = xl.bind(this), this._onContextMenu = Ol.bind(this), this._onMouseWheel = wl.bind(this), this._onKeyDown = Tl.bind(this), this._onTouchStart = El.bind(this), this._onTouchMove = Dl.bind(this), this._onMouseDown = Sl.bind(this), this._onMouseMove = Cl.bind(this), this._interceptControlDown = kl.bind(this), this._interceptControlUp = Al.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
	}
	set cursorStyle(e) {
		this._cursorStyle = e, e === "grab" ? this.domElement.style.cursor = "grab" : this.domElement.style.cursor = "auto";
	}
	get cursorStyle() {
		return this._cursorStyle;
	}
	connect(e) {
		super.connect(e), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.ownerDocument.addEventListener("keydown", this._interceptControlDown, {
			passive: !0,
			capture: !0
		}), this.domElement.style.touchAction = "none";
	}
	disconnect() {
		this.state = gl.NONE, this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.ownerDocument.removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, { capture: !0 }), this._controlActive = !1, this._pointers.length = 0, this._pointerPositions = {}, this.domElement.style.touchAction = "", this.domElement.style.cursor = "auto";
	}
	dispose() {
		this.disconnect();
	}
	getPolarAngle() {
		return this._spherical.phi;
	}
	getAzimuthalAngle() {
		return this._spherical.theta;
	}
	getDistance() {
		return this.object.position.distanceTo(this.target);
	}
	listenToKeyEvents(e) {
		e.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = e;
	}
	stopListenToKeyEvents() {
		this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
	}
	saveState() {
		this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
	}
	reset() {
		this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(cl), this.update(), this.state = gl.NONE;
	}
	pan(e, t) {
		this._pan(e, t), this.update();
	}
	dollyIn(e) {
		this._dollyIn(e), this.update();
	}
	dollyOut(e) {
		this._dollyOut(e), this.update();
	}
	rotateLeft(e) {
		this._rotateLeft(e), this.update();
	}
	rotateUp(e) {
		this._rotateUp(e), this.update();
	}
	update(e = null) {
		let t = this.object.position;
		ml.copy(t).sub(this.target), ml.applyQuaternion(this._quat), this._spherical.setFromVector3(ml), this.autoRotate && this.state === gl.NONE && this._rotateLeft(this._getAutoRotationAngle(e)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
		let n = this.minAzimuthAngle, r = this.maxAzimuthAngle;
		isFinite(n) && isFinite(r) && (n < -Math.PI ? n += hl : n > Math.PI && (n -= hl), r < -Math.PI ? r += hl : r > Math.PI && (r -= hl), n <= r ? this._spherical.theta = Math.max(n, Math.min(r, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (n + r) / 2 ? Math.max(n, this._spherical.theta) : Math.min(r, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
		let i = !1;
		if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius);
		else {
			let e = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), i = e != this._spherical.radius;
		}
		if (ml.setFromSpherical(this._spherical), ml.applyQuaternion(this._quatInverse), t.copy(this.target).add(ml), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
			let e = null;
			if (this.object.isPerspectiveCamera) {
				let t = ml.length();
				e = this._clampDistance(t * this._scale);
				let n = t - e;
				this.object.position.addScaledVector(this._dollyDirection, n), this.object.updateMatrixWorld(), i = !!n;
			} else if (this.object.isOrthographicCamera) {
				let t = new Y(this._mouse.x, this._mouse.y, 0);
				t.unproject(this.object);
				let n = this.object.zoom;
				this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), i = n !== this.object.zoom;
				let r = new Y(this._mouse.x, this._mouse.y, 0);
				r.unproject(this.object), this.object.position.sub(r).add(t), this.object.updateMatrixWorld(), e = ml.length();
			} else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
			e !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position) : (dl.origin.copy(this.object.position), dl.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(dl.direction)) < pl ? this.object.lookAt(this.target) : (fl.setFromNormalAndCoplanarPoint(this.object.up, this.target), dl.intersectPlane(fl, this.target))));
		} else if (this.object.isOrthographicCamera) {
			let e = this.object.zoom;
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), e !== this.object.zoom && (this.object.updateProjectionMatrix(), i = !0);
		}
		return this._scale = 1, this._performCursorZoom = !1, i || this._lastPosition.distanceToSquared(this.object.position) > _l || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _l || this._lastTargetPosition.distanceToSquared(this.target) > _l ? (this.dispatchEvent(cl), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
	}
	_getAutoRotationAngle(e) {
		return e === null ? hl / 60 / 60 * this.autoRotateSpeed : hl / 60 * this.autoRotateSpeed * e;
	}
	_getZoomScale(e) {
		let t = Math.abs(e * .01);
		return .95 ** (this.zoomSpeed * t);
	}
	_rotateLeft(e) {
		this._sphericalDelta.theta -= e;
	}
	_rotateUp(e) {
		this._sphericalDelta.phi -= e;
	}
	_panLeft(e, t) {
		ml.setFromMatrixColumn(t, 0), ml.multiplyScalar(-e), this._panOffset.add(ml);
	}
	_panUp(e, t) {
		this.screenSpacePanning === !0 ? ml.setFromMatrixColumn(t, 1) : (ml.setFromMatrixColumn(t, 0), ml.crossVectors(this.object.up, ml)), ml.multiplyScalar(e), this._panOffset.add(ml);
	}
	_pan(e, t) {
		let n = this.domElement;
		if (this.object.isPerspectiveCamera) {
			let r = this.object.position;
			ml.copy(r).sub(this.target);
			let i = ml.length();
			i *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * e * i / n.clientHeight, this.object.matrix), this._panUp(2 * t * i / n.clientHeight, this.object.matrix);
		} else this.object.isOrthographicCamera ? (this._panLeft(e * (this.object.right - this.object.left) / this.object.zoom / n.clientWidth, this.object.matrix), this._panUp(t * (this.object.top - this.object.bottom) / this.object.zoom / n.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
	}
	_dollyOut(e) {
		this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
	}
	_dollyIn(e) {
		this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
	}
	_updateZoomParameters(e, t) {
		if (!this.zoomToCursor) return;
		this._performCursorZoom = !0;
		let n = this.domElement.getBoundingClientRect(), r = e - n.left, i = t - n.top, a = n.width, o = n.height;
		this._mouse.x = r / a * 2 - 1, this._mouse.y = -(i / o) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
	}
	_clampDistance(e) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, e));
	}
	_handleMouseDownRotate(e) {
		this._rotateStart.set(e.clientX, e.clientY);
	}
	_handleMouseDownDolly(e) {
		this._updateZoomParameters(e.clientX, e.clientY), this._dollyStart.set(e.clientX, e.clientY);
	}
	_handleMouseDownPan(e) {
		this._panStart.set(e.clientX, e.clientY);
	}
	_handleMouseMoveRotate(e) {
		this._rotateEnd.set(e.clientX, e.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		let t = this.domElement;
		this._rotateLeft(hl * this._rotateDelta.x / t.clientHeight), this._rotateUp(hl * this._rotateDelta.y / t.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
	}
	_handleMouseMoveDolly(e) {
		this._dollyEnd.set(e.clientX, e.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.zoomToCursor && (this._performCursorZoom = !0, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize()), this.update();
	}
	_handleMouseMovePan(e) {
		this._panEnd.set(e.clientX, e.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
	}
	_handleMouseWheel(e) {
		this._updateZoomParameters(e.clientX, e.clientY), e.deltaY < 0 ? this._dollyIn(this._getZoomScale(e.deltaY)) : e.deltaY > 0 && this._dollyOut(this._getZoomScale(e.deltaY)), this.update();
	}
	_handleKeyDown(e) {
		let t = !1;
		switch (e.code) {
			case this.keys.UP:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(hl * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), t = !0;
				break;
			case this.keys.BOTTOM:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(-hl * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), t = !0;
				break;
			case this.keys.LEFT:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(hl * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), t = !0;
				break;
			case this.keys.RIGHT: e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(-hl * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), t = !0;
		}
		t && (e.preventDefault(), this.update());
	}
	_handleTouchStartRotate(e) {
		if (this._pointers.length === 1) this._rotateStart.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._rotateStart.set(n, r);
		}
	}
	_handleTouchStartPan(e) {
		if (this._pointers.length === 1) this._panStart.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._panStart.set(n, r);
		}
	}
	_handleTouchStartDolly(e) {
		let t = this._getSecondPointerPosition(e), n = e.pageX - t.x, r = e.pageY - t.y, i = Math.sqrt(n * n + r * r);
		this._dollyStart.set(0, i);
	}
	_handleTouchStartDollyPan(e) {
		this.enableZoom && this._handleTouchStartDolly(e), this.enablePan && this._handleTouchStartPan(e);
	}
	_handleTouchStartDollyRotate(e) {
		this.enableZoom && this._handleTouchStartDolly(e), this.enableRotate && this._handleTouchStartRotate(e);
	}
	_handleTouchMoveRotate(e) {
		if (this._pointers.length == 1) this._rotateEnd.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._rotateEnd.set(n, r);
		}
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		let t = this.domElement;
		this._rotateLeft(hl * this._rotateDelta.x / t.clientHeight), this._rotateUp(hl * this._rotateDelta.y / t.clientHeight), this._rotateStart.copy(this._rotateEnd);
	}
	_handleTouchMovePan(e) {
		if (this._pointers.length === 1) this._panEnd.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._panEnd.set(n, r);
		}
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
	}
	_handleTouchMoveDolly(e) {
		let t = this._getSecondPointerPosition(e), n = e.pageX - t.x, r = e.pageY - t.y, i = Math.sqrt(n * n + r * r);
		this._dollyEnd.set(0, i), this._dollyDelta.set(0, (this._dollyEnd.y / this._dollyStart.y) ** +this.zoomSpeed), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
		let a = (e.pageX + t.x) * .5, o = (e.pageY + t.y) * .5;
		this._updateZoomParameters(a, o);
	}
	_handleTouchMoveDollyPan(e) {
		this.enableZoom && this._handleTouchMoveDolly(e), this.enablePan && this._handleTouchMovePan(e);
	}
	_handleTouchMoveDollyRotate(e) {
		this.enableZoom && this._handleTouchMoveDolly(e), this.enableRotate && this._handleTouchMoveRotate(e);
	}
	_addPointer(e) {
		this._pointers.push(e.pointerId);
	}
	_removePointer(e) {
		delete this._pointerPositions[e.pointerId];
		for (let t = 0; t < this._pointers.length; t++) if (this._pointers[t] == e.pointerId) {
			this._pointers.splice(t, 1);
			return;
		}
	}
	_isTrackingPointer(e) {
		for (let t = 0; t < this._pointers.length; t++) if (this._pointers[t] == e.pointerId) return !0;
		return !1;
	}
	_trackPointer(e) {
		let t = this._pointerPositions[e.pointerId];
		t === void 0 && (t = new J(), this._pointerPositions[e.pointerId] = t), t.set(e.pageX, e.pageY);
	}
	_getSecondPointerPosition(e) {
		let t = e.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[t];
	}
	_customWheelEvent(e) {
		let t = e.deltaMode, n = {
			clientX: e.clientX,
			clientY: e.clientY,
			deltaY: e.deltaY
		};
		switch (t) {
			case 1:
				n.deltaY *= 16;
				break;
			case 2: n.deltaY *= 100;
		}
		return e.ctrlKey && !this._controlActive && (n.deltaY *= 10), n;
	}
};
function yl(e) {
	this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), this._isTrackingPointer(e) || (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function bl(e) {
	this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function xl(e) {
	switch (this._removePointer(e), this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(e.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(ul), this.state = gl.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
			break;
		case 1:
			let t = this._pointers[0], n = this._pointerPositions[t];
			this._onTouchStart({
				pointerId: t,
				pageX: n.x,
				pageY: n.y
			});
	}
}
function Sl(t) {
	let n;
	switch (t.button) {
		case 0:
			n = this.mouseButtons.LEFT;
			break;
		case 1:
			n = this.mouseButtons.MIDDLE;
			break;
		case 2:
			n = this.mouseButtons.RIGHT;
			break;
		default: n = -1;
	}
	switch (n) {
		case e.DOLLY:
			if (this.enableZoom === !1) return;
			this._handleMouseDownDolly(t), this.state = gl.DOLLY;
			break;
		case e.ROTATE:
			if (t.ctrlKey || t.metaKey || t.shiftKey) {
				if (this.enablePan === !1) return;
				this._handleMouseDownPan(t), this.state = gl.PAN;
			} else {
				if (this.enableRotate === !1) return;
				this._handleMouseDownRotate(t), this.state = gl.ROTATE;
			}
			break;
		case e.PAN:
			if (t.ctrlKey || t.metaKey || t.shiftKey) {
				if (this.enableRotate === !1) return;
				this._handleMouseDownRotate(t), this.state = gl.ROTATE;
			} else {
				if (this.enablePan === !1) return;
				this._handleMouseDownPan(t), this.state = gl.PAN;
			}
			break;
		default: this.state = gl.NONE;
	}
	this.state !== gl.NONE && this.dispatchEvent(ll);
}
function Cl(e) {
	switch (this.state) {
		case gl.ROTATE:
			if (this.enableRotate === !1) return;
			this._handleMouseMoveRotate(e);
			break;
		case gl.DOLLY:
			if (this.enableZoom === !1) return;
			this._handleMouseMoveDolly(e);
			break;
		case gl.PAN:
			if (this.enablePan === !1) return;
			this._handleMouseMovePan(e);
	}
}
function wl(e) {
	this.enabled !== !1 && this.enableZoom !== !1 && this.state === gl.NONE && (e.preventDefault(), this.dispatchEvent(ll), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(ul));
}
function Tl(e) {
	this.enabled !== !1 && this._handleKeyDown(e);
}
function El(e) {
	switch (this._trackPointer(e), this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case t.ROTATE:
					if (this.enableRotate === !1) {
						this.state = gl.NONE;
						break;
					}
					this._handleTouchStartRotate(e), this.state = gl.TOUCH_ROTATE;
					break;
				case t.PAN:
					if (this.enablePan === !1) {
						this.state = gl.NONE;
						break;
					}
					this._handleTouchStartPan(e), this.state = gl.TOUCH_PAN;
					break;
				default: this.state = gl.NONE;
			}
			break;
		case 2:
			switch (this.touches.TWO) {
				case t.DOLLY_PAN:
					if (this.enableZoom === !1 && this.enablePan === !1) return;
					this._handleTouchStartDollyPan(e), this.state = gl.TOUCH_DOLLY_PAN;
					break;
				case t.DOLLY_ROTATE:
					if (this.enableZoom === !1 && this.enableRotate === !1) return;
					this._handleTouchStartDollyRotate(e), this.state = gl.TOUCH_DOLLY_ROTATE;
					break;
				default: this.state = gl.NONE;
			}
			break;
		default: this.state = gl.NONE;
	}
	this.state !== gl.NONE && this.dispatchEvent(ll);
}
function Dl(e) {
	switch (this._trackPointer(e), this.state) {
		case gl.TOUCH_ROTATE:
			if (this.enableRotate === !1) return;
			this._handleTouchMoveRotate(e), this.update();
			break;
		case gl.TOUCH_PAN:
			if (this.enablePan === !1) return;
			this._handleTouchMovePan(e), this.update();
			break;
		case gl.TOUCH_DOLLY_PAN:
			if (this.enableZoom === !1 && this.enablePan === !1) return;
			this._handleTouchMoveDollyPan(e), this.update();
			break;
		case gl.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === !1 && this.enableRotate === !1) return;
			this._handleTouchMoveDollyRotate(e), this.update();
			break;
		default: this.state = gl.NONE;
	}
}
function Ol(e) {
	this.enabled !== !1 && e.preventDefault();
}
function kl(e) {
	e.key === "Control" && (this._controlActive = !0, this.domElement.ownerDocument.addEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
function Al(e) {
	e.key === "Control" && (this._controlActive = !1, this.domElement.ownerDocument.removeEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
function jl(e, t, n = 0) {
	let r = (e ^ 2654435769) >>> 0;
	return r = Math.imul(r ^ t + 2135587861, 2246822507) >>> 0, r = Math.imul(r ^ r >>> 13 ^ n * 668265263, 3266489909) >>> 0, r ^= r >>> 16, r >>> 0;
}
function Ml(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
	return t >>> 0;
}
var Nl = class {
	s;
	constructor(e) {
		this.s = e >>> 0 || 1;
	}
	next() {
		let e = this.s = this.s + 1831565813 >>> 0;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	}
}, Pl = /* @__PURE__ */ new Map();
function Fl(e, t) {
	let n = `${e.rate}|${e.startDelay}|${e.stopAfter}|${t}|${e.bursts.map((e) => e.time + ":" + e.count).join(",")}`, r = Pl.get(n);
	if (r) return r;
	let i = [], a = Math.min(e.startDelay, t), o = e.stopAfter > 0 ? Math.min(e.stopAfter, t) : t;
	if (e.rate > 0 && o > a) {
		let t = Math.max(1, Math.round((o - a) * e.rate)), n = (o - a) / t;
		for (let e = 0; e < t; e++) i.push(a + (e + .5) * n);
	}
	for (let n of e.bursts) if (!(n.time < 0 || n.time >= t)) for (let e = 0; e < n.count; e++) i.push(n.time);
	i.sort((e, t) => e - t);
	let s = { times: Float64Array.from(i) };
	return Pl.size > 200 && Pl.clear(), Pl.set(n, s), s;
}
function Il(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] <= t ? n = i + 1 : r = i;
	}
	return n;
}
function Ll(e, t, n) {
	let r = new Nl(e ^ 2779096485), i = [];
	for (let e = 0; e < 5; e++) {
		let a = r.next() * Math.PI * 2, o = Math.PI * 2 / t * (.6 + r.next() * .9), s = [
			1,
			-1,
			2,
			-2,
			1
		][e];
		i.push({
			kx: Math.cos(a) * o,
			ky: Math.sin(a) * o,
			w: Math.PI * 2 / n * s,
			p: r.next() * Math.PI * 2
		});
	}
	return i;
}
var Rl = /* @__PURE__ */ new Map();
function zl(e) {
	let t = Rl.get(e);
	if (!t) {
		let n = parseInt(e.slice(1), 16);
		t = [
			n >> 16 & 255,
			n >> 8 & 255,
			n & 255
		], Rl.set(e, t);
	}
	return t;
}
function Bl(e, t, n) {
	switch (e) {
		case "easeOut": return 1 + (n - 1) * (1 - (1 - t) * (1 - t));
		case "easeIn": return 1 + (n - 1) * t * t;
		case "pop": return t < .12 ? t / .12 * 1.18 : t < .25 ? 1.18 - (t - .12) / .13 * .18 : t < .7 ? 1 : 1 + (n - 1) * ((t - .7) / .3);
		default: return 1 + (n - 1) * t;
	}
}
var Vl = 1 / 60, Hl = /* @__PURE__ */ new WeakMap();
function Ul(e, t, n) {
	let r = Hl.get(e);
	r || Hl.set(e, r = []);
	let i = r[t];
	return (!i || i.length < n * 9) && (i = new Float32Array(Math.max(n, 256) * 9 * 1.5), r[t] = i), i;
}
function Wl(e, t, n = Wl) {
	let r = e.duration, i = [];
	return e.layers.forEach((a, o) => {
		if (!a.visible) {
			i.push({
				emitter: a,
				count: 0,
				data: /* @__PURE__ */ new Float32Array()
			});
			return;
		}
		let s = Fl(a, r), c = jl(e.seed, Ml(a.id)), l = a.lifetime.max, u = a.maxParticles, d = Ul(n, o, Math.min(u, s.times.length * (Math.ceil(l / r) + 1))), f = a.turbulence > 0 ? Ll(c, a.turbulenceScale, r) : null, p = !f && a.vortex === 0 && a.attract === 0 && !a.floor, m = a.colors.map((e) => ({
			t: e.t,
			rgb: zl(e.color)
		})), h = 0, g = t - l, _ = e.loop === "perfect" ? -Math.ceil(l / r) - 1 : 0, v = e.loop === "perfect" ? Math.floor(t / r) : 0;
		for (let e = _; e <= v && h < u; e++) {
			let n = e * r;
			if (n + r <= g) continue;
			let i = Il(s.times, g - n), o = Il(s.times, t - n);
			for (let e = i; e < o && h < u; e++) {
				let r = n + s.times[e], i = t - r, o = new Nl(jl(c, e, 17)), l = a.lifetime.min + (a.lifetime.max - a.lifetime.min) * o.next();
				if (i >= l || i < 0) continue;
				let u = o.next(), g = o.next(), _ = o.next(), v = o.next(), y = o.next(), b = o.next(), x = o.next(), S = o.next(), C = o.next(), w = 0, T = 0, E = a.shapeW / 2;
				switch (a.shape) {
					case "circle": {
						let e = E * Math.sqrt(u);
						w = Math.cos(g * Math.PI * 2) * e, T = Math.sin(g * Math.PI * 2) * e;
						break;
					}
					case "ring":
						w = Math.cos(g * Math.PI * 2) * E, T = Math.sin(g * Math.PI * 2) * E;
						break;
					case "rect":
						w = (u - .5) * a.shapeW, T = (g - .5) * a.shapeH;
						break;
					case "line": w = (u - .5) * a.shapeW;
				}
				if (a.shapeAngle && (a.shape === "rect" || a.shape === "line")) {
					let e = a.shapeAngle * Math.PI / 180, t = Math.cos(e), n = Math.sin(e), r = w * t - T * n;
					T = w * n + T * t, w = r;
				}
				let D = a.direction;
				a.directionMode !== "angle" && (D = Math.hypot(w, T) > .001 ? Math.atan2(T, w) * 180 / Math.PI : b * 360, a.directionMode === "inward" && (D += 180)), D += (_ - .5) * a.spread;
				let O = D * Math.PI / 180, k = a.speed.min + (a.speed.max - a.speed.min) * v, A = Math.cos(O) * k, j = Math.sin(O) * k, M = a.x + w, N = a.y + T, P, F, I, L, R = a.gravityX, ee = a.gravityY, te = a.drag;
				if (p) {
					if (te > 1e-6) {
						let e = Math.exp(-te * i), t = (1 - e) / te;
						I = A * e + R / te * (1 - e), L = j * e + ee / te * (1 - e), P = M + (A - R / te) * t + R / te * i, F = N + (j - ee / te) * t + ee / te * i;
					} else I = A + R * i, L = j + ee * i, P = M + A * i + .5 * R * i * i, F = N + j * i + .5 * ee * i * i;
				} else {
					P = M, F = N, I = A, L = j;
					let e = Math.floor(i / Vl), t = i - e * Vl, n = Math.exp(-te * Vl);
					for (let i = 0; i <= e; i++) {
						let o = i < e ? Vl : t;
						if (o <= 0) break;
						let s = r + i * Vl, c = R, l = ee;
						if (f) {
							let e = 0, t = 0;
							for (let n = 0; n < f.length; n++) {
								let r = f[n], i = Math.cos(r.kx * P + r.ky * F + r.w * s + r.p);
								e += r.ky * i, t -= r.kx * i;
							}
							let n = a.turbulence * (a.turbulenceScale / (Math.PI * 2)) * .45;
							c += e * n, l += t * n;
						}
						if (a.vortex !== 0 || a.attract !== 0) {
							let e = P - a.x, t = F - a.y, n = Math.hypot(e, t) + 4;
							c += a.vortex * -t / n - a.attract * e / n, l += a.vortex * e / n - a.attract * t / n;
						}
						I += c * o, L += l * o;
						let u = o === Vl ? n : Math.exp(-te * o);
						I *= u, L *= u, P += I * o, F += L * o, a.floor && F > a.floorY && (F = a.floorY, L > 0 && (L = -L * a.bounce), I *= 1 - a.friction);
					}
				}
				let z = i / l, ne = a.sizeStart.min + (a.sizeStart.max - a.sizeStart.min) * y, re = Math.max(0, ne * Bl(a.sizeEase, z, a.sizeEnd)), B, ie, ae;
				if (m.length === 1 || z <= m[0].t) [B, ie, ae] = m[0].rgb;
				else if (z >= m[m.length - 1].t) [B, ie, ae] = m[m.length - 1].rgb;
				else {
					let e = 0;
					for (; e < m.length - 2 && z > m[e + 1].t;) e++;
					let t = m[e], n = m[e + 1];
					if (a.stepped) [B, ie, ae] = t.rgb;
					else {
						let e = (z - t.t) / Math.max(1e-6, n.t - t.t);
						B = t.rgb[0] + (n.rgb[0] - t.rgb[0]) * e, ie = t.rgb[1] + (n.rgb[1] - t.rgb[1]) * e, ae = t.rgb[2] + (n.rgb[2] - t.rgb[2]) * e;
					}
				}
				if (a.hueJitter > 0) {
					let e = (x - .5) * 2 * a.hueJitter * Math.PI / 180, t = Math.cos(e), n = Math.sin(e), r = (1 - t) / 3, i = Math.sqrt(1 / 3) * n, o = t + r, s = r - i, c = r + i, l = B * o + ie * s + ae * c, u = B * c + ie * o + ae * s, d = B * s + ie * c + ae * o;
					B = Math.min(255, Math.max(0, l)), ie = Math.min(255, Math.max(0, u)), ae = Math.min(255, Math.max(0, d));
				}
				let oe = a.alpha;
				if (a.fadeIn > 0 && z < a.fadeIn && (oe *= z / a.fadeIn), a.fadeOut > 0 && z > 1 - a.fadeOut && (oe *= (1 - z) / a.fadeOut), a.flicker > 0 && (oe *= 1 - a.flicker * (.5 + .5 * Math.sin(S * 6.283 + i * 27))), oe <= .003 || re <= .05) continue;
				let se, ce = 1;
				if (a.stretch > 0) {
					let e = Math.hypot(I, L);
					se = Math.atan2(L, I), ce = 1 + a.stretch * e / 200;
				} else {
					let e = a.spin.min + (a.spin.max - a.spin.min) * C;
					se = ((a.randomRotation ? b * 360 : 0) + e * i) * (Math.PI / 180);
				}
				let le = h * 9;
				d[le] = P, d[le + 1] = F, d[le + 2] = re, d[le + 3] = se, d[le + 4] = ce, d[le + 5] = B, d[le + 6] = ie, d[le + 7] = ae, d[le + 8] = oe, h++;
			}
		}
		i.push({
			emitter: a,
			count: h,
			data: d
		});
	}), i;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/math.ts
var Gl = class {
	s;
	constructor(e) {
		this.s = e >>> 0 || 1;
	}
	next() {
		let e = this.s = this.s + 1831565813 >>> 0;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	}
};
function Kl(e) {
	let t = Math.PI / 180, n = Math.cos(e.x * t), r = Math.sin(e.x * t), i = Math.cos(e.y * t), a = Math.sin(e.y * t), o = Math.cos(e.z * t), s = Math.sin(e.z * t), c = [
		o,
		-s,
		0,
		s,
		o,
		0,
		0,
		0,
		1
	], l = [
		1,
		0,
		0,
		0,
		n,
		-r,
		0,
		r,
		n
	];
	return ql([
		i,
		0,
		a,
		0,
		1,
		0,
		-a,
		0,
		i
	], ql(l, c));
}
function ql(e, t) {
	let n = Array(9).fill(0);
	for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) n[r * 3 + i] = e[r * 3] * t[i] + e[r * 3 + 1] * t[3 + i] + e[r * 3 + 2] * t[6 + i];
	return n;
}
var Jl = (e, t, n, r) => [
	e[0] * t + e[1] * n + e[2] * r,
	e[3] * t + e[4] * n + e[5] * r,
	e[6] * t + e[7] * n + e[8] * r
];
function Yl(e, t, n) {
	if (!Array.isArray(e)) return [];
	let r = e.map((e) => ({
		t: Number(e?.t),
		v: Number(e?.v)
	})).filter((e) => Number.isFinite(e.t) && Number.isFinite(e.v)).map((e) => ({
		t: Math.min(1, Math.max(0, e.t)),
		v: Math.min(n, Math.max(t, e.v))
	})).sort((e, t) => e.t - t.t), i = [];
	for (let e of r) {
		let t = i[i.length - 1];
		t && Math.abs(t.t - e.t) < 1e-6 ? t.v = e.v : i.push(e);
	}
	return i.length > 16 ? Ql(i, 16) : i;
}
function Xl(e, t) {
	if (t <= e[0].t) return e[0].v;
	let n = e.length;
	if (t >= e[n - 1].t) return e[n - 1].v;
	let r = 0;
	for (; r < n - 2 && t > e[r + 1].t;) r++;
	let i = e[r], a = e[r + 1];
	return i.v + (a.v - i.v) * (t - i.t) / Math.max(1e-9, a.t - i.t);
}
function Zl(e, t) {
	let n = Math.max(0, Math.min(1, t)), r = 0, i = 0, a = Xl(e, 0), o = e.map((e) => e.t).filter((e) => e > 0 && e < n);
	o.push(n);
	for (let t of o) {
		let n = Xl(e, t);
		r += (a + n) / 2 * (t - i), i = t, a = n;
	}
	return r + (t > 1 ? e[e.length - 1].v * (t - 1) : 0);
}
function Ql(e, t) {
	let n = e.slice();
	for (; n.length > t;) {
		let e = 1, t = Infinity;
		for (let r = 1; r < n.length - 1; r++) {
			let i = n[r - 1], a = n[r], o = n[r + 1], s = i.v + (o.v - i.v) * (a.t - i.t) / Math.max(1e-9, o.t - i.t), c = Math.abs(s - a.v) * (o.t - i.t);
			c < t && (t = c, e = r);
		}
		n.splice(e, 1);
	}
	return n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/schedule.ts
var $l = 1e-4, eu = /* @__PURE__ */ new Map();
function tu(e, t) {
	let n = `${e.id}|${e.rate}|${e.startDelay}|${e.stopAfter}|${t}|${JSON.stringify(e.rateCurve)}|${JSON.stringify(e.bursts)}`, r = eu.get(n);
	if (r) return r;
	let i = [], a = Math.min(e.startDelay, t), o = e.stopAfter > 0 ? Math.min(e.stopAfter, t) : t;
	if (e.rate > 0 && o > a) {
		if (e.rateCurve.length) nu(e, t, a, o, i);
		else {
			let t = Math.max(1, Math.round((o - a) * e.rate)), n = (o - a) / t;
			for (let e = 0; e < t; e++) i.push(Math.max(a, a + (e + 1) * n - $l));
		}
	}
	let s = Ml(e.id);
	e.bursts.forEach((e, n) => {
		let r = e.cycles ?? 1, a = e.interval ?? .1, o = e.probability ?? 1;
		for (let c = 0; c < r; c++) {
			let r = e.time + c * a;
			if (r < 0 || r >= t) break;
			if (!(o < 1 && jl(s, n * 131 + c) / 4294967296 >= o)) for (let t = 0; t < e.count; t++) i.push(r);
		}
	}), i.sort((e, t) => e - t);
	let c = Float64Array.from(i), l = new Int32Array(c.length), u = new Int32Array(c.length);
	for (let e = 0; e < c.length;) {
		let t = e;
		for (; t < c.length && c[t] === c[e];) t++;
		for (let n = e; n < t; n++) l[n] = n - e, u[n] = t - e;
		e = t;
	}
	let d = {
		times: c,
		index: l,
		count: u
	};
	return eu.size > 200 && eu.clear(), eu.set(n, d), d;
}
function nu(e, t, n, r, i) {
	let a = 2048, o = (r - n) / a, s = 0, c = 1;
	for (let r = 0; r < a; r++) {
		let a = n + r * o, l = e.rate * Xl(e.rateCurve, Math.min(1, (a + o / 2) / t)) * o;
		for (; l > 0 && s + l >= c;) i.push(Math.max(n, a + (c - s) / l * o - $l)), c += 1;
		s += l;
	}
}
function ru(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] <= t ? n = i + 1 : r = i;
	}
	return n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/layerTiming.ts
function iu(e, t) {
	return t.loopDuration > 0 ? t.loopDuration : e.duration;
}
function au(e, t, n, r) {
	let i = iu(e, t), a = t.startOffset, o, s;
	e.loop === "once" ? o = s = 0 : (s = Math.floor((r - a) / i), o = e.loop === "loop" ? 0 : Math.floor((n - a) / i) - 1);
	let c = [];
	for (let e = o; e <= s; e++) {
		let t = a + e * i;
		if (!(t + i <= n)) {
			if (t > r) break;
			c.push(t);
		}
	}
	return c;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/noise.ts
function ou(e, t, n, r, i = 1, a = .5, o = 2) {
	let s = new Gl(e ^ 1540483477), c = [];
	for (let e = 0; e < i; e++) c.push(...su(s, t * o ** +e, a ** +e, n, r));
	return c;
}
function su(e, t, n, r, i) {
	let a = [];
	for (let o = 0; o < 6; o++) {
		let s = e.next() * Math.PI * 2, c = Math.acos(2 * e.next() - 1), l = Math.PI * 2 * t * (.6 + e.next() * .8), u = [
			Math.sin(c) * Math.cos(s) * l,
			Math.cos(c) * l,
			Math.sin(c) * Math.sin(s) * l
		], d = e.next() - .5, f = e.next() - .5, p = e.next() - .5, m = Math.hypot(...u) || 1, h = (d * u[0] + f * u[1] + p * u[2]) / (m * m);
		d -= h * u[0], f -= h * u[1], p -= h * u[2];
		let g = Math.hypot(d, f, p) || 1, _ = o % 2 ? 1 : -1, v = r > 0 ? Math.max(1, Math.round(r * i)) : 1;
		a.push({
			k: u,
			a: [
				d / g * n,
				f / g * n,
				p / g * n
			],
			w: Math.PI * 2 / i * v * _,
			p: e.next() * Math.PI * 2
		});
	}
	return a;
}
var cu = Math.sqrt(3);
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/curves.ts
function lu(e, t, n) {
	switch (e) {
		case "easeOut": return 1 + (n - 1) * (1 - (1 - t) * (1 - t));
		case "easeIn": return 1 + (n - 1) * t * t;
		case "pop": return t < .12 ? t / .12 * 1.18 : t < .25 ? 1.18 - (t - .12) / .13 * .18 : t < .7 ? 1 : 1 + (n - 1) * ((t - .7) / .3);
		default: return 1 + (n - 1) * t;
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/shapes.ts
function uu(e, t, n) {
	let r = e.arc, i = t() * r;
	if (n && r > 0) {
		let t = 360 * e.arcSpeed * n.time;
		if (e.arcMode === "loop") i = (t % r + r) % r;
		else if (e.arcMode === "pingpong") {
			let e = (t / r % 2 + 2) % 2;
			i = r * (e <= 1 ? e : 2 - e);
		} else if (e.arcMode === "burstSpread") {
			let e = r >= 360 ? n.count : n.count - 1;
			i = e > 0 ? r * n.index / e : 0;
		}
	}
	if (e.arcSpread > 0 && r > 0) {
		let t = e.arcSpread * r;
		i = Math.floor(i / t + 1e-6) * t;
	}
	return i * Math.PI / 180;
}
function du(e, t, n) {
	let r = fu(e, t, n);
	if (e.shape === "box" || e.shape === "rectangle") return r;
	let { x: i, y: a, z: o } = e.boxSize;
	if (i === 1 && a === 1 && o === 1) return r;
	let s = r[3] * i, c = r[4] * a, l = r[5] * o, u = Math.hypot(s, c, l);
	return u > 1e-9 ? [
		r[0] * i,
		r[1] * a,
		r[2] * o,
		s / u,
		c / u,
		l / u
	] : [
		r[0] * i,
		r[1] * a,
		r[2] * o,
		0,
		0,
		1
	];
}
function fu(e, t, n) {
	let r = e.radius, i = e.radiusThickness, a = (e) => r * (1 - i * t()) ** (1 / e);
	switch (e.shape) {
		case "sphere":
		case "hemisphere": {
			let n = 2 * t() - 1, r = t() * Math.PI * 2, i = Math.sqrt(1 - n * n), o = i * Math.cos(r), s = i * Math.sin(r), c = n;
			e.shape === "hemisphere" && (c = Math.abs(c));
			let l = a(3);
			return [
				o * l,
				s * l,
				c * l,
				o,
				s,
				c
			];
		}
		case "circle": {
			let r = uu(e, t, n), i = a(2), o = Math.cos(r), s = Math.sin(r);
			return [
				o * i,
				s * i,
				0,
				o,
				s,
				0
			];
		}
		case "cone":
		case "coneVolume": {
			let i = uu(e, t, n), o = a(2), s = Math.tan(Math.min(e.angle, 89.9) * Math.PI / 180), c = Math.cos(i), l = Math.sin(i), u = r > 0 ? o / r * s : s * Math.sqrt(t()), d = Math.hypot(u, 1), f = c * u / d, p = l * u / d, m = 1 / d;
			if (e.shape === "cone") return [
				c * o,
				l * o,
				0,
				f,
				p,
				m
			];
			let h = t() * e.coneLength / Math.max(1e-6, m);
			return [
				c * o + f * h,
				l * o + p * h,
				m * h,
				f,
				p,
				m
			];
		}
		case "box": {
			let n = e.boxSize;
			return [
				(t() - .5) * n.x,
				(t() - .5) * n.y,
				(t() - .5) * n.z,
				0,
				0,
				1
			];
		}
		case "rectangle": {
			let n = e.boxSize;
			return [
				(t() - .5) * n.x,
				(t() - .5) * n.y,
				0,
				0,
				0,
				1
			];
		}
		case "donut": {
			let a = uu(e, t, n), o = Math.cos(a) * r, s = Math.sin(a) * r, c = t() * Math.PI * 2, l = e.donutRadius * Math.sqrt(1 - i * t()), u = Math.cos(a) * Math.cos(c), d = Math.sin(a) * Math.cos(c), f = Math.sin(c);
			return [
				o + u * l,
				s + d * l,
				f * l,
				u,
				d,
				f
			];
		}
		case "edge": return [
			(t() - .5) * 2 * r,
			0,
			0,
			0,
			1,
			0
		];
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/constants.ts
var pu = -9.81, mu = 1 / 60;
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/floorCollision.ts
function hu(e, t, n) {
	let r = e.floorY + .5 * e.collisionRadiusScale * n;
	if (t.y >= r) return -1;
	let i = Math.hypot(t.vx, t.vy, t.vz), a = 1 - e.dampen;
	return t.y = r + (r - t.y) * e.bounce * a, t.vy = -t.vy * e.bounce, t.vx *= a, t.vy *= a, t.vz *= a, i;
}
function gu(e, t, n, r, i) {
	return e.minKillSpeed > 0 && n < e.minKillSpeed || e.lifetimeLoss > 0 && i + r >= t.life;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/particle.ts
function _u(e, t, n, r, i = Kl(t.rotation)) {
	let [a, o, s] = Jl(i, t.orbitalOffset.x, t.orbitalOffset.y, t.orbitalOffset.z);
	return {
		em: t,
		M: i,
		cx: r.x + a,
		cy: r.y + o,
		cz: r.z + s,
		waves: t.noiseStrength > 0 ? ou(n, t.noiseFrequency, t.noiseScroll, e.duration, t.noiseOctaves, t.noiseOctaveMultiplier, t.noiseOctaveScale) : null,
		noiseK: t.noiseStrength * 1.28 * t.noiseFrequency ** .92 / cu,
		orb: t.orbital.x !== 0 || t.orbital.y !== 0 || t.orbital.z !== 0,
		axes: [
			Jl(i, 1, 0, 0),
			Jl(i, 0, 1, 0),
			Jl(i, 0, 0, 1)
		],
		fx: t.force.x,
		fy: t.force.y + pu * t.gravityModifier,
		fz: t.force.z,
		stops: t.colors.map((e) => ({
			t: e.t,
			rgb: zl(e.color)
		})),
		c1: zl(t.startColor),
		c2: zl(t.startColor2),
		startStops: t.startGradient.map((e) => ({
			t: e.t,
			rgb: zl(e.color)
		})),
		loop: iu(e, t),
		trailLife: t.trails ? t.trailLifetime : 0
	};
}
function vu(e, t, n) {
	return e.length ? Xl(e, n) : t;
}
function yu(e, t, n, r, i, a, o) {
	let s = e.em, c = () => t.next(), [l, u, d, f, p, m] = du(s, c, o), h = f, g = p, _ = m, v = 2 * c() - 1, y = c() * Math.PI * 2;
	if (s.randomDirection > 0) {
		let e = Math.sqrt(1 - v * v), t = s.randomDirection;
		h = f * (1 - t) + e * Math.cos(y) * t, g = p * (1 - t) + e * Math.sin(y) * t, _ = m * (1 - t) + v * t;
		let n = Math.hypot(h, g, _) || 1;
		h /= n, g /= n, _ /= n;
	}
	let b = s.startSpeed.min + (s.startSpeed.max - s.startSpeed.min) * c(), x = s.startSize.min + (s.startSize.max - s.startSize.min) * c(), S = s.startRotation.min + (s.startRotation.max - s.startRotation.min) * c(), C = s.spin.min + (s.spin.max - s.spin.min) * c(), w = c(), T = s.trails && c() < s.trailRatio && s.trailMode !== "ribbon", E = (e) => e.min + (e.max - e.min) * c(), D = s.startSize3D ? E(s.startSizeY) : x, O = s.startSize3D ? E(s.startSizeZ) : x, k = s.startRotation3D ? E(s.startRotationX) : 0, A = s.startRotation3D ? E(s.startRotationY) : 0, j = s.startRotation3D ? E(s.spinX) : 0, M = s.startRotation3D ? E(s.spinY) : 0;
	if (s.spherizeDirection > 0) {
		let e = Math.hypot(l, u, d);
		if (e > 1e-6) {
			let t = s.spherizeDirection;
			h = h * (1 - t) + l / e * t, g = g * (1 - t) + u / e * t, _ = _ * (1 - t) + d / e * t;
			let n = Math.hypot(h, g, _) || 1;
			h /= n, g /= n, _ /= n;
		}
	}
	s.alignToDirection && (k = -Math.asin(Math.max(-1, Math.min(1, g))) * 180 / Math.PI, A = Math.atan2(h, -_) * 180 / Math.PI);
	let N = s.flipRotation > 0 && c() < s.flipRotation ? -1 : 1, P = o ? o.time : 0, F = s.startGradientMode === "random" ? w : e.loop > 0 ? Math.min(1, Math.max(0, P / e.loop - Math.floor(P / e.loop + 1e-9))) : 0, [I, L, R] = Jl(e.M, l, u, d), [ee, te, z] = Jl(e.M, h * b, g * b, _ * b);
	return {
		x: I + n,
		y: L + r,
		z: R + i,
		vx: ee,
		vy: te,
		vz: z,
		ax: vu(s.velocityCurveX, s.velocity.x, 0),
		ay: vu(s.velocityCurveY, s.velocity.y, 0),
		az: vu(s.velocityCurveZ, s.velocity.z, 0),
		life: a,
		size0: x,
		rot0: S,
		spin: C,
		rotBySpeed: 0,
		cmix: w,
		cu: F,
		hasTrail: T,
		size0y: D,
		size0z: O,
		rx0: k,
		ry0: A,
		spinX: j,
		spinY: M,
		flip: N
	};
}
function bu(e, t) {
	let n = e.em.orbital, r = [
		n.x,
		n.y,
		n.z
	], i = t.x - e.cx, a = t.y - e.cy, o = t.z - e.cz, s = 0, c = 0, l = 0;
	for (let t = 0; t < 3; t++) {
		let n = r[t];
		if (!n) continue;
		let u = e.axes[t];
		s += n * (u[1] * o - u[2] * a), c += n * (u[2] * i - u[0] * o), l += n * (u[0] * a - u[1] * i);
	}
	return [
		s,
		c,
		l
	];
}
function xu(e, t, n, r, i) {
	let a = e.vx + t, o = e.vy + n, s = e.vz + r, c = Math.hypot(a, o, s), l = c > 1e-9 ? Math.max(0, c - i) / c : 0;
	e.vx = a * l - t, e.vy = o * l - n, e.vz = s * l - r;
}
function Su(e, t, n, r, i, a, o) {
	let s = e.vx + t, c = e.vy + n, l = e.vz + r, u = Math.hypot(s, c, l);
	if (u <= i || u < 1e-9) return;
	let d = (i + (u - i) * (1 - a) ** (o * 30)) / u;
	e.vx = s * d - t, e.vy = c * d - n, e.vz = l * d - r;
}
function Cu(e, t, n, r, i, a) {
	let o = e.em;
	t.vx += e.fx * r, t.vy += e.fy * r, t.vz += e.fz * r;
	let s = Math.min(1, Math.max(0, a)), c = vu(o.velocityCurveX, o.velocity.x, s), l = vu(o.velocityCurveY, o.velocity.y, s), u = vu(o.velocityCurveZ, o.velocity.z, s);
	if (o.radial !== 0) {
		let n = t.x - e.cx, r = t.y - e.cy, i = t.z - e.cz, a = Math.hypot(n, r, i);
		a > 1e-5 && (c += n / a * o.radial, l += r / a * o.radial, u += i / a * o.radial);
	}
	if (e.waves) {
		let r = 0, i = 0, a = 0;
		for (let o of e.waves) {
			let e = Math.sin(o.k[0] * t.x + o.k[1] * t.y + o.k[2] * t.z + o.w * n + o.p);
			r += o.a[0] * e, i += o.a[1] * e, a += o.a[2] * e;
		}
		c += r * e.noiseK * o.noiseAxes.x, l += i * e.noiseK * o.noiseAxes.y, u += a * e.noiseK * o.noiseAxes.z;
	}
	if (o.drag > 0) {
		if (e.orb) {
			let [n, i, a] = bu(e, t);
			xu(t, c + n, l + i, u + a, o.drag * r);
		} else xu(t, c, l, u, o.drag * r);
	}
	if (o.limitDampen > 0) {
		if (e.orb) {
			let [n, i, a] = bu(e, t);
			Su(t, c + n, l + i, u + a, o.speedLimit, o.limitDampen, r);
		} else Su(t, c, l, u, o.speedLimit, o.limitDampen, r);
	}
	let d = o.speedModifier.length ? Xl(o.speedModifier, s) : 1;
	if (t.x += (t.vx + c) * r * d, t.y += (t.vy + l) * r * d, t.z += (t.vz + u) * r * d, o.spinBySpeed.length) {
		let e = Math.hypot(t.vx + c, t.vy + l, t.vz + u) * d, n = o.spinBySpeedMax - o.spinBySpeedMin, i = n > 1e-6 ? (e - o.spinBySpeedMin) / n : +(e >= o.spinBySpeedMax);
		t.rotBySpeed += Xl(o.spinBySpeed, Math.min(1, Math.max(0, i))) * r;
	}
	if (e.orb) {
		let n = [
			o.orbital.x,
			o.orbital.y,
			o.orbital.z
		];
		for (let i = 0; i < 3; i++) {
			let a = n[i];
			if (!a) continue;
			let o = e.axes[i], s = a * r, c = t.x - e.cx, l = t.y - e.cy, u = t.z - e.cz, d = Math.cos(s), f = Math.sin(s), p = o[0] * c + o[1] * l + o[2] * u, m = o[1] * u - o[2] * l, h = o[2] * c - o[0] * u, g = o[0] * l - o[1] * c;
			t.x = e.cx + c * d + m * f + o[0] * p * (1 - d), t.y = e.cy + l * d + h * f + o[1] * p * (1 - d), t.z = e.cz + u * d + g * f + o[2] * p * (1 - d);
		}
		let [i, a, s] = bu(e, t);
		c += i, l += a, u += s;
	}
	return t.ax = c, t.ay = l, t.az = u, o.floor ? hu(o, t, i) : -1;
}
function wu(e, t, n) {
	let r = Math.min(1, n);
	return Math.max(0, t.size0 * (e.sizeCurve.length ? Xl(e.sizeCurve, r) : lu(e.sizeEase, r, e.sizeEnd)));
}
function Tu(e, t, n) {
	let r = Math.min(1, n), i = e.sizeCurve.length ? Xl(e.sizeCurve, r) : lu(e.sizeEase, r, e.sizeEnd), a = e.sizeCurveY.length ? Xl(e.sizeCurveY, r) : i, o = e.sizeCurveZ.length ? Xl(e.sizeCurveZ, r) : i;
	return [t.size0y * a / Math.max(1e-6, t.size0 * i), t.size0z * o / Math.max(1e-6, t.size0 * i)];
}
function Eu(e, t, n) {
	return t.flip * (t.rot0 + t.rotBySpeed + (e.spinCurve.length ? t.life * Zl(e.spinCurve, n / t.life) : t.spin * n));
}
function Du(e, t, n) {
	if (e.length === 1 || t <= e[0].t) return e[0].rgb;
	if (t >= e[e.length - 1].t) return e[e.length - 1].rgb;
	let r = 0;
	for (; r < e.length - 2 && t > e[r + 1].t;) r++;
	let i = e[r], a = e[r + 1];
	if (n) return a.rgb;
	let o = (t - i.t) / Math.max(1e-6, a.t - i.t);
	return [
		i.rgb[0] + (a.rgb[0] - i.rgb[0]) * o,
		i.rgb[1] + (a.rgb[1] - i.rgb[1]) * o,
		i.rgb[2] + (a.rgb[2] - i.rgb[2]) * o
	];
}
function Ou(e, t, n) {
	let r = e.em, [i, a, o] = Du(e.stops, n, r.stepped), s, c, l, u = r.alpha;
	return e.startStops.length ? ([s, c, l] = Du(e.startStops, t.cu, !1), r.startGradientAlpha.length && (u *= Xl(r.startGradientAlpha, t.cu))) : (s = e.c1[0] + (e.c2[0] - e.c1[0]) * t.cmix, c = e.c1[1] + (e.c2[1] - e.c1[1]) * t.cmix, l = e.c1[2] + (e.c2[2] - e.c1[2]) * t.cmix), r.alphaCurve.length ? u *= Xl(r.alphaCurve, Math.min(1, Math.max(0, n))) : (r.fadeIn > 0 && n < r.fadeIn && (u *= n / r.fadeIn), r.fadeOut > 0 && n > 1 - r.fadeOut && (u *= (1 - n) / r.fadeOut)), [
		i * s / 255,
		a * c / 255,
		o * l / 255,
		u
	];
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/output.ts
var ku = /* @__PURE__ */ new WeakMap();
function Au(e, t, n) {
	let r = ku.get(e);
	r || ku.set(e, r = []);
	let i = r[t];
	return i || (r[t] = i = {
		data: /* @__PURE__ */ new Float32Array(4864),
		count: 0,
		cap: n,
		trails: /* @__PURE__ */ new Float32Array(4096),
		trailFloats: 0,
		trailCount: 0
	}), i.count = 0, i.cap = n, i.trailFloats = 0, i.trailCount = 0, i;
}
function ju(e) {
	let t = Math.imul(Math.round(e.size0 * 1e6) ^ 2654435769, 2246822507);
	return t = Math.imul(t ^ Math.round(e.rot0 * 1e4), 3266489909), t = Math.imul(t ^ Math.round(e.life * 1e6), 668265263), t = Math.imul(t ^ Math.round(e.cmix * 1e6), 374761393), t ^= t >>> 15, (t >>> 0) / 4294967296;
}
function Mu(e, t, n, r, i, a, o, s, c, l = 1, u = 1, d = 0, f = 0) {
	if ((e.count + 1) * 19 > e.data.length) {
		let t = new Float32Array(e.data.length * 2);
		t.set(e.data), e.data = t;
	}
	let p = e.count * 19, m = e.data;
	m[p] = t.x, m[p + 1] = t.y, m[p + 2] = t.z, m[p + 3] = n, m[p + 4] = r, m[p + 5] = i / 255, m[p + 6] = a / 255, m[p + 7] = o / 255, m[p + 8] = s, m[p + 9] = t.vx + t.ax, m[p + 10] = t.vy + t.ay, m[p + 11] = t.vz + t.az, m[p + 12] = c, m[p + 13] = ju(t), m[p + 14] = c * t.life, m[p + 15] = l, m[p + 16] = u, m[p + 17] = d, m[p + 18] = f, e.count++;
}
function Nu(e, t, n, r, i, a, o) {
	let s = t.length / 4;
	if (s < 2) return;
	let c = e.trailFloats + 6 + t.length;
	if (c > e.trails.length) {
		let t = new Float32Array(Math.max(c, e.trails.length * 2));
		t.set(e.trails.subarray(0, e.trailFloats)), e.trails = t;
	}
	let l = e.trails, u = e.trailFloats;
	l[u++] = s, l[u++] = n, l[u++] = r / 255, l[u++] = i / 255, l[u++] = a / 255, l[u++] = o;
	for (let e = 0; e < t.length; e++) l[u++] = t[e];
	e.trailFloats = u, e.trailCount++;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/runParticle.ts
function Pu(e, t, n, r, i, a) {
	let o = r - n, s = o >= t.life, c = s ? t.life : o, l = Math.floor(c / mu + 1e-7), u = c - l * mu, d = u > 1e-6 ? u : 0, f = t.hasTrail ? e.trailLife * t.life : 0, p = f > 0 ? [] : null, m = r - f, h = e.em, g = 0;
	for (let i = 0; i <= l; i++) {
		let o = i < l ? mu : d;
		if (o <= 0) break;
		let s = n + i * mu;
		p && s >= m && i % 2 == 0 && p.push(t.x, t.y, t.z, (r - s) / f);
		let c = Cu(e, t, s, o, h.floor ? wu(h, t, (s - n + g) / t.life) * (a ? a.size : 1) : 0, (s - n + g) / t.life);
		if (c >= 0 && gu(h, t, c, g += h.lifetimeLoss * t.life, s + o - n)) return;
	}
	if (s) {
		p && g === 0 && Iu(e, t, p, n + t.life, r, f, i, a);
		return;
	}
	if (o + g >= t.life) return;
	let _ = Math.min(1, (o + g) / t.life), v = wu(h, t, _), [y, b, x, S] = Ou(e, t, _);
	if (a && (y *= a.r, b *= a.g, x *= a.b, S *= a.a ?? 1, v *= a.size), S <= .003 || v <= 5e-4 || i.count >= i.cap) return;
	let [C, w] = h.startSize3D || h.sizeCurveY.length || h.sizeCurveZ.length ? Tu(h, t, _) : [1, 1], T = Math.PI / 180;
	if (Mu(i, t, v, Eu(h, t, o) * T, y, b, x, S, _, C, w, (t.rx0 + t.spinX * o) * T, (t.ry0 + t.spinY * o) * T), p) {
		p.push(t.x, t.y, t.z, 0);
		let n = p, r = p.length / 4;
		if (r > 48) {
			let e = [], t = r / 48;
			for (let n = 0; n < 47; n++) {
				let r = Math.floor(n * t) * 4;
				e.push(p[r], p[r + 1], p[r + 2], p[r + 3]);
			}
			e.push(...p.slice(p.length - 4)), n = e;
		}
		Fu(e, n, _, v, y, b, x, S, i);
	}
}
function Fu(e, t, n, r, i, a, o, s, c) {
	let l = e.em, u = zl(l.trailColor), d = l.trailInheritColor ? i * u[0] / 255 : u[0], f = l.trailInheritColor ? a * u[1] / 255 : u[1], p = l.trailInheritColor ? o * u[2] / 255 : u[2], m = l.trailLifeAlpha.length ? Xl(l.trailLifeAlpha, n) : 1;
	Nu(c, t, (l.trailSizeAffectsWidth ? r : 1) * l.trailWidth, d, f, p, (l.trailInheritColor ? s : l.alpha) * m);
}
function Iu(e, t, n, r, i, a, o, s) {
	let c = (i - r) / a;
	if (c >= 1) return;
	n.push(t.x, t.y, t.z, c);
	for (let e = 3; e < n.length; e += 4) n[e] = (n[e] - c) / (1 - c);
	let l = .9999, u = wu(e.em, t, l), [d, f, p, m] = Ou(e, t, l);
	s && (d *= s.r, f *= s.g, p *= s.b, m *= s.a ?? 1, u *= s.size), Fu(e, n.length / 4 > 48 ? n.slice(n.length - 192) : n, l, u, d, f, p, m, o);
}
function Lu(e) {
	return e.trails && !e.trailDieWithParticles ? e.trailLifetime : 0;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/ribbons.ts
function Ru(e, t, n) {
	let r = t.count - n, i = Math.max(1, e.trailRibbonCount);
	if (r < 2) return;
	let a = t.data;
	for (let r = 0; r < i; r++) {
		let o = [];
		for (let e = n + r; e < t.count; e += i) o.push(e);
		if (o.length < 2) continue;
		o.reverse();
		let s = [], c = 0;
		o.forEach((e, t) => {
			let n = e * 19;
			s.push(a[n], a[n + 1], a[n + 2], t / (o.length - 1)), c += a[n + 3];
		}), c /= o.length;
		let l = o[0] * 19, u = zl(e.trailColor), d = e.trailInheritColor ? a[l + 5] * u[0] : u[0], f = e.trailInheritColor ? a[l + 6] * u[1] : u[1], p = e.trailInheritColor ? a[l + 7] * u[2] : u[2], m = e.trailLifeAlpha.length ? Xl(e.trailLifeAlpha, a[l + 12]) : 1, h = (e.trailInheritColor ? a[l + 8] : e.alpha) * m;
		Nu(t, s, (e.trailSizeAffectsWidth ? c : 1) * e.trailWidth, d, f, p, h);
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/hierarchy3d.ts
var zu = (e) => e.subEmitterOf || e.parentId;
function Bu(e, t) {
	let n = [], r = zu(t);
	for (; r && n.length < e.layers.length;) {
		let t = e.layers.find((e) => e.id === r);
		if (!t) break;
		n.push(t), r = zu(t);
	}
	return n;
}
function Vu(e, t) {
	return t.visible && Bu(e, t).every((e) => e.visible);
}
function Hu(e, t) {
	if (t.subEmitterOf) {
		let n = e.layers.find((e) => e.id === t.subEmitterOf);
		return {
			pos: n && n !== t ? Hu(e, n).pos : { ...t.position },
			M: Kl(t.rotation)
		};
	}
	let n = { ...t.position }, r = Kl(t.rotation), i = t.parentId;
	for (let t = 0; i && t < e.layers.length; t++) {
		let t = e.layers.find((e) => e.id === i);
		if (!t) break;
		let a = Kl(t.rotation), [o, s, c] = Jl(a, n.x, n.y, n.z);
		n = {
			x: o + t.position.x,
			y: s + t.position.y,
			z: c + t.position.z
		}, r = ql(a, r), i = t.parentId;
	}
	return {
		pos: n,
		M: r
	};
}
function Uu(e) {
	let t = new Map(e.map((e) => [e.id, e]));
	for (let t of e) t.empty && (t.subEmitterOf = "");
	for (let n of e) {
		if (!n.subEmitterOf) continue;
		let e = t.get(n.subEmitterOf);
		(!e || e === n || e.subEmitterOf || e.empty) && (n.subEmitterOf = "");
	}
	for (let n of e) {
		if (n.subEmitterOf && (n.parentId = ""), !n.parentId) continue;
		let e = t.get(n.parentId);
		(!e || e === n || e.subEmitterOf) && (n.parentId = "");
	}
	for (let n of e) {
		let e = /* @__PURE__ */ new Set([n.id]), r = n;
		for (; r.parentId;) {
			if (e.has(r.parentId)) {
				r.parentId = "";
				break;
			}
			e.add(r.parentId), r = t.get(r.parentId);
		}
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/sim3d/subEmitters.ts
function Wu(e) {
	let t = [];
	for (let n of e.bursts) if (!(n.count <= 0)) for (let e = 0; e < Math.max(1, n.cycles ?? 1); e++) t.push({
		at: n.time + e * (n.interval ?? 0),
		count: n.count
	});
	return t.sort((e, t) => e.at - t.at);
}
function Gu(e, t, n, r, i, a) {
	let o = tu(t, iu(e, t)), s = jl(e.seed, Ml(t.id)), c = Hu(e, t), l = _u(e, t, s, c.pos, c.M), u = t.startLifetime.max, d = [], f = a.rate, p = r - u;
	for (let u of au(e, t, p, i)) {
		let e = ru(o.times, p - u), m = ru(o.times, i - u);
		for (let p = e; p < m; p++) {
			let e = u + o.times[p], m = new Gl(jl(s, p, 31)), h = t.startLifetime.min + (t.startLifetime.max - t.startLifetime.min) * m.next(), g = Math.min(e + h, i), _ = t.floor && (t.lifetimeLoss > 0 || t.minKillSpeed > 0);
			if (n === "death" && !_ && (e + h < r || e + h > i)) continue;
			let v = yu(l, m, c.pos.x, c.pos.y, c.pos.z, h), y = jl(p, 1e3, 77), b = (n, r) => {
				let i = (n - e) / h, [a, o, s, c] = Ou(l, v, Math.min(1, i));
				return {
					time: n,
					x: v.x,
					y: v.y,
					z: v.z,
					vx: v.vx + v.ax,
					vy: v.vy + v.ay,
					vz: v.vz + v.az,
					r: a / 255,
					g: o / 255,
					b: s / 255,
					a: c,
					size: wu(t, v, i),
					key: jl(y, r, 5)
				};
			}, x = g - e, S = Math.floor(x / mu + 1e-7), C = x - S * mu, w = C > 1e-6 ? C : 0, T = 1e-7, E = 0, D = 0, O = -1, k = 0, A = n === "birth" ? a.rateOverDistance : 0, j = 0, M = 0, N = n === "birth" ? Wu(a) : [], P = 0;
			for (let i = 0; i <= S; i++) {
				let a = i < S ? mu : w;
				if (a <= 0) break;
				let o = e + i * mu;
				if (D > 0 && o - e + D >= h) {
					O = o;
					break;
				}
				for (; P < N.length && N[P].at <= Math.min(i * .016666666666666666 + a, x) + T;) {
					let t = e + N[P].at;
					t >= r - T && d.push({
						...b(t, 2e6 + P),
						count: N[P].count
					}), P++;
				}
				if (n === "birth" && f > 0) {
					let t = Math.min(i * mu + a, x);
					for (; (E + 1) / f <= t + T;) {
						let t = e + (E + 1) / f;
						t >= r - T && d.push(b(t, E)), E++;
					}
				}
				let s = v.x, c = v.y, u = v.z, p = Cu(l, v, o, a, t.floor ? wu(t, v, (o - e + D) / h) : 0, (o - e + D) / h);
				if (A > 0) for (j += Math.hypot(v.x - s, v.y - c, v.z - u); (M + 1) / A <= j + T;) o + a >= r - T && d.push(b(o + a, 1e6 + M)), M++;
				if (p >= 0 && (n === "collision" && o + a >= r && d.push(b(o + a, k)), k++, gu(t, v, p, D += t.lifetimeLoss * h, o + a - e))) {
					O = o + a;
					break;
				}
			}
			if (n === "death") {
				let t = O >= 0 ? O : e + h;
				t >= r && t <= i && d.push(b(t, 0));
			}
		}
	}
	return d;
}
function Ku(e, t, n, r, i) {
	let a = jl(e.seed, Ml(t.id)), o = _u(e, t, a, Hu(e, n).pos), s = 1 + Lu(t), c = t.startLifetime.max * s, l = t.bursts.reduce((e, t) => Math.max(e, t.time), 0), u = t.subEvent, d = Gu(e, n, u, r - c - (u === "birth" ? 0 : l), r, t), f = i.count;
	for (let e of d) {
		let n = {
			r: t.inheritColor ? e.r : 1,
			a: t.inheritColor ? e.a : 1,
			g: t.inheritColor ? e.g : 1,
			b: t.inheritColor ? e.b : 1,
			size: t.inheritSize ? e.size : 1
		}, c = (c, l, u = 0, d = 1) => {
			if (c > r || i.count >= i.cap) return;
			let f = new Gl(jl(a, e.key, l)), p = t.startLifetime.min + (t.startLifetime.max - t.startLifetime.min) * f.next();
			if (r - c >= p * s) return;
			let m = yu(o, f, e.x, e.y, e.z, p, {
				time: c - e.time,
				index: u,
				count: d
			});
			m.vx += e.vx * t.inheritVelocity, m.vy += e.vy * t.inheritVelocity, m.vz += e.vz * t.inheritVelocity, Pu(o, m, c, r, i, n);
		};
		if (u === "birth") {
			let t = e.count ?? 1;
			for (let n = 0; n < t; n++) c(e.time, n, n, t);
		} else {
			let n = 0;
			for (let r of t.bursts) for (let t = 0; t < r.count; t++) c(e.time + r.time, n++, t, r.count);
		}
	}
	t.trails && t.trailMode === "ribbon" && Ru(t, i, f);
}
function qu(e, t) {
	if (!t.subEmitterOf) return null;
	let n = e.layers.find((e) => e.id === t.subEmitterOf);
	return !n || n === t || n.subEmitterOf || n.empty || !Vu(e, n) ? null : n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/simulate3d.ts
function Ju(e, t, n = Ju) {
	return e.layers.map((r, i) => {
		let a = Au(n, i, r.maxParticles), o = qu(e, r), s = Hu(e, r), c = !r.empty && Vu(e, r);
		if (c && o) Ku(e, r, o, t * o.simulationSpeed, a);
		else if (c && (!r.subEmitterOf || !e.layers.some((e) => e.id === r.subEmitterOf))) {
			let n = t * r.simulationSpeed, i = tu(r, iu(e, r)), o = jl(e.seed, Ml(r.id)), c = a.count, l = _u(e, r, o, s.pos, s.M), u = 1 + Lu(r), d = n - r.startLifetime.max * u;
			for (let t of au(e, r, d, n)) {
				if (a.count >= a.cap) break;
				let e = ru(i.times, d - t), c = ru(i.times, n - t);
				for (let d = e; d < c && a.count < a.cap; d++) {
					let e = t + i.times[d], c = new Gl(jl(o, d, 31)), f = r.startLifetime.min + (r.startLifetime.max - r.startLifetime.min) * c.next();
					n - e < 0 || n - e >= f * u || Pu(l, yu(l, c, s.pos.x, s.pos.y, s.pos.z, f, {
						time: e - r.startOffset,
						index: i.index[d],
						count: i.count[d]
					}), e, n, a, null);
				}
			}
			r.trails && r.trailMode === "ribbon" && Ru(r, a, c);
		}
		return {
			emitter: r,
			count: a.count,
			data: a.data,
			trails: a.trails,
			trailFloats: a.trailFloats,
			trailCount: a.trailCount,
			rot: s.M
		};
	});
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/customMeshes.ts
var Yu = /^m_[a-z0-9]{4,24}$/, Xu = (e) => Yu.test(e), Zu = /* @__PURE__ */ new Map(), Qu = 0;
function $u(e, t) {
	Zu.set(e, {
		data: t,
		version: ++Qu
	});
}
function ed(e) {
	return e && Zu.get(e) || null;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/meshData.ts
var td = (e, t) => [
	e[0] - t[0],
	e[1] - t[1],
	e[2] - t[2]
], nd = (e, t) => [
	e[1] * t[2] - e[2] * t[1],
	e[2] * t[0] - e[0] * t[2],
	e[0] * t[1] - e[1] * t[0]
], rd = (e) => {
	let t = Math.hypot(e[0], e[1], e[2]) || 1;
	return [
		e[0] / t,
		e[1] / t,
		e[2] / t
	];
};
function id(e, t, n = [
	0,
	0,
	0
]) {
	let r = {
		positions: [],
		normals: [],
		uvs: [],
		indices: []
	}, i = [
		Infinity,
		Infinity,
		Infinity
	], a = [
		-Infinity,
		-Infinity,
		-Infinity
	];
	for (let t of e) for (let e = 0; e < 3; e++) i[e] = Math.min(i[e], t[e]), a[e] = Math.max(a[e], t[e]);
	let o = a.map((e, t) => e - i[t] || 1);
	for (let a of t) {
		let t = e[a[0]], s = e[a[1]], c = e[a[2]], l = rd(nd(td(s, t), td(c, t))), u = td(a.reduce((t, n) => [
			t[0] + e[n][0] / a.length,
			t[1] + e[n][1] / a.length,
			t[2] + e[n][2] / a.length
		], [
			0,
			0,
			0
		]), n);
		l[0] * u[0] + l[1] * u[1] + l[2] * u[2] < 0 && (l = [
			-l[0],
			-l[1],
			-l[2]
		]);
		let d = Math.abs(l[0]) > Math.abs(l[2]) ? 2 : 0, f = r.positions.length / 3;
		for (let t of a) {
			let n = e[t];
			r.positions.push(...n), r.normals.push(...l), r.uvs.push((n[d] - i[d]) / o[d], (n[1] - i[1]) / o[1]);
		}
		for (let e = 1; e + 1 < a.length; e++) r.indices.push(f, f + e, f + e + 1);
	}
	return r;
}
function ad(e, t, n) {
	if (!n) {
		let n = [];
		for (let [r, i] of e) for (let e = 0; e < t; e++) {
			let a = e / t * Math.PI * 2;
			n.push([
				Math.cos(a) * i,
				Math.sin(a) * i,
				r
			]);
		}
		let r = [];
		for (let n = 0; n + 1 < e.length; n++) for (let i = 0; i < t; i++) {
			let a = n * t + i, o = n * t + (i + 1) % t, s = (n + 1) * t + (i + 1) % t, c = (n + 1) * t + i;
			e[n][1] === 0 ? r.push([
				a,
				s,
				c
			]) : e[n + 1][1] === 0 ? r.push([
				a,
				o,
				c
			]) : r.push([
				a,
				o,
				s,
				c
			]);
		}
		let i = e.map((e) => e[0]);
		return id(n, r, [
			0,
			0,
			(Math.min(...i) + Math.max(...i)) / 2
		]);
	}
	let r = {
		positions: [],
		normals: [],
		uvs: [],
		indices: []
	}, i = e[0][0], a = e[e.length - 1][0];
	for (let n = 0; n < e.length; n++) {
		let [o, s] = e[n], [c, l] = e[Math.max(0, n - 1)], [u, d] = e[Math.min(e.length - 1, n + 1)], f = u - c, p = d - l, m = Math.hypot(f, p) || 1;
		for (let e = 0; e <= t; e++) {
			let n = e / t * Math.PI * 2, c = Math.cos(n), l = Math.sin(n);
			r.positions.push(c * s, l * s, o), r.normals.push(c * f / m, l * f / m, -p / m), r.uvs.push(e / t, (o - i) / (a - i || 1));
		}
	}
	let o = t + 1;
	for (let n = 0; n + 1 < e.length; n++) for (let e = 0; e < t; e++) {
		let t = n * o + e;
		r.indices.push(t, t + 1, t + o + 1, t, t + o + 1, t + o);
	}
	return r;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/kinds.ts
var od = () => ad([
	[-.32, 0],
	[-.12, .13],
	[.12, .16],
	[.68, 0]
], 6, !1), sd = () => ad([
	[-.5, 0],
	[-.28, .17],
	[.28, .17],
	[.5, 0]
], 6, !1);
function cd() {
	let e = [
		[
			.06,
			.5,
			.04
		],
		[
			-.05,
			-.46,
			-.02
		],
		[
			.38,
			.04,
			.09
		],
		[
			.04,
			-.02,
			.17
		],
		[
			-.33,
			.12,
			.05
		],
		[
			-.02,
			.06,
			-.15
		]
	], t = [
		2,
		3,
		4,
		5
	], n = [];
	for (let e = 0; e < 4; e++) {
		let r = t[e], i = t[(e + 1) % 4];
		n.push([
			0,
			r,
			i
		], [
			1,
			i,
			r
		]);
	}
	return id(e, n, [
		0,
		.02,
		.03
	]);
}
function ld() {
	let e = {
		positions: [],
		normals: [],
		uvs: [],
		indices: []
	};
	for (let t = 0; t <= 48; t++) {
		let n = t / 48 * Math.PI * 2, r = Math.cos(n), i = Math.sin(n);
		for (let [n, a] of [[.34, 0], [.5, 1]]) e.positions.push(r * n, i * n, 0), e.normals.push(0, 0, -1), e.uvs.push(t / 48, a);
	}
	for (let t = 0; t < 48; t++) {
		let n = t * 2;
		e.indices.push(n, n + 1, n + 3, n, n + 3, n + 2);
	}
	return e;
}
var ud = () => ad([[0, .5], [1, .5]], 32, !0);
function dd() {
	let e = [];
	for (let t = 0; t <= 12; t++) {
		let n = Math.PI * t / 12;
		e.push([-.5 * Math.cos(n), .5 * Math.sin(n)]);
	}
	let t = ad(e, 20, !0);
	for (let e = 0; e < t.normals.length; e += 3) {
		let n = t.positions[e], r = t.positions[e + 1], i = t.positions[e + 2], a = Math.hypot(n, r, i) || 1;
		t.normals[e] = n / a, t.normals[e + 1] = r / a, t.normals[e + 2] = i / a;
	}
	return t;
}
function fd() {
	let e = [];
	for (let t of [-.5, .5]) for (let n of [-.5, .5]) for (let r of [-.5, .5]) e.push([
		t,
		n,
		r
	]);
	return id(e, [
		[
			0,
			1,
			3,
			2
		],
		[
			4,
			6,
			7,
			5
		],
		[
			0,
			4,
			5,
			1
		],
		[
			2,
			3,
			7,
			6
		],
		[
			0,
			2,
			6,
			4
		],
		[
			1,
			5,
			7,
			3
		]
	]);
}
function pd() {
	return {
		positions: [
			-.5,
			-.5,
			0,
			.5,
			-.5,
			0,
			.5,
			.5,
			0,
			-.5,
			.5,
			0
		],
		normals: [
			0,
			0,
			-1,
			0,
			0,
			-1,
			0,
			0,
			-1,
			0,
			0,
			-1
		],
		uvs: [
			0,
			0,
			1,
			0,
			1,
			1,
			0,
			1
		],
		indices: [
			0,
			1,
			2,
			0,
			2,
			3
		]
	};
}
var md = {
	spike: od,
	crystal: sd,
	shard: cd,
	ring: ld,
	cylinder: ud,
	sphere: dd,
	cube: fd,
	quad: pd
}, hd = /* @__PURE__ */ new Map();
function gd(e) {
	if (Xu(e)) return ed(e)?.data ?? gd("shard");
	let t = e, n = hd.get(t);
	return n || hd.set(t, n = md[t]()), n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/preview3d/shaders.ts
var _d = "\n  attribute vec3 iPos;\n  attribute float iSize;\n  attribute float iRot;\n  attribute vec4 iColor;\n  attribute vec3 iVel;\n  attribute vec3 iData; // life fraction, stable random, age (s)\n  attribute vec4 iShape; // size Y / Z relative to iSize, rotation X / Y (rad): Unity's 3D size and rotation\n  uniform vec3 uPivot; // Renderer Pivot, in particle sizes\n  varying vec2 vUv;\n  varying vec4 vColor;\n  varying vec3 vData;\n  varying vec3 vNormal; // zero for billboards (no fresnel)\n  varying vec3 vView;\n", vd = `
  ${_d}
  uniform int uMode;
  uniform float uLengthScale;
  uniform float uVelocityScale;
  uniform vec2 uFlip; // Renderer Flip: share of particles mirrored along U / V
  uniform vec2 uSizeLimit; // Renderer Min / Max Particle Size: share of the viewport width (billboards)
  void main() {
    vUv = uv;
    // Unity mirrors the texture of that share of particles (picked per particle)
    if (fract(iData.y * 7.31) < uFlip.x) vUv.x = 1.0 - vUv.x;
    if (fract(iData.y * 13.7) < uFlip.y) vUv.y = 1.0 - vUv.y;
    vColor = iColor;
    vData = iData;
    vNormal = vec3(0.0);
    vec2 c = position.xy; // -0.5..0.5
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world;
    if (uMode == 1) {
      float sp = length(iVel);
      vec3 dir = sp > 1e-5 ? iVel / sp : camUp;
      vec3 toCam = normalize(cameraPosition - iPos);
      vec3 side = cross(dir, toCam);
      float sl = length(side);
      side = sl > 1e-5 ? side / sl : camRight;
      // measured in Unity: length = size * lengthScale + speed * velocityScale
      // (the speed term does not scale with size); the particle sits at the head.
      // A particle with zero total velocity is not drawn at all (the quad collapses).
      // 3D size: the width is the X size, the length scales with the Y size;
      // the pivot moves the streak by 2 x pivot.y sizes along it (whatever its length) and
      // pivot.x widths across (BakeMesh, 2022.3)
      bool still = sp <= 1e-6;
      float len = still ? 0.0 : iSize * iShape.x * uLengthScale + sp * uVelocityScale;
      float wid = still ? 0.0 : iSize;
      world = iPos + dir * ((c.x - 0.5) * len + (still ? 0.0 : 2.0 * uPivot.y * iSize * iShape.x)) + side * (c.y + uPivot.x) * wid;
      // Unity's UV runs from the head (U 0, at the particle) to the tail (U 1) (BakeMesh, 2022.3)
      vUv.x = 1.0 - vUv.x;
    } else {
      // 3D size: X wide, Y high; the pivot (x, y) is in the quad's own axes, so it turns with it
      float cs = cos(iRot), sn = sin(iRot);
      vec2 sz = vec2(iSize, iSize * iShape.x);
      if (uMode == 0) {
        // Unity keeps a billboard between Min and Max Particle Size x the viewport width at its depth
        bool persp = projectionMatrix[3][3] < 0.5;
        float depth = -(viewMatrix * vec4(iPos, 1.0)).z;
        float viewW = 2.0 * (persp ? max(depth, 1e-4) : 1.0) / projectionMatrix[0][0];
        sz = clamp(sz, vec2(uSizeLimit.x * viewW), vec2(uSizeLimit.y * viewW));
      }
      vec2 q = (c + uPivot.xy) * sz;
      vec2 r = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
      // flat billboards are drawn at 1/sqrt(2) of Unity's size, but pivot.z is not scaled (BakeMesh, 2022.3)
      float pz = uPivot.z * iSize;
      if (uMode == 2) {
        // Unity (BakeMesh, 2022.3): U along +X, V along Unity +Z (three -Z); pivot.z lifts it.
        // A horizontal billboard is turned first and then sized on the world X / Z axes.
        vec2 qs = c + uPivot.xy;
        vec2 rh = vec2(qs.x * cs - qs.y * sn, qs.x * sn + qs.y * cs) * vec2(iSize, iSize * iShape.x);
        world = iPos + vec3(rh.x, pz * 1.41421356, -rh.y);
      } else if (uMode == 3) {
        vec3 toCam = cameraPosition - iPos;
        toCam.y = 0.0;
        float l = length(toCam);
        vec3 f = l > 1e-5 ? toCam / l : vec3(0.0, 0.0, 1.0);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), f));
        world = iPos + right * r.x + vec3(0.0, 1.0, 0.0) * r.y + f * pz * 1.41421356;
      } else {
        world = iPos + camRight * r.x + camUp * r.y + normalize(cameraPosition - iPos) * pz;
      }
    }
    vView = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`, yd = `
  ${_d}
  uniform int uAlign; // 0 velocity, 1 random, 2 local, 3 view
  uniform mat3 uLocalRot; // the layer's rotation (three axes)
  mat3 axisAngle(vec3 a, float t) {
    float c = cos(t), s = sin(t), k = 1.0 - c;
    return mat3(
      c + a.x * a.x * k, a.y * a.x * k + a.z * s, a.z * a.x * k - a.y * s,
      a.x * a.y * k - a.z * s, c + a.y * a.y * k, a.z * a.y * k + a.x * s,
      a.x * a.z * k + a.y * s, a.y * a.z * k - a.x * s, c + a.z * a.z * k);
  }
  void main() {
    vUv = uv;
    vColor = iColor;
    vData = iData;
    mat3 R;
    if (uAlign == 0) {
      float sp = length(iVel);
      vec3 fwd = sp > 1e-5 ? iVel / sp : vec3(0.0, 1.0, 0.0);
      vec3 up = abs(fwd.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      vec3 right = normalize(cross(up, -fwd));
      R = mat3(right, cross(-fwd, right), -fwd) * axisAngle(vec3(0.0, 0.0, 1.0), iRot);
    } else if (uAlign == 1) {
      float r = iData.y * 6.2831853;
      vec3 axis = normalize(vec3(sin(r * 7.31), cos(r * 3.17), sin(r * 5.13 + 1.7)) + 1e-4);
      R = axisAngle(axis, iRot + r);
    } else if (uAlign == 3) {
      // the camera's axes (Unity View alignment: the mesh's +Z points away from the camera,
      // which is the camera's +Z in three's flipped axes), then the particle's rotation
      mat3 cam = mat3(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]));
      R = cam * axisAngle(vec3(0.0, 1.0, 0.0), -iShape.w) * axisAngle(vec3(1.0, 0.0, 0.0), -iShape.z) * axisAngle(vec3(0.0, 0.0, 1.0), -iRot);
    } else {
      // iRot is negated on upload for billboards (Unity turns them clockwise);
      // a mesh in its layer's orientation turns +angle about its Z (measured in 6000.3).
      // 3D rotation: Unity's Euler order (Z, then X, then Y); X and Y change sign with three's flipped Z
      R = uLocalRot * axisAngle(vec3(0.0, 1.0, 0.0), -iShape.w) * axisAngle(vec3(1.0, 0.0, 0.0), -iShape.z) * axisAngle(vec3(0.0, 0.0, 1.0), -iRot);
    }
    // 3D size scales the mesh's own axes; the pivot moves it in them (BakeMesh, 2022.3: pivot.z has no effect)
    vec3 world = iPos + R * ((position + vec3(uPivot.xy, 0.0)) * iSize * vec3(1.0, iShape.x, iShape.y));
    vNormal = normalize(R * normal);
    vView = cameraPosition - world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`, bd = "\n  uniform int uBlendKind;\n  vec4 fxBlendOut(vec3 rgb, float a, float base, float vertexAlpha) {\n    if (uBlendKind == 1) return vec4(rgb * vertexAlpha * (a / max(base, 1e-4)), a * vertexAlpha);\n    if (uBlendKind == 2) return vec4(rgb * a, a);\n    return vec4(rgb, a);\n  }\n", xd = `
  #include <packing>
  uniform sampler2D uMap;
  uniform float uIntensity;
  ${bd}
  uniform vec2 uScroll;
  uniform vec2 uSheetGrid; // columns, rows; 0 = no flipbook
  uniform int uSheetMode; // 0 lifetime, 1 fps
  uniform float uSheetCycles;
  uniform float uSheetFps;
  uniform float uSheetRandom;
  uniform float uSheetStart; // Start Frame, fraction of the sheet
  uniform vec2 uFrameKeys[16]; // Frame over Time keys (t, v); uFrameKeyCount 0 = linear
  uniform int uFrameKeyCount;
  float frameOverTime(float t) {
    if (uFrameKeyCount == 0) return t;
    vec2 prev = uFrameKeys[0];
    if (t <= prev.x) return prev.y;
    for (int i = 1; i < 16; i++) {
      if (i >= uFrameKeyCount) break;
      vec2 k = uFrameKeys[i];
      if (t <= k.x) return mix(prev.y, k.y, (t - prev.x) / max(k.x - prev.x, 1e-6));
      prev = k;
    }
    return prev.y;
  }
  uniform float uDissolve; // 0 off, 1 on
  uniform vec2 uDissolveRange;
  uniform float uDissolveEdge;
  uniform float uDissolveScale;
  uniform vec3 uEdgeColor;
  uniform sampler2D uNoise;
  uniform float uDissolveTexOn; // 1: uNoise is the layer's dissolve texture (no random offset)
  uniform float uDissolveSoft;
  uniform vec2 uDissolveKeys[16]; // cut-off over life; uDissolveKeyCount 0 = uDissolveRange
  uniform int uDissolveKeyCount;
  float dissolveCut(float life) {
    if (uDissolveKeyCount == 0) return mix(uDissolveRange.x, uDissolveRange.y, life);
    vec2 prev = uDissolveKeys[0];
    if (life <= prev.x) return prev.y;
    for (int i = 1; i < 16; i++) {
      if (i >= uDissolveKeyCount) break;
      vec2 k = uDissolveKeys[i];
      if (life <= k.x) return mix(prev.y, k.y, (life - prev.x) / max(k.x - prev.x, 1e-6));
      prev = k;
    }
    return prev.y;
  }
  uniform float uFresnel;
  uniform float uFresnelPower;
  uniform vec3 uFresnelColor;
  uniform float uSoftness; // 0 = off
  uniform float uApplyColorSpace; // 1: particle colours converted to linear (Unity's Apply Active Color Space)
  uniform sampler2D uDepth;
  uniform vec2 uResolution;
  uniform float uNear;
  uniform float uFar;
  varying vec2 vUv;
  varying vec4 vColor;
  varying vec3 vData;
  varying vec3 vNormal;
  varying vec3 vView;

  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
  /*FX_CUSTOM_CODE*/

  void main() {
    vec2 uv = vUv;
    if (uSheetGrid.x > 0.0) {
      float n = uSheetGrid.x * uSheetGrid.y;
      float frame;
      if (uSheetMode == 1) frame = mod(floor(vData.z * uSheetFps) + floor(vData.y * n) * uSheetRandom, n);
      else {
        // Unity: frameOverTime(frac(life x cycles)) + start frame, then the frame under it (render3d/sheet.ts)
        float pos = frameOverTime(fract(min(vData.x, 0.99999) * uSheetCycles)) + mix(uSheetStart, vData.y, uSheetRandom);
        frame = min(n - 1.0, floor(fract(pos) * n));
      }
      float col = mod(frame, uSheetGrid.x);
      float row = floor(frame / uSheetGrid.x);
      uv = (uv + vec2(col, uSheetGrid.y - 1.0 - row)) / uSheetGrid;
    } else {
      uv += uScroll * vData.z;
    }
  #ifdef FX_CUSTOM
    vec3 pc = mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace);
    vec4 cc = fxCustom(uv, vec4(pc, vColor.a), vData.x, vData.y, vData.z);
    vec3 col = cc.rgb;
    float a = clamp(cc.a, 0.0, 1.0);
  #else
    vec4 t = texture2D(uMap, uv);
    vec3 col = mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace) * t.rgb;
    float a = t.a * vColor.a;
  #endif
    float base = a; // before dissolve / fresnel / soft particles (premultiplied output scales by their change)

    if (uDissolve > 0.5) {
      float cut = dissolveCut(vData.x);
      float nz = texture2D(uNoise, vUv * uDissolveScale + vData.y * 7.13 * (1.0 - uDissolveTexOn)).r;
      a *= smoothstep(cut, cut + uDissolveSoft, nz);
      float edge = (1.0 - smoothstep(cut, cut + uDissolveEdge + 1e-4, nz)) * step(0.001, cut);
      col = mix(col, toLinear(uEdgeColor), edge);
    }
    if (uFresnel > 0.0 && dot(vNormal, vNormal) > 0.0) {
      float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uFresnelPower) * uFresnel;
      col += toLinear(uFresnelColor) * rim;
      a = clamp(a + rim * vColor.a, 0.0, 1.0);
    }
    if (uSoftness > 0.0) {
      float scene = perspectiveDepthToViewZ(texture2D(uDepth, gl_FragCoord.xy / uResolution).x, uNear, uFar);
      float self = perspectiveDepthToViewZ(gl_FragCoord.z, uNear, uFar);
      a *= clamp((self - scene) / uSoftness, 0.0, 1.0);
    }
    gl_FragColor = fxBlendOut(col * uIntensity, a, base, vColor.a);
    if (gl_FragColor.a < 0.002 && max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)) < 0.002) discard;
  }
`, Sd = "\n  attribute vec4 aColor;\n  varying vec2 vUv;\n  varying vec4 vColor;\n  void main() {\n    vUv = uv;\n    vColor = aColor;\n    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);\n  }\n", Cd = `
  uniform sampler2D uMap;
  uniform float uIntensity;
  uniform float uApplyColorSpace;
  varying vec2 vUv;
  varying vec4 vColor;
  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }
  ${bd}
  void main() {
    vec4 t = texture2D(uMap, vUv);
    float a = t.a * vColor.a;
    gl_FragColor = fxBlendOut(mix(vColor.rgb, toLinear(vColor.rgb), uApplyColorSpace) * t.rgb * uIntensity, a, a, vColor.a);
    if (gl_FragColor.a < 0.002 && max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)) < 0.002) discard;
  }
`;
function wd(e, t) {
	return `#define FX_CUSTOM
${xd.replace("/*FX_CUSTOM_CODE*/", `${e}
#line 1
${t}
`)}`;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/assets/types.ts
var Td = [
	"sprite",
	"tile",
	"flipbook"
], Ed = /^a_[a-z0-9]{4,24}$/, Dd = 8388608, Od = (e, t, n, r) => typeof e == "number" && Number.isFinite(e) ? Math.min(r, Math.max(n, Math.round(e))) : t, kd = (e, t, n) => typeof e == "string" && e.trim() ? e.trim().slice(0, n) : t;
function Ad(e) {
	if (e?.type === "procedural" && typeof e.generator == "string") {
		let t = {};
		for (let [n, r] of Object.entries(e.params ?? {})) typeof r == "number" && Number.isFinite(r) && (t[n.slice(0, 32)] = r);
		return {
			type: "procedural",
			generator: e.generator.slice(0, 40),
			params: t
		};
	}
	return e?.type === "ai" ? {
		type: "ai",
		prompt: kd(e.prompt, "", 4e3)
	} : e?.type === "drawn" ? {
		type: "drawn",
		shapes: kd(e.shapes, "", 2e4)
	} : {
		type: "import",
		file: kd(e?.file, "", 200)
	};
}
function jd(e) {
	let t = e ?? {};
	if (typeof t.id != "string" || !Ed.test(t.id) || typeof t.dataUrl != "string" || !t.dataUrl.startsWith("data:image/") || t.dataUrl.length > Dd) return null;
	let n = Td.includes(t.kind) ? t.kind : "sprite", r = n === "flipbook";
	return {
		id: t.id,
		name: kd(t.name, t.id, 60),
		kind: n,
		tilesX: r ? Od(t.tilesX, 4, 1, 16) : 1,
		tilesY: r ? Od(t.tilesY, 4, 1, 16) : 1,
		width: Od(t.width, 0, 0, 8192),
		height: Od(t.height, 0, 0, 8192),
		dataUrl: t.dataUrl,
		source: Ad(t.source),
		createdAt: Od(t.createdAt, Date.now(), 0, 0x5af3107a4000)
	};
}
var Md = (e) => typeof e == "string" && Ed.test(e) ? e : "", Nd = 0;
function Pd(e = "e") {
	return Nd = (Nd + 1) % 1e6, `${e}_${Date.now().toString(36).slice(-4)}${Nd.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
function Fd(e = {}) {
	return {
		id: Pd(),
		name: "Emitter",
		visible: !0,
		blend: "add",
		x: 128,
		y: 128,
		shape: "point",
		shapeW: 20,
		shapeH: 20,
		shapeAngle: 0,
		rate: 40,
		bursts: [],
		startDelay: 0,
		stopAfter: 0,
		maxParticles: 2e3,
		lifetime: {
			min: .6,
			max: 1
		},
		speed: {
			min: 40,
			max: 90
		},
		direction: -90,
		spread: 40,
		directionMode: "angle",
		gravityX: 0,
		gravityY: 0,
		drag: 0,
		turbulence: 0,
		turbulenceScale: 60,
		vortex: 0,
		attract: 0,
		floor: !1,
		floorY: 220,
		bounce: .3,
		friction: .3,
		sprite: "soft",
		texture: "",
		sizeStart: {
			min: 10,
			max: 16
		},
		sizeEnd: .2,
		sizeEase: "linear",
		colors: [
			{
				t: 0,
				color: "#fff4c2"
			},
			{
				t: .4,
				color: "#ff9a2e"
			},
			{
				t: 1,
				color: "#8a1d10"
			}
		],
		stepped: !1,
		hueJitter: 0,
		alpha: 1,
		fadeIn: .05,
		fadeOut: .4,
		flicker: 0,
		stretch: 0,
		spin: {
			min: 0,
			max: 0
		},
		randomRotation: !0,
		...e
	};
}
function Id(e = {}) {
	return {
		version: 1,
		name: "Untitled effect",
		width: 256,
		height: 256,
		duration: 2,
		fps: 30,
		loop: "perfect",
		background: "#15131f",
		bloom: .3,
		seed: 1,
		pixel: {
			enabled: !1,
			size: 3,
			palette: "endesga32",
			dither: !1,
			outline: !1,
			outlineColor: "#181425"
		},
		layers: [Fd({ name: "Fire" })],
		...e
	};
}
var Ld = (e, t, n = -Infinity, r = Infinity) => Math.min(r, Math.max(n, typeof e == "number" && Number.isFinite(e) ? e : t)), Rd = (e, t, n) => typeof e == "string" && t.includes(e) ? e : n, zd = (e, t) => typeof e == "boolean" ? e : t, Bd = /^#[0-9a-fA-F]{6}$/, Vd = (e, t) => typeof e == "string" ? Bd.test(e) ? e.toLowerCase() : /^#[0-9a-fA-F]{3}$/.test(e) ? ("#" + [...e.slice(1)].map((e) => e + e).join("")).toLowerCase() : t : t, Hd = (e, t, n, r) => {
	let i = e ?? {}, a = Ld(i.min, t.min, n, r), o = Ld(i.max, t.max, n, r);
	return a > o && ([a, o] = [o, a]), {
		min: a,
		max: o
	};
};
function Ud(e, t = 256, n = 256) {
	let r = Fd(), i = e ?? {}, a = (Array.isArray(i.colors) ? i.colors : r.colors).map((e) => ({
		t: Ld(e?.t, 0, 0, 1),
		color: Vd(e?.color, "#ffffff")
	})).sort((e, t) => e.t - t.t).slice(0, 12);
	a.length === 0 && (a = r.colors);
	let o = (Array.isArray(i.bursts) ? i.bursts : []).map((e) => ({
		time: Ld(e?.time, 0, 0, 60),
		count: Math.round(Ld(e?.count, 10, 0, 5e3))
	})).slice(0, 32);
	return {
		id: typeof i.id == "string" && i.id ? i.id : Pd(),
		name: typeof i.name == "string" && i.name ? i.name.slice(0, 60) : r.name,
		visible: zd(i.visible, !0),
		blend: Rd(i.blend, ["add", "normal"], r.blend),
		x: Ld(i.x, t / 2, -t, t * 2),
		y: Ld(i.y, n / 2, -n, n * 2),
		shape: Rd(i.shape, [
			"point",
			"circle",
			"ring",
			"rect",
			"line"
		], r.shape),
		shapeW: Ld(i.shapeW, r.shapeW, 0, 4096),
		shapeH: Ld(i.shapeH, r.shapeH, 0, 4096),
		shapeAngle: Ld(i.shapeAngle, 0, -360, 360),
		rate: Ld(i.rate, r.rate, 0, 3e3),
		bursts: o,
		startDelay: Ld(i.startDelay, 0, 0, 60),
		stopAfter: Ld(i.stopAfter, 0, 0, 60),
		maxParticles: Math.round(Ld(i.maxParticles, r.maxParticles, 1, 2e4)),
		lifetime: Hd(i.lifetime, r.lifetime, .02, 30),
		speed: Hd(i.speed, r.speed, -5e3, 5e3),
		direction: Ld(i.direction, r.direction, -720, 720),
		spread: Ld(i.spread, r.spread, 0, 360),
		directionMode: Rd(i.directionMode, [
			"angle",
			"outward",
			"inward"
		], "angle"),
		gravityX: Ld(i.gravityX, 0, -1e4, 1e4),
		gravityY: Ld(i.gravityY, 0, -1e4, 1e4),
		drag: Ld(i.drag, 0, 0, 50),
		turbulence: Ld(i.turbulence, 0, 0, 2e4),
		turbulenceScale: Ld(i.turbulenceScale, 60, 4, 2e3),
		vortex: Ld(i.vortex, 0, -2e4, 2e4),
		attract: Ld(i.attract, 0, -2e4, 2e4),
		floor: zd(i.floor, !1),
		floorY: Ld(i.floorY, n * .85, -4096, 8192),
		bounce: Ld(i.bounce, .3, 0, 1),
		friction: Ld(i.friction, .3, 0, 1),
		sprite: Rd(i.sprite, [
			"soft",
			"circle",
			"square",
			"spark",
			"star",
			"ring",
			"smoke",
			"shard"
		], r.sprite),
		texture: Md(i.texture),
		sizeStart: Hd(i.sizeStart, r.sizeStart, .5, 2048),
		sizeEnd: Ld(i.sizeEnd, r.sizeEnd, 0, 20),
		sizeEase: Rd(i.sizeEase, [
			"linear",
			"easeOut",
			"easeIn",
			"pop"
		], "linear"),
		colors: a,
		stepped: zd(i.stepped, !1),
		hueJitter: Ld(i.hueJitter, 0, 0, 180),
		alpha: Ld(i.alpha, 1, 0, 1),
		fadeIn: Ld(i.fadeIn, 0, 0, 1),
		fadeOut: Ld(i.fadeOut, .3, 0, 1),
		flicker: Ld(i.flicker, 0, 0, 1),
		stretch: Ld(i.stretch, 0, 0, 20),
		spin: Hd(i.spin, r.spin, -3600, 3600),
		randomRotation: zd(i.randomRotation, !0)
	};
}
function Wd(e) {
	let t = Id(), n = e ?? {}, r = Math.round(Ld(n.width, t.width, 16, 2048)), i = Math.round(Ld(n.height, t.height, 16, 2048)), a = n.pixel ?? {}, o = (Array.isArray(n.layers) ? n.layers.slice(0, 16) : t.layers).map((e) => Ud(e, r, i)), s = /* @__PURE__ */ new Set();
	for (let e of o) s.has(e.id) && (e.id = Pd()), s.add(e.id);
	return {
		version: 1,
		name: typeof n.name == "string" && n.name ? n.name.slice(0, 80) : t.name,
		width: r,
		height: i,
		duration: Ld(n.duration, t.duration, .1, 30),
		fps: Math.round(Ld(n.fps, t.fps, 1, 60)),
		loop: Rd(n.loop, ["perfect", "once"], "perfect"),
		background: Vd(n.background, t.background),
		bloom: Ld(n.bloom, 0, 0, 1),
		seed: Math.round(Ld(n.seed, 1, 0, 1e9)),
		pixel: {
			enabled: zd(a.enabled, !1),
			size: Math.round(Ld(a.size, 3, 1, 16)),
			palette: typeof a.palette == "string" ? a.palette : "endesga32",
			dither: zd(a.dither, !1),
			outline: zd(a.outline, !1),
			outlineColor: Vd(a.outlineColor, "#181425")
		},
		layers: o
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/render3d/sanitize.ts
var Gd = (e, t, n = -Infinity, r = Infinity) => Math.min(r, Math.max(n, typeof e == "number" && Number.isFinite(e) ? e : t)), Kd = (e, t, n) => typeof e == "string" && t.includes(e) ? e : n, qd = (e, t) => typeof e == "boolean" ? e : t, Jd = (e, t) => Vd(e, t), Yd = (e) => e && typeof e == "object" ? e : {}, Xd = [
	"smoke",
	"fire",
	"electric",
	"energy"
], Zd = () => ({
	enabled: !1,
	texture: "smoke",
	asset: "",
	mode: "lifetime",
	cycles: 1,
	fps: 24,
	randomStart: !1,
	frameCurve: [],
	startFrame: 0
});
function Qd(e) {
	let t = Zd(), n = Yd(e);
	return {
		enabled: qd(n.enabled, !1),
		texture: Kd(n.texture, Xd, t.texture),
		asset: Md(n.asset),
		mode: Kd(n.mode, ["lifetime", "fps"], t.mode),
		cycles: Math.round(Gd(n.cycles, 1, 1, 32)),
		fps: Gd(n.fps, t.fps, 1, 120),
		randomStart: qd(n.randomStart, !1),
		frameCurve: Yl(n.frameCurve, 0, 1),
		startFrame: Gd(n.startFrame, 0, 0, 1)
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/assetImages.ts
var $d = /* @__PURE__ */ new Map(), ef = 0;
function tf(e, t) {
	$d.set(e, {
		...t,
		version: ++ef
	});
}
function nf(e) {
	return e && $d.get(e) || null;
}
var rf = /* @__PURE__ */ new Map();
function af(e) {
	let t = nf(e);
	if (!t) return null;
	let n = rf.get(e);
	if (n && n.version === t.version) return n.canvas;
	let r = document.createElement("canvas");
	r.width = r.height = 64;
	let i = r.getContext("2d");
	i.imageSmoothingQuality = "high";
	let a = t.canvas.width / t.tilesX, o = t.canvas.height / t.tilesY;
	return i.drawImage(t.canvas, 0, 0, a, o, 0, 0, 64, 64), rf.set(e, {
		version: t.version,
		canvas: r
	}), r;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/shaders/dialect.ts
var of = "vec4 fxCustom(vec2 uv, vec4 tint, float life, float rnd, float age)", sf = [
	[/\b(uniform|varying|attribute|in|out|inout|precision|layout)\b/, "declares inputs or qualifiers; only the fxCustom function and helper functions are allowed"],
	[/\bgl_\w+/, "uses gl_ built-ins"],
	[/\b(texture2D|texture|textureLod|sampler2D|samplerCube)\b/, "samples textures directly; use fxTex(uv) or fxNoise(uv)"],
	[/\bmat[234]\b/, "uses matrices (their multiplication differs between GLSL and HLSL); write the maths with vectors"],
	[/\b(lessThan|greaterThan|lessThanEqual|greaterThanEqual|equal|notEqual|any|all|not)\s*\(/, "uses vector comparison functions"],
	[/#\s*\w+/, "uses preprocessor directives"],
	[/\b(discard)\b/, "uses discard; return alpha 0 instead"]
];
function cf(e) {
	let t = [], n = lf(e);
	/\bvec4\s+fxCustom\s*\(\s*vec2\s+\w+\s*,\s*vec4\s+\w+\s*,\s*float\s+\w+\s*,\s*float\s+\w+\s*,\s*float\s+\w+\s*\)/.test(n) || t.push(`缺少函数 ${of}（参数类型和顺序要一样）。`);
	for (let [e, r] of sf) {
		let i = e.exec(n);
		i && t.push(`不能用「${i[0].trim()}」：${r}。`);
	}
	return e.length > 2e4 && t.push("代码太长（最多 20000 个字符）。"), { errors: t };
}
function lf(e) {
	return e.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, "");
}
var uf = [
	[/\bvec([234])\b/g, "float$1"],
	[/\bivec([234])\b/g, "int$1"],
	[/\bbvec([234])\b/g, "bool$1"],
	[/\bmix\s*\(/g, "lerp("],
	[/\bfract\s*\(/g, "frac("],
	[/\bmod\s*\(/g, "fxMod("],
	[/\batan\s*\(/g, "fxAtan("],
	[/\binversesqrt\s*\(/g, "rsqrt("],
	[/\bdFdx\s*\(/g, "ddx("],
	[/\bdFdy\s*\(/g, "ddy("]
];
function df(e) {
	let t = lf(e);
	for (let [e, n] of uf) t = t.replace(e, n);
	return ff(t);
}
function ff(e) {
	let t = /\b((?:float|int|bool)[234])\s*\(/g, n = "", r = 0;
	for (let i = t.exec(e); i; i = t.exec(e)) {
		let a = i.index + i[0].length - 1, o = pf(e, a);
		if (o < 0) continue;
		let s = e.slice(a + 1, o);
		mf(s) > 0 || (n += `${e.slice(r, i.index)}((${i[1]})(${ff(s)}))`, r = o + 1, t.lastIndex = o + 1);
	}
	return n + e.slice(r);
}
function pf(e, t) {
	let n = 0;
	for (let r = t; r < e.length; r++) if (e[r] === "(") n++;
	else if (e[r] === ")" && --n === 0) return r;
	return -1;
}
function mf(e) {
	let t = 0, n = 0;
	for (let r of e) r === "(" ? t++ : r === ")" ? t-- : r === "," && t === 0 && n++;
	return n;
}
var hf = "\nuniform float fxTime;\nvec4 fxTex(vec2 uv) { return texture2D(uMap, uv); }\nvec4 fxNoise(vec2 uv) { return texture2D(uNoise, uv); }\n", gf = "\n#define fxTime (_Time.y)\nfloat4 fxTex(float2 uv) { return tex2D(_MainTex, uv); }\nfloat4 fxNoise(float2 uv) { return tex2D(_NoiseTex, uv); }\nfloat fxMod(float x, float y) { return x - y * floor(x / y); }\nfloat2 fxMod(float2 x, float y) { return x - y * floor(x / y); }\nfloat3 fxMod(float3 x, float y) { return x - y * floor(x / y); }\nfloat4 fxMod(float4 x, float y) { return x - y * floor(x / y); }\nfloat2 fxMod(float2 x, float2 y) { return x - y * floor(x / y); }\nfloat3 fxMod(float3 x, float3 y) { return x - y * floor(x / y); }\nfloat4 fxMod(float4 x, float4 y) { return x - y * floor(x / y); }\nfloat fxAtan(float y, float x) { return atan2(y, x); }\nfloat fxAtan(float x) { return atan(x); }\n", _f = 32;
function vf(e, t) {
	if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(e, t);
	let n = document.createElement("canvas");
	return n.width = e, n.height = t, n;
}
function yf(e) {
	return e.getContext("2d");
}
function bf(e) {
	let t = vf(64, 64);
	return Sf(yf(t), e), t;
}
function xf(e, t) {
	let n = document.createElement("canvas");
	n.width = n.height = t;
	let r = n.getContext("2d");
	return r.scale(t / 64, t / 64), Sf(r, e), n;
}
function Sf(e, t) {
	switch (e.fillStyle = "#fff", t) {
		case "soft": {
			let t = e.createRadialGradient(_f, _f, 0, _f, _f, _f);
			t.addColorStop(0, "rgba(255,255,255,1)"), t.addColorStop(.25, "rgba(255,255,255,0.75)"), t.addColorStop(.6, "rgba(255,255,255,0.22)"), t.addColorStop(1, "rgba(255,255,255,0)"), e.fillStyle = t, e.fillRect(0, 0, 64, 64);
			break;
		}
		case "circle":
			e.beginPath(), e.arc(_f, _f, 31, 0, Math.PI * 2), e.fill();
			break;
		case "square":
			e.fillRect(4, 4, 56, 56);
			break;
		case "ring":
			e.beginPath(), e.arc(_f, _f, 30, 0, Math.PI * 2), e.arc(_f, _f, 23, 0, Math.PI * 2, !0), e.fill();
			break;
		case "spark": {
			let t = e.createLinearGradient(0, _f, 64, _f);
			t.addColorStop(0, "rgba(255,255,255,0)"), t.addColorStop(.55, "rgba(255,255,255,1)"), t.addColorStop(.8, "rgba(255,255,255,0.9)"), t.addColorStop(1, "rgba(255,255,255,0)"), e.fillStyle = t, e.beginPath(), e.moveTo(0, _f), e.lineTo(38, 25), e.lineTo(64, _f), e.lineTo(38, 39), e.closePath(), e.fill();
			break;
		}
		case "star": {
			e.beginPath();
			for (let t = 0; t < 8; t++) {
				let n = t / 8 * Math.PI * 2 - Math.PI / 2, r = t % 2 == 0 ? 31 : _f * .22;
				e.lineTo(_f + Math.cos(n) * r, _f + Math.sin(n) * r);
			}
			e.closePath(), e.fill();
			let t = e.createRadialGradient(_f, _f, 0, _f, _f, _f * .5);
			t.addColorStop(0, "rgba(255,255,255,0.9)"), t.addColorStop(1, "rgba(255,255,255,0)"), e.fillStyle = t, e.fillRect(0, 0, 64, 64);
			break;
		}
		case "smoke":
			for (let [t, n, r] of [
				[
					0,
					0,
					.62
				],
				[
					-.28,
					-.12,
					.42
				],
				[
					.26,
					-.18,
					.4
				],
				[
					.18,
					.24,
					.38
				],
				[
					-.2,
					.22,
					.36
				]
			]) {
				let i = _f + t * _f, a = _f + n * _f, o = e.createRadialGradient(i, a, 0, i, a, r * _f);
				o.addColorStop(0, "rgba(255,255,255,0.55)"), o.addColorStop(.7, "rgba(255,255,255,0.25)"), o.addColorStop(1, "rgba(255,255,255,0)"), e.fillStyle = o, e.fillRect(0, 0, 64, 64);
			}
			break;
		case "shard": e.beginPath(), e.moveTo(12, 38), e.lineTo(28, 8), e.lineTo(54, 28), e.lineTo(38, 54), e.closePath(), e.fill();
	}
}
var Cf = /* @__PURE__ */ new Map(), wf = /* @__PURE__ */ new Map();
function Tf(e) {
	let t = Cf.get(e);
	return t || Cf.set(e, t = bf(e)), t;
}
function Ef(e, t, n, r) {
	return Of(e, Tf(e), t, n, r, !1);
}
function Df(e, t, n, r, i) {
	return Of(`@${e}`, t, n, r, i, !0);
}
function Of(e, t, n, r, i, a) {
	let o = n >> 3, s = r >> 3, c = i >> 3, l = `${e}${o << 10 | s << 5 | c}`, u = wf.get(l);
	if (u) return u;
	wf.size > 5e3 && wf.clear(), u = vf(64, 64);
	let d = yf(u);
	return d.drawImage(t, 0, 0, 64, 64), d.globalCompositeOperation = a ? "multiply" : "source-in", d.fillStyle = `rgb(${o * 8 + 4},${s * 8 + 4},${c * 8 + 4})`, d.fillRect(0, 0, 64, 64), a && (d.globalCompositeOperation = "destination-in", d.drawImage(t, 0, 0, 64, 64)), wf.set(l, u), u;
}
function kf(e = 128, t = 32) {
	let n = document.createElement("canvas");
	n.width = e, n.height = t;
	let r = n.getContext("2d"), i = r.createLinearGradient(0, 0, 0, t);
	i.addColorStop(0, "rgba(255,255,255,0)"), i.addColorStop(.3, "rgba(255,255,255,0.65)"), i.addColorStop(.5, "rgba(255,255,255,1)"), i.addColorStop(.7, "rgba(255,255,255,0.65)"), i.addColorStop(1, "rgba(255,255,255,0)"), r.fillStyle = i, r.fillRect(0, 0, e, t);
	let a = r.createLinearGradient(0, 0, e * .12, 0);
	return a.addColorStop(0, "rgba(0,0,0,0)"), a.addColorStop(1, "rgba(0,0,0,1)"), r.globalCompositeOperation = "destination-in", r.fillStyle = a, r.fillRect(0, 0, e, t), r.globalCompositeOperation = "source-over", n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/textures/noise.ts
function Af(e, t, n) {
	let r = Math.imul(e, 374761393) + Math.imul(t, 668265263) + Math.imul(n, 2246822519) | 0;
	return r = Math.imul(r ^ r >>> 13, 1274126177), r ^= r >>> 16, (r >>> 0) / 4294967296;
}
var jf = (e) => e * e * (3 - 2 * e);
function Mf(e, t, n, r, i = 0) {
	let a = Math.floor(e), o = Math.floor(t), s = jf(e - a), c = jf(t - o), l = (e, t) => Af(((a + e) % n + n) % n, ((o + t) % r + r) % r, i), u = l(0, 0), d = l(1, 0), f = l(0, 1), p = l(1, 1);
	return u + (d - u) * s + (f - u) * c + (u - d - f + p) * s * c;
}
function Nf(e, t, n, r = 4, i = 0, a = n) {
	let o = 0, s = .5, c = 0, l = n, u = a;
	for (let n = 0; n < r; n++) o += s * Mf(e * l, t * u, l, u, i + n * 17), c += s, s *= .5, l *= 2, u *= 2;
	return o / c;
}
function Pf(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 | 0;
		let e = Math.imul(t ^ t >>> 15, 1 | t);
		return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
var Ff = (e) => e < 0 ? 0 : e > 1 ? 1 : e;
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/textures/raster.ts
function If(e, t) {
	let n = document.createElement("canvas");
	return n.width = e, n.height = t, n;
}
function Lf(e, t, n, r, i, a) {
	let o = e.getContext("2d"), s = o.createImageData(r, i), c = s.data;
	for (let e = 0; e < i; e++) for (let t = 0; t < r; t++) {
		let n = a((t + .5) / r, (e + .5) / i), o = (e * r + t) * 4;
		c[o] = c[o + 1] = c[o + 2] = 255, c[o + 3] = Math.round(Math.max(0, Math.min(1, n)) * 255);
	}
	o.putImageData(s, t, n);
}
function Rf(e, t) {
	let n = e.getContext("2d"), r = n.createImageData(e.width, e.height), i = r.data;
	for (let n = 0; n < e.height; n++) for (let r = 0; r < e.width; r++) {
		let a = Math.round(Math.max(0, Math.min(1, t((r + .5) / e.width, (n + .5) / e.height))) * 255), o = (n * e.width + r) * 4;
		i[o] = i[o + 1] = i[o + 2] = a, i[o + 3] = 255;
	}
	n.putImageData(r, 0, 0);
}
var zf = (e, t, n, r) => {
	let i = Math.hypot(e - .5, t - .5) * 2, a = .55 + .4 * n, o = Nf(e + n * .35, t - n * .25, 3, 4, 21 + r);
	return Ff((a - i + (o - .5) * .55) / .35) * (.35 + .65 * o) * (1 - .75 * n);
}, Bf = (e, t, n, r) => {
	let i = (e - .5) * 2, a = 1 - t, o = Nf(e * .8, t * .8 + n, 3, 4, 5 + r), s = Nf(e * 1.6, t * 1.6 + n * 2, 3, 3, 9 + r), c = (o - .5) * .5 * a, l = .62 * Math.sqrt(Ff(a / .18)) * Ff(1 - a / .92) ** .9, u = Math.abs(i - c), d = Ff((l - u) / (.35 * l + .05)), f = Ff((s - (a * .75 - .15)) / .25), p = Ff(a / .12), m = .55 + .45 * Ff(1 - u / (l + .001));
	return Ff(d * f * p * m * 1.15);
}, Vf = (e, t, n, r) => {
	let i = e - .5, a = t - .5, o = Math.hypot(i, a) * 2, s = Nf(Math.atan2(a, i) / (Math.PI * 2) + .5 + n, o * .5, 6, 3, 9 + r, 2), c = Math.exp(-(((o - .62 - (s - .5) * .25) / .12) ** 2)), l = Math.exp(-o * o * 6) * .8;
	return Ff(c * (.5 + s) + l);
};
function Hf(e, t, n, r, i, a) {
	let o = e.getContext("2d"), s = Pf(1e3 + r + i * 7919), c = a / 64;
	o.save(), o.beginPath(), o.rect(t, n, a, a), o.clip(), o.lineCap = "round", o.lineJoin = "round";
	for (let e = 0; e < 2; e++) {
		let r = [], i = a * (.3 + s() * .4);
		for (let e = 0; e <= 10; e++) r.push([t + e / 10 * a, n + i]), i = Math.max(a * .1, Math.min(a * .9, i + (s() - .5) * a * .28));
		for (let [t, n] of [
			[7, .18],
			[3.5, .45],
			[1.4, 1]
		]) o.strokeStyle = `rgba(255,255,255,${e ? n * .6 : n})`, o.lineWidth = (e ? t * .6 : t) * c, o.beginPath(), r.forEach(([e, t], n) => n ? o.lineTo(e, t) : o.moveTo(e, t)), o.stroke();
	}
	o.restore();
}
var Uf = {
	smoke: zf,
	fire: Bf,
	energy: Vf
};
function Wf(e, t = 4, n = 0, r = 64) {
	let i = t, a = If(r * i, r * i);
	for (let t = 0; t < i * i; t++) {
		let o = t % i * r, s = Math.floor(t / i) * r;
		if (e === "electric") Hf(a, o, s, t, n, r);
		else {
			let c = Uf[e], l = t / (i * i);
			Lf(a, o, s, r, r, (e, t) => c(e, t, l, n));
		}
	}
	return a;
}
function Gf(e = 128) {
	let t = If(e, e);
	return Rf(t, (e, t) => Ff((Nf(e, t, 4, 4, 7) - .5) * 1.6 + .5)), t;
}
function Kf(e, t = 128) {
	let n = If(t, t);
	return e === "noise" ? Lf(n, 0, 0, t, t, (e, t) => Ff((Nf(e, t, 3, 4, 3) - .3) / .5) ** 1.6) : Lf(n, 0, 0, t, t, (e, t) => Ff((Nf(e, t, 2, 3, 11, 12) - .42) / .35) ** 2.2), n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/preview3d/textures.ts
var qf = /* @__PURE__ */ new Map();
function Jf(e, t, r) {
	let i = qf.get(e);
	return i || (i = new bi(t()), i.colorSpace = r.srgb ? Ne : "", r.repeat && (i.wrapS = i.wrapT = n), qf.set(e, i), i);
}
function Yf(e) {
	return Jf(`sprite:${e}`, () => {
		let t = document.createElement("canvas");
		return t.width = t.height = 64, t.getContext("2d").drawImage(Tf(e), 0, 0), t;
	}, {
		srgb: !0,
		repeat: !1
	});
}
var Xf = () => Jf("trail", () => kf(), {
	srgb: !0,
	repeat: !1
}), Zf = (e) => Jf(`sheet:${e}`, () => Wf(e), {
	srgb: !0,
	repeat: !1
}), Qf = (e) => Jf(`tile:${e}`, () => Kf(e), {
	srgb: !0,
	repeat: !0
}), $f = () => Jf("noise", () => Gf(), {
	srgb: !1,
	repeat: !0
}), ep = /* @__PURE__ */ new Map();
function tp(e, t) {
	let r = ep.get(e);
	if (r && r.version === t.version) return r.texture;
	r?.texture.dispose();
	let i = new bi(t.canvas);
	return i.colorSpace = Ne, t.kind === "tile" && (i.wrapS = i.wrapT = n), ep.set(e, {
		version: t.version,
		texture: i
	}), i;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/preview3d/particleMaterial.ts
var np = { value: 0 };
function rp(e, t = null) {
	return new Ii({
		vertexShader: e,
		fragmentShader: t ? wd(hf, t) : xd,
		uniforms: {
			fxTime: np,
			uMap: { value: null },
			uIntensity: { value: 1 },
			uBlendKind: { value: 0 },
			uScroll: { value: new J() },
			uSheetGrid: { value: new J() },
			uSheetMode: { value: 0 },
			uSheetCycles: { value: 1 },
			uSheetFps: { value: 24 },
			uSheetRandom: { value: 0 },
			uSheetStart: { value: 0 },
			uFrameKeys: { value: Array.from({ length: 16 }, () => new J()) },
			uFrameKeyCount: { value: 0 },
			uDissolve: { value: 0 },
			uDissolveRange: { value: new J(0, 1) },
			uDissolveEdge: { value: .08 },
			uDissolveScale: { value: 1 },
			uEdgeColor: { value: new Z() },
			uNoise: { value: null },
			uDissolveTexOn: { value: 0 },
			uDissolveSoft: { value: .02 },
			uDissolveKeys: { value: Array.from({ length: 16 }, () => new J()) },
			uDissolveKeyCount: { value: 0 },
			uFresnel: { value: 0 },
			uFresnelPower: { value: 2 },
			uFresnelColor: { value: new Z() },
			uSoftness: { value: 0 },
			uDepth: { value: null },
			uResolution: { value: new J(1, 1) },
			uNear: { value: .05 },
			uFar: { value: 500 },
			uMode: { value: 0 },
			uLengthScale: { value: 2 },
			uVelocityScale: { value: 0 },
			uAlign: { value: 0 },
			uPivot: { value: new Y() },
			uFlip: { value: new J() },
			uApplyColorSpace: { value: 1 },
			uSizeLimit: { value: new J(0, 100) },
			uLocalRot: { value: new X() }
		},
		transparent: !0,
		depthWrite: !1,
		side: 2
	});
}
var ip = (e, t) => e.setRGB(parseInt(t.slice(1, 3), 16) / 255, parseInt(t.slice(3, 5), 16) / 255, parseInt(t.slice(5, 7), 16) / 255, Pe);
function ap(e) {
	return e.blend === "premultiply" || e.blend === "softAdd" ? 5 : e.blend === "add" ? 2 : 1;
}
var op = (e) => e.blend === "premultiply" ? 1 : e.blend === "softAdd" ? 2 : 0;
function sp(e, t) {
	e.blending = ap(t), e.blendSrc = 201, e.blendDst = t.blend === "softAdd" ? 203 : 205, e.blendEquation = 100, e.uniforms.uBlendKind && (e.uniforms.uBlendKind.value = op(t));
}
function cp(e, t, n) {
	let r = e.uniforms, i = t.material;
	sp(e, t);
	let a = t.sheet.enabled, o = a && t.sheet.asset ? nf(t.sheet.asset) : null, s = !a && i.texture ? nf(i.texture) : null;
	r.uMap.value = o ? tp(t.sheet.asset, o) : a ? Zf(t.sheet.texture) : s ? tp(i.texture, s) : i.mainTexture === "sprite" ? Yf(t.sprite) : Qf(i.mainTexture), r.uSheetGrid.value.set(a ? o?.tilesX ?? 4 : 0, a ? o?.tilesY ?? 4 : 0), r.uSheetMode.value = +(t.sheet.mode === "fps"), r.uSheetCycles.value = t.sheet.cycles, r.uSheetFps.value = t.sheet.fps, r.uSheetRandom.value = +!!t.sheet.randomStart, r.uSheetStart.value = t.sheet.startFrame;
	let c = t.sheet.frameCurve;
	r.uFrameKeys.value.forEach((e, t) => e.set(c[t]?.t ?? 1, c[t]?.v ?? 0)), r.uFrameKeyCount.value = Math.min(16, c.length), r.uIntensity.value = i.intensity, r.uScroll.value.set(i.scrollX, i.scrollY), r.uDissolve.value = +!!i.dissolve, r.uDissolveRange.value.set(i.dissolveFrom, i.dissolveTo), r.uDissolveEdge.value = i.dissolveEdge, r.uDissolveScale.value = i.dissolveScale, ip(r.uEdgeColor.value, i.dissolveEdgeColor);
	let l = i.dissolveTexture ? nf(i.dissolveTexture) : null;
	r.uNoise.value = l ? tp(i.dissolveTexture, l) : $f(), r.uDissolveTexOn.value = +!!l, r.uDissolveSoft.value = i.dissolveSoftness, r.uDissolveKeys.value.forEach((e, t) => e.set(i.dissolveCurve[t]?.t ?? 1, i.dissolveCurve[t]?.v ?? 0)), r.uDissolveKeyCount.value = Math.min(16, i.dissolveCurve.length), r.uFresnel.value = t.renderMode === "mesh" ? i.fresnel : 0, r.uFresnelPower.value = i.fresnelPower, ip(r.uFresnelColor.value, i.fresnelColor), r.uSoftness.value = n.texture ? i.softness : 0, r.uDepth.value = n.texture, r.uResolution.value.set(n.width, n.height), r.uNear.value = n.near, r.uFar.value = n.far;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/customShaders.ts
var lp = /* @__PURE__ */ new Map(), up = 0;
function dp(e, t) {
	lp.set(e, {
		code: t,
		version: ++up
	});
}
function fp(e) {
	return e && lp.get(e) || null;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/preview3d/particleLayers.ts
var pp = {
	billboard: 0,
	stretched: 1,
	horizontal: 2,
	vertical: 3,
	mesh: 0,
	none: 0
}, mp = {
	velocity: 0,
	random: 1,
	local: 2,
	view: 3
}, hp = {
	iPos: 3,
	iSize: 1,
	iRot: 1,
	iColor: 4,
	iVel: 3,
	iData: 3,
	iShape: 4
};
function gp(e) {
	if (e.renderMode !== "mesh") return new Ei(1, 1);
	let t = gd(e.mesh), n = (e) => e.map((e, t) => t % 3 == 2 ? -e : e), r = new Tr();
	return r.setAttribute("position", new pr(n(t.positions), 3)), r.setAttribute("normal", new pr(n(t.normals), 3)), r.setAttribute("uv", new pr(t.uvs, 2)), r.setIndex(t.indices), r;
}
function _p(e, t) {
	let n = e.emitter.sortMode;
	if (n === "none" || e.count < 2 || n === "distance" && !t) return null;
	let r = e.data, i = new Float64Array(e.count);
	for (let a = 0; a < e.count; a++) {
		let e = a * 19;
		if (n === "distance") {
			let n = r[e] - t.x, o = r[e + 1] - t.y, s = -r[e + 2] - t.z;
			i[a] = -(n * n + o * o + s * s);
		} else i[a] = n === "youngestInFront" ? -r[e + 14] : r[e + 14];
	}
	let a = new Int32Array(e.count);
	for (let t = 0; t < e.count; t++) a[t] = t;
	return a.sort((e, t) => i[e] - i[t]), a;
}
function vp(e, t) {
	t.set(e[0], e[1], -e[2], e[3], e[4], -e[5], -e[6], -e[7], e[8]);
}
var yp = class {
	scene;
	slots = [];
	constructor(e) {
		this.scene = e;
	}
	upload(e, t, n) {
		e.forEach((e, r) => {
			let i = e.emitter, a = this.ensure(r, i, e.count);
			a.mesh.visible = e.count > 0 && i.rendered && i.renderMode !== "none", a.mesh.renderOrder = r, cp(a.mat, i, t);
			let o = a.mat.uniforms;
			o.uMode.value = pp[i.renderMode], o.uLengthScale.value = i.lengthScale, o.uVelocityScale.value = i.velocityScale, o.uAlign.value = mp[i.meshAlign], o.uPivot.value.set(i.pivot.x, i.pivot.y, i.pivot.z), o.uFlip.value.set(i.flip.x, i.flip.y), o.uApplyColorSpace.value = +!!i.applyColorSpace, o.uSizeLimit.value.set(i.minParticleSize, Math.max(i.minParticleSize, i.maxParticleSize)), vp(e.rot, o.uLocalRot.value), this.fill(a, e, _p(e, n));
		});
		for (let t = e.length; t < this.slots.length; t++) this.slots[t] && (this.slots[t].mesh.visible = !1);
	}
	objectsFor(e) {
		return this.slots.filter((t, n) => t && e.has(n)).map((e) => e.mesh);
	}
	fill(e, t, n) {
		let r = e.attrs, i = r.iPos.array, a = r.iSize.array, o = r.iRot.array, s = r.iColor.array, c = r.iVel.array, l = r.iData.array, u = r.iShape.array, d = t.data;
		for (let e = 0; e < t.count; e++) {
			let t = (n ? n[e] : e) * 19;
			i[e * 3] = d[t], i[e * 3 + 1] = d[t + 1], i[e * 3 + 2] = -d[t + 2], a[e] = d[t + 3], o[e] = -d[t + 4], s[e * 4] = d[t + 5], s[e * 4 + 1] = d[t + 6], s[e * 4 + 2] = d[t + 7], s[e * 4 + 3] = d[t + 8], c[e * 3] = d[t + 9], c[e * 3 + 1] = d[t + 10], c[e * 3 + 2] = -d[t + 11], l[e * 3] = d[t + 12], l[e * 3 + 1] = d[t + 13], l[e * 3 + 2] = d[t + 14], u[e * 4] = d[t + 15], u[e * 4 + 1] = d[t + 16], u[e * 4 + 2] = d[t + 17], u[e * 4 + 3] = d[t + 18];
		}
		for (let e of Object.values(r)) e.needsUpdate = !0, e.clearUpdateRanges(), e.addUpdateRange(0, t.count * e.itemSize);
		e.geo.instanceCount = t.count;
	}
	ensure(e, t, n) {
		let r = t.material.shader ? fp(t.material.shader) : null, i = t.renderMode === "mesh" ? ed(t.mesh)?.version ?? 0 : 0, a = `${t.renderMode === "mesh" ? `mesh:${t.mesh}@${i}` : "quad"}${r ? `|${t.material.shader}@${r.version}` : ""}`, o = this.slots[e];
		if (o && o.key === a && o.cap >= n) return o;
		o && (this.scene.remove(o.mesh), o.geo.dispose(), o.mat.dispose());
		let s = Math.max(256, Math.ceil(n * 1.5)), c = gp(t), l = new Ea();
		l.index = c.index;
		for (let e of [
			"position",
			"normal",
			"uv"
		]) c.getAttribute(e) && l.setAttribute(e, c.getAttribute(e));
		let u = {};
		for (let [e, t] of Object.entries(hp)) {
			let n = new $r(new Float32Array(s * t), t);
			n.setUsage(ze), l.setAttribute(e, n), u[e] = n;
		}
		let d = rp(t.renderMode === "mesh" ? yd : vd, r?.code ?? null), f = new Yr(l, d);
		return f.frustumCulled = !1, f.layers.set(1), this.scene.add(f), o = {
			key: a,
			mesh: f,
			geo: l,
			mat: d,
			cap: s,
			attrs: u
		}, this.slots[e] = o, o;
	}
}, bp = [
	1,
	1,
	1
];
function xp(e, t) {
	let n = e[0], r = e[e.length - 1];
	for (let i = 0; i < e.length - 1; i++) if (t >= e[i].t && t <= e[i + 1].t) {
		n = e[i], r = e[i + 1];
		break;
	}
	let i = zl(n.color), a = zl(r.color), o = r.t > n.t ? Math.min(1, Math.max(0, (t - n.t) / (r.t - n.t))) : 0;
	return [
		(i[0] + (a[0] - i[0]) * o) / 255,
		(i[1] + (a[1] - i[1]) * o) / 255,
		(i[2] + (a[2] - i[2]) * o) / 255
	];
}
var Sp = class {
	scene;
	meshes = [];
	constructor(e) {
		this.scene = e;
	}
	objectsFor(e) {
		return this.meshes.filter((t, n) => t && e.has(n)).map((e) => e.mesh);
	}
	upload(e, t) {
		e.forEach((e, n) => {
			if (!e.trailCount || !e.emitter.rendered) {
				this.meshes[n] && (this.meshes[n].mesh.visible = !1);
				return;
			}
			let r = 0;
			for (let t = 0, n = 0; n < e.trailCount; n++) {
				let n = e.trails[t];
				r += n * 2, t += 6 + n * 4;
			}
			let i = this.ensure(n, r);
			i.mesh.visible = !0, i.mesh.renderOrder = n - .5;
			let a = e.emitter;
			sp(i.mat, a.trailBlend ? {
				...a,
				blend: a.trailBlend
			} : a), i.mat.uniforms.uIntensity.value = a.material.intensity * a.trailIntensity;
			let o = a.trailTexture ? nf(a.trailTexture) : null;
			i.mat.uniforms.uMap.value = o ? tp(a.trailTexture, o) : Xf(), i.mat.uniforms.uApplyColorSpace.value = +!!e.emitter.applyColorSpace, i.geo.setDrawRange(0, this.build(i, e, t));
		});
		for (let t = e.length; t < this.meshes.length; t++) this.meshes[t] && (this.meshes[t].mesh.visible = !1);
	}
	build(e, t, n) {
		let r = t.emitter, i = e.pos.array, a = e.col.array, o = e.uv.array, s = e.index.array, c = 0, l = 0, u = t.trails;
		for (let e = 0, d = 0; d < t.trailCount; d++) {
			let t = u[e], d = u[e + 1], f = u[e + 2], p = u[e + 3], m = u[e + 4], h = u[e + 5], g = e + 6;
			for (let e = 0; e < t; e++) {
				let _ = g + e * 4, v = u[_], y = u[_ + 1], b = -u[_ + 2], x = u[_ + 3], S = Math.max(0, e - 1), C = Math.min(t - 1, e + 1), w = u[g + C * 4] - u[g + S * 4], T = u[g + C * 4 + 1] - u[g + S * 4 + 1], E = -(u[g + C * 4 + 2] - u[g + S * 4 + 2]), D = Math.hypot(w, T, E) || 1;
				w /= D, T /= D, E /= D;
				let O = n.x - v, k = n.y - y, A = n.z - b, j = T * A - E * k, M = E * O - w * A, N = w * k - T * O, P = Math.hypot(j, M, N) || 1, F = d * (r.trailWidthCurve.length ? Xl(r.trailWidthCurve, x) : 1 + (r.trailWidthEnd - 1) * x) / 2;
				j = j / P * F, M = M / P * F, N = N / P * F;
				let I = h * (r.trailAlongAlpha.length ? Xl(r.trailAlongAlpha, x) : 1 - x), L = r.trailAlongColors.length ? xp(r.trailAlongColors, x) : bp;
				for (let e of [-1, 1]) i[c * 3] = v + j * e, i[c * 3 + 1] = y + M * e, i[c * 3 + 2] = b + N * e, a[c * 4] = f * L[0], a[c * 4 + 1] = p * L[1], a[c * 4 + 2] = m * L[2], a[c * 4 + 3] = I, o[c * 2] = x, o[c * 2 + 1] = e < 0 ? 0 : 1, c++;
				if (e > 0) {
					let e = c - 4;
					s[l++] = e, s[l++] = e + 1, s[l++] = e + 2, s[l++] = e + 1, s[l++] = e + 3, s[l++] = e + 2;
				}
			}
			e += 6 + t * 4;
		}
		for (let t of [
			e.pos,
			e.col,
			e.uv,
			e.index
		]) t.needsUpdate = !0;
		return l;
	}
	ensure(e, t) {
		let n = this.meshes[e];
		if (n && n.capV >= t) return n;
		n && (this.scene.remove(n.mesh), n.geo.dispose(), n.mat.dispose());
		let r = Math.max(1024, Math.ceil(t * 1.5)), i = new Tr(), a = new ur(new Float32Array(r * 3), 3), o = new ur(new Float32Array(r * 4), 4), s = new ur(new Float32Array(r * 2), 2), c = new ur(new Uint32Array(r * 3), 1);
		for (let e of [
			a,
			o,
			s,
			c
		]) e.setUsage(ze);
		i.setAttribute("position", a), i.setAttribute("aColor", o), i.setAttribute("uv", s), i.setIndex(c);
		let l = new Ii({
			vertexShader: Sd,
			fragmentShader: Cd,
			uniforms: {
				uMap: { value: Xf() },
				uIntensity: { value: 1 },
				uBlendKind: { value: 0 },
				uApplyColorSpace: { value: 1 }
			},
			transparent: !0,
			depthWrite: !1,
			side: 2
		}), u = new Yr(i, l);
		return u.frustumCulled = !1, u.layers.set(1), this.scene.add(u), n = {
			mesh: u,
			geo: i,
			mat: l,
			capV: r,
			pos: a,
			col: o,
			uv: s,
			index: c
		}, this.meshes[e] = n, n;
	}
}, Cp = class {
	group = new Cn();
	key = "";
	update(e, t) {
		let n = e && t ? JSON.stringify([
			e.empty,
			e.shape,
			e.radius,
			e.angle,
			e.arc,
			e.boxSize,
			t,
			e.floor,
			e.floorY
		]) : "";
		if (n === this.key || (this.key = n, this.group.clear(), !e || !t)) return;
		let r = e.empty ? wp() : Tp(e), i = t.M, a = t.pos, o = new Float32Array(r.length);
		for (let e = 0; e < r.length; e += 3) {
			let t = r[e], n = r[e + 1], s = r[e + 2];
			o[e] = i[0] * t + i[1] * n + i[2] * s + a.x, o[e + 1] = i[3] * t + i[4] * n + i[5] * s + a.y, o[e + 2] = -(i[6] * t + i[7] * n + i[8] * s + a.z);
		}
		let s = new Tr();
		if (s.setAttribute("position", new ur(o, 3)), this.group.add(new vi(s, new oi({
			color: 16764779,
			transparent: !0,
			opacity: .75,
			depthTest: !1
		}))), e.floor && !e.empty) {
			let t = new Yr(new Ei(6, 6), new Lr({
				color: 7915775,
				transparent: !0,
				opacity: .08,
				side: 2,
				depthWrite: !1
			}));
			t.rotation.x = -Math.PI / 2, t.position.y = e.floorY, this.group.add(t);
		}
	}
};
function wp() {
	return [
		-.3,
		0,
		0,
		.3,
		0,
		0,
		0,
		-.3,
		0,
		0,
		.3,
		0,
		0,
		0,
		0,
		0,
		0,
		.6,
		.25,
		0,
		.45,
		0,
		0,
		.6,
		-.25,
		0,
		.45,
		0,
		0,
		.6
	];
}
function Tp(e) {
	let t = [], n = (e, n) => t.push(...e, ...n), r = (e, t, r = 360) => {
		let i = r * Math.PI / 180;
		for (let r = 0; r < 48; r++) {
			let a = r / 48 * i, o = (r + 1) / 48 * i;
			n([
				Math.cos(a) * e,
				Math.sin(a) * e,
				t
			], [
				Math.cos(o) * e,
				Math.sin(o) * e,
				t
			]);
		}
	}, i = Math.max(e.radius, .02);
	switch (e.shape) {
		case "sphere":
		case "hemisphere":
			r(i, 0);
			for (let t = 0; t < 48; t++) {
				let r = t / 48 * Math.PI * 2, a = (t + 1) / 48 * Math.PI * 2;
				e.shape === "hemisphere" && (Math.sin(r) < -1e-6 || Math.sin(a) < -1e-6) || (n([
					Math.cos(r) * i,
					0,
					Math.sin(r) * i
				], [
					Math.cos(a) * i,
					0,
					Math.sin(a) * i
				]), n([
					0,
					Math.cos(r) * i,
					Math.sin(r) * i
				], [
					0,
					Math.cos(a) * i,
					Math.sin(a) * i
				]));
			}
			break;
		case "cone": {
			r(i, 0, e.arc);
			let t = i + Math.tan(Math.min(e.angle, 85) * Math.PI / 180) * 1;
			r(t, 1, e.arc);
			for (let r = 0; r < 4; r++) {
				let a = r / 4 * (e.arc * Math.PI / 180);
				n([
					Math.cos(a) * i,
					Math.sin(a) * i,
					0
				], [
					Math.cos(a) * t,
					Math.sin(a) * t,
					1
				]);
			}
			break;
		}
		case "circle":
			r(i, 0, e.arc);
			break;
		case "box": {
			let { x: t, y: r, z: i } = e.boxSize, a = [-.5, .5];
			for (let e of a) for (let o of a) n([
				-t / 2,
				e * r,
				o * i
			], [
				t / 2,
				e * r,
				o * i
			]), n([
				e * t,
				-r / 2,
				o * i
			], [
				e * t,
				r / 2,
				o * i
			]), n([
				e * t,
				o * r,
				-i / 2
			], [
				e * t,
				o * r,
				i / 2
			]);
			break;
		}
		case "edge": n([
			-i,
			0,
			0
		], [
			i,
			0,
			0
		]);
	}
	if (e.shape !== "box") {
		let { x: n, y: r, z: i } = e.boxSize;
		for (let e = 0; e < t.length; e += 3) t[e] *= n, t[e + 1] *= r, t[e + 2] *= i;
	}
	return n([
		0,
		0,
		0
	], [
		0,
		0,
		.6
	]), t;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/preview3d/stage.ts
function Ep(e) {
	let t = new Ka(20, 20, 5919856, 3420234);
	t.layers.set(2), e.add(t), e.add(new ca(14210303, 3156024, 2.2));
	let n = new Ta(16777215, 1.6);
	n.position.set(3, 6, 4), e.add(n);
	let r = new Cn(), i = new Ri({
		color: 7301762,
		roughness: .8
	}), a = new Yr(new Ti(.28, 1, 6, 16), i);
	a.position.y = .78;
	let o = new Yr(new Di(.16, 20, 14), i);
	o.position.y = 1.62, r.add(a, o), e.add(r);
	let s = new Yr(new Ei(200, 200), new Lr({ colorWrite: !1 }));
	s.rotation.x = -Math.PI / 2, s.layers.set(3), e.add(s);
	let c = new Yr(new Ei(200, 200), new Lr({ colorWrite: !1 }));
	return c.rotation.x = -Math.PI / 2, c.position.y = -.002, c.renderOrder = -1e3, e.add(c), {
		grid: t,
		character: r
	};
}
// ../../../../Downloads/FX-Forge-源码及Web-20261110/FX-Forge/node_modules/three/examples/jsm/shaders/CopyShader.js
var Dp = {
	name: "CopyShader",
	uniforms: {
		tDiffuse: { value: null },
		opacity: { value: 1 }
	},
	vertexShader: "\n\n		varying vec2 vUv;\n\n		void main() {\n\n			vUv = uv;\n			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n		}",
	fragmentShader: "\n\n		uniform float opacity;\n\n		uniform sampler2D tDiffuse;\n\n		varying vec2 vUv;\n\n		void main() {\n\n			vec4 texel = texture2D( tDiffuse, vUv );\n			gl_FragColor = opacity * texel;\n\n\n		}"
}, Op = class {
	constructor() {
		this.isPass = !0, this.enabled = !0, this.needsSwap = !0, this.clear = !1, this.renderToScreen = !1;
	}
	setSize() {}
	render() {
		console.error("THREE.Pass: .render() must be implemented in derived pass.");
	}
	dispose() {}
}, kp = new Ca(-1, 1, 1, -1, 0, 1), Ap = new class extends Tr {
	constructor() {
		super(), this.setAttribute("position", new pr([
			-1,
			3,
			0,
			-1,
			-1,
			0,
			3,
			-1,
			0
		], 3)), this.setAttribute("uv", new pr([
			0,
			2,
			0,
			0,
			2,
			0
		], 2));
	}
}(), jp = class {
	constructor(e) {
		this._mesh = new Yr(Ap, e);
	}
	dispose() {
		this._mesh.geometry.dispose();
	}
	render(e) {
		e.render(this._mesh, kp);
	}
	get material() {
		return this._mesh.material;
	}
	set material(e) {
		this._mesh.material = e;
	}
}, Mp = class extends Op {
	constructor(e, t = "tDiffuse") {
		super(), this.textureID = t, this.uniforms = null, this.material = null, e instanceof Ii ? (this.uniforms = e.uniforms, this.material = e) : e && (this.uniforms = Ni.clone(e.uniforms), this.material = new Ii({
			name: e.name === void 0 ? "unspecified" : e.name,
			defines: Object.assign({}, e.defines),
			uniforms: this.uniforms,
			vertexShader: e.vertexShader,
			fragmentShader: e.fragmentShader
		})), this._fsQuad = new jp(this.material);
	}
	render(e, t, n) {
		this.uniforms[this.textureID] && (this.uniforms[this.textureID].value = n.texture), this._fsQuad.material = this.material, this.renderToScreen ? (e.setRenderTarget(null), this._fsQuad.render(e)) : (e.setRenderTarget(t), this.clear && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), this._fsQuad.render(e));
	}
	dispose() {
		this.material.dispose(), this._fsQuad.dispose();
	}
}, Np = class extends Op {
	constructor(e, t) {
		super(), this.scene = e, this.camera = t, this.clear = !0, this.needsSwap = !1, this.inverse = !1;
	}
	render(e, t, n) {
		let r = e.getContext(), i = e.state;
		i.buffers.color.setMask(!1), i.buffers.depth.setMask(!1), i.buffers.color.setLocked(!0), i.buffers.depth.setLocked(!0);
		let a, o;
		this.inverse ? (a = 0, o = 1) : (a = 1, o = 0), i.buffers.stencil.setTest(!0), i.buffers.stencil.setOp(r.REPLACE, r.REPLACE, r.REPLACE), i.buffers.stencil.setFunc(r.ALWAYS, a, 4294967295), i.buffers.stencil.setClear(o), i.buffers.stencil.setLocked(!0), e.setRenderTarget(n), this.clear && e.clear(), e.render(this.scene, this.camera), e.setRenderTarget(t), this.clear && e.clear(), e.render(this.scene, this.camera), i.buffers.color.setLocked(!1), i.buffers.depth.setLocked(!1), i.buffers.color.setMask(!0), i.buffers.depth.setMask(!0), i.buffers.stencil.setLocked(!1), i.buffers.stencil.setFunc(r.EQUAL, 1, 4294967295), i.buffers.stencil.setOp(r.KEEP, r.KEEP, r.KEEP), i.buffers.stencil.setLocked(!0);
	}
}, Pp = class extends Op {
	constructor() {
		super(), this.needsSwap = !1;
	}
	render(e) {
		e.state.buffers.stencil.setLocked(!1), e.state.buffers.stencil.setTest(!1);
	}
}, Fp = class {
	constructor(e, t) {
		if (this.renderer = e, this._pixelRatio = e.getPixelRatio(), t === void 0) {
			let n = e.getSize(new J());
			this._width = n.width, this._height = n.height, t = new Gt(this._width * this._pixelRatio, this._height * this._pixelRatio, { type: v }), t.texture.name = "EffectComposer.rt1";
		} else this._width = t.width, this._height = t.height;
		this.renderTarget1 = t, this.renderTarget2 = t.clone(), this.renderTarget2.texture.name = "EffectComposer.rt2", this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2, this.renderToScreen = !0, this.passes = [], this.copyPass = new Mp(Dp), this.copyPass.material.blending = 0, this.timer = new ja();
	}
	swapBuffers() {
		let e = this.readBuffer;
		this.readBuffer = this.writeBuffer, this.writeBuffer = e;
	}
	addPass(e) {
		this.passes.push(e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
	}
	insertPass(e, t) {
		this.passes.splice(t, 0, e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
	}
	removePass(e) {
		let t = this.passes.indexOf(e);
		t !== -1 && this.passes.splice(t, 1);
	}
	isLastEnabledPass(e) {
		for (let t = e + 1; t < this.passes.length; t++) if (this.passes[t].enabled) return !1;
		return !0;
	}
	render(e) {
		this.timer.update(), e === void 0 && (e = this.timer.getDelta());
		let t = this.renderer.getRenderTarget(), n = !1;
		for (let t = 0, r = this.passes.length; t < r; t++) {
			let r = this.passes[t];
			if (r.enabled !== !1) {
				if (r.renderToScreen = this.renderToScreen && this.isLastEnabledPass(t), r.render(this.renderer, this.writeBuffer, this.readBuffer, e, n), r.needsSwap) {
					if (n) {
						let t = this.renderer.getContext(), n = this.renderer.state.buffers.stencil;
						n.setFunc(t.NOTEQUAL, 1, 4294967295), this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, e), n.setFunc(t.EQUAL, 1, 4294967295);
					}
					this.swapBuffers();
				}
				Np !== void 0 && (r instanceof Np ? n = !0 : r instanceof Pp && (n = !1));
			}
		}
		this.renderer.setRenderTarget(t);
	}
	reset(e) {
		if (e === void 0) {
			let t = this.renderer.getSize(new J());
			this._pixelRatio = this.renderer.getPixelRatio(), this._width = t.width, this._height = t.height, e = this.renderTarget1.clone(), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
		}
		this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.renderTarget1 = e, this.renderTarget2 = e.clone(), this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2;
	}
	setSize(e, t) {
		this._width = e, this._height = t;
		let n = this._width * this._pixelRatio, r = this._height * this._pixelRatio;
		this.renderTarget1.setSize(n, r), this.renderTarget2.setSize(n, r);
		for (let e = 0; e < this.passes.length; e++) this.passes[e].setSize(n, r);
	}
	setPixelRatio(e) {
		this._pixelRatio = e, this.setSize(this._width, this._height);
	}
	dispose() {
		this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.copyPass.dispose();
	}
}, Ip = class extends Op {
	constructor(e, t, n = null, r = null, i = null) {
		super(), this.scene = e, this.camera = t, this.overrideMaterial = n, this.clearColor = r, this.clearAlpha = i, this.clear = !0, this.clearDepth = !1, this.needsSwap = !1, this.isRenderPass = !0, this._oldClearColor = new Z();
	}
	render(e, t, n) {
		let r = e.autoClear;
		e.autoClear = !1;
		let i, a;
		this.overrideMaterial !== null && (a = this.scene.overrideMaterial, this.scene.overrideMaterial = this.overrideMaterial), this.clearColor !== null && (e.getClearColor(this._oldClearColor), e.setClearColor(this.clearColor, e.getClearAlpha())), this.clearAlpha !== null && (i = e.getClearAlpha(), e.setClearAlpha(this.clearAlpha)), this.clearDepth == 1 && e.clearDepth(), e.setRenderTarget(this.renderToScreen ? null : n), this.clear === !0 && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), e.render(this.scene, this.camera), this.clearColor !== null && e.setClearColor(this._oldClearColor), this.clearAlpha !== null && e.setClearAlpha(i), this.overrideMaterial !== null && (this.scene.overrideMaterial = a), e.autoClear = r;
	}
}, Lp = {
	name: "LuminosityHighPassShader",
	uniforms: {
		tDiffuse: { value: null },
		luminosityThreshold: { value: 1 },
		smoothWidth: { value: 1 },
		defaultColor: { value: new Z(0) },
		defaultOpacity: { value: 0 }
	},
	vertexShader: "\n\n		varying vec2 vUv;\n\n		void main() {\n\n			vUv = uv;\n\n			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n		}",
	fragmentShader: "\n\n		uniform sampler2D tDiffuse;\n		uniform vec3 defaultColor;\n		uniform float defaultOpacity;\n		uniform float luminosityThreshold;\n		uniform float smoothWidth;\n\n		varying vec2 vUv;\n\n		void main() {\n\n			vec4 texel = texture2D( tDiffuse, vUv );\n\n			float v = luminance( texel.xyz );\n\n			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );\n\n			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );\n\n			gl_FragColor = mix( outputColor, texel, alpha );\n\n		}"
}, Rp = class e extends Op {
	constructor(e, t = 1, n, r) {
		super(), this.strength = t, this.radius = n, this.threshold = r, this.resolution = e === void 0 ? new J(256, 256) : new J(e.x, e.y), this.clearColor = new Z(0, 0, 0), this.needsSwap = !1, this.renderTargetsHorizontal = [], this.renderTargetsVertical = [], this.nMips = 5;
		let i = Math.round(this.resolution.x / 2), a = Math.round(this.resolution.y / 2);
		this.renderTargetBright = new Gt(i, a, {
			type: v,
			depthBuffer: !1
		}), this.renderTargetBright.texture.name = "UnrealBloomPass.bright", this.renderTargetBright.texture.generateMipmaps = !1;
		for (let e = 0; e < this.nMips; e++) {
			let t = new Gt(i, a, {
				type: v,
				depthBuffer: !1
			});
			t.texture.name = "UnrealBloomPass.h" + e, t.texture.generateMipmaps = !1, this.renderTargetsHorizontal.push(t);
			let n = new Gt(i, a, {
				type: v,
				depthBuffer: !1
			});
			n.texture.name = "UnrealBloomPass.v" + e, n.texture.generateMipmaps = !1, this.renderTargetsVertical.push(n), i = Math.round(i / 2), a = Math.round(a / 2);
		}
		let o = Lp;
		this.highPassUniforms = Ni.clone(o.uniforms), this.highPassUniforms.luminosityThreshold.value = r, this.highPassUniforms.smoothWidth.value = .01, this.materialHighPassFilter = new Ii({
			uniforms: this.highPassUniforms,
			vertexShader: o.vertexShader,
			fragmentShader: o.fragmentShader
		}), this.separableBlurMaterials = [];
		let s = [
			6,
			10,
			14,
			18,
			22
		];
		i = Math.round(this.resolution.x / 2), a = Math.round(this.resolution.y / 2);
		for (let e = 0; e < this.nMips; e++) this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])), this.separableBlurMaterials[e].uniforms.invSize.value = new J(1 / i, 1 / a), i = Math.round(i / 2), a = Math.round(a / 2);
		this.compositeMaterial = this._getCompositeMaterial(this.nMips), this.compositeMaterial.uniforms.blurTexture1.value = this.renderTargetsVertical[0].texture, this.compositeMaterial.uniforms.blurTexture2.value = this.renderTargetsVertical[1].texture, this.compositeMaterial.uniforms.blurTexture3.value = this.renderTargetsVertical[2].texture, this.compositeMaterial.uniforms.blurTexture4.value = this.renderTargetsVertical[3].texture, this.compositeMaterial.uniforms.blurTexture5.value = this.renderTargetsVertical[4].texture, this.compositeMaterial.uniforms.bloomStrength.value = t, this.compositeMaterial.uniforms.bloomRadius.value = .1;
		let c = [
			1,
			.8,
			.6,
			.4,
			.2
		];
		this.compositeMaterial.uniforms.bloomFactors.value = c, this.bloomTintColors = [
			new Y(1, 1, 1),
			new Y(1, 1, 1),
			new Y(1, 1, 1),
			new Y(1, 1, 1),
			new Y(1, 1, 1)
		], this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, this.copyUniforms = Ni.clone(Dp.uniforms), this.blendMaterial = new Ii({
			uniforms: this.copyUniforms,
			vertexShader: Dp.vertexShader,
			fragmentShader: Dp.fragmentShader,
			premultipliedAlpha: !0,
			blending: 2,
			depthTest: !1,
			depthWrite: !1,
			transparent: !0
		}), this._oldClearColor = new Z(), this._oldClearAlpha = 1, this._basic = new Lr(), this._fsQuad = new jp(null);
	}
	dispose() {
		for (let e = 0; e < this.renderTargetsHorizontal.length; e++) this.renderTargetsHorizontal[e].dispose();
		for (let e = 0; e < this.renderTargetsVertical.length; e++) this.renderTargetsVertical[e].dispose();
		this.renderTargetBright.dispose();
		for (let e = 0; e < this.separableBlurMaterials.length; e++) this.separableBlurMaterials[e].dispose();
		this.compositeMaterial.dispose(), this.blendMaterial.dispose(), this._basic.dispose(), this._fsQuad.dispose();
	}
	setSize(e, t) {
		let n = Math.round(e / 2), r = Math.round(t / 2);
		this.renderTargetBright.setSize(n, r);
		for (let e = 0; e < this.nMips; e++) this.renderTargetsHorizontal[e].setSize(n, r), this.renderTargetsVertical[e].setSize(n, r), this.separableBlurMaterials[e].uniforms.invSize.value = new J(1 / n, 1 / r), n = Math.round(n / 2), r = Math.round(r / 2);
	}
	render(t, n, r, i, a) {
		t.getClearColor(this._oldClearColor), this._oldClearAlpha = t.getClearAlpha();
		let o = t.autoClear;
		t.autoClear = !1, t.setClearColor(this.clearColor, 0), a && t.state.buffers.stencil.setTest(!1), this.renderToScreen && (this._fsQuad.material = this._basic, this._basic.map = r.texture, t.setRenderTarget(null), t.clear(), this._fsQuad.render(t)), this.highPassUniforms.tDiffuse.value = r.texture, this.highPassUniforms.luminosityThreshold.value = this.threshold, this._fsQuad.material = this.materialHighPassFilter, t.setRenderTarget(this.renderTargetBright), t.clear(), this._fsQuad.render(t);
		let s = this.renderTargetBright;
		for (let n = 0; n < this.nMips; n++) this._fsQuad.material = this.separableBlurMaterials[n], this.separableBlurMaterials[n].uniforms.colorTexture.value = s.texture, this.separableBlurMaterials[n].uniforms.direction.value = e.BlurDirectionX, t.setRenderTarget(this.renderTargetsHorizontal[n]), t.clear(), this._fsQuad.render(t), this.separableBlurMaterials[n].uniforms.colorTexture.value = this.renderTargetsHorizontal[n].texture, this.separableBlurMaterials[n].uniforms.direction.value = e.BlurDirectionY, t.setRenderTarget(this.renderTargetsVertical[n]), t.clear(), this._fsQuad.render(t), s = this.renderTargetsVertical[n];
		this._fsQuad.material = this.compositeMaterial, this.compositeMaterial.uniforms.bloomStrength.value = this.strength, this.compositeMaterial.uniforms.bloomRadius.value = this.radius, this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, t.setRenderTarget(this.renderTargetsHorizontal[0]), t.clear(), this._fsQuad.render(t), this._fsQuad.material = this.blendMaterial, this.copyUniforms.tDiffuse.value = this.renderTargetsHorizontal[0].texture, a && t.state.buffers.stencil.setTest(!0), this.renderToScreen ? (t.setRenderTarget(null), this._fsQuad.render(t)) : (t.setRenderTarget(r), this._fsQuad.render(t)), t.setClearColor(this._oldClearColor, this._oldClearAlpha), t.autoClear = o;
	}
	_getSeparableBlurMaterial(e) {
		let t = [], n = e / 3;
		for (let r = 0; r < e; r++) t.push(.39894 * Math.exp(-.5 * r * r / (n * n)) / n);
		let r = [], i = [];
		for (let n = 1; n < e; n += 2) {
			let a = t[n], o = n + 1 < e ? t[n + 1] : 0, s = a + o;
			r.push((n * a + (n + 1) * o) / s), i.push(s);
		}
		return new Ii({
			defines: { KERNEL_PAIRS: r.length },
			uniforms: {
				colorTexture: { value: null },
				invSize: { value: new J(.5, .5) },
				direction: { value: new J(.5, .5) },
				centerWeight: { value: t[0] },
				gaussianOffsets: { value: r },
				gaussianWeights: { value: i }
			},
			vertexShader: "\n\n				varying vec2 vUv;\n\n				void main() {\n\n					vUv = uv;\n					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n				}",
			fragmentShader: "\n\n				#include <common>\n\n				varying vec2 vUv;\n\n				uniform sampler2D colorTexture;\n				uniform vec2 invSize;\n				uniform vec2 direction;\n				uniform float centerWeight;\n				uniform float gaussianOffsets[KERNEL_PAIRS];\n				uniform float gaussianWeights[KERNEL_PAIRS];\n\n				void main() {\n\n					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;\n\n					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {\n\n						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];\n						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;\n						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;\n						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];\n\n					}\n\n					gl_FragColor = vec4( diffuseSum, 1.0 );\n\n				}"
		});
	}
	_getCompositeMaterial(e) {
		return new Ii({
			defines: { NUM_MIPS: e },
			uniforms: {
				blurTexture1: { value: null },
				blurTexture2: { value: null },
				blurTexture3: { value: null },
				blurTexture4: { value: null },
				blurTexture5: { value: null },
				bloomStrength: { value: 1 },
				bloomFactors: { value: null },
				bloomTintColors: { value: null },
				bloomRadius: { value: 0 }
			},
			vertexShader: "\n\n				varying vec2 vUv;\n\n				void main() {\n\n					vUv = uv;\n					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n				}",
			fragmentShader: "\n\n				varying vec2 vUv;\n\n				uniform sampler2D blurTexture1;\n				uniform sampler2D blurTexture2;\n				uniform sampler2D blurTexture3;\n				uniform sampler2D blurTexture4;\n				uniform sampler2D blurTexture5;\n				uniform float bloomStrength;\n				uniform float bloomRadius;\n				uniform float bloomFactors[NUM_MIPS];\n				uniform vec3 bloomTintColors[NUM_MIPS];\n\n				float lerpBloomFactor( const in float factor ) {\n\n					float mirrorFactor = 1.2 - factor;\n					return mix( factor, mirrorFactor, bloomRadius );\n\n				}\n\n				void main() {\n\n					// 3.0 for backwards compatibility with previous alpha-based intensity\n					vec3 bloom = 3.0 * bloomStrength * (\n						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +\n						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +\n						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +\n						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +\n						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb\n					);\n\n					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );\n					gl_FragColor = vec4( bloom, bloomAlpha );\n\n				}"
		});
	}
};
Rp.BlurDirectionX = new J(1, 0), Rp.BlurDirectionY = new J(0, 1);
// ../../../../Downloads/FX-Forge-源码及Web-20261110/FX-Forge/node_modules/three/examples/jsm/shaders/OutputShader.js
var zp = {
	name: "OutputShader",
	uniforms: {
		tDiffuse: { value: null },
		toneMappingExposure: { value: 1 }
	},
	vertexShader: "\n		precision highp float;\n\n		uniform mat4 modelViewMatrix;\n		uniform mat4 projectionMatrix;\n\n		attribute vec3 position;\n		attribute vec2 uv;\n\n		varying vec2 vUv;\n\n		void main() {\n\n			vUv = uv;\n			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n		}",
	fragmentShader: "\n\n		precision highp float;\n\n		uniform sampler2D tDiffuse;\n\n		#include <tonemapping_pars_fragment>\n		#include <colorspace_pars_fragment>\n\n		varying vec2 vUv;\n\n		void main() {\n\n			gl_FragColor = texture2D( tDiffuse, vUv );\n\n			// tone mapping\n\n			#ifdef LINEAR_TONE_MAPPING\n\n				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );\n\n			#elif defined( REINHARD_TONE_MAPPING )\n\n				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );\n\n			#elif defined( CINEON_TONE_MAPPING )\n\n				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );\n\n			#elif defined( ACES_FILMIC_TONE_MAPPING )\n\n				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );\n\n			#elif defined( AGX_TONE_MAPPING )\n\n				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );\n\n			#elif defined( NEUTRAL_TONE_MAPPING )\n\n				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );\n\n			#elif defined( CUSTOM_TONE_MAPPING )\n\n				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );\n\n			#endif\n\n			// color space\n\n			#ifdef SRGB_TRANSFER\n\n				gl_FragColor = sRGBTransferOETF( gl_FragColor );\n\n			#endif\n\n		}"
}, Bp = class extends Op {
	constructor() {
		super(), this.isOutputPass = !0, this.uniforms = Ni.clone(zp.uniforms), this.material = new Li({
			name: zp.name,
			uniforms: this.uniforms,
			vertexShader: zp.vertexShader,
			fragmentShader: zp.fragmentShader
		}), this._fsQuad = new jp(this.material), this._outputColorSpace = null, this._toneMapping = null;
	}
	render(e, t, n) {
		this.uniforms.tDiffuse.value = n.texture, this.uniforms.toneMappingExposure.value = e.toneMappingExposure, (this._outputColorSpace !== e.outputColorSpace || this._toneMapping !== e.toneMapping) && (this._outputColorSpace = e.outputColorSpace, this._toneMapping = e.toneMapping, this.material.defines = {}, Mt.getTransfer(this._outputColorSpace) === "srgb" && (this.material.defines.SRGB_TRANSFER = ""), this._toneMapping === 1 ? this.material.defines.LINEAR_TONE_MAPPING = "" : this._toneMapping === 2 ? this.material.defines.REINHARD_TONE_MAPPING = "" : this._toneMapping === 3 ? this.material.defines.CINEON_TONE_MAPPING = "" : this._toneMapping === 4 ? this.material.defines.ACES_FILMIC_TONE_MAPPING = "" : this._toneMapping === 6 ? this.material.defines.AGX_TONE_MAPPING = "" : this._toneMapping === 7 ? this.material.defines.NEUTRAL_TONE_MAPPING = "" : this._toneMapping === 5 && (this.material.defines.CUSTOM_TONE_MAPPING = ""), this.material.needsUpdate = !0), this.renderToScreen === !0 ? (e.setRenderTarget(null), this._fsQuad.render(e)) : (e.setRenderTarget(t), this.clear && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), this._fsQuad.render(e));
	}
	dispose() {
		this.material.dispose(), this._fsQuad.dispose();
	}
}, Vp = {
	uniforms: {
		tDiffuse: { value: null },
		tMask: { value: null },
		uTexel: { value: new J(1, 1) },
		uColor: { value: new Z(1, .45, .05) }
	},
	vertexShader: "\n    varying vec2 vUv;\n    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
	fragmentShader: "\n    uniform sampler2D tDiffuse;\n    uniform sampler2D tMask;\n    uniform vec2 uTexel;\n    uniform vec3 uColor;\n    varying vec2 vUv;\n    // coverage of the selected particles: bright or opaque enough to count\n    float cover(vec2 uv) {\n      vec4 m = texture2D(tMask, uv);\n      return step(0.04, max(max(m.r, m.g), max(m.b, m.a)));\n    }\n    void main() {\n      vec4 src = texture2D(tDiffuse, vUv);\n      float inside = cover(vUv);\n      float near = 0.0;\n      for (int r = 1; r <= 2; r++) {\n        vec2 d = uTexel * float(r);\n        near = max(near, cover(vUv + vec2(d.x, 0.0)));\n        near = max(near, cover(vUv - vec2(d.x, 0.0)));\n        near = max(near, cover(vUv + vec2(0.0, d.y)));\n        near = max(near, cover(vUv - vec2(0.0, d.y)));\n        near = max(near, cover(vUv + d));\n        near = max(near, cover(vUv - d));\n        near = max(near, cover(vUv + vec2(d.x, -d.y)));\n        near = max(near, cover(vUv + vec2(-d.x, d.y)));\n      }\n      float edge = near * (1.0 - inside);\n      gl_FragColor = vec4(mix(src.rgb, uColor, edge), src.a);\n    }"
}, Hp = class {
	pass = new Mp(Vp);
	target = new Gt(1, 1);
	constructor() {
		this.pass.enabled = !1, this.pass.uniforms.tMask.value = this.target.texture;
	}
	setSize(e, t) {
		this.target.setSize(e, t), this.pass.uniforms.uTexel.value.set(1 / Math.max(1, e), 1 / Math.max(1, t));
	}
	update(e, t, n, r) {
		let i = r.filter((e) => e.visible);
		if (this.pass.enabled = i.length > 0, !this.pass.enabled) return;
		let a = n.layers.mask, o = t.background, s = e.getClearAlpha();
		for (let e of i) e.layers.enable(4);
		n.layers.set(4), t.background = null, e.setClearAlpha(0), e.setRenderTarget(this.target), e.clear(), e.render(t, n), e.setRenderTarget(null), e.setClearAlpha(s), t.background = o, n.layers.mask = a;
		for (let e of i) e.layers.disable(4);
	}
	dispose() {
		this.target.dispose(), this.pass.dispose();
	}
}, Up = class {
	renderer;
	composer;
	renderPass;
	bloom;
	depthTarget;
	size = new J(1, 1);
	outline = new Hp();
	constructor(e, t, n) {
		this.renderer = e;
		let r = new Gt(1, 1, {
			type: v,
			samples: 4
		});
		this.composer = new Fp(e, r), this.renderPass = new Ip(t, n), this.bloom = new Rp(new J(1, 1), 1, .5, 1), this.composer.addPass(this.renderPass), this.composer.addPass(this.bloom), this.composer.addPass(this.outline.pass), this.composer.addPass(new Bp()), this.depthTarget = new Gt(1, 1, { depthTexture: new xi(1, 1) });
	}
	setSize(e, t) {
		let n = this.renderer.getPixelRatio();
		this.composer.setPixelRatio(n), this.composer.setSize(e, t), this.size.set(Math.max(1, Math.floor(e * n)), Math.max(1, Math.floor(t * n))), this.depthTarget.setSize(this.size.x, this.size.y), this.outline.setSize(this.size.x, this.size.y);
	}
	renderDepth(e, t) {
		let n = t.layers.mask;
		t.layers.set(0), t.layers.enable(3);
		let r = e.background;
		return e.background = null, this.renderer.setRenderTarget(this.depthTarget), this.renderer.clear(), this.renderer.render(e, t), this.renderer.setRenderTarget(null), e.background = r, t.layers.mask = n, {
			texture: this.depthTarget.depthTexture,
			width: this.size.x,
			height: this.size.y,
			near: t.near,
			far: t.far
		};
	}
	noDepth(e) {
		return {
			texture: null,
			width: this.size.x,
			height: this.size.y,
			near: e.near,
			far: e.far
		};
	}
	render(e) {
		this.bloom.enabled = e.enabled, this.bloom.strength = e.intensity, this.bloom.radius = e.radius, this.bloom.threshold = e.threshold, this.composer.render();
	}
	dispose() {
		this.composer.dispose(), this.bloom.dispose(), this.depthTarget.dispose(), this.outline.dispose();
	}
}, Wp = new Y(.0027, .0025, .004), Gp = "\n  varying vec3 vWorld;\n  void main() {\n    vec4 w = modelMatrix * vec4(position, 1.0);\n    vWorld = w.xyz;\n    gl_Position = projectionMatrix * viewMatrix * w;\n  }\n", Kp = "\n  #define PI 3.14159265\n  uniform vec3 uAlbedo;\n  uniform int uCount;\n  uniform vec3 uPos[8];\n  uniform vec3 uColor[8]; // linear colour x intensity\n  uniform float uRange[8];\n  varying vec3 vWorld;\n  void main() {\n    vec3 n = vec3(0.0, 1.0, 0.0);\n    vec3 v = normalize(cameraPosition - vWorld);\n    float nv = abs(dot(n, v));\n    const float pr = 0.5;            // perceptual roughness = 1 - smoothness\n    const float rough = pr * pr;\n    vec3 diffColor = uAlbedo * 0.96; // one minus the dielectric reflectivity\n    vec3 sum = vec3(0.0);\n    for (int i = 0; i < 8; i++) {\n      if (i >= uCount) break;\n      vec3 l = uPos[i] - vWorld;\n      float d = length(l);\n      float r2 = (d * d) / max(uRange[i] * uRange[i], 1e-6);\n      if (r2 >= 1.0 || l.y <= 0.0) continue;\n      float atten = 1.0 / (1.0 + 25.0 * r2) * (r2 > 0.64 ? (1.0 - r2) / 0.36 : 1.0);\n      l /= max(d, 1e-4);\n      vec3 hv = normalize(l + v);\n      float nl = max(dot(n, l), 0.0), nh = max(dot(n, hv), 0.0), lh = max(dot(l, hv), 0.0);\n      // Disney diffuse\n      float fd90 = 0.5 + 2.0 * lh * lh * pr;\n      float diffuse = (1.0 + (fd90 - 1.0) * pow(1.0 - nl, 5.0)) * (1.0 + (fd90 - 1.0) * pow(1.0 - nv, 5.0)) * nl;\n      // GGX specular, Smith joint visibility\n      float lambdaV = nl * (nv * (1.0 - rough) + rough);\n      float lambdaL = nv * (nl * (1.0 - rough) + rough);\n      float vis = 0.5 / (lambdaV + lambdaL + 1e-5);\n      float a2 = rough * rough;\n      float dd = (nh * a2 - nh) * nh + 1.0;\n      float D = a2 / (PI * (dd * dd + 1e-7));\n      float spec = max(0.0, vis * D * PI * nl);\n      vec3 F = vec3(0.04) + (1.0 - 0.04) * pow(1.0 - lh, 5.0);\n      sum += uColor[i] * atten * (diffColor * diffuse + spec * F);\n    }\n    gl_FragColor = vec4(sum, 1.0);\n  }\n", qp = class {
	mesh;
	mat;
	standIn = [];
	constructor(e) {
		this.mat = new Ii({
			vertexShader: Gp,
			fragmentShader: Kp,
			uniforms: {
				uAlbedo: { value: Wp },
				uCount: { value: 0 },
				uPos: { value: Array.from({ length: 8 }, () => new Y()) },
				uColor: { value: Array.from({ length: 8 }, () => new Y()) },
				uRange: { value: Array(8).fill(1) }
			},
			blending: 2,
			depthWrite: !1,
			transparent: !0
		}), this.mesh = new Yr(new Ei(40, 40), this.mat), this.mesh.rotation.x = -Math.PI / 2, this.mesh.position.y = 5e-4, this.mesh.renderOrder = -500, this.mesh.visible = !1, e.add(this.mesh);
		for (let t = 0; t < 8; t++) {
			let t = new Sa(16777215, 0, 1, 2);
			this.standIn.push(t), e.add(t);
		}
	}
	update(e) {
		let t = this.mat.uniforms, n = 0;
		for (let r of e.layers) {
			if (n >= 8) break;
			let i = r.light;
			if (!i.enabled || i.intensity <= 0 || i.range <= 0 || !Vu(e, r)) continue;
			let a = Hu(e, r).pos;
			t.uPos.value[n].set(a.x, a.y, -a.z);
			let o = parseInt(i.color.slice(1), 16) || 0, s = (e) => Math.max(0, e / 255 * i.intensity) ** 2.2, c = t.uColor.value[n];
			c.set(s(o >> 16 & 255), s(o >> 8 & 255), s(o & 255)), t.uRange.value[n] = i.range;
			let l = Math.max(c.x, c.y, c.z, 1e-6), u = this.standIn[n];
			u.position.set(a.x, a.y, -a.z), u.color.setRGB(c.x / l, c.y / l, c.z / l, Pe), u.intensity = Math.PI * l * i.range * i.range / 25, u.distance = i.range, n++;
		}
		t.uCount.value = n;
		for (let e = n; e < 8; e++) this.standIn[e].intensity = 0;
		this.mesh.visible = n > 0;
	}
}, Jp = /* @__PURE__ */ new Set(), Yp = class {
	canvas;
	renderer;
	scene = new jn();
	camera = new ba(40, 1, .05, 500);
	controls;
	particles3d;
	trails;
	gizmo = new Cp();
	stage;
	post;
	lights;
	particles = 0;
	constructor(e) {
		this.canvas = e, this.renderer = new sl({
			canvas: e,
			antialias: !1,
			preserveDrawingBuffer: !0
		}), this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)), this.renderer.outputColorSpace = Ne, this.camera.layers.enable(1), this.camera.layers.enable(2), this.resetView(), this.controls = new vl(this.camera, e), this.controls.target.set(0, 1, 0), this.controls.enableDamping = !0, this.controls.update(), this.stage = Ep(this.scene), this.gizmo.group.layers.set(2), this.scene.add(this.gizmo.group), this.particles3d = new yp(this.scene), this.trails = new Sp(this.scene), this.lights = new qp(this.scene), this.post = new Up(this.renderer, this.scene, this.camera);
	}
	setSize(e, t) {
		this.renderer.setSize(e, t, !1), this.post.setSize(e, t), this.camera.aspect = e / Math.max(1, t), this.camera.updateProjectionMatrix();
	}
	getView() {
		let e = (e) => Math.round(e * 1e3) / 1e3, t = this.camera.position, n = this.controls.target;
		return {
			position: [
				e(t.x),
				e(t.y),
				e(t.z)
			],
			target: [
				e(n.x),
				e(n.y),
				e(n.z)
			]
		};
	}
	setView(e) {
		this.camera.position.set(...e.position), this.controls.target.set(...e.target), this.controls.update();
	}
	resetView() {
		this.camera.position.set(5, 3.4, 7.2), this.controls?.target.set(0, 1, 0), this.controls?.update();
	}
	render(e, t, n, r = Jp) {
		this.scene.background = new Z(e.background), this.stage.character.visible = e.showCharacter, np.value = t;
		let i = Ju(e, t, this);
		this.particles = i.reduce((e, t) => e + t.count, 0), this.controls.update();
		let a = e.layers.some((e) => e.visible && e.material.softness > 0) ? this.post.renderDepth(this.scene, this.camera) : this.post.noDepth(this.camera);
		this.particles3d.upload(i, a, this.camera.position), this.trails.upload(i, this.camera.position), this.lights.update(e);
		let o = n && Vu(e, n) ? n : null;
		this.gizmo.update(o, o ? Hu(e, o) : null);
		let s = new Set(e.layers.flatMap((e, t) => r.has(e.id) ? [t] : []));
		this.post.outline.update(this.renderer, this.scene, this.camera, s.size ? [...this.particles3d.objectsFor(s), ...this.trails.objectsFor(s)] : []), this.post.render(e.bloom);
	}
	dispose() {
		this.controls.dispose(), this.post.dispose(), this.renderer.dispose();
	}
}, Xp = (e, t, n) => ({
	id: e,
	name: t,
	colors: n.trim().split(/\s+/).map((e) => "#" + e.toLowerCase())
}), Zp = [
	Xp("none", "No palette (pixelate only)", ""),
	Xp("endesga32", "Endesga 32", "be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e\n     124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569"),
	Xp("pico8", "PICO-8", "000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa"),
	Xp("sweetie16", "Sweetie 16", "1a1c2c 5d275d b13e53 ef7d57 ffcd75 a7f070 38b764 257179 29366f 3b5dc9 41a6f6 73eff7 f4f4f4 94b0c2 566c86 333c57"),
	Xp("db16", "DawnBringer 16", "140c1c 442434 30346d 4e4a4e 854c30 346524 d04648 757161 597dce d27d2c 8595a1 6daa2c d2aa99 6dc2ca dad45e deeed6"),
	Xp("db32", "DawnBringer 32", "000000 222034 45283c 663931 8f563b df7126 d9a066 eec39a fbf236 99e550 6abe30 37946e 4b692f 524b24 323c39 3f3f74\n     306082 5b6ee1 639bff 5fcde4 cbdbfc ffffff 9badb7 847e87 696a6a 595652 76428a ac3232 d95763 d77bba 8f974a 8a6f30"),
	Xp("gameboy", "Game Boy", "0f380f 306230 8bac0f 9bbc0f")
];
function Qp(e) {
	return Zp.find((t) => t.id === e) ?? Zp[1];
}
function $p(e) {
	return e /= 255, e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
}
function em(e, t, n) {
	let r = $p(e), i = $p(t), a = $p(n), o = Math.cbrt(.4122214708 * r + .5363325363 * i + .0514459929 * a), s = Math.cbrt(.2119034982 * r + .6806995451 * i + .1073969566 * a), c = Math.cbrt(.0883024619 * r + .2817188376 * i + .6299787005 * a);
	return [
		.2104542553 * o + .793617785 * s - .0040720468 * c,
		1.9779984951 * o - 2.428592205 * s + .4505937099 * c,
		.0259040371 * o + .7827717662 * s - .808675766 * c
	];
}
var tm = /* @__PURE__ */ new Map();
function nm(e) {
	let t = Qp(e);
	if (t.colors.length === 0) return null;
	let n = tm.get(t.id);
	if (n) return n;
	let r = new Uint8Array(t.colors.length * 3), i = t.colors.map((e, t) => {
		let n = parseInt(e.slice(1), 16);
		return r[t * 3] = n >> 16 & 255, r[t * 3 + 1] = n >> 8 & 255, r[t * 3 + 2] = n & 255, em(r[t * 3], r[t * 3 + 1], r[t * 3 + 2]);
	}), a = /* @__PURE__ */ new Uint8Array(32768);
	for (let e = 0; e < 32768; e++) {
		let [t, n, r] = em((e >> 10 & 31) * 8.226, (e >> 5 & 31) * 8.226, (e & 31) * 8.226), o = 0, s = Infinity;
		for (let e = 0; e < i.length; e++) {
			let a = t - i[e][0], c = n - i[e][1], l = r - i[e][2], u = a * a + c * c + l * l;
			u < s && (s = u, o = e);
		}
		a[e] = o;
	}
	let o = {
		lut: a,
		rgb: r
	};
	return tm.set(t.id, o), o;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/render.ts
var rm = [
	0,
	8,
	2,
	10,
	12,
	4,
	14,
	6,
	3,
	11,
	1,
	9,
	15,
	7,
	13,
	5
];
function im(e, t, n) {
	return e ? ((e.width !== t || e.height !== n) && (e.width = t, e.height = n), e) : vf(t, n);
}
var am = class e {
	work = null;
	out = null;
	low = null;
	static outputSize(e, t = 1) {
		if (e.pixel.enabled) {
			let n = e.pixel.size;
			return {
				w: Math.ceil(e.width / n) * n * t,
				h: Math.ceil(e.height / n) * n * t
			};
		}
		return {
			w: Math.round(e.width * t),
			h: Math.round(e.height * t)
		};
	}
	render(e, t, n = 1) {
		let r = Wl(e, t, this), i = r.reduce((e, t) => e + t.count, 0);
		return e.pixel.enabled ? {
			...this.renderPixel(e, r, n),
			particles: i
		} : {
			...this.renderHd(e, r, n),
			particles: i
		};
	}
	drawParticles(e, t, n) {
		for (let r of t) {
			if (!r.count) continue;
			let t = r.emitter;
			e.globalCompositeOperation = t.blend === "add" ? "lighter" : "source-over";
			let i = r.data, a = t.texture ? af(t.texture) : null, o = a ? `${t.texture}@${nf(t.texture).version}` : "";
			for (let s = 0; s < r.count; s++) {
				let r = s * 9, c = i[r + 2], l = i[r + 3], u = i[r + 4], d = a ? Df(o, a, i[r + 5] | 0, i[r + 6] | 0, i[r + 7] | 0) : Ef(t.sprite, i[r + 5] | 0, i[r + 6] | 0, i[r + 7] | 0), f = c / 64 * n, p = Math.cos(l) * f, m = Math.sin(l) * f;
				e.globalAlpha = i[r + 8], e.setTransform(p * u, m * u, -m, p, i[r] * n, i[r + 1] * n), e.drawImage(d, -32, -32);
			}
		}
		e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.globalCompositeOperation = "source-over";
	}
	renderHd(t, n, r) {
		let { w: i, h: a } = e.outputSize(t, r);
		this.work = im(this.work, i, a);
		let o = yf(this.work);
		if (o.setTransform(1, 0, 0, 1, 0, 0), o.clearRect(0, 0, i, a), o.imageSmoothingEnabled = !0, this.drawParticles(o, n, r), t.bloom <= .001 || !("filter" in o)) return {
			canvas: this.work,
			width: i,
			height: a
		};
		this.out = im(this.out, i, a);
		let s = yf(this.out);
		return s.setTransform(1, 0, 0, 1, 0, 0), s.clearRect(0, 0, i, a), s.drawImage(this.work, 0, 0), s.globalCompositeOperation = "lighter", s.globalAlpha = Math.min(1, t.bloom * 1.2), s.filter = `blur(${Math.max(1, Math.round(8 * r * (.4 + t.bloom)))}px)`, s.drawImage(this.work, 0, 0), s.filter = "none", s.globalAlpha = 1, s.globalCompositeOperation = "source-over", {
			canvas: this.out,
			width: i,
			height: a
		};
	}
	renderPixel(t, n, r) {
		let i = t.pixel.size, a = Math.ceil(t.width / i), o = Math.ceil(t.height / i);
		this.low = im(this.low, a, o);
		let s = yf(this.low);
		s.setTransform(1, 0, 0, 1, 0, 0), s.clearRect(0, 0, a, o), s.imageSmoothingEnabled = !0, this.drawParticles(s, n, 1 / i);
		let c = s.getImageData(0, 0, a, o);
		om(c, t), s.putImageData(c, 0, 0);
		let { w: l, h: u } = e.outputSize(t, r);
		this.out = im(this.out, l, u);
		let d = yf(this.out);
		return d.setTransform(1, 0, 0, 1, 0, 0), d.clearRect(0, 0, l, u), d.imageSmoothingEnabled = !1, d.drawImage(this.low, 0, 0, l, u), {
			canvas: this.out,
			width: l,
			height: u
		};
	}
};
function om(e, t) {
	let { data: n, width: r, height: i } = e, a = nm(t.pixel.palette), o = t.pixel.dither, s = new Uint8Array(r * i);
	for (let e = 0; e < i; e++) for (let t = 0; t < r; t++) {
		let i = (e * r + t) * 4, c = n[i + 3] / 255, l = (rm[(e & 3) * 4 + (t & 3)] + .5) / 16;
		if (c < (o ? .12 + l * .6 : .38)) {
			n[i + 3] = 0;
			continue;
		}
		let u = .45 + .55 * Math.min(1, c / .85), d = o ? (l - .5) * 28 : 0, f = n[i] * u + d, p = n[i + 1] * u + d, m = n[i + 2] * u + d;
		if (f = f < 0 ? 0 : f > 255 ? 255 : f, p = p < 0 ? 0 : p > 255 ? 255 : p, m = m < 0 ? 0 : m > 255 ? 255 : m, a) {
			let e = a.lut[f >> 3 << 10 | p >> 3 << 5 | m >> 3];
			n[i] = a.rgb[e * 3], n[i + 1] = a.rgb[e * 3 + 1], n[i + 2] = a.rgb[e * 3 + 2];
		} else n[i] = f, n[i + 1] = p, n[i + 2] = m;
		n[i + 3] = 255, s[e * r + t] = 1;
	}
	if (!t.pixel.outline) return;
	let [c, l, u] = zl(t.pixel.outlineColor);
	for (let e = 0; e < i; e++) for (let t = 0; t < r; t++) {
		let a = e * r + t;
		if (s[a] || !(t > 0 && s[a - 1] || t < r - 1 && s[a + 1] || e > 0 && s[a - r] || e < i - 1 && s[a + r])) continue;
		let o = a * 4;
		n[o] = c, n[o + 1] = l, n[o + 2] = u, n[o + 3] = 255;
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/shaders/types.ts
var sm = /^s_[a-z0-9]{4,24}$/, cm = (e) => typeof e == "string" && sm.test(e) ? e : "", lm = (e, t, n) => typeof e == "string" ? e.slice(0, n) : t;
function um(e) {
	let t = e ?? {};
	if (typeof t.id != "string" || !sm.test(t.id) || typeof t.code != "string" || !t.code.trim()) return null;
	let n = (e) => typeof e == "number" && Number.isFinite(e) ? e : Date.now();
	return {
		id: t.id,
		name: lm(t.name, t.id, 60).trim() || t.id,
		description: lm(t.description, "", 400),
		code: lm(t.code, "", 2e4),
		createdAt: n(t.createdAt),
		updatedAt: n(t.updatedAt)
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/render3d/material.ts
var dm = [
	"sprite",
	"noise",
	"streaks"
], fm = () => ({
	intensity: 1,
	mainTexture: "sprite",
	texture: "",
	shader: "",
	scrollX: 0,
	scrollY: 0,
	dissolve: !1,
	dissolveFrom: 0,
	dissolveTo: 1,
	dissolveEdge: .08,
	dissolveEdgeColor: "#ffffff",
	dissolveScale: 1,
	dissolveTexture: "",
	dissolveSoftness: .02,
	dissolveCurve: [],
	fresnel: 0,
	fresnelPower: 2,
	fresnelColor: "#ffffff",
	softness: 0
});
function pm(e) {
	let t = fm(), n = Yd(e);
	return {
		intensity: Gd(n.intensity, t.intensity, 0, 32),
		mainTexture: Kd(n.mainTexture, dm, t.mainTexture),
		texture: Md(n.texture),
		shader: cm(n.shader),
		scrollX: Gd(n.scrollX, 0, -20, 20),
		scrollY: Gd(n.scrollY, 0, -20, 20),
		dissolve: qd(n.dissolve, !1),
		dissolveFrom: Gd(n.dissolveFrom, t.dissolveFrom, 0, 1),
		dissolveTo: Gd(n.dissolveTo, t.dissolveTo, 0, 1),
		dissolveEdge: Gd(n.dissolveEdge, t.dissolveEdge, 0, .5),
		dissolveEdgeColor: Jd(n.dissolveEdgeColor, t.dissolveEdgeColor),
		dissolveScale: Gd(n.dissolveScale, t.dissolveScale, .1, 16),
		dissolveTexture: Md(n.dissolveTexture),
		dissolveSoftness: Gd(n.dissolveSoftness, t.dissolveSoftness, .001, 1),
		dissolveCurve: Yl(n.dissolveCurve, -2, 2),
		fresnel: Gd(n.fresnel, 0, 0, 8),
		fresnelPower: Gd(n.fresnelPower, t.fresnelPower, .1, 16),
		fresnelColor: Jd(n.fresnelColor, t.fresnelColor),
		softness: Gd(n.softness, 0, 0, 10)
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/render3d/meshKinds.ts
var mm = [
	"spike",
	"shard",
	"crystal",
	"ring",
	"cylinder",
	"sphere",
	"cube",
	"quad"
], hm = [
	"velocity",
	"random",
	"local",
	"view"
], gm = (e) => typeof e == "string" && Yu.test(e) ? e : Kd(e, mm, "shard"), _m = (e) => Kd(e, hm, "random"), vm = () => ({
	enabled: !1,
	intensity: 1,
	threshold: 1,
	radius: .5
});
function ym(e) {
	let t = vm(), n = Yd(e);
	return {
		enabled: qd(n.enabled, !1),
		intensity: Gd(n.intensity, t.intensity, 0, 10),
		threshold: Gd(n.threshold, t.threshold, 0, 10),
		radius: Gd(n.radius, t.radius, 0, 1)
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/types3d.ts
var bm = [
	"sphere",
	"hemisphere",
	"cone",
	"coneVolume",
	"box",
	"circle",
	"donut",
	"rectangle",
	"edge"
], xm = [
	"none",
	"distance",
	"oldestInFront",
	"youngestInFront"
], Sm = [
	"random",
	"loop",
	"pingpong",
	"burstSpread"
], Cm = [
	"add",
	"normal",
	"premultiply",
	"softAdd"
], wm = (e = 0, t = 0, n = 0) => ({
	x: e,
	y: t,
	z: n
});
function Tm(e = {}) {
	let t = Em(e);
	return e.startSizeY || (t.startSizeY = { ...t.startSize }), e.startSizeZ || (t.startSizeZ = { ...t.startSize }), t;
}
function Em(e) {
	return {
		id: Pd(),
		name: "Particle System",
		visible: !0,
		rendered: !0,
		blend: "add",
		empty: !1,
		parentId: "",
		position: wm(0, 0, 0),
		rotation: wm(-90, 0, 0),
		startLifetime: {
			min: 1,
			max: 1.5
		},
		startSpeed: {
			min: 1.5,
			max: 2.5
		},
		startSize: {
			min: .2,
			max: .35
		},
		startRotation: {
			min: 0,
			max: 360
		},
		startSize3D: !1,
		startSizeY: {
			min: .2,
			max: .35
		},
		startSizeZ: {
			min: .2,
			max: .35
		},
		startRotation3D: !1,
		startRotationX: {
			min: 0,
			max: 0
		},
		startRotationY: {
			min: 0,
			max: 0
		},
		startColor: "#ffffff",
		startColor2: "#ffffff",
		startGradient: [],
		startGradientAlpha: [],
		startGradientMode: "time",
		gravityModifier: 0,
		maxParticles: 1e3,
		simulationSpace: "local",
		rate: 30,
		bursts: [],
		startDelay: 0,
		stopAfter: 0,
		loopDuration: 0,
		startOffset: 0,
		shape: "cone",
		radius: .2,
		radiusThickness: 1,
		angle: 20,
		arc: 360,
		arcMode: "random",
		alignToDirection: !1,
		spherizeDirection: 0,
		flipRotation: 0,
		speedModifier: [],
		arcSpeed: 1,
		arcSpread: 0,
		boxSize: wm(1, 1, 1),
		randomDirection: 0,
		coneLength: 5,
		donutRadius: .2,
		velocity: wm(),
		orbital: wm(),
		orbitalOffset: wm(),
		radial: 0,
		force: wm(),
		drag: 0,
		speedLimit: 1,
		limitDampen: 0,
		noiseStrength: 0,
		noiseFrequency: .8,
		noiseScroll: 0,
		rateOverDistance: 0,
		simulationSpeed: 1,
		collisionRadiusScale: .05,
		noiseAxes: {
			x: 1,
			y: 1,
			z: 1
		},
		noiseOctaves: 1,
		noiseOctaveMultiplier: .5,
		noiseOctaveScale: 2,
		colors: [
			{
				t: 0,
				color: "#fff4c2"
			},
			{
				t: .4,
				color: "#ff9a2e"
			},
			{
				t: 1,
				color: "#8a1d10"
			}
		],
		stepped: !1,
		alpha: 1,
		fadeIn: .05,
		fadeOut: .4,
		sizeEnd: .3,
		sizeEase: "linear",
		spin: {
			min: 0,
			max: 0
		},
		spinX: {
			min: 0,
			max: 0
		},
		spinY: {
			min: 0,
			max: 0
		},
		sizeCurve: [],
		sizeCurveY: [],
		sizeCurveZ: [],
		alphaCurve: [],
		spinCurve: [],
		spinBySpeed: [],
		spinBySpeedMin: 0,
		spinBySpeedMax: 1,
		velocityCurveX: [],
		velocityCurveY: [],
		velocityCurveZ: [],
		rateCurve: [],
		floor: !1,
		floorY: 0,
		bounce: .4,
		dampen: .2,
		lifetimeLoss: 0,
		minKillSpeed: 0,
		sprite: "soft",
		renderMode: "billboard",
		lengthScale: 2,
		pivot: wm(),
		flip: {
			x: 0,
			y: 0
		},
		applyColorSpace: !0,
		maxParticleSize: 100,
		minParticleSize: 0,
		sortMode: "none",
		light: {
			enabled: !1,
			color: "#ffffff",
			intensity: 1,
			range: 10
		},
		velocityScale: .1,
		mesh: "shard",
		meshAlign: "random",
		material: fm(),
		sheet: Zd(),
		trails: !1,
		trailRatio: 1,
		trailLifetime: .3,
		trailWidth: 1,
		trailWidthEnd: 0,
		trailColor: "#ffffff",
		trailInheritColor: !0,
		trailTexture: "",
		trailMode: "particle",
		trailRibbonCount: 1,
		trailBlend: "",
		trailIntensity: 1,
		trailAlongColors: [],
		trailAlongAlpha: [],
		trailWidthCurve: [],
		trailLifeAlpha: [],
		trailSizeAffectsWidth: !0,
		trailDieWithParticles: !0,
		trailMinVertexDistance: .02,
		subEmitterOf: "",
		subEvent: "death",
		inheritColor: !1,
		inheritSize: !1,
		inheritVelocity: 0,
		...e
	};
}
function Dm(e = {}) {
	return {
		version: 1,
		space: "3d",
		name: "Untitled 3D effect",
		duration: 2,
		fps: 30,
		loop: "perfect",
		background: "#1b1a24",
		seed: 1,
		fixedSeed: !1,
		showCharacter: !0,
		bloom: vm(),
		layers: [Tm({ name: "Particles" })],
		...e
	};
}
var $ = (e, t, n = -Infinity, r = Infinity) => Math.min(r, Math.max(n, typeof e == "number" && Number.isFinite(e) ? e : t)), Om = (e, t, n) => typeof e == "string" && t.includes(e) ? e : n, km = (e, t) => typeof e == "boolean" ? e : t, Am = (e, t, n, r) => {
	let i = e ?? {}, a = $(i.min, t.min, n, r), o = $(i.max, t.max, n, r);
	return a > o && ([a, o] = [o, a]), {
		min: a,
		max: o
	};
}, jm = (e, t, n, r) => {
	let i = e ?? {};
	return {
		x: $(i.x, t.x, n, r),
		y: $(i.y, t.y, n, r),
		z: $(i.z, t.z, n, r)
	};
};
function Mm(e) {
	let t = Tm(), n = e ?? {}, r = (Array.isArray(n.colors) ? n.colors : t.colors).map((e) => ({
		t: $(e?.t, 0, 0, 1),
		color: Vd(e?.color, "#ffffff")
	})).sort((e, t) => e.t - t.t).slice(0, 8);
	r.length || (r = t.colors);
	let i = (Array.isArray(n.bursts) ? n.bursts : []).map((e) => ({
		time: $(e?.time, 0, 0, 60),
		count: Math.round($(e?.count, 10, 0, 1e4)),
		cycles: Math.round($(e?.cycles, 1, 1, 100)),
		interval: $(e?.interval, .1, .01, 60),
		probability: $(e?.probability, 1, 0, 1)
	})).slice(0, 8);
	return {
		id: typeof n.id == "string" && n.id ? n.id : Pd(),
		name: typeof n.name == "string" && n.name ? n.name.slice(0, 60) : t.name,
		visible: km(n.visible, !0),
		rendered: km(n.rendered, !0),
		blend: Om(n.blend, Cm, "add"),
		empty: km(n.empty, !1),
		parentId: typeof n.parentId == "string" ? n.parentId : "",
		position: jm(n.position, t.position, -1e3, 1e3),
		rotation: jm(n.rotation, t.rotation, -720, 720),
		startLifetime: Am(n.startLifetime, t.startLifetime, .02, 60),
		startSpeed: Am(n.startSpeed, t.startSpeed, -500, 500),
		startSize: Am(n.startSize, t.startSize, .001, 200),
		startRotation: Am(n.startRotation, t.startRotation, -720, 720),
		startSize3D: km(n.startSize3D, !1),
		startSizeY: Am(n.startSizeY, Am(n.startSize, t.startSize, .001, 200), 0, 200),
		startSizeZ: Am(n.startSizeZ, Am(n.startSize, t.startSize, .001, 200), 0, 200),
		startRotation3D: km(n.startRotation3D, !1),
		startRotationX: Am(n.startRotationX, t.startRotationX, -720, 720),
		startRotationY: Am(n.startRotationY, t.startRotationY, -720, 720),
		startColor: Vd(n.startColor, "#ffffff"),
		startColor2: Vd(n.startColor2, Vd(n.startColor, "#ffffff")),
		startGradient: (Array.isArray(n.startGradient) ? n.startGradient : []).map((e) => ({
			t: $(e?.t, 0, 0, 1),
			color: Vd(e?.color, "#ffffff")
		})).sort((e, t) => e.t - t.t).slice(0, 8),
		startGradientAlpha: Yl(n.startGradientAlpha, 0, 1),
		startGradientMode: n.startGradientMode === "random" ? "random" : "time",
		gravityModifier: $(n.gravityModifier, 0, -20, 20),
		maxParticles: Math.round($(n.maxParticles, 1e3, 1, 5e4)),
		simulationSpace: Om(n.simulationSpace, ["local", "world"], "local"),
		rate: $(n.rate, t.rate, 0, 5e3),
		bursts: i,
		startDelay: $(n.startDelay, 0, 0, 60),
		stopAfter: $(n.stopAfter, 0, 0, 60),
		loopDuration: $(n.loopDuration, 0, 0, 60),
		startOffset: $(n.startOffset, 0, 0, 60),
		shape: Om(n.shape, bm, t.shape),
		radius: $(n.radius, t.radius, 0, 500),
		radiusThickness: $(n.radiusThickness, 1, 0, 1),
		angle: $(n.angle, t.angle, 0, 90),
		arc: $(n.arc, 360, 0, 360),
		arcMode: Om(n.arcMode, Sm, "random"),
		alignToDirection: km(n.alignToDirection, !1),
		spherizeDirection: $(n.spherizeDirection, 0, 0, 1),
		flipRotation: $(n.flipRotation, 0, 0, 1),
		speedModifier: Yl(n.speedModifier, -10, 10),
		arcSpeed: $(n.arcSpeed, 1, -100, 100),
		arcSpread: $(n.arcSpread, 0, 0, 1),
		boxSize: jm(n.boxSize, t.boxSize, 0, 1e3),
		randomDirection: $(n.randomDirection, 0, 0, 1),
		coneLength: $(n.coneLength, t.coneLength, 0, 500),
		donutRadius: $(n.donutRadius, t.donutRadius, 0, 500),
		velocity: jm(n.velocity, t.velocity, -500, 500),
		orbital: jm(n.orbital, t.orbital, -100, 100),
		orbitalOffset: jm(n.orbitalOffset, t.orbitalOffset, -1e3, 1e3),
		radial: $(n.radial, 0, -500, 500),
		force: jm(n.force, t.force, -1e3, 1e3),
		drag: $(n.drag, 0, 0, 50),
		speedLimit: $(n.speedLimit, t.speedLimit, 0, 1e3),
		limitDampen: $(n.limitDampen, 0, 0, 1),
		noiseStrength: $(n.noiseStrength, 0, 0, 100),
		noiseFrequency: $(n.noiseFrequency, .8, .01, 20),
		noiseScroll: $(n.noiseScroll, 0, 0, 20),
		rateOverDistance: $(n.rateOverDistance, 0, 0, 1e4),
		simulationSpeed: $(n.simulationSpeed, 1, .01, 100),
		collisionRadiusScale: $(n.collisionRadiusScale, .05, 0, 10),
		noiseAxes: jm(n.noiseAxes, {
			x: 1,
			y: 1,
			z: 1
		}, 0, 100),
		noiseOctaves: Math.round($(n.noiseOctaves, 1, 1, 4)),
		noiseOctaveMultiplier: $(n.noiseOctaveMultiplier, .5, 0, 1),
		noiseOctaveScale: $(n.noiseOctaveScale, 2, 1, 4),
		colors: r,
		stepped: km(n.stepped, !1),
		alpha: $(n.alpha, 1, 0, 1),
		fadeIn: $(n.fadeIn, 0, 0, 1),
		fadeOut: $(n.fadeOut, .3, 0, 1),
		sizeEnd: $(n.sizeEnd, t.sizeEnd, 0, 20),
		sizeEase: Om(n.sizeEase, [
			"linear",
			"easeOut",
			"easeIn",
			"pop"
		], "linear"),
		spin: Am(n.spin, t.spin, -3600, 3600),
		spinX: Am(n.spinX, t.spinX, -3600, 3600),
		spinY: Am(n.spinY, t.spinY, -3600, 3600),
		sizeCurve: Yl(n.sizeCurve, 0, 100),
		sizeCurveY: Yl(n.sizeCurveY, 0, 100),
		sizeCurveZ: Yl(n.sizeCurveZ, 0, 100),
		alphaCurve: Yl(n.alphaCurve, 0, 1),
		spinCurve: Yl(n.spinCurve, -3600, 3600),
		spinBySpeed: Yl(n.spinBySpeed, -3600, 3600),
		spinBySpeedMin: $(n.spinBySpeedMin, 0, 0, 1e3),
		spinBySpeedMax: $(n.spinBySpeedMax, 1, 0, 1e3),
		velocityCurveX: Yl(n.velocityCurveX, -500, 500),
		velocityCurveY: Yl(n.velocityCurveY, -500, 500),
		velocityCurveZ: Yl(n.velocityCurveZ, -500, 500),
		rateCurve: Yl(n.rateCurve, 0, 100),
		floor: km(n.floor, !1),
		floorY: $(n.floorY, 0, -1e3, 1e3),
		bounce: $(n.bounce, .4, 0, 2),
		dampen: $(n.dampen, .2, 0, 1),
		lifetimeLoss: $(n.lifetimeLoss, 0, 0, 1),
		minKillSpeed: $(n.minKillSpeed, 0, 0, 1e3),
		sprite: Om(n.sprite, [
			"soft",
			"circle",
			"square",
			"spark",
			"star",
			"ring",
			"smoke",
			"shard"
		], "soft"),
		renderMode: Om(n.renderMode, [
			"billboard",
			"stretched",
			"horizontal",
			"vertical",
			"mesh",
			"none"
		], "billboard"),
		lengthScale: $(n.lengthScale, 2, 0, 500),
		pivot: jm(n.pivot, t.pivot, -100, 100),
		flip: {
			x: $(n.flip?.x, 0, 0, 1),
			y: $(n.flip?.y, 0, 0, 1)
		},
		applyColorSpace: km(n.applyColorSpace, !0),
		maxParticleSize: $(n.maxParticleSize, 100, 0, 100),
		minParticleSize: $(n.minParticleSize, 0, 0, 100),
		sortMode: Om(n.sortMode, xm, "none"),
		light: {
			enabled: km(n.light?.enabled, !1),
			color: Vd(n.light?.color, "#ffffff"),
			intensity: $(n.light?.intensity, 1, 0, 100),
			range: $(n.light?.range, 10, 0, 1e3)
		},
		velocityScale: $(n.velocityScale, .1, 0, 10),
		mesh: gm(n.mesh),
		meshAlign: _m(n.meshAlign),
		material: pm(n.material),
		sheet: Qd(n.sheet),
		trails: km(n.trails, !1),
		trailRatio: $(n.trailRatio, 1, 0, 1),
		trailLifetime: $(n.trailLifetime, .3, .01, 1),
		trailWidth: $(n.trailWidth, 1, 0, 20),
		trailWidthEnd: $(n.trailWidthEnd, 0, 0, 5),
		trailColor: Vd(n.trailColor, "#ffffff"),
		trailInheritColor: km(n.trailInheritColor, !0),
		trailMode: n.trailMode === "ribbon" ? "ribbon" : "particle",
		trailRibbonCount: Math.round($(n.trailRibbonCount, 1, 1, 64)),
		trailTexture: typeof n.trailTexture == "string" ? n.trailTexture.slice(0, 64) : "",
		trailBlend: [
			"add",
			"normal",
			"premultiply",
			"softAdd"
		].find((e) => e === n.trailBlend) ?? "",
		trailIntensity: $(n.trailIntensity, 1, 0, 64),
		trailAlongColors: (Array.isArray(n.trailAlongColors) ? n.trailAlongColors : []).map((e) => ({
			t: $(e?.t, 0, 0, 1),
			color: Vd(e?.color, "#ffffff")
		})).sort((e, t) => e.t - t.t).slice(0, 8),
		trailAlongAlpha: Yl(n.trailAlongAlpha, 0, 1),
		trailWidthCurve: Yl(n.trailWidthCurve, 0, 20),
		trailLifeAlpha: Yl(n.trailLifeAlpha, 0, 1),
		trailSizeAffectsWidth: km(n.trailSizeAffectsWidth, !0),
		trailDieWithParticles: km(n.trailDieWithParticles, !0),
		trailMinVertexDistance: $(n.trailMinVertexDistance, .02, 0, 10),
		subEmitterOf: typeof n.subEmitterOf == "string" ? n.subEmitterOf : "",
		subEvent: Om(n.subEvent, [
			"birth",
			"death",
			"collision"
		], "death"),
		inheritColor: km(n.inheritColor, !1),
		inheritSize: km(n.inheritSize, !1),
		inheritVelocity: $(n.inheritVelocity, 0, -5, 5)
	};
}
function Nm(e) {
	let t = Dm(), n = e ?? {}, r = (Array.isArray(n.layers) ? n.layers.slice(0, 32) : t.layers).map(Mm), i = /* @__PURE__ */ new Set();
	for (let e of r) i.has(e.id) && (e.id = Pd()), i.add(e.id);
	return Uu(r), {
		version: 1,
		space: "3d",
		name: typeof n.name == "string" && n.name ? n.name.slice(0, 80) : t.name,
		duration: $(n.duration, t.duration, .1, 60),
		fps: Math.round($(n.fps, 30, 1, 60)),
		loop: Om(n.loop, [
			"perfect",
			"loop",
			"once"
		], "perfect"),
		background: Vd(n.background, t.background),
		seed: Math.round($(n.seed, 1, 0, 1e9)),
		fixedSeed: km(n.fixedSeed, !1),
		showCharacter: km(n.showCharacter, !0),
		bloom: ym(n.bloom),
		layers: r
	};
}
var Pm = new class {
	preview = null;
	canvas = document.createElement("canvas");
	render(e, t, n, r, i, a = 1) {
		let o = this.ensure(), s = Math.max(1, Math.round(a));
		o.setSize(r * s, i * s), o.camera.position.set(...n.position), o.controls.target.set(...n.target), o.controls.update(), o.render(e, t, null);
		let c = document.createElement("canvas");
		return c.width = Math.round(this.canvas.width / s), c.height = Math.round(this.canvas.height / s), c.getContext("2d").drawImage(this.canvas, 0, 0, c.width, c.height), c;
	}
	webgl() {
		return this.ensure().renderer;
	}
	ensure() {
		return this.preview || (this.preview = new Yp(this.canvas), this.preview.renderer.setPixelRatio(1), this.preview.controls.enableDamping = !1, this.preview.controls.enabled = !1), this.preview;
	}
}();
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/shaders/compileCheck.ts
function Fm(e) {
	return e.split(/\r?\n/).map((e) => e.replace(/^ERROR:\s*\d+:(\d+):\s*/, "第 $1 行：").trim()).filter((e) => e && !e.startsWith("WARNING") && !/compilation errors|^第 \d+ 行：\s*$/.test(e)).slice(0, 12);
}
function Im(e) {
	let t = cf(e).errors;
	if (t.length) return {
		ok: !1,
		errors: t
	};
	let n = Pm.webgl(), r = rp(vd, e), i = new jn();
	i.add(new Yr(new Ei(1, 1), r));
	let a = new ba(), o = [], s = n.debug.onShaderError;
	n.debug.onShaderError = (e, t, n, r) => {
		o.push(...Fm(e.getShaderInfoLog(r) ?? "Compile failed."));
	};
	try {
		n.compile(i, a), n.render(i, a);
	} finally {
		n.debug.onShaderError = s, r.dispose();
	}
	return {
		ok: o.length === 0,
		errors: o
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/export/unity3d/FxForgeCurveTexture.cs?raw
var Lm = "// Small lookup textures for curves the FX Forge particle shader reads per\r\n// pixel (the dissolve cut-off over the particle's life): 64 x 1 float, sampled\r\n// with the particle's life fraction. Saved next to the layer's material so a\r\n// re-import updates it in place.\r\n\r\n#if UNITY_EDITOR\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxCurveTexture\r\n    {\r\n        const int Width = 64;\r\n\r\n        /** The curve's texture `<root>/Materials/<name>.asset`, or null when the curve is empty. */\r\n        public static Texture2D Get(string root, string name, FxKey[] keys)\r\n        {\r\n            if (!FxCurves.Has(keys)) return null;\r\n            var path = $\"{root}/Materials/{name}.asset\";\r\n            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(path);\r\n            bool created = tex == null;\r\n            if (created) tex = new Texture2D(Width, 1, TextureFormat.RFloat, false, true) { name = name };\r\n            tex.wrapMode = TextureWrapMode.Clamp;\r\n            tex.filterMode = FilterMode.Bilinear;\r\n            var px = new Color[Width];\r\n            for (int i = 0; i < Width; i++) px[i] = new Color(FxCurves.Eval(keys, i / (float)(Width - 1)), 0, 0, 1);\r\n            tex.SetPixels(px);\r\n            tex.Apply(false, false);\r\n            if (created) AssetDatabase.CreateAsset(tex, path);\r\n            else EditorUtility.SetDirty(tex);\r\n            return tex;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Rm = "// Value conversions shared by the module builders: ranges, colours, curves.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxCurves\r\n    {\r\n        public static ParticleSystem.MinMaxCurve Two(FxRange r, float k = 1f)\r\n        {\r\n            if (r == null) return new ParticleSystem.MinMaxCurve(0f);\r\n            return Mathf.Approximately(r.min, r.max) ? new ParticleSystem.MinMaxCurve(r.min * k) : new ParticleSystem.MinMaxCurve(r.min * k, r.max * k);\r\n        }\r\n\r\n        public static Color Hex(string hex, Color fallback)\r\n        {\r\n            return ColorUtility.TryParseHtmlString(hex, out var c) ? c : fallback;\r\n        }\r\n\r\n        public static bool Has(FxKey[] k) => k != null && k.Length > 0;\r\n\r\n        /** Value of an FX Forge curve at t (linear between keys, flat outside). */\r\n        public static float Eval(FxKey[] k, float t)\r\n        {\r\n            if (t <= k[0].t) return k[0].v;\r\n            for (int i = 1; i < k.Length; i++)\r\n                if (t <= k[i].t) return Mathf.Lerp(k[i - 1].v, k[i].v, (t - k[i - 1].t) / Mathf.Max(1e-6f, k[i].t - k[i - 1].t));\r\n            return k[k.Length - 1].v;\r\n        }\r\n\r\n        /** An AnimationCurve through the points with linear tangents (FX Forge interpolates linearly). */\r\n        public static AnimationCurve Linear(IEnumerable<Vector2> points)\r\n        {\r\n            var keys = points.GroupBy(p => Mathf.Round(p.x * 10000)).Select(g => g.Last()).OrderBy(p => p.x).Select(p => new Keyframe(p.x, p.y)).ToArray();\r\n            if (keys.Length == 1) keys = new[] { keys[0], new Keyframe(1, keys[0].value) };\r\n            var c = new AnimationCurve(keys);\r\n            for (int i = 0; i < c.length; i++)\r\n            {\r\n                AnimationUtility.SetKeyLeftTangentMode(c, i, AnimationUtility.TangentMode.Linear);\r\n                AnimationUtility.SetKeyRightTangentMode(c, i, AnimationUtility.TangentMode.Linear);\r\n            }\r\n            return c;\r\n        }\r\n\r\n        public static AnimationCurve FromKeys(FxKey[] k, float scale = 1f) => Linear(k.Select(x => new Vector2(x.t, x.v * scale)));\r\n\r\n        /** The rate curve, zero outside the emission window a..b (fractions of the duration). */\r\n        public static AnimationCurve RateCurve(FxKey[] k, float a, float b)\r\n        {\r\n            const float e = 0.0005f;\r\n            var pts = new List<Vector2>();\r\n            foreach (var x in k) if (x.t >= a && x.t <= b) pts.Add(new Vector2(x.t, x.v));\r\n            if (a > 0) { pts.Add(new Vector2(0, 0)); pts.Add(new Vector2(Mathf.Max(0, a - e), 0)); }\r\n            pts.Add(new Vector2(a, Eval(k, a)));\r\n            pts.Add(new Vector2(b, Eval(k, b)));\r\n            if (b < 1) { pts.Add(new Vector2(Mathf.Min(1, b + e), 0)); pts.Add(new Vector2(1, 0)); }\r\n            return Linear(pts);\r\n        }\r\n\r\n        /** Unity gradients hold at most 8 alpha keys: drop the ones that matter least. */\r\n        static List<FxKey> Simplify(FxKey[] keys, int max)\r\n        {\r\n            var k = keys.ToList();\r\n            while (k.Count > max)\r\n            {\r\n                int best = 1; float bestErr = float.MaxValue;\r\n                for (int i = 1; i < k.Count - 1; i++)\r\n                {\r\n                    float lerp = Mathf.Lerp(k[i - 1].v, k[i + 1].v, (k[i].t - k[i - 1].t) / Mathf.Max(1e-6f, k[i + 1].t - k[i - 1].t));\r\n                    float err = Mathf.Abs(lerp - k[i].v) * (k[i + 1].t - k[i - 1].t);\r\n                    if (err < bestErr) { bestErr = err; best = i; }\r\n                }\r\n                k.RemoveAt(best);\r\n            }\r\n            return k;\r\n        }\r\n\r\n        /** A 0..1 curve as gradient alpha keys ([] = opaque; at most 8 keys). */\r\n        public static GradientAlphaKey[] AlphaKeys(FxKey[] k)\r\n        {\r\n            if (!Has(k)) return new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) };\r\n            return Simplify(k, 8).Select(x => new GradientAlphaKey(Mathf.Clamp01(x.v), Mathf.Clamp01(x.t))).ToArray();\r\n        }\r\n\r\n        public static GradientAlphaKey[] AlphaKeys(FxLayer L)\r\n        {\r\n            if (Has(L.alphaCurve))\r\n                return Simplify(L.alphaCurve, 8).Select(k => new GradientAlphaKey(Mathf.Clamp01(k.v * L.alpha), Mathf.Clamp01(k.t))).ToArray();\r\n            float a = Mathf.Clamp01(L.alpha);\r\n            float fi = Mathf.Clamp01(L.fadeIn), fo = Mathf.Clamp01(L.fadeOut);\r\n            var keys = new List<GradientAlphaKey> { new GradientAlphaKey(fi > 0 ? 0f : a, 0f) };\r\n            if (fi > 0) keys.Add(new GradientAlphaKey(a, Mathf.Min(fi, 1f - fo)));\r\n            if (fo > 0) keys.Add(new GradientAlphaKey(a, Mathf.Max(1f - fo, fi)));\r\n            keys.Add(new GradientAlphaKey(fo > 0 ? 0f : a, 1f));\r\n            return keys.GroupBy(k => Mathf.Round(k.time * 1000)).Select(g => g.First()).Take(8).ToArray();\r\n        }\r\n\r\n        public static float SizeAt(string ease, float f, float end)\r\n        {\r\n            switch (ease)\r\n            {\r\n                case \"easeOut\": return 1 + (end - 1) * (1 - (1 - f) * (1 - f));\r\n                case \"easeIn\": return 1 + (end - 1) * f * f;\r\n                case \"pop\":\r\n                    if (f < 0.12f) return f / 0.12f * 1.18f;\r\n                    if (f < 0.25f) return 1.18f - (f - 0.12f) / 0.13f * 0.18f;\r\n                    if (f < 0.7f) return 1f;\r\n                    return 1 + (end - 1) * ((f - 0.7f) / 0.3f);\r\n                default: return 1 + (end - 1) * f;\r\n            }\r\n        }\r\n\r\n        public static AnimationCurve SizeCurve(string ease, float end)\r\n        {\r\n            float[] ts = ease == \"pop\"\r\n                ? new[] { 0f, 0.06f, 0.12f, 0.25f, 0.7f, 0.85f, 1f }\r\n                : ease == \"linear\" ? new[] { 0f, 1f } : new[] { 0f, 0.125f, 0.25f, 0.375f, 0.5f, 0.625f, 0.75f, 0.875f, 1f };\r\n            var c = new AnimationCurve(ts.Select(t => new Keyframe(t, SizeAt(ease, t, end))).ToArray());\r\n            for (int i = 0; i < c.length; i++)\r\n            {\r\n                AnimationUtility.SetKeyLeftTangentMode(c, i, AnimationUtility.TangentMode.Linear);\r\n                AnimationUtility.SetKeyRightTangentMode(c, i, AnimationUtility.TangentMode.Linear);\r\n            }\r\n            return c;\r\n        }\r\n\r\n\r\n        /// <summary>A 0/1 step curve that is on between fractions a and b of the loop.</summary>\r\n        public static AnimationCurve StepCurve(float a, float b)\r\n        {\r\n            var k = new List<Keyframe>();\r\n            k.Add(new Keyframe(0f, a > 0 ? 0f : 1f, 0, 0));\r\n            if (a > 0) k.Add(new Keyframe(a, 1f, float.PositiveInfinity, float.PositiveInfinity));\r\n            if (b < 1) k.Add(new Keyframe(b, 0f, float.PositiveInfinity, float.PositiveInfinity));\r\n            k.Add(new Keyframe(1f, b < 1 ? 0f : 1f, 0, 0));\r\n            var curve = new AnimationCurve(k.ToArray());\r\n            for (int i = 0; i < curve.length; i++)\r\n            {\r\n                AnimationUtility.SetKeyLeftTangentMode(curve, i, AnimationUtility.TangentMode.Constant);\r\n                AnimationUtility.SetKeyRightTangentMode(curve, i, AnimationUtility.TangentMode.Constant);\r\n            }\r\n            return curve;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", zm = "// FX Forge effect file (.fxforge.json) as JsonUtility classes.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    [Serializable] public class FxRange { public float min; public float max; }\r\n    [Serializable] public class FxFlip { public float x; public float y; }\r\n    [Serializable] public class FxLight { public bool enabled; public string color = \"#ffffff\"; public float intensity = 1, range = 10; }\r\n    [Serializable] public class FxVec3 { public float x; public float y; public float z; public Vector3 V => new Vector3(x, y, z); }\r\n    [Serializable] public class FxBurst { public float time; public int count; public int cycles = 1; public float interval = 0.1f, probability = 1; }\r\n    /** A curve key (t 0..1); FX Forge curves are linear between keys, an empty curve is off. */\r\n    [Serializable] public class FxKey { public float t; public float v; }\r\n    [Serializable] public class FxStop { public float t; public string color; }\r\n\r\n    [Serializable]\r\n    public class FxMaterial\r\n    {\r\n        public float intensity = 1;\r\n        public string mainTexture = \"sprite\";\r\n        public float scrollX, scrollY;\r\n        public bool dissolve;\r\n        public float dissolveFrom, dissolveTo = 1, dissolveEdge = 0.08f, dissolveScale = 1, dissolveSoftness = 0.02f;\r\n        public FxKey[] dissolveCurve = new FxKey[0];\r\n        /** Library texture for the dissolve (written by the exporter), '' = the built-in noise. */\r\n        public string dissolveTextureFile = \"\";\r\n        public string dissolveEdgeColor = \"#ffffff\";\r\n        public float fresnel, fresnelPower = 2;\r\n        public string fresnelColor = \"#ffffff\";\r\n        public float softness;\r\n        /** Library texture file name in FXForge/Textures (written by the exporter), '' = built-in. */\r\n        public string textureFile = \"\";\r\n        /** Custom shader name (\"FXForge/Custom/...\", written by the exporter), '' = FXForge/Particle. */\r\n        public string customShader = \"\";\r\n    }\r\n\r\n    [Serializable]\r\n    public class FxSheet\r\n    {\r\n        public bool enabled;\r\n        public string texture = \"smoke\", mode = \"lifetime\";\r\n        public int cycles = 1;\r\n        public float fps = 24;\r\n        public bool randomStart;\r\n        public FxKey[] frameCurve = new FxKey[0]; // Frame over Time, empty = linear 0..1\r\n        public float startFrame; // fraction of the sheet\r\n        /** Library flipbook file name and grid (written by the exporter), '' = built-in 4x4. */\r\n        public string assetFile = \"\";\r\n        public int tilesX = 4, tilesY = 4;\r\n    }\r\n\r\n    [Serializable]\r\n    public class FxLayer\r\n    {\r\n        public string id, name, blend = \"add\";\r\n        public bool visible = true;\r\n        public FxVec3 position = new FxVec3(), rotation = new FxVec3();\r\n        public FxRange startLifetime, startSpeed, startSize, startRotation;\r\n        // 3D start size / rotation (startSize is X, startRotation is Z)\r\n        public bool startSize3D, startRotation3D;\r\n        public FxRange startSizeY = new FxRange(), startSizeZ = new FxRange(), startRotationX = new FxRange(), startRotationY = new FxRange();\r\n        public FxRange spinX = new FxRange(), spinY = new FxRange();\r\n        public FxKey[] sizeCurveY = new FxKey[0], sizeCurveZ = new FxKey[0];\r\n        public FxVec3 pivot = new FxVec3();\r\n        public bool rendered = true;\r\n        public FxFlip flip = new FxFlip();\r\n        public bool applyColorSpace = true;\r\n        public float maxParticleSize = 100, minParticleSize;\r\n        public string sortMode = \"none\";\r\n        public FxLight light = new FxLight();\r\n        public FxStop[] trailAlongColors = new FxStop[0];\r\n        public FxKey[] trailAlongAlpha = new FxKey[0], trailWidthCurve = new FxKey[0], trailLifeAlpha = new FxKey[0];\r\n        public bool trailSizeAffectsWidth = true, trailDieWithParticles = true;\r\n        public float trailMinVertexDistance = 0.02f;\r\n        public FxVec3 orbitalOffset = new FxVec3();\r\n        public string startColor = \"#ffffff\", startColor2 = \"#ffffff\";\r\n        public float gravityModifier;\r\n        public int maxParticles = 1000;\r\n        public string simulationSpace = \"local\";\r\n        public float rate;\r\n        public FxBurst[] bursts = new FxBurst[0];\r\n        public float startDelay, stopAfter;\r\n        public float loopDuration, startOffset; // the layer's own Duration (0 = the effect's) and Unity Start Delay\r\n        public string shape = \"cone\";\r\n        public float radius, radiusThickness = 1, angle = 20, arc = 360;\r\n        public string arcMode = \"random\";\r\n        public bool alignToDirection;\r\n        public float spherizeDirection, flipRotation;\r\n        public FxKey[] speedModifier = new FxKey[0];\r\n        public FxVec3 noiseAxes;\r\n        public float rateOverDistance, simulationSpeed = 1, collisionRadiusScale = 0.05f;\r\n        public int noiseOctaves = 1;\r\n        public float noiseOctaveMultiplier = 0.5f, noiseOctaveScale = 2;\r\n        public float arcSpeed = 1, arcSpread;\r\n        public FxVec3 boxSize = new FxVec3();\r\n        public float randomDirection, coneLength = 5, donutRadius = 0.2f;\r\n        public FxVec3 velocity = new FxVec3(), orbital = new FxVec3(), force = new FxVec3();\r\n        public float radial, drag, speedLimit = 1, limitDampen, noiseStrength, noiseFrequency = 0.8f, noiseScroll;\r\n        public FxStop[] colors = new FxStop[0];\r\n        public FxStop[] startGradient = new FxStop[0];\r\n        public FxKey[] startGradientAlpha = new FxKey[0];\r\n        public string startGradientMode = \"time\";\r\n        public bool stepped;\r\n        public float alpha = 1, fadeIn, fadeOut, sizeEnd = 1;\r\n        public string sizeEase = \"linear\";\r\n        public FxRange spin;\r\n        public FxKey[] sizeCurve = new FxKey[0], alphaCurve = new FxKey[0], spinCurve = new FxKey[0];\r\n        public FxKey[] spinBySpeed = new FxKey[0];\r\n        public float spinBySpeedMin, spinBySpeedMax = 1;\r\n        public FxKey[] velocityCurveX = new FxKey[0], velocityCurveY = new FxKey[0], velocityCurveZ = new FxKey[0], rateCurve = new FxKey[0];\r\n        public bool floor;\r\n        public float floorY, bounce = 0.4f, dampen = 0.2f, lifetimeLoss, minKillSpeed;\r\n        public string sprite = \"soft\", renderMode = \"billboard\";\r\n        public float lengthScale = 2, velocityScale;\r\n        public string mesh = \"shard\", meshAlign = \"random\";\r\n        public FxMaterial material = new FxMaterial();\r\n        public FxSheet sheet = new FxSheet();\r\n        public bool trails;\r\n        public float trailRatio = 1, trailLifetime = 0.3f, trailWidth = 1, trailWidthEnd;\r\n        public string trailColor = \"#ffffff\";\r\n        public bool trailInheritColor = true;\r\n        public string trailTextureFile = \"\", trailBlend = \"\", trailMode = \"particle\";\r\n        public int trailRibbonCount = 1;\r\n        public float trailIntensity = 1;\r\n        public string subEmitterOf = \"\", subEvent = \"death\";\r\n        public bool inheritColor, inheritSize;\r\n        public float inheritVelocity;\r\n        // hierarchy: parent layer id ('' = the effect root); an empty layer is a plain GameObject\r\n        public string parentId = \"\";\r\n        public bool empty;\r\n    }\r\n\r\n    [Serializable]\r\n    public class FxEffect\r\n    {\r\n        public string name = \"FX\";\r\n        public string space;\r\n        public float duration = 2;\r\n        public string loop = \"perfect\";\r\n        public int seed = 1;\r\n        public bool fixedSeed;\r\n        public FxLayer[] layers = new FxLayer[0];\r\n    }\r\n}\r\n#endif\r\n", Bm = "// FX Forge runtime helper for soft particles: they fade against the scene's\r\n// depth, so the camera must render a depth texture. In the Built-in pipeline\r\n// this turns it on for the camera(s) that render the effect. In URP, enable\r\n// \"Depth Texture\" on the URP asset and use Depth Texture Mode \"After Opaques\"\r\n// on the renderer (the importer warns about both).\r\nusing UnityEngine;\r\nusing UnityEngine.Rendering;\r\n\r\nnamespace FXForge\r\n{\r\n    [DisallowMultipleComponent]\r\n    public class FxForgeDepthTexture : MonoBehaviour\r\n    {\r\n        void OnEnable()\r\n        {\r\n            if (GraphicsSettings.currentRenderPipeline != null) return; // URP: set on the pipeline asset\r\n            Camera.onPreCull -= Enable;\r\n            Camera.onPreCull += Enable;\r\n        }\r\n\r\n        void OnDisable()\r\n        {\r\n            Camera.onPreCull -= Enable;\r\n        }\r\n\r\n        static void Enable(Camera cam)\r\n        {\r\n            if ((cam.depthTextureMode & DepthTextureMode.Depth) == 0) cam.depthTextureMode |= DepthTextureMode.Depth;\r\n        }\r\n    }\r\n}\r\n", Vm = "// FX Forge runtime helper: sits on the root of every imported effect prefab.\r\n// Play()/Stop() drive all layers; one-shot effects destroy themselves when the\r\n// last particle has died. Looping effects with sub-emitters cannot use Unity's\r\n// Prewarm (it starts every sub-emitter particle made while prewarming at age 0,\r\n// measured in 2022.3), so they warm up here instead: before the first frame the\r\n// whole effect is simulated in 1/60 s steps, like a game that was already running.\r\nusing UnityEngine;\r\n\r\nnamespace FXForge\r\n{\r\n    [DisallowMultipleComponent]\r\n    [RequireComponent(typeof(ParticleSystem))]\r\n    public class FxForgeEffect : MonoBehaviour\r\n    {\r\n        [Tooltip(\"Destroy this GameObject once every layer has finished (one-shot effects).\")]\r\n        public bool destroyWhenDone = false;\r\n\r\n        [Tooltip(\"Seconds simulated before the first frame (looping effects with sub-emitters start already running). 0 = off.\")]\r\n        public float warmUp = 0f;\r\n\r\n        const float WarmStep = 1f / 60f;\r\n\r\n        ParticleSystem _ps;\r\n        bool _started;\r\n\r\n        public ParticleSystem System => _ps != null ? _ps : (_ps = GetComponent<ParticleSystem>());\r\n\r\n        public void Play()\r\n        {\r\n            WarmUp();\r\n            System.Play(true);\r\n            _started = true;\r\n        }\r\n\r\n        /// <summary>Restarts the effect and simulates `warmUp` seconds of it (in 1/60 s steps, so sub-emitters collide as in play).</summary>\r\n        public void WarmUp()\r\n        {\r\n            if (warmUp <= 0f) return;\r\n            System.Simulate(0f, true, true, false);\r\n            for (float t = 0f; t < warmUp - 1e-4f; t += WarmStep) System.Simulate(Mathf.Min(WarmStep, warmUp - t), true, false, false);\r\n        }\r\n\r\n        public void Stop(bool clear = false)\r\n        {\r\n            System.Stop(true, clear ? ParticleSystemStopBehavior.StopEmittingAndClear : ParticleSystemStopBehavior.StopEmitting);\r\n        }\r\n\r\n        /// <summary>Spawn a copy of this effect at a position (for hits, explosions...).</summary>\r\n        public static FxForgeEffect Spawn(FxForgeEffect prefab, Vector3 position, Quaternion rotation, Transform parent = null)\r\n        {\r\n            var fx = Instantiate(prefab, position, rotation, parent);\r\n            fx.Play();\r\n            return fx;\r\n        }\r\n\r\n        void OnEnable()\r\n        {\r\n            _started = System.main.playOnAwake;\r\n        }\r\n\r\n        void Start()\r\n        {\r\n            // Play On Awake has already started the effect; give it its warm-up before the first frame\r\n            if (warmUp > 0f && System.main.playOnAwake) Play();\r\n        }\r\n\r\n        void LateUpdate()\r\n        {\r\n            if (!destroyWhenDone || !_started) return;\r\n            if (!System.IsAlive(true)) Destroy(gameObject);\r\n        }\r\n    }\r\n}\r\n", Hm = "// FX Forge -> Unity ParticleSystem importer.\r\n//\r\n// Drop a folder exported by FX Forge into Assets/. Every *.fxforge.json in it\r\n// is turned into a prefab next to it: one child ParticleSystem per layer\r\n// (nested like the FX Forge layer tree; empty layers are plain GameObjects), with\r\n// the Main, Emission, Shape, Velocity/Force/Limit Velocity over Lifetime,\r\n// Noise, Colour/Size/Rotation over Lifetime, Collision and Renderer modules\r\n// set from the file. Re-exporting the same effect updates the prefab in place\r\n// (its GUID is kept, so scene references survive).\r\n//\r\n// Menu: Tools > FX Forge > Rebuild All Effects.\r\n// Works with the Built-in pipeline and URP (the bundled shaders are plain\r\n// unlit particle shaders). Unity 2021.3 or newer.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    public class FxForgePostprocessor : AssetPostprocessor\r\n    {\r\n        static void OnPostprocessAllAssets(string[] imported, string[] deleted, string[] moved, string[] movedFrom)\r\n        {\r\n            var effects = imported.Concat(moved).Where(FxForgeImporter.IsEffectFile).Distinct().ToList();\r\n            if (effects.Count == 0) return;\r\n            // wait one editor tick so the shaders and textures that came in the\r\n            // same import are ready\r\n            EditorApplication.delayCall += () =>\r\n            {\r\n                foreach (var p in effects) FxForgeImporter.Build(p);\r\n            };\r\n        }\r\n\r\n        void OnPreprocessTexture()\r\n        {\r\n            if (!assetPath.Replace('\\\\', '/').Contains(\"/Textures/fx_\")) return;\r\n            var ti = (TextureImporter)assetImporter;\r\n            ti.textureType = TextureImporterType.Default;\r\n            ti.alphaSource = TextureImporterAlphaSource.FromInput;\r\n            ti.alphaIsTransparency = true;\r\n            var file = Path.GetFileNameWithoutExtension(assetPath);\r\n            // tileable textures scroll and repeat; the dissolve noise holds plain values, not colours\r\n            ti.wrapMode = file.StartsWith(\"fx_tile_\") ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;\r\n            ti.mipmapEnabled = true;\r\n            ti.sRGBTexture = file != \"fx_tile_dissolve\";\r\n        }\r\n    }\r\n\r\n    public static class FxForgeImporter\r\n    {\r\n        public static bool IsEffectFile(string path) => path.EndsWith(\".fxforge.json\", StringComparison.OrdinalIgnoreCase);\r\n\r\n        [MenuItem(\"Tools/FX Forge/Rebuild All Effects\")]\r\n        public static void BuildAll()\r\n        {\r\n            var paths = AssetDatabase.FindAssets(\"t:TextAsset\")\r\n                .Select(AssetDatabase.GUIDToAssetPath)\r\n                .Where(IsEffectFile)\r\n                .ToList();\r\n            foreach (var p in paths) Build(p);\r\n            Debug.Log($\"[FX Forge] Rebuilt {paths.Count} effect(s).\");\r\n        }\r\n\r\n        public static GameObject Build(string jsonPath)\r\n        {\r\n            var text = AssetDatabase.LoadAssetAtPath<TextAsset>(jsonPath);\r\n            if (text == null) { Debug.LogWarning($\"[FX Forge] Cannot read {jsonPath}\"); return null; }\r\n            FxEffect fx;\r\n            try { fx = JsonUtility.FromJson<FxEffect>(text.text); }\r\n            catch (Exception e) { Debug.LogError($\"[FX Forge] {jsonPath}: invalid JSON ({e.Message})\"); return null; }\r\n            if (fx == null || fx.space != \"3d\") { Debug.LogError($\"[FX Forge] {jsonPath} is not a 3D effect. Export a 3D effect from FX Forge.\"); return null; }\r\n\r\n            var dir = Path.GetDirectoryName(jsonPath).Replace('\\\\', '/');\r\n            var root = Path.GetDirectoryName(dir).Replace('\\\\', '/'); // the FXForge folder\r\n            var prefabPath = $\"{dir}/{Path.GetFileName(jsonPath).Replace(\".fxforge.json\", \"\")}.prefab\";\r\n\r\n            var go = new GameObject(string.IsNullOrEmpty(fx.name) ? \"FX\" : fx.name);\r\n            try\r\n            {\r\n                BuildHierarchy(go, fx, root);\r\n                var prefab = PrefabUtility.SaveAsPrefabAsset(go, prefabPath);\r\n                Debug.Log($\"[FX Forge] Built {prefabPath} ({fx.layers.Length} layer(s)).\", prefab);\r\n                return prefab;\r\n            }\r\n            finally\r\n            {\r\n                UnityEngine.Object.DestroyImmediate(go);\r\n            }\r\n        }\r\n\r\n        static void BuildHierarchy(GameObject go, FxEffect fx, string root)\r\n        {\r\n            bool loop = fx.loop != \"once\";\r\n            bool prewarm = fx.loop == \"perfect\"; // \"loop\": Looping without Prewarm, starts empty\r\n            float duration = Mathf.Max(0.05f, fx.duration);\r\n\r\n            // the root system emits nothing; it lets Play()/Stop() drive all layers\r\n            var rootPs = go.AddComponent<ParticleSystem>();\r\n            {\r\n                var m = rootPs.main;\r\n                m.duration = duration; m.loop = loop; m.playOnAwake = true;\r\n                m.startLifetime = 0.01f; m.maxParticles = 1;\r\n                var e = rootPs.emission; e.enabled = false;\r\n                var s = rootPs.shape; s.enabled = false;\r\n                go.GetComponent<ParticleSystemRenderer>().enabled = false;\r\n            }\r\n            var helper = go.AddComponent<FXForge.FxForgeEffect>();\r\n            helper.destroyWhenDone = !loop;\r\n            helper.warmUp = prewarm ? FxSubEmitters.WarmUp(fx, duration) : 0f;\r\n            if (fx.layers.Any(l => l != null && l.visible && l.material != null && l.material.softness > 0))\r\n            {\r\n                go.AddComponent<FXForge.FxForgeDepthTexture>();\r\n                FxPipelineChecks.WarnIfNoDepthTexture(fx.name);\r\n            }\r\n\r\n            Transform floor = null;\r\n            var systems = new Dictionary<string, ParticleSystem>();\r\n            var nodes = new Dictionary<string, Transform>(); // every created layer object, empty ones included\r\n            var layers = fx.layers.Where(l => l != null).ToList();\r\n            var byId = new Dictionary<string, FxLayer>();\r\n            foreach (var l in layers) if (!string.IsNullOrEmpty(l.id) && !byId.ContainsKey(l.id)) byId[l.id] = l;\r\n            FxLayer Find(string id) => !string.IsNullOrEmpty(id) && byId.TryGetValue(id, out var p) ? p : null;\r\n            bool IsSub(FxLayer l) { var p = Find(l.subEmitterOf); return p != null && p != l && string.IsNullOrEmpty(p.subEmitterOf) && !p.empty && !l.empty; }\r\n            // the node a layer hangs under: its sub-emitter source, else its parent ('' = root)\r\n            string TreeParent(FxLayer l) => IsSub(l) ? l.subEmitterOf : Find(l.parentId) != null ? l.parentId : \"\";\r\n            // hidden layers hide everything under them (Unity: an inactive parent)\r\n            bool Shown(FxLayer l)\r\n            {\r\n                for (int guard = 0; l != null && guard <= layers.Count; guard++)\r\n                {\r\n                    if (!l.visible) return false;\r\n                    l = Find(TreeParent(l));\r\n                }\r\n                return true;\r\n            }\r\n            // parents before children, so every child finds its parent's object\r\n            var pending = layers.Where(Shown).ToList();\r\n            while (pending.Count > 0)\r\n            {\r\n                var ready = pending.Where(l => TreeParent(l) == \"\" || nodes.ContainsKey(TreeParent(l))).ToList();\r\n                if (ready.Count == 0) { Debug.LogWarning($\"[FX Forge] {fx.name}: {pending.Count} layer(s) skipped (parent loop).\"); break; }\r\n                foreach (var L in ready)\r\n                {\r\n                    pending.Remove(L);\r\n                    int i = layers.IndexOf(L);\r\n                    bool sub = IsSub(L);\r\n                    var child = new GameObject(string.IsNullOrEmpty(L.name) ? $\"Layer {i}\" : L.name);\r\n                    var pid = TreeParent(L);\r\n                    if (sub)\r\n                    {\r\n                        // a sub-emitter lives under its source layer; its particles are born at the source's particles\r\n                        child.transform.SetParent(nodes[pid], false);\r\n                        child.transform.localPosition = Vector3.zero;\r\n                        child.transform.rotation = go.transform.rotation * Quaternion.Euler(L.rotation.V);\r\n                    }\r\n                    else\r\n                    {\r\n                        child.transform.SetParent(pid == \"\" ? go.transform : nodes[pid], false);\r\n                        child.transform.localPosition = L.position.V;\r\n                        child.transform.localRotation = Quaternion.Euler(L.rotation.V);\r\n                    }\r\n                    nodes[L.id ?? $\"layer{i}\"] = child.transform;\r\n                    FxLights.Add(child, L.light);\r\n                    if (L.empty) continue; // an empty node is just a Transform\r\n                    var ps = child.AddComponent<ParticleSystem>();\r\n                    // a fresh ParticleSystem starts with Unity's defaults; reset what we set below\r\n                    ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);\r\n                    if (L.floor && floor == null)\r\n                    {\r\n                        floor = new GameObject(\"FX Floor (collision plane)\").transform;\r\n                        floor.SetParent(go.transform, false);\r\n                        floor.localPosition = new Vector3(0, L.floorY, 0);\r\n                    }\r\n                    FxModules.Configure(ps, L, duration, loop, prewarm, i, root, L.floor ? floor : null);\r\n                    if (fx.fixedSeed)\r\n                    {\r\n                        ps.useAutoRandomSeed = false;\r\n                        ps.randomSeed = (uint)(Mathf.Abs(fx.seed) * 7919 + i * 104729 + 1);\r\n                    }\r\n                    if (sub) FxSubEmitters.Attach(systems[pid], Find(pid), ps, L, duration);\r\n                    systems[L.id ?? $\"layer{i}\"] = ps;\r\n                }\r\n            }\r\n            if (fx.fixedSeed)\r\n            {\r\n                rootPs.useAutoRandomSeed = false;\r\n                rootPs.randomSeed = (uint)(Mathf.Abs(fx.seed) + 1);\r\n            }\r\n            // Play On Awake is shared by every system in one effect hierarchy, and\r\n            // registering sub-emitters can clear it: set it last, on the root.\r\n            var rootMain = rootPs.main;\r\n            rootMain.playOnAwake = true;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Um = "// FX Forge: a layer's Unity Light component (a point light on the layer's GameObject).\r\n// Editor script, shipped with every package.\r\n\r\n#if UNITY_EDITOR\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    public static class FxLights\r\n    {\r\n        public static void Add(GameObject go, FxLight L)\r\n        {\r\n            if (L == null || !L.enabled) return;\r\n            var light = go.AddComponent<Light>();\r\n            light.type = LightType.Point;\r\n            light.color = FxCurves.Hex(L.color, Color.white);\r\n            light.intensity = Mathf.Max(0, L.intensity);\r\n            light.range = Mathf.Max(0, L.range);\r\n            light.shadows = LightShadows.None;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Wm = "// One material per layer (and one for its trail), all on the FXForge/Particle\r\n// shader. Materials are named after the layer id, so re-importing an effect\r\n// updates them in place.\r\n\r\n#if UNITY_EDITOR\r\nusing UnityEditor;\r\nusing UnityEngine;\r\nusing UnityEngine.Rendering;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxMaterials\r\n    {\r\n        const string ShaderName = \"FXForge/Particle\";\r\n\r\n        public static Material Particle(string root, FxLayer L)\r\n        {\r\n            var m = L.material ?? new FxMaterial();\r\n            var mat = Load(root, $\"FX_{Safe(L.id)}\", m.customShader);\r\n            mat.mainTexture = Texture(root, MainTextureName(L));\r\n            SetBlend(mat, L.blend);\r\n            mat.SetFloat(\"_Intensity\", m.intensity);\r\n            // flipbooks drive the UVs through the Texture Sheet Animation module\r\n            bool sheet = L.sheet != null && L.sheet.enabled;\r\n            mat.SetVector(\"_Scroll\", sheet ? Vector4.zero : new Vector4(m.scrollX, m.scrollY, 0, 0));\r\n\r\n            Keyword(mat, \"_DISSOLVE_ON\", \"_Dissolve\", m.dissolve);\r\n            bool ownTex = !string.IsNullOrEmpty(m.dissolveTextureFile);\r\n            mat.SetTexture(\"_NoiseTex\", Texture(root, ownTex ? m.dissolveTextureFile : \"fx_tile_dissolve\"));\r\n            mat.SetFloat(\"_DissolveTexOn\", ownTex ? 1f : 0f);\r\n            mat.SetFloat(\"_DissolveSoft\", Mathf.Max(0.001f, m.dissolveSoftness));\r\n            var curve = FxCurveTexture.Get(root, $\"FX_{Safe(L.id)}_dissolve\", m.dissolveCurve);\r\n            mat.SetFloat(\"_DissolveCurveOn\", curve != null ? 1f : 0f);\r\n            mat.SetTexture(\"_DissolveCurve\", curve);\r\n            mat.SetVector(\"_DissolveRange\", new Vector4(m.dissolveFrom, m.dissolveTo, 0, 0));\r\n            mat.SetFloat(\"_DissolveEdge\", m.dissolveEdge);\r\n            mat.SetFloat(\"_DissolveScale\", m.dissolveScale);\r\n            mat.SetColor(\"_EdgeColor\", FxCurves.Hex(m.dissolveEdgeColor, Color.white));\r\n\r\n            bool fresnel = L.renderMode == \"mesh\" && m.fresnel > 0;\r\n            Keyword(mat, \"_FRESNEL_ON\", \"_FresnelOn\", fresnel);\r\n            mat.SetFloat(\"_Fresnel\", m.fresnel);\r\n            mat.SetFloat(\"_FresnelPower\", m.fresnelPower);\r\n            mat.SetColor(\"_FresnelColor\", FxCurves.Hex(m.fresnelColor, Color.white));\r\n\r\n            Keyword(mat, \"_SOFT_ON\", \"_SoftOn\", m.softness > 0);\r\n            mat.SetFloat(\"_Softness\", Mathf.Max(0.01f, m.softness));\r\n            EditorUtility.SetDirty(mat);\r\n            return mat;\r\n        }\r\n\r\n        /** Trails: same shader, texture and intensity; no age-based features. */\r\n        public static Material Trail(string root, FxLayer L)\r\n        {\r\n            var mat = Load(root, $\"FX_{Safe(L.id)}_trail\");\r\n            mat.mainTexture = Texture(root, string.IsNullOrEmpty(L.trailTextureFile) ? \"fx_trail\" : L.trailTextureFile);\r\n            SetBlend(mat, string.IsNullOrEmpty(L.trailBlend) ? L.blend : L.trailBlend);\r\n            mat.SetFloat(\"_Intensity\", (L.material != null ? L.material.intensity : 1f) * L.trailIntensity);\r\n            mat.SetVector(\"_Scroll\", Vector4.zero);\r\n            Keyword(mat, \"_DISSOLVE_ON\", \"_Dissolve\", false);\r\n            Keyword(mat, \"_FRESNEL_ON\", \"_FresnelOn\", false);\r\n            Keyword(mat, \"_SOFT_ON\", \"_SoftOn\", false);\r\n            EditorUtility.SetDirty(mat);\r\n            return mat;\r\n        }\r\n\r\n        static string MainTextureName(FxLayer L)\r\n        {\r\n            if (L.sheet != null && L.sheet.enabled) return string.IsNullOrEmpty(L.sheet.assetFile) ? $\"fx_sheet_{L.sheet.texture}\" : L.sheet.assetFile;\r\n            if (L.material != null && !string.IsNullOrEmpty(L.material.textureFile)) return L.material.textureFile;\r\n            var main = L.material != null ? L.material.mainTexture : \"sprite\";\r\n            if (main == \"noise\" || main == \"streaks\") return $\"fx_tile_{main}\";\r\n            // stretched billboards run the texture's U axis along the motion (measured)\r\n            return $\"fx_{L.sprite}\";\r\n        }\r\n\r\n        static Material Load(string root, string name, string shaderName = null)\r\n        {\r\n            var dir = $\"{root}/Materials\";\r\n            if (!AssetDatabase.IsValidFolder(dir)) AssetDatabase.CreateFolder(root, \"Materials\");\r\n            var path = $\"{dir}/{name}.mat\";\r\n            var wanted = string.IsNullOrEmpty(shaderName) ? ShaderName : shaderName;\r\n            var shader = Shader.Find(wanted);\r\n            if (shader == null && wanted != ShaderName)\r\n            {\r\n                Debug.LogWarning($\"[FX Forge] Custom shader '{wanted}' not found (did it fail to compile?); using {ShaderName}.\");\r\n                shader = Shader.Find(ShaderName);\r\n            }\r\n            if (shader == null)\r\n            {\r\n                Debug.LogWarning($\"[FX Forge] Shader '{ShaderName}' not found; using a built-in particle shader instead.\");\r\n                shader = Shader.Find(\"Particles/Standard Unlit\") ?? Shader.Find(\"Sprites/Default\");\r\n            }\r\n            var mat = AssetDatabase.LoadAssetAtPath<Material>(path);\r\n            if (mat == null)\r\n            {\r\n                mat = new Material(shader);\r\n                AssetDatabase.CreateAsset(mat, path);\r\n            }\r\n            mat.shader = shader;\r\n            return mat;\r\n        }\r\n\r\n        static Texture2D Texture(string root, string name)\r\n        {\r\n            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>($\"{root}/Textures/{name}.png\");\r\n            if (tex == null) Debug.LogWarning($\"[FX Forge] Missing texture {root}/Textures/{name}.png\");\r\n            return tex;\r\n        }\r\n\r\n        /// <summary>Blend factors and the shader's output kind (0 straight, 1 premultiplied, 2 soft additive), as the preview does.</summary>\r\n        static void SetBlend(Material mat, string blend)\r\n        {\r\n            bool custom = blend == \"premultiply\" || blend == \"softAdd\";\r\n            mat.SetFloat(\"_SrcBlend\", (float)(custom ? BlendMode.One : BlendMode.SrcAlpha));\r\n            mat.SetFloat(\"_DstBlend\", (float)(blend == \"softAdd\" ? BlendMode.OneMinusSrcColor : blend == \"add\" ? BlendMode.One : BlendMode.OneMinusSrcAlpha));\r\n            mat.SetFloat(\"_BlendKind\", blend == \"premultiply\" ? 1f : blend == \"softAdd\" ? 2f : 0f);\r\n        }\r\n\r\n        static void Keyword(Material mat, string keyword, string toggle, bool on)\r\n        {\r\n            mat.SetFloat(toggle, on ? 1f : 0f);\r\n            if (on) mat.EnableKeyword(keyword);\r\n            else mat.DisableKeyword(keyword);\r\n        }\r\n\r\n        static string Safe(string id) => string.IsNullOrEmpty(id) ? \"layer\" : System.Text.RegularExpressions.Regex.Replace(id, \"[^A-Za-z0-9_]\", \"_\");\r\n    }\r\n}\r\n#endif\r\n", Gm = "// Mesh assets for mesh particles. FX Forge exports each built-in mesh as\r\n// Meshes/fx_mesh_<kind>.json (Unity coordinates, the same data the preview\r\n// draws); this turns it into Meshes/fx_mesh_<kind>.asset.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxMeshes\r\n    {\r\n        [Serializable]\r\n        class MeshJson\r\n        {\r\n            public float[] positions = new float[0], normals = new float[0], uvs = new float[0];\r\n            public int[] indices = new int[0];\r\n        }\r\n\r\n        public static Mesh Get(string root, string kind)\r\n        {\r\n            var jsonPath = $\"{root}/Meshes/fx_mesh_{kind}.json\";\r\n            var assetPath = $\"{root}/Meshes/fx_mesh_{kind}.asset\";\r\n            var text = AssetDatabase.LoadAssetAtPath<TextAsset>(jsonPath);\r\n            var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);\r\n            if (text == null)\r\n            {\r\n                if (mesh == null) Debug.LogWarning($\"[FX Forge] Missing mesh {jsonPath}\");\r\n                return mesh;\r\n            }\r\n            var data = JsonUtility.FromJson<MeshJson>(text.text);\r\n            bool created = mesh == null;\r\n            if (created) mesh = new Mesh { name = $\"fx_mesh_{kind}\" };\r\n            mesh.Clear();\r\n            int n = data.positions.Length / 3;\r\n            var v = new Vector3[n];\r\n            var nr = new Vector3[n];\r\n            var uv = new Vector2[n];\r\n            for (int i = 0; i < n; i++)\r\n            {\r\n                v[i] = new Vector3(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2]);\r\n                nr[i] = i * 3 + 2 < data.normals.Length ? new Vector3(data.normals[i * 3], data.normals[i * 3 + 1], data.normals[i * 3 + 2]) : Vector3.forward;\r\n                uv[i] = i * 2 + 1 < data.uvs.Length ? new Vector2(data.uvs[i * 2], data.uvs[i * 2 + 1]) : Vector2.zero;\r\n            }\r\n            mesh.vertices = v;\r\n            mesh.normals = nr;\r\n            mesh.uv = uv;\r\n            mesh.triangles = data.indices;\r\n            mesh.RecalculateBounds();\r\n            if (created) AssetDatabase.CreateAsset(mesh, assetPath);\r\n            else EditorUtility.SetDirty(mesh);\r\n            return mesh;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Km = "// One method per Unity ParticleSystem module, filled from an FX Forge layer.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxModules\r\n    {\r\n        /// <summary>Applies every module of one FX Forge layer to a ParticleSystem.</summary>\r\n        public static void Configure(ParticleSystem ps, FxLayer L, float duration, bool loop, bool prewarm, int order, string root, Transform floor)\r\n        {\r\n            // each layer loops over its own duration when it has one (Unity's per-system Duration)\r\n            float own = L.loopDuration > 0 ? L.loopDuration : duration;\r\n            Main(ps, L, own, loop, prewarm);\r\n            Emission(ps, L, own);\r\n            Shape(ps, L);\r\n            Velocity(ps, L);\r\n            Force(ps, L);\r\n            LimitVelocity(ps, L);\r\n            Noise(ps, L);\r\n            ColorOverLifetime(ps, L);\r\n            SizeOverLifetime(ps, L);\r\n            RotationOverLifetime(ps, L);\r\n            RotationBySpeed(ps, L);\r\n            Collision(ps, L, floor);\r\n            FxRendering.Configure(ps, L, order, root);\r\n        }\r\n\r\n        static void Main(ParticleSystem ps, FxLayer L, float duration, bool loop, bool prewarm)\r\n        {\r\n            var main = ps.main;\r\n            main.duration = duration;\r\n            main.loop = loop;\r\n            main.prewarm = prewarm; // Looping + Prewarm starts mid-cycle, like the FX Forge preview\r\n            main.playOnAwake = true;\r\n            main.startDelay = Mathf.Max(0f, L.startOffset); // shifts the whole layer once\r\n            main.startLifetime = FxCurves.Two(L.startLifetime);\r\n            main.startSpeed = FxCurves.Two(L.startSpeed);\r\n            // Unity draws horizontal and vertical billboards at 1/sqrt(2) of the\r\n            // start size (measured in 2022.3); compensate so sizes match FX Forge\r\n            bool flatMode = L.renderMode == \"horizontal\" || L.renderMode == \"vertical\";\r\n            float k = flatMode ? 1.41421356f : 1f;\r\n            main.startSize3D = L.startSize3D;\r\n            if (L.startSize3D)\r\n            {\r\n                main.startSizeX = FxCurves.Two(L.startSize, k);\r\n                main.startSizeY = FxCurves.Two(L.startSizeY, k);\r\n                main.startSizeZ = FxCurves.Two(L.startSizeZ, k);\r\n            }\r\n            else main.startSize = FxCurves.Two(L.startSize, k);\r\n            // random-aligned meshes tumble in 3D; everything else rolls around its view/forward axis\r\n            bool tumble = L.renderMode == \"mesh\" && L.meshAlign == \"random\";\r\n            main.startRotation3D = tumble || LocalMesh(L);\r\n            if (tumble)\r\n            {\r\n                var any = new ParticleSystem.MinMaxCurve(0f, 2f * Mathf.PI);\r\n                main.startRotationX = any;\r\n                main.startRotationY = any;\r\n                main.startRotationZ = any;\r\n            }\r\n            else if (LocalMesh(L))\r\n            {\r\n                main.startRotationX = L.startRotation3D ? FxCurves.Two(L.startRotationX, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);\r\n                main.startRotationY = L.startRotation3D ? FxCurves.Two(L.startRotationY, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);\r\n                main.startRotationZ = FxCurves.Two(L.startRotation, Mathf.Deg2Rad);\r\n            }\r\n            else main.startRotation = FxCurves.Two(L.startRotation, Mathf.Deg2Rad);\r\n            main.flipRotation = Mathf.Clamp01(L.flipRotation);\r\n            var c1 = FxCurves.Hex(L.startColor, Color.white);\r\n            var c2 = FxCurves.Hex(L.startColor2, c1);\r\n            main.startColor = c1 == c2 ? new ParticleSystem.MinMaxGradient(c1) : new ParticleSystem.MinMaxGradient(c1, c2);\r\n            if (L.startGradient != null && L.startGradient.Length > 0)\r\n            {\r\n                // Start Color as a gradient: by the system's time (Gradient) or at random (Random Color)\r\n                var ck = L.startGradient.Take(8).Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), Mathf.Clamp01(s.t))).ToList();\r\n                if (ck.Count == 1) ck.Add(new GradientColorKey(ck[0].color, 1f));\r\n                var g = new Gradient();\r\n                g.SetKeys(ck.ToArray(), FxCurves.AlphaKeys(L.startGradientAlpha));\r\n                var sc = new ParticleSystem.MinMaxGradient(g);\r\n                if (L.startGradientMode == \"random\") sc.mode = ParticleSystemGradientMode.RandomColor;\r\n                main.startColor = sc;\r\n            }\r\n            main.gravityModifier = L.gravityModifier;\r\n            main.simulationSpace = L.simulationSpace == \"world\" ? ParticleSystemSimulationSpace.World : ParticleSystemSimulationSpace.Local;\r\n            main.scalingMode = ParticleSystemScalingMode.Hierarchy;\r\n            main.maxParticles = Mathf.Max(1, L.maxParticles);\r\n            main.simulationSpeed = Mathf.Max(0.01f, L.simulationSpeed);\r\n            main.stopAction = ParticleSystemStopAction.None;\r\n        }\r\n\r\n        static void Emission(ParticleSystem ps, FxLayer L, float duration)\r\n        {\r\n            var em = ps.emission;\r\n            em.enabled = true;\r\n            float a = Mathf.Clamp01(L.startDelay / duration);\r\n            float b = L.stopAfter > 0 ? Mathf.Clamp01(L.stopAfter / duration) : 1f;\r\n            if (L.rate <= 0 || b <= a)\r\n            {\r\n                em.rateOverTime = 0f;\r\n            }\r\n            else if (FxCurves.Has(L.rateCurve))\r\n            {\r\n                // rate over the system's duration, zero outside the emission window\r\n                em.rateOverTime = new ParticleSystem.MinMaxCurve(L.rate, FxCurves.RateCurve(L.rateCurve, a, b));\r\n            }\r\n            else if (a <= 0f && b >= 1f)\r\n            {\r\n                em.rateOverTime = L.rate;\r\n            }\r\n            else\r\n            {\r\n                em.rateOverTime = new ParticleSystem.MinMaxCurve(L.rate, FxCurves.StepCurve(a, b));\r\n            }\r\n            em.rateOverDistance = Mathf.Max(0, L.rateOverDistance);\r\n            var bursts = (L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0 && x.time < duration)\r\n                .Select(x =>\r\n                {\r\n                    var burst = new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767), Mathf.Max(1, x.cycles), Mathf.Max(0.01f, x.interval));\r\n                    burst.probability = Mathf.Clamp01(x.probability);\r\n                    return burst;\r\n                }).ToArray();\r\n            em.SetBursts(bursts);\r\n        }\r\n\r\n        static void Shape(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var sh = ps.shape;\r\n            sh.enabled = true;\r\n            sh.position = Vector3.zero;\r\n            sh.rotation = Vector3.zero;\r\n            sh.scale = L.boxSize != null ? L.boxSize.V : Vector3.one;\r\n            sh.radius = Mathf.Max(0.0001f, L.radius);\r\n            sh.radiusThickness = Mathf.Clamp01(L.radiusThickness);\r\n            sh.arc = Mathf.Clamp(L.arc, 0, 360);\r\n            sh.arcMode = L.arcMode == \"loop\" ? ParticleSystemShapeMultiModeValue.Loop\r\n                : L.arcMode == \"pingpong\" ? ParticleSystemShapeMultiModeValue.PingPong\r\n                : L.arcMode == \"burstSpread\" ? ParticleSystemShapeMultiModeValue.BurstSpread\r\n                : ParticleSystemShapeMultiModeValue.Random;\r\n            sh.arcSpeed = L.arcSpeed;\r\n            sh.arcSpread = Mathf.Clamp01(L.arcSpread);\r\n            sh.angle = Mathf.Clamp(L.angle, 0, 90);\r\n            sh.randomDirectionAmount = Mathf.Clamp01(L.randomDirection);\r\n            sh.sphericalDirectionAmount = Mathf.Clamp01(L.spherizeDirection);\r\n            sh.alignToDirection = L.alignToDirection;\r\n            switch (L.shape)\r\n            {\r\n                case \"sphere\": sh.shapeType = ParticleSystemShapeType.Sphere; break;\r\n                case \"hemisphere\": sh.shapeType = ParticleSystemShapeType.Hemisphere; break;\r\n                case \"box\": sh.shapeType = ParticleSystemShapeType.Box; break;\r\n                case \"coneVolume\": sh.shapeType = ParticleSystemShapeType.ConeVolume; sh.length = Mathf.Max(0.0001f, L.coneLength); break;\r\n                case \"rectangle\": sh.shapeType = ParticleSystemShapeType.Rectangle; sh.scale = new Vector3(L.boxSize.x, L.boxSize.y, 1); break;\r\n                case \"donut\": sh.shapeType = ParticleSystemShapeType.Donut; sh.donutRadius = Mathf.Max(0.0001f, L.donutRadius); break;\r\n                case \"circle\": sh.shapeType = ParticleSystemShapeType.Circle; break;\r\n                case \"edge\": sh.shapeType = ParticleSystemShapeType.SingleSidedEdge; break;\r\n                default: sh.shapeType = ParticleSystemShapeType.Cone; break;\r\n            }\r\n        }\r\n\r\n        static void Velocity(ParticleSystem ps, FxLayer L)\r\n        {\r\n            // space while orbital speeds are around the layer's own axes, so we\r\n            // run the module in local space and rotate the linear part into it.\r\n            var vel = ps.velocityOverLifetime;\r\n            var lin = L.velocity.V;\r\n            var orb = L.orbital.V;\r\n            bool curves = FxCurves.Has(L.velocityCurveX) || FxCurves.Has(L.velocityCurveY) || FxCurves.Has(L.velocityCurveZ);\r\n            bool modifier = FxCurves.Has(L.speedModifier);\r\n            vel.enabled = lin != Vector3.zero || orb != Vector3.zero || L.radial != 0 || curves || modifier;\r\n            if (vel.enabled)\r\n            {\r\n                vel.space = ParticleSystemSimulationSpace.Local;\r\n                // the layer's rotation relative to the effect root (parents included)\r\n                var rot = Quaternion.Inverse(ps.transform.root.rotation) * ps.transform.rotation;\r\n                if (curves)\r\n                {\r\n                    // FX Forge's curves are in world axes; Unity needs the same mode on x, y and z,\r\n                    // so every axis becomes a curve, sampled where any of them has a key\r\n                    var ts = new[] { L.velocityCurveX, L.velocityCurveY, L.velocityCurveZ }.Where(FxCurves.Has).SelectMany(c => c.Select(k => k.t))\r\n                        .Concat(new[] { 0f, 1f }).Distinct().OrderBy(t => t).ToArray();\r\n                    float Axis(FxKey[] c, float constant, float t) => FxCurves.Has(c) ? FxCurves.Eval(c, t) : constant;\r\n                    var local = ts.Select(t => Quaternion.Inverse(rot) * new Vector3(Axis(L.velocityCurveX, lin.x, t), Axis(L.velocityCurveY, lin.y, t), Axis(L.velocityCurveZ, lin.z, t))).ToArray();\r\n                    vel.x = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].x))));\r\n                    vel.y = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].y))));\r\n                    vel.z = new ParticleSystem.MinMaxCurve(1f, FxCurves.Linear(ts.Select((t, i) => new Vector2(t, local[i].z))));\r\n                }\r\n                else\r\n                {\r\n                    var local = Quaternion.Inverse(rot) * lin;\r\n                    vel.x = local.x; vel.y = local.y; vel.z = local.z;\r\n                }\r\n                vel.orbitalX = orb.x; vel.orbitalY = orb.y; vel.orbitalZ = orb.z;\r\n                var off = L.orbitalOffset != null ? L.orbitalOffset.V : Vector3.zero;\r\n                vel.orbitalOffsetX = off.x; vel.orbitalOffsetY = off.y; vel.orbitalOffsetZ = off.z;\r\n                vel.radial = L.radial;\r\n                vel.speedModifier = modifier ? new ParticleSystem.MinMaxCurve(1f, FxCurves.FromKeys(L.speedModifier)) : new ParticleSystem.MinMaxCurve(1f);\r\n            }\r\n        }\r\n\r\n        static void Force(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var force = ps.forceOverLifetime;\r\n            force.enabled = L.force.V != Vector3.zero;\r\n            if (force.enabled)\r\n            {\r\n                force.space = ParticleSystemSimulationSpace.World;\r\n                force.x = L.force.x; force.y = L.force.y; force.z = L.force.z;\r\n                force.randomized = false;\r\n            }\r\n        }\r\n\r\n        static void LimitVelocity(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var lim = ps.limitVelocityOverLifetime;\r\n            lim.enabled = L.drag > 0 || L.limitDampen > 0;\r\n            if (lim.enabled)\r\n            {\r\n                lim.separateAxes = false;\r\n                lim.limit = L.limitDampen > 0 ? L.speedLimit : 100000f;\r\n                lim.dampen = L.limitDampen;\r\n                lim.drag = L.drag;\r\n                lim.multiplyDragByParticleSize = false;\r\n                lim.multiplyDragByParticleVelocity = false;\r\n            }\r\n        }\r\n\r\n        static void Noise(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var noise = ps.noise;\r\n            noise.enabled = L.noiseStrength > 0;\r\n            if (noise.enabled)\r\n            {\r\n                var axes = L.noiseAxes != null ? L.noiseAxes.V : Vector3.one;\r\n                noise.separateAxes = axes != Vector3.one;\r\n                if (noise.separateAxes) { noise.strengthX = L.noiseStrength * axes.x; noise.strengthY = L.noiseStrength * axes.y; noise.strengthZ = L.noiseStrength * axes.z; }\r\n                else noise.strength = L.noiseStrength;\r\n                noise.frequency = Mathf.Max(0.0001f, L.noiseFrequency);\r\n                noise.scrollSpeed = L.noiseScroll;\r\n                noise.damping = false;\r\n                noise.octaveCount = Mathf.Clamp(L.noiseOctaves, 1, 4);\r\n                noise.octaveMultiplier = L.noiseOctaveMultiplier;\r\n                noise.octaveScale = L.noiseOctaveScale;\r\n                noise.quality = ParticleSystemNoiseQuality.High;\r\n            }\r\n        }\r\n\r\n        static void ColorOverLifetime(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var col = ps.colorOverLifetime;\r\n            col.enabled = true;\r\n            var g = new Gradient();\r\n            g.mode = L.stepped ? GradientMode.Fixed : GradientMode.Blend;\r\n            var stops = (L.colors ?? new FxStop[0]).Where(s => s != null).OrderBy(s => s.t).Take(8).ToArray();\r\n            if (stops.Length == 0) stops = new[] { new FxStop { t = 0, color = \"#ffffff\" } };\r\n            var ck = stops.Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), Mathf.Clamp01(s.t))).ToList();\r\n            if (ck.Count == 1) ck.Add(new GradientColorKey(ck[0].color, 1f));\r\n            g.SetKeys(ck.ToArray(), FxCurves.AlphaKeys(L));\r\n            col.color = new ParticleSystem.MinMaxGradient(g);\r\n        }\r\n\r\n        static void SizeOverLifetime(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var size = ps.sizeOverLifetime;\r\n            bool curve = FxCurves.Has(L.sizeCurve);\r\n            bool axes = FxCurves.Has(L.sizeCurveY) || FxCurves.Has(L.sizeCurveZ);\r\n            size.enabled = curve || axes || !(Mathf.Approximately(L.sizeEnd, 1f) && L.sizeEase != \"pop\");\r\n            if (size.enabled)\r\n            {\r\n                var x = curve ? FxCurves.FromKeys(L.sizeCurve) : FxCurves.SizeCurve(L.sizeEase, L.sizeEnd);\r\n                size.separateAxes = axes;\r\n                if (axes)\r\n                {\r\n                    // an empty Y / Z curve follows the X one\r\n                    size.x = new ParticleSystem.MinMaxCurve(1f, x);\r\n                    size.y = new ParticleSystem.MinMaxCurve(1f, FxCurves.Has(L.sizeCurveY) ? FxCurves.FromKeys(L.sizeCurveY) : x);\r\n                    size.z = new ParticleSystem.MinMaxCurve(1f, FxCurves.Has(L.sizeCurveZ) ? FxCurves.FromKeys(L.sizeCurveZ) : x);\r\n                }\r\n                else size.size = new ParticleSystem.MinMaxCurve(1f, x);\r\n            }\r\n        }\r\n\r\n        static void RotationBySpeed(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var rbs = ps.rotationBySpeed;\r\n            rbs.enabled = FxCurves.Has(L.spinBySpeed);\r\n            if (!rbs.enabled) return;\r\n            rbs.separateAxes = false;\r\n            rbs.z = new ParticleSystem.MinMaxCurve(Mathf.Deg2Rad, FxCurves.FromKeys(L.spinBySpeed));\r\n            rbs.range = new Vector2(L.spinBySpeedMin, L.spinBySpeedMax);\r\n        }\r\n\r\n        static void RotationOverLifetime(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var rot = ps.rotationOverLifetime;\r\n            bool curve = FxCurves.Has(L.spinCurve);\r\n            bool turns3D = LocalMesh(L) && L.startRotation3D && (Spins(L.spinX) || Spins(L.spinY));\r\n            rot.enabled = curve || Spins(L.spin) || turns3D;\r\n            if (rot.enabled)\r\n            {\r\n                bool tumble = L.renderMode == \"mesh\" && L.meshAlign == \"random\";\r\n                rot.separateAxes = tumble || LocalMesh(L);\r\n                // the curve is in degrees per second over the particle's life\r\n                var spin = curve ? new ParticleSystem.MinMaxCurve(Mathf.Deg2Rad, FxCurves.FromKeys(L.spinCurve)) : FxCurves.Two(L.spin, Mathf.Deg2Rad);\r\n                if (tumble) { rot.x = spin; rot.y = spin; }\r\n                else if (LocalMesh(L))\r\n                {\r\n                    rot.x = L.startRotation3D ? FxCurves.Two(L.spinX, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);\r\n                    rot.y = L.startRotation3D ? FxCurves.Two(L.spinY, Mathf.Deg2Rad) : new ParticleSystem.MinMaxCurve(0f);\r\n                }\r\n                rot.z = spin;\r\n            }\r\n        }\r\n\r\n        /// <summary>\r\n        /// A mesh drawn in the layer's own orientation. Unity turns a mesh particle's 2D\r\n        /// rotation around its axisOfRotation, which the Shape module sets to the emission\r\n        /// direction (measured in 6000.3: a quad on a sphere-shaped layer tilts at random);\r\n        /// FX Forge turns it around the layer's Z axis, so these use a 3D rotation about Z only.\r\n        /// </summary>\r\n        static bool Spins(FxRange r) => r != null && (r.min != 0 || r.max != 0);\r\n\r\n        static bool LocalMesh(FxLayer L) => L.renderMode == \"mesh\" && (L.meshAlign == \"local\" || L.meshAlign == \"view\");\r\n\r\n        static void Collision(ParticleSystem ps, FxLayer L, Transform floor)\r\n        {\r\n            var coll = ps.collision;\r\n            coll.enabled = floor != null;\r\n            if (coll.enabled)\r\n            {\r\n                coll.type = ParticleSystemCollisionType.Planes;\r\n                coll.SetPlane(0, floor);\r\n                coll.bounce = L.bounce;\r\n                coll.dampen = L.dampen;\r\n                coll.lifetimeLoss = Mathf.Clamp01(L.lifetimeLoss);\r\n                coll.minKillSpeed = Mathf.Max(0f, L.minKillSpeed);\r\n                coll.radiusScale = Mathf.Max(0, L.collisionRadiusScale);\r\n            }\r\n        }\r\n    }\r\n}\r\n#endif\r\n", qm = "// FX Forge: general unlit particle shader (one material per layer).\r\n// Plain pass with no LightMode tag, so it renders in the Built-in pipeline and\r\n// in URP (as SRPDefaultUnlit). Mirrors the preview's shader in\r\n// src/engine/preview3d/shaders.ts: keep the two in step.\r\n//\r\n// Vertex streams (set by the importer): Position, Normal, Color, UV,\r\n// AgePercent, InvStartLifetime, StableRandomX ->\r\n//   TEXCOORD0 = (uv.x, uv.y, agePercent, invStartLifetime), TEXCOORD1.x = random.\r\n// Trails have no custom streams: age reads as 0, which turns the age-based\r\n// features off for them.\r\nShader \"FXForge/Particle\"\r\n{\r\n    Properties\r\n    {\r\n        _MainTex (\"Texture\", 2D) = \"white\" {}\r\n        _Intensity (\"Intensity (HDR)\", Range(0, 32)) = 1\r\n        _Scroll (\"UV Scroll per Second (xy)\", Vector) = (0, 0, 0, 0)\r\n        [Toggle(_DISSOLVE_ON)] _Dissolve (\"Dissolve\", Float) = 0\r\n        _NoiseTex (\"Dissolve Noise\", 2D) = \"gray\" {}\r\n        _DissolveRange (\"Dissolve From/To over Life (xy)\", Vector) = (0, 1, 0, 0)\r\n        _DissolveEdge (\"Dissolve Edge Width\", Range(0, 0.5)) = 0.08\r\n        _DissolveScale (\"Dissolve Noise Scale\", Float) = 1\r\n        _DissolveTexOn (\"Dissolve Uses Its Own Texture\", Float) = 0\r\n        _DissolveSoft (\"Dissolve Softness\", Range(0.001, 1)) = 0.02\r\n        _DissolveCurveOn (\"Dissolve Curve On\", Float) = 0\r\n        _DissolveCurve (\"Dissolve Cut over Life (64 x 1)\", 2D) = \"black\" {}\r\n        _EdgeColor (\"Dissolve Edge Color\", Color) = (1, 1, 1, 1)\r\n        [Toggle(_FRESNEL_ON)] _FresnelOn (\"Fresnel (meshes)\", Float) = 0\r\n        _Fresnel (\"Fresnel Strength\", Range(0, 8)) = 0\r\n        _FresnelPower (\"Fresnel Power\", Range(0.1, 16)) = 2\r\n        _FresnelColor (\"Fresnel Color\", Color) = (1, 1, 1, 1)\r\n        [Toggle(_SOFT_ON)] _SoftOn (\"Soft Particles\", Float) = 0\r\n        _Softness (\"Softness (m)\", Range(0.01, 10)) = 0.5\r\n        _BlendKind (\"Output (0 straight, 1 premultiplied, 2 soft additive)\", Float) = 0\r\n        [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend (\"Src Blend\", Float) = 5\r\n        [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend (\"Dst Blend\", Float) = 1\r\n    }\r\n    SubShader\r\n    {\r\n        Tags { \"Queue\"=\"Transparent\" \"RenderType\"=\"Transparent\" \"IgnoreProjector\"=\"True\" \"PreviewType\"=\"Plane\" }\r\n        Blend [_SrcBlend] [_DstBlend]\r\n        ZWrite Off\r\n        Cull Off\r\n        Lighting Off\r\n\r\n        Pass\r\n        {\r\n            CGPROGRAM\r\n            #pragma vertex vert\r\n            #pragma fragment frag\r\n            #pragma multi_compile_fog\r\n            #pragma shader_feature_local _DISSOLVE_ON\r\n            #pragma shader_feature_local _FRESNEL_ON\r\n            #pragma shader_feature_local _SOFT_ON\r\n            #include \"UnityCG.cginc\"\r\n\r\n            sampler2D _MainTex;\r\n            float4 _MainTex_ST;\r\n            half _Intensity;\r\n            half _BlendKind;\r\n            float4 _Scroll;\r\n            sampler2D _NoiseTex;\r\n            float4 _DissolveRange;\r\n            half _DissolveEdge;\r\n            float _DissolveScale;\r\n            half _DissolveTexOn;\r\n            half _DissolveSoft;\r\n            half _DissolveCurveOn;\r\n            sampler2D _DissolveCurve;\r\n            half4 _EdgeColor;\r\n            half _Fresnel;\r\n            half _FresnelPower;\r\n            half4 _FresnelColor;\r\n            float _Softness;\r\n            UNITY_DECLARE_DEPTH_TEXTURE(_CameraDepthTexture);\r\n            // FX_CUSTOM_CODE (FX Forge custom shaders insert their fxCustom function here)\r\n\r\n            struct appdata\r\n            {\r\n                float4 vertex : POSITION;\r\n                float3 normal : NORMAL;\r\n                fixed4 color : COLOR;\r\n                float4 uv : TEXCOORD0;\r\n                float rnd : TEXCOORD1;\r\n                UNITY_VERTEX_INPUT_INSTANCE_ID\r\n            };\r\n\r\n            struct v2f\r\n            {\r\n                float4 pos : SV_POSITION;\r\n                fixed4 color : COLOR;\r\n                float2 uv : TEXCOORD0;\r\n                float2 baseUv : TEXCOORD1;\r\n                float3 life : TEXCOORD2; // life fraction, random, age (s)\r\n                float3 normal : TEXCOORD3;\r\n                float3 view : TEXCOORD4;\r\n                float4 projPos : TEXCOORD5;\r\n                UNITY_FOG_COORDS(6)\r\n                UNITY_VERTEX_OUTPUT_STEREO\r\n            };\r\n\r\n            v2f vert (appdata v)\r\n            {\r\n                v2f o;\r\n                UNITY_SETUP_INSTANCE_ID(v);\r\n                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);\r\n                o.pos = UnityObjectToClipPos(v.vertex);\r\n                o.color = v.color;\r\n                float age = v.uv.w > 0 ? v.uv.z / v.uv.w : 0;\r\n                o.life = float3(v.uv.z, v.rnd, age);\r\n                o.baseUv = v.uv.xy;\r\n                o.uv = TRANSFORM_TEX(v.uv.xy, _MainTex) + _Scroll.xy * age;\r\n                float3 world = mul(unity_ObjectToWorld, v.vertex).xyz;\r\n                o.normal = UnityObjectToWorldNormal(v.normal);\r\n                o.view = _WorldSpaceCameraPos - world;\r\n                o.projPos = ComputeScreenPos(o.pos);\r\n                COMPUTE_EYEDEPTH(o.projPos.z);\r\n                UNITY_TRANSFER_FOG(o, o.pos);\r\n                return o;\r\n            }\r\n\r\n            fixed4 frag (v2f i) : SV_Target\r\n            {\r\n            #ifdef FX_CUSTOM\r\n                half4 c = fxCustom(i.uv, i.color, i.life.x, i.life.y, i.life.z);\r\n                c.a = saturate(c.a);\r\n            #else\r\n                half4 c = tex2D(_MainTex, i.uv) * i.color;\r\n            #endif\r\n                half base = c.a; // before dissolve / fresnel / soft particles\r\n            #if _DISSOLVE_ON\r\n                // the preview's dissolveCut: a curve over life (64 x 1 lookup) or from / to\r\n                float cut = _DissolveCurveOn > 0.5 ? tex2D(_DissolveCurve, float2(saturate(i.life.x) * (63.0 / 64.0) + 0.5 / 64.0, 0.5)).r : lerp(_DissolveRange.x, _DissolveRange.y, i.life.x);\r\n                float nz = tex2D(_NoiseTex, i.baseUv * _DissolveScale + i.life.y * 7.13 * (1 - _DissolveTexOn)).r;\r\n                c.a *= smoothstep(cut, cut + _DissolveSoft, nz);\r\n                float edge = (1 - smoothstep(cut, cut + _DissolveEdge + 1e-4, nz)) * step(0.001, cut);\r\n                c.rgb = lerp(c.rgb, _EdgeColor.rgb, edge);\r\n            #endif\r\n            #if _FRESNEL_ON\r\n                float rim = pow(1 - abs(dot(normalize(i.normal), normalize(i.view))), _FresnelPower) * _Fresnel;\r\n                c.rgb += _FresnelColor.rgb * rim;\r\n                c.a = saturate(c.a + rim * i.color.a);\r\n            #endif\r\n            #if _SOFT_ON\r\n                float scene = LinearEyeDepth(SAMPLE_DEPTH_TEXTURE_PROJ(_CameraDepthTexture, UNITY_PROJ_COORD(i.projPos)));\r\n                c.a *= saturate((scene - i.projPos.z) / _Softness);\r\n            #endif\r\n                c.rgb *= _Intensity;\r\n                // the layer's blend mode (the preview's fxBlendOut)\r\n                if (_BlendKind > 0.5 && _BlendKind < 1.5) c = half4(c.rgb * i.color.a * (c.a / max(base, 1e-4)), c.a * i.color.a);\r\n                else if (_BlendKind > 1.5) c.rgb *= c.a;\r\n                UNITY_APPLY_FOG_COLOR(i.fogCoord, c, fixed4(0, 0, 0, 0));\r\n                return c;\r\n            }\r\n            ENDCG\r\n        }\r\n    }\r\n}\r\n", Jm = "// Warnings about project settings an effect depends on (soft particles need\r\n// the camera depth texture, copied before transparents are drawn).\r\n\r\n#if UNITY_EDITOR\r\nusing System.Collections.Generic;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\nusing UnityEngine.Rendering;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxPipelineChecks\r\n    {\r\n        /**\r\n         * URP keeps the depth texture settings on its pipeline asset and renderers.\r\n         * Read them through serialized properties so FX Forge needs no URP assembly reference.\r\n         */\r\n        public static void WarnIfNoDepthTexture(string effect)\r\n        {\r\n            var asset = GraphicsSettings.currentRenderPipeline;\r\n            if (asset == null) return; // Built-in: FxForgeDepthTexture turns it on at runtime\r\n            var problems = new List<string>();\r\n            var so = new SerializedObject(asset);\r\n            var depth = so.FindProperty(\"m_RequireDepthTexture\");\r\n            if (depth != null && !depth.boolValue) problems.Add($\"enable 'Depth Texture' on the URP asset ({asset.name})\");\r\n            var renderers = so.FindProperty(\"m_RendererDataList\");\r\n            for (int i = 0; renderers != null && i < renderers.arraySize; i++)\r\n            {\r\n                var data = renderers.GetArrayElementAtIndex(i).objectReferenceValue;\r\n                if (data == null) continue;\r\n                // CopyDepthMode: 0 After Opaques, 1 After Transparents, 2 Force Prepass\r\n                var mode = new SerializedObject(data).FindProperty(\"m_CopyDepthMode\");\r\n                if (mode != null && mode.intValue == 1) problems.Add($\"set 'Depth Texture Mode' to 'After Opaques' on the renderer '{data.name}'\");\r\n            }\r\n            if (problems.Count > 0)\r\n                Debug.LogWarning($\"[FX Forge] '{effect}' uses soft particles: {string.Join(\"; \", problems)}. Otherwise they cannot read the scene depth and disappear or never fade.\", asset);\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Ym = "// ParticleSystemRenderer settings for an FX Forge layer (its trails: FxForgeTrails.cs).\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxRendering\r\n    {\r\n        public static void Configure(ParticleSystem ps, FxLayer L, int order, string root)\r\n        {\r\n            var r = Renderer(ps, L, order, root);\r\n            FxTrails.Configure(ps, L, r, root);\r\n            FxTextureSheet.Configure(ps, L);\r\n        }\r\n\r\n        // The FXForge/Particle shader reads particle age and a stable random from these.\r\n        static readonly List<ParticleSystemVertexStream> Streams = new List<ParticleSystemVertexStream>\r\n        {\r\n            ParticleSystemVertexStream.Position,\r\n            ParticleSystemVertexStream.Normal,\r\n            ParticleSystemVertexStream.Color,\r\n            ParticleSystemVertexStream.UV,\r\n            ParticleSystemVertexStream.AgePercent,\r\n            ParticleSystemVertexStream.InvStartLifetime,\r\n            ParticleSystemVertexStream.StableRandomX,\r\n        };\r\n\r\n        static ParticleSystemRenderer Renderer(ParticleSystem ps, FxLayer L, int order, string root)\r\n        {\r\n            var r = ps.GetComponent<ParticleSystemRenderer>();\r\n            r.enabled = L.rendered; // off: simulates (carries sub-emitters) but draws nothing\r\n            switch (L.renderMode)\r\n            {\r\n                case \"stretched\": r.renderMode = ParticleSystemRenderMode.Stretch; r.lengthScale = L.lengthScale; r.velocityScale = L.velocityScale; r.cameraVelocityScale = 0; break;\r\n                case \"horizontal\": r.renderMode = ParticleSystemRenderMode.HorizontalBillboard; break;\r\n                case \"vertical\": r.renderMode = ParticleSystemRenderMode.VerticalBillboard; break;\r\n                case \"mesh\": r.renderMode = ParticleSystemRenderMode.Mesh; r.mesh = FxMeshes.Get(root, L.mesh); break;\r\n                case \"none\": r.renderMode = ParticleSystemRenderMode.None; break;\r\n                default: r.renderMode = ParticleSystemRenderMode.Billboard; break;\r\n            }\r\n            r.alignment = L.renderMode != \"mesh\" ? ParticleSystemRenderSpace.View\r\n                : L.meshAlign == \"velocity\" ? ParticleSystemRenderSpace.Velocity\r\n                : L.meshAlign == \"view\" ? ParticleSystemRenderSpace.View\r\n                : ParticleSystemRenderSpace.Local;\r\n            r.SetActiveVertexStreams(Streams);\r\n            r.pivot = L.pivot != null ? L.pivot.V : Vector3.zero;\r\n            r.flip = L.renderMode != \"mesh\" && L.flip != null ? new Vector3(L.flip.x, L.flip.y, 0) : Vector3.zero;\r\n            // Apply Active Color Space (serialized only; no script property in 2022.3)\r\n            var so = new SerializedObject(r);\r\n            var acs = so.FindProperty(\"m_ApplyActiveColorSpace\");\r\n            if (acs != null && acs.boolValue != L.applyColorSpace) { acs.boolValue = L.applyColorSpace; so.ApplyModifiedPropertiesWithoutUndo(); }\r\n            // Unity shrinks particles bigger than half the screen by default\r\n            // (Max Particle Size 0.5), which would cut big flashes and ground circles\r\n            r.minParticleSize = Mathf.Max(0, L.minParticleSize);\r\n            r.maxParticleSize = Mathf.Max(r.minParticleSize, L.maxParticleSize);\r\n            r.sortingOrder = order; // keep the FX Forge layer order\r\n            r.sortMode = L.sortMode == \"distance\" ? ParticleSystemSortMode.Distance\r\n                : L.sortMode == \"oldestInFront\" ? ParticleSystemSortMode.OldestInFront\r\n                : L.sortMode == \"youngestInFront\" ? ParticleSystemSortMode.YoungestInFront\r\n                : ParticleSystemSortMode.None;\r\n            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;\r\n            r.receiveShadows = false;\r\n            r.sharedMaterial = FxMaterials.Particle(root, L);\r\n            return r;\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Xm = "// Turns an FX Forge layer into a sub-emitter of its parent layer.\r\n\r\n#if UNITY_EDITOR\r\nusing System;\r\nusing System.Collections.Generic;\r\nusing System.IO;\r\nusing System.Linq;\r\nusing UnityEditor;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxSubEmitters\r\n    {\r\n        /// <summary>\r\n        /// Seconds a prewarmed loop with sub-emitters is simulated by FxForgeEffect before it shows\r\n        /// (their parents cannot use Prewarm, see Attach): long enough for the oldest parent and\r\n        /// sub particle to come from a steady cycle, in whole cycles so the loop starts at its phase 0.\r\n        /// 0 when the effect has no sub-emitters.\r\n        /// </summary>\r\n        public static float WarmUp(FxEffect fx, float duration)\r\n        {\r\n            float span = 0f;\r\n            foreach (var L in fx.layers)\r\n            {\r\n                if (L == null || string.IsNullOrEmpty(L.subEmitterOf)) continue;\r\n                var parent = fx.layers.FirstOrDefault(p => p != null && p.id == L.subEmitterOf);\r\n                if (parent == null) continue;\r\n                float burst = (L.bursts ?? new FxBurst[0]).Where(b => b != null).Select(b => b.time).DefaultIfEmpty(0).Max();\r\n                span = Mathf.Max(span, parent.startOffset + (parent.startLifetime?.max ?? 0) + burst + (L.startLifetime?.max ?? 0));\r\n            }\r\n            return span > 0 ? Mathf.Ceil(span / duration) * duration : 0f;\r\n        }\r\n\r\n        public static void Attach(ParticleSystem parent, FxLayer parentLayer, ParticleSystem ps, FxLayer L, float duration)\r\n        {\r\n            var type = L.subEvent == \"birth\" ? ParticleSystemSubEmitterType.Birth\r\n                : L.subEvent == \"collision\" ? ParticleSystemSubEmitterType.Collision\r\n                : ParticleSystemSubEmitterType.Death;\r\n            if (type == ParticleSystemSubEmitterType.Collision && !parentLayer.floor)\r\n                Debug.LogWarning($\"[FX Forge] '{L.name}' is a Collision sub-emitter but '{parentLayer.name}' has no floor collision, so it never fires.\");\r\n\r\n            // sub-emitter particles are born in the world at the parent particle\r\n            var main = ps.main;\r\n            main.simulationSpace = ParticleSystemSimulationSpace.World;\r\n            main.prewarm = false;\r\n            var em = ps.emission;\r\n            if (type == ParticleSystemSubEmitterType.Birth)\r\n            {\r\n                // Birth: the rate runs per living parent particle; the bursts play once per\r\n                // parent, timed from its birth, cycles included (measured in 2022.3)\r\n                main.loop = true;\r\n                main.duration = duration;\r\n                em.rateOverTime = L.rate;\r\n                em.SetBursts((L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0)\r\n                    .Select(x => new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767), Mathf.Max(1, x.cycles), Mathf.Max(0.01f, x.interval))).ToArray());\r\n            }\r\n            else\r\n            {\r\n                // Death / Collision: the bursts fire once per event\r\n                main.loop = false;\r\n                float last = (L.bursts ?? new FxBurst[0]).Where(b => b != null).Select(b => b.time).DefaultIfEmpty(0).Max();\r\n                main.duration = Mathf.Max(0.05f, last + 0.05f);\r\n                em.rateOverTime = 0f;\r\n                var bursts = (L.bursts ?? new FxBurst[0]).Where(x => x != null && x.count > 0)\r\n                    .Select(x => new ParticleSystem.Burst(x.time, (short)Mathf.Clamp(x.count, 0, 32767))).ToArray();\r\n                em.SetBursts(bursts);\r\n            }\r\n\r\n            var iv = ps.inheritVelocity;\r\n            iv.enabled = L.inheritVelocity != 0;\r\n            if (iv.enabled)\r\n            {\r\n                iv.mode = ParticleSystemInheritVelocityMode.Initial;\r\n                iv.curve = L.inheritVelocity;\r\n            }\r\n\r\n            // In Play Mode, Unity starts every sub-emitter particle made during the\r\n            // parent's prewarm at age 0, so a prewarmed parent dumps a whole cycle of\r\n            // bursts on the first frame (measured in 2022.3). Parents of sub-emitters\r\n            // therefore start empty instead of prewarmed.\r\n            var pm = parent.main;\r\n            pm.prewarm = false;\r\n\r\n            var props = ParticleSystemSubEmitterProperties.InheritNothing;\r\n            if (L.inheritColor) props |= ParticleSystemSubEmitterProperties.InheritColor;\r\n            if (L.inheritSize) props |= ParticleSystemSubEmitterProperties.InheritSize;\r\n            var sub = parent.subEmitters;\r\n            sub.enabled = true;\r\n            sub.AddSubEmitter(ps, type, props);\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Zm = "// Texture Sheet Animation module for flipbook layers (Grid, Whole Sheet,\r\n// read left to right and top to bottom like FX Forge's sheets). Built-in\r\n// flipbooks are 4x4; library flipbooks bring their own grid.\r\n\r\n#if UNITY_EDITOR\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    internal static class FxTextureSheet\r\n    {\r\n        const int Tiles = 4;\r\n\r\n        public static void Configure(ParticleSystem ps, FxLayer L)\r\n        {\r\n            var tsa = ps.textureSheetAnimation;\r\n            var s = L.sheet;\r\n            tsa.enabled = s != null && s.enabled;\r\n            if (!tsa.enabled) return;\r\n            tsa.mode = ParticleSystemAnimationMode.Grid;\r\n            bool custom = !string.IsNullOrEmpty(s.assetFile);\r\n            int tx = custom ? Mathf.Max(1, s.tilesX) : Tiles, ty = custom ? Mathf.Max(1, s.tilesY) : Tiles;\r\n            tsa.numTilesX = tx;\r\n            tsa.numTilesY = ty;\r\n            tsa.animation = ParticleSystemAnimationType.WholeSheet;\r\n            if (s.mode == \"fps\")\r\n            {\r\n                tsa.timeMode = ParticleSystemAnimationTimeMode.FPS;\r\n                tsa.fps = s.fps;\r\n            }\r\n            else\r\n            {\r\n                tsa.timeMode = ParticleSystemAnimationTimeMode.Lifetime;\r\n                tsa.frameOverTime = FxCurves.Has(s.frameCurve)\r\n                    ? new ParticleSystem.MinMaxCurve(1f, FxCurves.FromKeys(s.frameCurve))\r\n                    : new ParticleSystem.MinMaxCurve(1f, AnimationCurve.Linear(0f, 0f, 1f, 1f));\r\n                tsa.cycleCount = Mathf.Max(1, s.cycles);\r\n            }\r\n            // the script API's start frame is a fraction of the sheet (BakeMesh, 2022.3)\r\n            tsa.startFrame = s.randomStart ? new ParticleSystem.MinMaxCurve(0f, 0.9999f) : new ParticleSystem.MinMaxCurve(Mathf.Clamp(s.startFrame, 0f, 0.9999f));\r\n        }\r\n    }\r\n}\r\n#endif\r\n", Qm = "// FX Forge: a layer's Trails module (Unity per-particle trails) and its trail material.\r\n// Editor script, shipped with every package.\r\n\r\n#if UNITY_EDITOR\r\nusing System.Linq;\r\nusing UnityEngine;\r\n\r\nnamespace FXForge.Editor\r\n{\r\n    public static class FxTrails\r\n    {\r\n        public static void Configure(ParticleSystem ps, FxLayer L, ParticleSystemRenderer r, string root)\r\n        {\r\n            var tr = ps.trails;\r\n            tr.enabled = L.trails;\r\n            if (!tr.enabled) { r.trailMaterial = null; return; }\r\n            tr.mode = L.trailMode == \"ribbon\" ? ParticleSystemTrailMode.Ribbon : ParticleSystemTrailMode.PerParticle;\r\n            tr.ribbonCount = Mathf.Clamp(L.trailRibbonCount, 1, 64);\r\n            tr.ratio = Mathf.Clamp01(L.trailRatio);\r\n            tr.lifetime = Mathf.Clamp(L.trailLifetime, 0.01f, 1f);\r\n            tr.minVertexDistance = Mathf.Max(0, L.trailMinVertexDistance);\r\n            tr.worldSpace = L.simulationSpace == \"world\" || !string.IsNullOrEmpty(L.subEmitterOf);\r\n            tr.dieWithParticles = L.trailDieWithParticles;\r\n            tr.textureMode = ParticleSystemTrailTextureMode.Stretch;\r\n            tr.sizeAffectsWidth = L.trailSizeAffectsWidth;\r\n            tr.sizeAffectsLifetime = false;\r\n            var width = L.trailWidthCurve != null && L.trailWidthCurve.Length > 0\r\n                ? FxCurves.FromKeys(L.trailWidthCurve)\r\n                : AnimationCurve.Linear(0f, 1f, 1f, Mathf.Max(0f, L.trailWidthEnd));\r\n            tr.widthOverTrail = new ParticleSystem.MinMaxCurve(Mathf.Max(0f, L.trailWidth), width);\r\n            tr.inheritParticleColor = L.trailInheritColor;\r\n            var colour = FxCurves.Hex(L.trailColor, Color.white);\r\n            tr.colorOverLifetime = new ParticleSystem.MinMaxGradient(Gradient(\r\n                new[] { new GradientColorKey(colour, 0f), new GradientColorKey(colour, 1f) },\r\n                AlphaKeys(L.trailLifeAlpha, null)));\r\n            // along the trail: FX Forge's classic trail fades 1 -> 0\r\n            var along = L.trailAlongColors != null && L.trailAlongColors.Length > 0\r\n                ? L.trailAlongColors.Take(8).Select(s => new GradientColorKey(FxCurves.Hex(s.color, Color.white), s.t)).ToArray()\r\n                : new[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(Color.white, 1f) };\r\n            tr.colorOverTrail = new ParticleSystem.MinMaxGradient(Gradient(along, AlphaKeys(L.trailAlongAlpha, new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(0f, 1f) })));\r\n            tr.generateLightingData = false;\r\n            r.trailMaterial = FxMaterials.Trail(root, L);\r\n        }\r\n\r\n        static Gradient Gradient(GradientColorKey[] c, GradientAlphaKey[] a)\r\n        {\r\n            var g = new Gradient();\r\n            g.SetKeys(c, a);\r\n            return g;\r\n        }\r\n\r\n        /** A curve as gradient alpha keys (Unity keeps at most 8: the curve is sampled at 8 points then). */\r\n        static GradientAlphaKey[] AlphaKeys(FxKey[] k, GradientAlphaKey[] none)\r\n        {\r\n            if (k == null || k.Length == 0) return none ?? new[] { new GradientAlphaKey(1f, 0f), new GradientAlphaKey(1f, 1f) };\r\n            if (k.Length <= 8) return k.Select(x => new GradientAlphaKey(Mathf.Clamp01(x.v), x.t)).ToArray();\r\n            var curve = FxCurves.FromKeys(k);\r\n            return Enumerable.Range(0, 8).Select(i => new GradientAlphaKey(Mathf.Clamp01(curve.Evaluate(i / 7f)), i / 7f)).ToArray();\r\n        }\r\n    }\r\n}\r\n#endif\r\n", $m = Uint8Array, eh = Uint16Array, th = Int32Array, nh = new $m([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]), rh = new $m([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]), ih = new $m([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]), ah = function(e, t) {
	for (var n = new eh(31), r = 0; r < 31; ++r) n[r] = t += 1 << e[r - 1];
	for (var i = new th(n[30]), r = 1; r < 30; ++r) for (var a = n[r]; a < n[r + 1]; ++a) i[a] = a - n[r] << 5 | r;
	return {
		b: n,
		r: i
	};
}, oh = ah(nh, 2), sh = oh.b, ch = oh.r;
sh[28] = 258, ch[258] = 28;
var lh = ah(rh, 0);
lh.b;
for (var uh = lh.r, dh = new eh(32768), fh = 0; fh < 32768; ++fh) {
	var ph = (fh & 43690) >> 1 | (fh & 21845) << 1;
	ph = (ph & 52428) >> 2 | (ph & 13107) << 2, ph = (ph & 61680) >> 4 | (ph & 3855) << 4, dh[fh] = ((ph & 65280) >> 8 | (ph & 255) << 8) >> 1;
}
for (var mh = (function(e, t, n) {
	for (var r = e.length, i = 0, a = new eh(t); i < r; ++i) e[i] && ++a[e[i] - 1];
	var o = new eh(t);
	for (i = 1; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
	var s;
	if (n) {
		s = new eh(1 << t);
		var c = 15 - t;
		for (i = 0; i < r; ++i) if (e[i]) for (var l = i << 4 | e[i], u = t - e[i], d = o[e[i] - 1]++ << u, f = d | (1 << u) - 1; d <= f; ++d) s[dh[d] >> c] = l;
	} else for (s = new eh(r), i = 0; i < r; ++i) e[i] && (s[i] = dh[o[e[i] - 1]++] >> 15 - e[i]);
	return s;
}), hh = new $m(288), fh = 0; fh < 144; ++fh) hh[fh] = 8;
for (var fh = 144; fh < 256; ++fh) hh[fh] = 9;
for (var fh = 256; fh < 280; ++fh) hh[fh] = 7;
for (var fh = 280; fh < 288; ++fh) hh[fh] = 8;
for (var gh = new $m(32), fh = 0; fh < 32; ++fh) gh[fh] = 5;
var _h = /*#__PURE__*/ mh(hh, 9, 0), vh = /*#__PURE__*/ mh(gh, 5, 0), yh = function(e) {
	return (e + 7) / 8 | 0;
}, bh = function(e, t, n) {
	return (t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length), new $m(e.subarray(t, n));
}, xh = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
], Sh = function(e, t, n) {
	var r = Error(t || xh[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, Sh), !n) throw r;
	return r;
}, Ch = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8;
}, wh = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8, e[r + 2] |= n >> 16;
}, Th = function(e, t) {
	for (var n = [], r = 0; r < e.length; ++r) e[r] && n.push({
		s: r,
		f: e[r]
	});
	var i = n.length, a = n.slice();
	if (!i) return {
		t: Mh,
		l: 0
	};
	if (i == 1) {
		var o = new $m(n[0].s + 1);
		return o[n[0].s] = 1, {
			t: o,
			l: 1
		};
	}
	n.sort(function(e, t) {
		return e.f - t.f;
	}), n.push({
		s: -1,
		f: 25001
	});
	var s = n[0], c = n[1], l = 0, u = 1, d = 2;
	for (n[0] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	}; u != i - 1;) s = n[n[l].f < n[d].f ? l++ : d++], c = n[l != u && n[l].f < n[d].f ? l++ : d++], n[u++] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	};
	for (var f = a[0].s, r = 1; r < i; ++r) a[r].s > f && (f = a[r].s);
	var p = new eh(f + 1), m = Eh(n[u - 1], p, 0);
	if (m > t) {
		var r = 0, h = 0, g = m - t, _ = 1 << g;
		for (a.sort(function(e, t) {
			return p[t.s] - p[e.s] || e.f - t.f;
		}); r < i; ++r) {
			var v = a[r].s;
			if (p[v] > t) h += _ - (1 << m - p[v]), p[v] = t;
			else break;
		}
		for (h >>= g; h > 0;) {
			var y = a[r].s;
			p[y] < t ? h -= 1 << t - p[y]++ - 1 : ++r;
		}
		for (; r >= 0 && h; --r) {
			var b = a[r].s;
			p[b] == t && (--p[b], ++h);
		}
		m = t;
	}
	return {
		t: new $m(p),
		l: m
	};
}, Eh = function(e, t, n) {
	return e.s == -1 ? Math.max(Eh(e.l, t, n + 1), Eh(e.r, t, n + 1)) : t[e.s] = n;
}, Dh = function(e) {
	for (var t = e.length; t && !e[--t];);
	for (var n = new eh(++t), r = 0, i = e[0], a = 1, o = function(e) {
		n[r++] = e;
	}, s = 1; s <= t; ++s) if (e[s] == i && s != t) ++a;
	else {
		if (!i && a > 2) {
			for (; a > 138; a -= 138) o(32754);
			a > 2 && (o(a > 10 ? a - 11 << 5 | 28690 : a - 3 << 5 | 12305), a = 0);
		} else if (a > 3) {
			for (o(i), --a; a > 6; a -= 6) o(8304);
			a > 2 && (o(a - 3 << 5 | 8208), a = 0);
		}
		for (; a--;) o(i);
		a = 1, i = e[s];
	}
	return {
		c: n.subarray(0, r),
		n: t
	};
}, Oh = function(e, t) {
	for (var n = 0, r = 0; r < t.length; ++r) n += e[r] * t[r];
	return n;
}, kh = function(e, t, n) {
	var r = n.length, i = yh(t + 2);
	e[i] = r & 255, e[i + 1] = r >> 8, e[i + 2] = e[i] ^ 255, e[i + 3] = e[i + 1] ^ 255;
	for (var a = 0; a < r; ++a) e[i + a + 4] = n[a];
	return (i + 4 + r) * 8;
}, Ah = function(e, t, n, r, i, a, o, s, c, l, u) {
	Ch(t, u++, n), ++i[256];
	for (var d = Th(i, 15), f = d.t, p = d.l, m = Th(a, 15), h = m.t, g = m.l, _ = Dh(f), v = _.c, y = _.n, b = Dh(h), x = b.c, S = b.n, C = new eh(19), w = 0; w < v.length; ++w) ++C[v[w] & 31];
	for (var w = 0; w < x.length; ++w) ++C[x[w] & 31];
	for (var T = Th(C, 7), E = T.t, D = T.l, O = 19; O > 4 && !E[ih[O - 1]]; --O);
	var k = l + 5 << 3, A = Oh(i, hh) + Oh(a, gh) + o, j = Oh(i, f) + Oh(a, h) + o + 14 + 3 * O + Oh(C, E) + 2 * C[16] + 3 * C[17] + 7 * C[18];
	if (c >= 0 && k <= A && k <= j) return kh(t, u, e.subarray(c, c + l));
	var M, N, P, F;
	if (Ch(t, u, 1 + (j < A)), u += 2, j < A) {
		M = mh(f, p, 0), N = f, P = mh(h, g, 0), F = h;
		var I = mh(E, D, 0);
		Ch(t, u, y - 257), Ch(t, u + 5, S - 1), Ch(t, u + 10, O - 4), u += 14;
		for (var w = 0; w < O; ++w) Ch(t, u + 3 * w, E[ih[w]]);
		u += 3 * O;
		for (var L = [v, x], R = 0; R < 2; ++R) for (var ee = L[R], w = 0; w < ee.length; ++w) {
			var te = ee[w] & 31;
			Ch(t, u, I[te]), u += E[te], te > 15 && (Ch(t, u, ee[w] >> 5 & 127), u += ee[w] >> 12);
		}
	} else M = _h, N = hh, P = vh, F = gh;
	for (var w = 0; w < s; ++w) {
		var z = r[w];
		if (z > 255) {
			var te = z >> 18 & 31;
			wh(t, u, M[te + 257]), u += N[te + 257], te > 7 && (Ch(t, u, z >> 23 & 31), u += nh[te]);
			var ne = z & 31;
			wh(t, u, P[ne]), u += F[ne], ne > 3 && (wh(t, u, z >> 5 & 8191), u += rh[ne]);
		} else wh(t, u, M[z]), u += N[z];
	}
	return wh(t, u, M[256]), u + N[256];
}, jh = /*#__PURE__*/ new th([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]), Mh = /*#__PURE__*/ new $m(0), Nh = function(e, t, n, r, i, a) {
	var o = a.z || e.length, s = new $m(r + o + 5 * (1 + Math.ceil(o / 7e3)) + i), c = s.subarray(r, s.length - i), l = a.l, u = (a.r || 0) & 7;
	if (t) {
		u && (c[0] = a.r >> 3);
		for (var d = jh[t - 1], f = d >> 13, p = d & 8191, m = (1 << n) - 1, h = a.p || new eh(32768), g = a.h || new eh(m + 1), _ = Math.ceil(n / 3), v = 2 * _, y = function(t) {
			return (e[t] ^ e[t + 1] << _ ^ e[t + 2] << v) & m;
		}, b = new th(25e3), x = new eh(288), S = new eh(32), C = 0, w = 0, T = a.i || 0, E = 0, D = a.w || 0, O = 0; T + 2 < o; ++T) {
			var k = y(T), A = T & 32767, j = g[k];
			if (h[A] = j, g[k] = A, D <= T) {
				var M = o - T;
				if ((C > 7e3 || E > 24576) && (M > 423 || !l)) {
					u = Ah(e, c, 0, b, x, S, w, E, O, T - O, u), E = C = w = 0, O = T;
					for (var N = 0; N < 286; ++N) x[N] = 0;
					for (var N = 0; N < 30; ++N) S[N] = 0;
				}
				var P = 2, F = 0, I = p, L = A - j & 32767;
				if (M > 2 && k == y(T - L)) for (var R = Math.min(f, M) - 1, ee = Math.min(32767, T), te = Math.min(258, M); L <= ee && --I && A != j;) {
					if (e[T + P] == e[T + P - L]) {
						for (var z = 0; z < te && e[T + z] == e[T + z - L]; ++z);
						if (z > P) {
							if (P = z, F = L, z > R) break;
							for (var ne = Math.min(L, z - 2), re = 0, N = 0; N < ne; ++N) {
								var B = T - L + N & 32767, ie = B - h[B] & 32767;
								ie > re && (re = ie, j = B);
							}
						}
					}
					A = j, j = h[A], L += A - j & 32767;
				}
				if (F) {
					b[E++] = 268435456 | ch[P] << 18 | uh[F];
					var ae = ch[P] & 31, oe = uh[F] & 31;
					w += nh[ae] + rh[oe], ++x[257 + ae], ++S[oe], D = T + P, ++C;
				} else b[E++] = e[T], ++x[e[T]];
			}
		}
		for (T = Math.max(T, D); T < o; ++T) b[E++] = e[T], ++x[e[T]];
		u = Ah(e, c, l, b, x, S, w, E, O, T - O, u), l || (a.r = u & 7 | c[u / 8 | 0] << 3, u -= 7, a.h = g, a.p = h, a.i = T, a.w = D);
	} else {
		for (var T = a.w || 0; T < o + l; T += 65535) {
			var se = T + 65535;
			se >= o && (c[u / 8 | 0] = l, se = o), u = kh(c, u + 1, e.subarray(T, se));
		}
		a.i = o;
	}
	return bh(s, 0, r + yh(u) + i);
}, Ph = /*#__PURE__*/ (function() {
	for (var e = /* @__PURE__ */ new Int32Array(256), t = 0; t < 256; ++t) {
		for (var n = t, r = 9; --r;) n = (n & 1 && -306674912) ^ n >>> 1;
		e[t] = n;
	}
	return e;
})(), Fh = function() {
	var e = -1;
	return {
		p: function(t) {
			for (var n = e, r = 0; r < t.length; ++r) n = Ph[n & 255 ^ t[r]] ^ n >>> 8;
			e = n;
		},
		d: function() {
			return ~e;
		}
	};
}, Ih = function(e, t, n, r, i) {
	if (!i && (i = { l: 1 }, t.dictionary)) {
		var a = t.dictionary.subarray(-32768), o = new $m(a.length + e.length);
		o.set(a), o.set(e, a.length), e = o, i.w = a.length;
	}
	return Nh(e, t.level == null ? 6 : t.level, t.mem == null ? i.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(e.length))) * 1.5) : 20 : 12 + t.mem, n, r, i);
}, Lh = function(e, t) {
	var n = {};
	for (var r in e) n[r] = e[r];
	for (var r in t) n[r] = t[r];
	return n;
}, Rh = function(e, t, n) {
	for (; n; ++t) e[t] = n, n >>>= 8;
};
function zh(e, t) {
	return Ih(e, t || {}, 0, 0);
}
var Bh = function(e, t, n, r) {
	for (var i in e) {
		var a = e[i], o = t + i, s = r;
		Array.isArray(a) && (s = Lh(r, a[1]), a = a[0]), ArrayBuffer.isView(a) ? n[o] = [a, s] : (n[o += "/"] = [new $m(0), s], Bh(a, o, n, r));
	}
}, Vh = typeof TextEncoder < "u" && /*#__PURE__*/ new TextEncoder(), Hh = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	Hh.decode(Mh, { stream: !0 });
} catch {}
function Uh(e, t) {
	if (t) {
		for (var n = new $m(e.length), r = 0; r < e.length; ++r) n[r] = e.charCodeAt(r);
		return n;
	}
	if (Vh) return Vh.encode(e);
	for (var i = e.length, a = new $m(e.length + (e.length >> 1)), o = 0, s = function(e) {
		a[o++] = e;
	}, r = 0; r < i; ++r) {
		if (o + 5 > a.length) {
			var c = new $m(o + 8 + (i - r << 1));
			c.set(a), a = c;
		}
		var l = e.charCodeAt(r);
		l < 128 || t ? s(l) : l < 2048 ? (s(192 | l >> 6), s(128 | l & 63)) : l > 55295 && l < 57344 ? (l = 65536 + (l & 1047552) | e.charCodeAt(++r) & 1023, s(240 | l >> 18), s(128 | l >> 12 & 63), s(128 | l >> 6 & 63), s(128 | l & 63)) : (s(224 | l >> 12), s(128 | l >> 6 & 63), s(128 | l & 63));
	}
	return bh(a, 0, o);
}
var Wh = function(e) {
	var t = 0;
	if (e) for (var n in e) {
		var r = e[n].length;
		r > 65535 && Sh(9), t += r + 4;
	}
	return t;
}, Gh = function(e, t, n, r, i, a, o, s) {
	var c = r.length, l = n.extra, u = s && s.length, d = Wh(l);
	Rh(e, t, o == null ? 67324752 : 33639248), t += 4, o != null && (e[t++] = 20, e[t++] = n.os), e[t] = 20, t += 2, e[t++] = n.flag << 1 | (a < 0 && 8), e[t++] = i && 8, e[t++] = n.compression & 255, e[t++] = n.compression >> 8;
	var f = new Date(n.mtime == null ? Date.now() : n.mtime), p = f.getFullYear() - 1980;
	if ((p < 0 || p > 119) && Sh(10), Rh(e, t, p << 25 | f.getMonth() + 1 << 21 | f.getDate() << 16 | f.getHours() << 11 | f.getMinutes() << 5 | f.getSeconds() >> 1), t += 4, a != -1 && (Rh(e, t, n.crc), Rh(e, t + 4, a < 0 ? -a - 2 : a), Rh(e, t + 8, n.size)), Rh(e, t + 12, c), Rh(e, t + 14, d), t += 16, o != null && (Rh(e, t, u), Rh(e, t + 6, n.attrs), Rh(e, t + 10, o), t += 14), e.set(r, t), t += c, d) for (var m in l) {
		var h = l[m], g = h.length;
		Rh(e, t, +m), Rh(e, t + 2, g), e.set(h, t + 4), t += 4 + g;
	}
	return u && (e.set(s, t), t += u), t;
}, Kh = function(e, t, n, r, i) {
	Rh(e, t, 101010256), Rh(e, t + 8, n), Rh(e, t + 10, n), Rh(e, t + 12, r), Rh(e, t + 16, i);
};
function qh(e, t) {
	t ||= {};
	var n = {}, r = [];
	Bh(e, "", n, t);
	var i = 0, a = 0;
	for (var o in n) {
		var s = n[o], c = s[0], l = s[1], u = l.level == 0 ? 0 : 8, d = Uh(o), f = d.length, p = l.comment, m = p && Uh(p), h = m && m.length, g = Wh(l.extra);
		f > 65535 && Sh(11);
		var _ = u ? zh(c, l) : c, v = _.length, y = Fh();
		y.p(c), r.push(Lh(l, {
			size: c.length,
			crc: y.d(),
			c: _,
			f: d,
			m,
			u: f != o.length || m && p.length != h,
			o: i,
			compression: u
		})), i += 30 + f + g + v, a += 76 + 2 * (f + g) + (h || 0) + v;
	}
	for (var b = new $m(a + 22), x = i, S = a - i, C = 0; C < r.length; ++C) {
		var d = r[C];
		Gh(b, d.o, d, d.f, d.u, d.c.length);
		var w = 30 + d.f.length + Wh(d.extra);
		b.set(d.c, d.o + w), Gh(b, i, d, d.f, d.u, d.c.length, d.o, d.m), i += 16 + w + (d.m ? d.m.length : 0);
	}
	return Kh(b, i, r.length, S, x), b;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/meshSource.ts
var Jh = [
	"lathe",
	"extrude",
	"sweep",
	"raw"
], Yh = 65535, Xh = (e, t, n, r) => Gd(e, t, n, r), Zh = (e) => {
	throw Error(e);
};
function Qh(e, t, n = -1e3, r = 1e3) {
	if (typeof e == "number") return [
		Xh(e, t[0], n, r),
		Xh(e, t[1], n, r),
		Xh(e, t[2], n, r)
	];
	let i = Array.isArray(e) ? e : [];
	return [
		Xh(i[0], t[0], n, r),
		Xh(i[1], t[1], n, r),
		Xh(i[2], t[2], n, r)
	];
}
function $h(e, t, n, r, i = t) {
	return Array.isArray(e) ? (e.length > n && Zh(`${r} has ${e.length} points (max ${n})`), e.map((e, n) => ((!Array.isArray(e) || e.length < i) && Zh(`${r}[${n}] must have at least ${i} numbers`), e.slice(0, t).map((e) => (typeof e == "number" && Number.isFinite(e) || Zh(`${r}[${n}] has a value that is not a number`), Math.max(-1e3, Math.min(1e3, e))))))) : Zh(`${r} must be an array of [${t === 2 ? "x, y" : t === 3 ? "x, y, z" : "..."}] points`);
}
function eg(e, t, n) {
	return Array.isArray(e) ? (e.length > t && Zh(`${n} is too long (${e.length}, max ${t})`), e.map((e, t) => typeof e == "number" && Number.isFinite(e) ? e : Zh(`${n}[${t}] is not a number`))) : Zh(`${n} must be an array of numbers`);
}
function tg(e) {
	let t = {};
	return e.scale !== void 0 && (t.scale = Qh(e.scale, [
		1,
		1,
		1
	], -100, 100)), e.rotate !== void 0 && (t.rotate = Qh(e.rotate, [
		0,
		0,
		0
	], -3600, 3600)), e.offset !== void 0 && (t.offset = Qh(e.offset, [
		0,
		0,
		0
	], -100, 100)), e.flat === !0 && (t.flat = !0), t;
}
function ng(e) {
	let t = Yd(e), n = Kd(t.type, Jh, "raw");
	t.type !== n && Zh(`source.type must be one of ${Jh.join(", ")}`);
	let r = tg(t);
	switch (n) {
		case "lathe": {
			let e = $h(t.profile, 4, 256, "profile", 2).map(([e, t, n = 0, r = 0]) => [
				e,
				Math.max(0, t),
				n,
				r
			]);
			return e.length < 2 && Zh("profile needs at least 2 rows"), {
				type: n,
				profile: e,
				...r,
				axis: Kd(t.axis, ["y", "z"], "y"),
				segments: Math.round(Xh(t.segments, 32, 3, 128)),
				twist: Xh(t.twist, 0, -7200, 7200),
				uRepeat: Xh(t.uRepeat, 1, .01, 100),
				vRepeat: Xh(t.vRepeat, 1, .01, 100)
			};
		}
		case "extrude": {
			let e = $h(t.outline, 2, 512, "outline");
			return e.length < 3 && Zh("outline needs at least 3 points"), {
				type: n,
				outline: e,
				depth: Xh(t.depth, 0, 0, 100),
				...r
			};
		}
		case "sweep": {
			let e = $h(t.path, 3, 512, "path");
			e.length < 2 && Zh("path needs at least 2 points");
			let i = typeof t.width == "number" ? [t.width] : t.width === void 0 ? [.2] : eg(t.width, 512, "width");
			return i.length || Zh("width needs at least one value"), {
				type: n,
				path: e,
				...r,
				width: i.map((e) => Math.max(0, Math.min(100, e))),
				sides: (() => {
					let e = Math.round(Xh(t.sides, 0, 0, 64));
					return e > 0 && e < 3 ? 3 : e;
				})(),
				up: Qh(t.up, [
					0,
					1,
					0
				]),
				widthAxis: Kd(t.widthAxis, ["side", "up"], "side"),
				twist: Xh(t.twist, 0, -7200, 7200),
				smooth: qd(t.smooth, !0),
				uRepeat: Xh(t.uRepeat, 1, .01, 100),
				vRepeat: Xh(t.vRepeat, 1, .01, 100)
			};
		}
		default: {
			let e = eg(t.positions, Yh * 3, "positions");
			(e.length < 9 || e.length % 3) && Zh("positions must hold x, y, z per vertex (at least 3 vertices)");
			let i = e.length / 3, a = eg(t.indices, 6e5, "indices").map((e) => Math.round(e));
			(a.length < 3 || a.length % 3) && Zh("indices must hold 3 vertex indices per triangle"), a.some((e) => e < 0 || e >= i) && Zh(`indices must be between 0 and ${i - 1}`);
			let o = {
				type: n,
				positions: e,
				indices: a,
				...r
			};
			if (t.uvs !== void 0) {
				let e = eg(t.uvs, Yh * 2, "uvs");
				e.length !== i * 2 && Zh(`uvs must hold u, v per vertex (${i * 2} numbers)`), o.uvs = e;
			}
			if (t.normals !== void 0) {
				let e = eg(t.normals, Yh * 3, "normals");
				e.length !== i * 3 && Zh(`normals must hold x, y, z per vertex (${i * 3} numbers)`), o.normals = e;
			}
			return typeof t.from == "string" && (o.from = t.from.slice(0, 120)), o;
		}
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/common.ts
var rg = () => ({
	positions: [],
	normals: [],
	uvs: [],
	indices: []
}), ig = (e, t) => [
	e[0] - t[0],
	e[1] - t[1],
	e[2] - t[2]
], ag = (e, t) => [
	e[0] + t[0],
	e[1] + t[1],
	e[2] + t[2]
], og = (e, t) => [
	e[0] * t,
	e[1] * t,
	e[2] * t
], sg = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], cg = (e, t) => [
	e[1] * t[2] - e[2] * t[1],
	e[2] * t[0] - e[0] * t[2],
	e[0] * t[1] - e[1] * t[0]
], lg = (e) => Math.hypot(e[0], e[1], e[2]), ug = (e, t = [
	0,
	0,
	1
]) => {
	let n = lg(e);
	return n > 1e-9 ? [
		e[0] / n,
		e[1] / n,
		e[2] / n
	] : t;
}, dg = (e, t) => [
	e[t * 3],
	e[t * 3 + 1],
	e[t * 3 + 2]
];
function fg(e) {
	let t = e.positions.length / 3, n = (t) => `${Math.round(e.positions[t * 3] * 1e4)},${Math.round(e.positions[t * 3 + 1] * 1e4)},${Math.round(e.positions[t * 3 + 2] * 1e4)}`, r = /* @__PURE__ */ new Map(), i = new Int32Array(t);
	for (let e = 0; e < t; e++) {
		let t = n(e), a = r.get(t);
		a === void 0 && r.set(t, a = r.size), i[e] = a;
	}
	let a = new Float64Array(r.size * 3);
	for (let t = 0; t < e.indices.length; t += 3) {
		let [n, r, o] = [
			e.indices[t],
			e.indices[t + 1],
			e.indices[t + 2]
		], s = cg(ig(dg(e.positions, r), dg(e.positions, n)), ig(dg(e.positions, o), dg(e.positions, n)));
		for (let e of [
			n,
			r,
			o
		]) for (let t = 0; t < 3; t++) a[i[e] * 3 + t] += s[t];
	}
	e.normals = [];
	for (let n = 0; n < t; n++) e.normals.push(...ug([
		a[i[n] * 3],
		a[i[n] * 3 + 1],
		a[i[n] * 3 + 2]
	]));
}
function pg(e) {
	let t = rg();
	for (let n = 0; n < e.indices.length; n += 3) {
		let r = [
			e.indices[n],
			e.indices[n + 1],
			e.indices[n + 2]
		], [i, a, o] = r.map((t) => dg(e.positions, t)), s = ug(cg(ig(a, i), ig(o, i))), c = r.reduce((t, n) => ag(t, dg(e.normals, n)), [
			0,
			0,
			0
		]);
		sg(s, c) < 0 && (s = og(s, -1));
		for (let n of r) t.positions.push(...dg(e.positions, n)), t.normals.push(...s), t.uvs.push(e.uvs[n * 2], e.uvs[n * 2 + 1]), t.indices.push(t.indices.length);
	}
	return t;
}
function mg(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a = 0; a < e.positions.length; a += 3) t = Math.min(t, e.positions[a]), r = Math.max(r, e.positions[a]), n = Math.min(n, e.positions[a + 1]), i = Math.max(i, e.positions[a + 1]);
	let a = r - t || 1, o = i - n || 1;
	e.uvs = [];
	for (let r = 0; r < e.positions.length; r += 3) e.uvs.push((e.positions[r] - t) / a, (e.positions[r + 1] - n) / o);
}
function hg(e, t) {
	let n = t.scale ?? [
		1,
		1,
		1
	], r = t.rotate ? Kl({
		x: t.rotate[0],
		y: t.rotate[1],
		z: t.rotate[2]
	}) : null, i = t.offset ?? [
		0,
		0,
		0
	];
	for (let t = 0; t < e.positions.length; t += 3) {
		let a = [
			e.positions[t] * n[0],
			e.positions[t + 1] * n[1],
			e.positions[t + 2] * n[2]
		], o = ug([
			e.normals[t] / (n[0] || 1),
			e.normals[t + 1] / (n[1] || 1),
			e.normals[t + 2] / (n[2] || 1)
		]);
		n[0] * n[1] * n[2] < 0 && (o = og(o, -1)), r && (a = Jl(r, ...a), o = Jl(r, ...o)), e.positions[t] = a[0] + i[0], e.positions[t + 1] = a[1] + i[1], e.positions[t + 2] = a[2] + i[2], e.normals[t] = o[0], e.normals[t + 1] = o[1], e.normals[t + 2] = o[2];
	}
	if (n[0] * n[1] * n[2] < 0) for (let t = 0; t < e.indices.length; t += 3) [e.indices[t + 1], e.indices[t + 2]] = [e.indices[t + 2], e.indices[t + 1]];
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/triangulate.ts
function gg(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) {
		let [r, i] = e[n], [a, o] = e[(n + 1) % e.length];
		t += r * o - a * i;
	}
	return t / 2;
}
var _g = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]);
function vg(e, t, n, r) {
	return _g(t, n, e) >= 0 && _g(n, r, e) >= 0 && _g(r, t, e) >= 0;
}
function yg(e) {
	let t = e.map((e, t) => t);
	gg(e) < 0 && t.reverse();
	let n = [], r = t.length * t.length;
	for (; t.length > 3 && r-- > 0;) {
		let r = !1;
		for (let i = 0; i < t.length; i++) {
			let a = t[(i + t.length - 1) % t.length], o = t[i], s = t[(i + 1) % t.length], c = e[a], l = e[o], u = e[s];
			if (_g(c, l, u) <= 1e-12) continue;
			let d = !0;
			for (let n of t) if (n !== a && n !== o && n !== s && vg(e[n], c, l, u)) {
				d = !1;
				break;
			}
			if (d) {
				n.push(a, o, s), t.splice(i, 1), r = !0;
				break;
			}
		}
		r || (n.push(t[0], t[1], t[2]), t.splice(1, 1));
	}
	return t.length === 3 && n.push(t[0], t[1], t[2]), n;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/extrude.ts
function bg(e) {
	let t = e.outline.slice(), [n, r] = [t[0], t[t.length - 1]];
	t.length > 3 && Math.hypot(n[0] - r[0], n[1] - r[1]) < 1e-9 && (t = t.slice(0, -1)), gg(t) < 0 && t.reverse();
	let i = yg(t), a = Infinity, o = Infinity, s = -Infinity, c = -Infinity;
	for (let [e, n] of t) a = Math.min(a, e), s = Math.max(s, e), o = Math.min(o, n), c = Math.max(c, n);
	let l = s - a || 1, u = c - o || 1, d = rg(), f = e.depth / 2, p = (e, n) => {
		let r = d.positions.length / 3;
		for (let [r, i] of t) d.positions.push(r, i, e), d.normals.push(0, 0, n), d.uvs.push((r - a) / l, (i - o) / u);
		for (let e = 0; e < i.length; e += 3) d.indices.push(r + i[e], r + i[e + 1], r + i[e + 2]);
	};
	if (p(-f, -1), e.depth <= 0) return d;
	p(f, 1);
	let m = 0, h = t.map((e, n) => {
		let r = t[(n + 1) % t.length], i = Math.hypot(r[0] - e[0], r[1] - e[1]);
		return m += i, i;
	}), g = 0;
	for (let e = 0; e < t.length; e++) {
		let [n, r] = t[e], [i, a] = t[(e + 1) % t.length], o = h[e] || 1, s = (a - r) / o, c = -(i - n) / o, l = g / m, u = (g + h[e]) / m;
		g += h[e];
		let p = d.positions.length / 3;
		d.positions.push(n, r, -f, i, a, -f, i, a, f, n, r, f);
		for (let e = 0; e < 4; e++) d.normals.push(s, c, 0);
		d.uvs.push(l, 0, u, 0, u, 1, l, 1), d.indices.push(p, p + 1, p + 2, p, p + 2, p + 3);
	}
	return d;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/lathe.ts
function xg(e) {
	let t = rg(), n = e.profile, r = e.segments, i = [0];
	for (let e = 1; e < n.length; e++) i.push(i[e - 1] + Math.hypot(n[e][0] - n[e - 1][0], n[e][1] - n[e - 1][1]));
	let a = i[i.length - 1] || 1, o = n[n.length - 1][0] >= n[0][0] ? 1 : -1, s = e.twist * Math.PI / 180, c = (t, n, r) => e.axis === "y" ? [
		n,
		t,
		r
	] : [
		n,
		r,
		t
	];
	for (let l = 0; l < n.length; l++) {
		let [u, d, f, p] = n[l], m = i[l] / a, [h, g] = n[Math.max(0, l - 1)], [_, v] = n[Math.min(n.length - 1, l + 1)], y = (_ - h) * o, b = (v - g) * o;
		for (let n = 0; n <= r; n++) {
			let i = n / r * Math.PI * 2 + s * m, a = Math.cos(i), o = Math.sin(i);
			t.positions.push(...c(u, a * d + f, o * d + p)), t.normals.push(...ug(c(-b, a * y, o * y), c(1, 0, 0))), t.uvs.push(n / r * e.uRepeat, m * e.vRepeat);
		}
	}
	let l = r + 1;
	for (let e = 0; e + 1 < n.length; e++) for (let n = 0; n < r; n++) {
		let r = e * l + n;
		t.indices.push(r, r + 1, r + l + 1, r, r + l + 1, r + l);
	}
	return t;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/sweep.ts
function Sg(e, t) {
	if (!t || e.length < 3) return e.map((e, t) => ({
		p: e,
		f: t
	}));
	let n = Math.max(1, Math.min(8, Math.floor(256 / e.length))), r = (t) => e[Math.max(0, Math.min(e.length - 1, t))], i = [];
	for (let t = 0; t + 1 < e.length; t++) {
		let [e, a, o, s] = [
			r(t - 1),
			r(t),
			r(t + 1),
			r(t + 2)
		];
		for (let r = 0; r < n; r++) {
			let c = r / n, l = c * c, u = l * c, d = (t) => .5 * (2 * a[t] + (-e[t] + o[t]) * c + (2 * e[t] - 5 * a[t] + 4 * o[t] - s[t]) * l + (-e[t] + 3 * a[t] - 3 * o[t] + s[t]) * u);
			i.push({
				p: [
					d(0),
					d(1),
					d(2)
				],
				f: t + c
			});
		}
	}
	return i.push({
		p: e[e.length - 1],
		f: e.length - 1
	}), i;
}
function Cg(e, t) {
	let n = e.width;
	if (n.length === 1) return n[0];
	let r = t / Math.max(1, e.path.length - 1) * (n.length - 1), i = Math.min(n.length - 2, Math.floor(r));
	return n[i] + (n[i + 1] - n[i]) * (r - i);
}
function wg(e) {
	let t = Sg(e.path, e.smooth), n = [0];
	for (let e = 1; e < t.length; e++) n.push(n[e - 1] + lg(ig(t[e].p, t[e - 1].p)));
	let r = n[n.length - 1] || 1, i = ug(e.up, [
		0,
		1,
		0
	]), a = e.twist * Math.PI / 180, o = e.sides ? e.sides + 1 : 2, s = rg(), c = null;
	for (let o = 0; o < t.length; o++) {
		let l = ug(ig(t[Math.min(t.length - 1, o + 1)].p, t[Math.max(0, o - 1)].p)), u = cg(l, i);
		lg(u) < 1e-6 && (u = c ?? cg(l, Math.abs(l[0]) < .9 ? [
			1,
			0,
			0
		] : [
			0,
			0,
			1
		])), u = ug(ig(u, og(l, sg(u, l)))), c = u;
		let d = ug(cg(u, l)), f = n[o] / r, p = a * f;
		[u, d] = [ag(og(u, Math.cos(p)), og(d, Math.sin(p))), ag(og(u, -Math.sin(p)), og(d, Math.cos(p)))];
		let m = Cg(e, t[o].f) / 2, h = t[o].p;
		if (e.sides) for (let t = 0; t <= e.sides; t++) {
			let n = t / e.sides * Math.PI * 2, r = ag(og(u, Math.cos(n)), og(d, Math.sin(n)));
			s.positions.push(...ag(h, og(r, m))), s.normals.push(...r), s.uvs.push(f * e.uRepeat, t / e.sides * e.vRepeat);
		}
		else {
			let [t, n] = e.widthAxis === "side" ? [u, d] : [d, u];
			s.positions.push(...ig(h, og(t, m)), ...ag(h, og(t, m))), s.normals.push(...n, ...n), s.uvs.push(f * e.uRepeat, 0, f * e.uRepeat, e.vRepeat);
		}
	}
	for (let e = 0; e + 1 < t.length; e++) for (let t = 0; t + 1 < o; t++) {
		let n = e * o + t;
		s.indices.push(n, n + 1, n + o + 1, n, n + o + 1, n + o);
	}
	return s;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/meshes/build/index.ts
function Tg(e) {
	let t = {
		positions: e.positions.slice(),
		normals: [],
		uvs: e.uvs?.slice() ?? [],
		indices: e.indices.slice()
	};
	return e.uvs || mg(t), e.normals ? t.normals = e.normals.slice() : fg(t), t;
}
function Eg(e) {
	let t = e.type === "lathe" ? xg(e) : e.type === "extrude" ? bg(e) : e.type === "sweep" ? wg(e) : Tg(e);
	(e.scale || e.rotate || e.offset) && hg(t, e), e.flat && (t = pg(t));
	let n = t.positions.length / 3;
	if (n > 65535) throw Error(`The mesh has ${n} vertices (max ${Yh}); use fewer segments or points${e.flat ? ", or drop flat" : ""}`);
	if (!t.indices.length) throw Error("The mesh has no triangles");
	let r = (e) => Math.round(e * 1e5) / 1e5;
	return {
		positions: t.positions.map(r),
		normals: t.normals.map(r),
		uvs: t.uvs.map(r),
		indices: t.indices
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/skill/assets/browser/libraries.ts
var Dg = /* @__PURE__ */ new Map(), Og = /* @__PURE__ */ new Map(), kg = {
	get: (e) => Dg.get(e),
	get all() {
		return [...Dg.values()];
	},
	async register(e) {
		if (Dg.get(e.id)?.dataUrl === e.dataUrl) return;
		let t = new Image();
		if (await new Promise((n, r) => {
			t.onload = () => n(), t.onerror = () => r(/* @__PURE__ */ Error(`Cannot decode asset ${e.id}`)), t.src = e.dataUrl;
		}), t.naturalWidth !== e.width || t.naturalHeight !== e.height) throw Error(`Asset dimensions differ ${e.id}`);
		let n = document.createElement("canvas");
		n.width = t.naturalWidth, n.height = t.naturalHeight, n.getContext("2d").drawImage(t, 0, 0), Dg.set(e.id, e), tf(e.id, {
			canvas: n,
			kind: e.kind,
			tilesX: e.tilesX,
			tilesY: e.tilesY
		});
	}
}, Ag = {
	get: (e) => Og.get(e),
	get all() {
		return [...Og.values()];
	},
	register(e) {
		Og.get(e.id)?.code !== e.code && (Og.set(e.id, e), dp(e.id, e.code));
	}
}, jg = /* @__PURE__ */ new Map(), Mg = { register(e) {
	jg.get(e.id) !== e && ($u(e.id, Eg(e.source)), jg.set(e.id, e));
} }, Ng = "// FX_CUSTOM_CODE", Pg = (e) => `FXForge/Custom/${e}`, Fg = (e) => `FXForge/Shaders/FxForgeCustom_${e}.shader`;
function Ig(e, t) {
	let n = e.indexOf(Ng);
	if (n < 0 || !e.includes("Shader \"FXForge/Particle\"")) throw Error("FxForgeParticle.shader has no custom-code marker.");
	let r = e.indexOf("\n", n), i = `#define FX_CUSTOM\n${gf}\n            // ${t.name.replace(/[\r\n]/g, " ")}: translated from FX Forge's GLSL subset\n${df(t.code)}\n`;
	return `// FX Forge custom shader "${t.name.replace(/[\r\n"]/g, " ")}" (${t.id}), generated from FXForge/Particle.\n// Edit it in FX Forge (素材 › 自定义着色器) and export again; changes made here are overwritten.\n` + e.slice(0, n).replace("Shader \"FXForge/Particle\"", `Shader "${Pg(t.id)}"`) + i + e.slice(r + 1);
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/export/customMeshExport.ts
var Lg = (e) => Xu(e) && !ed(e) ? "shard" : e;
function Rg(e) {
	let t = {};
	for (let n of e.layers) {
		if (n.renderMode !== "mesh" || !Xu(n.mesh)) continue;
		let e = ed(n.mesh);
		e && (t[`FXForge/Meshes/fx_mesh_${n.mesh}.json`] ??= Uh(JSON.stringify(e.data)));
	}
	return t;
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/export/export3d.ts
var zg = /* #__PURE__ */ Object.assign({
	"./unity3d/FxForgeCurveTexture.cs": Lm,
	"./unity3d/FxForgeCurves.cs": Rm,
	"./unity3d/FxForgeData.cs": zm,
	"./unity3d/FxForgeDepthTexture.cs": Bm,
	"./unity3d/FxForgeEffect.cs": Vm,
	"./unity3d/FxForgeImporter.cs": Hm,
	"./unity3d/FxForgeLights.cs": Um,
	"./unity3d/FxForgeMaterials.cs": Wm,
	"./unity3d/FxForgeMeshes.cs": Gm,
	"./unity3d/FxForgeModules.cs": Km,
	"./unity3d/FxForgeParticle.shader": qm,
	"./unity3d/FxForgePipelineChecks.cs": Jm,
	"./unity3d/FxForgeRendering.cs": Ym,
	"./unity3d/FxForgeSubEmitters.cs": Xm,
	"./unity3d/FxForgeTextureSheet.cs": Zm,
	"./unity3d/FxForgeTrails.cs": Qm
});
function Bg() {
	let e = {};
	for (let [t, n] of Object.entries(zg)) {
		let r = t.split("/").pop(), i = r.endsWith(".shader") ? "Shaders" : /\bUNITY_EDITOR\b|using UnityEditor;/.test(n) ? "Editor" : "Runtime";
		e[`FXForge/${i}/${r}`] = Uh(n);
	}
	return e;
}
var Vg = [
	"soft",
	"circle",
	"square",
	"spark",
	"star",
	"ring",
	"smoke",
	"shard"
], Hg = 128, Ug = (e) => e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "effect";
async function Wg(e) {
	let t = await new Promise((t, n) => e.toBlob((e) => e ? t(e) : n(/* @__PURE__ */ Error("PNG encode failed")), "image/png"));
	return new Uint8Array(await t.arrayBuffer());
}
var Gg = null;
async function Kg() {
	let e = {};
	for (let t of Vg) {
		let n = xf(t, Hg);
		e[`FXForge/Textures/fx_${t}.png`] = await Wg(n);
	}
	e["FXForge/Textures/fx_trail.png"] = await Wg(kf());
	for (let t of Xd) e[`FXForge/Textures/fx_sheet_${t}.png`] = await Wg(Wf(t));
	for (let t of ["noise", "streaks"]) e[`FXForge/Textures/fx_tile_${t}.png`] = await Wg(Kf(t));
	e["FXForge/Textures/fx_tile_dissolve.png"] = await Wg(Gf());
	for (let t of mm) e[`FXForge/Meshes/fx_mesh_${t}.json`] = Uh(JSON.stringify(gd(t)));
	return e;
}
async function qg(e) {
	let t = Ug(e.name);
	Gg ??= Kg().catch((e) => {
		throw Gg = null, e;
	});
	let { json: n, textures: r } = Xg(e);
	return {
		...Bg(),
		...await Gg,
		...r,
		...Rg(e),
		[`FXForge/Effects/${t}.fxforge.json`]: Uh(JSON.stringify(n, null, 2)),
		"FXForge/README.txt": Uh(Zg(e, t))
	};
}
var Jg = (e) => e.kind === "tile" ? `fx_tile_asset_${e.id}` : `fx_asset_${e.id}`;
function Yg(e) {
	let t = e.slice(e.indexOf(",") + 1), n = atob(t), r = new Uint8Array(n.length);
	for (let e = 0; e < n.length; e++) r[e] = n.charCodeAt(e);
	return r;
}
function Xg(e) {
	let t = {}, n = (e) => {
		let n = Jg(e);
		return t[`FXForge/Textures/${n}.png`] ??= Yg(e.dataUrl), n;
	}, r = zg["./unity3d/FxForgeParticle.shader"], i = e.layers.map((e) => {
		let i = e.material.texture ? kg.get(e.material.texture) : void 0, a = e.sheet.asset ? kg.get(e.sheet.asset) : void 0, o = e.material.shader ? Ag.get(e.material.shader) : void 0, s = e.material.dissolveTexture ? kg.get(e.material.dissolveTexture) : void 0, c = e.trailTexture ? kg.get(e.trailTexture) : void 0;
		return o && (t[Fg(o.id)] ??= Uh(Ig(r, o))), {
			...e,
			mesh: Lg(e.mesh),
			material: {
				...e.material,
				textureFile: i && i.kind !== "flipbook" ? n(i) : "",
				dissolveTextureFile: s && s.kind !== "flipbook" ? n(s) : "",
				customShader: o ? Pg(o.id) : ""
			},
			trailTextureFile: c && c.kind !== "flipbook" ? n(c) : "",
			sheet: {
				...e.sheet,
				assetFile: a?.kind === "flipbook" ? n(a) : "",
				tilesX: a?.kind === "flipbook" ? a.tilesX : 4,
				tilesY: a?.kind === "flipbook" ? a.tilesY : 4
			}
		};
	});
	return {
		json: {
			...e,
			layers: i
		},
		textures: t
	};
}
function Zg(e, t) {
	return `FX Forge - Unity ParticleSystem export: ${e.name}
==================================================

What this is
  A real-time Unity particle effect (Shuriken ParticleSystem), not a baked
  sprite sheet. Each FX Forge layer becomes a child ParticleSystem.

Install
  1. Unzip so that the "FXForge" folder lands inside your project's Assets/
     folder (Assets/FXForge/...). If you already have an FXForge folder from an
     earlier export, let it overwrite the scripts and shaders.
  2. Unity imports it and builds the prefab automatically:
       Assets/FXForge/Effects/${t}.prefab
     If it did not appear, use the menu Tools > FX Forge > Rebuild All Effects.
  3. Drag the prefab into your scene and press Play (or select it and use the
     Particle Effect panel in the Scene view to preview without playing).

Using it in code
  One-shot effects (${e.loop === "once" ? "this one" : "hits, explosions"}) destroy themselves when finished:
      FXForge.FxForgeEffect.Spawn(prefab, hitPoint, Quaternion.identity);
  Looping effects (${e.loop === "perfect" ? "this one" : "fires, auras"}) start mid-cycle (Prewarm) and keep playing;
  call Stop() on the FxForgeEffect component to let them die out.

Notes
  - Units are metres; the FX Forge preview character is 1.8 m tall.
  - Scaling the prefab's root scales the whole effect (Scaling Mode: Hierarchy).
  - Shader: FXForge/Particle (one material per layer in FXForge/Materials).
    It is unlit and works in the Built-in pipeline and URP. In HDRP, switch the
    materials to an HDRP particle shader.
  - Colour space: FX Forge previews in Linear colour space, Unity's default
    for URP and new projects (Project Settings > Player > Other Settings >
    Color Space). In a Gamma project colours and glows look harsher.${Qg(e)}${$g(e)}
  - Editing the prefab by hand is fine, but re-importing ${t}.fxforge.json
    (or re-exporting from FX Forge) rebuilds it and overwrites those edits.
  - Noise uses Unity's own noise, so turbulent layers look similar to the
    FX Forge preview but not identical.
`;
}
function Qg(e) {
	let t = e.layers.some((e) => e.material.intensity > 1);
	return !e.bloom.enabled && !t ? "" : `
  - Glow (HDR + Bloom): ${t ? "some layers are brighter than 1 (HDR intensity). " : ""}${e.bloom.enabled ? `The preview used Bloom (intensity ${e.bloom.intensity}, threshold ${e.bloom.threshold}). ` : ""}
    URP: turn on HDR on the URP asset, Post Processing on the camera, and add a
    Global Volume with a Bloom override (threshold ${e.bloom.threshold}, intensity ~${e.bloom.intensity}).
    Built-in pipeline: install the Post Processing package (Post-process Layer
    on the camera, Post-process Volume with Bloom) and allow HDR on the camera.`;
}
function $g(e) {
	return e.layers.some((e) => e.visible && e.material.softness > 0) ? "\n  - Soft particles fade against the scene's depth. Built-in pipeline: the\n    prefab's FxForgeDepthTexture component turns the camera depth texture on.\n    URP: enable \"Depth Texture\" on the URP asset, and set \"Depth Texture Mode\"\n    on the URP renderer to \"After Opaques\" (URP 17's default \"After Transparents\"\n    hides soft particles). The importer warns when either is off." : "";
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/core/effectKind.ts
var e_ = (e) => e.space === "3d";
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/agent/renderChecks3d.ts
function t_(e, t, n) {
	for (let r of e.layers) {
		if (!r.visible || r.empty) continue;
		let e = r.material;
		e.shader && !Ag.get(e.shader) && t.push(`${r.name}: material.shader "${e.shader}" is not in the library; the standard material is used.`);
		let i = e.texture ? kg.get(e.texture) : null;
		e.texture && !i && t.push(`${r.name}: material.texture "${e.texture}" is not in the library (deleted?); the built-in texture is used.`), i?.kind === "flipbook" && t.push(`${r.name}: "${i.name}" is a flipbook; put it in sheet.asset with sheet.enabled true, not in material.texture.`);
		let a = r.sheet.asset ? kg.get(r.sheet.asset) : null;
		r.sheet.asset && !a && t.push(`${r.name}: sheet.asset "${r.sheet.asset}" is not in the library; the built-in flipbook is used.`), a && a.kind !== "flipbook" && t.push(`${r.name}: "${a.name}" is not a flipbook; use it as material.texture.`), r.sheet.asset && !r.sheet.enabled && t.push(`${r.name}: sheet.asset is set but sheet.enabled is false, so the flipbook is not shown.`), e.fresnel > 0 && r.renderMode !== "mesh" && t.push(`${r.name}: fresnel only works on mesh particles (renderMode "mesh").`);
		let o = i ? i.kind === "tile" : e.mainTexture !== "sprite";
		(e.scrollX || e.scrollY) && !o && !r.sheet.enabled && t.push(`${r.name}: UV scroll on a non-tiling texture slides it off its quad. Use mainTexture "noise" / "streaks" or a tile asset.`), r.sheet.enabled && (e.scrollX || e.scrollY) && t.push(`${r.name}: UV scroll is ignored while the flipbook is on.`), e.dissolve && e.dissolveTo <= e.dissolveFrom && t.push(`${r.name}: dissolve does not progress (dissolveTo <= dissolveFrom).`), r.renderMode === "mesh" && r.sprite === "soft" && !r.sheet.enabled && !i && e.mainTexture === "sprite" && n.push(`${r.name}: mesh with the "soft" sprite fades toward its UV edges; use sprite "square" for a solid surface.`);
	}
	e.layers.some((e) => e.visible && e.material.softness > 0) && n.push("Soft particles: in Unity URP the URP asset needs \"Depth Texture\" on and the renderer's \"Depth Texture Mode\" set to \"After Opaques\" (the export README says so).");
	let r = e.layers.some((e) => e.visible && e.material.intensity > 1);
	r && !e.bloom.enabled && n.push("Some layers have intensity > 1 but bloom is off: they only look brighter, not glowing. Enable bloom if they should glow."), e.bloom.enabled && !r && e.bloom.threshold >= 1 && t.push("Bloom is on with threshold >= 1 but no layer has intensity > 1, so nothing glows.");
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/agent/alignChecks3d.ts
var n_ = 48, r_ = .08, i_ = .6, a_ = (e, t) => `(${e.toFixed(2)}, ${t.toFixed(2)})`, o_ = (e, t) => Math.hypot(e.x - t.x, e.z - t.z), s_ = .5;
function c_(e) {
	let t = {
		x: 0,
		z: 0,
		n: 0
	}, n = {
		x: 0,
		z: 0,
		n: 0
	};
	for (let r of e) for (let e of r) for (let r = 0; r < e.count; r++) {
		let i = r * 19;
		for (let r of e.data[i + 1] < s_ ? [t, n] : [t]) r.x += e.data[i], r.z += e.data[i + 2], r.n++;
	}
	let r = n.n >= .2 * t.n ? n : t;
	return r.n ? {
		x: r.x / r.n,
		z: r.z / r.n,
		ground: r === n
	} : null;
}
function l_(e, t) {
	let n = [];
	return e.layers.forEach((r, i) => {
		if (!r.subEmitterOf || r.subEvent !== "death") return;
		let a = e.layers.find((e) => e.id === r.subEmitterOf), o = t.find((e) => e[i]?.count);
		if (!a || !o || a.bursts.reduce((e, t) => e + t.count, 0) + a.rate * Math.min(e.duration, a.stopAfter || e.duration) > 2) return;
		let s = o[i], c = 0, l = 0;
		for (let e = 0; e < s.count; e++) c += s.data[e * 19], l += s.data[e * 19 + 2];
		n.push({
			layer: r.name,
			parent: a.name,
			x: c / s.count,
			z: l / s.count
		});
	}), n;
}
function u_(e, t, n) {
	let r = Array.from({ length: n_ }, (t, n) => Math.min(n / 47 * e.duration, e.duration - 1e-6)).map((t) => Ju(e, t, {})), i = c_(r);
	if (i) {
		let e = Math.hypot(i.x, i.z), r = Math.round(Math.atan2(i.x, i.z) * 180 / Math.PI);
		n.push(`Placement: the ${i.ground ? "ground-level " : ""}particles are centred at x,z ${a_(i.x, i.z)}, ${e.toFixed(2)} m from the origin${e > .3 ? ` toward ${r}° (0° = +Z forward, 90° = +X)` : ""}. Unity plays the effect around the prefab root (the origin).`), e > .8 && Math.abs(r) <= 25 ? n.push("The effect reaches forward along +Z: right for an effect cast from the character at the origin. If it is meant to land on a target instead, centre the impact on the origin.") : e > .8 && t.push(`The effect is centred ${e.toFixed(1)} m from the origin ${a_(i.x, i.z)}. In Unity it plays around the prefab root: put the hit / area centre on the origin, or, for an effect cast from the character, start at the origin and travel along +Z (0°), not ${r}°.`);
	}
	let a = e.layers.filter((e) => !e.empty && !e.subEmitterOf).map((t) => ({
		l: t,
		p: Hu(e, t).pos
	})), o = a.map((e) => a.filter((t) => o_(e.p, t.p) <= r_)).filter((e) => e.length >= 3).map((e) => ({
		p: e[0].p,
		names: e.map((e) => e.l.name)
	})), s = /* @__PURE__ */ new Set();
	for (let { l: e, p: n } of a) {
		if (s.has(e.name) || s.size >= 3) continue;
		let r = o.find((e) => o_(e.p, n) > r_ && o_(e.p, n) < i_);
		r && (s.add(e.name), t.push(`${e.name} ${a_(n.x, n.z)} is ${o_(r.p, n).toFixed(2)} m off the spot ${a_(r.p.x, r.p.z)} that ${r.names.slice(0, 3).join(", ")} share. If it belongs there, give it the same x,z (a near miss reads as crooked from other angles); if the offset is deliberate (layers spaced along a path, a part in front of the body), ignore this.`));
	}
	for (let { l: e, p: n } of a) e.renderMode === "horizontal" && n.y < .015 && n.y > -.5 && t.push(`${e.name} lies flat at y ${n.y.toFixed(2)}: on a real floor (and in Unity's verify scene) it disappears into the ground. Lift ground decals to y 0.02-0.05.`);
	let c = e.layers.filter((e) => !e.empty && !e.subEmitterOf && e.renderMode === "horizontal").map((t) => ({
		l: t,
		p: Hu(e, t).pos
	})), l = l_(e, r), u = /* @__PURE__ */ new Map();
	for (let e of l) u.has(e.parent) || u.set(e.parent, e);
	for (let e of u.values()) {
		let n = c.map((t) => ({
			...t,
			d: o_(t.p, e)
		})).sort((e, t) => e.d - t.d)[0];
		n && n.d > .25 && n.d < 4 && t.push(`${e.parent} ends (its death sub-emitters start) around ${a_(e.x, e.z)}, ${n.d.toFixed(2)} m from the ground decal ${n.l.name} ${a_(n.p.x, n.p.z)}. Move the decal (or aim the parent) so the impact lands on it.`);
	}
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/agent/analyze.ts
var d_ = 24;
function f_(e) {
	return Array.from({ length: d_ }, (t, n) => Math.min(n / 23 * e.duration, e.duration - 1e-6));
}
function p_(e) {
	let t = e.layers.map((e) => ({
		name: e.name,
		peak: 0,
		framesVisible: 0,
		outside: 0,
		total: 0
	}));
	for (let n of f_(e)) Wl(e, n, {}).forEach((n, r) => {
		let i = t[r];
		i.peak = Math.max(i.peak, n.count), n.count && i.framesVisible++;
		for (let t = 0; t < n.count; t++) {
			let r = n.data[t * 9], a = n.data[t * 9 + 1];
			i.total++, (r < 0 || a < 0 || r > e.width || a > e.height) && i.outside++;
		}
	});
	return t.map((e) => ({
		...e,
		outside: e.total ? e.outside / e.total : 0
	}));
}
function m_(e) {
	let t = e.layers.map((e) => ({
		name: e.name,
		peak: 0,
		framesVisible: 0,
		outside: 0
	})), n = 0;
	for (let r of f_(e)) Ju(e, r, {}).forEach((e, r) => {
		t[r].peak = Math.max(t[r].peak, e.count), e.count && t[r].framesVisible++;
		for (let t = 0; t < e.count; t++) {
			let r = t * 19;
			n = Math.max(n, Math.abs(e.data[r]), Math.abs(e.data[r + 1]), Math.abs(e.data[r + 2]));
		}
	});
	return {
		layers: t,
		extent: n
	};
}
function h_(e, t) {
	for (let n of e.layers) {
		if (n.empty) continue;
		let r = n.subEmitterOf ? e.layers.find((e) => e.id === n.subEmitterOf) : null;
		r && (n.subEvent === "collision" && !r.floor && t.push(`${n.name}: Collision sub-emitter, but ${r.name} has no floor collision, so it never fires.`), n.subEvent !== "birth" && !n.bursts.some((e) => e.count > 0) && t.push(`${n.name}: ${n.subEvent} sub-emitter without bursts emits nothing.`), n.subEvent === "birth" && n.rate <= 0 && t.push(`${n.name}: Birth sub-emitter with rate 0 emits nothing.`)), n.trails && n.trailWidth > .6 && t.push(`${n.name}: trail starts at ${n.trailWidth}x the particle size; the flat trail start reads as a cut-off front. Use <= 0.5 and a bigger soft head.`), n.rate * n.startLifetime.max > 3e3 && t.push(`${n.name}: about ${Math.round(n.rate * n.startLifetime.max)} live particles; heavy for games.`), n.startSize.max > 15 && t.push(`${n.name}: start size ${n.startSize.max} m is very large.`);
	}
}
function g_(e, t, n) {
	e.layers.forEach((r, i) => {
		t[i].outside > .08 && n.push(`${r.name}: ${Math.round(t[i].outside * 100)}% of particles are outside the ${e.width}x${e.height} canvas (cut off in exports).`), r.rate * r.lifetime.max > 3e3 && n.push(`${r.name}: about ${Math.round(r.rate * r.lifetime.max)} live particles; slow to render.`);
	});
}
function __(e) {
	let t = [], n = [], r, i = "";
	if (e_(e)) {
		let a = m_(e);
		r = a.layers, i = `Particles reach up to ${a.extent.toFixed(1)} m from the origin.`, a.extent > 25 && t.push(`Particles travel ${a.extent.toFixed(0)} m from the origin; most of the effect will be off screen.`), h_(e, t), t_(e, t, n), u_(e, t, n);
	} else r = p_(e), g_(e, r, t);
	if (e.layers.forEach((e, n) => {
		e.empty || (e.visible && r[n].framesVisible === 0 && t.push(`${e.name}: never shows a particle (check emission, lifetime, alpha, size).`), e.visible && r[n].peak >= e.maxParticles && t.push(`${e.name}: hits its Max Particles (${e.maxParticles}); raise it or emit less.`));
	}), e.loop === "once") {
		let n = (e_(e) ? Ju(e, e.duration - .001, {}) : Wl(e, e.duration - .001, {})).reduce((e, t) => e + t.count, 0);
		n > 0 && t.push(`${n} particle(s) are still alive at the end of the ${e.duration} s one-shot; they will be cut off. Lengthen duration or shorten lifetimes.`);
	}
	let a = r.map((e) => `- ${e.name}: peak ${e.peak} particles, visible in ${e.framesVisible}/${d_} samples`), o = t.length ? `Problems (${t.length}):\n${t.map((e) => `- ${e}`).join("\n")}` : "No problems found.", s = n.length ? `Notes:\n${n.map((e) => `- ${e}`).join("\n")}` : "";
	return [
		"Layers:",
		...a,
		i,
		o,
		s
	].filter(Boolean).join("\n");
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/textures/generators/types.ts
var v_ = (e = 1) => ({
	key: "seed",
	label: "随机种子",
	min: 0,
	max: 9999,
	step: 1,
	default: e
}), y_ = (e, t) => {
	let n = e * 2 - 1, r = t * 2 - 1;
	return {
		r: Math.hypot(n, r),
		a: Math.atan2(r, n)
	};
}, b_ = {
	id: "glow",
	label: "柔光",
	kind: "sprite",
	hint: "Round soft glow; hardness 0 = very soft falloff, 1 = nearly a disc; core adds a small hot centre.",
	params: [{
		key: "hardness",
		label: "硬度",
		min: 0,
		max: 1,
		step: .05,
		default: .3
	}, {
		key: "core",
		label: "核心亮度",
		min: 0,
		max: 1,
		step: .05,
		default: .4
	}],
	draw(e) {
		let t = 3.5 - 3 * e.hardness, n = If(256, 256);
		return Lf(n, 0, 0, 256, 256, (n, r) => {
			let { r: i } = y_(n, r);
			return Ff(Ff(1 - i) ** +t * (1 - e.core * .5) + e.core * Math.exp(-((i / .16) ** 2)));
		}), n;
	}
}, x_ = {
	id: "ring",
	label: "圆环",
	kind: "sprite",
	hint: "A ring of given radius and width; dashes > 0 splits it into segments (tech or rune rings, shockwave arcs).",
	params: [
		{
			key: "radius",
			label: "半径",
			min: .2,
			max: .95,
			step: .01,
			default: .75
		},
		{
			key: "width",
			label: "宽度",
			min: .01,
			max: .5,
			step: .01,
			default: .08
		},
		{
			key: "softness",
			label: "柔和",
			min: 0,
			max: 1,
			step: .05,
			default: .5
		},
		{
			key: "dashes",
			label: "分段数",
			min: 0,
			max: 48,
			step: 1,
			default: 0
		},
		{
			key: "gap",
			label: "段间空隙",
			min: .05,
			max: .9,
			step: .05,
			default: .35
		},
		{
			key: "inner",
			label: "内侧光晕",
			min: 0,
			max: 1,
			step: .05,
			default: .2
		}
	],
	draw(e) {
		let t = If(256, 256), n = 1 + e.softness * 3;
		return Lf(t, 0, 0, 256, 256, (t, r) => {
			let { r: i, a } = y_(t, r), o = Ff(1 - Math.abs(i - e.radius) / e.width) ** +n;
			if (e.dashes > 0) {
				let t = (a / (Math.PI * 2) * e.dashes + 10) % 1, n = .04;
				o *= Ff((t - e.gap / 2) / n) * Ff((1 - e.gap / 2 - t) / n);
			}
			let s = i < e.radius ? e.inner * (i / e.radius) ** 6 * .6 : 0;
			return Ff(o + s);
		}), t;
	}
}, S_ = {
	id: "star",
	label: "星芒",
	kind: "sprite",
	hint: "A glint with N thin rays and a soft centre (sparkles, hit flashes, lens glints).",
	params: [
		{
			key: "points",
			label: "光芒数",
			min: 2,
			max: 16,
			step: 1,
			default: 4
		},
		{
			key: "length",
			label: "长度",
			min: .3,
			max: 1,
			step: .05,
			default: 1
		},
		{
			key: "thinness",
			label: "粗细",
			min: .01,
			max: .3,
			step: .01,
			default: .06
		},
		{
			key: "glow",
			label: "中心光晕",
			min: 0,
			max: 1,
			step: .05,
			default: .5
		},
		{
			key: "rotation",
			label: "旋转°",
			min: 0,
			max: 180,
			step: 1,
			default: 0
		}
	],
	draw(e) {
		let t = If(256, 256), n = Math.round(e.points), r = e.rotation * Math.PI / 180;
		return Lf(t, 0, 0, 256, 256, (t, i) => {
			let { r: a, a: o } = y_(t, i), s = 0;
			for (let t = 0; t < n; t++) {
				let i = o - r - t * Math.PI * 2 / n;
				if (Math.cos(i) <= 0) continue;
				let c = a / e.length;
				if (c >= 1) continue;
				let l = a * Math.abs(Math.sin(i)), u = e.thinness * (1 - c) + .004;
				s = Math.max(s, Math.exp(-((l / u) ** 2)) * (1 - c) ** 1.5);
			}
			return Ff(s + e.glow * Math.exp(-((a / .22) ** 2)));
		}), t;
	}
};
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/textures/generators/strokes.ts
function C_(e, t, n, r) {
	let i = [
		[n * (1 + 4 * r), .15 * r],
		[n * (1 + 1.5 * r), .4],
		[n, 1]
	];
	for (let [n, r] of i) r <= 0 || (e.strokeStyle = `rgba(255,255,255,${r})`, e.lineWidth = n, e.beginPath(), t(), e.stroke());
}
function w_() {
	let e = If(256, 256), t = e.getContext("2d");
	return t.lineCap = "round", t.lineJoin = "round", [e, t];
}
var T_ = {
	id: "runes",
	label: "魔法阵",
	kind: "sprite",
	hint: "A magic circle: concentric rings, a band of random glyph marks and an inner star polygon. Use on horizontal billboards or a flat mesh ring.",
	params: [
		{
			key: "rings",
			label: "圆环数",
			min: 1,
			max: 3,
			step: 1,
			default: 2
		},
		{
			key: "glyphs",
			label: "符文数",
			min: 0,
			max: 40,
			step: 1,
			default: 16
		},
		{
			key: "starPoints",
			label: "内星角数",
			min: 0,
			max: 9,
			step: 1,
			default: 6,
			hint: "0 = 没有内部星形"
		},
		{
			key: "lineWidth",
			label: "线宽",
			min: 1,
			max: 6,
			step: .5,
			default: 2
		},
		{
			key: "glow",
			label: "发光",
			min: 0,
			max: 1,
			step: .05,
			default: .6
		},
		v_()
	],
	draw(e) {
		let [t, n] = w_(), r = Pf(e.seed * 131 + 7), i = 117.76, a = (e) => () => n.arc(128, 128, e, 0, Math.PI * 2), o = Math.round(e.rings);
		for (let t = 0; t < o; t++) C_(n, a(i * (1 - t * .09)), e.lineWidth, e.glow);
		let s = i * (1 - o * .09), c = s * .78;
		C_(n, a(c), e.lineWidth * .8, e.glow);
		let l = Math.round(e.glyphs);
		for (let t = 0; t < l; t++) {
			let i = t / l * Math.PI * 2, a = Math.PI * 2 / Math.max(l, 1) * .6, o = c + (s - c) * .2, u = s - (s - c) * .2, d = [];
			for (let e = 0; e < 3 + Math.floor(r() * 3); e++) {
				let e = i + (r() - .5) * a, t = o + r() * (u - o);
				d.push([128 + Math.cos(e) * t, 128 + Math.sin(e) * t]);
			}
			C_(n, () => d.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t)), e.lineWidth * .7, e.glow * .6);
		}
		let u = Math.round(e.starPoints);
		if (u >= 3) {
			let t = u % 2 ? 2 : u === 4 ? 1 : 2, r = [];
			for (let e = 0; e <= u; e++) {
				let n = e * t / u * Math.PI * 2 - Math.PI / 2;
				r.push([128 + Math.cos(n) * c, 128 + Math.sin(n) * c]);
			}
			if (C_(n, () => r.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t)), e.lineWidth * .8, e.glow), u % 2 == 0 && t === 2) {
				let t = r.map(([e, t]) => {
					let n = Math.atan2(t - 128, e - 128) + Math.PI / u * 2;
					return [128 + Math.cos(n) * c, 128 + Math.sin(n) * c];
				});
				C_(n, () => t.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t)), e.lineWidth * .8, e.glow);
			}
		}
		return t;
	}
}, E_ = {
	id: "crystal",
	label: "冰晶",
	kind: "sprite",
	hint: "A snowflake / frost crystal: N arms with side branches. Frost, snow, ice magic.",
	params: [
		{
			key: "arms",
			label: "臂数",
			min: 3,
			max: 12,
			step: 1,
			default: 6
		},
		{
			key: "branches",
			label: "分枝数",
			min: 0,
			max: 6,
			step: 1,
			default: 3
		},
		{
			key: "branchLength",
			label: "分枝长度",
			min: .1,
			max: .6,
			step: .05,
			default: .3
		},
		{
			key: "lineWidth",
			label: "线宽",
			min: 1,
			max: 8,
			step: .5,
			default: 3
		},
		{
			key: "glow",
			label: "发光",
			min: 0,
			max: 1,
			step: .05,
			default: .5
		},
		v_()
	],
	draw(e) {
		let [t, n] = w_(), r = Pf(e.seed * 977 + 3), i = 115.2, a = Math.round(e.arms), o = Array.from({ length: Math.round(e.branches) }, () => ({
			t: .25 + r() * .6,
			len: e.branchLength * (.5 + r() * .7)
		}));
		for (let t = 0; t < a; t++) {
			let r = t / a * Math.PI * 2 - Math.PI / 2, s = [Math.cos(r), Math.sin(r)];
			C_(n, () => (n.moveTo(128, 128), n.lineTo(128 + s[0] * i, 128 + s[1] * i)), e.lineWidth, e.glow);
			for (let t of o) {
				let a = 128 + s[0] * i * t.t, o = 128 + s[1] * i * t.t, c = i * t.len * (1 - t.t * .6);
				for (let t of [-1, 1]) {
					let i = r + Math.PI / 3.2 * t;
					C_(n, () => (n.moveTo(a, o), n.lineTo(a + Math.cos(i) * c, o + Math.sin(i) * c)), e.lineWidth * .7, e.glow * .7);
				}
			}
		}
		return t;
	}
}, D_ = {
	id: "shard",
	label: "碎片",
	kind: "sprite",
	hint: "An irregular angular chunk with lighter and darker facets (ice, glass, rock debris on billboards).",
	params: [
		{
			key: "corners",
			label: "角数",
			min: 3,
			max: 9,
			step: 1,
			default: 6
		},
		{
			key: "elongation",
			label: "拉长",
			min: 1,
			max: 3,
			step: .1,
			default: 1.6
		},
		{
			key: "facetContrast",
			label: "棱面明暗",
			min: 0,
			max: 1,
			step: .05,
			default: .5
		},
		v_()
	],
	draw(e) {
		let [t, n] = w_(), r = Pf(e.seed * 389 + 11), i = Math.round(e.corners), a = [];
		for (let t = 0; t < i; t++) {
			let n = t / i * Math.PI * 2 + (r() - .5) * (Math.PI / i), o = 107.52 * (.55 + r() * .45);
			a.push([128 + Math.cos(n) * o / e.elongation, 128 + Math.sin(n) * o]);
		}
		let o = [128 + (r() - .5) * 256 * .1, 128 + (r() - .5) * 256 * .1];
		for (let t = 0; t < i; t++) {
			let [s, c] = [a[t], a[(t + 1) % i]];
			n.fillStyle = `rgba(255,255,255,${(1 - e.facetContrast * .6 * r()).toFixed(3)})`, n.beginPath(), n.moveTo(...o), n.lineTo(...s), n.lineTo(...c), n.closePath(), n.fill();
		}
		return n.strokeStyle = "rgba(255,255,255,1)", n.lineWidth = 2, n.beginPath(), a.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t)), n.closePath(), n.stroke(), t;
	}
};
function O_(e, t, n, r, i) {
	if (i === 0) return [t, n];
	let a = Math.hypot(n[0] - t[0], n[1] - t[1]), o = -(n[1] - t[1]) / (a || 1), s = (n[0] - t[0]) / (a || 1), c = (e() - .5) * a * r, l = [(t[0] + n[0]) / 2 + o * c, (t[1] + n[1]) / 2 + s * c];
	return [...O_(e, t, l, r, i - 1).slice(0, -1), ...O_(e, l, n, r, i - 1)];
}
var k_ = {
	id: "lightning",
	label: "闪电",
	kind: "sprite",
	hint: "A jagged bolt from left to right (along U) with side branches. Use with stretched billboards or as a beam texture.",
	params: [
		{
			key: "jitter",
			label: "曲折",
			min: .1,
			max: 1,
			step: .05,
			default: .5
		},
		{
			key: "branches",
			label: "分支数",
			min: 0,
			max: 6,
			step: 1,
			default: 2
		},
		{
			key: "lineWidth",
			label: "线宽",
			min: 1,
			max: 8,
			step: .5,
			default: 2.5
		},
		{
			key: "glow",
			label: "发光",
			min: 0,
			max: 1,
			step: .05,
			default: .7
		},
		v_()
	],
	draw(e) {
		let [t, n] = w_(), r = Pf(e.seed * 613 + 5), i = O_(r, [7.68, 128], [248.32, 128], e.jitter, 6), a = (e) => () => e.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t));
		C_(n, a(i), e.lineWidth, e.glow);
		for (let t = 0; t < Math.round(e.branches); t++) {
			let t = i[Math.floor(i.length * (.2 + r() * .6))];
			C_(n, a(O_(r, t, [t[0] + 256 * (.15 + r() * .25), t[1] + (r() - .5) * 256 * .5], e.jitter, 4)), e.lineWidth * .6, e.glow * .7);
		}
		return t;
	}
};
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/engine/textures/generators/tiles.ts
function A_(e, t, n) {
	let r = (Math.imul(e, 73856093) ^ Math.imul(t, 19349663) ^ Math.imul(n + 1, 83492791)) >>> 0;
	r = Math.imul(r ^ r >>> 13, 1540483477) >>> 0;
	let i = (r & 65535) / 65536;
	return r = Math.imul(r ^ r >>> 15, 668265261) >>> 0, [i, (r & 65535) / 65536];
}
var j_ = {
	id: "noise",
	label: "分形噪声（可平铺）",
	kind: "tile",
	hint: "Tileable fractal noise; scale = blob count across, contrast sharpens it into wisps. Scrolling energy, smoke surfaces.",
	params: [
		{
			key: "scale",
			label: "尺度",
			min: 1,
			max: 16,
			step: 1,
			default: 4
		},
		{
			key: "octaves",
			label: "细节层数",
			min: 1,
			max: 6,
			step: 1,
			default: 4
		},
		{
			key: "contrast",
			label: "对比度",
			min: .5,
			max: 4,
			step: .1,
			default: 1.5
		},
		{
			key: "stretch",
			label: "横向拉伸",
			min: 1,
			max: 8,
			step: 1,
			default: 1,
			hint: "大于 1 时变成沿 U 方向的条纹"
		},
		v_()
	],
	draw(e) {
		let t = If(256, 256), n = Math.max(1, Math.round(e.scale / e.stretch)), r = Math.round(e.scale);
		return Lf(t, 0, 0, 256, 256, (t, i) => Ff((Nf(t, i, n, Math.round(e.octaves), Math.round(e.seed), r) - .5) * e.contrast + .5) ** 1.4), t;
	}
}, M_ = {
	id: "voronoi",
	label: "细胞 / 裂纹（可平铺）",
	kind: "tile",
	hint: "Tileable Voronoi: mode 0 = soft cells (scales, bubbles), mode 1 = thin glowing edges (cracks, energy webs, ice fractures).",
	params: [
		{
			key: "cells",
			label: "细胞数",
			min: 2,
			max: 16,
			step: 1,
			default: 6
		},
		{
			key: "mode",
			label: "模式",
			min: 0,
			max: 1,
			step: 1,
			default: 1,
			hint: "0 = 细胞，1 = 裂纹"
		},
		{
			key: "edge",
			label: "边缘宽度",
			min: .01,
			max: .3,
			step: .01,
			default: .06
		},
		{
			key: "warp",
			label: "扭曲",
			min: 0,
			max: 1,
			step: .05,
			default: .2
		},
		v_()
	],
	draw(e) {
		let t = If(256, 256), n = Math.round(e.cells), r = Math.round(e.seed);
		return Lf(t, 0, 0, 256, 256, (t, i) => {
			let a = t + (Mf(t * 4, i * 4, 4, 4, r + 3) - .5) * e.warp / n, o = i + (Mf(t * 4 + 9, i * 4, 4, 4, r + 4) - .5) * e.warp / n, s = a * n, c = o * n, l = Math.floor(s), u = Math.floor(c), d = 9, f = 9;
			for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) {
				let i = l + t, a = u + e, [o, p] = A_((i % n + n) % n, (a % n + n) % n, r), m = Math.hypot(i + o - s, a + p - c);
				m < d ? (f = d, d = m) : m < f && (f = m);
			}
			return e.mode < .5 ? Ff(1 - d * 1.2) ** 1.5 : Ff(1 - (f - d) / (e.edge * 4));
		}), t;
	}
}, N_ = {
	id: "streaks",
	label: "流光条纹（可平铺）",
	kind: "tile",
	hint: "Long soft streaks running along U. Scroll along X on rings, beams and trails for flowing energy.",
	params: [
		{
			key: "lines",
			label: "条纹数",
			min: 2,
			max: 24,
			step: 1,
			default: 8
		},
		{
			key: "length",
			label: "长度",
			min: 1,
			max: 6,
			step: 1,
			default: 2,
			hint: "每条在 U 方向上的重复次数，越小越长"
		},
		{
			key: "softness",
			label: "柔和",
			min: 0,
			max: 1,
			step: .05,
			default: .5
		},
		{
			key: "fadeV",
			label: "上下渐隐",
			min: 0,
			max: .5,
			step: .05,
			default: 0,
			hint: "在 V 方向两端淡出：用在圆筒网格（龙卷风、光柱）上时没有硬边"
		},
		v_()
	],
	draw(e) {
		let t = If(256, 256), n = Math.round(e.seed);
		return Lf(t, 0, 0, 256, 256, (t, r) => {
			let i = Nf(t, r, Math.round(e.length), 3, n, Math.round(e.lines)), a = .55 - e.softness * .2, o = e.fadeV > 0 ? Ff(Math.min(r, 1 - r) / e.fadeV) : 1;
			return Ff((i - a) / (.25 + e.softness * .25)) ** 2 * o * o * (3 - 2 * o);
		}), t;
	}
}, P_ = {
	id: "trail",
	label: "拖尾",
	kind: "sprite",
	hint: "Trail / beam texture along U: head fade at U=0, soft edges across V, optional noisy strands.",
	params: [
		{
			key: "head",
			label: "头部渐显",
			min: 0,
			max: .5,
			step: .01,
			default: .12
		},
		{
			key: "tail",
			label: "尾部衰减",
			min: 0,
			max: 3,
			step: .1,
			default: 1
		},
		{
			key: "width",
			label: "宽度",
			min: .1,
			max: 1,
			step: .05,
			default: .6
		},
		{
			key: "strands",
			label: "丝状细节",
			min: 0,
			max: 1,
			step: .05,
			default: .4
		},
		v_()
	],
	draw(e) {
		let t = If(256, 128), n = Math.round(e.seed);
		return Lf(t, 0, 0, 256, 128, (t, r) => {
			let i = Math.exp(-(((r - .5) / (e.width * .4)) ** 2)), a = e.head > 0 ? Ff(t / e.head) : 1, o = (1 - t) ** e.tail, s = 1 - e.strands + e.strands * Nf(t, r, 2, 3, n, 10) * 1.6;
			return Ff(i * a * o * s);
		}), t;
	}
}, F_ = {
	smoke: "Billowing smoke puff that grows and thins out over the sheet.",
	fire: "Flame tongue flickering upward, loops over the sheet.",
	electric: "Crackling electric arcs, a new arc every frame (lightning, shock, sparks).",
	energy: "Pulsing energy ring with a bright core (orbs, portals, charge-ups)."
}, I_ = {
	smoke: "烟（序列帧）",
	fire: "火（序列帧）",
	electric: "电弧（序列帧）",
	energy: "能量环（序列帧）"
};
function L_(e) {
	return {
		id: `flipbook_${e}`,
		label: I_[e],
		kind: "flipbook",
		hint: `${F_[e]} Use with sheet.enabled and sheet.asset.`,
		params: [
			{
				key: "tiles",
				label: "网格（N×N）",
				min: 2,
				max: 8,
				step: 1,
				default: 4,
				hint: "帧数 = N×N，帧越多动作越顺"
			},
			{
				key: "frameSize",
				label: "每帧像素",
				min: 32,
				max: 128,
				step: 32,
				default: 64
			},
			v_(0)
		],
		draw: (t) => Wf(e, Math.round(t.tiles), Math.round(t.seed), Math.round(t.frameSize)),
		grid: (e) => [Math.round(e.tiles), Math.round(e.tiles)]
	};
}
var R_ = [
	"smoke",
	"fire",
	"electric",
	"energy"
].map(L_), z_ = (e, t, n) => {
	let r = Ff((n - e) / (t - e || 1e-6));
	return r * r * (3 - 2 * r);
}, B_ = {
	id: "arc",
	label: "刀光弧（环形网格）",
	kind: "tile",
	hint: "Sword-swing arcs for the ring mesh (meshAlign local): U goes around the ring, the head is bright and the tail thins out; scroll material.scrollX to swing it (negative = head leads counter-clockwise). arcs = how many arcs around the ring.",
	params: [
		{
			key: "arcs",
			label: "弧数",
			min: 1,
			max: 6,
			step: 1,
			default: 1
		},
		{
			key: "length",
			label: "弧长",
			min: .1,
			max: 1,
			step: .05,
			default: .45,
			hint: "每段弧占一圈的比例"
		},
		{
			key: "edge",
			label: "刃口亮线",
			min: 0,
			max: 1,
			step: .05,
			default: .8
		},
		{
			key: "thickness",
			label: "厚度",
			min: .2,
			max: 1,
			step: .05,
			default: .75
		},
		{
			key: "streaks",
			label: "条纹",
			min: 0,
			max: 1,
			step: .05,
			default: .35
		},
		v_()
	],
	draw(e) {
		let t = If(512, 64), n = Math.round(e.arcs);
		return Lf(t, 0, 0, 512, 64, (t, r) => {
			let i = 1 - r, a = t * n % 1;
			if (a > e.length) return 0;
			let o = a / e.length, s = 1 - z_(.9, 1, o), c = 1 - e.thickness * (.35 + .65 * o), l = z_(c, c + .25, i) * (1 - z_(.93, 1, i)), u = o ** 1.6 * s, d = Math.exp(-(((i - .88) / .045) ** 2)) * o ** .8 * s * e.edge, f = 1 - e.streaks + e.streaks * Nf(t, i, 3, 3, Math.round(e.seed), 12) * 1.5;
			return Ff(l * u * .85 * f + d);
		}), t;
	}
}, V_ = [
	b_,
	x_,
	S_,
	T_,
	E_,
	D_,
	k_,
	P_,
	{
		id: "cross",
		label: "十字（治疗）",
		kind: "sprite",
		hint: "A rounded plus sign with a soft glow: healing, revive, holy marks.",
		params: [
			{
				key: "arm",
				label: "臂长",
				min: .3,
				max: .9,
				step: .05,
				default: .7
			},
			{
				key: "width",
				label: "臂宽",
				min: .08,
				max: .4,
				step: .01,
				default: .2
			},
			{
				key: "glow",
				label: "光晕",
				min: 0,
				max: 1,
				step: .05,
				default: .6
			}
		],
		draw(e) {
			let t = If(256, 256), n = (e, t, n, r) => {
				let i = Math.abs(e) - n, a = Math.abs(t) - r;
				return Math.hypot(Math.max(i, 0), Math.max(a, 0)) + Math.min(Math.max(i, a), 0);
			}, r = e.width * .35;
			return Lf(t, 0, 0, 256, 256, (t, i) => {
				let a = t * 2 - 1, o = i * 2 - 1, s = Math.min(n(a, o, e.arm - r, e.width - r), n(a, o, e.width - r, e.arm - r)) - r;
				return Ff(1 - z_(-.02, .02, s) + e.glow * Math.exp(-Math.max(s, 0) / .12) * .7);
			}), t;
		}
	},
	{
		id: "cracks",
		label: "地面裂痕",
		kind: "sprite",
		hint: "Radial ground cracks from the centre with jagged branches: ground slams, meteor impacts, earth skills. Use on a horizontal billboard; tint it like lava or glowing energy.",
		params: [
			{
				key: "cracks",
				label: "主裂缝数",
				min: 3,
				max: 14,
				step: 1,
				default: 8
			},
			{
				key: "jagged",
				label: "曲折",
				min: 0,
				max: 1,
				step: .05,
				default: .55
			},
			{
				key: "branches",
				label: "分叉",
				min: 0,
				max: 4,
				step: 1,
				default: 2
			},
			{
				key: "lineWidth",
				label: "线宽",
				min: 1,
				max: 8,
				step: .5,
				default: 3.5
			},
			{
				key: "glow",
				label: "发光",
				min: 0,
				max: 1,
				step: .05,
				default: .7
			},
			{
				key: "core",
				label: "中心坑",
				min: 0,
				max: 1,
				step: .05,
				default: .5
			},
			v_()
		],
		draw(e) {
			let t = If(256, 256), n = t.getContext("2d");
			n.lineCap = "round", n.lineJoin = "round";
			let r = Pf(e.seed * 541 + 17), i = (t, a, o, s, c, l) => {
				let u = [[t, a]];
				for (let n = 0; n < 9; n++) o += (r() - .5) * e.jagged * 1.4, t += Math.cos(o) * s / 9, a += Math.sin(o) * s / 9, u.push([t, a]);
				for (let t = 0; t < 3; t++) {
					let r = u.slice(t * 3, t * 3 + 4);
					C_(n, () => r.forEach(([e, t], r) => r ? n.lineTo(e, t) : n.moveTo(e, t)), Math.max(.6, c * (1 - t * .3)), e.glow);
				}
				if (l > 0) for (let t = 0; t < Math.round(e.branches); t++) {
					let [e, t] = u[2 + Math.floor(r() * (u.length - 4))];
					i(e, t, o + (r() < .5 ? -1 : 1) * (.5 + r() * .6), s * (.3 + r() * .25), c * .6, l - 1);
				}
			}, a = Math.round(e.cracks);
			for (let t = 0; t < a; t++) {
				let n = t / a * Math.PI * 2 + (r() - .5) * .5, o = 15.36;
				i(128 + Math.cos(n) * o, 128 + Math.sin(n) * o, n, 256 * (.3 + r() * .15), e.lineWidth, 1);
			}
			if (e.core > 0) {
				let t = n.createRadialGradient(128, 128, 0, 128, 128, 35.84);
				t.addColorStop(0, `rgba(255,255,255,${e.core})`), t.addColorStop(1, "rgba(255,255,255,0)"), n.fillStyle = t, n.fillRect(0, 0, 256, 256);
			}
			return t;
		}
	},
	{
		id: "swirl",
		label: "漩涡",
		kind: "sprite",
		hint: "Spiral arms around the centre: portals, blink / teleport, vortex, stun swirls. Spin the particle for motion.",
		params: [
			{
				key: "arms",
				label: "旋臂",
				min: 1,
				max: 8,
				step: 1,
				default: 3
			},
			{
				key: "twist",
				label: "扭曲",
				min: 0,
				max: 3,
				step: .1,
				default: 1.2
			},
			{
				key: "sharpness",
				label: "锐度",
				min: .5,
				max: 6,
				step: .25,
				default: 2.5
			},
			{
				key: "hole",
				label: "中心空洞",
				min: 0,
				max: .6,
				step: .05,
				default: .15
			}
		],
		draw(e) {
			let t = If(256, 256);
			return Lf(t, 0, 0, 256, 256, (t, n) => {
				let r = t * 2 - 1, i = n * 2 - 1, a = Math.hypot(r, i);
				if (a >= 1) return 0;
				let o = Math.atan2(i, r), s = .5 + .5 * Math.cos(Math.round(e.arms) * o + e.twist * Math.PI * 2 * a), c = z_(e.hole, e.hole + .2, a) * (1 - z_(.6, 1, a));
				return Ff(s ** +e.sharpness * c * 1.2);
			}), t;
		}
	},
	j_,
	M_,
	N_,
	B_,
	...R_
], H_ = (e) => V_.find((t) => t.id === e);
function U_(e, t) {
	let n = t ?? {}, r = {};
	for (let t of e.params) {
		let e = typeof n[t.key] == "number" && Number.isFinite(n[t.key]) ? n[t.key] : t.default, i = Math.min(t.max, Math.max(t.min, e));
		r[t.key] = t.step >= 1 ? Math.round(i) : Number((Math.round(i / t.step) * t.step).toFixed(6));
	}
	return r;
}
function W_(e, t) {
	let n = H_(e);
	if (!n) throw Error(`Unknown generator "${e}". Available: ${V_.map((e) => e.id).join(", ")}.`);
	let r = U_(n, t), [i, a] = n.grid ? n.grid(r) : [1, 1];
	return {
		canvas: n.draw(r),
		kind: n.kind,
		tilesX: i,
		tilesY: a,
		params: r
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/upstream/src/meshes/types.ts
var G_ = (e, t, n) => typeof e == "string" ? e.slice(0, n) : t;
function K_(e) {
	let t = e ?? {};
	if (typeof t.id != "string" || !Yu.test(t.id)) return null;
	let n;
	try {
		n = ng(t.source);
	} catch {
		return null;
	}
	let r = (e) => typeof e == "number" && Number.isFinite(e) ? e : Date.now();
	return {
		id: t.id,
		name: G_(t.name, t.id, 60).trim() || t.id,
		description: G_(t.description, "", 400),
		source: n,
		createdAt: r(t.createdAt),
		updatedAt: r(t.updatedAt)
	};
}
// ../../../../AppData/Local/Temp/mm-effect-upstream-p1zpe9ea/skill/assets/browser/entry.ts
var q_ = [], J_ = document.createElement("canvas"), Y_ = document.createElement("canvas"), X_ = new am(), Z_, Q_ = {
	width: 960,
	height: 540,
	view: {
		position: [
			4.6,
			4.8,
			10.3
		],
		target: [
			0,
			1.8,
			0
		],
		fov: 40
	}
};
function $_(e, t, n = "") {
	return typeof e != "object" || !e ? Object.is(e, t) ? [] : [n] : !t || typeof t != "object" || Array.isArray(e) !== Array.isArray(t) || Array.isArray(e) && e.length !== t.length ? [n] : Object.keys(e).flatMap((r) => r in t ? $_(e[r], t[r], `${n}/${r}`) : [`${n}/${r}`]);
}
function ev(e) {
	let t = e?.format === "fxforge-preset";
	if (e?.format && (!t || e.version !== 1)) throw Error("Expected fxforge-preset version 1");
	let { assets: n, shaders: r, meshes: i, ...a } = e ?? {}, o = t ? e.effect : a;
	if (!o || !Array.isArray(o.layers) || o.layers.length === 0) throw Error("Effect must contain layers");
	let s = o.space === "3d" ? Nm(o) : Wd(o), c = $_(o, s, "effect");
	if (c.length) throw Error(`Sanitizer would change supplied values: ${c.join(", ")}`);
	let l = (n ?? []).map((e) => {
		let t = jd(e);
		if (!t || $_(e, t).length) throw Error(`Invalid asset ${e?.id}`);
		if (!t.dataUrl.startsWith("data:image/png;base64,")) throw Error(`Only embedded PNG assets are accepted ${t.id}`);
		return t;
	}), u = (r ?? []).map((e) => {
		let t = um(e);
		if (!t || $_(e, t).length) throw Error(`Invalid shader ${e?.id}`);
		let n = Im(t.code);
		if (!n.ok) throw Error(`${t.id}: ${n.errors.join("; ")}`);
		return t;
	}), d = (i ?? []).map((e) => {
		let t = K_(e);
		if (!t || $_(e, t).length) throw Error("Invalid mesh " + e?.id);
		return t;
	});
	for (let [e, t] of [
		["layers", s.layers],
		["assets", l],
		["shaders", u],
		["meshes", d]
	]) if (new Set(t.map((e) => e.id)).size !== t.length) throw Error(`Duplicate IDs in ${e}`);
	let f = new Set(l.map((e) => e.id)), p = new Set(u.map((e) => e.id)), m = new Set(d.map((e) => e.id));
	for (let e of s.layers) {
		if (e.mesh && Xu(e.mesh) && !m.has(e.mesh)) throw Error("Missing mesh " + e.mesh + " in " + e.id);
		for (let t of [
			e.material?.texture,
			e.material?.dissolveTexture,
			e.sheet?.asset,
			e.trailTexture,
			e.texture
		]) if (t?.startsWith("a_") && !f.has(t)) throw Error(`Missing asset ${t} in ${e.id}`);
		if (e.material?.shader && !p.has(e.material.shader)) throw Error(`Missing shader ${e.material.shader} in ${e.id}`);
		for (let t of [e.parentId, e.subEmitterOf]) if (t && !s.layers.some((e) => e.id === t)) throw Error(`Missing layer ${t} in ${e.id}`);
		let t = /* @__PURE__ */ new Set(), n = e;
		for (; n;) {
			if (t.has(n.id)) throw Error(`Hierarchy cycle at ${n.id}`);
			t.add(n.id), n = s.layers.find((e) => e.id === (n.subEmitterOf || n.parentId));
		}
	}
	return {
		format: "fxforge-preset",
		version: 1,
		title: e.title ?? s.name,
		category: e.category ?? "原创特效",
		tags: e.tags ?? [],
		effect: s,
		thumb: e.thumb ?? "",
		assets: l,
		shaders: u,
		...d.length ? { meshes: d } : {}
	};
}
async function tv(e) {
	let t = q_[e];
	if (!t) throw Error(`Unknown bundle ${e}`);
	for (let e of t.assets) await kg.register(e);
	for (let e of t.shaders) Ag.register(e);
	for (let e of t.meshes ?? []) Mg.register(e);
	return t;
}
function nv(e, t) {
	if (e.space === "3d") return Z_ ??= new Yp(J_), Z_.renderer.setPixelRatio(1), Z_.setSize(Q_.width, Q_.height), Z_.controls.enableDamping = !1, Z_.setView(Q_.view), Z_.camera.fov = Q_.view.fov ?? 40, Z_.camera.updateProjectionMatrix(), Z_.stage.grid.visible = !1, Z_.render(e, t, null), J_;
	Y_.width = Q_.width, Y_.height = Q_.height;
	let n = Y_.getContext("2d");
	n.fillStyle = e.background, n.fillRect(0, 0, Y_.width, Y_.height);
	let r = X_.render(e, t, 1), i = Math.min(Y_.width / e.width, Y_.height / e.height), a = e.width * i, o = e.height * i;
	return n.drawImage(r.canvas, (Y_.width - a) / 2, (Y_.height - o) / 2, a, o), Y_;
}
function rv(e) {
	let t = "";
	for (let n = 0; n < e.length; n += 32768) t += String.fromCharCode(...e.subarray(n, n + 32768));
	return btoa(t);
}
window.effectApi = {
	configure(e) {
		Q_ = {
			...Q_,
			...e
		};
	},
	textureStats() {
		let e = kf(), t = e.getContext("2d"), n = (n, r) => t.getImageData(Math.floor(n * (e.width - 1)), Math.floor(r * (e.height - 1)), 1, 1).data[3];
		return { trail: {
			head: n(0, .5),
			middle: n(.5, .5),
			tail: n(.95, .5),
			edge: n(.5, 0)
		} };
	},
	defaults(e = "3d", t = "New Effect") {
		return {
			format: "fxforge-preset",
			version: 1,
			title: t,
			category: "原创特效",
			tags: [],
			effect: e === "3d" ? Dm({ name: t }) : Id({ name: t }),
			thumb: "",
			assets: [],
			shaders: []
		};
	},
	schema() {
		return {
			emitter3d: Tm(),
			effect3d: Dm(),
			emitter2d: Fd(),
			effect2d: Id(),
			generators: V_.map(({ draw: e, grid: t, ...n }) => n)
		};
	},
	async load(e) {
		let t = ev(e);
		q_.push(t);
		let n = q_.length - 1;
		return await tv(n), {
			index: n,
			bundle: t,
			analysis: __(t.effect),
			shaderCount: t.shaders.length
		};
	},
	async frame(e, t) {
		return nv((await tv(e)).effect, t).toDataURL("image/png");
	},
	async compare(e, t, n) {
		let r = document.createElement("canvas");
		r.width = Q_.width * 2, r.height = Q_.height + 40;
		let i = r.getContext("2d");
		i.fillStyle = "#eee9df", i.fillRect(0, 0, r.width, r.height);
		for (let [r, a] of [e, t].entries()) {
			let e = await tv(a);
			i.drawImage(nv(e.effect, n), r * Q_.width, 40), i.fillStyle = "#292c2c", i.font = "18px \"Microsoft YaHei\", sans-serif", i.fillText(`${r === 0 ? "Before / 原版" : "After / 新版"}   ${n.toFixed(2)} s`, r * Q_.width + 14, 27);
		}
		return r.toDataURL("image/png");
	},
	async contact(e, t) {
		let n = await tv(e), r = document.createElement("canvas"), i = Math.min(4, t.length);
		r.width = i * 320, r.height = Math.ceil(t.length / i) * 202;
		let a = r.getContext("2d");
		a.fillStyle = n.effect.background, a.fillRect(0, 0, r.width, r.height);
		for (let [e, r] of t.entries()) {
			let t = e % i * 320, o = Math.floor(e / i) * 202;
			a.drawImage(nv(n.effect, r), t, o + 22, 320, 180), a.fillStyle = "#888888", a.font = "15px sans-serif", a.fillText(`${r.toFixed(3)} s`, t + 8, o + 17);
		}
		return r.toDataURL("image/png");
	},
	async unity(e) {
		let t = await tv(e);
		if (t.effect.space !== "3d") throw Error("Unity ParticleSystem export requires a 3D effect");
		let n = {
			effect: t.effect,
			assets: t.assets.map((e) => ({
				id: e.id,
				dataUrl: e.dataUrl
			})),
			shaders: t.shaders.map((e) => ({
				id: e.id,
				code: e.code
			})),
			...t.meshes ? { meshes: t.meshes.map((e) => ({
				id: e.id,
				source: e.source
			})) } : {}
		}, r = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(n))), i = `FXForge/Variants/fx_${[...new Uint8Array(r)].map((e) => e.toString(16).padStart(2, "0")).join("").slice(0, 20)}`, a = await qg(t.effect), o = {};
		for (let [e, t] of Object.entries(a)) {
			let n = e === "FXForge/README.txt" || /^FXForge\/(Effects|Textures|Meshes)\//.test(e) ? e.replace("FXForge/", i + "/") : e;
			o[n] = e === "FXForge/README.txt" ? new TextEncoder().encode(new TextDecoder().decode(t).replaceAll("FXForge/Effects/", i + "/Effects/").replaceAll("FXForge/Materials", i + "/Materials").replaceAll("FXForge/Textures", i + "/Textures").replaceAll("FXForge/Meshes", i + "/Meshes")) : t;
		}
		return {
			scope: i,
			zip: rv(qh(o)),
			files: Object.fromEntries(Object.entries(o).map(([e, t]) => [e, rv(t)]))
		};
	},
	generate(e, t, n, r) {
		let i = W_(e, t), a = {
			id: r,
			name: n,
			kind: i.kind,
			tilesX: i.tilesX,
			tilesY: i.tilesY,
			width: i.canvas.width,
			height: i.canvas.height,
			dataUrl: i.canvas.toDataURL("image/png"),
			source: {
				type: "procedural",
				generator: e,
				params: i.params
			},
			createdAt: Date.now()
		};
		if (!jd(a)) throw Error("Invalid generated asset ID");
		return a;
	}
}, window.effectReady = !0;
