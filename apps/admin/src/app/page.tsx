export default function AdminDashboard() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dhanam Admin</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
          <p className="text-yellow-800 font-semibold mb-2">
            This app is deprecated.
          </p>
          <p className="text-yellow-700">
            All admin functionality has been implemented in the main web app at{' '}
            <code className="bg-yellow-100 px-1 rounded">apps/web/(admin)/admin/</code>.
            This standalone admin app should not receive new development.
          </p>
        </div>
      </div>
    </main>
  );
}
