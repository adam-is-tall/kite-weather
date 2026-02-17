import { supabase } from "@/lib/supabaseClient";

export type KiteSettingsRow = {
  user_id: string;
  email: string;
  location_label: string;
  lat: number;
  lon: number;
  no_rain: boolean;
};

export async function getSettings(userId: string) {
  const { data, error } = await supabase
    .from("kite_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no row found, that's fine — user hasn't saved yet
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as KiteSettingsRow;
}

export async function upsertSettings(row: KiteSettingsRow) {
  const { error } = await supabase
    .from("kite_settings")
    .upsert(row, {
      onConflict: "user_id",
    });

  if (error) {
    throw error;
  }
}
