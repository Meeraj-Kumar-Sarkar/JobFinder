import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/applications/StatusBadge";
import api from "@/lib/axios";
import type { DashboardStats, Application } from "@/types";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  index?: number;
}

function StatCard({ title, value, icon, description, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
    >
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/dashboard/employer");
        setStats(res.data?.data ?? res.data);
      } catch {
        // no-op
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your hiring activity
          </p>
        </div>
        <Link to="/employer/jobs/new">
          <Button id="post-job-cta">Post a Job</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard
          title="Total Jobs Posted"
          value={stats?.totalJobs ?? 0}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          index={0}
        />
        <StatCard
          title="Active Listings"
          value={stats?.activeJobs ?? 0}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          description="Currently accepting applications"
          index={1}
        />
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications ?? 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          index={2}
        />
        <StatCard
          title="Hired"
          value={
            stats?.recentApplications?.filter((a) => a.status === "Hired")
              .length ?? 0
          }
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          description="Successfully hired candidates"
          index={3}
        />
      </div>

      {/* Recent Applications */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Recent Applications</h2>
          <Link to="/employer/jobs">
            <Button id="view-all-jobs" variant="ghost" size="sm" className="flex items-center gap-1 text-sm">
              View All Jobs <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {!stats?.recentApplications?.length && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No applications yet. Post a job to get started.
            </p>
          </div>
        )}

        {(stats?.recentApplications?.length ?? 0) > 0 && (
          <div className="divide-y divide-border">
            {stats?.recentApplications?.slice(0, 8).map((app: Application) => {
              const candidate =
                typeof app.candidate === "object" ? app.candidate : null;
              const job = typeof app.job === "object" ? app.job : null;
              return (
                <div
                  key={app._id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {candidate?.name ?? "Candidate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied for{" "}
                      {job ? (
                        <Link
                          to={`/employer/jobs/${job._id}/applicants`}
                          className="text-foreground hover:underline"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        "Unknown job"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
