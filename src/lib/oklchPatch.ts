// Patch to prevent html2canvas from crashing when encountering Tailwind v4 oklch() colors.
// This overrides window.getComputedStyle to automatically intercept and convert oklch colors to standard rgb/rgba.

function oklchToRgb(l: number, c: number, h: number, alpha?: number): string {
  // h is in degrees, convert to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  const r = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  const g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  const b_ = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;

  const toSRGB = (x: number) => {
    if (x <= 0.0031308) {
      return 12.92 * x;
    }
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  const rSrgb = Math.max(0, Math.min(255, Math.round(toSRGB(r) * 255)));
  const gSrgb = Math.max(0, Math.min(255, Math.round(toSRGB(g) * 255)));
  const bSrgb = Math.max(0, Math.min(255, Math.round(toSRGB(b_) * 255)));

  if (alpha !== undefined) {
    return `rgba(${rSrgb}, ${gSrgb}, ${bSrgb}, ${alpha})`;
  }
  return `rgb(${rSrgb}, ${gSrgb}, ${bSrgb})`;
}

function convertOklchToRgb(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\s*\(([^)]+)\)/i);
    if (!match) return oklchStr;

    const content = match[1].trim();
    // Split by spaces, commas, or slashes
    const parts = content.split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return oklchStr;

    const lStr = parts[0];
    const cStr = parts[1];
    const hStr = parts[2];
    const aStr = parts[3];

    let l = parseFloat(lStr);
    if (isNaN(l)) l = 0;
    if (lStr.endsWith('%')) {
      l = l / 100;
    }

    let c = parseFloat(cStr);
    if (isNaN(c)) c = 0;

    let h = parseFloat(hStr);
    if (isNaN(h)) h = 0;
    if (hStr.endsWith('rad')) {
      h = (parseFloat(hStr) * 180) / Math.PI;
    } else if (hStr.endsWith('turn')) {
      h = parseFloat(hStr) * 360;
    }

    let alpha: number | undefined = undefined;
    if (aStr) {
      alpha = parseFloat(aStr);
      if (isNaN(alpha)) alpha = 1;
      if (aStr.endsWith('%')) {
        alpha = alpha / 100;
      }
    }

    return oklchToRgb(l, c, h, alpha);
  } catch (e) {
    console.error("Error converting oklch color:", oklchStr, e);
    return oklchStr;
  }
}

export function replaceOklchInString(str: string): string {
  if (typeof str !== 'string' || !str.includes('oklch')) return str;

  return str.replace(/oklch\s*\([^)]+\)/gi, (match) => {
    try {
      return convertOklchToRgb(match);
    } catch (e) {
      console.warn("Failed to convert oklch color:", match, e);
      return match;
    }
  });
}

let isPatched = false;

export const patchGetComputedStyle = () => {
  if (isPatched || typeof window === 'undefined') return;

  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (element, pseudoElt) {
    const style = originalGetComputedStyle(element, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string' && val.includes('oklch')) {
              return replaceOklchInString(val);
            }
            return val;
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'string' && val.includes('oklch')) {
          return replaceOklchInString(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };

  isPatched = true;
};

// Auto-run on import to ensure safety across the codebase
patchGetComputedStyle();
