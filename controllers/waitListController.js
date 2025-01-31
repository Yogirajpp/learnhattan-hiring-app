import WaitList from "../models/WaitList.js";

// waitlist.controller.js
export async function createWaitlistEntry(req, res) {
    try {
      const { email } = req.body;
      const ipAddress = req.connection.remoteAddress;
  
      const existingEntry = await WaitList.findOne({ email });
      if (existingEntry) {
        return res.status(400).json({ error: 'Email already in waitlist' });
      }
  
      const newEntry = await WaitList.create({ email, ipAddress });
      res.status(201).json(newEntry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  export async function getWaitlistEntries(req, res) {
    try {
      const entries = await WaitList.find({}, { email: 1 }).sort({ createdAt: -1 }).limit(20);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
