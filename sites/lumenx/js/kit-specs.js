// 3D specs for kit-built lamps (centimetres). Profiles are measured on the product photos' silhouettes and
// calibrated to the catalogue dimensions; see kit.js for how each part is turned.
export const KIT = {
  defne: {
    body: {
      finishes: ['dogal', 'ceviz'],
      // pith near vertical, inside the bulb's widest part and outside the neck: lines on the neck, one large closed
      // bullseye on the front-right of the bulb where the pith runs under the surface (the studio photo's most
      // visible figure)
      // oak rings ~2 mm: the turning spreads them where it cuts them at a shallow angle
      grain: { pith: [2.26, 4.2, 1.27], dir: [0.12, 1, -0.08], ring: 0.2, contrast: 0.42 },
      profile: [
        [0, 0.12], [1.45, 0.12], [1.62, 0.15], [1.81, 0.26], [2.26, 0.56], [2.51, 0.87], [2.72, 1.18], [2.9, 1.49],
        [3.05, 1.79], [3.15, 2.1], [3.26, 2.41], [3.32, 2.72], [3.37, 3.03], [3.4, 3.33], [3.4, 3.95], [3.35, 4.56],
        [3.22, 5.18], [3.03, 5.79], [2.78, 6.41], [2.51, 7.03], [2.26, 7.64], [2.04, 8.26], [1.87, 8.87], [1.73, 9.49],
        [1.63, 10.1], [1.55, 10.72], [1.51, 11.33], [1.49, 12.0], [1.42, 12.8], [1.2, 13.2], [0, 13.3],
      ],
      foot: { r: 1.45, h: 0.12 },
    },
    shade: { y: 12.0, h: 10.3, rBottom: 5.1, rTop: 3.85, thickness: 0.12, tape: 0.45, cap: true, transmission: 0.011, liner: 0.03 },
    topButton: { r: 0.62, h: 0.22 },
    details: [
      { type: 'button', y: 3.7, x: 0.6, side: 'back', r: 0.3 },
      { type: 'usbc', y: 2.05, x: 0.4, side: 'back', r: 0.56 },
      { type: 'hole', y: 2.05, x: -1.3, side: 'back', r: 0.12 },
    ],
    light: { kelvin: 3300, lumen: 420, y: 17.5, dimmer: [0.25, 0.55, 1], body: 0.012, bounce: 200 },
  },
};
