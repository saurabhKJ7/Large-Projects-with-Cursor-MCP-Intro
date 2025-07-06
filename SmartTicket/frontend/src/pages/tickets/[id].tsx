import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tickets } from '@/lib/api'
import Layout from '@/components/Layout'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { Ticket } from '@/types'

function TicketStatus({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-800',
    'auto-response': 'bg-green-100 text-green-800',
    responded: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  )
}

export default function TicketDetail() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm()

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => tickets.get(Number(id)),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: ({ content }: { content: string }) => tickets.addResponse(Number(id), content),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      reset()
    },
  })

  const onSubmit = (data: { response: string }) => {
    mutation.mutate({ content: data.response })
  }

  if (isLoading || !ticket) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{ticket.title}</h3>
              <TicketStatus status={ticket.status} />
            </div>
            <div className="mt-1 max-w-2xl text-sm text-gray-500">
              <p>Created on {format(new Date(ticket.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="prose max-w-none text-gray-900">{ticket.description}</div>
          </div>

          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-lg font-medium text-gray-900">Responses</h4>
              <div className="mt-6 space-y-6">
                {ticket.responses.map((response) => (
                  <div key={response.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {format(new Date(response.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {response.is_automated && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Automated Response
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-900">{response.content}</div>
                    {response.sources && response.sources.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-500">Sources:</h5>
                        <ul className="mt-1 list-disc list-inside text-xs text-gray-500">
                          {response.sources.map((source, index) => (
                            <li key={index}>{source.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h4 className="text-lg font-medium text-gray-900">Add Response</h4>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <div>
                <textarea
                  {...register('response', { required: true })}
                  rows={4}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Write your response..."
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {mutation.isLoading ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
} 