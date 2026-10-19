"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PostSkeleton from "@/components/PostSkeleton";

export default function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = useState("idle"); 
  const [skeleton, setSkeleton] = useState(false);
  const timer = useRef();

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("a");
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (url.pathname.endsWith(".xml")) return;

      setState("loading");
      if (url.pathname.startsWith("/posts/")) setSkeleton(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { setState("idle"); setSkeleton(false); }, 15000); // safety net
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    setSkeleton(false);
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState("idle"), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <div className={`navbar ${state}`} aria-hidden="true" />
      {skeleton && (
        <div className="skeleton-screen">
          <div className="wrap" style={{ paddingTop: "2rem" }}>
            <PostSkeleton />
          </div>
        </div>
      )}
    </>
  );
}