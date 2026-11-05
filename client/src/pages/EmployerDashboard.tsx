
import { Link } from "react-router-dom";

const jobs = [
  { title: "Frontend Developer", applicants: 48, status: "Active" },
  { title: "UI/UX Designer", applicants: 32, status: "Active" },
  { title: "Backend Developer", applicants: 21, status: "Paused" },
];

function EmployerDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-blue-600 mb-8">
          JobFinder
        </h2>

        <nav className="space-y-4">
          <a href="#overview" className="block p-3 bg-blue-50 text-blue-600 rounded-lg">
            Dashboard
          </a>
          <a href="#jobs" className="block p-3 hover:bg-slate-100 rounded-lg">
            Manage Jobs
          </a>
          <a href="#applicants" className="block p-3 hover:bg-slate-100 rounded-lg">
            Applicants
          </a>
          <a href="#company" className="block p-3 hover:bg-slate-100 rounded-lg">
            Company Profile
          </a>
          <Link to="/jobs" className="block p-3 hover:bg-slate-100 rounded-lg">
            Browse Jobs
          </Link>
          <Link to="/" className="block p-3 text-red-500">
            Logout
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">

        <div id="overview" className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Employer Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Welcome back, TechNova!
            </p>
          </div>

          <button
            onClick={() => alert("Create Job Form coming next!")}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg">
            + Post a Job
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            ["Active Jobs", "8"],
            ["Total Applicants", "126"],
            ["Shortlisted", "24"],
            ["Profile Views", "1840"]
          ].map(([title, value]) => (
            <div key={title} className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-500">{title}</p>
              <h2 className="text-3xl font-bold text-blue-600 mt-3">
                {value}
              </h2>
            </div>
          ))}
        </div>

        {/* Manage Jobs */}
        <div id="jobs" className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-5">Manage Jobs</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Applicants</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.title} className="border-b">
                    <td className="p-3 font-semibold">{job.title}</td>
                    <td className="p-3">{job.applicants}</td>
                    <td className="p-3">
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Applicants */}
        <div id="applicants" className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-5">Recent Applicants</h2>

          {[
            "Jordan Lee - Frontend Developer",
            "Samira Das - UI/UX Designer",
            "Ravi Kumar - Backend Developer"
          ].map((person) => (
            <div key={person}
              className="border-b py-4 flex justify-between items-center gap-3">
              <p>{person}</p>
              <button
                onClick={() => alert("Applicant details coming next!")}
                className="text-blue-600 font-semibold">
                View
              </button>
            </div>
          ))}
        </div>

        {/* Company Profile */}
        <div id="company" className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Company Profile</h2>
          <p className="text-gray-600">Company: TechNova</p>
          <p className="text-gray-600 mt-2">Industry: Technology</p>
          <p className="text-gray-600 mt-2">Location: Remote</p>

          <button
            onClick={() => alert("Edit Company Profile coming next!")}
            className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg">
            Edit Profile
          </button>
        </div>

      </main>
    </div>
  );
}

export default EmployerDashboard;
