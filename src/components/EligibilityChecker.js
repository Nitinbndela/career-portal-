import React, { useState, useEffect, useRef } from "react";
import { useJobs } from "../context/JobContext";
import { Link } from "react-router-dom";

const degreesList = [
  "10th",
  "12th",
  "Diploma",
  "ITI",
  "B.A",
  "B.Com",
  "B.Sc",
  "B.E",
  "B.Tech",
  "B.Ed",
  "BBA",
  "BCA",
  "LLB",
  "MBBS",
  "M.A",
  "M.Com",
  "M.Sc",
  "M.Tech",
  "M.Ed",
  "MBA",
  "MCA",
  "PG Diploma",
  "Ph.D",
  "Any Graduate",
  "Any Post Graduate"
];

const EligibilityChecker = () => {
  const { jobs } = useJobs();
  const [selectedDegree, setSelectedDegree] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Memoize the search function to prevent unnecessary re-renders
  const handleSearch = React.useCallback(() => {
    if (!selectedDegree && !searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const filtered = jobs.filter((job) => {
      // Search in educational qualification field
      const eduQual = (job.educationalQualification || "").toLowerCase();
      
      // Search in vacancy details
      const vacancyText = job.vacancyDetails?.map(v => 
        Object.values(v).join(" ").toLowerCase()
      ).join(" ") || "";
      
      // Search in title and short info
      const titleText = (job.title || "").toLowerCase();
      const shortInfoText = (job.shortInfo || "").toLowerCase();
      
      // Combine all searchable text
      const searchableText = `${eduQual} ${vacancyText} ${titleText} ${shortInfoText}`;
      
      // Check if selected degree matches
      if (selectedDegree) {
        const degreeLower = selectedDegree.toLowerCase();
        // Check for exact match or partial match
        const degreeMatch = searchableText.includes(degreeLower) || 
                           searchableText.includes(degreeLower.replace(".", "")) ||
                           searchableText.includes(degreeLower.replace("b.", "bachelor")) ||
                           searchableText.includes(degreeLower.replace("m.", "master")) ||
                           (degreeLower.includes("graduate") && searchableText.includes("graduate")) ||
                           (degreeLower.includes("post graduate") && searchableText.includes("post graduate"));
        
        if (!degreeMatch) return false;
      }
      
      // Check if custom search query matches
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const queryTerms = queryLower.split(" ").filter(t => t.length > 0);
        const allTermsMatch = queryTerms.every(term => searchableText.includes(term));
        if (!allTermsMatch) return false;
      }
      
      return true;
    });

    setResults(filtered);
    setIsSearching(false);
  }, [selectedDegree, searchQuery, jobs]);

  // Store previous jobs length to detect when new jobs are added
  const prevJobsLengthRef = useRef(jobs.length);

  // Auto-search when selection or query changes
  useEffect(() => {
    if (selectedDegree || searchQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [selectedDegree, searchQuery, handleSearch]);

  // Re-search when new jobs are added (but preserve existing results)
  useEffect(() => {
    const currentJobsLength = jobs.length;
    if ((selectedDegree || searchQuery.trim()) && currentJobsLength > prevJobsLengthRef.current) {
      // Only re-search if new jobs were added
      handleSearch();
    }
    prevJobsLengthRef.current = currentJobsLength;
  }, [jobs.length, selectedDegree, searchQuery, handleSearch]);

  return (
    <div className="bg-white shadow-lg p-6 rounded-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-indigo-800">
        Search Exams by Qualification
      </h2>

      <div className="flex gap-4 flex-wrap mb-4">
        <select
          value={selectedDegree}
          onChange={(e) => setSelectedDegree(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Qualification</option>
          {degreesList.map((deg, index) => (
            <option key={index} value={deg}>
              {deg}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Or type qualification (e.g., Engineering, Medical, Law)"
          className="border border-gray-300 p-3 rounded-lg flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          Search
        </button>
      </div>

      {/* Results Count */}
      {results.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Found <span className="font-bold text-indigo-600">{results.length}</span> exam{results.length !== 1 ? 's' : ''} matching your qualification
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {results.length === 0 && (selectedDegree || searchQuery.trim()) && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No exams found for this qualification.</p>
            <p className="text-sm mt-2">Try selecting a different qualification or search term.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((job) => (
              <div
                key={job.slug}
                className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <Link to={`/job/${job.slug}`}>
                  <h3 className="font-bold text-lg text-indigo-700 hover:text-indigo-900 mb-2 line-clamp-2">
                    {job.title}
                  </h3>
                </Link>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {(job.importantDates && Object.keys(job.importantDates).length > 0) ? (
                    <p>
                      <span className="font-semibold">Last Date:</span> {
                        job.importantDates.applicationEnd || 
                        job.importantDates.applicationStart || 
                        job.importantDates.examDate ||
                        Object.values(job.importantDates).find(v => v && v.trim()) ||
                        "Check notification"
                      }
                    </p>
                  ) : null}
                  
                  {(job.ageLimit && Object.keys(job.ageLimit).length > 0) ? (
                    <p>
                      <span className="font-semibold">Age Limit:</span> {
                        job.ageLimit.minimum && job.ageLimit.maximum 
                          ? `${job.ageLimit.minimum} - ${job.ageLimit.maximum} years`
                          : job.ageLimit.minimum || job.ageLimit.maximum || job.ageLimit.general || "Check notification"
                      }
                    </p>
                  ) : null}

                  {job.applicationFee && Object.keys(job.applicationFee).length > 0 ? (
                    <p>
                      <span className="font-semibold">Fee:</span> {
                        job.applicationFee.general || 
                        job.applicationFee.obc ||
                        job.applicationFee.sc ||
                        job.applicationFee.st ||
                        job.applicationFee.ews ||
                        job.applicationFee.other || 
                        Object.values(job.applicationFee).find(v => v && v.trim()) ||
                        "Check notification"
                      }
                    </p>
                  ) : null}

                  {job.vacancyDetails && job.vacancyDetails.length > 0 ? (
                    <p>
                      <span className="font-semibold">Total Posts:</span> {
                        job.vacancyDetails
                          .map(v => v.total || v["total vacancy"] || v["total posts"] || v["vacancy"] || "")
                          .filter(v => v && v !== "Total" && v !== "total" && v.trim())
                          .slice(0, 1)
                          .join(", ") || "Check notification"
                      }
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex gap-2">
                  {job.applyOnline && (
                    <a
                      href={job.applyOnline}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Apply Online
                    </a>
                  )}
                  <Link
                    to={`/job/${job.slug}`}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityChecker;
