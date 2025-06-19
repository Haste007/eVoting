import face_recognition
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def compare_faces(image1_base64, image2_base64):
    """
    Compares two images and returns a similarity index indicating how similar the two faces are.

    Args:
        image1_base64 (str): Base64-encoded string of the first image.
        image2_base64 (str): Base64-encoded string of the second image.

    Returns:
        dict: A dictionary containing the similarity index or an error message.
    """
    try:
        # Decode the base64 images
        try:
            image1_data = base64.b64decode(image1_base64)
            image2_data = base64.b64decode(image2_base64)
        except Exception as e:
            return {"error": f"Failed to decode base64 images: {str(e)}"}, 400

        # # Check for null bytes in the decoded data
        # if b'\0' in image1_data:
        #     return {"error": "Null byte detected in the first image data."}, 400
        # if b'\0' in image2_data:
        #     return {"error": "Null byte detected in the second image data."}, 400

        # Load the images using Pillow
        try:
            image1 = Image.open(io.BytesIO(image1_data))
            image2 = Image.open(io.BytesIO(image2_data))
        except Exception as e:
            return {"error": f"Failed to load images using Pillow: {str(e)}"}, 400

        # Convert images to numpy arrays for face_recognition
        image1_array = np.array(image1)
        image2_array = np.array(image2)

        # Encode the faces in the first image
        image1_encodings = face_recognition.face_encodings(image1_array)
        if len(image1_encodings) == 0:
            return {"error": "No face detected in the first image."}, 400
        if len(image1_encodings) > 1:
            return {"error": "Multiple faces detected in the first image."}, 400

        # Encode the faces in the second image
        image2_encodings = face_recognition.face_encodings(image2_array)
        if len(image2_encodings) == 0:
            return {"error": "No face detected in the second image."}, 400
        if len(image2_encodings) > 1:
            return {"error": "Multiple faces detected in the second image."}, 400

        # Compute the Euclidean distance between the two face encodings
        distance = np.linalg.norm(image1_encodings[0] - image2_encodings[0])

        # Convert distance to a similarity index (lower distance means higher similarity)
        similarity_index = max(0.0, 1.0 - distance)

        return {"similarity_index": similarity_index}, 200

    except Exception as e:
        return {"error": f"An error occurred during face comparison: {str(e)}"}, 500

@app.route('/api/authenticate', methods=['POST'])
def authenticate():
    """
    API endpoint to authenticate a user by comparing two images.

    Expects:
        JSON payload with two base64-encoded images:
        {
            "image1": "<base64_string>",
            "image2": "<base64_string>"
        }

    Returns:
        JSON response with similarity index or an error message.
    """
    try:
        # Parse the JSON payload
        try:
            data = request.get_json()
            image1_base64 = data.get("image1")
            image2_base64 = data.get("image2")
        except Exception as e:
            return jsonify({"error": f"Failed to parse JSON payload: {str(e)}"}), 400

        # Validate the input
        if not image1_base64:
            return jsonify({"error": "No image from DB."}), 400
        if not image2_base64:
            return jsonify({"error": "No image from User."}), 400

        # Compare the faces
        result, status_code = compare_faces(image1_base64, image2_base64)
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)