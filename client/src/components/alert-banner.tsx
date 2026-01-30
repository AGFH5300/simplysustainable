import { X, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  type: "electricity" | "water";
  usage: number;
  threshold: number;
  onDismiss: () => void;
}

export function AlertBanner({ type, usage, threshold, onDismiss }: AlertBannerProps) {
  const percentage = Math.round(((usage - threshold) / threshold) * 100);
  const unit = type === "electricity" ? "kWh" : "L";
  
  return (
    <Alert className="mb-6 bg-warning text-warning-foreground border-warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">High Usage Alert</h3>
          <p className="text-sm opacity-90">
            {type === "electricity" ? "Electricity" : "Water"} usage is {percentage}% above your daily target ({usage}{unit} vs {threshold}{unit}). 
            Consider {type === "electricity" ? "turning off unused devices" : "reducing water consumption"}.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-warning-foreground hover:bg-warning/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
