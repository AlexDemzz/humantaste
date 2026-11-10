declare module "gifenc" {
  type Palette = number[][];
  type Pixels = Uint8Array | Uint8ClampedArray;

  export const GIFEncoder: () => {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      options: { palette: Palette; delay: number }
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array<ArrayBuffer>;
  };
  export const quantize: (rgba: Pixels, maxColors: number) => Palette;
  export const applyPalette: (rgba: Pixels, palette: Palette) => Uint8Array;
}
