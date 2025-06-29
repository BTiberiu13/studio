
"use client";

import { useState, useEffect, useMemo } from "react";
import { handleSearch, type SearchActionInput } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { Attraction, ItineraryItem } from "@/types";

import { SearchForm } from "@/components/search-form";
import { AttractionCard } from "@/components/attraction-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Trash2, X, Pilcrow, Map, ListFilter, Lightbulb } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

export default function Home() {
  const [searchResults, setSearchResults] = useState<Attraction[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedItinerary = localStorage.getItem("wanderTestItinerary");
      if (savedItinerary) {
        setItinerary(JSON.parse(savedItinerary));
      }
    } catch (error) {
      console.error("Failed to load itinerary from localStorage", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your saved itinerary.",
      });
    }
  }, [toast]);

  const onSearch = async (data: SearchActionInput) => {
    setIsLoading(true);
    setSearchResults([]);
    setSelectedCategory("All");
    const result = await handleSearch(data);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: result.error,
      });
    } else if (result.data) {
      setSearchResults(result.data.results);
      if (result.data.results.length === 0) {
        toast({
          title: "No results found",
          description: "Try broadening your search criteria.",
        });
      } else {
        toast({
          title: "Search Complete!",
          description: `Found ${result.data.results.length} amazing spots for you.`,
        });
      }
    }
  };

  const updateItinerary = (newItinerary: ItineraryItem[]) => {
    setItinerary(newItinerary);
    try {
      localStorage.setItem("wanderTestItinerary", JSON.stringify(newItinerary));
    } catch (error) {
      console.error("Failed to save itinerary to localStorage", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not update your itinerary.",
      });
    }
  };

  const addToItinerary = (item: Attraction) => {
    if (itinerary.some(i => i.title === item.title)) {
      toast({ title: "Already in Itinerary", description: `${item.title} is already on your list.` });
      return;
    }
    const newItineraryItem = { ...item, id: `${item.title}-${Date.now()}` };
    updateItinerary([...itinerary, newItineraryItem]);
    toast({
      title: "Added to Itinerary",
      description: `${item.title} has been added.`,
    });
  };

  const removeFromItinerary = (id: string) => {
    const removedItem = itinerary.find(item => item.id === id);
    if(removedItem) {
      updateItinerary(itinerary.filter(item => item.id !== id));
      toast({
        title: "Removed from Itinerary",
        description: `${removedItem.title} has been removed.`,
      });
    }
  };

  const clearItinerary = () => {
    updateItinerary([]);
    toast({
      title: "Itinerary Cleared",
    });
  };

  const categories = useMemo(() => {
    if (searchResults.length === 0) return [];
    const allCategories = searchResults.map(r => r.category);
    return ["All", ...Array.from(new Set(allCategories))];
  }, [searchResults]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === "All") return searchResults;
    return searchResults.filter(r => r.category === selectedCategory);
  }, [searchResults, selectedCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Map className="h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
              WanderTest
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-2 xl:col-span-3 space-y-8">
            <SearchForm onSearch={onSearch} isLoading={isLoading} />
            
            {categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListFilter /> Filter by Category</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "secondary"}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {getCategoryIcon(category)}
                      {category}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
                <Lightbulb /> Search Results
              </h2>
              <Separator className="mb-6" />
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                      <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                      <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                  ))}
                </div>
              )}
              {!isLoading && filteredResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in-50">
                  {filteredResults.map((item, index) => (
                    <AttractionCard
                      key={`${item.title}-${index}`}
                      attraction={item}
                      onAddItem={addToItinerary}
                      isAdded={itinerary.some(i => i.title === item.title)}
                    />
                  ))}
                </div>
              )}
              {!isLoading && searchResults.length > 0 && filteredResults.length === 0 && (
                 <div className="text-center py-16 text-muted-foreground">
                    <p>No results for "{selectedCategory}". Try another category.</p>
                 </div>
              )}
               {!isLoading && searchResults.length === 0 && (
                 <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                    <Pilcrow className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">Your journey begins here</h3>
                    <p className="mt-1">Use the search to find amazing places.</p>
                 </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 xl:col-span-1 lg:sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><ClipboardList /> My Itinerary</span>
                  <Badge>{itinerary.length}</Badge>
                </CardTitle>
                <CardDescription>The places you want to visit.</CardDescription>
              </CardHeader>
              <CardContent>
                {itinerary.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {itinerary.map(item => (
                      <Card key={item.id} className="flex items-center p-3 gap-3 animate-in fade-in-0">
                        <div className="text-accent flex-shrink-0">{getCategoryIcon(item.category)}</div>
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold truncate">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => removeFromItinerary(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                    <p>Your itinerary is empty.</p>
                    <p className="text-sm">Add items from the search results.</p>
                  </div>
                )}
              </CardContent>
              {itinerary.length > 0 && (
                 <CardFooter>
                   <Button variant="destructive" onClick={clearItinerary} className="w-full">
                     <Trash2 />
                     <span>Clear Itinerary</span>
                   </Button>
                 </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
