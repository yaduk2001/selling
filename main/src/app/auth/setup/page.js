'use client';

export default function AuthSetupPage() {
  const envVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-white">
              Supabase Authentication Setup
            </h1>
            <p className="mt-2 text-gray-400">
              Check your Supabase configuration and test authentication functionality.
            </p>
          </div>
          
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Environment Variables
            </h2>
            
            <div className="space-y-4">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <code className="text-sm font-mono text-white">
                      {envVar.name}
                    </code>
                  </div>
                  <div>
                    {envVar.value ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Set
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        ✗ Missing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-white mb-4">
                Quick Setup Guide
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                  <li>Create a new project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-yellow-400 hover:underline">supabase.com</a></li>
                  <li>Go to Settings → API to find your Project URL and anon key</li>
                  <li>Add these to your <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">.env.local</code> file:</li>
                </ol>
                
                <pre className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
                </pre>
                
                <ol start="4" className="list-decimal list-inside space-y-2 text-sm text-gray-400 mt-4">
                  <li>Enable Email authentication in Authentication → Settings</li>
                  <li>Configure your site URL and redirect URLs</li>
                  <li>Test the authentication by signing up a new user</li>
                </ol>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <a
                href="/auth/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Signup
              </a>
              <a
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
