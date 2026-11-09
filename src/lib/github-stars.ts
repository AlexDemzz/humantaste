export const fetchRepoStars = async (
  repo: string,
  token?: string
): Promise<number> => {
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "humantaste",
      ...(token && { authorization: `Bearer ${token}` }),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status}`);
  }
  const { stargazers_count: stars } = (await response.json()) as {
    stargazers_count: number;
  };
  return stars;
};
