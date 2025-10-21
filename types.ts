export interface AppState {
  imageSrcs: string[];
  selectedImageIndex: number;
  isLoading: boolean;
  error: string | null;
}

export type GenerationMode = 'text' | 'image';