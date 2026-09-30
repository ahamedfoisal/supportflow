const DEFAULT_REPOSITORY = 'https://github.com/ahamedfoisal/supportflow';

export function GET() {
  const source = process.env.SOURCE_REPOSITORY_URL || DEFAULT_REPOSITORY;
  if (/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(source)) {
    return Response.redirect(source, 302);
  }
  return new Response('The configured source repository URL is invalid.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' },
  });
}
