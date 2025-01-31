import Job from '../models/Jobs.js';
import Company from '../models/Company.js';

// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const { title, description, companyId, minExp, tags, jobType, location, isActive } = req.body;

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Create a new job
    const newJob = new Job({
      title,
      description,
      companyId,
      minExp,
      tags,
      jobType,
      location,
      isActive
    });

    await newJob.save();
    res.status(201).json({ message: 'Job created successfully', job: newJob });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
};

// Get all jobs created by a specific company
export const getJobsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Fetch all jobs posted by this company
    const jobs = await Job.find({ companyId });

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Fetch job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
};
