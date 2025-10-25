import React from "react";

export default function WorkspaceFiles({ files }) {
  return (
    <div className="space-y-2 mt-4">
      {files.map((file) => (
        <div key={file.url} className="flex items-center justify-between bg-gray-100 p-2 rounded">
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
            {file.name}
          </a>
        </div>
      ))}
    </div>
  );
}
