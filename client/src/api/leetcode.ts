import axios from 'axios';

const leetcodeClient = axios.create({
  baseURL: 'https://alfa-leetcode-api.onrender.com',
  timeout: 8000,
});

export interface RemoteProblem {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTags?: Array<{ name: string }>;
}

export interface RemoteProblemDetail {
  questionId: string;
  questionFrontendId: string;
  questionTitle: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
  question?: string;
}

export const searchProblems = async (query: string): Promise<RemoteProblem[]> => {
  if (!query) {
    return [];
  }

  try {
    const response = await leetcodeClient.get<{ problemsetQuestionList: RemoteProblem[] }>('/problems', {
      params: {
        limit: 100,
      },
    });

    const normalized = query.trim().toLowerCase();
    const byId = Number.parseInt(normalized, 10);

    return (response.data.problemsetQuestionList ?? []).filter((problem) => {
      const matchesId = Number.isFinite(byId) && Number(problem.questionFrontendId) === byId;
      const matchesTitle = problem.title.toLowerCase().includes(normalized);
      const matchesSlug = problem.titleSlug?.toLowerCase().includes(normalized);
      return matchesId || matchesTitle || matchesSlug;
    });
  } catch (error) {
    console.error('Failed to search LeetCode problems', error);
    throw new Error('Failed to search problems from LeetCode API.');
  }
};

export const fetchProblemDetail = async (titleSlug: string): Promise<RemoteProblemDetail> => {
  const response = await leetcodeClient.get<RemoteProblemDetail>(`/select`, {
    params: { titleSlug },
  });

  return response.data;
};

export default leetcodeClient;

