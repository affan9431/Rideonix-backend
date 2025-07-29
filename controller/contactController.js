const Contact = require("../model/contactModel");

exports.contactUs = async (req, res) => {
  try {
    const { name, email, issues, message } = req.body;

    if (!name || !email || !issues || !message) {
      return res
        .status(400)
        .json({ success: "error", message: "Please fill all fields" });
    }

    const contact = await Contact.create({ name, email, issues, message });
    res.status(201).json({
      success: "success",
      message: "Contact request sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: "Something went wrong",
    });
  }
};

exports.getAllContact = async (req, res) => {
  try {
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      return res.status(404).json({
        success: "error",
        message: "No Contact Found.",
      });
    }

    res.status(200).json({
      success: "success",
      data: contacts,
    });
  } catch (error) {
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
    console.log("ERROR:", error);
  }
};
