
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jobs } from "../data/jobs";

function Jobs() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("All");
  const [jobType, setJobType] = useState("All");
  const [sort, setSort] = useState("default");

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        job.location.toLowerCase().includes(location.toLowerCase());

      const matchesCategory =
        category === "All" || job.category === category;

      const matchesType =
        jobType === "All" || job.type === jobType;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesType
      );
    });

    if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sort === "salary") {
      result.sort((a, b) => {
        const salaryA = Number(a.salary.match(/\d+/)?.[0] || 0);
        const salaryB = Number(b.salary.match(/\d+/)?.[0] || 0);
        return salaryB - salaryA;
      });
    }

    return result;
  }, [search, location, category, jobType, sort]);

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("All");
    setJobType("All");
    setSort("default");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">

        <Link to="/" className="mb-6 inline-block font-semibold text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-slate-900">
          Find Your Dream Job
        </h1>

        <p className="mt-3 text-slate-600">
          Explore opportunities from different companies.
        </p>

        {/* Search and Filters */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="grid gap-4 md:grid-cols-2">

            <input
              type="text"
              placeholder="Search job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border p-3 outline-none focus:border-blue-500"
            />

            <input
              type="text"
              placeholder="Search location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl border p-3 outline-none focus:border-blue-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border p-3 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
            </select>

            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="rounded-xl border p-3 outline-none"
            >
              <option value="All">All Job Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Freelance">Freelance</option>
              <option value="Contract">Contract</option>
            </select>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border p-3"
            >
              <option value="default">Default Order</option>
              <option value="title">Sort by Job Title</option>
              <option value="salary">Highest Salary First</option>
            </select>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
            >
              Clear Filters
            </button>

          </div>
        </div>

        {/* Job Count */}
        <div className="mb-6 mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Available Jobs
          </h2>

          <span className="font-semibold text-blue-600">
            {filteredJobs.length} Jobs Found
          </span>
        </div>

        {/* Job Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {job.icon}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {job.title}
                  </h3>

                  <p className="text-sm text-blue-600">
                    {job.company}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>📍 {job.location}</p>
                <p>💼 {job.type}</p>
                <p>📂 {job.category}</p>
                <p>💰 {job.salary}</p>
              </div>

              <Link
                to="/job-details"
                className="mt-6 block rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                View Details →
              </Link>

            </div>
          ))}

        </div>

        {filteredJobs.length === 0 && (
          <div className="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🔍</div>

            <h2 className="mt-4 text-2xl font-bold">
              No Jobs Found
            </h2>

            <p className="mt-3 text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-white"
            >
              Show All Jobs
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Jobs;
