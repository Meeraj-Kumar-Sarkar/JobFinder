import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  Briefcase,
  Users,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/axios";
import type { Job } from "@/types";
import { toast } from "react-hot-toast";

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs/mine");
      const raw = res.data?.data ?? res.data?.jobs ?? res.data;
      setJobs(Array.isArray(raw) ? raw : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (job: Job) => {
    const newStatus = job.status === "active" ? "closed" : "active";
    try {
      await api.patch(`/jobs/${job._id}`, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j)),
      );
      toast.success(`Job marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update job status.");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Job Postings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your job listings
          </p>
        </div>
        <Link to="/employer/jobs/new">
          <Button id="post-new-job" className="gap-2">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-medium">No jobs posted yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first job listing to start receiving applications.
          </p>
          <Link to="/employer/jobs/new">
            <Button id="empty-post-job" className="mt-4">Post a Job</Button>
          </Link>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 flex-wrap hover:border-border/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  <Badge
                    variant="outline"
                    className={
                      job.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.jobType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {job.applicants} applicant{job.applicants !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/70">
                    Posted{" "}
                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/employer/jobs/${job._id}/applicants`}>
                  <Button
                    id={`view-applicants-${job._id}`}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Applicants
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    id={`job-menu-${job._id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(`/jobs/${job._id}`, "_blank")}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Public Page
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(job)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Mark as {job.status === "active" ? "Closed" : "Active"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(job._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
