import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/applications/StatusBadge";
import api from "@/lib/axios";
import type { Application } from "@/types";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/applications/my");
        const raw = res.data?.data ?? res.data?.applications ?? res.data;
        setApplications(Array.isArray(raw) ? raw : []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of all your job applications
        </p>
      </div>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-medium">No applications yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start browsing jobs and apply!
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Resume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const job = typeof app.job === "object" ? app.job : null;
                const company =
                  job && typeof job.company === "object" ? job.company : null;
                return (
                  <TableRow key={app._id}>
                    <TableCell className="font-medium">
                      {job ? (
                        <Link
                          to={`/jobs/${job._id}`}
                          className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(app.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                      {app.feedback && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {app.feedback}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {app.resumeURL && (
                        <a
                          href={app.resumeURL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
