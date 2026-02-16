import React, { createContext, useContext, useState, useEffect } from 'react';
import rawData from '../data/jobs.json';

const JobContext = createContext();

export const useJobs = () => useContext(JobContext);

// Helper to generate slug from title
const generateSlug = (title) => {
  if (!title) return Math.random().toString(36).substr(2, 9);
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// Helper to normalize category from JSON to internal keys
const normalizeCategory = (category) => {
  if (!category) return 'job';
  const lower = category.toLowerCase();
  if (lower.includes('result')) return 'result';
  if (lower.includes('admit card')) return 'admit_card';
  if (lower.includes('answer key')) return 'answer_key';
  if (lower.includes('admission')) return 'admission';
  if (lower.includes('syllabus')) return 'syllabus';
  if (lower.includes('important')) return 'important';
  return 'job';
};

// Helper to determine category based on title
const determineCategory = (title) => {
  if (!title) return 'job';
  const t = title.toLowerCase();
  if (t.includes('result')) return 'result';
  if (t.includes('admit card')) return 'admit_card';
  if (t.includes('answer key')) return 'answer_key';
  if (t.includes('admission') || t.includes('counselling')) return 'admission';
  if (t.includes('syllabus')) return 'syllabus';
  return 'job';
};

// Helper to process job data
const processJobData = (data) => {
  return Array.isArray(data) ? data.map(job => ({
    ...job,
    slug: job.slug || generateSlug(job.title),
    category: job.category ? normalizeCategory(job.category) : determineCategory(job.title),
    importantDates: job.importantDates || {},
    applicationFee: job.applicationFee || {},
    ageLimit: job.ageLimit || {},
    vacancyDetails: job.vacancyDetails || [],
    postedDate: job.postedDate || job.postDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  })) : [];
};

// Process the raw JSON data to ensure every job has a slug and necessary fields
const processedData = processJobData(rawData);

export const JobProvider = ({ children }) => {
  // Initialize state with processedData (Prioritize jobs.json to show new data)
  const [jobs, setJobs] = useState(processedData);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load jobs.json dynamically to pick up scraper updates
  const loadJobsFromFile = async () => {
    try {
      // Fetch from public folder (accessible at runtime)
      const response = await fetch('/data/jobs.json?t=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        const processed = processJobData(data);
        if (processed.length > 0 && processed.length !== jobs.length) {
          setJobs(processed);
          setLastUpdate(Date.now());
          console.log(`[UI] Updated: Loaded ${processed.length} jobs from jobs.json`);
        }
      }
    } catch (error) {
      // Silently fail - will use static import as fallback
      // console.log('[UI] Using static jobs data');
    }
  };

  // Poll for updates every 30 seconds (scraper runs every 2 minutes)
  useEffect(() => {
    // Initial load attempt
    loadJobsFromFile();

    // Set up polling to check for updates
    const interval = setInterval(() => {
      loadJobsFromFile();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // 2. Save to LocalStorage whenever the jobs list changes
  useEffect(() => {
    localStorage.setItem('sarkari_jobs_data', JSON.stringify(jobs));
  }, [jobs]);

  // Actions to modify data
  const addJob = (job) => {
    setJobs((prev) => [job, ...prev]);
  };

  const updateJob = (slug, updatedJob) => {
    setJobs((prev) => prev.map((item) => (item.slug === slug ? updatedJob : item)));
  };

  const deleteJob = (slug) => {
    setJobs((prev) => prev.filter((item) => item.slug !== slug));
  };

  const deleteAllJobs = () => {
    setJobs([]);
  };

  const resetJobs = () => {
    setJobs(processedData);
    localStorage.removeItem('sarkari_jobs_data');
  };

  return (
    <JobContext.Provider value={{ jobs, addJob, updateJob, deleteJob, deleteAllJobs, resetJobs }}>
      {children}
    </JobContext.Provider>
  );
};