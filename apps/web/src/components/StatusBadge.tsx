import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "episode" | "highlight";
}

export function StatusBadge({ status, type = "episode" }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === "episode") {
      switch (status) {
        case "completed":
          return "default";
        case "processing":
          return "secondary";
        case "failed":
          return "destructive";
        case "pending":
          return "outline";
        default:
          return "outline";
      }
    } else {
      // highlight
      switch (status) {
        case "used":
          return "default";
        case "pending":
          return "secondary";
        case "discarded":
          return "outline";
        default:
          return "outline";
      }
    }
  };

  const getColor = () => {
    if (type === "episode") {
      switch (status) {
        case "completed":
          return "text-green-600 bg-green-50 border-green-200";
        case "processing":
          return "text-blue-600 bg-blue-50 border-blue-200";
        case "failed":
          return "text-red-600 bg-red-50 border-red-200";
        case "pending":
          return "text-gray-600 bg-gray-50 border-gray-200";
        default:
          return "";
      }
    } else {
      switch (status) {
        case "used":
          return "text-green-600 bg-green-50 border-green-200";
        case "pending":
          return "text-yellow-600 bg-yellow-50 border-yellow-200";
        case "discarded":
          return "text-gray-600 bg-gray-50 border-gray-200";
        default:
          return "";
      }
    }
  };

  return (
    <Badge variant={getVariant()} className={cn(getColor())}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

