import os
from google import genai
from google.genai import types
from config import load_environment
import time

load_environment()


def generate_headline(summary, category=None):
    try:
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        prompt = f"""
Create a short news headline for the event below.

Rules:
- English only.
- 4 to 10 words.
- Do not invent information.
- Do not mention any geographic location.
- Do not reveal or guess text represented by [REDACTED].
- Return ONLY the headline.

Category: {category or "Unknown"}

Event:
{summary}
"""
        time.sleep(5)
        response = client.models.generate_content(
            model=os.environ["GEMINI_MODEL"],
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=30,
            ),
        )

        headline = response.text.strip()
        return headline.strip('"').strip("'")

    except Exception as error:
        print(f"AI headline generation failed: {error}")
        return "News Event"
