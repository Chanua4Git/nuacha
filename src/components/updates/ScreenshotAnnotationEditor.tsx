import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Line, Rect, Textbox, Group, FabricImage, FabricText, Point } from "fabric";
import { AnnotationToolbar, AnnotationTool } from "./AnnotationToolbar";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenshotAnnotationEditorProps {
  imageFile: File;
  moduleId: string;
  stepId: string;
  stepTitle: string;
  onSave: (annotatedBlob: Blob) => void;
  onCancel: () => void;
}

export const ScreenshotAnnotationEditor = ({
  imageFile,
  moduleId,
  stepId,
  stepTitle,
  onSave,
  onCancel,
}: ScreenshotAnnotationEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("select");
  const [activeColor, setActiveColor] = useState("#EF4444");
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [numberCounter, setNumberCounter] = useState(1);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const tempShape = useRef<any>(null);
  const originalImageFile = useRef<File>(imageFile);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1000,
      height: 700,
      backgroundColor: "#ffffff",
    });

    // Load background image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl).then((img) => {
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        img.scale(scale);
        canvas.backgroundImage = img;
        canvas.renderAll();
        saveHistory(canvas);
      });
    };
    reader.readAsDataURL(imageFile);

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageFile]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      if (activeTool === "select") return;

      const pointer = fabricCanvas.getPointer(e.e);
      isDrawing.current = true;
      startPoint.current = new Point(pointer.x, pointer.y);

      if (activeTool === "crop") {
        // Remove existing crop rect if any
        if (cropRect) {
          fabricCanvas.remove(cropRect);
        }
        // Create new crop rectangle
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "hsl(var(--primary))",
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(rect);
        setCropRect(rect);
      } else if (activeTool === "arrow" || activeTool === "highlight") {
        // Create temporary shape for visual feedback
        if (activeTool === "arrow") {
          tempShape.current = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: activeColor,
            strokeWidth: 3,
            selectable: false,
          });
        } else if (activeTool === "highlight") {
          tempShape.current = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: `${activeColor}33`,
            stroke: activeColor,
            strokeWidth: 2,
            selectable: false,
          });
        }
        fabricCanvas.add(tempShape.current);
      } else if (activeTool === "number") {
        addNumberedCircle(pointer.x, pointer.y);
        isDrawing.current = false;
      } else if (activeTool === "text") {
        addTextCallout(pointer.x, pointer.y);
        isDrawing.current = false;
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing.current) return;

      const pointer = fabricCanvas.getPointer(e.e);

      if (activeTool === "crop" && cropRect) {
        const width = pointer.x - startPoint.current!.x;
        const height = pointer.y - startPoint.current!.y;
        cropRect.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPoint.current!.x,
          top: height < 0 ? pointer.y : startPoint.current!.y,
        });
        fabricCanvas.renderAll();
      } else if (!tempShape.current) {
        return;
      } else if (activeTool === "arrow") {
        tempShape.current.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      } else if (activeTool === "highlight") {
        const width = pointer.x - startPoint.current!.x;
        const height = pointer.y - startPoint.current!.y;
        tempShape.current.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPoint.current!.x,
          top: height < 0 ? pointer.y : startPoint.current!.y,
        });
      }

      fabricCanvas.renderAll();
    };

    const handleMouseUp = (e: any) => {
      if (!isDrawing.current) return;

      isDrawing.current = false;

      if (activeTool === "crop") {
        // Crop selection complete, keep it visible
        return;
      }

      if (tempShape.current) {
        const pointer = fabricCanvas.getPointer(e.e);

        if (activeTool === "arrow") {
          fabricCanvas.remove(tempShape.current);
          addArrow(
            startPoint.current!.x,
            startPoint.current!.y,
            pointer.x,
            pointer.y
          );
        } else if (activeTool === "highlight") {
          tempShape.current.set({ selectable: true });
          saveHistory(fabricCanvas);
        }

        tempShape.current = null;
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, activeTool, activeColor]);

  const saveHistory = (canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep((prev) => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0 && fabricCanvas) {
      const newStep = historyStep - 1;
      fabricCanvas.loadFromJSON(history[newStep]).then(() => {
        fabricCanvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && fabricCanvas) {
      const newStep = historyStep + 1;
      fabricCanvas.loadFromJSON(history[newStep]).then(() => {
        fabricCanvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const addArrow = (x1: number, y1: number, x2: number, y2: number) => {
    if (!fabricCanvas) return;

    const line = new Line([x1, y1, x2, y2], {
      stroke: activeColor,
      strokeWidth: 3,
    });

    // Calculate arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;
    const arrowHead = new Line(
      [
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6),
        x2,
        y2,
      ],
      {
        stroke: activeColor,
        strokeWidth: 3,
      }
    );
    const arrowHead2 = new Line(
      [
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6),
        x2,
        y2,
      ],
      {
        stroke: activeColor,
        strokeWidth: 3,
      }
    );

    const arrow = new Group([line, arrowHead, arrowHead2]);
    fabricCanvas.add(arrow);
    saveHistory(fabricCanvas);
  };

  const addNumberedCircle = (x: number, y: number) => {
    if (!fabricCanvas) return;

    const circle = new Circle({
      radius: 20,
      fill: activeColor,
    });

    const text = new FabricText(numberCounter.toString(), {
      fontSize: 18,
      fill: "#FFFFFF",
      fontWeight: "bold",
    });

    const group = new Group([circle, text], {
      left: x - 20,
      top: y - 20,
    });

    fabricCanvas.add(group);
    setNumberCounter((prev) => prev + 1);
    saveHistory(fabricCanvas);
  };

  const addTextCallout = (x: number, y: number) => {
    if (!fabricCanvas) return;

    const text = new Textbox("Click to edit", {
      left: x,
      top: y,
      fontSize: 16,
      fill: activeColor,
      backgroundColor: "rgba(255,255,255,0.9)",
      padding: 8,
      borderRadius: 4,
      width: 200,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
    saveHistory(fabricCanvas);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveHistory(fabricCanvas);
    }
  };

  const clearAll = () => {
    if (!fabricCanvas) return;
    fabricCanvas.getObjects().forEach((obj) => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
    setNumberCounter(1);
    saveHistory(fabricCanvas);
    toast.success("All annotations cleared");
  };

  const applyCrop = async () => {
    if (!fabricCanvas || !cropRect) return;

    const cropLeft = cropRect.left!;
    const cropTop = cropRect.top!;
    const cropWidth = cropRect.width!;
    const cropHeight = cropRect.height!;

    if (cropWidth < 10 || cropHeight < 10) {
      toast.error("Crop area too small");
      return;
    }

    // Get all objects except crop rect
    const objects = fabricCanvas.getObjects().filter((obj) => obj !== cropRect);

    // Create a temporary canvas element with the cropped dimensions
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    // Render the current canvas to get the full image with background
    const fullCanvas = fabricCanvas.toCanvasElement();
    
    // Draw the cropped portion
    tempCtx.drawImage(
      fullCanvas,
      cropLeft,
      cropTop,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert to blob and reload
    tempCanvas.toBlob((blob) => {
      if (!blob) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        FabricImage.fromURL(imgUrl).then((img) => {
          // Clear canvas
          fabricCanvas.clear();
          
          // Update canvas size
          fabricCanvas.setWidth(cropWidth);
          fabricCanvas.setHeight(cropHeight);
          
          // Set cropped image as background
          fabricCanvas.backgroundImage = img;
          
          // Adjust all object positions relative to crop origin
          objects.forEach((obj) => {
            const newLeft = (obj.left || 0) - cropLeft;
            const newTop = (obj.top || 0) - cropTop;
            
            // Only keep objects that are at least partially within bounds
            if (
              newLeft + (obj.width || 0) > 0 &&
              newTop + (obj.height || 0) > 0 &&
              newLeft < cropWidth &&
              newTop < cropHeight
            ) {
              obj.set({ left: newLeft, top: newTop });
              fabricCanvas.add(obj);
            }
          });
          
          fabricCanvas.renderAll();
          setCropRect(null);
          setActiveTool("select");
          saveHistory(fabricCanvas);
          toast.success("Image cropped successfully");
        });
      };
      reader.readAsDataURL(blob);
    }, "image/png");
  };

  const cancelCrop = () => {
    if (fabricCanvas && cropRect) {
      fabricCanvas.remove(cropRect);
      fabricCanvas.renderAll();
      setCropRect(null);
      setActiveTool("select");
    }
  };

  const handleSave = () => {
    if (!fabricCanvas) return;

    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    fabricCanvas.toCanvasElement().toBlob((blob) => {
      if (blob) {
        onSave(blob);
        toast.success("Annotation saved!");
      }
    }, 'image/png', 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Annotate Screenshot</h2>
          <p className="text-sm text-muted-foreground">
            {stepTitle} ({moduleId}/{stepId})
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AnnotationToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        activeColor={activeColor}
        onColorChange={setActiveColor}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onClear={clearAll}
        onSave={handleSave}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        isCropping={!!cropRect}
        onApplyCrop={applyCrop}
        onCancelCrop={cancelCrop}
      />

      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <canvas ref={canvasRef} className="border border-border rounded-lg shadow-lg" />
      </div>
    </div>
  );
};
