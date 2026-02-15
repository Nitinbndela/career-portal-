import React from "react";
import { useParams } from "react-router-dom";
import { useJobs } from "../context/JobContext";

const JobDetail = () => {
  const { slug } = useParams();
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.slug === slug);

  if (!job) {
    return <div className="p-6 text-center text-red-600">Job Not Found</div>;
  }

  // Extract dates from importantDates OR applicationFee if mixed
  const displayDates = Object.entries(job.importantDates || {}).length > 0 
    ? Object.entries(job.importantDates) 
    : Object.entries(job.applicationFee || {}).filter(([key]) => key.toLowerCase().includes('date'));

  // Filter fee items to exclude dates/notes if they were mixed in
  const displayFee = Object.entries(job.applicationFee || {}).filter(([key]) => !key.toLowerCase().includes('date') && !key.toLowerCase().includes('note'));

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white">

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">
        {job.title}
      </h1>

      <p className="text-red-600 font-semibold mb-6">
        Published On: {job.postDate || "Recently"}
      </p>

      {/* ===== IMPORTANT DATES + APPLICATION FEE TABLE ===== */}
      <div className="grid md:grid-cols-2 gap-4 border">

        {/* Important Dates */}
        <div className="border p-4">
          <h2 className="text-pink-600 font-bold text-lg text-center mb-3">
            IMPORTANT DATES
          </h2>

          <ul className="space-y-2 text-sm list-disc ml-5">
            {displayDates.length > 0 ? displayDates.map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            )) : <li>Check Official Notification</li>}
          </ul>
        </div>

        {/* Application Fee */}
        <div className="border p-4">
          <h2 className="text-pink-600 font-bold text-lg text-center mb-3">
            APPLICATION FEE
          </h2>

          <ul className="space-y-2 text-sm list-disc ml-5">
            {displayFee.length > 0 ? displayFee.map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            )) : <li>Check Official Notification</li>}
          </ul>
        </div>

      </div>

      {/* ===== AGE LIMIT + TOTAL POST ===== */}
      <div className="grid md:grid-cols-2 gap-4 border mt-4">

        <div className="border p-4">
          <h2 className="text-green-600 font-bold text-lg text-center mb-3">
            AGE LIMIT AS ON 01/01/2026
          </h2>

          <ul className="text-sm space-y-2 list-disc ml-5">
            {Object.entries(job.ageLimit || {}).filter(([k]) => !k.toLowerCase().includes('date')).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>
        </div>

        <div className="border p-4 text-center">
          <h2 className="text-green-600 font-bold text-lg mb-3">
            TOTAL POST
          </h2>

          <p className="text-2xl font-bold text-red-600">
            Various Posts
          </p>

          <p className="text-sm mt-2">
            For detailed information read official notification.
          </p>
        </div>
      </div>

      {/* ===== VACANCY DETAILS TABLE ===== */}
      {job.vacancyDetails && job.vacancyDetails.length > 0 && (
      <div className="mt-6 border p-4">
        <h2 className="text-green-700 font-bold text-lg text-center mb-4">
          {job.title} Eligibility & Vacancy Details
        </h2>

        <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(job.vacancyDetails[0]).map((key) => (
                <th key={key} className="border p-2 capitalize">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {job.vacancyDetails.map((v, i) => (
              <tr key={i}>
                {Object.values(v).map((val, j) => (
                  <td key={j} className="border p-2">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      )}

      {/* ===== SALARY TABLE ===== */}
      {job.salary && (
      <div className="mt-6 border p-4">
        <h2 className="text-pink-600 font-bold text-lg text-center mb-4">
          Salary Details
        </h2>

        <table className="w-full border text-sm">
          <tbody>
            <tr>
              <td className="border p-2">Pay Scale</td>
              <td className="border p-2">{job.salary?.payScale || "₹44,900 - ₹1,42,400"}</td>
            </tr>
            <tr>
              <td className="border p-2">Allowances</td>
              <td className="border p-2">As Per Government Norms</td>
            </tr>
          </tbody>
        </table>
      </div>
      )}

      {/* ===== SELECTION PROCESS ===== */}
      {job.selectionProcess && (
      <div className="mt-6 border p-4">
        <h2 className="text-pink-600 font-bold text-lg text-center mb-4">
          Selection Process
        </h2>

        <ul className="list-decimal ml-6 text-sm space-y-2">
          {job.selectionProcess?.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </div>
      )}

      {/* ===== HOW TO APPLY ===== */}
      <div className="mt-6 border p-4">
        <h2 className="text-pink-600 font-bold text-lg text-center mb-4">
          How To Apply
        </h2>

        <ul className="list-disc ml-6 text-sm space-y-2">
          <li>Read official notification carefully.</li>
          <li>Click on Apply Online link.</li>
          <li>Fill the application form.</li>
          <li>Upload required documents.</li>
          <li>Pay application fees.</li>
          <li>Submit and print final form.</li>
        </ul>
      </div>

      {/* ===== IMPORTANT LINKS ===== */}
      <div className="mt-6 bg-yellow-100 border p-4">
        <h2 className="text-center font-bold text-red-700 mb-4">
          IMPORTANT LINKS
        </h2>

        <div className="flex flex-col gap-2 text-center">
          {job.importantLinks && job.importantLinks.length > 0 ? (
            job.importantLinks.map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">
                {link.label}
              </a>
            ))
          ) : (
            <>
              <a href={job.officialLink} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold">Official Link</a>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default JobDetail;
