// 扶養控除いくら？の問題を作る（ブラウザと node の両方で使う）。
// 中身は、国税庁タックスアンサー No.1180「扶養控除」・No.1177「特定親族特別控除」と、タックスアンサーの用語集（扶養親族・特定扶養親族・老人扶養親族・同居老親等）に書いてあることだけ（［令和8年4月1日現在法令等］と、令和8年分から使う改正の注記。2026-11-17 に読んだ。要点は共有フォルダ games/fuyo-ikura-research.md）。
// 1問は、生計を一にする家族の年齢（12月31日）・同居かどうか・合計所得金額を読んで、扶養控除か特定親族特別控除の額を選ぶ。正解したら2段目「どの決まり？」を選ぶ。
// 答えはコードで計算する：事業専従者として給与を受けた・16歳未満 → 0円。合計所得金額62万円以下なら扶養控除：19歳以上23歳未満は63万円・70歳以上は48万円（自分か配偶者の直系尊属で同居なら58万円）・ほかは38万円。
//   62万円を超えると扶養控除は受けられないが、19歳以上23歳未満で123万円以下なら特定親族特別控除（No.1177 の表）。
// 金額は令和8年分の決まり（所得の境目 62万円）。税額・障害者控除・非居住者・給与収入から所得への計算・申告の手続きは扱わない（画面に書く）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。
// KINDS の並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const AS_OF = "令和8年4月1日現在法令等（令和8年分の改正の注記を含む）";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    a: ["国税庁 タックスアンサー No.1180 扶養控除", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm"],
    b: ["国税庁 タックスアンサー No.1177 特定親族特別控除", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1177.htm"],
    c: ["国税庁 タックスアンサー 用語集（扶養親族・特定扶養親族・老人扶養親族・同居老親等）", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/yogo/senmon.htm"],
  };
  const MEDIA = { a: "令和8年分・12月31日の年齢" };
  const MAN = 10000;
  // 特定親族特別控除：[合計所得金額の上限, 控除額]（No.1177）
  const TOKU = [[850000, 630000], [900000, 610000], [950000, 510000], [1000000, 410000], [1050000, 310000], [1100000, 210000], [1150000, 110000], [1200000, 60000], [1230000, 30000]];
  function deductOf(age, W, chok, dou, bad) {
    if (bad || age < 16) return 0;
    if (W <= 620000) return age >= 19 && age < 23 ? 630000 : age >= 70 ? (chok && dou ? 580000 : 480000) : 380000;
    if (age >= 19 && age < 23 && W <= 1230000) return TOKU.find((r) => W <= r[0])[1];
    return 0;
  }
  function grpOf(age, W, chok, dou, bad) {
    if (deductOf(age, W, chok, dou, bad) === 0) return "none";
    if (W > 620000) return "toku";
    return age >= 19 && age < 23 ? "tokutei" : age >= 70 ? "rojin" : "ippan";
  }

  // 2段目「どの決まり？」
  const GROUPS = {
    ippan: { name: "一般の扶養親族", sub: "16歳以上・38万円", set: "all" },
    tokutei: { name: "特定扶養親族", sub: "19歳以上23歳未満・63万円", set: "all" },
    rojin: { name: "老人扶養親族", sub: "70歳以上・48万円（同居の親など58万円）", set: "all" },
    toku: { name: "特定親族特別控除", sub: "19歳以上23歳未満で所得62万円超", set: "all" },
    none: { name: "受けられない", sub: "16歳未満・所得が多い・事業専従者", set: "all" },
  };
  const GRP_WHY = {
    ippan: "生計を一にする親族で、12月31日に16歳以上・合計所得金額62万円以下なら扶養控除38万円です。",
    tokutei: "12月31日に19歳以上23歳未満の扶養親族は特定扶養親族で、扶養控除は63万円です。",
    rojin: "12月31日に70歳以上は老人扶養親族で48万円です。自分か配偶者の親・祖父母と同居なら58万円です。",
    toku: "19歳以上23歳未満で合計所得金額が62万円を超え123万円以下なら、特定親族特別控除です。所得が増えると減ります。",
    none: "16歳未満・合計所得金額が多い（62万円超、19〜22歳は123万円超）・事業専従者として給与を受けたときは受けられません。",
  };
  const KEY = {
    ippan: "16歳以上・所得62万円以下は38万円",
    tokutei: "19歳以上23歳未満は63万円",
    rojin: "70歳以上は48万円、同居の親・祖父母は58万円",
    toku: "19〜22歳で所得62万円超123万円以下は表で決まる",
    none: "16歳未満・所得が多い・事業専従者は0円",
  };

  // 種類：[id, 難しさ, 2段目, 場面（＄A が12月31日の年齢・＄W が合計所得金額）, 年齢 [下限, 上限], 所得 [下限, 上限, 刻み], 自分か配偶者の直系尊属か, 同居か, 受けられない事情か, ヒント1]
  const D = [
    ["i_base", 0, "ippan", "生計を一にする子（12月31日に＄A歳）の合計所得金額は＄W。", [16, 18], [0, 500000, 10000], 0, 1, 0, "16歳以上なら？"],
    ["i_zero", 0, "ippan", "高校生の子（12月31日に＄A歳）に所得はない（＄W）。", [16, 18], [0, 0, 1], 0, 1, 0, "16歳以上で所得62万円以下。"],
    ["t_base", 0, "tokutei", "大学生の子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [0, 600000, 10000], 0, 1, 0, "19歳以上23歳未満なら？"],
    ["r_base", 0, "rojin", "別居して仕送りをしている母（12月31日に＄A歳）の合計所得金額は＄W。", [70, 85], [0, 600000, 10000], 1, 0, 0, "70歳以上で別居なら？"],
    ["d_base", 0, "rojin", "同居している父（12月31日に＄A歳）の合計所得金額は＄W。", [70, 90], [0, 600000, 10000], 1, 1, 0, "70歳以上の親と同居なら？"],
    ["n_young", 0, "none", "子（12月31日に＄A歳）に所得はない（＄W）。", [5, 15], [0, 0, 1], 0, 1, 0, "16歳未満なら？"],
    ["n_hi", 0, "none", "生計を一にする子（12月31日に＄A歳）の合計所得金額は＄W。", [16, 18], [1000000, 3000000, 100000], 0, 1, 0, "所得が62万円を超えると？"],
    ["s_base", 0, "toku", "大学生の子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [630000, 850000, 10000], 0, 1, 0, "62万円を超えた19〜22歳は？"],
    ["i_sib", 0, "ippan", "生計を一にする弟（12月31日に＄A歳）の合計所得金額は＄W。", [25, 60], [0, 600000, 10000], 0, 1, 0, "子でなくても親族なら？"],
    ["i_mid", 0, "ippan", "同居している母（12月31日に＄A歳）の合計所得金額は＄W。", [50, 69], [0, 600000, 10000], 1, 1, 0, "70歳未満なら？"],
    ["n_15", 1, "none", "中学3年の子（12月31日に＄A歳）に所得はない（＄W）。", [15, 15], [0, 0, 1], 0, 1, 0, "16歳になっていない。"],
    ["i_16", 1, "ippan", "高校1年の子（12月31日に＄A歳）の合計所得金額は＄W。", [16, 16], [0, 600000, 10000], 0, 1, 0, "12月31日に16歳なら？"],
    ["t_19", 1, "tokutei", "子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 19], [0, 600000, 10000], 0, 1, 0, "19歳「以上」に入る？"],
    ["i_23", 1, "ippan", "子（12月31日に＄A歳）の合計所得金額は＄W。", [23, 23], [0, 600000, 10000], 0, 1, 0, "23歳「未満」に入る？"],
    ["r_home", 1, "rojin", "老人ホームに入所している母（12月31日に＄A歳）の合計所得金額は＄W。", [70, 95], [0, 600000, 10000], 1, 0, 0, "老人ホームは同居？"],
    ["d_hosp", 1, "rojin", "同居の父（12月31日に＄A歳）は病気で入院中。合計所得金額は＄W。", [70, 90], [0, 600000, 10000], 1, 1, 0, "治療のための入院は同居？"],
    ["r_oji", 1, "rojin", "同居している叔父（12月31日に＄A歳）の合計所得金額は＄W。", [70, 85], [0, 600000, 10000], 0, 1, 0, "叔父は直系尊属？"],
    ["d_giri", 1, "rojin", "同居している配偶者の母（12月31日に＄A歳）の合計所得金額は＄W。", [70, 90], [0, 600000, 10000], 1, 1, 0, "配偶者の親も直系尊属。"],
    ["w_62", 1, "ippan", "子（12月31日に＄A歳）の合計所得金額は、ちょうど＄W。", [16, 18], [620000, 620000, 1], 0, 1, 0, "62万円「以下」に入る？"],
    ["n_63", 1, "none", "子（12月31日に＄A歳）の合計所得金額は＄W。", [16, 18], [621000, 900000, 1000], 0, 1, 0, "18歳以下で62万円を超えると？"],
    ["n_senju", 1, "none", "青色申告の事業専従者として給与を受けた子（12月31日に＄A歳）。合計所得金額は＄W。", [24, 40], [0, 600000, 10000], 0, 1, 1, "事業専従者として給与を受けると？"],
    ["s_mid", 1, "toku", "大学生の子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [860000, 1000000, 10000], 0, 1, 0, "特定親族特別控除の表で見る。"],
    ["s_rows", 2, "toku", "子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [860000, 1230000, 10000], 0, 1, 0, "所得の行を探す。"],
    ["s_123", 2, "toku", "子（12月31日に＄A歳）の合計所得金額は、ちょうど＄W。", [19, 22], [1230000, 1230000, 1], 0, 1, 0, "123万円「以下」に入る？"],
    ["n_124", 2, "none", "子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [1231000, 1300000, 1000], 0, 1, 0, "123万円を超えると？"],
    ["t_62", 2, "tokutei", "大学生の子（12月31日に＄A歳）の合計所得金額は、ちょうど＄W。", [19, 22], [620000, 620000, 1], 0, 1, 0, "62万円以下なら扶養控除。"],
    ["s_621", 2, "toku", "大学生の子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [620001, 640000, 1], 0, 1, 0, "62万円を少し超えると、どの控除？"],
    ["n_23s", 2, "none", "子（12月31日に＄A歳）の合計所得金額は＄W。", [23, 23], [700000, 1000000, 10000], 0, 1, 0, "23歳は特定親族？"],
    ["s_85", 2, "toku", "子（12月31日に＄A歳）の合計所得金額は＄W。", [19, 22], [851000, 900000, 1000], 0, 1, 0, "85万円を超え90万円以下の行。"],
    ["r_69", 2, "ippan", "同居している父（12月31日に＄A歳）の合計所得金額は＄W。", [69, 69], [0, 600000, 10000], 1, 1, 0, "70歳になっていないと？"],
    ["d_70", 2, "rojin", "同居している母（12月31日に＄A歳）の合計所得金額は＄W。", [70, 70], [0, 620000, 10000], 1, 1, 0, "70歳「以上」に入る？"],
    ["d_soba", 2, "rojin", "同居している祖母（12月31日に＄A歳）の合計所得金額は＄W。", [80, 95], [0, 600000, 10000], 1, 1, 0, "祖母も直系尊属。"],
    ["r_ani", 2, "rojin", "同居している兄（12月31日に＄A歳）の合計所得金額は＄W。", [70, 80], [0, 600000, 10000], 0, 1, 0, "兄は直系尊属？"],
    ["n_senju2", 2, "none", "白色申告の事業専従者の子（12月31日に＄A歳）。合計所得金額は＄W。", [19, 22], [0, 600000, 10000], 0, 1, 1, "白色の事業専従者は？"],
    ["t_22", 2, "tokutei", "子（12月31日に＄A歳）の合計所得金額は＄W。", [22, 22], [0, 600000, 10000], 0, 1, 0, "22歳は23歳未満。"],
  ];

  const yen = (n) => n.toLocaleString("ja-JP") + "円";
  const man = (n) => (n !== 0 && n % MAN === 0 ? `${(n / MAN).toLocaleString("ja-JP")}万円` : yen(n));
  const label = (t) => (t === 0 ? "0円（受けられない）" : yen(t));
  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  const pickAmt = (R, lo, hi, step) => lo + ri(R, 0, Math.floor((hi - lo) / step)) * step;
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  function maker(sent, as, ws, chok, dou, bad) {
    return (R) => {
      const A = ri(R, as[0], as[1]), W = pickAmt(R, ws[0], ws[1], ws[2]);
      const ans = deductOf(A, W, chok, dou, bad), grp = grpOf(A, W, chok, dou, bad);
      const sentence = sent.replace("＄A", String(A)).replace("＄W", man(W));
      // 選び肢：年齢の区分のまちがい・同居や直系尊属の取りちがえ・受けられない事情の見落とし・となりの行・38万円のまま から3つ
      const cand = new Set([deductOf(Math.max(A - 1, 0), W, chok, dou, bad), deductOf(A + 1, W, chok, dou, bad), deductOf(A, W, !chok, dou, bad), deductOf(A, W, chok, !dou, bad), deductOf(A, W, true, true, bad), deductOf(A, W, chok, dou, false), deductOf(A, Math.max(W - 50000, 0), chok, dou, bad), deductOf(A, W + 50000, chok, dou, bad), deductOf(A, Math.min(W, 620000), chok, dou, false), 380000, 630000]);
      if (ans) cand.add(0);
      const ok = (v) => Number.isInteger(v) && v >= 0 && v !== ans;
      const wrong0 = [...cand].filter(ok);
      for (const v of [480000, 580000, 610000, 510000, 410000, 30000, 60000]) { if (wrong0.length >= 3) break; if (ok(v) && !wrong0.includes(v)) wrong0.push(v); }
      const wrong = pickN(R, [...new Set(wrong0)].sort((p, q) => p - q), 3);
      const opts = shuffle(R, [ans, ...wrong]).map(label);
      const how = bad ? "事業専従者なので受けられない" : A < 16 ? "16歳未満なので受けられない" : W <= 620000 ? `扶養控除（${A >= 19 && A < 23 ? "特定扶養親族" : A >= 70 ? (chok && dou ? "同居老親等" : "老人扶養親族") : "一般"}）` : A >= 19 && A < 23 && W <= 1230000 ? "特定親族特別控除" : "所得が多いので受けられない";
      const full = `${sentence} → ${how}：${label(ans)}`;
      return { type: "act", q: `${sentence}　控除はいくら？`, opts, ans: label(ans), rev: false, full, A, W, chok: !!chok, dou: !!dou, bad: !!bad, deduct: ans, grp, v: `${A}/${W}` };
    };
  }
  // 年齢と所得の組が6通りより少ない種類は lo=hi にする（QA の「6通り以上」から外す）
  const KINDS = D.map(([id, lv, grp, sent, as, ws, chok, dou, bad, look]) => ({ id, lv, grp, col: "a", sent, lo: 0, hi: (as[1] - as[0] + 1) * (Math.floor((ws[1] - ws[0]) / ws[2]) + 1) < 6 ? 0 : 1, look, src: grp === "toku" ? ["b", "c"] : ["a", "c"], name: GROUPS[grp].name + "：" + sent.replace("＄A", "○").replace("＄W", "○円").slice(0, 22) + "…", key: KEY[grp], why: GRP_WHY[grp], make: maker(sent, as, ws, chok, dou, bad) }));
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const GRP_OF = Object.fromEntries(KINDS.map((k) => [k.id, k.grp]));
  const groupsOf = (g) => Object.keys(GROUPS).filter((x) => GROUPS[x].set === GROUPS[g].set);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.col], src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const FYK = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, MEDIA, AS_OF, TOKU, deductOf, grpOf, kindsOf, groupsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = FYK; else root.FYK = FYK;
})(typeof self !== "undefined" ? self : this);
