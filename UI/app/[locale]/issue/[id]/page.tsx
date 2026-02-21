interface IssueDetailPageProps {
  params: {
    locale: string
    id: string
  }
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">
        Issue detail page for ID {params.id} will be implemented in a later task.
      </p>
    </div>
  )
}

