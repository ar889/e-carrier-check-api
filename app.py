import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# Replace with your actual Gemini API key
GEMINI_API_KEY = "api-key"

def call_gemini(tags, paragraph):
    """Send data to Gemini API and return processed response."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"Tags: {tags}\nParagraph: {paragraph}\nExtract the truck type from the above data."
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(f"{url}?key={GEMINI_API_KEY}", json=payload, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        data = response.json()
        
        # Process the Gemini API response
        if data.get("candidates"):
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            return "Unable to extract truck type."
    except requests.exceptions.RequestException as e:
        print("Error calling Gemini API:", str(e))
        return f"Error calling Gemini API: {str(e)}"

def write_to_file(filename, content):
    """Write processed data to a file."""
    try:
        with open(filename, 'a') as file:
            file.write(content + '\n')
        print(f"Data written to {filename}")
    except Exception as e:
        print(f"Error writing to file: {str(e)}")

@app.route('/process-data', methods=['POST'])
def process_data():
    """Process incoming data and send it to Gemini API."""
    try:
        data = request.json
        print("Received data:", data)

        # Extract tags and paragraph from the received data
        tags = data.get("tags", "")
        paragraph = data.get("paragraph", "")

        # Call Gemini API
        processed_data = call_gemini(tags, paragraph)

        # Write the processed data to a file
        write_to_file("processed_results.txt", processed_data)

        return jsonify({"processedData": processed_data}), 200
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Internal server error occurred."}), 500

if __name__ == "__main__":
    app.run(debug=True)
