import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardLayout } from "../../../../components/CardLayout";
import { districts } from "../../../../data/districts";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Register() {
  const [nid, setNid] = useState("");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [image, setImage] = useState(null); // State to store the uploaded image
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result.split(",")[1]); // Extract base64 string (after the comma)
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/citizens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, nid, district, image }),
      });
      if (!response.ok) {
        throw new Error("Failed to register");
      }
      const data = await response.json();
      alert("Registration successful!");
      console.log(data);
      navigate("/login"); // Redirect to the admin panel after successful registration
    } catch (err) {
      console.error("Error:", err);
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <CardLayout>
      <h1 className="text-2xl font-bold text-center text-white">Citizen Registration</h1>
      <form
        onSubmit={handleRegister}
        className="mt-6 flex flex-col items-center space-y-4"
      >
        <div className="w-3/4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-white"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
            placeholder="Enter your full name"
          />
        </div>
        <div className="w-3/4">
          <label
            htmlFor="district"
            className="block text-sm font-medium text-white"
          >
            District
          </label>
          <select
            id="district"
            name="district"
            value={district}
            onChange={e => setDistrict(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none bg-white text-black"
          >
            <option value="">Select a district</option>
            {districts.map((d, idx) => (
              <option key={idx} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
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
        <div className="w-3/4">
          <label
            htmlFor="face"
            className="block text-sm font-medium text-white"
          >
            Upload Face Image
          </label>
          <input
            type="file"
            id="face"
            name="face"
            accept="image/*"
            onChange={handleImageChange}
            required
            className="w-full px-4 py-2 mt-1 text-sm border rounded-md focus:ring focus:ring-green-300 focus:outline-none"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-3/4 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 focus:ring focus:ring-green-300 focus:outline-none"
        >
          Register
        </button>
      </form>
    </CardLayout>
  );
}

export { Register };