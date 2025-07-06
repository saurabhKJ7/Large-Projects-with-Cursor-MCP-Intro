import { useQuery } from '@tanstack/react-query'
import { tickets } from '@/lib/api'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { format } from 'date-fns'
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

export default function TicketsPage() {
  const { data: ticketsList, isLoading } = useQuery<Ticket[]>(['tickets'], tickets.list)

  if (isLoading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900">Tickets</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all support tickets in your account.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              href="/tickets/new"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create ticket
            </Link>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {ticketsList?.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link href={`/tickets/${ticket.id}`} className="hover:text-indigo-600">
                            {ticket.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {ticket.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <TicketStatus status={ticket.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 