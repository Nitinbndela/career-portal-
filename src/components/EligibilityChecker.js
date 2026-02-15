import React, { useState } from "react";
import { useJobs } from "../context/JobContext";

const degreesList = [
  "B.Tech",
  "B.E",
  "B.Sc",
  "B.A",
  "B.Com",
  "M.Tech",
  "M.Sc",
  "MBA",
  "MBBS",
  "LLB",
  "Diploma",
  "10th",
  "12th"
];

const EligibilityChecker = () => {
  const { jobs } = useJobs();
  const [selectedDegree, setSelectedDegree] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (!selectedDegree) return;

    const filtered = jobs.filter((job) =>
      job.vacancyDetails?.some((v) =>
        v.qualification && v.qualification.toLowerCase().includes(selectedDegree.toLowerCase())
      )
    );

    setResults(filtered);
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-indigo-800">
        Search Exams by Qualification
      </h2>

      <div className="flex gap-4 flex-wrap">
        <select
          value={selectedDegree}
          onChange={(e) => setSelectedDegree(e.target.value)}
          className="border p-2 rounded w-64"
        >
          <option value="">Select Degree</option>
          {degreesList.map((deg, index) => (
            <option key={index} value={deg}>
              {deg}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors font-semibold"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {results.length === 0 && selectedDegree && (
          <p className="text-gray-600">No exams found for this qualification.</p>
        )}

        {results.map((job) => (
          <div
            key={job.slug}
            className="border p-4 rounded shadow hover:shadow-lg"
          >
            <h3 className="font-bold text-lg text-indigo-700">{job.title}</h3>
            <p>Last Date: {job.importantDates?.lastDate}</p>
            <p>
              Age Limit: {job.ageLimit?.min} - {job.ageLimit?.max}
            </p>
            <a
              href={job.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Apply Now →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EligibilityChecker;
