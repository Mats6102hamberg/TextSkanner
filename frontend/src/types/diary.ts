import { z } from "zod";

export const diaryEntrySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  originalText: z.string(),
  translatedText: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional()
});

export type DiaryEntry = z.infer<typeof diaryEntrySchema>;

export const diaryEntriesSchema = z.array(diaryEntrySchema);
