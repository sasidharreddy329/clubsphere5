"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll(".glass-card, .animated-fade-up, .animated-fade-up-delay, [data-reveal]")
    );

    if (!nodes.length) return undefined;

    nodes.forEach((node) => node.classList.add("reveal-ready"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return null;
}
