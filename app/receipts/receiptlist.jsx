"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function ReceiptList({ refreshReceipts }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, [refreshReceipts]);

  const fetchReceipts = async () => {
    setLoading(true);
    
    // Fetch list of files from the "Receipts" bucket
    const { data, error } = await supabase.storage.from("Receipts").list("", {
      limit: 100, // Optional: Set a limit to avoid too many files
      offset: 0,   // Start from the beginning
    });

    if (error) {
      console.error("Error fetching receipts:", error.message);
    } else {
      setReceipts(data || []);
    }
    setLoading(false);
  };

  const getPublicURL = (path) => {
    const { data } = supabase.storage.from("Receipts").getPublicUrl(path);
    return data?.publicUrl || ""; // Ensure it doesn't break if null
  };

  const handleDelete = async (path) => {
    const { error } = await supabase.storage.from("Receipts").remove([path]);

    if (error) {
      console.error("Error deleting receipt:", error.message);
    } else {
      setReceipts(receipts.filter((receipt) => receipt.name !== path));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Uploaded Receipts</h2>
      {loading ? (
        <p className="text-white">Loading...</p>
      ) : receipts.length === 0 ? (
        <p className="text-white">No receipts uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {receipts.map((receipt) => (
            <div key={receipt.name} className="relative bg-gray-800 p-4 rounded-lg shadow-lg">
              <Image
                src={getPublicURL(receipt.name)}
                alt="Receipt"
                width={200}
                height={200}
                className="rounded-lg"
              />
              <div className="mt-2 flex justify-between items-center">
                <a
                  href={getPublicURL(receipt.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(receipt.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}