import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
  
export default function ThreadView() {
  const { segment } = useParams()
  const [params] = useSearchParams()
  const search = params.toString() ? `?${params.toString()}` : ''

  return (
    <div className="flex h-full flex-col items-start gap-4 p-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to={`/app/inbox/${segment}${search}`} />}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to list
      </Button>
      <p className="text-sm text-muted-foreground">
        The conversation view is built in the next step.
      </p>
    </div>
  )
}
