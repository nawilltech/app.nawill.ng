export function ErrorAlert({ message }: { message: string }) {
  return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>;
}

export function SuccessAlert({ message }: { message: string }) {
  return <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>;
}

export function InfoAlert({ message }: { message: string }) {
  return <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</p>;
}
