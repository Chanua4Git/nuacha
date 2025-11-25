import { ArrowRight, Hash, Square, Type, Undo2, Redo2, Trash2, Eraser, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type AnnotationTool = "select" | "arrow" | "number" | "highlight" | "text";

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const PRESET_COLORS = ["#EF4444", "#3B82F6", "#FCD34D", "#22C55E", "#8B5CF6", "#EC4899"];

export const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  onUndo,
  onRedo,
  onDelete,
  onClear,
  onSave,
  canUndo,
  canRedo,
}: AnnotationToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-background border-b">
      <div className="flex items-center gap-1 border-r pr-3">
        <Button
          variant={activeTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("select")}
          title="Select (V)"
        >
          <span className="text-sm">Select</span>
        </Button>
        <Button
          variant={activeTool === "arrow" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("arrow")}
          title="Arrow (A)"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "number" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("number")}
          title="Number (N)"
        >
          <Hash className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "highlight" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("highlight")}
          title="Highlight (H)"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === "text" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("text")}
          title="Text (T)"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: activeColor }}
            />
            Color
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <div className="space-y-3">
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: color === activeColor ? "hsl(var(--primary))" : "transparent",
                  }}
                  onClick={() => onColorChange(color)}
                />
              ))}
            </div>
            <HexColorPicker color={activeColor} onChange={onColorChange} />
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1 border-l pl-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="Delete Selected (Del)"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          title="Clear All"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto">
        <Button onClick={onSave} size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save Annotation
        </Button>
      </div>
    </div>
  );
};
