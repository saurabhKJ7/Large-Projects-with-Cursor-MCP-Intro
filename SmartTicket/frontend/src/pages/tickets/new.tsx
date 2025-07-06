import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { tickets } from '@/lib/api'
import Layout from '@/components/Layout'
import { CreateTicketDto } from '@/types'

export default function NewTicket() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTicketDto>()
  
  const mutation = useMutation({
    mutationFn: tickets.create,
    onSuccess: () => {
      router.push('/tickets')
    },
  })

  const onSubmit = (data: CreateTicketDto) => {
    mutation.mutate(data)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Create New Ticket</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Describe your issue and we'll help you resolve it.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                    Title
                  </label>
                  <div className="mt-2">
                    <input
                      {...register('title', { required: true })}
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Brief description of your issue"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">Title is required</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                    Description
                  </label>
                  <div className="mt-2">
                    <textarea
                      {...register('description', { required: true })}
                      id="description"
                      name="description"
                      rows={4}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Detailed description of your issue"
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600">Description is required</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-sm font-semibold leading-6 text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {mutation.isLoading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
} 