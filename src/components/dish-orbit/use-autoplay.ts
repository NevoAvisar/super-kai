"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent, type RefObject } from "react";
import gsap from "gsap";

type Reason = "hover" | "focus" | "hidden" | "offscreen" | "user" | "reduced";

interface Options {
  rootRef: RefObject<HTMLElement | null>;
  /** Progress bar element; its scaleX tween (0 → 1) is the timer itself. */
  barRef: RefObject<HTMLElement | null>;
  seconds: number;
  /** Advance one slide. */
  step: () => void;
  /** Whether advancing now is OK (e.g. the pinned section is on screen). Otherwise the countdown restarts. */
  canStep: () => boolean;
  /** Changes whenever the slide changes — any navigation restarts the countdown. */
  restartKey: unknown;
}

/**
 * Autoplay for the orbit carousel. A GSAP tween on the progress bar is the
 * countdown, so pausing (hover, keyboard focus, hidden tab, off-screen, the
 * pause button, reduced motion) freezes it mid-way and resuming continues.
 */
export function useAutoplay({ rootRef, barRef, seconds, step, canStep, restartKey }: Options) {
  const timer = useRef<gsap.core.Tween | null>(null);
  const reasons = useRef(new Set<Reason>());
  const [paused, setPaused] = useState(false); // any reason (for aria-live)
  const [stopped, setStopped] = useState(false); // user / reduced motion (for the button)
  const stepRef = useRef(step);
  const canStepRef = useRef(canStep);
  useEffect(() => {
    stepRef.current = step;
    canStepRef.current = canStep;
  });

  const sync = useCallback(() => {
    const r = reasons.current;
    if (r.size) timer.current?.pause();
    else timer.current?.resume();
    setPaused(r.size > 0);
    setStopped(r.has("user") || r.has("reduced"));
  }, []);

  const setReason = useCallback(
    (reason: Reason, on: boolean) => {
      if (on === reasons.current.has(reason)) return;
      if (on) reasons.current.add(reason);
      else reasons.current.delete(reason);
      sync();
    },
    [sync],
  );

  const restart = useCallback(() => {
    timer.current?.kill();
    const bar = barRef.current;
    if (!bar) return;
    gsap.set(bar, { scaleX: 0 });
    timer.current = gsap.to(bar, {
      scaleX: 1,
      duration: seconds,
      ease: "none",
      paused: reasons.current.size > 0,
      onComplete: () => (canStepRef.current() ? stepRef.current() : restart()),
    });
  }, [barRef, seconds]);

  // Every slide change (manual or automatic) starts a fresh countdown.
  useEffect(() => {
    restart();
  }, [restartKey, restart]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduce = () => setReason("reduced", reduce.matches);
    const onVisibility = () => setReason("hidden", document.hidden);
    // A visitor scrolling or touching the page gets a fresh countdown, so the
    // carousel never moves out from under them mid-gesture.
    const onUserMove = () => {
      if (!reasons.current.has("offscreen")) restart();
    };
    const io = new IntersectionObserver(([e]) => setReason("offscreen", !e.isIntersecting), { threshold: 0.35 });

    onReduce();
    onVisibility();
    io.observe(root);
    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("wheel", onUserMove, { passive: true });
    window.addEventListener("touchstart", onUserMove, { passive: true });
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("wheel", onUserMove);
      window.removeEventListener("touchstart", onUserMove);
      timer.current?.kill();
    };
  }, [rootRef, restart, setReason]);

  /** Pause/play button. Playing also overrides a reduced-motion default. */
  const toggle = useCallback(() => {
    const off = reasons.current.has("user") || reasons.current.has("reduced");
    reasons.current.delete("reduced");
    if (off) reasons.current.delete("user");
    else reasons.current.add("user");
    sync();
  }, [sync]);

  /** Spread onto the carousel root. */
  const rootHandlers = {
    onPointerEnter: (e: PointerEvent) => e.pointerType === "mouse" && setReason("hover", true),
    onPointerLeave: (e: PointerEvent) => e.pointerType === "mouse" && setReason("hover", false),
    // Only keyboard focus pauses (a mouse click also focuses the button it hits).
    onFocus: (e: FocusEvent) => (e.target as HTMLElement).matches(":focus-visible") && setReason("focus", true),
    onBlur: (e: FocusEvent) => {
      if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setReason("focus", false);
    },
  };

  return { paused, stopped, toggle, rootHandlers };
}
