 
export default function Login() {
  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-semibold">Login</h1>
      <form className="mt-4 space-y-3">
        <input className="w-full rounded-md px-3 py-2 bg-gray-800 border border-gray-700" placeholder="Email" />
        <input className="w-full rounded-md px-3 py-2 bg-gray-800 border border-gray-700" type="password" placeholder="Password" />
        <button className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Sign in</button>
      </form>
    </div>
  );
}
