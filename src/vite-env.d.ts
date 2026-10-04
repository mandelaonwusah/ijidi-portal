/// <reference types="vite/client" />

/** First 7 characters of the commit this build was made from, or null if it
 *  could not be read at build time (set in vite.config.ts). */
declare const __BUILD_COMMIT__: string | null;

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}
