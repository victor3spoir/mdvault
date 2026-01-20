import { Octokit } from "@octokit/rest";
import getenv from "./env";

const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } = getenv();
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export const githubRepoInfo = {
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  ARTICLES_PATH: "contents/articles",
  IMAGES_PATH: "contents/images",
};

export default octokit;
