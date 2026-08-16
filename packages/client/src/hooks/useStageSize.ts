import { RefObject, useEffect, useState } from "react";

export interface StageSize {
  width: number;
  height: number;
}

export function useStageSize(ref: RefObject<HTMLElement>): StageSize {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const applySize = (width: number, height: number) => {
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height }
      );
    };

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      applySize(Math.round(rect.width), Math.round(rect.height));
    });

    observer.observe(node);
    applySize(node.clientWidth, node.clientHeight);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}
