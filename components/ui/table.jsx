import React from "react";

export function Table({ children }) {
  return <table className="min-w-full divide-y divide-gray-200">{children}</table>;
}

export function TableBody({ children }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TableCell({ children }) {
  return <td className="px-6 py-4 whitespace-nowrap">{children}</td>;
}

export function TableHead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableHeader({ children }) {
  return <tr>{children}</tr>;
}

export function TableRow({ children }) {
  return <tr>{children}</tr>;
}