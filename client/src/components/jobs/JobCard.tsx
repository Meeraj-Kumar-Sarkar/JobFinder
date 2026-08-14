import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  index?: number;
}

const jobTypeColors: Record<string, string> = {
  "Full Time": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Part Time": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Contract: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Remote: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Internship: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

function formatSalary(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  if (!min && !max) return "Not disclosed";
  if (!max) return `${fmt(min)}+`;
  return `${fmt(min)} – ${fmt(max)}`;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const colorClass =
    jobTypeColors[job.jobType] ||
    "bg-muted text-muted-foreground border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group relative overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Accent strip */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Company logo placeholder */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Badge */}
            <Badge
              variant="outline"
              className={`shrink-0 text-xs font-medium ${colorClass}`}
            >
              {job.jobType}
            </Badge>
          </div>

          <div className="mt-3">
            <h3 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {typeof job.company === "object"
                ? job.company.name
                : "Unknown Company"}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
            )}
            {job.experience > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.experience}+ yrs
              </span>
            )}
          </div>

          {job.requirements?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requirements.slice(0, 3).map((req) => (
                <span
                  key={req}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {req}
                </span>
              ))}
              {job.requirements.length > 3 && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{job.requirements.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <Link to={`/jobs/${job._id}`}>
            <Button
              id={`view-job-${job._id}`}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              View Details
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
