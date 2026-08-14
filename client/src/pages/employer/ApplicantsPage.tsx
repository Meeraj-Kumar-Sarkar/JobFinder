import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Users,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusUpdater } from "@/components/applications/StatusUpdater";
import { StatusBadge } from "@/components/applications/StatusBadge";
import api from "@/lib/axios";
import type { Application, ApplicationStatus } from "@/types";

const STAGES: ApplicationStatus[] = [
  "Applied",
  "Screening",
  "Technical",
  "HR",
  "Offer",
  "Hired",
  "Rejected",
];

const stageColors: Record<ApplicationStatus, string> = {
  Applied: "border-sky-500/20 bg-sky-500/5",
  Screening: "border-violet-500/20 bg-violet-500/5",
  Technical: "border-amber-500/20 bg-amber-500/5",
  HR: "border-orange-500/20 bg-orange-500/5",
  Offer: "border-emerald-500/20 bg-emerald-500/5",
  Hired: "border-green-500/20 bg-green-500/5",
  Rejected: "border-red-500/20 bg-red-500/5",
};

export default function ApplicantsPage() {
  const { id } = useParams(); // job id
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pipeline" | "table">("pipeline");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/jobs/${id}/applications`);
        const raw = res.data?.data ?? res.data?.applications ?? res.data;
        setApplications(Array.isArray(raw) ? raw : []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusUpdate = (appId: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a)),
    );
  };

  const byStage = (stage: ApplicationStatus) =>
    applications.filter((a) => a.status === stage);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const firstJob =
    applications[0] && typeof applications[0].job === "object"
      ? applications[0].job
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-6">
        <Button
          id="back-to-manage-jobs"
          variant="ghost"
          size="sm"
          className="mb-3 gap-1.5 -ml-2"
          onClick={() => navigate("/employer/jobs")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {firstJob?.title ?? "Applicants"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-4 w-4" />
              {applications.length} total applicant
              {applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          {firstJob && (
            <Link to={`/jobs/${firstJob._id}`} target="_blank">
              <Button
                id="view-job-public"
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                View Job <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-medium">No applications yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applications will appear here once candidates start applying.
          </p>
        </div>
      )}

      {applications.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as "pipeline" | "table")}
        >
          <TabsList className="mb-6" id="applicants-tabs">
            <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          {/* Pipeline View — Columns per stage */}
          <TabsContent value="pipeline">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
              {STAGES.map((stage) => {
                const stageApps = byStage(stage);
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={stage} />
                      <span className="text-xs text-muted-foreground">
                        {stageApps.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageApps.length === 0 && (
                        <div
                          className={`rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground ${stageColors[stage]}`}
                        >
                          Empty
                        </div>
                      )}
                      {stageApps.map((app) => {
                        const candidate =
                          typeof app.candidate === "object"
                            ? app.candidate
                            : null;
                        const initials = candidate?.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <div
                            key={app._id}
                            className={`rounded-lg border p-3 space-y-2 ${stageColors[stage]}`}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-xs font-medium truncate">
                                {candidate?.name ?? "Candidate"}
                              </p>
                            </div>

                            {candidate?.headline && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {candidate.headline}
                              </p>
                            )}

                            {/* Quick actions */}
                            <div className="flex gap-1.5 flex-wrap">
                              {stage !== "Hired" && stage !== "Rejected" && (
                                <>
                                  {/* Promote */}
                                  {(() => {
                                    const idx = STAGES.indexOf(stage);
                                    const promoteStages = [
                                      "Screening",
                                      "Technical",
                                      "HR",
                                      "Offer",
                                      "Hired",
                                    ] as ApplicationStatus[];
                                    const next = promoteStages.find(
                                      (s) => STAGES.indexOf(s) > idx,
                                    );
                                    if (!next) return null;
                                    return (
                                      <Button
                                        id={`promote-card-${app._id}`}
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500"
                                        onClick={async () => {
                                          try {
                                            await api.patch(
                                              `/applications/${app._id}/status`,
                                              { status: next },
                                            );
                                            handleStatusUpdate(app._id, next);
                                          } catch {
                                            // no-op
                                          }
                                        }}
                                      >
                                        → {next}
                                      </Button>
                                    );
                                  })()}
                                  <Button
                                    id={`reject-card-${app._id}`}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={async () => {
                                      try {
                                        await api.patch(
                                          `/applications/${app._id}/status`,
                                          { status: "Rejected" },
                                        );
                                        handleStatusUpdate(app._id, "Rejected");
                                      } catch {
                                        // no-op
                                      }
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {app.resumeURL && (
                                <a
                                  href={app.resumeURL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-6 items-center gap-0.5 rounded-md px-2 text-xs text-primary hover:underline border border-primary/20"
                                >
                                  CV <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table">
            <div className="space-y-3">
              {applications.map((app, i) => {
                const candidate =
                  typeof app.candidate === "object" ? app.candidate : null;
                const initials = candidate?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <motion.div
                    key={app._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-4 flex-wrap">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {candidate?.name ?? "Candidate"}
                          </p>
                          {candidate?.headline && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {candidate.headline}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {candidate?.email && (
                              <span className="flex items-center gap-0.5">
                                <Mail className="h-3 w-3" />
                                {candidate.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Updater */}
                      <div className="flex-1">
                        <StatusUpdater
                          applicationId={app._id}
                          currentStatus={app.status}
                          onUpdated={(s) => handleStatusUpdate(app._id, s)}
                        />
                        {app.coverLetter && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 max-w-lg">
                            &ldquo;{app.coverLetter}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Applied date + resume */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {app.resumeURL && (
                          <a
                            href={app.resumeURL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Resume <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
