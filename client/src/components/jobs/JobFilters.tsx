import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobFilters as Filters } from "@/types";

interface JobFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Remote", "Internship"];

export function JobFilters({ filters, onChange, onClear }: JobFiltersProps) {
  const hasActive =
    filters.location ||
    filters.jobType ||
    filters.minExperience !== undefined;

  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasActive && (
          <Button
            id="clear-filters"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Location
          </label>
          <Input
            id="filter-location"
            placeholder="City, state or remote"
            value={filters.location || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...filters, location: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Job Type
          </label>
          <Select
            value={filters.jobType || "all"}
            onValueChange={(v: string | null) =>
              onChange({ ...filters, jobType: !v || v === "all" ? undefined : v })
            }
          >
            <SelectTrigger id="filter-job-type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {JOB_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Min. Experience (years)
          </label>
          <Select
            value={filters.minExperience?.toString() || "any"}
            onValueChange={(v: string | null) =>
              onChange({
                ...filters,
                minExperience: !v || v === "any" ? undefined : Number(v),
              })
            }
          >
            <SelectTrigger id="filter-experience">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {[0, 1, 2, 3, 5, 7, 10].map((yr) => (
                <SelectItem key={yr} value={yr.toString()}>
                  {yr === 0 ? "Fresher" : `${yr}+ years`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}
