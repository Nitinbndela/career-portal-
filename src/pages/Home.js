import React from "react";
import { useJobs } from "../context/JobContext";
import { Link } from "react-router-dom";
import EligibilitySearch from "../components/EligibilityChecker";

const Home = () => {
  const { jobs } = useJobs();
  const latestJobs = jobs.slice(0, 6);

  // Helper to categorize data (Auto-sorts legacy data based on title if category is missing)
  const getByCategory = (cat) => {
    return jobs.filter((j) => {
      if (j.category) return j.category === cat;
      
      // Auto-categorize based on keywords in title
      const t = j.title.toLowerCase();
      if (cat === 'result' && t.includes('result')) return true;
      if (cat === 'admit_card' && t.includes('admit card')) return true;
      if (cat === 'answer_key' && t.includes('answer key')) return true;
      if (cat === 'admission' && (t.includes('admission') || t.includes('counselling'))) return true;
      if (cat === 'syllabus' && t.includes('syllabus')) return true;
      if (cat === 'job' && !t.includes('result') && !t.includes('admit card') && !t.includes('answer key') && !t.includes('admission') && !t.includes('syllabus')) return true;
      
      return false;
    }).slice(0, 15); // Show max 15 items per column
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-800 to-blue-900 text-white text-center py-10 shadow-md">
        <h1 className="text-5xl font-extrabold tracking-tight">CAREER PORTAL</h1>
        <p className="text-lg mt-2 text-indigo-100">Your Gateway to Government Opportunities</p>
      </div>

      {/* NAVBAR */}
      <div className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg flex justify-center gap-8 py-4 text-sm font-bold uppercase tracking-wider">
        <a href="#home" className="hover:text-yellow-400 cursor-pointer">Home</a>
        <a href="#result" className="hover:text-yellow-400 cursor-pointer">Result</a>
        <a href="#jobs" className="hover:text-yellow-400 cursor-pointer">Jobs</a>
        <a href="#admitcard" className="hover:text-yellow-400 cursor-pointer">Admit Card</a>
        <a href="#admission" className="hover:text-yellow-400 cursor-pointer">Admission</a>
        <a href="#answerkey" className="hover:text-yellow-400 cursor-pointer">Answer Key</a>
        <Link to="/admin/login" className="hover:text-yellow-400 cursor-pointer">Admin Login</Link>
      </div>

      {/* ELIGIBILITY SEARCH SECTION - MOVED TO TOP */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <EligibilitySearch />
      </div>

      {/* JOIN BUTTONS */}
      <div className="flex justify-center gap-6 my-8 px-4 flex-wrap">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg shadow-md font-bold transition-colors">
          Join WhatsApp Channel
        </button>
        <button className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-lg shadow-md font-bold transition-colors">
          Join Telegram Channel
        </button>
      </div>

      {/* HIGHLIGHT JOB BOXES */}
      <div id="home" className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 px-4 mb-12">
        {latestJobs.map((job, index) => (
          <Link
            key={job.slug}
            to={`/job/${job.slug}`}
            className={`p-6 text-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 text-center font-bold text-lg flex items-center justify-center min-h-[100px] ${
              index % 3 === 0
                ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                : index % 3 === 1
                ? "bg-gradient-to-br from-blue-600 to-cyan-600"
                : "bg-gradient-to-br from-emerald-500 to-teal-600"
            }`}
          >
            {job.title}
          </Link>
        ))}
      </div>

      {/* ROW 1: RESULT | ADMIT CARD | LATEST JOBS */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-4 mb-12">

        {/* Latest Result */}
        <div id="result" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Result
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('result').map((job) => (
              <li key={job.slug}>
                <Link
                  to={`/job/${job.slug}`}
                  className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium"
                >
                  {job.title}
                </Link>
              </li>
            ))}
            {getByCategory('result').length === 0 && <li className="text-gray-500">No results available</li>}
          </ul>
          <div className="text-right px-4 pb-4"><button className="text-xs font-bold text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50">View More</button></div>
        </div>

        {/* Admit Card */}
        <div id="admitcard" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Admit Card
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('admit_card').map((job) => (
              <li key={job.slug}>
                <Link
                  to={`/job/${job.slug}`}
                  className="text-emerald-700 hover:text-emerald-900 hover:underline font-medium"
                >
                  {job.title}
                </Link>
              </li>
            ))}
            {getByCategory('admit_card').length === 0 && <li className="text-gray-500">No admit cards available</li>}
          </ul>
          <div className="text-right px-4 pb-4"><button className="text-xs font-bold text-emerald-600 border border-emerald-600 px-3 py-1 rounded hover:bg-emerald-50">View More</button></div>
        </div>

        {/* Latest Jobs */}
        <div id="jobs" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Latest Jobs
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('job').map((job) => (
              <li key={job.slug} className="border-b border-gray-100 pb-2 last:border-0">
                <Link
                  to={`/job/${job.slug}`}
                  className="text-blue-700 hover:text-blue-900 hover:underline font-medium block"
                >
                  {job.title}
                </Link>
                <div className="text-xs text-gray-500 text-right mt-1">
                  Posted: {job.postedDate || job.importantDates?.startDate || "Recently"}
                </div>
              </li>
            ))}
          </ul>
          <div className="text-right px-4 pb-4"><button className="text-xs font-bold text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">View More</button></div>
        </div>

      </div>

      {/* ROW 2: ANSWER KEY | SYLLABUS | ADMISSION */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-4 mb-12">
        
        {/* Answer Key */}
        <div id="answerkey" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Answer Key
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('answer_key').map((job) => <li key={job.slug}><Link to={`/job/${job.slug}`} className="text-orange-700 hover:text-orange-900 hover:underline font-medium">{job.title}</Link></li>)}
            {getByCategory('answer_key').length === 0 && <li className="text-gray-500">No answer keys available</li>}
          </ul>
        </div>

        {/* Syllabus */}
        <div id="syllabus" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Syllabus
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('syllabus').map((job) => <li key={job.slug}><Link to={`/job/${job.slug}`} className="text-purple-700 hover:text-purple-900 hover:underline font-medium">{job.title}</Link></li>)}
            {getByCategory('syllabus').length === 0 && <li className="text-gray-500">No syllabus available</li>}
          </ul>
        </div>

        {/* Admission */}
        <div id="admission" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-teal-600 text-white font-bold text-center py-3 text-xl uppercase tracking-wide">
            Admission
          </div>
          <ul className="p-4 space-y-2 text-sm">
            {getByCategory('admission').map((job) => <li key={job.slug}><Link to={`/job/${job.slug}`} className="text-teal-700 hover:text-teal-900 hover:underline font-medium">{job.title}</Link></li>)}
            {getByCategory('admission').length === 0 && <li className="text-gray-500">No admission updates</li>}
          </ul>
        </div>

      </div>

    </div>
  );
};

export default Home;
