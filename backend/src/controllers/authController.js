import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Signup controller
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "User created successfully", user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: `Welcome, ${data.name}`, user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
