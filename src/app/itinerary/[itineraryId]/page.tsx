
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getSavedItinerary } from '@/lib/firestore';
import type { SavedItineraryData } from '@/types';
import { getCategoryIcon } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Clock, AlignLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ItineraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const itineraryId = pathname.split('/').pop() || '';

  const [itineraryData, setItineraryData] = useState<SavedItineraryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && itineraryId) {
      setIsLoading(true);
      getSavedItinerary(user.uid, itineraryId)
        .then(data => {
          if (data) {
            setItineraryData(data);
          } else {
            setError('Itinerary not found.');
          }
        })
        .catch(err => {
          console.error('Error fetching itinerary:', err);
          setError('Failed to fetch the itinerary.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!user) {
        setIsLoading(false);
        setError("You must be signed in to view a saved itinerary.");
    }
  }, [user, itineraryId]);

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
                <Skeleton className="h-8 w-48" />
                <div className="w-16"></div>
            </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-10 w-1/3 mb-6" />
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-40 w-full" />
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

  if (!itineraryData) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
            <h1 className="text-2xl font-bold">Itinerary not found</h1>
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
                    {itineraryData.name}
                </h1>
                <div className="w-16"></div>
            </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Card className="animate-in fade-in-50">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline">Your Itinerary</CardTitle>
                    <CardDescription>A day-by-day plan for your trip.</CardDescription>
                </CardHeader>
                <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
                    {itineraryData.dailyPlans.map(plan => (
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
            </Card>
        </main>
    </div>
  );
}
