export type Story = {
  id: string;
  person_id: string;
  question_text: string;
  response_text: string;
  audio_url: string | null;
  photo_urls: string[];
  estimated_date: string | null;
  theme: string | null;
  order_index: number;
  created_at: string;
};
