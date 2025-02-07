import mongoose from "mongoose";

const UserAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expPoint: { type: Number, required: true, default: 0 }, // Changed to Number
  league: { type: String, required: true, default:"Bronze 3" },
  rank: { type: Number }, // Changed to Number
});

export default mongoose.model("UserAnalytics", UserAnalyticsSchema);
