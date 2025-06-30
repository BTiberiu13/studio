
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getSavedList } from '@/lib/firestore';
import type { SavedListData, ItineraryItem } from '@/types';
import { getCategoryIcon } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, ClipboardList } from 'lucide-react';

export default function ListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const [listData, setListData] = useState<SavedListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && listId) {
      setIsLoading(true);
      getSavedList(user.uid, listId)
        .then(data => {
          if (data) {
            setListData(data);
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
        localStorage.setItem("wanderTestCurrentState", JSON.stringify({
            itinerary: listData.itinerary,
            searchResults: listData.searchResults
        }));
        router.push('/');
      } catch (error) {
        console.error("Failed to save list state to localStorage", error);
      }
    }
  };

  if (isLoading) {
    return (
       <div className="min-h-screen bg-background text-foreground font-body">
         <header className="bg-primary/95 text-primary-foreground shadow-lg backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-28" />
            </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <Skeleton className="h-[60vh] w-full" />
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
            <Button onClick={handleEditList} variant="secondary" size="icon" title="Edit List">
                <Edit className="h-4 w-4"/>
            </Button>
            </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><ClipboardList /> To-Do List</span>
                    <Badge>{listData.itinerary.length}</Badge>
                    </CardTitle>
                    <CardDescription>The items from your saved to-do list.</CardDescription>
                </CardHeader>
                <CardContent>
                    {listData.itinerary.length > 0 ? (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {listData.itinerary.map((item: ItineraryItem) => (
                        <Card key={item.id} className="flex items-center p-3 gap-3">
                            <div className="text-accent flex-shrink-0">{getCategoryIcon(item.category)}</div>
                            <div className="flex-grow min-w-0">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                        </Card>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                        <p>Your to-do list was empty.</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
