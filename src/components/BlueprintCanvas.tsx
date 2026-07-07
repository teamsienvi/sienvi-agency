import React, { useEffect, useRef, useState } from "react";

export const BlueprintCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const totalFrames = 100;
  
  // Keep refs for mutable animation values to avoid re-running useEffect
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const scrollTargetRef = useRef(0);
  const currentFrameRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Monitor document theme changes (dark mode class toggles)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Preload and cache images
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(2, "0");
      img.src = `/assets/blueprint/frame_${frameNum}.png`;
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
      };
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;

    return () => {
      // Clear image arrays
      imagesRef.current = [];
    };
  }, []);

  // Listen to scroll events and run the canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle scaling and aspect-ratio preservation (cover style)
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawActiveFrame();
    };

    const drawActiveFrame = () => {
      const imgIndex = Math.round(currentFrameRef.current);
      const img = imagesRef.current[imgIndex];
      if (!img || !img.complete) return;

      const imgWidth = 960;
      const imgHeight = 540;
      const imgRatio = imgWidth / imgHeight;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        // Canvas is wider than image aspect ratio (16:9)
        drawHeight = canvasWidth / imgRatio;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        // Canvas is taller than image aspect ratio
        drawWidth = canvasHeight * imgRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      
      // Target frame goes from index 0 to 99
      scrollTargetRef.current = progress * (totalFrames - 1);
    };

    // Smooth render loop using LERP
    const tick = () => {
      const diff = scrollTargetRef.current - currentFrameRef.current;
      
      // If there's a difference, slide towards target using linear interpolation (LERP)
      if (Math.abs(diff) > 0.01) {
        currentFrameRef.current += diff * 0.15; // 0.15 drives smoothing speed
        drawActiveFrame();
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", handleScroll);
    
    // Initial size and paint
    resizeCanvas();
    handleScroll();
    
    // Start loop
    requestRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", handleScroll);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [imagesLoaded]); // Re-run scroll handlers when progress of preloading changes

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed top-0 left-0 w-full h-full -z-10 pointer-events-none block transition-all duration-300 ${
          !isDark ? "blueprint-light-filter" : ""
        }`}
      />
      {imagesLoaded < totalFrames && (
        <div className="fixed top-0 left-0 w-full h-1 z-50 bg-primary/10">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,229,255,0.7)]" 
            style={{ width: `${(imagesLoaded / totalFrames) * 100}%` }}
          />
        </div>
      )}
    </>
  );
};
