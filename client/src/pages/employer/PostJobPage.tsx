import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Plus, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(20, "Please provide a more detailed description"),
  location: z.string().min(2, "Location is required"),
  jobType: z.string(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  experience: z.coerce.number().min(0).max(50),
});

interface PostJobFormData {
  title: string;
  description: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  experience: number;
}

const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Remote", "Internship"];

export default function PostJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");
  const [benInput, setBenInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostJobFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { jobType: "Full Time", experience: 0 },
  });

  const jobType = watch("jobType");

  const addTag = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    const t = val.trim();
    if (t && !list.includes(t)) setList([...list, t]);
    setInput("");
  };

  const onSubmit = async (data: PostJobFormData) => {
    setLoading(true);
    try {
      const res = await api.post("/jobs", {
        ...data,
        requirements,
        benefits,
      });
      const createdJob = res.data?.data ?? res.data?.job;
      toast.success("Job posted successfully!");
      navigate(`/employer/jobs/${createdJob?._id ?? ""}/applicants`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <Button
        id="back-to-jobs-employer"
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 -ml-2"
        onClick={() => navigate("/employer/jobs")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Jobs
      </Button>

      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Details */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Job Details</h2>

          <div className="space-y-1.5">
            <label htmlFor="job-title" className="text-sm font-medium">
              Job Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="job-title"
              placeholder="e.g. Senior React Developer"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="job-description" className="text-sm font-medium">
              Job Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="job-description"
              placeholder="Describe the role, responsibilities, team culture..."
              rows={6}
              className="resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="job-location" className="text-sm font-medium">
                Location <span className="text-destructive">*</span>
              </label>
              <Input
                id="job-location"
                placeholder="San Francisco, CA or Remote"
                {...register("location")}
              />
              {errors.location && (
                <p className="text-xs text-destructive">
                  {errors.location.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Type</label>
              <Select
                value={jobType}
                onValueChange={(v: string | null) => {
                  if (v) setValue("jobType", v);
                }}
              >
                <SelectTrigger id="job-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="job-salary-min" className="text-sm font-medium">
                Min. Salary ($)
              </label>
              <Input
                id="job-salary-min"
                type="number"
                min={0}
                placeholder="60000"
                {...register("salaryMin")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="job-salary-max" className="text-sm font-medium">
                Max. Salary ($)
              </label>
              <Input
                id="job-salary-max"
                type="number"
                min={0}
                placeholder="100000"
                {...register("salaryMax")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="job-experience" className="text-sm font-medium">
                Exp. (years)
              </label>
              <Input
                id="job-experience"
                type="number"
                min={0}
                max={50}
                {...register("experience")}
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold">Requirements</h2>
          <div className="flex flex-wrap gap-2 min-h-8">
            {requirements.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {r}
                <button
                  type="button"
                  onClick={() =>
                    setRequirements((prev) => prev.filter((x) => x !== r))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="req-input"
              placeholder="e.g. 3+ years React experience"
              value={reqInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReqInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(reqInput, requirements, setRequirements, setReqInput);
                }
              }}
            />
            <Button
              id="add-req-btn"
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                addTag(reqInput, requirements, setRequirements, setReqInput)
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold">Benefits</h2>
          <div className="flex flex-wrap gap-2 min-h-8">
            {benefits.map((b) => (
              <span
                key={b}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {b}
                <button
                  type="button"
                  onClick={() =>
                    setBenefits((prev) => prev.filter((x) => x !== b))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="ben-input"
              placeholder="e.g. Health insurance, 401k"
              value={benInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBenInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(benInput, benefits, setBenefits, setBenInput);
                }
              }}
            />
            <Button
              id="add-ben-btn"
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                addTag(benInput, benefits, setBenefits, setBenInput)
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          id="submit-job"
          type="submit"
          className="w-full h-11"
          disabled={loading}
        >
          {loading ? "Posting…" : "Post Job"}
        </Button>
      </form>
    </motion.div>
  );
}
