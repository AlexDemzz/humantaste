/**
 * Runs inside the rendered page and returns raw measurements. Kept as plain JS in a string so no bundler
 * helper leaks into the page. Judgement (thresholds, colour buckets, weights) happens in signals.ts, where it is tested.
 */
export const COLLECT = String.raw`(() => {
  const vw = innerWidth;
  const vh = innerHeight;
  const cs = (el) => getComputedStyle(el);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = cs(el);
    return s.visibility !== "hidden" && s.display !== "none";
  };
  const label = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    return el.tagName.toLowerCase() + (cls ? "." + cls : "");
  };
  const alpha = (c) => {
    if (!c || c === "transparent") return 0;
    const m = c.match(/\/\s*([\d.]+%?)\s*\)$/) || c.match(/rgba\([^)]*,\s*([\d.]+)\)/);
    if (!m) return 1;
    return m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  };
  const text = (el) => (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
  const absTop = (r) => Math.round(r.top + scrollY);
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = cs(n).backgroundColor;
      if (alpha(c) > 0.5) return c;
    }
    const root = cs(document.documentElement).backgroundColor;
    return alpha(root) > 0.5 ? root : "rgb(255, 255, 255)";
  };
  const effectiveOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) o *= Number(cs(n).opacity);
    return o;
  };

  const all = [...document.body.querySelectorAll("*")].slice(0, 8000);
  const realH1 = [...document.querySelectorAll("h1")].find((el) => visible(el) && text(el).length > 0) || null;
  // Some generated heroes put the headline in a div: fall back to the biggest text in the first screen.
  const biggestText = () => {
    let best = null, bestSize = 0;
    for (const el of document.querySelectorAll("h2, p, div, span")) {
      const t = text(el);
      if (t.length < 8 || t.length > 160 || el.childElementCount > 6) continue;
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0 || !visible(el)) continue;
      const size = parseFloat(cs(el).fontSize);
      if (size > bestSize) { best = el; bestSize = size; }
    }
    return bestSize >= 32 ? best : null;
  };
  const h1 = realH1 || biggestText();
  const h1Box = h1 ? h1.getBoundingClientRect() : null;
  const inChrome = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.matches("header, nav, [role=banner], [role=navigation]")) return true;
      const p = cs(n).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };

  // A label is an eyebrow when a heading starts right under it; sidebar and metadata labels have none.
  const headingBoxes = [...document.querySelectorAll("h1, h2, h3, [role=heading]")].filter(visible).map((el) => el.getBoundingClientRect());
  const aboveHeading = (r) => headingBoxes.some((h) => h.top >= r.bottom - 4 && h.top - r.bottom <= 96 && h.left <= r.right && h.right >= r.left);
  // The generated reveal fades a block in while it slides up; a plain fade or a carousel's sideways offset is something else.
  const slidesUp = (transform) => {
    const m = transform.match(/^matrix\(([^)]+)\)$/);
    if (!m) return false;
    const [, , , , tx, ty] = m[1].split(",").map(Number);
    return Math.abs(tx) < 1 && ty >= 4 && ty <= 120;
  };

  const gradients = [];
  const blur = [];
  const shadows = new Map();
  const orbs = [];
  const patterns = [];
  const stripes = [];
  const tracked = [];
  const buttonFills = new Map();
  let hiddenAtRest = 0;
  const hiddenExamples = [];

  for (const el of all) {
    const s = cs(el);
    if (s.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || s.visibility === "hidden") continue;
    const area = r.width * r.height;

    const bf = s.backdropFilter || s.webkitBackdropFilter || "";
    const blurPx = parseFloat((bf.match(/blur\(([\d.]+)px\)/) || [])[1] || "0");
    if (blurPx >= 2) {
      const navBar = (r.width >= vw * 0.85 && r.top <= 20) || inChrome(el) || /nav|header|menu|toolbar/i.test(typeof el.className === "string" ? el.className : "");
      blur.push({ tag: label(el), px: blurPx, width: Math.round(r.width), navBar, bgAlpha: alpha(s.backgroundColor) });
    }

    const bgImage = s.backgroundImage;
    if (bgImage.includes("gradient")) {
      const isText = (s.backgroundClip || s.webkitBackgroundClip) === "text";
      if (isText || area > 1500) {
        gradients.push({ css: bgImage.slice(0, 500), tag: label(el), area: Math.round(area), isText, top: absTop(r), size: s.backgroundSize });
      }
      if (!isText && /px/.test(s.backgroundSize) && parseFloat(s.backgroundSize) <= 80 && area > 100000 && patterns.length < 5) {
        patterns.push({ tag: label(el), size: s.backgroundSize, css: bgImage.slice(0, 160) });
      }
    }

    const f = s.filter || "";
    const filterBlur = parseFloat((f.match(/blur\(([\d.]+)px\)/) || [])[1] || "0");
    if (filterBlur >= 40 && r.width >= 120 && r.height >= 120 && orbs.length < 5) {
      orbs.push({ tag: label(el), blur: filterBlur, size: Math.round(r.width) + "×" + Math.round(r.height), background: (bgImage !== "none" ? bgImage : s.backgroundColor).slice(0, 160) });
    }

    if (s.boxShadow && s.boxShadow !== "none" && area > 400) {
      const key = s.boxShadow;
      const entry = shadows.get(key) || { css: key, count: 0, example: label(el) };
      entry.count++;
      shadows.set(key, entry);
    }

    const sides = ["Left", "Right", "Top", "Bottom"].map((side) => ({ side, w: parseFloat(s["border" + side + "Width"]) || 0, c: s["border" + side + "Color"] }));
    const thick = sides.filter((x) => x.w >= 2 && x.w <= 10 && alpha(x.c) > 0.3);
    if (thick.length === 1 && (thick[0].side === "Left" || thick[0].side === "Right") && r.width >= 120 && r.height >= 40 && !el.matches("blockquote, table, hr, td, th, input, textarea, select")) {
      const others = sides.filter((x) => x !== thick[0]);
      if (others.every((x) => x.w <= 1)) stripes.push({ tag: label(el), color: thick[0].c, width: thick[0].w, radius: parseFloat(s.borderTopLeftRadius) || 0 });
    }

    const fs = parseFloat(s.fontSize);
    if (fs <= 15 && (s.textTransform === "uppercase" || parseFloat(s.letterSpacing) / fs > 0.03) && el.childElementCount === 0) {
      const t = text(el);
      if (t.length >= 4 && t.length <= 40 && /[a-z]/i.test(t) && !/\d/.test(t) && !el.closest("nav, header, footer, button, th, label, figcaption, time")) {
        const upper = s.textTransform === "uppercase" || t === t.toUpperCase();
        if (upper && aboveHeading(r) && !tracked.includes(t)) tracked.push(t);
      }
    }

    if (el.matches("a, button, [role=button]") && alpha(s.backgroundColor) > 0.6 && r.width >= 60 && r.height >= 28 && r.height <= 72) {
      const c = s.backgroundColor;
      buttonFills.set(c, (buttonFills.get(c) || 0) + 1);
    } else if (el.matches("a, button, [role=button]") && bgImage.includes("gradient") && r.width >= 60 && r.height >= 28 && r.height <= 72) {
      buttonFills.set(bgImage.slice(0, 200), (buttonFills.get(bgImage.slice(0, 200)) || 0) + 1);
    }

    if (r.top > vh && el.childElementCount <= 12 && text(el).length >= 24 && Number(s.opacity) < 0.05 && slidesUp(s.transform)) {
      const parentHidden = el.parentElement && effectiveOpacity(el.parentElement) < 0.05;
      if (!parentHidden) {
        hiddenAtRest++;
        if (hiddenExamples.length < 2) hiddenExamples.push(label(el) + " { opacity: " + s.opacity + "; transform: " + s.transform + " }");
      }
    }
  }

  let headlineAccent = null;
  if (h1 && parseFloat(cs(h1).fontSize) >= 28 && text(h1).length <= 160) {
    const base = cs(h1);
    for (const child of h1.querySelectorAll("*")) {
      const t = text(child);
      if (!t || t.length >= text(h1).length * 0.8 || child.matches("br, svg, svg *, img")) continue;
      const c = cs(child);
      const accent = {
        word: t.slice(0, 60),
        colour: c.color !== base.color && alpha(c.color) > 0.3 ? c.color : null,
        italic: c.fontStyle !== base.fontStyle,
        font: c.fontFamily.split(",")[0] !== base.fontFamily.split(",")[0] ? c.fontFamily.split(",")[0].replace(/["']/g, "").trim() : null,
        gradient: (c.backgroundClip || c.webkitBackgroundClip) === "text" && c.backgroundImage !== "none",
      };
      if (accent.colour || accent.italic || accent.font || accent.gradient) { headlineAccent = accent; break; }
    }
  }

  const firstFamily = (el) => (el ? cs(el).fontFamily.split(",")[0].replace(/["']/g, "").trim() : "");
  const faceNames = { heading: firstFamily(h1 || document.querySelector("h2")), body: firstFamily(document.querySelector("main p, p") || document.body) };

  let total = 0, centered = 0;
  for (const el of document.querySelectorAll("h1, h2, h3, p")) {
    if (!visible(el) || text(el).length < 12) continue;
    total++;
    if (cs(el).textAlign === "center") centered++;
  }

  const cardGrids = [];
  const seenGrid = new Set();
  for (const parent of all) {
    const kids = [...parent.children].filter(visible);
    if (kids.length < 3 || kids.length > 12) continue;
    const rows = new Map();
    for (const k of kids) {
      const t = Math.round(k.getBoundingClientRect().top / 6);
      rows.set(t, (rows.get(t) || []).concat(k));
    }
    const firstRow = [...rows.values()][0];
    if (!firstRow || firstRow.length !== 3) continue;
    const widths = firstRow.map((k) => k.getBoundingClientRect().width);
    if (Math.max(...widths) - Math.min(...widths) > 8 || widths[0] < 160) continue;
    const styles = firstRow.map(cs);
    const radius = Math.min(...styles.map((s) => parseFloat(s.borderTopLeftRadius) || 0));
    const parentBg = bgOf(parent);
    const framed = styles.every((s) => s.boxShadow !== "none" || parseFloat(s.borderTopWidth) > 0 || (alpha(s.backgroundColor) > 0.5 && s.backgroundColor !== parentBg));
    if (radius < 8 || !framed) continue;
    if (seenGrid.has(parent.parentElement)) continue;
    seenGrid.add(parent);
    cardGrids.push({ radius, shadow: styles.some((s) => s.boxShadow !== "none"), example: label(firstRow[0]) });
  }

  const tiles = new Set();
  let lucide = 0;
  let tileExample = "";
  for (const svg of document.querySelectorAll("svg")) {
    if (!visible(svg)) continue;
    const r = svg.getBoundingClientRect();
    if (r.width < 10 || r.width > 40) continue;
    for (let n = svg.parentElement, depth = 0; n && depth < 2; n = n.parentElement, depth++) {
      const b = n.getBoundingClientRect();
      if (b.width < 28 || b.width > 72 || Math.abs(b.width - b.height) > 2) continue;
      if (n.closest("button, a, [role=button], input, select, header, nav")) break;
      const s = cs(n);
      const radius = parseFloat(s.borderTopLeftRadius) || 0;
      if (radius < b.width * 0.2) continue;
      const gradientFill = s.backgroundImage.includes("gradient");
      const tinted = alpha(s.backgroundColor) >= 0.05 && s.backgroundColor !== bgOf(n.parentElement || document.body);
      if (!gradientFill && !tinted) continue;
      if (!tiles.has(n)) {
        tiles.add(n);
        if (String(svg.getAttribute("class")).includes("lucide")) lucide++;
        if (!tileExample) tileExample = label(n) + " (" + Math.round(b.width) + "px, radius " + Math.round(Math.min(radius, b.width / 2)) + "px, " + (gradientFill ? "gradient fill" : s.backgroundColor) + ")";
      }
      break;
    }
  }

  let pill = null;
  if (h1Box) {
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.bottom > h1Box.top || h1Box.top - r.bottom > 120 || r.top + scrollY < 80 || r.height > 56 || r.height < 12 || r.width > 600) continue;
      const mid = r.left + r.width / 2;
      if (mid < h1Box.left - 40 || mid > h1Box.right + 40 || inChrome(el)) continue;
      const s = cs(el);
      const rounded = parseFloat(s.borderTopLeftRadius) >= r.height / 2 - 1;
      const framed = (parseFloat(s.borderTopWidth) >= 1 && alpha(s.borderTopColor) >= 0.15) || alpha(s.backgroundColor) >= 0.05;
      const t = text(el);
      if (rounded && framed && t.length >= 3 && t.length <= 80 && visible(el)) {
        const link = el.closest("a") || el.querySelector("a");
        pill = { text: t, href: link ? link.href : null };
        break;
      }
    }
  }

  let statBanner = null;
  const STAT = /^[<>~≈]?\d[\d,.]*\s*(k|m|b|%|x|×|\+|ms|s|h|★|\/5|\/7)?\+?$/i;
  for (const parent of all) {
    const kids = [...parent.children].filter(visible);
    if (kids.length < 3 || kids.length > 6) continue;
    const pr = parent.getBoundingClientRect();
    if (pr.width < 300) continue;
    const tops = kids.map((k) => Math.round(k.getBoundingClientRect().top / 20));
    if (new Set(tops).size !== 1) continue;
    const values = [];
    for (const k of kids) {
      const big = [...k.querySelectorAll("*")].concat(k).find((n) => n.childElementCount === 0 && STAT.test(text(n)) && parseFloat(cs(n).fontSize) >= 22);
      if (big) values.push(text(big));
    }
    if (values.length === kids.length && !values.every((v) => /^\d{1,2}$/.test(v))) { statBanner = values; break; }
  }

  let numbered = null;
  const markers = [];
  for (const el of all) {
    if (el.childElementCount > 0) continue;
    const t = text(el);
    if (!/^0[1-9]\.?$/.test(t)) continue;
    if (parseFloat(cs(el).fontSize) < 12 || !visible(el)) continue;
    const digit = t.replace(".", "");
    if (!markers.includes(digit)) markers.push(digit);
  }
  if (["01", "02", "03"].every((m) => markers.includes(m))) numbered = markers.sort().slice(0, 6);

  const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
  const emojiIcons = [];
  for (const el of document.querySelectorAll("nav a, header a, button, h1, h2, h3, h4, li, dt, [class*=icon], [class*=feature] > *")) {
    const t = text(el);
    if (!t || t.length > 120 || !EMOJI.test(t) || !visible(el)) continue;
    if (emojiIcons.length < 40 && !emojiIcons.includes(t.slice(0, 50))) emojiIcons.push(t.slice(0, 50));
  }

  const sparkles = document.querySelectorAll('svg[class*="sparkle"], [data-lucide*="sparkle"], [data-icon*="sparkle"]').length;
  const brand = document.querySelector("header a[href='/'], nav a[href='/'], header a:first-of-type");
  const lucideLogo = Boolean(brand && brand.querySelector("svg[class*='lucide']"));

  return {
    lang: (document.documentElement.lang || "").toLowerCase(),
    pageBackground: bgOf(h1 || document.body),
    h1: h1 ? { text: text(h1).slice(0, 200), color: cs(h1).color, fontStyle: cs(h1).fontStyle, centered: cs(h1).textAlign === "center" } : null,
    gradients: gradients.slice(0, 60),
    backdropBlur: blur.slice(0, 40),
    shadows: [...shadows.values()].sort((a, b) => b.count - a.count).slice(0, 40),
    orbs,
    patterns,
    stripes: stripes.slice(0, 20),
    trackedLabels: tracked.slice(0, 60),
    buttonFills: [...buttonFills.entries()].map(([css, count]) => ({ css, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    hiddenAtRest: { count: hiddenAtRest, examples: hiddenExamples },
    headlineAccent,
    faceNames,
    centered: { total, centered },
    cardGrids: cardGrids.slice(0, 10),
    iconTiles: { count: tiles.size, lucide, example: tileExample },
    pill,
    statBanner,
    numbered,
    emojiIcons,
    sparkles,
    lucideLogo,
    viewport: { width: vw, height: vh },
  };
})()`;
