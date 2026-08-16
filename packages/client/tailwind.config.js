/** @type {import('tailwindcss').Config} */

function token(name) {
  return `rgb(var(--lg-${name}) / <alpha-value>)`;
}

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          top: token("sky-top"),
          high: token("sky-high"),
          mid: token("sky-mid"),
          low: token("sky-low"),
          horizon: token("sky-horizon"),
          glow: token("sky-glow"),
        },
        cloud: {
          DEFAULT: token("cloud"),
          lit: token("cloud-lit"),
          shade: token("cloud-shade"),
        },
        crate: {
          DEFAULT: token("crate"),
          lit: token("crate-lit"),
          plank: token("crate-plank"),
          shade: token("crate-shade"),
          outline: token("crate-outline"),
          face: token("crate-face"),
        },
        dyn: {
          DEFAULT: token("dyn"),
          lit: token("dyn-lit"),
          plank: token("dyn-plank"),
          outline: token("dyn-outline"),
          light: token("dyn-light"),
        },
        fuse: {
          DEFAULT: token("fuse"),
          spark: token("fuse-spark"),
          glow: token("fuse-glow"),
        },
        fire: {
          core: token("fire-core"),
          1: token("fire-1"),
          2: token("fire-2"),
          3: token("fire-3"),
          4: token("fire-4"),
        },
        smoke: token("smoke"),
        panel: {
          DEFAULT: token("panel"),
          raised: token("panel-raised"),
          sunk: token("panel-sunk"),
          edge: token("panel-edge"),
          outline: token("panel-outline"),
        },
        ink: {
          DEFAULT: token("ink"),
          dim: token("ink-dim"),
          faint: token("ink-faint"),
        },
        action: {
          DEFAULT: token("action"),
          lit: token("action-lit"),
          ink: token("action-ink"),
        },
        health: {
          good: token("health-good"),
          warn: token("health-warn"),
          bad: token("health-bad"),
        },
        danger: token("danger"),
        scrim: token("scrim"),
      },
      borderRadius: {
        sm: "var(--lg-radius-sm)",
        md: "var(--lg-radius-md)",
        lg: "var(--lg-radius-lg)",
        xl: "var(--lg-radius-xl)",
      },
      fontFamily: {
        display: "var(--lg-font-display)",
        tile: "var(--lg-font-tile)",
        body: "var(--lg-font-body)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.86) translateY(8px)", opacity: "0" },
          "65%": { transform: "scale(1.03) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-4px) rotate(3deg)" },
        },
      },
      animation: {
        pop: "pop 260ms ease-out",
        bob: "bob 2.4s ease-in-out infinite",
      },
      boxShadow: {
        chunk: "0 4px 0 0 rgb(var(--lg-panel-outline))",
        "chunk-sm": "0 2px 0 0 rgb(var(--lg-panel-outline))",
        "chunk-action": "0 4px 0 0 rgb(var(--lg-action-ink))",
        sunk: "inset 0 2px 0 0 rgb(var(--lg-panel-outline) / 0.7)",
      },
    },
  },
  plugins: [],
};
