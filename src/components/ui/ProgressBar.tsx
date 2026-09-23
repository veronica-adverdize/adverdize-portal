"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href === "#") return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setVisible(true);
      setProgress(0);

      let p = 0;
      intervalRef.current = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 85) {
          clearInterval(intervalRef.current!);
          p = 85;
        }
        setProgress(p);
      }, 150);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #E8405A, #F4845F)",
          boxShadow: "0 0 8px rgba(232,64,90,0.6)",
        }}
      />
    </div>
  );
}
