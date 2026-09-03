export function getBitbucketStatus(): {
  authenticated: boolean;
  authDetail: string;
} {
  const hasAppPassword = Boolean(process.env.BITBUCKET_APP_PASSWORD);
  return {
    authenticated: hasAppPassword,
    authDetail: hasAppPassword
      ? 'Configured via BITBUCKET_APP_PASSWORD in environment'
      : 'Set BITBUCKET_APP_PASSWORD and BITBUCKET_USERNAME in .env to automate Bitbucket',
  };
}
