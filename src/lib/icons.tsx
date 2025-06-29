import { Landmark, Trees, UtensilsCrossed, Building, Drama, MapPin, Coffee, ShoppingCart, Star, Clapperboard, Music, Brush, MountainSnow } from 'lucide-react';
import type { ReactElement } from 'react';

export const getCategoryIcon = (category: string): ReactElement => {
  const lowerCaseCategory = category.toLowerCase();
  const iconProps = { className: "h-4 w-4" };

  if (lowerCaseCategory.includes('museum')) return <Landmark {...iconProps} />;
  if (lowerCaseCategory.includes('historic') || lowerCaseCategory.includes('landmark')) return <Landmark {...iconProps} />;
  if (lowerCaseCategory.includes('park') || lowerCaseCategory.includes('garden')) return <Trees {...iconProps} />;
  if (lowerCaseCategory.includes('outdoor') || lowerCaseCategory.includes('nature') || lowerCaseCategory.includes('hiking')) return <MountainSnow {...iconProps} />;
  if (lowerCaseCategory.includes('restaurant') || lowerCaseCategory.includes('food') || lowerCaseCategory.includes('dining')) return <UtensilsCrossed {...iconProps} />;
  if (lowerCaseCategory.includes('theatre') || lowerCaseCategory.includes('show')) return <Drama {...iconProps} />;
  if (lowerCaseCategory.includes('movie') || lowerCaseCategory.includes('cinema')) return <Clapperboard {...iconProps} />;
  if (lowerCaseCategory.includes('music') || lowerCaseCategory.includes('concert')) return <Music {...iconProps} />;
  if (lowerCaseCategory.includes('art') || lowerCaseCategory.includes('gallery')) return <Brush {...iconProps} />;
  if (lowerCaseCategory.includes('architecture') || lowerCaseCategory.includes('building')) return <Building {...iconProps} />;
  if (lowerCaseCategory.includes('cafe') || lowerCaseCategory.includes('coffee')) return <Coffee {...iconProps} />;
  if (lowerCaseCategory.includes('shop') || lowerCaseCategory.includes('market') || lowerCaseCategory.includes('shopping')) return <ShoppingCart {...iconProps} />;
  if (lowerCaseCategory.includes('point of interest')) return <MapPin {...iconProps} />;
  
  return <Star {...iconProps} />;
};
