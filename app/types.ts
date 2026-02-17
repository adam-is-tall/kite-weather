export type SelectedLocation = {
  label: string;
  lat: number;
  lon: number;
};

export type Settings = {
  email: string;
  location: SelectedLocation;
  noRain: boolean;
};
