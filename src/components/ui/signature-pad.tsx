import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export function SignaturePad({ onSave, onCancel, title = "Tanda Tangan Kehadiran" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas size to match CSS size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        // Fill white background so export looks good
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.closePath();
      }
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      setHasDrawn(false);
    }
  };

  const handleSave = () => {
    if (!hasDrawn || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-xl">{title}</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="p-6 bg-slate-50 flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-slate-500 mb-3 w-full text-center">
            Silakan buat tanda tangan Anda di dalam kotak ini.
          </p>
          <div className="relative w-full aspect-[2/1] max-w-sm rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-slate-300 font-bold text-2xl opacity-50 select-none">Tanda Tangan</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-3 bg-white">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="border-slate-200 text-slate-600 hover:bg-slate-100 font-bold w-full sm:w-auto order-2 sm:order-1"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Ulangi
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold w-full sm:w-auto hidden sm:flex"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasDrawn}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Simpan Kehadiran
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
