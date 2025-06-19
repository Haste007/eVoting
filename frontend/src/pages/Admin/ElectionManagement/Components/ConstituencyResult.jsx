import React from "react";
import { Bar } from "react-chartjs-2";

export function ConstituencyResult({ constituency }) {
  if (!constituency || !constituency.results || constituency.results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-md font-bold text-gray-700 mb-4">{constituency?.name || "Constituency"}</h4>
        <p className="text-sm text-gray-600">No data available for this constituency.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 ">
      <h4 className="text-md font-bold text-gray-700 mb-4">{constituency.name}</h4>

      {/* Graph */}
      <Bar
        data={{
          labels: constituency.results.map(
            (result) => `${result.party_name} (${result.candidate})`
          ),
          datasets: [
            {
              label: "Total Votes",
              data: constituency.results.map((result) => result.total_votes || 0),
              backgroundColor: ["green","red"],
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              barPercentage: 0.33, // Each bar takes at most 1/3 of the total space
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              ticks: {
                stepSize: 1, // Ensure the left scale only shows whole numbers
                beginAtZero: true,
              },
            },
          },
        }}
      />

      {/* Table */}
      <div className="mt-6 text-gray-800">
        <h5 className="text-sm font-bold text-gray-700 mb-2">Results Table</h5>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Party</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Candidate</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total Votes</th>
            </tr>
          </thead>
          <tbody>
            {constituency.results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{result.party_name}</td>
                <td className="border border-gray-300 px-4 py-2">{result.candidate}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{result.total_votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}