import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CardLayout } from "../../components/CardLayout";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Login() {
  const [nid, setNid] = useState("");
  const [error, setError] = useState("");
  const [citizen, setCitizen] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCitizen(null);

    try {
      const response = await fetch(`${backendUrl}/api/citizens/${nid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.nid) {
          setCitizen(data);
          startVideoStream();
        } else {
          setError("Citizen not found. Please check your NID.");
        }
      } else {
        setError("Error fetching Citizen details. Please try again later.");
      }
    } catch (err) {
      alert("error:" + err);
      setError("Unable to connect to the server. Please try again later.");
    }
  };

  const startVideoStream = () => {
    setIsVerifying(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
        setError("Unable to access webcam. Please try again.");
      });
  };

  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVerifying(false);
  };

  const verifyFace = async () => {
    if (!videoRef.current || !citizen) {
      setError("Missing video stream or citizen data.");
      return;
    }

    try {
      // Take a snapshot of the video stream
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert the snapshot to a base64 string
      const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];

      // Send the NID and the snapshot to the Go backend handler
      const response = await fetch(`${backendUrl}/api/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nid,
          image: imageBase64, // Base64-encoded image from the video stream
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Save authentication reference for router protection
        localStorage.setItem("citizenId", nid);
        localStorage.setItem("isAuthenticated", "true");
        alert("Authentication successful!");
        stopVideoStream();
        navigate("/voting"); // Redirect to the voting page
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("Error during authentication:", err);
      setError("An error occurred during authentication. Please try again.");
    }
  };

  return (
    <CardLayout>
      <h1 className="text-2xl font-bold text-center text-white">Citizen Login</h1>
      {!isVerifying ? (
        <form
          onSubmit={handleLogin}
          className="mt-6 flex flex-col items-center space-y-4"
        >
          <div className="w-3/4">
            <label
              htmlFor="nid"
              className="block text-sm font-medium text-white"
            >
              National Identity Number
            </label>
            <input
              type="text"
              id="nid"
              name="nid"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              required
              pattern="\d{5}-\d{7}-\d{1}" // Regex for the required format
              title="Enter a valid NIN in the format 11111-2222222-3"
              className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
              placeholder="11111-2222222-3"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-3/4 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 focus:ring focus:ring-green-300 focus:outline-none"
          >
            Login
          </button>
        </form>
      ) : (
        <div className="mt-6 flex flex-col items-center space-y-4">
          <video
            ref={videoRef}
            className="w-3/4 rounded-md border border-gray-300"
            autoPlay
            muted
          ></video>
          <button
            onClick={verifyFace}
            className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 focus:ring focus:ring-green-300 focus:outline-none"
          >
            Verify Face
          </button>
          <button
            onClick={stopVideoStream}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:ring focus:ring-red-300 focus:outline-none"
          >
            Cancel
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}
    </CardLayout>
  );
}

export { Login };