
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Place } from "@/types";
import { getCategoryIcon } from "@/lib/icons";
import { PlusCircle, CheckCircle, Star, Globe } from "lucide-react";

type AttractionCardProps = {
  attraction: Place;
  onAddItem: (item: Place) => void;
  isAdded: boolean;
};

const StarRating = ({ rating = 0, totalRatings = 0 }: { rating?: number, totalRatings?: number }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
  
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <div className="flex items-center text-amber-500">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={`full-${i}`} className="h-4 w-4 fill-current" />
          ))}
          {halfStar === 1 && <Star key="half" className="h-4 w-4 fill-current" />}
          {[...Array(emptyStars)].map((_, i) => (
            <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300 fill-current" />
          ))}
        </div>
        <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
        <span className="text-xs">({totalRatings})</span>
      </div>
    );
};

export function AttractionCard({ attraction, onAddItem, isAdded }: AttractionCardProps) {
  const { title, description, category, address, photoUrl, rating, userRatingsTotal, website } = attraction;

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardHeader>
        {photoUrl ? (
          <div className="relative h-40 w-full mb-4 rounded-md overflow-hidden">
            <Image src={photoUrl} alt={title} fill style={{ objectFit: 'cover' }} />
          </div>
        ) : (
          <div className="relative h-40 w-full mb-4 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
            {getCategoryIcon(category)}
          </div>
        )}
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0 flex items-center">
            {getCategoryIcon(category)}
            <span className="ml-1">{category}</span>
          </Badge>
        </div>
        {address && <CardDescription>{address}</CardDescription>}
        <div className="flex items-center justify-between pt-2">
            <StarRating rating={rating} totalRatings={userRatingsTotal} />
            {website && (
              <Button variant="ghost" size="sm" asChild>
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <Globe />
                  Website
                </a>
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onAddItem(attraction)}
          disabled={isAdded}
          variant={isAdded ? "outline" : "default"}
          className="w-full"
        >
          {isAdded ? <CheckCircle /> : <PlusCircle />}
          <span>{isAdded ? "Added to to-do list" : "Add to to-do list"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
