import Company from '../../model/Company.js';
import bcrypt from 'bcrypt';

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { email, password, status, website, description } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new company
    const newCompany = new Company({
      email,
      password: hashedPassword,
      status,
      website,
      description
    });

    await newCompany.save();
    res.status(201).json({ message: 'Company created successfully', company: newCompany });
  } catch (error) {
    res.status(500).json({ message: 'Error creating company', error: error.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json({ companies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
};