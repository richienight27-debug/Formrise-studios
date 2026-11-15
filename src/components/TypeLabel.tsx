"use client";

import { useEffect, useRef, useState } from "react";

/** Types its text out once it scrolls into view, with a blinking caret. */
export default function TypeLabel({ text, speed = 55 }: { text: string; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let i = 0;
        timer = window.setInterval(() => {
          i++;
          setCount(i);
          if (i >= text.length) window.clearInterval(timer);
        }, speed);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [text, speed]);

  return (
    <span ref={ref} aria-label={text} className="inline-flex items-center">
      <span aria-hidden>{text.slice(0, count)}</span>
      <span aria-hidden className="type-caret ml-0.5 inline-block h-[1.15em] w-[2px] bg-current" />
    </span>
  );
}
