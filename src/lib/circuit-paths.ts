// src/lib/circuit-paths.ts
// Pulse paths and glow nodes for the circuit background.
// Traced automatically from public/brand/circuit-master.jpg (498 x 1080).
// Coordinates are in image space, not screen pixels, so they stay aligned at any
// screen size. A higher-resolution copy of the SAME artwork needs no changes.
// A different artwork needs new paths.

export const CIRCUIT_SIZE = { width: 498, height: 1080 } as const;

export interface CircuitPath {
  id: string;
  d: string;
}

export interface CircuitNode {
  x: number;
  y: number;
}

// Longest first, spread across the artwork.
export const CIRCUIT_PATHS: CircuitPath[] = [
  { id: "p01", d: "M 44 647 L 74 647 L 95 667 L 96 672 L 95 1015 L 97 1025 L 107 1035 L 178 1037" },
  { id: "p02", d: "M 497 539 L 340 539 L 337 541 L 336 585 L 339 590 L 497 591" },
  { id: "p03", d: "M 156 880 L 156 839 L 144 828 L 115 828 L 104 816 L 105 668 L 74 638 L 20 639" },
  { id: "p04", d: "M 131 1070 L 94 1070 L 89 1068 L 79 1055 L 79 841" },
  { id: "p05", d: "M 497 337 L 492 337 L 488 332 L 488 88 L 497 75" },
  { id: "p06", d: "M 278 0 L 278 241" },
  { id: "p07", d: "M 285 728 L 285 696 L 236 649 L 236 497" },
  { id: "p08", d: "M 484 0 L 484 174 L 459 196" },
  { id: "p09", d: "M 384 1 L 384 193" },
  { id: "p10", d: "M 87 448 L 56 419 L 55 289" },
  { id: "p11", d: "M 9 948 L 10 785" },
  { id: "p12", d: "M 496 874 L 492 870 L 467 870 L 461 864 L 461 745" },
  { id: "p13", d: "M 128 0 L 167 39 L 167 148" },
  { id: "p14", d: "M 405 937 L 403 1019 L 388 1033 L 388 1077" },
  { id: "p15", d: "M 311 1077 L 311 942" },
  { id: "p16", d: "M 155 473 L 155 360 L 175 341" },
  { id: "p17", d: "M 121 202 L 0 202" },
  { id: "p18", d: "M 486 519 L 486 423 L 489 405" },
  { id: "p19", d: "M 160 887 L 160 968 L 170 977 L 190 977" },
  { id: "p20", d: "M 458 293 L 458 345 L 428 373 L 428 399" },
  { id: "p21", d: "M 260 274 L 260 352 L 245 368 L 237 373" },
  { id: "p22", d: "M 142 598 L 44 596" },
  { id: "p23", d: "M 342 652 L 322 652 L 320 654 L 320 730" },
  { id: "p24", d: "M 347 442 L 347 368 L 368 348" },
  { id: "p25", d: "M 94 65 L 45 65 L 37 58 L 24 58 L 11 45 L 0 44" },
  { id: "p26", d: "M 342 478 L 411 477 L 427 462 L 428 454" },
  { id: "p27", d: "M 91 511 L 95 514 L 167 514 L 176 520" },
  { id: "p28", d: "M 349 225 L 344 222 L 343 217 L 344 145" },
];

// Existing bright nodes in the artwork, brightest first.
export const CIRCUIT_NODES: CircuitNode[] = [
  { x: 255, y: 762 },
  { x: 214, y: 340 },
  { x: 477, y: 982 },
  { x: 134, y: 797 },
  { x: 267, y: 494 },
  { x: 178, y: 689 },
  { x: 47, y: 713 },
  { x: 239, y: 148 },
  { x: 310, y: 785 },
  { x: 175, y: 586 },
  { x: 324, y: 529 },
  { x: 290, y: 892 },
  { x: 399, y: 679 },
  { x: 450, y: 48 },
];
