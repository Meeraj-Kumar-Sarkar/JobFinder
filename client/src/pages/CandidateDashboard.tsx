
import { Link } from "react-router-dom";

const applications = [
  { role: "Frontend Developer", company: "TechNova", status: "Under Review" },
  { role: "React Developer", company: "Pixel Studio", status: "Shortlisted" },
  { role: "UI/UX Designer", company: "Creative Labs", status: "Pending" },
];

function CandidateDashboard() {
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
          <a href="#applications" className="block p-3 hover:bg-slate-100 rounded-lg">
            My Applications
          </a>
          <a href="#saved" className="block p-3 hover:bg-slate-100 rounded-lg">
            Saved Jobs
          </a>
          <a href="#profile" className="block p-3 hover:bg-slate-100 rounded-lg">
            My Profile
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

        <div id="overview" className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Welcome back, Alex!
            </p>
          </div>
          <Link to="/jobs"
            className="bg-blue-600 text-white px-5 py-3 rounded-lg">
            Find Jobs
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            ["Applied Jobs", "12"],
            ["Shortlisted", "4"],
            ["Saved Jobs", "8"],
            ["Profile Views", "26"]
          ].map(([title, value]) => (
            <div key={title} className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-gray-500">{title}</p>
              <h2 className="text-3xl font-bold text-blue-600 mt-3">
                {value}
              </h2>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div id="applications" className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-5">My Applications</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="p-3">Job Role</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((job) => (
                  <tr key={job.role} className="border-b">
                    <td className="p-3 font-semibold">{job.role}</td>
                    <td className="p-3">{job.company}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saved Jobs */}
        <div id="saved" className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4">Saved Jobs</h2>
          <p className="text-gray-500">
            Your bookmarked jobs will appear here.
          </p>
          <Link to="/jobs" className="text-blue-600 font-semibold mt-4 inline-block">
            Explore Jobs →
          </Link>
        </div>

        {/* Profile */}
        <div id="profile" className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">My Profile</h2>
          <p className="text-gray-600">Name: Alex Morgan</p>
          <p className="text-gray-600 mt-2">Email: alex@example.com</p>

          <div className="mt-5 bg-gray-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 w-3/4 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Profile Completion: 75%
          </p>
        </div>

      </main>
    </div>
  );
}

export default CandidateDashboard;
