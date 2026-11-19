import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  applicationsApi,
  type Application,
  type Job,
  type AiInterviewSession,
} from "../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Play,
  Send,
  Sparkles,
  AlertCircle,
} from "lucide-react";

function LiveAiInterview() {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [application, setApplication] = useState<Application | null>(null);
  const [session, setSession] = useState<AiInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interview runtime states
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      if (!applicationId) return;
      setLoading(true);
      setError("");

      try {
        let appData: Application | null = null;
        try {
          const res = await applicationsApi.getById(applicationId);
          appData = res?.data?.application || res?.data || res;
        } catch {
          // Fallback: search within candidate's applications
          const myRes = await applicationsApi.getMyApplications();
          const list: Application[] =
            myRes?.data?.applications || myRes?.applications || [];
          appData = list.find((a) => a._id === applicationId) || null;
        }

        if (!appData) {
          setError("Interview session not found or you do not have access.");
          return;
        }

        setApplication(appData);
        const ai = appData.aiInterview;
        if (!ai || !ai.enabled) {
          setError(
            "The employer has not enabled a Live AI Q&A Interview for this application stage.",
          );
          return;
        }

        setSession(ai);
        if (ai.status === "completed") {
          setCompleted(true);
        }

        const initialAnswers: Record<number, string> = {};
        (ai.questions || []).forEach((q, idx) => {
          initialAnswers[q.questionNumber || idx + 1] = q.candidateAnswer || "";
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error("Failed to load AI interview session:", err);
        setError("Unable to load the AI interview room. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [applicationId]);

  const jobObj =
    application && typeof application.job === "object"
      ? (application.job as Job)
      : null;
  const companyName =
    jobObj && typeof jobObj.company === "object" && jobObj.company !== null
      ? jobObj.company.name
      : "Hiring Company";

  const questions = session?.questions || [];
  const currentQuestion = questions[currentIndex];
  const currentQNum = currentQuestion?.questionNumber || currentIndex + 1;
  const currentAnswerText = answers[currentQNum] || "";
  const answeredCount = questions.filter((q, idx) =>
    Boolean((answers[q.questionNumber || idx + 1] || "").trim()),
  ).length;

  const scheduledDateObj = session?.scheduledDate
    ? new Date(session.scheduledDate)
    : application?.interviewDate
      ? new Date(application.interviewDate)
      : null;

  const isFutureDate =
    scheduledDateObj && scheduledDateObj.getTime() > Date.now() + 15 * 60 * 1000;

  const handleSubmitInterview = async () => {
    if (!applicationId || !session) return;

    const unanswered = questions.length - answeredCount;
    if (
      unanswered > 0 &&
      !window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway for AI evaluation?`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q, idx) => {
        const qNum = q.questionNumber || idx + 1;
        return {
          questionNumber: qNum,
          answer: (answers[qNum] || "").trim(),
        };
      });

      const res = await applicationsApi.submitAiInterview(
        applicationId,
        formattedAnswers,
        session,
      );

      const updatedAi: AiInterviewSession =
        res?.data?.aiInterview ||
        res?.data?.application?.aiInterview || {
          ...session,
          status: "completed",
          report: res?.data?.report,
        };

      setSession(updatedAi);
      setCompleted(true);
      toast.success(
        "Interview submitted! AI evaluation report has been generated and sent to the hiring team.",
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Failed to submit interview answers. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Workspace
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            AI Technical & Role Assessment Room
          </span>
        </div>

        {loading ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-slate-600">
              Initializing Live AI Interview Room...
            </p>
          </div>
        ) : error ? (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              Interview Room Unavailable
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {error}
            </p>
            <Link
              to="/dashboard"
              className="btn-premium mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white"
            >
              Return to Candidate Dashboard
            </Link>
          </div>
        ) : completed ? (
          /* COMPLETED STATE */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 sm:p-10 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <FileCheck2 className="h-8 w-8" />
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AI Evaluation Report Delivered to Employer
            </span>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Live AI Q&A Interview Completed
            </h1>

            <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Your responses for{" "}
              <strong className="text-slate-900">
                {jobObj?.title || "this role"}
              </strong>{" "}
              at <strong className="text-slate-900">{companyName}</strong> have been evaluated and scored by our AI assessment engine. The hiring team has received your full Q&A report to review for the next ATS stage.
            </p>

            {session?.report && (
              <div className="mt-6 mx-auto max-w-xl rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-5 text-left">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      AI Assessment Score
                    </p>
                    <p className="text-2xl font-extrabold text-indigo-950 mt-0.5">
                      {session.report.overallScore} / 100
                    </p>
                  </div>
                  <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-indigo-700 border border-indigo-200">
                    {session.report.verdict}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-indigo-900">
                  {session.report.summary}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="btn-premium inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white"
              >
                Track Next Stage in Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/notifications"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Open Notifications & Messages
              </Link>
            </div>
          </motion.div>
        ) : !started ? (
          /* LOBBY / BRIEFING SCREEN BEFORE STARTING */
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 sm:p-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {companyName}
                  </span>
                  <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {jobObj?.title || "Live AI Q&A Interview"}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Stage: <strong className="text-slate-700">{application?.status}</strong> •{" "}
                    {questions.length} AI-Generated Questions
                  </p>
                </div>
              </div>

              {scheduledDateObj && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-xs">
                  <p className="font-bold text-violet-900 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-violet-600" />
                    Scheduled Date & Time
                  </p>
                  <p className="mt-1 font-semibold text-violet-700">
                    {scheduledDateObj.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              )}
            </div>

            {isFutureDate && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800">
                <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Scheduled for {scheduledDateObj?.toLocaleString()}
                  </p>
                  <p className="mt-0.5">
                    You have joined ahead of the scheduled time. You may begin the interview now or return at the scheduled time.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Questions
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {questions.length} Questions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Focus Topics
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">
                  {session?.topicFocus ||
                    (jobObj?.requirements || []).slice(0, 3).join(", ") ||
                    "Role Core Competencies"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Evaluation Mode
                </p>
                <p className="mt-1 text-sm font-bold text-indigo-600">
                  AI Scored + Hiring Manager Report
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/60 p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm">
                How this Live AI Q&A Interview works:
              </p>
              <p>
                1. The AI Interviewer will ask you <strong>{questions.length} role-specific questions</strong> generated from the job requirements and hiring manager's topic focus.
              </p>
              <p>
                2. Provide clear, concrete examples and explain your technical reasoning or architectural trade-offs for each question.
              </p>
              <p>
                3. When you submit your interview, the AI evaluates your responses, computes a score and detailed report, and stores it directly in the employer's ATS pipeline for stage advancement.
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="btn-premium inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white"
              >
                <Play className="h-4 w-4" />
                Join & Start Live Q&A Interview
              </button>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE LIVE Q&A INTERVIEW SESSION */
          <div className="space-y-6">
            {/* Top Progress Header */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600">
                    {jobObj?.title || "Role Interview"} • {companyName}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Question {currentIndex + 1} of {questions.length}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {answeredCount} / {questions.length} Answered
                  </span>
                </div>
              </div>

              {/* Step Pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const qNum = q.questionNumber || idx + 1;
                  const hasAns = Boolean((answers[qNum] || "").trim());
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={qNum}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-extrabold transition ${
                        isCurrent
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : hasAns
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      Q{idx + 1} {hasAns && !isCurrent ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Question Card */}
            {currentQuestion && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.25 }}
                  className="glass-panel rounded-3xl p-6 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
                      <Bot className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-[11px] font-bold text-indigo-700">
                          Topic: {currentQuestion.topic || "Role Competency"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          AI Interviewer Prompt #{currentIndex + 1}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base sm:text-lg font-extrabold leading-relaxed text-slate-900">
                        {currentQuestion.question}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Your Detailed Response *
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {currentAnswerText.trim()
                          ? `${currentAnswerText.trim().split(/\s+/).length} words`
                          : "0 words"}
                      </span>
                    </div>

                    <textarea
                      rows={7}
                      value={currentAnswerText}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQNum]: e.target.value,
                        }))
                      }
                      placeholder="Type your response here. Include technical details, examples, and reasoning..."
                      className="w-full resize-y rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  {/* Navigation & Final Submit Footer */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() =>
                        setCurrentIndex((prev) => Math.max(0, prev - 1))
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous Question
                    </button>

                    <div className="flex items-center gap-3">
                      {currentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentIndex((prev) =>
                              Math.min(questions.length - 1, prev + 1),
                            )
                          }
                          className="btn-premium inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white"
                        >
                          Save & Next Question
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSubmitInterview}
                          className="btn-premium inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {submitting
                            ? "AI Evaluating Responses..."
                            : "Submit Interview for AI Evaluation"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default LiveAiInterview;
