const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = 5000;

// Replace with your actual Gemini API key
const GEMINI_API_KEY = "api-key";

// Middleware
app.use(bodyParser.json());

// Function to call Gemini API
const callGemini = async (tags, paragraph) => {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Tags: ${tags}\nParagraph: ${paragraph}\nExtract the truck type from the above data. if you unable to find then just write nill`
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(`${url}?key=${GEMINI_API_KEY}`, payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = response.data;

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "Unable to extract truck type.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error.response?.data || error.message);
    throw new Error("Error calling Gemini API");
  }
};


// Function to write data to a file
const writeToFile = (filename, content) => {
  const filePath = path.join(__dirname, filename);

  try {
    fs.appendFileSync(filePath, content + "\n", "utf8");
    console.log(`Data written to ${filePath}`);
  } catch (error) {
    console.error("Error writing to file:", error.message);
    throw new Error("Error writing to file");
  }
};

// API endpoint
app.post("/process-data", async (req, res) => {
  try {
    const { tags, paragraph } = req.body;
    console.log("Received data:", { tags, paragraph });

    // Call Gemini API
    const processedData = await callGemini(tags, paragraph);

    // Write processed data to a file
    writeToFile("processed_results.txt", processedData);

    // Send response
    res.status(200).json({ processedData });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error occurred." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
