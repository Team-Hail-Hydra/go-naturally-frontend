import { useState, useEffect } from "react";

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null
  );
  const [lastScrollY, setLastScrollY] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        return;
      }

      const direction = scrollY > lastScrollY ? "down" : "up";
      setScrollDirection(direction);

      // Show nav when scrolling up or at the top
      if (direction === "up" || scrollY < 50) {
        setShow(true);
      } else {
        setShow(false);
      }

      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };

    const onScroll = () => requestAnimationFrame(updateScrollDirection);

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  return { scrollDirection, show };
};
