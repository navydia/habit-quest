export type Anim = 'idle' | 'fight';

/** A horizontal sprite strip: `frames` frames of 256×320, played at `fps`. */
export interface ArtAsset {
  src: number;
  frames: number;
  fps: number;
}

export const FRAME_W = 256;
export const FRAME_H = 320;
