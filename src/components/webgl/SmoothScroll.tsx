import { useEffect } from "react";
import { startSmoothScroll, stopSmoothScroll, tickSmoothScroll } from "@/lib/smoothScroll";

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    startSmoothScroll();

    let id = 0;
    const raf = (time: number) => {
      tickSmoothScroll(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(id);
      stopSmoothScroll();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
