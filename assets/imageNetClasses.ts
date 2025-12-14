import IMAGENET_LABELS from './imagenet-simple-labels.json';

export const IMAGENET_CLASSES: string[] = IMAGENET_LABELS;

export interface Prediction {
  name: string;
  confidence: number;
}

export const getTopKPredictions = (
  predictions: number[],
  k: number = 3,
): Prediction[] => {
  const indexed = predictions.map((prob, index) => ({
    index,
    probability: prob,
  }));

  indexed.sort((a, b) => b.probability - a.probability);

  return indexed.slice(0, k).map(item => ({
    name: IMAGENET_CLASSES[item.index] || 'unknown',
    confidence: item.probability * 100,
  }));
};
