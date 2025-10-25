import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function FileUpload({ workspaceId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data, error } = await supabase
          .from("workspace_files")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setFiles(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load files.");
      }
    };

    fetchFiles();

    const subscription = supabase
      .channel("workspace_files_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_files" },
        (payload) => {
          if (payload.new?.workspace_id === workspaceId) {
            setFiles((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [workspaceId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload to Supabase Storage
      // eslint-disable-next-line no-unused-vars
      const { data: storageData, error: storageError } = await supabase.storage
        .from("workspace-files")
        .upload(`${workspaceId}/${file.name}`, file, { upsert: true });

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("workspace-files")
        .getPublicUrl(`${workspaceId}/${file.name}`);

      // Insert file record
      const { error: dbError } = await supabase.from("workspace_files").insert([
        {
          workspace_id: workspaceId,
          file_url: urlData.publicUrl,
          name: file.name,
        },
      ]);
      if (dbError) throw dbError;

      setUploading(false);
    } catch (err) {
      console.error(err);
      setError("File upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-2">
      <h3 className="font-bold text-lg">Workspace Files</h3>
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="border p-2 rounded"
      />
      {uploading && <div className="text-blue-500">Uploading...</div>}

      <div className="mt-4 space-y-1">
        {files?.length ? (
          files.map((file) => (
            <div key={file.id}>
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {file.name}
              </a>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No files uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
