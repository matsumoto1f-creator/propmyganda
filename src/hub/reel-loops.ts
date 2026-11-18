// Short, small loops of PMG's reels for the hub's rings (360x640, 8 seconds, about 0.7 MB each;
// the full reels are 33 MB each and only load when a screen is opened). Keyed by the reel's
// asset id, so a reel that is replaced or added simply shows its poster in the ring until a loop
// is made for it. To make one: ffmpeg -ss 2 -t 8 -i reel.mp4 -vf scale=360:640 -an -crf 30 N-loop.mp4
export const REEL_LOOPS: Record<string, string> = {
  'cbdd980c-5a46-4bf4-847e-4d4565a2aec8': 'hub/reels/1-loop.mp4',
  '8e719b64-bafa-4b47-b4e2-072a8e100ae5': 'hub/reels/2-loop.mp4',
  'bde77f35-e7bc-4ae9-8c5a-213d002d5dfc': 'hub/reels/3-loop.mp4',
  '0a9f1c7b-351a-49ee-8f2b-59029ef95e16': 'hub/reels/4-loop.mp4',
  'c89e1ad7-b0c8-4e63-87fa-35bddde63a9e': 'hub/reels/5-loop.mp4',
  'fddd6fb4-20f9-41a6-b38a-d0ded187b5c0': 'hub/reels/6-loop.mp4',
};
