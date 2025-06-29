"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

const formSchema = z.object({
  location: z.string().min(1, "Location is required.").max(100),
  timeframe: z.string().min(1, "Timeframe is required.").max(50),
  interests: z.string().max(200).optional(),
});

type SearchFormProps = {
  onSearch: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "Kyoto, Japan",
      timeframe: "Next spring",
      interests: "Temples, traditional gardens, and local cuisine",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Your Next Adventure</CardTitle>
        <CardDescription>
          Tell us where and when you're going, and we'll find the best spots for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paris, France" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeframe</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., This weekend, next July" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., history, outdoor activities, macarons"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              <span>{isLoading ? "Searching..." : "Deep Search"}</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
