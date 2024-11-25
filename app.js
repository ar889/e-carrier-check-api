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
const GEMINI_API_KEY = "AIzaSyDdmr34ZXqYpJ8SVTZfI164X4TxVvukgk4";

// Middleware
app.use(bodyParser.json());

// Function to call Gemini API
const callGemini = async (representatives, tags, paragraph) => {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
  const payload = {
    contents: [
      {
        parts: [
          {     
            text: `Representatives: ${representatives.join(", ")}\nTags: ${tags}\nParagraph: ${paragraph}\nExtract the truck type from the above data. if you unable to find then just write nill and Translate the representatives' names into Urdu only, just like how Google Translate would translate them.`
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

  // Clean content: Remove labels like "Truck type:" and "Representative's name in Urdu:"
  const cleanedContent = content
    .split('\n')  // Split content into lines
    .map(line => line.trim())  // Trim spaces from each line
    .filter(line => line !== '')  // Remove empty lines
    .map(line => {
      // Remove the labels from the line (e.g., "Truck type:" and "Representative's name in Urdu:")
      return line.replace(/(Truck type:|Representative's name in Urdu:)/i, '').trim();
    });

  // Assuming that the first line is the representative name and the second line is the truck type
  const truckType = cleanedContent[0] || '';  // First line: Representative's name
  const representativeName = cleanedContent[1] || '';  // Second line: Truck type

  // Format the content so that name comes first, then truck type
  const finalContent = `${representativeName} ${truckType}`;

  try {
    fs.appendFileSync(filePath, finalContent + "\n", "utf8");  // Append to file
    console.log(`Data written to ${filePath}`);
  } catch (error) {
    console.error("Error writing to file:", error.message);
    throw new Error("Error writing to file");
  }
};

// API endpoint
app.post("/process-data", async (req, res) => {
  try {
    const { representatives, tags, paragraph } = req.body;
    console.log("Received data:", { representatives, tags, paragraph });

    // Call Gemini API
    const processedData = await callGemini(representatives, tags, paragraph);

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
