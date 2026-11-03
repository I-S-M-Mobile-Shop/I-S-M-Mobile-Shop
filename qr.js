/* Minimal QR Code encoder (byte mode, error correction M, versions 1-10).
   Runs fully in the browser. Exposes window.makeQR(text) -> boolean[][] (true = dark). */
(function (root) {
  "use strict";
  var ECC = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26];   // EC codewords per block, level M
  var BLK = [1, 1, 2, 2, 4, 4, 4, 4, 5, 5];             // number of blocks, level M

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) {
      var n = Math.floor(v / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (v >= 7) r -= 36;
    }
    return r;
  }
  function mul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rs(data, deg) {
    var div = new Array(deg).fill(0), root = 1, i, j;
    div[deg - 1] = 1;
    for (i = 0; i < deg; i++) {
      for (j = 0; j < deg; j++) { div[j] = mul(div[j], root); if (j + 1 < deg) div[j] ^= div[j + 1]; }
      root = mul(root, 2);
    }
    var res = new Array(deg).fill(0);
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, k) { res[k] ^= mul(c, f); });
    });
    return res;
  }

  function makeQR(text) {
    var data = Array.from(new TextEncoder().encode(text)), ver, cap, cc;
    for (ver = 1; ver <= 10; ver++) {
      cap = Math.floor(rawModules(ver) / 8) - ECC[ver - 1] * BLK[ver - 1];
      cc = ver < 10 ? 8 : 16;
      if (4 + cc + data.length * 8 <= cap * 8) break;
    }
    if (ver > 10) throw new Error("Text too long for QR");

    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(data.length, cc); data.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < cap * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
    var cw = [];
    for (var i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(""), 2));

    // Split into blocks, add error correction, interleave
    var nb = BLK[ver - 1], el = ECC[ver - 1], raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), blocks = [], k = 0;
    for (i = 0; i < nb; i++) {
      var d = cw.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
      var e = rs(d, el);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(e));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++)
      blocks.forEach(function (b, j) { if (i !== shortLen - el || j >= nShort) all.push(b[i]); });

    // Function patterns
    var size = ver * 4 + 17, m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, v) { m[y][x] = v; fn[y][x] = true; }
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = [];
    if (ver > 1) {
      var na = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
      pos = [6];
      for (var p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
    }
    pos.forEach(function (a, ai) {
      pos.forEach(function (b, bi) {
        if ((ai === 0 && bi === 0) || (ai === 0 && bi === pos.length - 1) || (ai === pos.length - 1 && bi === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++)
          set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      });
    });
    function format(mask) {
      var dat = (0 << 3) | mask, rem = dat, j;                 // level M = 00
      for (j = 0; j < 10; j++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var f = ((dat << 10) | rem) ^ 0x5412;
      function bit(n) { return ((f >>> n) & 1) !== 0; }
      for (j = 0; j <= 5; j++) set(8, j, bit(j));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (j = 9; j < 15; j++) set(14 - j, 8, bit(j));
      for (j = 0; j < 8; j++) set(size - 1 - j, 8, bit(j));
      for (j = 8; j < 15; j++) set(8, size - 15 + j, bit(j));
      set(8, size - 8, true);
    }
    format(0);
    if (ver >= 7) {
      var r = ver, j;
      for (j = 0; j < 12; j++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      var vb = (ver << 12) | r;
      for (j = 0; j < 18; j++) {
        var c = ((vb >>> j) & 1) !== 0, a = size - 11 + (j % 3), b = Math.floor(j / 3);
        set(a, b, c); set(b, a, c);
      }
    }

    // Place data bits in zigzag order
    var n = 0, right, vert, jj;
    for (right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (vert = 0; vert < size; vert++) for (jj = 0; jj < 2; jj++) {
        var x = right - jj, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && n < all.length * 8) { m[y][x] = ((all[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
      }
    }

    // Choose the best mask
    var masks = [
      function (x, y) { return (x + y) % 2 === 0; },
      function (x, y) { return y % 2 === 0; },
      function (x, y) { return x % 3 === 0; },
      function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return ((x * y) % 2) + ((x * y) % 3) === 0; },
      function (x, y) { return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; },
      function (x, y) { return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; }
    ];
    function apply(mi) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++)
        if (!fn[y][x] && masks[mi](x, y)) m[y][x] = !m[y][x];
    }
    function penalty() {
      var s = 0, x, y, run, dark = 0;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        run = 1;
        for (x = 1; x < size; x++) {
          var cur = pass ? m[x][y] : m[y][x], prev = pass ? m[x - 1][y] : m[y][x - 1];
          if (cur === prev) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1;
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) s += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
      return s + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    }
    var best = 0, bestP = Infinity;
    for (var mi = 0; mi < 8; mi++) {
      apply(mi); format(mi);
      var pen = penalty();
      if (pen < bestP) { bestP = pen; best = mi; }
      apply(mi);
    }
    apply(best); format(best);
    return m;
  }
  root.makeQR = makeQR;
})(window);
