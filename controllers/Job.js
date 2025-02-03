import Jobs from "../models/Jobs.js";

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Jobs.find().populate({
      path: "companyId",
      select: "name", // Select only the company name
    });
    res.status(200).json({ jobs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching jobs", error: error.message });
  }
};
