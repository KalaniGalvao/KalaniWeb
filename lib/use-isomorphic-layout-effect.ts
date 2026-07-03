import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect logs a warning when rendered on the server (client components
 * are still pre-rendered by Next). This picks the layout effect on the client
 * (so GSAP can set initial states before paint, avoiding a flash) and the plain
 * effect on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
