const fs = require("fs");
const path = require("path");
const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove non-alphanumeric characters
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with one
    .replace(/^-+/, "") // Remove leading hyphens
    .replace(/-+$/, ""); // Remove trailing hyphens
};

const saveFile = (file) => {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  const imageFilePath = path.join(__dirname, `../uploads/${fileName}`);
  fs.writeFileSync(imageFilePath, file.buffer);
  let uri = process.env.REACT_APP_APP_BACK_URL;
  let imageUrl = `/uploads/${fileName}`;
  return imageUrl;
};

module.exports = { createSlug, saveFile };
