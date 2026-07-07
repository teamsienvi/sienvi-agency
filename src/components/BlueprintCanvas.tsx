import React, { useEffect, useRef } from "react";

const BlueprintCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let scrollY = window.scrollY;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    // Blueprint grid system params
    const lineSpacing = 50;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Tech lead style: deep rich engineering draft board background
      ctx.fillStyle = "#0c0d1e";
      ctx.fillRect(0, 0, width, height);

      // Rotating blueprint grid mapping
      const rotation = angle + scrollY * 0.0005;
      const gridOffset = (scrollY * 0.3) % lineSpacing;

      ctx.save();
      // Center translation for rotation
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rotation * 0.05); // subtle drift rotation
      ctx.translate(-width / 2, -height / 2);

      // Primary technical blueprint lines (faint purple/blue)
      ctx.strokeStyle = "rgba(139, 92, 246, 0.04)";
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let x = -width; x < width * 2; x += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + gridOffset, -height);
        ctx.lineTo(x + gridOffset, height * 2);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = -height; y < height * 2; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(-width, y + gridOffset);
        ctx.lineTo(width * 2, y + gridOffset);
        ctx.stroke();
      }

      // Accent sub-grid dots
      ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
      for (let x = -width; x < width * 2; x += lineSpacing) {
        for (let y = -height; y < height * 2; y += lineSpacing) {
          ctx.fillRect(x + gridOffset - 1, y + gridOffset - 1, 2, 2);
        }
      }

      ctx.restore();

      // Draw premium 3D isometric blueprint wireframe box in background
      ctx.save();
      ctx.translate(width / 2, height / 2 + (scrollY * 0.1)); // moves slightly on scroll
      ctx.strokeStyle = "rgba(139, 92, 246, 0.2)"; // tech purple
      ctx.lineWidth = 1.2;

      const size = 160 + Math.sin(angle * 0.5) * 15;
      const t = angle + scrollY * 0.001;

      const points: [number, number][] = [];
      const vertices = [
        // Base block (0-7)
        [-0.5, -0.6, -0.5], [0.5, -0.6, -0.5], [0.5, 0.2, -0.5], [-0.5, 0.2, -0.5],
        [-0.5, -0.6, 0.5], [0.5, -0.6, 0.5], [0.5, 0.2, 0.5], [-0.5, 0.2, 0.5],
        // Middle block (8-15)
        [-0.35, 0.2, -0.35], [0.35, 0.2, -0.35], [0.35, 0.8, -0.35], [-0.35, 0.8, -0.35],
        [-0.35, 0.2, 0.35], [0.35, 0.2, 0.35], [0.35, 0.8, 0.35], [-0.35, 0.8, 0.35],
        // Spire/Tip (16-17)
        [0.0, 1.1, 0.0], [0.0, 1.4, 0.0],
        // Floor band base (18-21)
        [-0.5, -0.2, -0.5], [0.5, -0.2, -0.5], [0.5, -0.2, 0.5], [-0.5, -0.2, 0.5],
        // Floor band middle (22-25)
        [-0.35, 0.5, -0.35], [0.35, 0.5, -0.35], [0.35, 0.5, 0.35], [-0.35, 0.5, 0.35]
      ];

      for (const vertex of vertices) {
        // Rotate X
        let y1 = vertex[1] * Math.cos(t * 0.3) - vertex[2] * Math.sin(t * 0.3);
        let z1 = vertex[1] * Math.sin(t * 0.3) + vertex[2] * Math.cos(t * 0.3);

        // Rotate Y
        let x2 = vertex[0] * Math.cos(t * 0.5) + z1 * Math.sin(t * 0.5);
        let z2 = -vertex[0] * Math.sin(t * 0.5) + z1 * Math.cos(t * 0.5);

        // Projection
        const fov = 500;
        const scale = fov / (fov + z2 * size * 0.4);
        const x3 = x2 * size * scale;
        const y3 = y1 * size * scale;

        points.push([x3, y3]);
      }

      // Connections for building wireframe
      const edges = [
        // Base block sides
        [0, 1], [1, 2], [2, 3], [3, 0], // back
        [4, 5], [5, 6], [6, 7], [7, 4], // front
        [0, 4], [1, 5], [2, 6], [3, 7], // links
        
        // Middle block sides
        [8, 9], [9, 10], [10, 11], [11, 8], // back
        [12, 13], [13, 14], [14, 15], [15, 12], // front
        [8, 12], [9, 13], [10, 14], [11, 15], // links

        // Spire connections
        [10, 16], [11, 16], [14, 16], [15, 16],
        [16, 17], // Spire rod

        // Floor band base
        [18, 19], [19, 20], [20, 21], [21, 18],

        // Floor band middle
        [22, 23], [23, 24], [24, 25], [25, 22]
      ];

      ctx.beginPath();
      for (const edge of edges) {
        ctx.moveTo(points[edge[0]][0], points[edge[0]][1]);
        ctx.lineTo(points[edge[1]][0], points[edge[1]][1]);
      }
      ctx.stroke();

      // Additional architectural circles/markers inside blueprint
      ctx.strokeStyle = "rgba(139, 92, 246, 0.08)";
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.2, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = "rgba(139, 92, 246, 0.05)";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, 2 * Math.PI);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
      ctx.beginPath();
      ctx.moveTo(-size * 1.5, 0);
      ctx.lineTo(size * 1.5, 0);
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(0, size * 1.5);
      ctx.stroke();

      // Engineering telemetry labels
      ctx.fillStyle = "rgba(139, 92, 246, 0.35)";
      ctx.font = "10px monospace";
      ctx.fillText(`SYS.GRID: ACTIVE [50PX]`, -width / 2 + 30, height / 2 - 60);
      ctx.fillText(`DRAFT.ROT: ${(rotation * 0.05 % (2 * Math.PI)).toFixed(4)} RAD`, -width / 2 + 30, height / 2 - 45);
      ctx.fillText(`OFFSET.Y: ${scrollY.toFixed(0)} PX`, -width / 2 + 30, height / 2 - 30);
      ctx.fillText(`VIEW: LATERAL ISOMETRIC`, -width / 2 + 30, height / 2 - 15);

      ctx.fillText(`SIENVI CORE v2.1`, width / 2 - 150, height / 2 - 15);

      ctx.restore();

      angle += 0.005;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

export default BlueprintCanvas;
