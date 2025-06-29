
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Trash2, X, Pilcrow, Map, ListFilter, Lightbulb, Save, BookMarked } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

type SavedList = {
  itinerary: ItineraryItem[];
  searchResults: Attraction[];
};

export default function Home() {
  const [searchResults, setSearchResults] = useState<Attraction[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [savedLists, setSavedLists] = useState<{ [name: string]: SavedList }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isConfirmReplaceDialogOpen, setIsConfirmReplaceDialogOpen] = useState(false);
  const [listToReplace, setListToReplace] = useState("");
  const [selectedListToReplace, setSelectedListToReplace] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    try {
      const currentStateData = localStorage.getItem("wanderTestCurrentState");
      if (currentStateData) {
        const { itinerary, searchResults } = JSON.parse(currentStateData);
        setItinerary(itinerary || []);
        setSearchResults(searchResults || []);
      }
      const savedListsData = localStorage.getItem("wanderTestSavedLists");
      if (savedListsData) {
        setSavedLists(JSON.parse(savedListsData));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load your saved data.",
      });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem("wanderTestCurrentState", JSON.stringify({ itinerary, searchResults }));
    } catch (error) {
      console.error("Failed to save current state to localStorage", error);
    }
  }, [itinerary, searchResults]);

  const onSearch = async (data: SearchActionInput) => {
    setIsLoading(true);
    setSearchResults([]);
    setItinerary([]);
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
  };

  const addToItinerary = (item: Attraction) => {
    if (itinerary.some(i => i.title === item.title)) {
      toast({ title: "Already on to-do list", description: `${item.title} is already on your list.` });
      return;
    }
    const newItineraryItem = { ...item, id: `${item.title}-${Date.now()}` };
    updateItinerary([...itinerary, newItineraryItem]);
    toast({
      title: "Added to to-do list",
      description: `${item.title} has been added.`,
    });
  };

  const removeFromItinerary = (id: string) => {
    const removedItem = itinerary.find(item => item.id === id);
    if(removedItem) {
      updateItinerary(itinerary.filter(item => item.id !== id));
      toast({
        title: "Removed from to-do list",
        description: `${removedItem.title} has been removed.`,
      });
    }
  };

  const clearItinerary = () => {
    updateItinerary([]);
    toast({
      title: "To-do list Cleared",
    });
  };
  
  const updateSavedLists = (newSavedLists: { [name: string]: SavedList }) => {
    setSavedLists(newSavedLists);
    try {
      localStorage.setItem("wanderTestSavedLists", JSON.stringify(newSavedLists));
    } catch (error) {
      console.error("Failed to save lists to localStorage", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not update your saved lists.",
      });
    }
  };

  const handleSaveList = () => {
    const trimmedListName = newListName.trim();
    if (!trimmedListName) {
      toast({ variant: "destructive", title: "Invalid Name", description: "Please enter a name for your list." });
      return;
    }
    if (savedLists[trimmedListName]) {
      setListToReplace(trimmedListName);
      setIsConfirmReplaceDialogOpen(true);
      return;
    }
    const newList: SavedList = { itinerary, searchResults };
    const newSavedLists = { ...savedLists, [trimmedListName]: newList };
    updateSavedLists(newSavedLists);
    toast({ title: "List Saved!", description: `Your to-do list "${trimmedListName}" has been saved.` });
    setIsSaveDialogOpen(false);
    setNewListName("");
  };

  const handleConfirmReplace = () => {
    const newList: SavedList = { itinerary, searchResults };
    const newSavedLists = { ...savedLists, [listToReplace]: newList };
    updateSavedLists(newSavedLists);
    toast({ title: "List Replaced", description: `List "${listToReplace}" has been updated.` });
    
    setIsConfirmReplaceDialogOpen(false);
    setIsSaveDialogOpen(false);
    setNewListName("");
    setListToReplace("");
  };

  const handleReplaceList = () => {
    if (!selectedListToReplace) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select a list to replace.",
      });
      return;
    }
    const newList: SavedList = { itinerary, searchResults };
    const newSavedLists = { ...savedLists, [selectedListToReplace]: newList };
    updateSavedLists(newSavedLists);
    toast({ title: "List Replaced", description: `List "${selectedListToReplace}" has been updated.` });
    setIsSaveDialogOpen(false);
    setNewListName("");
    setSelectedListToReplace("");
  };

  const handleLoadList = (listName: string) => {
    const listToLoad = savedLists[listName];
    if (listToLoad) {
      setItinerary(listToLoad.itinerary);
      setSearchResults(listToLoad.searchResults);
      setSelectedCategory("All");
      toast({ title: "List Loaded", description: `"${listName}" is now your active to-do list.` });
    }
  };

  const handleDeleteList = (listName: string) => {
    const newSavedLists = { ...savedLists };
    delete newSavedLists[listName];
    updateSavedLists(newSavedLists);
    toast({ title: "List Deleted", description: `"${listName}" has been deleted.` });
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
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <BookMarked />
                  My Saved Lists
                  <Badge className="ml-2">{Object.keys(savedLists).length}</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Your Lists</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(savedLists).length > 0 ? (
                  Object.keys(savedLists).map(listName => (
                    <DropdownMenuItem key={listName} className="flex justify-between items-center" onSelect={(e) => e.preventDefault()}>
                      <button className="flex-grow text-left" onClick={() => handleLoadList(listName)}>
                        {listName}
                      </button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteList(listName)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No saved lists yet.</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <span className="flex items-center gap-2"><ClipboardList /> My to do list</span>
                  <Badge>{itinerary.length}</Badge>
                </CardTitle>
                <CardDescription>The items on your to-do list.</CardDescription>
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
                    <p>Your to-do list is empty.</p>
                    <p className="text-sm">Add items from the search results.</p>
                  </div>
                )}
              </CardContent>
              {itinerary.length > 0 && (
                 <CardFooter className="flex flex-col sm:flex-row gap-2">
                   <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)} className="w-full">
                     <Save />
                     Save List
                   </Button>
                   <Button variant="destructive" onClick={clearItinerary} className="w-full">
                     <Trash2 />
                     <span>Clear to-do list</span>
                   </Button>
                 </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Dialog open={isSaveDialogOpen} onOpenChange={(open) => {
        setIsSaveDialogOpen(open)
        if (!open) {
          setNewListName("");
          setSelectedListToReplace("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your To-Do List</DialogTitle>
            <DialogDescription>
              You can save the current list as a new one, or replace an existing list.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="new" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Save as New</TabsTrigger>
              <TabsTrigger value="replace" disabled={Object.keys(savedLists).length === 0}>Replace Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">New List Name</Label>
                <Input
                  id="name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Japan Trip Summer '24"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveList()}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button onClick={handleSaveList}>Save New List</Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="replace" className="pt-4">
               <div className="space-y-2">
                <Label htmlFor="replace-select">Select a list to replace</Label>
                <Select onValueChange={setSelectedListToReplace} value={selectedListToReplace}>
                  <SelectTrigger id="replace-select" className="w-full">
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(savedLists).map(listName => (
                      <SelectItem key={listName} value={listName}>{listName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button onClick={handleReplaceList} disabled={!selectedListToReplace}>Replace Selected List</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmReplaceDialogOpen} onOpenChange={(open) => {
        setIsConfirmReplaceDialogOpen(open)
        if (!open) {
          setListToReplace("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace List?</AlertDialogTitle>
            <AlertDialogDescription>
              A list named "{listToReplace}" already exists. Do you want to replace it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>Replace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
