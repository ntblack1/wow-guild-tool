import { ReactNode, useEffect, useRef, useState } from "react";

type DeferredSectionProps = {
  children: ReactNode;
  minHeight?: number;
};

export function DeferredSection({ children, minHeight = 320 }: DeferredSectionProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "240px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={ref} style={visible ? undefined : { minHeight }}>{visible ? children : null}</div>;
}
