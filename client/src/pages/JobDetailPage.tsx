import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  Loader2,
  Building2,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/jobs/ApplyDialog";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { Job } from "@/types";

function formatSalary(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  if (!min && !max) return "Not disclosed";
  if (!max) return `${fmt(min)}+`;
  return `${fmt(min)} – ${fmt(max)} / year`;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data?.data ?? res.data?.job ?? res.data);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) return null;

  const company =
    typeof job.company === "object" ? job.company : { name: "Unknown" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      {/* Back */}
      <Button
        id="back-to-jobs"
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 -ml-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Button>

      {/* Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground">{company.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                job.status === "active"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-border"
              }
            >
              {job.status === "active" ? "Actively Hiring" : "Closed"}
            </Badge>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" />
            {job.jobType}
          </span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          )}
          {job.experience > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {job.experience}+ years experience
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Posted{" "}
            {new Date(job.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Apply CTA */}
        {user?.role === "candidate" && job.status === "active" && (
          <div className="mt-6">
            <Button
              id="apply-now-btn"
              size="lg"
              onClick={() => setApplyOpen(true)}
              className="min-w-[140px]"
            >
              Apply Now
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              {job.applicants} applicant{job.applicants !== 1 ? "s" : ""} so far
            </p>
          </div>
        )}

        {!user && (
          <p className="mt-6 text-sm text-muted-foreground">
            <a
              href="/login"
              className="underline underline-offset-4 text-foreground"
            >
              Sign in
            </a>{" "}
            to apply for this job.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {job.description && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Job Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </section>
          )}

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Benefits */}
          {job.benefits?.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                Benefits
              </h3>
              <ul className="space-y-1.5">
                {job.benefits.map((b: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills Tags */}
          {job.requirements?.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Key Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requirements.slice(0, 8).map((r: string) => (
                  <span
                    key={r}
                    className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {job && (
        <ApplyDialog job={job} open={applyOpen} onOpenChange={setApplyOpen} />
      )}
    </motion.div>
  );
}
