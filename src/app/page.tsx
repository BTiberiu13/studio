
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { handleSearch, type SearchActionInput } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { Attraction, ItineraryItem, SavedList, SavedListData } from "@/types";
import { useAuth } from "@/context/auth-context";
import { getSavedLists, saveList, deleteList as deleteListFromDB, updateList } from "@/lib/firestore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { SearchForm } from "@/components/search-form";
import { AttractionCard } from "@/components/attraction-card";
import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Trash2, X, Pilcrow, Map, ListFilter, Lightbulb, Save, BookMarked, User as UserIcon, LogOut } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

export default function Home() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<Attraction[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [savedLists, setSavedLists] = useState<SavedListData[]>([]);
  const [isFetchingLists, setIsFetchingLists] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedListToReplace, setSelectedListToReplace] = useState("");
  const [saveDialogActiveTab, setSaveDialogActiveTab] = useState("new");
  const { toast } = useToast();

  const handleReset = () => {
    setSearchResults([]);
    setItinerary([]);
    setSelectedCategory("All");
    try {
      localStorage.removeItem("wanderTestCurrentState");
    } catch (error) {
      console.error("Failed to clear current state from localStorage", error);
    }
  };

  useEffect(() => {
    try {
      const currentStateData = localStorage.getItem("wanderTestCurrentState");
      if (currentStateData) {
        const { itinerary, searchResults } = JSON.parse(currentStateData);
        setItinerary(itinerary || []);
        setSearchResults(searchResults || []);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wanderTestCurrentState", JSON.stringify({ itinerary, searchResults }));
    } catch (error) {
      console.error("Failed to save current state to localStorage", error);
    }
  }, [itinerary, searchResults]);

  useEffect(() => {
    if (user) {
      setIsFetchingLists(true);
      getSavedLists(user.uid)
        .then(lists => {
          setSavedLists(lists);
        })
        .catch(error => {
          console.error("Error fetching saved lists:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch your saved lists.",
          });
        })
        .finally(() => {
          setIsFetchingLists(false);
        });
    } else {
      setSavedLists([]);
    }
  }, [user, toast]);

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

  const handleSaveNewList = async () => {
    if (!user) {
        setIsAuthDialogOpen(true);
        return;
    };
    const trimmedListName = newListName.trim();
    if (!trimmedListName) {
      toast({ variant: "destructive", title: "Invalid Name", description: "Please enter a name for your list." });
      return;
    }
    const existingList = savedLists.find(list => list.name === trimmedListName);
    if (existingList) {
      toast({ 
        variant: "destructive", 
        title: "Name Already Exists", 
        description: `A list named "${trimmedListName}" already exists. Please use a different name or replace the existing list.` 
      });
      return;
    }
    const newList: SavedList = { itinerary, searchResults };
    try {
      const savedDoc = await saveList(user.uid, trimmedListName, newList);
      setSavedLists(prev => [...prev, { id: savedDoc.id, name: trimmedListName, ...newList }]);
      toast({ title: "List Saved!", description: `Your to-do list "${trimmedListName}" has been saved.` });
      setIsSaveDialogOpen(false);
      setNewListName("");
    } catch (error) {
      console.error("Error saving list:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your list." });
    }
  };

  const handleReplaceList = async () => {
    if (!user || !selectedListToReplace) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a list to replace." });
      return;
    }
    const listToUpdate = savedLists.find(l => l.id === selectedListToReplace);
    if (!listToUpdate) return;

    const newListData: SavedList = { itinerary, searchResults };
    try {
      await updateList(user.uid, listToUpdate.id, listToUpdate.name, newListData);
      setSavedLists(prev => prev.map(l => l.id === listToUpdate.id ? { ...l, ...newListData } : l));
      toast({ title: "List Replaced", description: `List "${listToUpdate.name}" has been updated.` });
      
      setIsSaveDialogOpen(false);
      setNewListName("");
      setSelectedListToReplace("");
    } catch (error) {
      console.error("Error replacing list:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the list." });
    }
  };

  const handleLoadList = (listId: string) => {
    const listToLoad = savedLists.find(l => l.id === listId);
    if (listToLoad) {
      setItinerary(listToLoad.itinerary);
      setSearchResults(listToLoad.searchResults);
      setSelectedCategory("All");
      toast({ title: "List Loaded", description: `"${listToLoad.name}" is now your active to-do list.` });
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    const listName = savedLists.find(l => l.id === listId)?.name || "The list";
    try {
      await deleteListFromDB(user.uid, listId);
      setSavedLists(prev => prev.filter(l => l.id !== listId));
      toast({ title: "List Deleted", description: `"${listName}" has been deleted.` });
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the list." });
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
        toast({ variant: "destructive", title: "Sign Out Failed", description: "Firebase is not configured." });
        return;
    }
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      console.error("Sign out error", error);
      toast({ variant: "destructive", title: "Sign Out Failed", description: "There was a problem signing you out." });
    }
  }

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
          <Link href="/" onClick={handleReset} className="flex items-center gap-2 no-underline text-primary-foreground">
            <Map className="h-8 w-8" />
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
              WanderTest
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!user && !isFetchingLists} onClick={() => { if (!user) setIsAuthDialogOpen(true)}}>
                  <BookMarked />
                  My Saved Lists
                  {user && <Badge className="ml-2">{savedLists.length}</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Your Lists</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isFetchingLists ? (
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : savedLists.length > 0 ? (
                  savedLists.map(list => (
                    <DropdownMenuItem key={list.id} className="flex justify-between items-center" onSelect={(e) => e.preventDefault()}>
                      <button className="flex-grow text-left truncate pr-2" onClick={() => handleLoadList(list.id)}>
                        {list.name}
                      </button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleDeleteList(list.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No saved lists yet.</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <UserIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Signed in as</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => setIsAuthDialogOpen(true)}>Sign In</Button>
            )}
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
                   <Button
                     variant="outline"
                     onClick={() => user ? setIsSaveDialogOpen(true) : setIsAuthDialogOpen(true)}
                     className="w-full"
                   >
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

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      <Dialog open={isSaveDialogOpen} onOpenChange={(open) => {
        setIsSaveDialogOpen(open);
        if (!open) {
          setNewListName("");
          setSelectedListToReplace("");
          setSaveDialogActiveTab("new");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your To-Do List</DialogTitle>
            <DialogDescription>
              You can save the current list as a new one, or replace an existing list.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="new" className="w-full pt-4" value={saveDialogActiveTab} onValueChange={setSaveDialogActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Save as New</TabsTrigger>
              <TabsTrigger value="replace" disabled={savedLists.length === 0}>Replace Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">New List Name</Label>
                <Input
                  id="name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Japan Trip Summer '24"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNewList()}
                />
              </div>
            </TabsContent>
            <TabsContent value="replace" className="pt-4 space-y-4">
               <div className="space-y-2">
                <Label htmlFor="replace-select">Select a list to replace</Label>
                <Select onValueChange={setSelectedListToReplace} value={selectedListToReplace}>
                  <SelectTrigger id="replace-select" className="w-full">
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedLists.map(list => (
                      <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            {saveDialogActiveTab === 'new' ? (
              <Button onClick={handleSaveNewList}>Save New List</Button>
            ) : (
              <Button onClick={handleReplaceList} disabled={!selectedListToReplace}>Replace Selected List</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
