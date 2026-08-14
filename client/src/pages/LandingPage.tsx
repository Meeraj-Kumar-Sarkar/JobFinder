import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Loader2, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import api from "@/lib/axios";
import type { Job, JobFilters as Filters } from "@/types";

const EMPTY_FILTERS: Filters = {};

export default function LandingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: reset ? 1 : page,
        limit: 12,
      };
      if (search) params.search = search;
      if (filters.location) params.location = filters.location;
      if (filters.jobType) params.jobType = filters.jobType;
      if (filters.minExperience !== undefined)
        params.minExperience = filters.minExperience;

      const res = await api.get("/jobs", { params });
      const rawData = res.data?.data ?? res.data?.jobs ?? res.data;
      const data: Job[] = Array.isArray(rawData) ? rawData : [];

      if (reset) {
        setJobs(data);
        setPage(1);
      } else {
        setJobs((prev) => [...(Array.isArray(prev) ? prev : []), ...data]);
      }
      setHasMore(data.length === 12);
    } catch {
      setJobs((prev) => (Array.isArray(prev) ? prev : []));
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  // Re-fetch when search/filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchJobs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      {/* Hero */}
      <section className="py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Your{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Dream Job
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Browse thousands of opportunities from top companies. Apply in
            minutes, track your progress in one place.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-8 flex max-w-xl items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="job-search"
              className="pl-9 h-11"
              placeholder="Job title, skill or keyword…"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          {/* Mobile filter trigger */}
          <Sheet>
            <SheetTrigger
              id="mobile-filters-trigger"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-input bg-background hover:bg-accent lg:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <JobFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      </section>

      {/* Main Grid */}
      <div className="flex gap-8">
        {/* Sidebar Filters — desktop */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">
            <JobFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(EMPTY_FILTERS)}
            />
          </div>
        </aside>

        {/* Job listings */}
        <div className="flex-1">
          {/* Result count */}
          {!loading && (
            <p className="mb-4 text-sm text-muted-foreground">
              {jobs.length > 0
                ? `Showing ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`
                : "No jobs found"}
            </p>
          )}

          {/* Initial loading */}
          {loading && jobs.length === 0 && (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!loading && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or clearing the filters.
              </p>
              <Button
                id="reset-search"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setFilters(EMPTY_FILTERS);
                }}
              >
                Reset Search
              </Button>
            </div>
          )}

          {/* Grid */}
          <AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(Array.isArray(jobs) ? jobs : []).map((job, i) => (
                <JobCard key={job._id} job={job} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {/* Load more */}
          {hasMore && !loading && jobs.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                id="load-more-jobs"
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                Load More Jobs
              </Button>
            </div>
          )}

          {/* Loading more spinner */}
          {loading && jobs.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
