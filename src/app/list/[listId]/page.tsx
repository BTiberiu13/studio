
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getSavedList } from '@/lib/firestore';
import type { SavedListData, ItineraryItem } from '@/types';
import { getCategoryIcon } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, ClipboardList, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const listId = pathname.split('/').pop() || '';

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
                <Button variant="ghost" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft />
                        Back to Search
                    </Link>
                </Button>
                <Skeleton className="h-8 w-36" />
                <Button onClick={handleEditList} variant="secondary" size="icon" title="Edit List" disabled>
                    <Edit className="h-4 w-4"/>
                </Button>
            </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full mt-2" />
                            <Skeleton className="h-4 w-5/6 mt-2" />
                        </CardContent>
                        <CardFooter>
                           <Skeleton className="h-6 w-24" />
                        </CardFooter>
                    </Card>
                ))}
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
        {listData.itinerary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <p className="mt-2">This saved list doesn't have any items in it yet.</p>
            </div>
        )}
      </main>
    </div>
  );
}
