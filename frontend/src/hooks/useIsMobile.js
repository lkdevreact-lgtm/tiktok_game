import { useState, useEffect } from "react";

/**
 * Trả về `true` nếu viewport width < 768px (mobile portrait).
 * Tự động cập nhật khi cửa sổ thay đổi kích thước.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    // Đặt giá trị ban đầu chính xác
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
