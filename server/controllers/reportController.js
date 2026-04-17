const Report = require("../models/Report");
const Company = require("../models/company");
const Activity = require("../models/Activity");

// Client-side: Create a report
const createReport = async (req, res) => {
  try {
    const { company_id, reason } = req.body;
    const reporter_id = req.user; // From verifyJWT middleware

    if (!company_id || !reason) {
      return res.status(400).json({ message: "Company ID and reason are required" });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const newReport = new Report({
      reporter_id,
      company_id,
      reason,
    });

    await newReport.save();

    res.status(201).json({ message: "Report submitted successfully", report: newReport });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-side: Get all reports
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter_id", "fullName email")
      .populate("company_id", "companyName logoUrl Status")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-side: Take action on a report
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(reportId).populate("company_id");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = status || report.status;
    report.adminNotes = adminNotes || report.adminNotes;
    await report.save();

    // If status is "resolved", maybe we want to do something to the company?
    // For now, just logging activity
    await Activity.create({
      adminId: req.user,
      action: `Signalement ${status}`,
      target: report.company_id.companyName,
      status: status === "resolved" ? "success" : "info"
    });

    res.json({ message: `Report status updated to ${status}`, report });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createReport,
  getAllReports,
  updateReportStatus
};
