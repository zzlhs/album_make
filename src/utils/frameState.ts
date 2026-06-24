import type { PhotoFrameState, PhotoFrameTemplate } from '../templates/templateTypes';

export function resolveFrame(frame: PhotoFrameTemplate, state?: PhotoFrameState): PhotoFrameTemplate {
  return {
    ...frame,
    x: state?.x ?? frame.x,
    y: state?.y ?? frame.y,
    width: state?.width ?? frame.width,
    height: state?.height ?? frame.height,
    rotation: state?.rotation ?? frame.rotation,
  };
}
