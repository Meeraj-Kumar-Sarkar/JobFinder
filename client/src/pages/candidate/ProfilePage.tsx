import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Plus, X, Save } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  resumeURL: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  experience: z.coerce.number().min(0).max(50),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      headline: user?.headline ?? "",
      bio: user?.bio ?? "",
      resumeURL: user?.resumeURL ?? "",
      experience: user?.experience ?? 0,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone ?? "",
        headline: user.headline ?? "",
        bio: user.bio ?? "",
        resumeURL: user.resumeURL ?? "",
        experience: user.experience ?? 0,
      });
      setSkills(user.skills ?? []);
    }
  }, [user, reset]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.patch("/users/profile", { ...data, skills });
      setUser(res.data?.data ?? res.data?.user);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* Avatar section */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 flex items-center gap-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.profileImage} />
          <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium">Full Name</label>
              <Input id="profile-name" placeholder="Jane Doe" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="text-sm font-medium">Phone</label>
              <Input id="profile-phone" placeholder="+1 555 0100" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-headline" className="text-sm font-medium">
              Headline <span className="text-muted-foreground text-xs">(max 120 chars)</span>
            </label>
            <Input
              id="profile-headline"
              placeholder="Senior Frontend Engineer at Acme Corp"
              {...register("headline")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="text-sm font-medium">
              Bio <span className="text-muted-foreground text-xs">(max 500 chars)</span>
            </label>
            <Textarea
              id="profile-bio"
              placeholder="A brief description about yourself..."
              rows={4}
              className="resize-none"
              {...register("bio")}
            />
          </div>
        </div>

        {/* Career Info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Career Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="profile-resume" className="text-sm font-medium">Resume URL</label>
              <Input
                id="profile-resume"
                type="url"
                placeholder="https://drive.google.com/..."
                {...register("resumeURL")}
              />
              {errors.resumeURL && (
                <p className="text-xs text-destructive">{errors.resumeURL.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-experience" className="text-sm font-medium">
                Years of Experience
              </label>
              <Input
                id="profile-experience"
                type="number"
                min={0}
                max={50}
                {...register("experience")}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-2 min-h-8">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="skill-input"
                placeholder="Add a skill…"
                value={skillInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button
                id="add-skill-btn"
                type="button"
                variant="outline"
                size="icon"
                onClick={addSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button
          id="save-profile"
          type="submit"
          className="w-full h-11 gap-2"
          disabled={loading}
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </motion.div>
  );
}
