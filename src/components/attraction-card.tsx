"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Attraction } from "@/types";
import { getCategoryIcon } from "@/lib/icons";
import { PlusCircle, CheckCircle } from "lucide-react";

type AttractionCardProps = {
  attraction: Attraction;
  onAddItem: (item: Attraction) => void;
  isAdded: boolean;
};

export function AttractionCard({ attraction, onAddItem, isAdded }: AttractionCardProps) {
  const { title, description, category, address } = attraction;

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0 flex items-center">
            {getCategoryIcon(category)}
            <span className="ml-1">{category}</span>
          </Badge>
        </div>
        {address && <CardDescription>{address}</CardDescription>}
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
          <span>{isAdded ? "Added to Itinerary" : "Add to Itinerary"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
