import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "episode" | "highlight";
}

export function StatusBadge({ status, type = "episode" }: StatusBadgeProps) {
  const getGradientClass = () => {
    if (type === "episode") {
      switch (status) {
        case "completed":
          return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
        case "processing":
          return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
        case "failed":
          return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0";
        case "pending":
          return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
        default:
          return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
      }
    } else {
      // highlight - normalize "used" to "approved"
      const normalizedStatus = status === "used" ? "approved" : status;
      switch (normalizedStatus) {
        case "approved":
          return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
        case "pending":
          return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0";
        case "discarded":
          return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0";
        default:
          return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0";
      }
    }
  };

  const getDisplayText = () => {
    // Normalize "used" to "approved" for display
    const displayStatus = status === "used" ? "approved" : status;
    return displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);
  };

  return (
    <Badge variant="default" className={cn("text-xs", getGradientClass())}>
      {getDisplayText()}
    </Badge>
  );
}

