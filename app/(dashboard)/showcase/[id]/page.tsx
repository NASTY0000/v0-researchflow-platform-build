import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default async function ShowcaseEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: entry } = await supabase
    .from("showcase_entries")
    .select("*")
    .eq("id", id)
    .in("status", ["published", "featured"])
    .maybeSingle()

  if (!entry) notFound()

  const { data: author } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", entry.author_id as string)
    .maybeSingle()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/research-showcase" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to showcase
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{entry.research_area}</Badge>
            <Badge variant="outline">{entry.status}</Badge>
          </div>
          <CardTitle className="text-2xl font-heading">{entry.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {author?.full_name || "Author"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.abstract}</p>
          {entry.content && (
            <div className="prose prose-invert max-w-none text-sm">
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
