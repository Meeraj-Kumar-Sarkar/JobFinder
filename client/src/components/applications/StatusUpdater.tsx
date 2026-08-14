import { useState } from "react";
import { toast } from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import type { ApplicationStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";

const PIPELINE: ApplicationStatus[] = [
  "Applied",
  "Screening",
  "Technical",
  "HR",
  "Offer",
  "Hired",
  "Rejected",
];

// Statuses that are "next steps" (promote)
const PROMOTE_STATUSES: ApplicationStatus[] = [
  "Screening",
  "Technical",
  "HR",
  "Offer",
  "Hired",
];

interface StatusUpdaterProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onUpdated: (newStatus: ApplicationStatus) => void;
}

export function StatusUpdater({
  applicationId,
  currentStatus,
  onUpdated,
}: StatusUpdaterProps) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ApplicationStatus>(currentStatus);

  const handleUpdate = async () => {
    if (selected === currentStatus) return;
    setLoading(true);
    try {
      await api.patch(`/applications/${applicationId}/status`, {
        status: selected,
      });
      onUpdated(selected);
      toast.success(`Status updated to "${selected}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
      setSelected(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = PIPELINE.indexOf(currentStatus);
  const nextStatus = PROMOTE_STATUSES.find(
    (s) => PIPELINE.indexOf(s) > currentIdx,
  );

  const handleQuickPromote = async () => {
    if (!nextStatus) return;
    setSelected(nextStatus);
    setLoading(true);
    try {
      await api.patch(`/applications/${applicationId}/status`, {
        status: nextStatus,
      });
      onUpdated(nextStatus);
      toast.success(`Promoted to "${nextStatus}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
      setSelected(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (currentStatus === "Rejected") return;
    setSelected("Rejected");
    setLoading(true);
    try {
      await api.patch(`/applications/${applicationId}/status`, {
        status: "Rejected",
      });
      onUpdated("Rejected");
      toast.success("Application rejected");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
      setSelected(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Current status badge */}
      <StatusBadge status={selected} />

      {/* Status dropdown for full control */}
      <Select
        value={selected}
        onValueChange={(v) => setSelected(v as ApplicationStatus)}
        disabled={loading}
      >
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected !== currentStatus && (
        <Button
          id={`apply-status-${applicationId}`}
          size="sm"
          className="h-7 text-xs"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Saving…" : "Apply"}
        </Button>
      )}

      {/* Quick action buttons */}
      {currentStatus !== "Hired" && currentStatus !== "Rejected" && (
        <div className="flex gap-1.5">
          {nextStatus && (
            <Button
              id={`promote-${applicationId}`}
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={handleQuickPromote}
              disabled={loading}
            >
              <ChevronRight className="h-3 w-3" />
              Promote to {nextStatus}
            </Button>
          )}
          <Button
            id={`reject-${applicationId}`}
            size="sm"
            variant="outline"
            className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleReject}
            disabled={loading}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
