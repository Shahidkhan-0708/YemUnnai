import type { FoodItem } from '../lib/types';
import { ItemDetailSheet } from './ItemDetailSheet';

interface Props {
  item: FoodItem | null;
  onBack?: () => void;
  onMap?: () => void;
  onOrder?: (qty: number, current?: FoodItem) => void;
}

export function FoodItemDetailScreen({ item, onBack, onMap, onOrder }: Props) {
  void onOrder;
  if (!item) return null;

  return (
    <ItemDetailSheet
      item={item}
      onClose={onBack ?? (() => {})}
      onNavigateClick={onMap ?? (() => {})}
    />
  );
}

export default FoodItemDetailScreen;
