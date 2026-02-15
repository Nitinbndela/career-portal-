import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../context/JobContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { jobs, addJob, updateJob, deleteJob, deleteAllJobs, resetJobs } = useJobs();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initial Form State
  const initialFormState = {
    slug: '',
    title: '',
    category: 'Latest Jobs',
    postDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    shortInfo: '',
    officialLink: '',
    applyOnline: '',
    downloadNotification: '',
    officialWebsite: '',
    educationalQualification: '',
    importantDates: '{}',
    importantDatesBullets: '[]',
    applicationFee: '{}',
    applicationFeeBullets: '[]',
    ageLimit: '{}',
    ageLimitBullets: '[]',
    vacancyDetails: '[]',
    salary: '[]',
    selectionProcess: '[]',
    howToApply: '[]',
    importantLinks: '[]',
    faqs: '[]'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (!auth) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This will delete all custom changes and restore the original list.')) {
      resetJobs();
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('WARNING: Are you sure you want to DELETE ALL jobs? This cannot be undone.')) {
      deleteAllJobs();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const jobData = {
        ...formData,
        importantDates: JSON.parse(formData.importantDates || '{}'),
        importantDatesBullets: JSON.parse(formData.importantDatesBullets || '[]'),
        applicationFee: JSON.parse(formData.applicationFee || '{}'),
        applicationFeeBullets: JSON.parse(formData.applicationFeeBullets || '[]'),
        ageLimit: JSON.parse(formData.ageLimit || '{}'),
        ageLimitBullets: JSON.parse(formData.ageLimitBullets || '[]'),
        vacancyDetails: JSON.parse(formData.vacancyDetails || '[]'),
        salary: JSON.parse(formData.salary || '[]'),
        selectionProcess: JSON.parse(formData.selectionProcess || '[]'),
        howToApply: JSON.parse(formData.howToApply || '[]'),
        importantLinks: JSON.parse(formData.importantLinks || '[]'),
        faqs: JSON.parse(formData.faqs || '[]')
      };

      if (isEditing) {
        updateJob(currentSlug, jobData);
        alert('Job Updated Successfully!');
      } else {
        if (!jobData.slug) {
            jobData.slug = jobData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        if (jobs && jobs.some(j => j.slug === jobData.slug)) {
          alert('Error: Slug must be unique. A job with this slug already exists.');
          return;
        }

        addJob(jobData);
        alert('Job Added Successfully!');
      }
      setFormData(initialFormState);
      setIsEditing(false);
      setCurrentSlug(null);
    } catch (error) {
      alert('Error parsing JSON fields. Please check your JSON syntax in Dates, Fee, Age, or Vacancy fields.');
    }
  };

  const handleEdit = (job) => {
    setIsEditing(true);
    setCurrentSlug(job.slug);
    setFormData({
      slug: job.slug,
      title: job.title,
      category: job.category || 'Latest Jobs',
      postDate: job.postDate || '',
      shortInfo: job.shortInfo || '',
      officialLink: job.officialLink || '',
      applyOnline: job.applyOnline || '',
      downloadNotification: job.downloadNotification || '',
      officialWebsite: job.officialWebsite || '',
      educationalQualification: job.educationalQualification || '',
      importantDates: JSON.stringify(job.importantDates || {}, null, 2),
      importantDatesBullets: JSON.stringify(job.importantDatesBullets || [], null, 2),
      applicationFee: JSON.stringify(job.applicationFee || {}, null, 2),
      applicationFeeBullets: JSON.stringify(job.applicationFeeBullets || [], null, 2),
      ageLimit: JSON.stringify(job.ageLimit || {}, null, 2),
      ageLimitBullets: JSON.stringify(job.ageLimitBullets || [], null, 2),
      vacancyDetails: JSON.stringify(job.vacancyDetails || [], null, 2),
      salary: JSON.stringify(job.salary || [], null, 2),
      selectionProcess: JSON.stringify(job.selectionProcess || [], null, 2),
      howToApply: JSON.stringify(job.howToApply || [], null, 2),
      importantLinks: JSON.stringify(job.importantLinks || [], null, 2),
      faqs: JSON.stringify(job.faqs || [], null, 2)
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = (slug) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteJob(slug);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    form: { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
    textarea: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', height: '100px', fontFamily: 'monospace' },
    btnPrimary: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
    btnSecondary: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    searchBar: { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #ddd' },
    td: { padding: '10px', borderBottom: '1px solid #ddd' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Admin Dashboard</h1>
        <div>
          <button onClick={handleDeleteAll} style={{...styles.btnSecondary, backgroundColor: '#b91c1c', marginRight: '10px'}}>Delete All</button>
          <button onClick={handleReset} style={{...styles.btnSecondary, backgroundColor: '#f59e0b', marginRight: '10px'}}>Reset Data</button>
          <button onClick={handleLogout} style={{...styles.btnSecondary, backgroundColor: '#dc2626'}}>Logout</button>
        </div>
      </div>

      <div style={styles.form}>
        <h2>{isEditing ? 'Edit Job' : 'Add New Job'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}><label style={styles.label}>Job Title</label><input style={styles.input} name="title" value={formData.title} onChange={handleInputChange} required /></div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Category</label>
            <select style={styles.input} name="category" value={formData.category} onChange={handleInputChange}>
              <option value="Latest Jobs">Latest Jobs</option>
              <option value="Result">Result</option>
              <option value="Admit Card">Admit Card</option>
              <option value="Admission">Admission</option>
              <option value="Answer Key">Answer Key</option>
              <option value="Syllabus">Syllabus</option>
            </select>
          </div>
          <div style={styles.inputGroup}><label style={styles.label}>Slug (Unique ID)</label><input style={styles.input} name="slug" value={formData.slug} onChange={handleInputChange} disabled={isEditing} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Post Date</label><input style={styles.input} name="postDate" value={formData.postDate} onChange={handleInputChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Short Info</label><textarea style={{...styles.textarea, height: '60px'}} name="shortInfo" value={formData.shortInfo} onChange={handleInputChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Educational Qualification (Text)</label><textarea style={{...styles.textarea, height: '60px'}} name="educationalQualification" value={formData.educationalQualification} onChange={handleInputChange} /></div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Official Link</label><input style={styles.input} name="officialLink" value={formData.officialLink} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Official Website</label><input style={styles.input} name="officialWebsite" value={formData.officialWebsite} onChange={handleInputChange} /></div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Apply Online Link</label><input style={styles.input} name="applyOnline" value={formData.applyOnline} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Download Notification Link</label><input style={styles.input} name="downloadNotification" value={formData.downloadNotification} onChange={handleInputChange} /></div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Important Dates (JSON)</label><textarea style={styles.textarea} name="importantDates" value={formData.importantDates} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Important Dates Bullets (JSON)</label><textarea style={styles.textarea} name="importantDatesBullets" value={formData.importantDatesBullets} onChange={handleInputChange} /></div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Application Fee (JSON)</label><textarea style={styles.textarea} name="applicationFee" value={formData.applicationFee} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Application Fee Bullets (JSON)</label><textarea style={styles.textarea} name="applicationFeeBullets" value={formData.applicationFeeBullets} onChange={handleInputChange} /></div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Age Limit (JSON)</label><textarea style={styles.textarea} name="ageLimit" value={formData.ageLimit} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Age Limit Bullets (JSON)</label><textarea style={styles.textarea} name="ageLimitBullets" value={formData.ageLimitBullets} onChange={handleInputChange} /></div>
          </div>
          
          <div style={styles.inputGroup}><label style={styles.label}>Vacancy Details (JSON Array)</label><textarea style={styles.textarea} name="vacancyDetails" value={formData.vacancyDetails} onChange={handleInputChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Salary (JSON Array)</label><textarea style={styles.textarea} name="salary" value={formData.salary} onChange={handleInputChange} /></div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Selection Process (JSON)</label><textarea style={styles.textarea} name="selectionProcess" value={formData.selectionProcess} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>How To Apply (JSON)</label><textarea style={styles.textarea} name="howToApply" value={formData.howToApply} onChange={handleInputChange} /></div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div style={styles.inputGroup}><label style={styles.label}>Important Links (JSON)</label><textarea style={styles.textarea} name="importantLinks" value={formData.importantLinks} onChange={handleInputChange} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>FAQs (JSON)</label><textarea style={styles.textarea} name="faqs" value={formData.faqs} onChange={handleInputChange} /></div>
          </div>

          <button type="submit" style={styles.btnPrimary}>{isEditing ? 'Update Job' : 'Add Job'}</button>
          {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData(initialFormState); }} style={styles.btnSecondary}>Cancel</button>}
        </form>
      </div>

      <h2>Manage Jobs ({filteredJobs.length})</h2>
      
      <input 
        type="text" 
        placeholder="Search jobs by title..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchBar}
      />

      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Title</th><th style={styles.th}>Slug</th><th style={styles.th}>Date</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {filteredJobs.map((job) => (
            <tr key={job.slug}>
              <td style={styles.td}>{job.title}</td>
              <td style={styles.td}>{job.slug}</td>
              <td style={styles.td}>{job.postDate}</td>
              <td style={styles.td}><button onClick={() => handleEdit(job)} style={{...styles.btnPrimary, padding: '5px 10px', fontSize: '12px'}}>Edit</button><button onClick={() => handleDelete(job.slug)} style={{...styles.btnSecondary, backgroundColor: '#dc2626', padding: '5px 10px', fontSize: '12px'}}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;