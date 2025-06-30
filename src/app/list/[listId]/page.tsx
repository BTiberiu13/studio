
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getSavedList, saveItinerary } from '@/lib/firestore';
import type { SavedListData, ItineraryItem, GeneratedItinerary } from '@/types';
import { getCategoryIcon } from '@/lib/icons';
import { handleGenerateItinerary } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, ClipboardList, MapPin, Sparkles, Loader2, Clock, AlignLeft, RefreshCw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

export default function ListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const listId = pathname.split('/').pop() || '';
  const { toast } = useToast();

  const [listData, setListData] = useState<SavedListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);

  useEffect(() => {
    if (user && listId) {
      setIsLoading(true);
      getSavedList(user.uid, listId)
        .then(data => {
          if (data) {
            setListData(data);
            // Check if there's a stored itinerary to load
            try {
              const storedState = localStorage.getItem("wanderTestItineraryState");
              if (storedState) {
                const { listId: storedListId, itinerary } = JSON.parse(storedState);
                if (storedListId === listId) {
                  setGeneratedItinerary(itinerary);
                }
                localStorage.removeItem("wanderTestItineraryState");
              }
            } catch (e) {
              console.error("Failed to load itinerary state from localStorage", e);
            }
          } else {
            setError('List not found.');
          }
        })
        .catch(err => {
          console.error('Error fetching list:', err);
          setError('Failed to fetch the list.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!user) {
        setIsLoading(false);
        setError("You must be signed in to view a saved list.");
    }
  }, [user, listId]);
  
  const handleEditList = () => {
    if (listData) {
      try {
        const stateToSave = {
            itinerary: listData.itinerary,
            searchResults: listData.searchResults,
            timeframe: listData.timeframe,
        };
        localStorage.setItem("wanderTestCurrentState", JSON.stringify(stateToSave));
        if (generatedItinerary) {
            localStorage.setItem("wanderTestItineraryState", JSON.stringify({ listId, itinerary: generatedItinerary }));
        }
        router.push('/');
      } catch (error) {
        console.error("Failed to save list state to localStorage", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not prepare list for editing.",
        });
      }
    }
  };

  const onGenerateItinerary = async () => {
    if (!listData || !listData.itinerary.length || !listData.timeframe) {
      toast({
        variant: "destructive",
        title: "Cannot Generate Itinerary",
        description: "The list must contain items and have a saved timeframe to generate an itinerary.",
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedItinerary(null);

    const input = {
      itineraryJson: JSON.stringify(listData.itinerary),
      timeframe: listData.timeframe,
    }

    const result = await handleGenerateItinerary(input);

    if (result.error || !result.data) {
       toast({
        variant: "destructive",
        title: "Generation Failed",
        description: result.error || "An unknown error occurred.",
      });
    } else {
      setGeneratedItinerary(result.data);
      toast({
        title: "Itinerary Generated!",
        description: "Your daily plan is ready.",
      });
    }

    setIsGenerating(false);
  }

  const onSaveItinerary = async () => {
    if (!user || !generatedItinerary || !listData) return;

    setIsSaving(true);
    try {
      const docRef = await saveItinerary(user.uid, listData.name, generatedItinerary);
      toast({
        title: "Itinerary Saved!",
        description: `"${listData.name}" has been saved to your itineraries.`,
      });
      router.push(`/itinerary/${docRef.id}`);
    } catch (error) {
      console.error("Itinerary saving failed:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "An error occurred while saving the itinerary. Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
       <div className="min-h-screen bg-background text-foreground font-body">
         <header className="bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Button variant="ghost" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft />
                        Back to Search
                    </Link>
                </Button>
                <Skeleton className="h-8 w-36" />
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="icon" title="Create Itinerary" disabled>
                        <Sparkles className="h-4 w-4"/>
                    </Button>
                    <Button variant="secondary" size="icon" title="Edit List" disabled>
                        <Edit className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
             <div className="text-center py-24 text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <h2 className="mt-4 text-xl font-semibold">Loading Your List...</h2>
                <p className="mt-2">Just a moment while we fetch the details.</p>
            </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive">{error}</h1>
            <Button asChild className="mt-4">
                <Link href="/">Go Back Home</Link>
            </Button>
        </div>
    );
  }

  if (!listData) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
            <h1 className="text-2xl font-bold">List not found</h1>
            <Button asChild className="mt-4">
                <Link href="/">Go Back Home</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
         <header className="bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
                <Link href="/" className="flex items-center gap-2">
                    <ArrowLeft />
                    Back to Search
                </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold font-headline truncate px-4">
                {listData.name}
            </h1>
            <div className="flex items-center gap-2">
                 <Button onClick={onGenerateItinerary} variant="secondary" disabled={isGenerating || listData.itinerary.length === 0 || !listData.timeframe}>
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    <span>Generate Itinerary</span>
                 </Button>
                <Button onClick={handleEditList} variant="secondary" size="icon" title="Edit List">
                    <Edit className="h-4 w-4"/>
                </Button>
            </div>
            </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {generatedItinerary ? (
           <Card className="animate-in fade-in-50">
             <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">Your Generated Itinerary</CardTitle>
                <CardDescription>Here's your day-by-day plan. You can regenerate it or save it.</CardDescription>
             </CardHeader>
             <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
                {generatedItinerary.dailyPlans.map(plan => (
                    <AccordionItem value={`day-${plan.day}`} key={plan.day}>
                    <AccordionTrigger className="text-xl font-semibold">
                        Day {plan.day}: {plan.date}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-4">
                        {plan.activities.map(activity => (
                        <Card key={activity.title} className="overflow-hidden">
                            <CardHeader>
                                <CardTitle>{activity.title}</CardTitle>
                                {activity.address && (
                                <CardDescription className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{activity.address}</span>
                                </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{activity.startTime} - {activity.endTime}</span>
                                </div>
                                <p className="text-foreground/80 flex items-start gap-2">
                                    <AlignLeft className="h-4 w-4 mt-1 flex-shrink-0" />
                                    <span>{activity.description}</span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    {getCategoryIcon(activity.category)}
                                    <span>{activity.category}</span>
                                </Badge>
                            </CardFooter>
                        </Card>
                        ))}
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
             </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onGenerateItinerary} disabled={isGenerating || isSaving}>
                    {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    Try Again
                </Button>
                <Button onClick={onSaveItinerary} disabled={isSaving || isGenerating}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save My Plan
                </Button>
             </CardFooter>
           </Card>
        ) : listData.itinerary.length > 0 ? (
          <div className="space-y-6">
            {listData.itinerary.map((item: ItineraryItem) => (
                <Card key={item.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card">
                    <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                        {item.address && (
                        <CardDescription className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                        </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-foreground/80">{item.description}</p>
                    </CardContent>
                    <CardFooter>
                       <Badge variant="secondary" className="flex items-center gap-1">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                       </Badge>
                    </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
            <div className="text-center py-24 text-muted-foreground bg-card rounded-lg border border-dashed">
                <ClipboardList className="mx-auto h-12 w-12" />
                <h2 className="mt-4 text-xl font-semibold">Your to-do list is empty</h2>
                <p className="mt-2">This saved list doesn't have any items in it yet. Edit the list to add some!</p>
            </div>
        )}
      </main>
    </div>
  );
}
