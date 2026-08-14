import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/axios";
import type { Job } from "@/types";

const schema = z.object({
  resumeURL: z.string().url("Please enter a valid resume URL"),
  coverLetter: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

interface ApplyDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyDialog({ job, open, onOpenChange }: ApplyDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post("/applications", {
        jobId: job._id,
        ...data,
      });
      toast.success("Application submitted successfully!");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Failed to submit application. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            {typeof job.company === "object" ? job.company.name : ""}
          </DialogDescription>
        </DialogHeader>

        <form id="apply-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="apply-resume" className="text-sm font-medium">
              Resume URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="apply-resume"
              type="url"
              placeholder="https://drive.google.com/your-resume"
              {...register("resumeURL")}
            />
            {errors.resumeURL && (
              <p className="text-xs text-destructive">
                {errors.resumeURL.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apply-cover" className="text-sm font-medium">
              Cover Letter{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Textarea
              id="apply-cover"
              placeholder="Tell the employer why you're a great fit..."
              rows={5}
              className="resize-none"
              {...register("coverLetter")}
            />
            {errors.coverLetter && (
              <p className="text-xs text-destructive">
                {errors.coverLetter.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            id="apply-cancel"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            id="apply-submit"
            type="submit"
            form="apply-form"
            disabled={loading}
          >
            {loading ? "Submitting…" : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
