import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileUpload() {
  const [profileUrl, setProfileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

 const userId = supabase.auth.getUser().then((res) => res.data.user?.id);

// With proper async fetching inside useEffect
useEffect(() => {
  const fetchProfile = async () => {
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser.user) return;

    const userId = currentUser.user.id;

    const { data, error } = await supabase
      .from("users")
      .select("profile_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(error);
      setError("Failed to load profile.");
    } else {
      setProfileUrl(data?.profile_url || null);
    }
  };

  fetchProfile();
}, []);
  const handleProfileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !userId) return;

    setUploading(true);
    setError(null);

    try {
      // eslint-disable-next-line no-unused-vars
      const { data: storageData, error: storageError } = await supabase.storage
        .from("profile-pictures")
        .upload(`${userId}/${file.name}`, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(`${userId}/${file.name}`);

      const { error: dbError } = await supabase
        .from("users")
        .update({ profile_url: urlData.publicUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      setProfileUrl(urlData.publicUrl);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setError("Profile upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {profileUrl ? (
        <img
          src={profileUrl}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
          ?
        </div>
      )}
      <div>
        <input
          type="file"
          onChange={handleProfileUpload}
          disabled={uploading}
          className="border p-1 rounded"
        />
        {uploading && <div className="text-blue-500">Uploading...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
}
